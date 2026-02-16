import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type MembershipStatus = 'pending' | 'approved' | 'rejected';

export interface ClubMember {
  id: string; club_id: string; user_id: string; status: MembershipStatus;
  requested_at: string; responded_at: string | null;
  profile?: { full_name: string | null; email: string; avatar_url: string | null; dupr_rating: number | null; };
}

interface MembershipState {
  members: ClubMember[]; myMemberships: ClubMember[]; loading: boolean;
  fetchClubMembers: (clubId: string) => Promise<void>;
  fetchMyMemberships: () => Promise<void>;
  requestMembership: (clubId: string) => Promise<void>;
  approveMember: (memberId: string) => Promise<void>;
  rejectMember: (memberId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  promoteToAdmin: (clubId: string, userId: string) => Promise<void>;
  removeAdmin: (clubId: string, userId: string) => Promise<void>;
  getMembershipStatus: (clubId: string) => MembershipStatus | null;
}

export const useMembershipStore = create<MembershipState>((set, get) => ({
  members: [], myMemberships: [], loading: false,

  fetchClubMembers: async (clubId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.from('club_members')
        .select('*, profile:profiles!club_members_user_id_fkey(full_name, email, avatar_url, dupr_rating)')
        .eq('club_id', clubId).order('requested_at', { ascending: false });
      if (error) throw new Error(error.message);
      set({ members: data || [] });
    } finally { set({ loading: false }); }
  },

  fetchMyMemberships: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('club_members').select('*').eq('user_id', user.id);
    if (error) throw new Error(error.message);
    set({ myMemberships: data || [] });
  },

  requestMembership: async (clubId) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const { error } = await supabase.from('club_members').insert({ club_id: clubId, user_id: userId, status: 'pending' });
    if (error) throw new Error(error.message);
    await get().fetchMyMemberships();

    // Notify club admins
    await supabase.rpc('notify_club_admins', {
      p_club_id: clubId,
      p_title: 'New membership request',
      p_body: 'Someone has requested to join your club',
      p_type: 'membership_request',
      p_reference_id: clubId,
    });
  },

  approveMember: async (memberId) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const { error } = await supabase.from('club_members')
      .update({ status: 'approved', responded_at: new Date().toISOString(), responded_by: userId }).eq('id', memberId);
    if (error) throw new Error(error.message);
  },

  rejectMember: async (memberId) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const { error } = await supabase.from('club_members')
      .update({ status: 'rejected', responded_at: new Date().toISOString(), responded_by: userId }).eq('id', memberId);
    if (error) throw new Error(error.message);
  },

  removeMember: async (memberId) => {
    const { error } = await supabase.from('club_members').delete().eq('id', memberId);
    if (error) throw new Error(error.message);
  },

  promoteToAdmin: async (clubId, userId) => {
    const { error } = await supabase.from('club_admins').insert({ club_id: clubId, user_id: userId, role: 'admin' });
    if (error) throw new Error(error.message);
  },

  removeAdmin: async (clubId, userId) => {
    const { error } = await supabase.from('club_admins').delete().eq('club_id', clubId).eq('user_id', userId);
    if (error) throw new Error(error.message);
  },

  getMembershipStatus: (clubId) => get().myMemberships.find((m) => m.club_id === clubId)?.status || null,
}));
