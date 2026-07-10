// Maps the games payment_mode trigger's structured errors
// (subscription_upgrade_required / stripe_setup_required /
// payment_mode_fee_mismatch) to operator-friendly copy. The server is
// authoritative — these errors mean the publish was refused, never silently
// downgraded to another payment mode.
export function mapPaymentModeError(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (message.includes('subscription_upgrade_required')) {
    return 'This club’s plan does not include online payments. Upgrade the plan, or choose Pay on arrival.';
  }
  if (message.includes('stripe_setup_required')) {
    return 'Stripe Connect isn’t payment-ready. Finish Stripe setup in club payment settings, or choose Pay on arrival.';
  }
  if (message.includes('payment_mode_fee_mismatch')) {
    return 'The price doesn’t match the payment option: free games can’t have a fee, and paid games need one.';
  }
  return message || fallback;
}
