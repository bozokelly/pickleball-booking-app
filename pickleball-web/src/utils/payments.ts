import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export async function processBookingPayment(
  bookingId: string,
  amount: number,
  currency: string
): Promise<void> {
  const stripe = await stripePromise;
  if (!stripe) throw new Error('Stripe not loaded');

  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: { booking_id: bookingId },
  });
  if (error) throw error;

  const { clientSecret } = data;
  if (!clientSecret) throw new Error('No client secret returned');

  const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: { token: 'tok_visa' }, // In production, use Stripe Elements
    } as any,
  });

  if (confirmError) throw new Error(confirmError.message);
}
