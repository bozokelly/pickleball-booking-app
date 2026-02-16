/**
 * Supabase Edge Function: Create a Stripe Payment Intent for game booking.
 *
 * Called by the app when a user books a game that has a fee.
 * Returns a client secret for the Stripe Payment Sheet.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY - Stripe secret key
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - auto-provided by Supabase
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const bookingId = body.bookingId || body.booking_id;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get booking with game details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, game:games(*), profile:profiles(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (booking.fee_paid) {
      return new Response(
        JSON.stringify({ error: 'Already paid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const amount = Math.round(booking.game.fee_amount * 100); // cents
    if (amount <= 0) {
      // Free game, mark as paid
      await supabase
        .from('bookings')
        .update({ fee_paid: true, paid_at: new Date().toISOString() })
        .eq('id', bookingId);

      return new Response(
        JSON.stringify({ free: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: booking.game.fee_currency.toLowerCase(),
      metadata: {
        booking_id: bookingId,
        game_id: booking.game_id,
        user_id: booking.user_id,
      },
    });

    // Store payment intent ID on booking
    await supabase
      .from('bookings')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', bookingId);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        amount,
        currency: booking.game.fee_currency,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
