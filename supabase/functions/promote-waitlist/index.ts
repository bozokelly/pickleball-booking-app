/**
 * Supabase Edge Function: Send push notification when a user is promoted from
 * the waitlist. Triggered by a database webhook on the notifications table
 * when a new 'waitlist_promoted' notification is inserted.
 *
 * Setup:
 * 1. Deploy: supabase functions deploy promote-waitlist
 * 2. Create a database webhook on public.notifications INSERT
 *    that calls this function when type = 'waitlist_promoted'
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    user_id: string;
    title: string;
    body: string;
    type: string;
    reference_id: string;
  };
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { record } = payload;

    if (record.type !== 'waitlist_promoted') {
      return new Response('Skipped: not a waitlist promotion', { status: 200 });
    }

    // Get user's push token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', record.user_id)
      .single();

    if (!profile?.push_token) {
      return new Response('No push token found', { status: 200 });
    }

    // Send push notification via Expo
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: profile.push_token,
        title: record.title,
        body: record.body,
        data: {
          type: record.type,
          gameId: record.reference_id,
        },
        sound: 'default',
        priority: 'high',
      }),
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
