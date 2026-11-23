import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextRequest } from 'next/server';
import nextConfig from '../../../../next.config';
import { middleware } from '../../../middleware';
import { BILLING_RETURN_CONTENT_SECURITY_POLICY } from '../../../lib/billingReturn';

const { headerStore } = vi.hoisted(() => ({
  headerStore: { host: 'www.bookadink.com' },
}));

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => (name.toLowerCase() === 'host' ? headerStore.host : null),
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('next/image', () => ({
  default: () => null,
}));

import BillingReturnPage, { generateMetadata } from './page';

const PRODUCTION_BODY =
  "You can close this window and return to Book a Dink. Refresh your club's billing information to see any changes.";

function visibleText(html: string): string {
  return html.replaceAll('&#x27;', "'");
}

describe('billing return route', () => {
  beforeEach(() => {
    headerStore.host = 'www.bookadink.com';
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');
  });

  it('renders the neutral production page and hides query values', async () => {
    headerStore.host = 'www.bookadink.com';
    const html = visibleText(renderToStaticMarkup(await BillingReturnPage()));

    expect(html).toContain('Return to Book a Dink');
    expect(html).toContain(PRODUCTION_BODY);
    expect(html).toContain('Book a Dink');
    expect(html).not.toContain('You’re all set.');
    expect(html).not.toContain('visit is complete');
    expect(html).not.toContain('Billing settings updated');
    expect(html).not.toContain('payment');
    expect(html).not.toContain('success');
    expect(html).not.toContain('session_id');
    expect(html).not.toContain('cs_test_secret');

    const metadata = await generateMetadata();
    expect(metadata.title).toEqual({ absolute: 'Return to Book a Dink' });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('renders the apex host with the same production page', async () => {
    headerStore.host = 'bookadink.com';
    const html = visibleText(renderToStaticMarkup(await BillingReturnPage()));
    expect(html).toContain(PRODUCTION_BODY);
    expect(html).not.toContain('BookaDink Staging');
  });

  it('preserves the staging page', async () => {
    headerStore.host = 'staging.bookadink.com';
    const html = renderToStaticMarkup(await BillingReturnPage());

    expect(html).toContain('BookaDink Staging');
    expect(html).toContain('You’re all set.');
    expect(html).toContain(
      'Your staging billing portal visit is complete. You can close this tab and return to the BookaDink Staging app.',
    );
    expect(html).toContain('No payment details are displayed or processed on this page.');
    expect(html).not.toContain(PRODUCTION_BODY);

    const metadata = await generateMetadata();
    expect(metadata.title).toEqual({ absolute: 'Billing settings updated - BookaDink Staging' });
    expect(metadata.description).toBe('Return page for the BookaDink staging billing portal.');
  });

  it('restricts an unsupported host', async () => {
    headerStore.host = 'app.bookadink.com';
    await expect(BillingReturnPage()).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(generateMetadata()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('serves no-store, noindex, and a restrictive content security policy', async () => {
    const request = new NextRequest(
      'https://www.bookadink.com/billing/return?session_id=cs_test_secret',
    );
    const response = await middleware(request);
    const rewrite = response.headers.get('x-middleware-rewrite') ?? '';

    expect(rewrite).not.toContain('session_id');
    expect(rewrite).not.toContain('cs_test_secret');
    expect(rewrite.endsWith('/billing/return')).toBe(true);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(response.headers.get('content-security-policy')).toBe(
      BILLING_RETURN_CONTENT_SECURITY_POLICY,
    );
    expect(response.headers.get('content-security-policy')).not.toContain('session_id');
    expect(BILLING_RETURN_CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(BILLING_RETURN_CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(BILLING_RETURN_CONTENT_SECURITY_POLICY).toContain("form-action 'none'");
    expect(BILLING_RETURN_CONTENT_SECURITY_POLICY).not.toContain('https://');

    const rules = await nextConfig.headers?.();
    const billingRule = rules?.find((rule) => rule.source === '/billing/return');
    expect(billingRule?.headers).toEqual(
      expect.arrayContaining([
        { key: 'Cache-Control', value: 'no-store' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        { key: 'Content-Security-Policy', value: BILLING_RETURN_CONTENT_SECURITY_POLICY },
      ]),
    );
  });
});
