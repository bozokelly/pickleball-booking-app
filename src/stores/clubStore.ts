import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Club, ClubAdmin } from '@/types/database';

interface ClubState {
  clubs: Club[];
  myAdminClubs: Club[];
  loading: boolean;

  fetchClubs: () => Promise<void>;
  fetchMyAdminClubs: () => Promise<void>;
  createClub: (club: Pick<Club, 'name' | 'description' | 'location'>) => Promise<Club>;
  updateClub: (clubId: string, updates: Partial<Club>) => Promise<void>;
  addAdmin: (clubId: string, userId: string, role?: ClubAdmin['role']) => Promise<void>;
  isClubAdmin: (clubId: string) => boolean;
}

export const useClubStore = create<ClubState>((set, get) => ({
  clubs: [],
  myAdminClubs: [],
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
      .select('club:clubs(*)')
      .eq('user_id', user.id);

    if (error) throw error;

    const clubs = (data || [])
      .map((row: any) => row.club)
      .filter(Boolean);

    set({ myAdminClubs: clubs });
  },

  createClub: async (clubData) => {
    const userId = (await supabase.auth.getUser()).data.user!.id;

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
    const { error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', clubId);

    if (error) throw error;
    await get().fetchMyAdminClubs();
  },

  addAdmin: async (clubId, userId, role = 'admin') => {
    const { error } = await supabase
      .from('club_admins')
      .insert({ club_id: clubId, user_id: userId, role });

    if (error) throw error;
  },

  isClubAdmin: (clubId) => {
    return get().myAdminClubs.some((club) => club.id === clubId);
  },
}));
