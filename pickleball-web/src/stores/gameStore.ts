import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Game, Booking } from '@/types/database';
import { useAuthStore } from './authStore';

interface GameState {
  games: Game[]; myBookings: Booking[]; loading: boolean;
  fetchUpcomingGames: (clubId?: string) => Promise<void>;
  fetchMyBookings: () => Promise<void>;
  fetchGameById: (gameId: string) => Promise<Game | null>;
  bookGame: (gameId: string) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  adminBookPlayer: (gameId: string, userId: string) => Promise<Booking>;
}

export const useGameStore = create<GameState>((set, get) => ({
  games: [], myBookings: [], loading: false,

  fetchUpcomingGames: async (clubId) => {
    set({ loading: true });
    try {
      const now = new Date().toISOString();
      let query = supabase.from('games').select('*, club:clubs(*)')
        .eq('status', 'upcoming').gte('date_time', now)
        .or(`visible_from.is.null,visible_from.lte.${now}`)
        .order('date_time', { ascending: true });
      if (clubId) query = query.eq('club_id', clubId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      set({ games: data || [] });
    } finally { set({ loading: false }); }
  },

  fetchMyBookings: async () => {
    const user = useAuthStore.getState().session?.user ?? null;
    if (!user) return;
    const { data, error } = await supabase.from('bookings')
      .select('*, game:games(*, club:clubs(*))')
      .eq('user_id', user.id).neq('status', 'cancelled')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    set({ myBookings: data || [] });
  },

  fetchGameById: async (gameId) => {
    const user = useAuthStore.getState().session?.user ?? null;
    const { data, error } = await supabase.from('games').select('*, club:clubs(*)').eq('id', gameId).single();
    if (error) throw new Error(error.message);
    const { count } = await supabase.from('bookings')
      .select('*', { count: 'exact', head: true }).eq('game_id', gameId).eq('status', 'confirmed');
    let userBooking = null;
    if (user) {
      const { data: booking } = await supabase.from('bookings').select('*')
        .eq('game_id', gameId).eq('user_id', user.id).neq('status', 'cancelled').maybeSingle();
      userBooking = booking;
    }
    return { ...data, confirmed_count: count || 0, user_booking: userBooking };
  },

  bookGame: async (gameId) => {
    const user = useAuthStore.getState().session?.user ?? null;
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase.rpc('book_game', {
      p_game_id: gameId,
      p_user_id: user.id,
    });
    if (error) throw new Error(error.message);
    await get().fetchMyBookings();
    return data;
  },

  cancelBooking: async (bookingId) => {
    const user = useAuthStore.getState().session?.user ?? null;
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
    });
    if (error) throw new Error(error.message);
    await get().fetchMyBookings();
  },

  adminBookPlayer: async (gameId, userId) => {
    const admin = useAuthStore.getState().session?.user ?? null;
    if (!admin) throw new Error('Not authenticated');
    const { data, error } = await supabase.rpc('admin_book_player', {
      p_game_id: gameId,
      p_user_id: userId,
      p_admin_id: admin.id,
    });
    if (error) throw new Error(error.message);
    return data;
  },
}));
