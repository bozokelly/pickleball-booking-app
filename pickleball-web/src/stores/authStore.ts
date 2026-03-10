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
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null, profile: null, loading: false, initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    if (_initializePromise) return _initializePromise;

    // onAuthStateChange handles all future auth events (sign in, sign out, token refresh).
    if (!_authListenerAttached) {
      _authListenerAttached = true;
      supabase.auth.onAuthStateChange(async (_event, session) => {
        const prev = get().session;
        set({ session });
        if (session && session.user.id !== prev?.user?.id) {
          await get().fetchProfile();
        } else if (!session) {
          set({ profile: null });
        }
      });
    }

    _initializePromise = (async () => {
      // getSession() reads the current session from cookies/local storage.
      // Guard with a timeout so stale browser auth state cannot lock the app spinner forever.
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_INIT_TIMEOUT_MS,
          'supabase.auth.getSession()'
        );
        set({ session, initialized: true });
        if (session) {
          await get().fetchProfile();
        }
      } catch (err) {
        console.warn('Auth initialization failed:', err);
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    } finally { set({ loading: false }); }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
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
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
