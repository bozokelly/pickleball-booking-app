import { supabase } from '@/lib/supabase';

interface PaymentResult {
  success: boolean;
  free?: boolean;
}

/**
 * Web stub for payment processing.
 * Stripe React Native is not available on web — only free bookings are supported.
 */
export async function processBookingPayment(bookingId: string): Promise<PaymentResult> {
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: { bookingId },
  });

  if (error) throw new Error(error.message);

  if (data.free) {
    return { success: true, free: true };
  }

  // Paid games are not supported on web
  throw new Error('Payments are not supported in the web version. Please use the mobile app.');
}
