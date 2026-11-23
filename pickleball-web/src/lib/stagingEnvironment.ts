const STAGING_HOST = 'staging.bookadink.com';

// The apex is a production host. Vercel redirects it to www, and the app
// accepts it when a request still arrives with that Host header.
const PRODUCTION_BILLING_RETURN_HOSTS = new Set([
  'www.bookadink.com',
  'bookadink.com',
]);

export type BillingReturnAudience = 'production' | 'staging';

export function isStagingHost(host: string | null): boolean {
  return normalizeHost(host) === STAGING_HOST;
}

export function isProductionBillingReturnHost(host: string | null): boolean {
  return PRODUCTION_BILLING_RETURN_HOSTS.has(normalizeHost(host));
}

export function canRenderStagingOnlyRoute({
  host,
  nodeEnv,
  vercelEnv,
}: {
  host: string | null;
  nodeEnv: string | undefined;
  vercelEnv: string | undefined;
}): boolean {
  const normalizedHost = normalizeHost(host);

  if (normalizedHost === STAGING_HOST) return true;
  if (nodeEnv === 'development' && isLocalHost(normalizedHost)) return true;
  if (vercelEnv === 'preview' && normalizedHost.endsWith('.vercel.app')) return true;

  return false;
}

export function billingReturnAudience({
  host,
  nodeEnv,
  vercelEnv,
}: {
  host: string | null;
  nodeEnv: string | undefined;
  vercelEnv: string | undefined;
}): BillingReturnAudience | null {
  if (isProductionBillingReturnHost(host)) return 'production';
  if (canRenderStagingOnlyRoute({ host, nodeEnv, vercelEnv })) return 'staging';
  return null;
}

function normalizeHost(host: string | null): string {
  return (host ?? '').trim().toLowerCase().replace(/\.$/u, '').replace(/:\d+$/u, '');
}

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}
