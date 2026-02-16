/**
 * Supabase Edge Function: Send email for important notifications.
 * Triggered by a database webhook on public.notifications INSERT.
 *
 * Only sends emails for these notification types:
 * - membership_request
 * - new_club_message
 * - club_message_reply
 * - game_cancelled
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
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1a1a1a; margin-bottom: 8px;">${record.title}</h2>
            <p style="color: #666; font-size: 15px; line-height: 1.5;">${record.body}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">Book a Dink &mdash; bookadink.com</p>
          </div>
        `,
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
