'use client';

import { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
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
  MessageCircle, XCircle, CheckCircle2, Home, Trophy, AlertTriangle,
  CreditCard, Pencil, UserPlus, Search, X, Loader2,
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
      // Fetch club members
      const { data: memberData } = await supabase
        .from('club_members')
        .select('user_id, profile:profiles!club_members_user_id_fkey(id, full_name, avatar_url, email)')
        .eq('club_id', game.club_id)
        .eq('status', 'approved');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const members = (memberData || []).map((m: any) => ({ ...m.profile, user_id: m.user_id })).filter(Boolean);
      setClubMembers(members);

      // Fetch already booked user IDs
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('game_id', game.id)
        .neq('status', 'cancelled');
      setBookedUserIds(new Set((bookingData || []).map((b) => b.user_id)));
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!game) {
    return <p className="text-center text-text-secondary py-12">Game not found</p>;
  }

  const dateTime = new Date(game.date_time);
  const spotsLeft = game.max_spots - (game.confirmed_count || 0);
  const isFull = spotsLeft <= 0;
  const userBooking = game.user_booking;
  const isBooked = userBooking && userBooking.status !== 'cancelled';
  const isAdminOfGameClub = game.club_id ? isClubAdmin(game.club_id) : false;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{game.title}</h1>
        {game.club && <p className="text-text-secondary">{game.club.name}</p>}
        <div className="flex gap-2 mt-2">
          <Badge label={SKILL_LEVEL_LABELS[game.skill_level] || game.skill_level} color={SKILL_LEVEL_COLORS[game.skill_level]} />
          <Badge label={GAME_FORMAT_LABELS[game.game_format] || game.game_format} color="#5856D6" />
          {game.requires_dupr && <Badge label="DUPR Required" color="#FF9500" />}
        </div>
      </div>

      {/* Details card */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-3 text-text-primary">
          <Clock className="h-5 w-5 text-text-tertiary" />
          <div>
            <p className="font-medium">{format(dateTime, 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-sm text-text-secondary">{format(dateTime, 'h:mm a')} ({game.duration_minutes} min)</p>
          </div>
        </div>
        {game.location && (
          <div className="flex items-center gap-3 text-text-primary">
            <MapPin className="h-5 w-5 text-text-tertiary" />
            <p>{game.location}</p>
          </div>
        )}
        <div className="flex items-center gap-3 text-text-primary">
          <Users className="h-5 w-5 text-text-tertiary" />
          <p>{game.confirmed_count}/{game.max_spots} players {isFull ? '(Full)' : `(${spotsLeft} left)`}</p>
        </div>
        {game.fee_amount > 0 && (
          <div className="flex items-center gap-3 text-text-primary">
            <DollarSign className="h-5 w-5 text-text-tertiary" />
            <p>{game.fee_amount.toFixed(2)}</p>
          </div>
        )}
      </Card>

      {/* Description / Notes */}
      {(game.description || game.notes) && (
        <Card className="p-5 space-y-3">
          {game.description && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-1">Description</h3>
              <p className="text-text-primary">{game.description}</p>
            </div>
          )}
          {game.notes && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-1">Notes</h3>
              <p className="text-text-primary">{game.notes}</p>
            </div>
          )}
        </Card>
      )}

      {/* Participants */}
      <Card className="p-5">
        <ParticipantList gameId={game.id} maxSpots={game.max_spots} />
        {isAdminOfGameClub && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={openAddPlayer}
          >
            Add Player
          </Button>
        )}
      </Card>

      {/* Booking status + actions */}
      {isBooked ? (
        <>
          {/* Payment required banner for promoted waitlist players */}
          {userBooking.status === 'confirmed' && !userBooking.fee_paid && game.fee_amount > 0 && userBooking.promoted_at && (
            <Card className="p-5 space-y-3 border-warning/30 bg-warning/5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text-primary">Payment Required</p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    A spot opened up from the waitlist! Complete payment to secure your spot.
                  </p>
                  <p className="text-xs text-warning font-medium mt-1">
                    Expires {formatDistanceToNow(
                      new Date(new Date(userBooking.promoted_at).getTime() + (game.payment_deadline_hours || 24) * 60 * 60 * 1000),
                      { addSuffix: true }
                    )}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleCompletePayment}
                loading={paying}
                className="w-full"
                icon={<CreditCard className="h-4 w-4" />}
              >
                Complete Payment — {game.fee_amount.toFixed(2)}
              </Button>
            </Card>
          )}

          <Card className="p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-text-primary">
                  {userBooking.status === 'confirmed' ? 'You\'re booked!' : 'You\'re on the waitlist'}
                </p>
                {userBooking.status === 'waitlisted' && userBooking.waitlist_position && (
                  <p className="text-sm text-text-secondary">Position #{userBooking.waitlist_position}</p>
                )}
                {userBooking.status === 'confirmed' && !userBooking.fee_paid && game.fee_amount > 0 && (
                  <p className="text-xs text-warning mt-0.5">Payment pending</p>
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
                  variant="outline"
                  size="sm"
                  icon={<CalendarPlus className="h-4 w-4" />}
                  onClick={() => downloadGameICS(game)}
                >
                  Add to Calendar
                </Button>
              )}
              <Link href={`/dashboard/game/${game.id}/chat`}>
                <Button variant="outline" size="sm" icon={<MessageCircle className="h-4 w-4" />}>
                  Chat
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="h-4 w-4" />}
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </>
      ) : isAdminOfGameClub && game.fee_amount > 0 && !isFull ? (
        <div className="flex gap-3">
          <Button
            onClick={() => attemptBook(false)}
            loading={booking}
            variant="secondary"
            className="flex-1"
          >
            Book Free (Admin)
          </Button>
          <Button
            onClick={() => attemptBook(true)}
            loading={booking}
            className="flex-1"
          >
            Book & Pay {game.fee_amount.toFixed(2)}
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => attemptBook(true)}
          loading={booking}
          className="w-full"
        >
          {isFull
            ? 'Join Waitlist'
            : game.fee_amount > 0
              ? `Book & Pay ${game.fee_amount.toFixed(2)}`
              : 'Book Spot'}
        </Button>
      )}

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
              <div className="h-14 w-14 rounded-full bg-warning/10 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-warning" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-lg font-bold text-text-primary">DUPR Rating Required</h2>
              <p className="text-sm text-text-secondary mt-1">
                This game requires an up-to-date DUPR rating. Please confirm your rating is current before booking.
              </p>
            </div>

            <div className="bg-background rounded-xl p-4 text-center">
              <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Your Current DUPR</p>
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
                    className="w-32 mx-auto block px-3 py-2 bg-white border border-border rounded-xl text-center text-lg font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    autoFocus
                  />
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingDupr(false)}
                      className="text-xs text-text-tertiary hover:text-text-secondary"
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
                      className="text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      {savingDupr ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-text-primary">
                    {profile?.dupr_rating ? profile.dupr_rating.toFixed(3) : '--'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDuprInput(profile?.dupr_rating ? profile.dupr_rating.toFixed(3) : '');
                      setEditingDupr(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1.5"
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
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-text-primary">
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
              <h2 className="text-lg font-bold text-text-primary">Add Player</h2>
              <button onClick={() => setShowAddPlayer(false)} className="text-text-tertiary hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <Users className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{member.full_name || 'Unknown'}</p>
                          <p className="text-xs text-text-tertiary truncate">{member.email}</p>
                        </div>
                        {isAlreadyBooked ? (
                          <span className="text-xs text-text-tertiary">Booked</span>
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
                <p className="text-center text-sm text-text-tertiary py-6">No members found</p>
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
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${confirmationStatus === 'confirmed' ? 'bg-success/10' : 'bg-warning/10'}`}>
                <CheckCircle2 className={`h-10 w-10 ${confirmationStatus === 'confirmed' ? 'text-success' : 'text-warning'}`} />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {confirmationStatus === 'confirmed' ? 'Booking Confirmed!' : 'Added to Waitlist!'}
              </h2>
              <p className="text-text-secondary mt-1">
                {confirmationStatus === 'confirmed'
                  ? `You're all set for ${game.title}`
                  : `You've been added to the waitlist for ${game.title}`}
              </p>
            </div>

            <div className="bg-background rounded-xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Clock className="h-4 w-4 text-text-tertiary" />
                {format(new Date(game.date_time), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
              </div>
              {game.location && (
                <div className="flex items-center gap-2 text-sm text-text-primary">
                  <MapPin className="h-4 w-4 text-text-tertiary" />
                  {game.location}
                </div>
              )}
              {adminFreeBookRef.current && game.fee_amount > 0 && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Fee waived (admin privilege)
                </div>
              )}
            </div>

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
