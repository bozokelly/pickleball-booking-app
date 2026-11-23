import { describe, expect, it } from 'vitest';
import {
  billingReturnAudience,
  canRenderStagingOnlyRoute,
  isProductionBillingReturnHost,
  isStagingHost,
} from '../stagingEnvironment';

describe('staging environment guard', () => {
  it('accepts the canonical staging host with case, port, or trailing-dot normalization', () => {
    expect(isStagingHost('STAGING.BOOKADINK.COM:443')).toBe(true);
    expect(isStagingHost('staging.bookadink.com.')).toBe(true);
  });

  it('rejects production and lookalike hosts', () => {
    expect(isStagingHost('www.bookadink.com')).toBe(false);
    expect(isStagingHost('staging.bookadink.com.attacker.example')).toBe(false);
  });

  it('allows local development and Vercel previews', () => {
    expect(canRenderStagingOnlyRoute({
      host: 'localhost:3000',
      nodeEnv: 'development',
      vercelEnv: undefined,
    })).toBe(true);
    expect(canRenderStagingOnlyRoute({
      host: 'bookadink-git-branch-team.vercel.app',
      nodeEnv: 'production',
      vercelEnv: 'preview',
    })).toBe(true);
  });

  it('keeps the staging-only guard closed on production hosts', () => {
    expect(canRenderStagingOnlyRoute({
      host: 'www.bookadink.com',
      nodeEnv: 'production',
      vercelEnv: 'production',
    })).toBe(false);
    expect(canRenderStagingOnlyRoute({
      host: 'bookadink.com',
      nodeEnv: 'production',
      vercelEnv: 'production',
    })).toBe(false);
  });
});

describe('billing return host selection', () => {
  it('selects production for www and the apex, including case, port, and trailing dot', () => {
    expect(isProductionBillingReturnHost('WWW.BOOKADINK.COM:443')).toBe(true);
    expect(isProductionBillingReturnHost('bookadink.com.')).toBe(true);
    expect(billingReturnAudience({
      host: 'www.bookadink.com',
      nodeEnv: 'production',
      vercelEnv: 'production',
    })).toBe('production');
    expect(billingReturnAudience({
      host: 'bookadink.com',
      nodeEnv: 'development',
      vercelEnv: 'preview',
    })).toBe('production');
  });

  it('keeps staging copy on the staging host, local development, and Vercel previews', () => {
    expect(billingReturnAudience({
      host: 'staging.bookadink.com',
      nodeEnv: 'production',
      vercelEnv: 'production',
    })).toBe('staging');
    expect(billingReturnAudience({
      host: 'localhost:3000',
      nodeEnv: 'development',
      vercelEnv: undefined,
    })).toBe('staging');
    expect(billingReturnAudience({
      host: 'bookadink-git-branch-team.vercel.app',
      nodeEnv: 'production',
      vercelEnv: 'preview',
    })).toBe('staging');
  });

  it('restricts unsupported and lookalike hosts', () => {
    const denied = [
      'app.bookadink.com',
      'staging.bookadink.com.attacker.example',
      'www.bookadink.com.attacker.example',
      'bookadink.com.attacker.example',
      'notbookadink.com',
      'www.bookadink.com?session_id=cs_test_secret',
      null,
      '',
    ];

    for (const host of denied) {
      expect(billingReturnAudience({
        host,
        nodeEnv: 'production',
        vercelEnv: 'production',
      })).toBeNull();
    }

    expect(billingReturnAudience({
      host: 'localhost',
      nodeEnv: 'production',
      vercelEnv: 'production',
    })).toBeNull();
    expect(billingReturnAudience({
      host: 'preview.vercel.app',
      nodeEnv: 'production',
      vercelEnv: 'production',
    })).toBeNull();
  });
});
