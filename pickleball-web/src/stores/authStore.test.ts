import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

const provider = vi.hoisted(() => ({ rpc: vi.fn(), signOut: vi.fn(), invoke: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: provider.rpc, auth: { signOut: provider.signOut }, functions: { invoke: provider.invoke } },
}));
import { useAuthStore } from './authStore';

describe('supported account deletion request', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.setState({ session: { user: { id: 'caller' } } as Session, profile: null });
    provider.signOut.mockResolvedValue({ error: null });
  });
  it.each(['pending', 'processing', 'requires_admin_review'])('accepts server status %s and preserves sign-out behavior', async (status) => {
    provider.rpc.mockResolvedValue({ data: [{ out_status: status, out_request_id: 'request-id' }], error: null });
    await useAuthStore.getState().deleteAccount();
    expect(provider.rpc).toHaveBeenCalledWith('request_account_deletion', { p_reason: null });
    expect(provider.invoke).not.toHaveBeenCalled();
    expect(provider.signOut).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().session).toBeNull();
  });
  it.each([null, [], [{ out_status: 'failed', out_request_id: 'id' }], [{ out_status: 'pending' }]])('rejects unconfirmed responses without signing out', async (data) => {
    provider.rpc.mockResolvedValue({ data, error: null });
    await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow();
    expect(provider.signOut).not.toHaveBeenCalled();
    expect(useAuthStore.getState().session).not.toBeNull();
  });
  it('preserves the session after a transient RPC error so the same request can be retried', async () => {
    provider.rpc.mockResolvedValueOnce({ data: null, error: { message: 'temporary' } })
      .mockResolvedValueOnce({ data: [{ out_status: 'pending', out_request_id: 'same-request' }], error: null });
    await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow('temporary');
    expect(provider.signOut).not.toHaveBeenCalled();
    await useAuthStore.getState().deleteAccount();
    expect(provider.rpc).toHaveBeenCalledTimes(2);
    expect(provider.invoke).not.toHaveBeenCalled();
  });
  it('rejects a missing session before any provider call', async () => {
    useAuthStore.setState({ session: null });
    await expect(useAuthStore.getState().deleteAccount()).rejects.toThrow('Not authenticated');
    expect(provider.rpc).not.toHaveBeenCalled();
  });
});
