export const PRODUCTION_BILLING_RETURN_HEADING = 'Return to Book a Dink';

export const PRODUCTION_BILLING_RETURN_BODY =
  "You can close this window and return to Book a Dink. Refresh your club's billing information to see any changes.";

// Next.js 16 still emits framework inline scripts that are not reliably
// nonced on Vercel. 'unsafe-inline' keeps those scripts working. A nonce in
// script-src would make browsers ignore 'unsafe-inline' and block them.
export const BILLING_RETURN_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'none'",
].join('; ');

export const billingReturnSecurityHeaders: ReadonlyArray<{ key: string; value: string }> = [
  { key: 'Cache-Control', value: 'no-store' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  { key: 'Content-Security-Policy', value: BILLING_RETURN_CONTENT_SECURITY_POLICY },
];
