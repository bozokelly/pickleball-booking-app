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
}

let _initialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null, profile: null, loading: false, initialized: false,

  initialize: async () => {
    if (_initialized) return;
    _initialized = true;

    // Register auth state listener once — outside try/catch so it always gets set up
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session) await get().fetchProfile();
      else set({ profile: null });
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          await supabase.auth.signOut();
          set({ session: null, profile: null, initialized: true });
        } else {
          set({ session, initialized: true });
          await get().fetchProfile();
        }
      } else {
        set({ initialized: true });
      }
    } catch (err) {
      console.warn('Auth initialization failed:', err);
      set({ initialized: true });
    }
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
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
}));
