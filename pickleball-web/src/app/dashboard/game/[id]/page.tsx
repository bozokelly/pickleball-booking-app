'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { Game } from '@/types/database';
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
  MessageCircle, XCircle, CheckCircle2, Home,
} from 'lucide-react';

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { fetchGameById, bookGame, cancelBooking } = useGameStore();
  const { session } = useAuthStore();
  const { showToast } = useToast();

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<'confirmed' | 'waitlisted'>('confirmed');

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

  const handleBook = async () => {
    if (!game) return;
    setBooking(true);
    try {
      const result = await bookGame(game.id);
      if (game.fee_amount > 0 && result.status === 'confirmed') {
        try {
          await processBookingPayment(result.id, game.fee_amount, game.fee_currency);
        } catch {
          await cancelBooking(result.id);
          showToast('Payment cancelled, booking rolled back', 'warning');
          await loadGame();
          return;
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
            <p>${game.fee_amount.toFixed(2)} {game.fee_currency.toUpperCase()}</p>
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
      </Card>

      {/* Booking status + actions */}
      {isBooked ? (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-text-primary">
                {userBooking.status === 'confirmed' ? 'You\'re booked!' : 'You\'re on the waitlist'}
              </p>
              {userBooking.status === 'waitlisted' && userBooking.waitlist_position && (
                <p className="text-sm text-text-secondary">Position #{userBooking.waitlist_position}</p>
              )}
            </div>
            <Badge
              label={userBooking.status === 'confirmed' ? 'Confirmed' : 'Waitlisted'}
              color={userBooking.status === 'confirmed' ? '#34C759' : '#FF9500'}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<CalendarPlus className="h-4 w-4" />}
              onClick={() => downloadGameICS(game)}
            >
              Add to Calendar
            </Button>
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
      ) : (
        <Button
          onClick={handleBook}
          loading={booking}
          className="w-full"
        >
          {isFull
            ? 'Join Waitlist'
            : game.fee_amount > 0
              ? `Book & Pay $${game.fee_amount.toFixed(2)}`
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
