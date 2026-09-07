import { describe, expect, it } from 'vitest';
import { canRenderStagingOnlyRoute, isStagingHost } from '../stagingEnvironment';

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

  it('returns a 404 guard decision on the production domain', () => {
    expect(canRenderStagingOnlyRoute({
      host: 'www.bookadink.com',
      nodeEnv: 'production',
      vercelEnv: 'production',
    })).toBe(false);
  });
});
