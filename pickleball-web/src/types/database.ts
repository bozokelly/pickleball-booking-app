export type SkillLevel = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'pro';
export type GameFormat = 'singles' | 'doubles' | 'mixed_doubles' | 'round_robin' | 'open_play';
export type GameStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type BookingStatus = 'confirmed' | 'waitlisted' | 'cancelled';
export type MembershipStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType =
  | 'booking_confirmed' | 'waitlist_promoted' | 'game_cancelled'
  | 'game_reminder' | 'game_updated'
  | 'membership_request' | 'new_game_available'
  | 'new_club_message' | 'club_message_reply';
export type ClubAdminRole = 'owner' | 'admin';

export interface Profile {
  id: string; email: string; full_name: string | null; phone: string | null;
  date_of_birth: string | null; dupr_rating: number | null; avatar_url: string | null;
  push_token: string | null;
  emergency_contact_name: string | null; emergency_contact_phone: string | null;
  created_at: string; updated_at: string;
}
export interface Club {
  id: string; name: string; description: string | null; location: string | null;
  latitude: number | null; longitude: number | null;
  image_url: string | null; members_only: boolean; created_by: string;
  manager_name: string | null;
  contact_email: string | null; contact_phone: string | null; website: string | null;
  created_at: string; updated_at: string;
}
export interface ClubAdmin { club_id: string; user_id: string; role: ClubAdminRole; created_at: string; }
export interface ClubMember {
  id: string; club_id: string; user_id: string; status: MembershipStatus;
  requested_at: string; responded_at: string | null; responded_by: string | null;
}
export interface Game {
  id: string; club_id: string; title: string; description: string | null;
  date_time: string; duration_minutes: number; skill_level: SkillLevel;
  game_format: GameFormat; max_spots: number; fee_amount: number; fee_currency: string;
  location: string | null; latitude: number | null; longitude: number | null;
  status: GameStatus; notes: string | null; requires_dupr: boolean;
  payment_deadline_hours: number;
  visible_from: string | null; recurrence_group_id: string | null;
  created_by: string; created_at: string; updated_at: string;
  club?: Club; confirmed_count?: number; user_booking?: Booking | null;
}
export interface Booking {
  id: string; game_id: string; user_id: string; status: BookingStatus;
  waitlist_position: number | null; fee_paid: boolean;
  stripe_payment_intent_id: string | null; paid_at: string | null;
  promoted_at: string | null;
  reminder_scheduled: boolean; local_notification_id: string | null;
  created_at: string; updated_at: string;
  profile?: Profile; game?: Game;
}
export interface GameMessage {
  id: string; game_id: string; user_id: string; content: string; created_at: string;
  profile?: Pick<Profile, 'full_name' | 'avatar_url'>;
}
export interface Notification {
  id: string; user_id: string; title: string; body: string;
  type: NotificationType; reference_id: string | null; read: boolean; email_sent: boolean; created_at: string;
}
export interface ClubMessage {
  id: string; club_id: string; sender_id: string; parent_id: string | null;
  subject: string; body: string; read: boolean; created_at: string;
  sender?: Pick<Profile, 'full_name' | 'avatar_url'> & { email?: string };
  replies?: ClubMessage[];
}

export type ReactionType = 'like' | 'love' | 'fire' | 'laugh';

export interface FeedPost {
  id: string; user_id: string; club_id: string | null; content: string; image_url: string | null;
  created_at: string; updated_at: string;
  profile?: Pick<Profile, 'full_name' | 'avatar_url'>;
  club?: Pick<Club, 'id' | 'name' | 'image_url'>;
  reaction_counts?: Record<ReactionType, number>;
  user_reaction?: ReactionType | null;
  comment_count?: number;
}
export interface FeedReaction {
  id: string; post_id: string; user_id: string; reaction_type: ReactionType; created_at: string;
}
export interface FeedComment {
  id: string; post_id: string; user_id: string; parent_id: string | null; content: string; created_at: string;
  profile?: Pick<Profile, 'full_name' | 'avatar_url'>;
  replies?: FeedComment[];
}
