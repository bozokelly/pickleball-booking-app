'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card, AddressAutocomplete } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { SkillLevel, GameFormat } from '@/types/database';
import { SKILL_LEVEL_LABELS, SKILL_LEVEL_COLORS, GAME_FORMAT_LABELS } from '@/constants/theme';
import { getDefaultCurrency } from '@/utils/currency';
import { ArrowLeft, Loader2 } from 'lucide-react';

const skillLevels: SkillLevel[] = ['all', 'beginner', 'intermediate', 'advanced', 'pro'];
const gameFormats: GameFormat[] = ['singles', 'doubles', 'mixed_doubles', 'round_robin', 'open_play'];

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function calculateVisibleFrom(gameDate: string, gameTime: string, goLiveDay: number, goLiveTime: string): string {
  const gameDateTime = new Date(`${gameDate}T${gameTime}`);
  const gameDay = gameDateTime.getDay();
  let daysBack = gameDay - goLiveDay;
  if (daysBack <= 0) daysBack += 7;
  const visibleDate = new Date(gameDateTime);
  visibleDate.setDate(visibleDate.getDate() - daysBack);
  const [goH, goM] = goLiveTime.split(':').map(Number);
  visibleDate.setHours(goH, goM, 0, 0);
  return visibleDate.toISOString();
}

function CreateGameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clubIdParam = searchParams.get('clubId');
  const duplicateId = searchParams.get('duplicate');
  const { myAdminClubs, fetchMyAdminClubs } = useClubStore();
  const { showToast } = useToast();

  const [clubId, setClubId] = useState(clubIdParam || '');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [maxSpots, setMaxSpots] = useState('4');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('all');
  const [gameFormat, setGameFormat] = useState<GameFormat>('doubles');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [feeCurrency] = useState(() => getDefaultCurrency());
  const [feeAmount, setFeeAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [requiresDupr, setRequiresDupr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDuplicate, setLoadingDuplicate] = useState(!!duplicateId);

  // Recurring game state
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState('4');
  const [useGoLive, setUseGoLive] = useState(false);
  const [goLiveDay, setGoLiveDay] = useState('0');
  const [goLiveTime, setGoLiveTime] = useState('19:00');

  useEffect(() => {
    fetchMyAdminClubs();
  }, [fetchMyAdminClubs]);

  // Pre-fill from duplicate game
  useEffect(() => {
    if (!duplicateId) return;
    async function loadDuplicate() {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', duplicateId)
        .single();
      if (error || !data) {
        showToast('Could not load game to duplicate', 'error');
        setLoadingDuplicate(false);
        return;
      }
      setTitle(data.title);
      setDuration(data.duration_minutes.toString());
      setMaxSpots(data.max_spots.toString());
      setSkillLevel(data.skill_level);
      setGameFormat(data.game_format);
      setLocation(data.location || '');
      setLatitude(data.latitude ?? null);
      setLongitude(data.longitude ?? null);
      setFeeAmount(data.fee_amount > 0 ? data.fee_amount.toString() : '');
      setDescription(data.description || '');
      setNotes(data.notes || '');
      setRequiresDupr(data.requires_dupr || false);
      if (data.club_id) setClubId(data.club_id);
      setLoadingDuplicate(false);
    }
    loadDuplicate();
  }, [duplicateId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalGames = isRecurring ? Math.max(1, parseInt(repeatWeeks) || 1) : 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId || !title.trim() || !date || !time) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const baseGame = {
        club_id: clubId,
        title: title.trim(),
        duration_minutes: parseInt(duration),
        max_spots: parseInt(maxSpots),
        skill_level: skillLevel,
        game_format: gameFormat,
        location: location.trim() || null,
        latitude,
        longitude,
        fee_amount: feeAmount ? parseFloat(feeAmount) : 0,
        fee_currency: feeCurrency,
        description: description.trim() || null,
        notes: notes.trim() || null,
        requires_dupr: requiresDupr,
        created_by: userId,
        status: 'upcoming' as const,
      };

      if (!isRecurring) {
        const dateTime = new Date(`${date}T${time}`).toISOString();
        const { error } = await supabase.from('games').insert({
          ...baseGame,
          date_time: dateTime,
          visible_from: null,
          recurrence_group_id: null,
        });
        if (error) throw error;
      } else {
        const recurrenceGroupId = crypto.randomUUID();
        const weeks = Math.max(1, parseInt(repeatWeeks) || 1);
        const games = [];

        for (let i = 0; i < weeks; i++) {
          const gameDate = new Date(`${date}T${time}`);
          gameDate.setDate(gameDate.getDate() + i * 7);

          let visibleFrom: string | null = null;
          if (useGoLive) {
            const gameDateStr = gameDate.toISOString().split('T')[0];
            visibleFrom = calculateVisibleFrom(gameDateStr, time, parseInt(goLiveDay), goLiveTime);
          }

          games.push({
            ...baseGame,
            date_time: gameDate.toISOString(),
            visible_from: visibleFrom,
            recurrence_group_id: recurrenceGroupId,
          });
        }

        const { error } = await supabase.from('games').insert(games);
        if (error) throw error;
      }

      // Notify club members about new game(s)
      await supabase.rpc('notify_club_members', {
        p_club_id: clubId,
        p_title: 'New game available',
        p_body: isRecurring
          ? `${totalGames} new ${title.trim()} games have been posted`
          : `${title.trim()} has been posted`,
        p_type: 'new_game_available',
        p_reference_id: clubId,
        p_exclude_user_id: userId,
      });

      showToast(isRecurring ? `${totalGames} games created!` : 'Game created!', 'success');
      router.push('/dashboard/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create game';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDuplicate) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-text-primary">{duplicateId ? 'Duplicate Game' : 'Create Game'}</h1>
      {duplicateId && (
        <p className="text-sm text-text-secondary -mt-4">All details copied — just pick a new date and time.</p>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Club select */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Club</label>
            <select
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Select a club</option>
              {myAdminClubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          </div>

          <Input label="Title" placeholder="e.g. Wednesday Night Doubles" value={title} onChange={(e) => setTitle(e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (min)" type="number" min={15} max={480} value={duration} onChange={(e) => setDuration(e.target.value)} />
            <Input label="Max Spots" type="number" min={1} max={100} value={maxSpots} onChange={(e) => setMaxSpots(e.target.value)} />
          </div>

          {/* Skill level chips */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Skill Level</label>
            <div className="flex flex-wrap gap-2">
              {skillLevels.map((skill) => (
                <button key={skill} type="button" onClick={() => setSkillLevel(skill)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${skillLevel === skill ? 'text-white' : 'bg-background text-text-secondary'}`}
                  style={skillLevel === skill ? { backgroundColor: SKILL_LEVEL_COLORS[skill] } : undefined}
                >
                  {SKILL_LEVEL_LABELS[skill]}
                </button>
              ))}
            </div>
          </div>

          {/* Format chips */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Format</label>
            <div className="flex flex-wrap gap-2">
              {gameFormats.map((fmt) => (
                <button key={fmt} type="button" onClick={() => setGameFormat(fmt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${gameFormat === fmt ? 'bg-info text-white' : 'bg-background text-text-secondary'}`}
                >
                  {GAME_FORMAT_LABELS[fmt]}
                </button>
              ))}
            </div>
          </div>

          <AddressAutocomplete label="Location" placeholder="Court address" value={location} onChange={(val, coords) => { setLocation(val); if (coords) { setLatitude(coords.lat); setLongitude(coords.lng); } }} />
          <Input label="Fee" type="number" placeholder="0.00 (free)" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} hint="Leave empty for free games" />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="Describe the game..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="Any additional notes..." />
          </div>

          {/* DUPR Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">DUPR Game</p>
              <p className="text-xs text-text-tertiary">Players must confirm their DUPR is up to date before booking</p>
            </div>
            <button
              type="button"
              onClick={() => setRequiresDupr(!requiresDupr)}
              className={`relative w-11 h-6 rounded-full transition-colors ${requiresDupr ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${requiresDupr ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Recurring Game Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Recurring Game</p>
              <p className="text-xs text-text-tertiary">Create multiple weekly games at once</p>
            </div>
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isRecurring ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isRecurring ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Recurring options */}
          {isRecurring && (
            <div className="border border-border rounded-xl p-4 space-y-4">
              <Input
                label="Number of Weeks"
                type="number"
                value={repeatWeeks}
                onChange={(e) => setRepeatWeeks(e.target.value)}
                hint={`Will create ${totalGames} game${totalGames !== 1 ? 's' : ''}, each 7 days apart`}
              />

              {/* Go-Live Scheduler Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Schedule Go-Live</p>
                  <p className="text-xs text-text-tertiary">
                    {useGoLive ? 'Games release on a set day/time each week' : 'All games go live immediately'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseGoLive(!useGoLive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${useGoLive ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${useGoLive ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {useGoLive && (
                <div className="space-y-4 pl-1 border-l-2 border-primary/20 ml-1 pl-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Go-Live Day</label>
                    <select
                      value={goLiveDay}
                      onChange={(e) => setGoLiveDay(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    >
                      {DAY_LABELS.map((label, i) => (
                        <option key={i} value={i}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Go-Live Time</label>
                    <input
                      type="time"
                      value={goLiveTime}
                      onChange={(e) => setGoLiveTime(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <p className="text-xs text-text-tertiary">
                    Each game becomes bookable on this day/time of the preceding week
                  </p>
                </div>
              )}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {isRecurring ? `Create ${totalGames} Game${totalGames !== 1 ? 's' : ''}` : 'Create Game'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function CreateGamePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>}>
      <CreateGameForm />
    </Suspense>
  );
}
