const DEFAULT_SITE_ORIGIN = 'https://bookadink.com';

function normalizeOrigin(origin: string): string {
  return origin.endsWith('/') ? origin.slice(0, -1) : origin;
}

export function getSiteOrigin(): string {
  return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_ORIGIN);
}

export function getAppStoreId(): string | null {
  const raw = process.env.NEXT_PUBLIC_APPLE_APP_STORE_ID || process.env.APPLE_APP_STORE_ID;
  const id = raw?.trim();
  return id ? id : null;
}

export function getAppStoreUrl(): string {
  const appStoreId = getAppStoreId();
  if (!appStoreId) return 'https://apps.apple.com';
  return `https://apps.apple.com/app/id${appStoreId}`;
}

export function getAppleItunesMeta(appArgumentUrl: string): string | undefined {
  const appStoreId = getAppStoreId();
  if (!appStoreId) return undefined;
  return `app-id=${appStoreId}, app-argument=${appArgumentUrl}`;
}
