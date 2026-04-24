import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Club, ClubAdmin, ClubAdminRole } from '@/types/database';

type CreateClubData = {
  name: string;
  description?: string | null;
  location?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  manager_name?: string | null;
};

export interface ClubAdminWithProfile extends ClubAdmin {
  profile?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

interface ClubState {
  clubs: Club[];
  myAdminClubs: Club[];
  // Maps clubId -> the current user's role in that club (populated by fetchMyAdminClubs)
  myAdminRoles: Record<string, ClubAdminRole>;
  // Admin list for the club currently being managed
  clubAdmins: ClubAdminWithProfile[];
  loading: boolean;

  fetchClubs: () => Promise<void>;
  fetchMyAdminClubs: () => Promise<void>;
  fetchClubAdmins: (clubId: string) => Promise<void>;
  createClub: (club: CreateClubData) => Promise<Club>;
  updateClub: (clubId: string, updates: Partial<Club>) => Promise<void>;
  addAdmin: (clubId: string, userId: string, role?: ClubAdminRole) => Promise<void>;
  removeAdmin: (clubId: string, userId: string) => Promise<void>;
  isClubAdmin: (clubId: string) => boolean;
  isClubOwner: (clubId: string) => boolean;
}

export const useClubStore = create<ClubState>((set, get) => ({
  clubs: [],
  myAdminClubs: [],
  myAdminRoles: {},
  clubAdmins: [],
  loading: false,

  fetchClubs: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ clubs: data || [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchMyAdminClubs: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('club_admins')
      .select('role, club:clubs(*)')
      .eq('user_id', user.id);

    if (error) throw error;

    const clubs = (data || [])
      .map((row: any) => row.club)
      .filter(Boolean);

    // Build clubId -> role map so isClubOwner works without a separate fetch
    const roles: Record<string, ClubAdminRole> = {};
    (data || []).forEach((row: any) => {
      if (row.club) {
        roles[row.club.id] = row.role;
      }
    });

    set({ myAdminClubs: clubs, myAdminRoles: roles });
  },

  fetchClubAdmins: async (clubId) => {
    const { data, error } = await supabase
      .from('club_admins')
      .select('*, profile:profiles(full_name, email, avatar_url)')
      .eq('club_id', clubId);

    if (error) throw error;
    set({ clubAdmins: (data || []) as ClubAdminWithProfile[] });
  },

  createClub: async (clubData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Session expired. Please sign in again.');
    const userId = user.id;

    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .insert({ ...clubData, created_by: userId })
      .select()
      .single();

    if (clubError) throw clubError;

    // Add creator as owner
    const { error: adminError } = await supabase
      .from('club_admins')
      .insert({ club_id: club.id, user_id: userId, role: 'owner' });

    if (adminError) throw adminError;

    await get().fetchMyAdminClubs();
    return club;
  },

  updateClub: async (clubId, updates) => {
    const { data, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', clubId)
      .select()
      .single();

    if (error) throw error;
    // If RLS silently blocked the write, data will be null (0 rows affected)
    if (!data) throw new Error('Update failed — you may not have permission to edit this club.');

    await get().fetchMyAdminClubs();
  },

  addAdmin: async (clubId, userId, role = 'admin') => {
    const { error } = await supabase
      .from('club_admins')
      .insert({ club_id: clubId, user_id: userId, role });

    if (error) throw error;
  },

  removeAdmin: async (clubId, userId) => {
    const { error } = await supabase
      .from('club_admins')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  isClubAdmin: (clubId) => {
    return get().myAdminClubs.some((club) => club.id === clubId);
  },

  isClubOwner: (clubId) => {
    return get().myAdminRoles[clubId] === 'owner';
  },
}));
