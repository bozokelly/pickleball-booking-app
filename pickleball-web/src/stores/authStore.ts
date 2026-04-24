import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null; profile: Profile | null; loading: boolean; initialized: boolean;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AUTH_INIT_TIMEOUT_MS = 8000;
let _authListenerAttached = false;
let _initializePromise: Promise<void> | null = null;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    promise
      .then((value) => { clearTimeout(timer); resolve(value); })
      .catch((error) => { clearTimeout(timer); reject(error); });
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null, profile: null, loading: false, initialized: false,

  initialize: async () => {
    // Attach the long-lived listener BEFORE checking initialized, so that a
    // module re-evaluation (e.g. deployment hard-reload) that resets
    // _authListenerAttached doesn't lose the listener when initialized is
    // already true and we would otherwise return early.
    if (!_authListenerAttached) {
      _authListenerAttached = true;
      supabase.auth.onAuthStateChange(async (event, session) => {
        // INITIAL_SESSION reflects local-storage state which may be stale — _initializePromise validates via getUser() instead.
        if (event === 'INITIAL_SESSION') return;
        const prev = get().session;
        set({ session, initialized: true });
        if (session && session.user.id !== prev?.user?.id) {
          await get().fetchProfile();
        } else if (!session) {
          set({ profile: null });
        }
      });
    }

    // Only run the one-shot session fetch once.
    if (get().initialized) return;
    if (_initializePromise) return _initializePromise;

    _initializePromise = (async () => {
      try {
        // getUser() validates against the server — getSession() alone trusts local storage and can return stale/expired sessions.
        const { data: { user }, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          AUTH_INIT_TIMEOUT_MS,
          'supabase.auth.getUser()'
        );

        if (userError || !user) {
          if (process.env.NODE_ENV === 'development') console.log('[auth] init: no valid server session, clearing local state');
          set({ session: null, profile: null, initialized: true });
          return;
        }

        // User is server-confirmed; getSession() now returns the (possibly refreshed) token.
        const { data: { session } } = await supabase.auth.getSession();
        if (process.env.NODE_ENV === 'development') console.log('[auth] init: server session confirmed');
        set({ session, initialized: true });
        if (session) {
          await get().fetchProfile();
        }
      } catch (err) {
        console.warn('[auth] init failed:', err);
        set({ session: null, profile: null, initialized: true });
      } finally {
        _initializePromise = null;
      }
    })();

    return _initializePromise;
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true });
    try {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signUp({
        email, password, options: {
          data: { full_name: fullName },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });
      if (error) throw new Error(error.message);
    } finally { set({ loading: false }); }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (data.session) {
        // Call getUser() to confirm the server acknowledges the new session before
        // committing to the store and navigating. signInWithPassword already validates
        // credentials, but this ensures cookies are fully set before any redirect.
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          set({ session: data.session, initialized: true });
          await get().fetchProfile();
        }
      }
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    // Clear local state immediately so UI updates are instant, regardless of
    // whether the network call succeeds. Keep initialized: true so the
    // dashboard layout's !session check fires the redirect right away without
    // needing to re-run the full initialization cycle.
    try {
      await supabase.auth.signOut();
    } finally {
      set({ session: null, profile: null });
    }
  },

  resetPassword: async (email) => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    });
    if (error) throw new Error(error.message);
  },

  fetchProfile: async () => {
    const userId = get().session?.user?.id;
    if (!userId) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) { console.warn('Failed to fetch profile:', error.message); return; }
    set({ profile: data });
  },

  updateProfile: async (updates) => {
    const userId = get().session?.user.id;
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) throw new Error(error.message);
    set({ profile: data });
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  resendConfirmation: async (email) => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) throw new Error(error.message);
  },

  deleteAccount: async () => {
    const session = get().session;
    if (!session) throw new Error('Not authenticated');
    const { data, error } = await supabase.functions.invoke('delete-account', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    try {
      await supabase.auth.signOut();
    } finally {
      set({ session: null, profile: null });
    }
  },
}));
