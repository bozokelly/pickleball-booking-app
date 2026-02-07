// Auto-generated with: npm run db:types
// This is a starter file — regenerate after running migrations.

export type SkillLevel = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'pro';
export type GameFormat = 'singles' | 'doubles' | 'mixed_doubles' | 'round_robin' | 'open_play';
export type GameStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type BookingStatus = 'confirmed' | 'waitlisted' | 'cancelled';
export type MembershipStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType =
  | 'booking_confirmed'
  | 'waitlist_promoted'
  | 'game_cancelled'
  | 'game_reminder'
  | 'game_updated';
export type ClubAdminRole = 'owner' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  dupr_rating: number | null;
  avatar_url: string | null;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  members_only: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClubAdmin {
  club_id: string;
  user_id: string;
  role: ClubAdminRole;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  status: MembershipStatus;
  requested_at: string;
  responded_at: string | null;
  responded_by: string | null;
}

export interface Game {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  date_time: string;
  duration_minutes: number;
  skill_level: SkillLevel;
  game_format: GameFormat;
  max_spots: number;
  fee_amount: number;
  fee_currency: string;
  location: string | null;
  status: GameStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  club?: Club;
  confirmed_count?: number;
  user_booking?: Booking | null;
}

export interface Booking {
  id: string;
  game_id: string;
  user_id: string;
  status: BookingStatus;
  waitlist_position: number | null;
  fee_paid: boolean;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  reminder_scheduled: boolean;
  local_notification_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
  game?: Game;
}

export interface GameMessage {
  id: string;
  game_id: string;
  user_id: string;
  content: string;
  created_at: string;
  // Joined fields
  profile?: Pick<Profile, 'full_name' | 'avatar_url'>;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  reference_id: string | null;
  read: boolean;
  created_at: string;
}
