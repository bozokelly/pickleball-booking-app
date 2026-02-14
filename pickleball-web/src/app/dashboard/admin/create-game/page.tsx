'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useClubStore } from '@/stores/clubStore';
import { Button, Input, Card, AddressAutocomplete } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { SkillLevel, GameFormat } from '@/types/database';
import { SKILL_LEVEL_LABELS, SKILL_LEVEL_COLORS, GAME_FORMAT_LABELS } from '@/constants/theme';
import { ArrowLeft } from 'lucide-react';

const skillLevels: SkillLevel[] = ['all', 'beginner', 'intermediate', 'advanced', 'pro'];
const gameFormats: GameFormat[] = ['singles', 'doubles', 'mixed_doubles', 'round_robin', 'open_play'];

function CreateGameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clubIdParam = searchParams.get('clubId');
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
  const [feeAmount, setFeeAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyAdminClubs();
  }, [fetchMyAdminClubs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId || !title.trim() || !date || !time) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const dateTime = new Date(`${date}T${time}`).toISOString();
      const userId = (await supabase.auth.getUser()).data.user!.id;

      const { error } = await supabase.from('games').insert({
        club_id: clubId,
        title: title.trim(),
        date_time: dateTime,
        duration_minutes: parseInt(duration),
        max_spots: parseInt(maxSpots),
        skill_level: skillLevel,
        game_format: gameFormat,
        location: location.trim() || null,
        fee_amount: feeAmount ? parseFloat(feeAmount) : 0,
        fee_currency: 'usd',
        description: description.trim() || null,
        notes: notes.trim() || null,
        created_by: userId,
        status: 'upcoming',
      });
      if (error) throw error;

      showToast('Game created!', 'success');
      router.push('/dashboard/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create game';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-text-primary">Create Game</h1>

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
            <Input label="Duration (min)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            <Input label="Max Spots" type="number" value={maxSpots} onChange={(e) => setMaxSpots(e.target.value)} />
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

          <AddressAutocomplete label="Location" placeholder="Court address" value={location} onChange={setLocation} />
          <Input label="Fee ($)" type="number" placeholder="0.00 (free)" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} hint="Leave empty for free games" />

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

          <Button type="submit" loading={loading} className="w-full">
            Create Game
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
