import { Alert } from 'react-native';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { supabase } from '@/lib/supabase';

interface PaymentResult {
  success: boolean;
  free?: boolean;
}

/**
 * Initiate payment for a booking. If the game is free, marks as paid immediately.
 * Otherwise shows Stripe Payment Sheet.
 */
export async function processBookingPayment(bookingId: string): Promise<PaymentResult> {
  // Call edge function to create payment intent
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: { bookingId },
  });

  if (error) throw new Error(error.message);

  // Free game — already marked as paid server-side
  if (data.free) {
    return { success: true, free: true };
  }

  // Initialize Stripe Payment Sheet
  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: data.clientSecret,
    merchantDisplayName: 'Pickleball Booking',
    style: 'alwaysLight',
  });

  if (initError) {
    throw new Error(initError.message);
  }

  // Present Payment Sheet
  const { error: presentError } = await presentPaymentSheet();

  if (presentError) {
    if (presentError.code === 'Canceled') {
      return { success: false };
    }
    throw new Error(presentError.message);
  }

  return { success: true };
}
