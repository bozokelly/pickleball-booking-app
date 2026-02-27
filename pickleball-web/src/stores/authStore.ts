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

let _initialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null, profile: null, loading: false, initialized: false,

  initialize: async () => {
    if (_initialized) return;
    _initialized = true;

    // onAuthStateChange fires INITIAL_SESSION from local cookie storage — no network call.
    // This is the reliable path for initialization. getUser() (a network round-trip) was
    // previously used here but could hang on stale/expired cookies, leaving the spinner
    // stuck indefinitely. The middleware already validates the session server-side on every
    // request, so a client-side network validation on init is redundant.
    supabase.auth.onAuthStateChange(async (event, session) => {
      const prev = get().session;

      if (event === 'INITIAL_SESSION') {
        set({ session, initialized: true });
        if (session) {
          await get().fetchProfile();
        }
        return;
      }

      set({ session });
      if (session && session.user.id !== prev?.user?.id) {
        await get().fetchProfile();
      } else if (!session) {
        set({ profile: null });
      }
    });
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
