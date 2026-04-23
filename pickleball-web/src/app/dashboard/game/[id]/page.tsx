'use client';

import { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { useClubStore } from '@/stores/clubStore';
import { supabase } from '@/lib/supabase';
import { Game, Profile } from '@/types/database';
import { Badge, Button, Card } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { ParticipantList } from '@/components/game/ParticipantList';
import { processBookingPayment } from '@/utils/payments';
import { downloadGameICS } from '@/utils/calendar';
import {
  SKILL_LEVEL_COLORS, SKILL_LEVEL_LABELS, GAME_FORMAT_LABELS,
} from '@/constants/theme';
import {
  ArrowLeft, Clock, MapPin, Users, DollarSign, CalendarPlus,
  XCircle, CheckCircle2, Home, Trophy, AlertTriangle,
  CreditCard, Pencil, UserPlus, Search, X, Loader2, Info, Bell, Timer, ChevronRight,
} from 'lucide-react';

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { fetchGameById, bookGame, cancelBooking, adminBookPlayer } = useGameStore();
  const { session, profile, updateProfile } = useAuthStore();
  const { isClubAdmin } = useClubStore();
  const { showToast } = useToast();
  const adminFreeBookRef = useRef(false);

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<'confirmed' | 'waitlisted'>('confirmed');
  const [confirmationPosition, setConfirmationPosition] = useState<number | null>(null);
  const [showDuprDialog, setShowDuprDialog] = useState(false);
  const [duprConfirmed, setDuprConfirmed] = useState(false);
  const [pendingBookPayment, setPendingBookPayment] = useState(true);
  const [paying, setPaying] = useState(false);
  const [editingDupr, setEditingDupr] = useState(false);
  const [duprInput, setDuprInput] = useState('');
  const [savingDupr, setSavingDupr] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [clubMembers, setClubMembers] = useState<(Profile & { user_id?: string })[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addingPlayer, setAddingPlayer] = useState<string | null>(null);
  const [bookedUserIds, setBookedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGame();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadGame() {
    setLoading(true);
    try {
      const data = await fetchGameById(id);
      setGame(data);
    } finally {
      setLoading(false);
    }
  }

  const markBookingAsPaid = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ fee_paid: true, paid_at: new Date().toISOString() })
      .eq('id', bookingId);
    if (error) throw new Error('Failed to mark booking as paid: ' + error.message);
  };

  const attemptBook = (withPayment: boolean = true) => {
    if (game?.requires_dupr) {
      setPendingBookPayment(withPayment);
      setDuprConfirmed(false);
      setShowDuprDialog(true);
      return;
    }
    handleBook(withPayment);
  };

  const handleDuprConfirmAndBook = () => {
    setShowDuprDialog(false);
    handleBook(pendingBookPayment);
  };

  const handleBook = async (withPayment: boolean = true) => {
    if (!game) return;
    adminFreeBookRef.current = !withPayment;
    setBooking(true);
    try {
      const result = await bookGame(game.id);
      if (game.fee_amount > 0 && result.status === 'confirmed') {
        if (withPayment) {
          try {
            await processBookingPayment(result.id, game.fee_amount, game.fee_currency);
          } catch {
            await cancelBooking(result.id);
            showToast('Payment cancelled, booking rolled back', 'warning');
            await loadGame();
            return;
          }
        } else {
          // Admin fee waiver — mark as paid without Stripe
          await markBookingAsPaid(result.id);
        }
      }
      await loadGame();
      setConfirmationStatus(result.status === 'confirmed' ? 'confirmed' : 'waitlisted');
      setConfirmationPosition(result.waitlist_position ?? null);
      setShowConfirmation(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed';
      showToast(message, 'error');
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async () => {
    if (!game?.user_booking) return;
    setCancelling(true);
    try {
      await cancelBooking(game.user_booking.id);
      showToast('Booking cancelled', 'success');
      await loadGame();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cancel failed';
      showToast(message, 'error');
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const openAddPlayer = async () => {
    if (!game) return;
    setShowAddPlayer(true);
    setMemberSearch('');
    setLoadingMembers(true);
    try {
      // Fetch club members and booked users in parallel
      const [memberResult, bookingResult] = await Promise.all([
        supabase
          .from('club_members')
          .select('user_id, profile:profiles!club_members_user_id_fkey(id, full_name, avatar_url, email)')
          .eq('club_id', game.club_id)
          .eq('status', 'approved'),
        supabase
          .from('bookings')
          .select('user_id')
          .eq('game_id', game.id)
          .neq('status', 'cancelled'),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const members = (memberResult.data || []).map((m: any) => ({ ...m.profile, user_id: m.user_id })).filter(Boolean);
      setClubMembers(members);
      setBookedUserIds(new Set((bookingResult.data || []).map((b) => b.user_id)));
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddPlayer = async (userId: string) => {
    if (!game) return;
    setAddingPlayer(userId);
    try {
      const result = await adminBookPlayer(game.id, userId);
      showToast(
        result.status === 'confirmed' ? 'Player added!' : 'Player added to waitlist',
        'success'
      );
      setBookedUserIds((prev) => new Set([...prev, userId]));
      await loadGame();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add player';
      showToast(message, 'error');
    } finally {
      setAddingPlayer(null);
    }
  };

  const handleCompletePayment = async () => {
    if (!game?.user_booking) return;
    setPaying(true);
    try {
      await processBookingPayment(game.user_booking.id, game.fee_amount, game.fee_currency);
      showToast('Payment successful! You\'re confirmed.', 'success');
      await loadGame();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      showToast(message, 'error');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1C1C1E] border-t-transparent" />
      </div>
    );
  }

  if (!game) {
    return <p className="text-center text-[#8E8E93] py-12">Game not found</p>;
  }

  const dateTime = new Date(game.date_time);
  const spotsLeft = game.max_spots - (game.confirmed_count || 0);
  const isFull = spotsLeft <= 0;
  const userBooking = game.user_booking;
  const isBooked = userBooking && userBooking.status !== 'cancelled';
  const isAdminOfGameClub = game.club_id ? isClubAdmin(game.club_id) : false;

  return (
    <div className="space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[#8E8E93] font-medium hover:text-[#1C1C1E] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header — iOS-style: big title, gray location, bold club link */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-[#1C1C1E] tracking-tight leading-tight">{game.title}</h1>
        {game.location && (
          <p className="text-[#8E8E93] flex items-center gap-1.5 text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            {game.location}
          </p>
        )}
        {game.club && (
          <p className="font-bold text-[#1C1C1E] flex items-center gap-1">
            {game.club.name}
            <ChevronRight className="h-4 w-4 text-[#C6C6C8]" />
          </p>
        )}
        <p className="text-[#8E8E93] flex items-center gap-1.5 text-sm">
          <Clock className="h-4 w-4 flex-shrink-0" />
          {format(dateTime, 'EEE, MMM d')} at {format(dateTime, 'h:mm a')}
        </p>
        <div className="flex gap-2 pt-1">
          <Badge label={SKILL_LEVEL_LABELS[game.skill_level] || game.skill_level} color={SKILL_LEVEL_COLORS[game.skill_level]} />
          <Badge label={GAME_FORMAT_LABELS[game.game_format] || game.game_format} color="#5856D6" />
          {game.requires_dupr && <Badge label="DUPR Required" color="#FF9500" />}
        </div>
      </div>

      {/* Booking actions — shown before venue info like the iOS app */}
      {isBooked ? (
        <>
          {/* Payment required banner for promoted waitlist players */}
          {userBooking.status === 'confirmed' && !userBooking.fee_paid && game.fee_amount > 0 && userBooking.promoted_at && (
            <div className="bg-white rounded-2xl border border-[#FFE5B4] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-[#FFF3E0] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-[#FF9500]" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#1C1C1E]">Payment Required</p>
                  <p className="text-sm text-[#8E8E93] mt-0.5">
                    A spot opened up from the waitlist! Complete payment to secure your spot.
                  </p>
                  <p className="text-xs text-[#FF9500] font-semibold mt-1">
                    Expires {formatDistanceToNow(
                      new Date(new Date(userBooking.promoted_at).getTime() + (game.payment_deadline_hours || 24) * 60 * 60 * 1000),
                      { addSuffix: true }
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCompletePayment}
                disabled={paying}
                className="w-full py-4 bg-[#1C1C1E] text-white font-semibold rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                Complete Payment — ${game.fee_amount.toFixed(2)}
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1C1C1E]">
                  {userBooking.status === 'confirmed' ? 'You\'re booked!' : 'You\'re on the waitlist'}
                </p>
                {userBooking.status === 'waitlisted' && userBooking.waitlist_position && (
                  <p className="text-sm text-[#8E8E93]">Position #{userBooking.waitlist_position}</p>
                )}
              </div>
              <Badge
                label={
                  userBooking.status === 'confirmed'
                    ? (!userBooking.fee_paid && game.fee_amount > 0 ? 'Awaiting Payment' : 'Confirmed')
                    : 'Waitlisted'
                }
                color={
                  userBooking.status === 'confirmed'
                    ? (!userBooking.fee_paid && game.fee_amount > 0 ? '#FF9500' : '#34C759')
                    : '#FF9500'
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {userBooking.status === 'confirmed' && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<CalendarPlus className="h-4 w-4" />}
                  onClick={() => downloadGameICS(game)}
                >
                  Add to Calendar
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="h-4 w-4" />}
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        </>
      ) : isAdminOfGameClub && game.fee_amount > 0 && !isFull ? (
        <div className="flex gap-3">
          <button
            onClick={() => attemptBook(false)}
            disabled={booking}
            className="flex-1 py-4 bg-white text-[#1C1C1E] font-semibold rounded-2xl text-base border border-[#E5E5EA] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {booking ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Book Free (Admin)
          </button>
          <button
            onClick={() => attemptBook(true)}
            disabled={booking}
            className="flex-1 py-4 bg-[#1C1C1E] text-white font-semibold rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {booking ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Book · ${game.fee_amount.toFixed(2)}
          </button>
        </div>
      ) : !isBooked ? (
        <button
          onClick={() => attemptBook(true)}
          disabled={booking}
          className="w-full py-4 bg-[#1C1C1E] text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-black transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.20)]"
        >
          {booking && <Loader2 className="h-5 w-5 animate-spin" />}
          {isFull
            ? 'Join Waitlist'
            : game.fee_amount > 0
              ? `Book Your Spot · $${game.fee_amount.toFixed(2)}`
              : 'Book Your Spot'}
        </button>
      ) : null}

      {/* Venue / details card — iOS-style with capacity bar */}
      <div>
        <h2 className="text-xl font-bold text-[#1C1C1E] mb-3">Venue</h2>
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Location row */}
          {game.location && (
            <div className="flex items-center gap-3 p-4 border-b border-[#F2F2F7]">
              <div className="h-9 w-9 rounded-full bg-[#F2F2F7] flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-[#8E8E93]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1C1C1E] truncate">{game.location}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#C6C6C8] flex-shrink-0" />
            </div>
          )}

          {/* Duration + Fee row */}
          <div className="flex items-center p-4 border-b border-[#F2F2F7]">
            <Clock className="h-4 w-4 text-[#8E8E93] mr-2 flex-shrink-0" />
            <span className="text-sm text-[#1C1C1E]">{Math.floor(game.duration_minutes / 60)}h {game.duration_minutes % 60 > 0 ? `${game.duration_minutes % 60}m` : ''}</span>
            {game.fee_amount > 0 && (
              <>
                <span className="flex-1" />
                <span className="text-sm font-semibold text-[#1C1C1E]">${game.fee_amount.toFixed(2)}</span>
              </>
            )}
          </div>

          {/* Capacity progress bar row */}
          <div className="flex items-center gap-3 p-4">
            <Users className="h-4 w-4 text-[#8E8E93] flex-shrink-0" />
            <div className="flex-1">
              <div className="w-full h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1C1C1E] rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((game.confirmed_count || 0) / game.max_spots) * 100)}%` }}
                />
              </div>
            </div>
            <span className="text-sm text-[#8E8E93] flex-shrink-0">
              {game.confirmed_count || 0}/{game.max_spots}
            </span>
          </div>
        </div>
      </div>

      {/* About This Event */}
      {(game.description || game.notes) && (
        <div>
          <h2 className="text-xl font-bold text-[#1C1C1E] mb-3">About This Event</h2>
          <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-4">
            {game.description && (
              <div>
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">
                  Format <span className="text-[#1C1C1E] normal-case font-bold text-sm tracking-normal">{GAME_FORMAT_LABELS[game.game_format] || game.game_format}</span>
                </p>
                <p className="text-[#1C1C1E] text-sm leading-relaxed">{game.description}</p>
              </div>
            )}
            {game.notes && (
              <div>
                <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wide mb-1.5">Notes</p>
                <p className="text-[#1C1C1E] text-sm leading-relaxed">{game.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Participants */}
      <div>
        <h2 className="text-xl font-bold text-[#1C1C1E] mb-3">Players</h2>
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
          <ParticipantList gameId={game.id} maxSpots={game.max_spots} />
          {isAdminOfGameClub && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              icon={<UserPlus className="h-4 w-4" />}
              onClick={openAddPlayer}
            >
              Add Player
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showCancelDialog}
        title="Cancel Booking"
        message="Are you sure you want to cancel your booking? This action cannot be undone."
        confirmLabel="Cancel Booking"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
      />

      {/* DUPR Confirmation Dialog */}
      {showDuprDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-5">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                <Trophy className="h-8 w-8 text-[#FF9500]" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-lg font-bold text-[#1C1C1E]">DUPR Rating Required</h2>
              <p className="text-sm text-[#8E8E93] mt-1">
                This game requires an up-to-date DUPR rating. Please confirm your rating is current before booking.
              </p>
            </div>

            <div className="bg-[#F2F2F7] rounded-2xl p-4 text-center">
              <p className="text-xs text-[#AEAEB2] uppercase tracking-wide mb-1">Your Current DUPR</p>
              {editingDupr ? (
                <div className="space-y-2 mt-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="8"
                    value={duprInput}
                    onChange={(e) => setDuprInput(e.target.value)}
                    placeholder="e.g. 3.50"
                    className="w-32 mx-auto block px-3 py-2 bg-white border border-[#E5E5EA] rounded-xl text-center text-lg font-bold text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#1C1C1E]/10 focus:border-[#C6C6C8]"
                    autoFocus
                  />
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingDupr(false)}
                      className="text-xs text-[#AEAEB2] hover:text-[#8E8E93]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingDupr}
                      onClick={async () => {
                        const val = parseFloat(duprInput);
                        if (isNaN(val) || val < 0 || val > 8) {
                          showToast('Enter a valid DUPR rating (0-8)', 'error');
                          return;
                        }
                        setSavingDupr(true);
                        try {
                          await updateProfile({ dupr_rating: val });
                          showToast('DUPR rating updated!', 'success');
                          setEditingDupr(false);
                        } catch {
                          showToast('Failed to update rating', 'error');
                        } finally {
                          setSavingDupr(false);
                        }
                      }}
                      className="text-xs font-semibold text-[#1C1C1E] hover:opacity-70"
                    >
                      {savingDupr ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-[#1C1C1E]">
                    {profile?.dupr_rating ? profile.dupr_rating.toFixed(3) : '--'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDuprInput(profile?.dupr_rating ? profile.dupr_rating.toFixed(3) : '');
                      setEditingDupr(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#8E8E93] hover:text-[#1C1C1E] mt-1.5"
                  >
                    <Pencil className="h-3 w-3" />
                    {profile?.dupr_rating ? 'Update rating' : 'Add rating'}
                  </button>
                </div>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={duprConfirmed}
                onChange={(e) => setDuprConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#E5E5EA] text-[#1C1C1E] focus:ring-[#1C1C1E]/20"
              />
              <span className="text-sm text-[#1C1C1E]">
                I confirm my DUPR rating is up to date and accurate
              </span>
            </label>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDuprDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!duprConfirmed}
                onClick={handleDuprConfirmAndBook}
              >
                Confirm & Book
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1C1C1E]">Add Player</h2>
              <button onClick={() => setShowAddPlayer(false)} className="text-[#AEAEB2] hover:text-[#1C1C1E]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AEAEB2]" />
              <input
                type="text"
                placeholder="Search members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-[#F2F2F7] border border-[#E5E5EA] rounded-2xl text-sm text-[#1C1C1E] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#1C1C1E]/10 focus:border-[#C6C6C8]"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#AEAEB2]" />
                </div>
              ) : (
                clubMembers
                  .filter((m) =>
                    !memberSearch || m.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                    m.email?.toLowerCase().includes(memberSearch.toLowerCase())
                  )
                  .map((member) => {
                    const isAlreadyBooked = bookedUserIds.has(member.id);
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 p-3 rounded-xl ${isAlreadyBooked ? 'opacity-50' : 'hover:bg-background'}`}
                      >
                        <div className="h-9 w-9 rounded-full bg-[#F2F2F7] flex items-center justify-center overflow-hidden flex-shrink-0">
                          {member.avatar_url ? (
                            <Image src={member.avatar_url} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <Users className="h-4 w-4 text-[#8E8E93]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1C1C1E] truncate">{member.full_name || 'Unknown'}</p>
                          <p className="text-xs text-[#AEAEB2] truncate">{member.email}</p>
                        </div>
                        {isAlreadyBooked ? (
                          <span className="text-xs text-[#AEAEB2]">Booked</span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddPlayer(member.id)}
                            loading={addingPlayer === member.id}
                            disabled={addingPlayer !== null}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    );
                  })
              )}
              {!loadingMembers && clubMembers.filter((m) =>
                !memberSearch || m.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                m.email?.toLowerCase().includes(memberSearch.toLowerCase())
              ).length === 0 && (
                <p className="text-center text-sm text-[#AEAEB2] py-6">No members found</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showConfirmation && game && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${confirmationStatus === 'confirmed' ? 'bg-[#E8F8ED]' : 'bg-[#FFF3E0]'}`}>
                {confirmationStatus === 'confirmed'
                  ? <CheckCircle2 className="h-10 w-10 text-[#34C759]" />
                  : <Clock className="h-10 w-10 text-[#FF9500]" />
                }
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#1C1C1E]">
                {confirmationStatus === 'confirmed' ? 'Booking Confirmed!' : 'Added to Waitlist!'}
              </h2>
              <p className="text-[#8E8E93] mt-1">
                {confirmationStatus === 'confirmed'
                  ? `You're all set for ${game.title}`
                  : `You've been added to the waitlist for ${game.title}`}
              </p>
              {confirmationStatus === 'waitlisted' && confirmationPosition && (
                <p className="text-sm font-semibold text-[#FF9500] mt-1">
                  Position #{confirmationPosition}
                </p>
              )}
            </div>

            <div className="bg-[#F2F2F7] rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#1C1C1E]">
                <Clock className="h-4 w-4 text-[#AEAEB2]" />
                {format(new Date(game.date_time), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
              </div>
              {game.location && (
                <div className="flex items-center gap-2 text-sm text-[#1C1C1E]">
                  <MapPin className="h-4 w-4 text-[#AEAEB2]" />
                  {game.location}
                </div>
              )}
              {adminFreeBookRef.current && game.fee_amount > 0 && (
                <div className="flex items-center gap-2 text-sm text-[#34C759]">
                  <CheckCircle2 className="h-4 w-4" />
                  Fee waived (admin privilege)
                </div>
              )}
            </div>

            {/* Waitlist process explanation */}
            {confirmationStatus === 'waitlisted' && (
              <div className="bg-[#F2F2F7] rounded-2xl p-4 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-[#8E8E93] flex-shrink-0" />
                  <p className="text-sm font-bold text-[#1C1C1E]">How the waitlist works</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="h-3 w-3 text-[#8E8E93]" />
                    </div>
                    <p className="text-xs text-[#8E8E93]">
                      We&apos;ll notify you by <strong className="text-[#1C1C1E]">email</strong> and <strong className="text-[#1C1C1E]">on the site</strong> when a spot opens up
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Timer className="h-3 w-3 text-[#8E8E93]" />
                    </div>
                    <p className="text-xs text-[#8E8E93]">
                      You&apos;ll have <strong className="text-[#1C1C1E]">1 hour</strong> to confirm and complete payment for your spot
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="h-3 w-3 text-[#8E8E93]" />
                    </div>
                    <p className="text-xs text-[#8E8E93]">
                      If you don&apos;t confirm in time, the spot passes to the next person on the list
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {confirmationStatus === 'confirmed' && (
                <Button
                  className="w-full"
                  icon={<CalendarPlus className="h-4 w-4" />}
                  onClick={() => {
                    downloadGameICS(game);
                    showToast('Calendar file downloaded!', 'success');
                  }}
                >
                  Add to Calendar
                </Button>
              )}
              <Link href="/dashboard">
                <Button variant="secondary" className="w-full" icon={<Home className="h-4 w-4" />}>
                  Browse More Games
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => setShowConfirmation(false)}
              >
                Back to Game Details
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
