const STAGING_HOST = 'staging.bookadink.com';

export function isStagingHost(host: string | null): boolean {
  return normalizeHost(host) === STAGING_HOST;
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

function normalizeHost(host: string | null): string {
  return (host ?? '').trim().toLowerCase().replace(/\.$/u, '').replace(/:\d+$/u, '');
}

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}
