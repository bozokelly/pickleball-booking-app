/**
 * Supabase Edge Function: Send email for important notifications.
 * Triggered by a database webhook on public.notifications INSERT.
 *
 * Sends emails for:
 * - membership_request, new_club_message, club_message_reply, game_cancelled
 * - booking_confirmed, booking_cancelled, waitlist_promoted
 *
 * Setup:
 * 1. Deploy: supabase functions deploy send-notification-email
 * 2. Set secret: supabase secrets set RESEND_API_KEY=re_xxxxx
 * 3. Create a database webhook on public.notifications INSERT
 *    that calls this function.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EMAIL_TYPES = new Set([
  'membership_request',
  'new_club_message',
  'club_message_reply',
  'game_cancelled',
  'booking_confirmed',
  'booking_cancelled',
  'waitlist_promoted',
]);

const BOOKING_TYPES = new Set([
  'booking_confirmed',
  'booking_cancelled',
  'waitlist_promoted',
]);

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    user_id: string;
    title: string;
    body: string;
    type: string;
    reference_id: string | null;
  };
}

interface GameDetails {
  title: string;
  date_time: string;
  location: string | null;
  fee_amount: number;
  fee_currency: string;
  duration_minutes: number;
  club: { name: string; location: string | null } | null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Perth',
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildBookingConfirmedHtml(game: GameDetails, body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #16a34a; margin: 0 0 4px; font-size: 18px;">Booking Confirmed</h2>
        <p style="color: #666; margin: 0; font-size: 14px;">You're all set!</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #333;">
        <tr><td style="padding: 8px 0; color: #888; width: 100px;">Game</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(game.title)}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">When</td><td style="padding: 8px 0;">${formatDate(game.date_time)}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">Duration</td><td style="padding: 8px 0;">${game.duration_minutes} minutes</td></tr>
        ${game.location ? `<tr><td style="padding: 8px 0; color: #888;">Location</td><td style="padding: 8px 0;">${escapeHtml(game.location)}</td></tr>` : ''}
        ${game.club?.name ? `<tr><td style="padding: 8px 0; color: #888;">Club</td><td style="padding: 8px 0;">${escapeHtml(game.club.name)}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #888;">Fee</td><td style="padding: 8px 0; font-weight: 600;">${game.fee_amount > 0 ? `$${game.fee_amount.toFixed(2)}` : 'Free'}</td></tr>
      </table>
      <p style="color: #16a34a; font-size: 15px; margin-top: 20px; font-weight: 500;">See you on the court!</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">Book a Dink &mdash; bookadink.com</p>
    </div>
  `;
}

function buildBookingCancelledHtml(game: GameDetails, body: string): string {
  const isWithin24hr = body.includes('within 24 hours');
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #dc2626; margin: 0 0 4px; font-size: 18px;">Booking Cancelled</h2>
        <p style="color: #666; margin: 0; font-size: 14px;">${escapeHtml(game.title)}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #333;">
        <tr><td style="padding: 8px 0; color: #888; width: 100px;">Game</td><td style="padding: 8px 0;">${escapeHtml(game.title)}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">When</td><td style="padding: 8px 0;">${formatDate(game.date_time)}</td></tr>
        ${game.club?.name ? `<tr><td style="padding: 8px 0; color: #888;">Club</td><td style="padding: 8px 0;">${escapeHtml(game.club.name)}</td></tr>` : ''}
      </table>
      ${game.fee_amount > 0 ? `
        <div style="background: ${isWithin24hr ? '#fef9c3' : '#f0fdf4'}; border: 1px solid ${isWithin24hr ? '#fde68a' : '#bbf7d0'}; border-radius: 8px; padding: 12px; margin-top: 16px;">
          <p style="margin: 0; font-size: 13px; color: #333; font-weight: 500;">
            ${isWithin24hr
              ? 'This cancellation is within 24 hours of the game. No refund is available.'
              : 'This cancellation is more than 24 hours before the game. You are eligible for a refund.'}
          </p>
        </div>
      ` : ''}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">Book a Dink &mdash; bookadink.com</p>
    </div>
  `;
}

function buildWaitlistPromotedHtml(game: GameDetails, body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin: 0 0 4px; font-size: 18px;">You're In!</h2>
        <p style="color: #666; margin: 0; font-size: 14px;">A spot opened up for you</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #333;">
        <tr><td style="padding: 8px 0; color: #888; width: 100px;">Game</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(game.title)}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">When</td><td style="padding: 8px 0;">${formatDate(game.date_time)}</td></tr>
        ${game.location ? `<tr><td style="padding: 8px 0; color: #888;">Location</td><td style="padding: 8px 0;">${escapeHtml(game.location)}</td></tr>` : ''}
        ${game.club?.name ? `<tr><td style="padding: 8px 0; color: #888;">Club</td><td style="padding: 8px 0;">${escapeHtml(game.club.name)}</td></tr>` : ''}
        ${game.fee_amount > 0 ? `<tr><td style="padding: 8px 0; color: #888;">Fee</td><td style="padding: 8px 0; font-weight: 600;">$${game.fee_amount.toFixed(2)}</td></tr>` : ''}
      </table>
      ${game.fee_amount > 0 ? `
        <div style="background: #fef9c3; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin-top: 16px;">
          <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">
            Complete payment within 24 hours to secure your spot, or it will be released to the next player on the waitlist.
          </p>
        </div>
      ` : ''}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">Book a Dink &mdash; bookadink.com</p>
    </div>
  `;
}

function buildDefaultHtml(title: string, body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a; margin-bottom: 8px;">${escapeHtml(title)}</h2>
      <p style="color: #666; font-size: 15px; line-height: 1.5;">${escapeHtml(body)}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">Book a Dink &mdash; bookadink.com</p>
    </div>
  `;
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { record } = payload;

    if (!EMAIL_TYPES.has(record.type)) {
      return new Response('Skipped: not an email-worthy notification', { status: 200 });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response('RESEND_API_KEY not configured', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get user's email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', record.user_id)
      .single();

    if (!profile?.email) {
      return new Response('No email found for user', { status: 200 });
    }

    // Build email HTML
    let html: string;

    if (BOOKING_TYPES.has(record.type) && record.reference_id) {
      // Fetch game details for rich email
      const { data: game } = await supabase
        .from('games')
        .select('title, date_time, location, fee_amount, fee_currency, duration_minutes, club:clubs(name, location)')
        .eq('id', record.reference_id)
        .single();

      if (game) {
        switch (record.type) {
          case 'booking_confirmed':
            html = buildBookingConfirmedHtml(game as GameDetails, record.body);
            break;
          case 'booking_cancelled':
            html = buildBookingCancelledHtml(game as GameDetails, record.body);
            break;
          case 'waitlist_promoted':
            html = buildWaitlistPromotedHtml(game as GameDetails, record.body);
            break;
          default:
            html = buildDefaultHtml(record.title, record.body);
        }
      } else {
        html = buildDefaultHtml(record.title, record.body);
      }
    } else {
      html = buildDefaultHtml(record.title, record.body);
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Book a Dink <notifications@bookadink.com>',
        to: [profile.email],
        subject: record.title,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      return new Response(`Email send failed: ${error}`, { status: 500 });
    }

    // Mark email as sent
    await supabase
      .from('notifications')
      .update({ email_sent: true })
      .eq('id', record.id);

    return new Response('Email sent', { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
