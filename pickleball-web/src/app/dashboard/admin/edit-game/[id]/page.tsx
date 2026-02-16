'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card, AddressAutocomplete } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Game, SkillLevel, GameFormat } from '@/types/database';
import { SKILL_LEVEL_LABELS, SKILL_LEVEL_COLORS, GAME_FORMAT_LABELS } from '@/constants/theme';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';

const skillLevels: SkillLevel[] = ['all', 'beginner', 'intermediate', 'advanced', 'pro'];
const gameFormats: GameFormat[] = ['singles', 'doubles', 'mixed_doubles', 'round_robin', 'open_play'];

export default function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gameId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [maxSpots, setMaxSpots] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('all');
  const [gameFormat, setGameFormat] = useState<GameFormat>('doubles');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [feeCurrency, setFeeCurrency] = useState('usd');
  const [feeAmount, setFeeAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('upcoming');

  useEffect(() => {
    async function loadGame() {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
      if (error || !data) {
        showToast('Game not found', 'error');
        router.back();
        return;
      }
      const dt = new Date(data.date_time);
      setTitle(data.title);
      setDate(dt.toISOString().split('T')[0]);
      setTime(dt.toTimeString().slice(0, 5));
      setDuration(data.duration_minutes.toString());
      setMaxSpots(data.max_spots.toString());
      setSkillLevel(data.skill_level);
      setGameFormat(data.game_format);
      setLocation(data.location || '');
      setLatitude(data.latitude ?? null);
      setLongitude(data.longitude ?? null);
      setFeeCurrency(data.fee_currency || 'usd');
      setFeeAmount(data.fee_amount > 0 ? data.fee_amount.toString() : '');
      setDescription(data.description || '');
      setNotes(data.notes || '');
      setStatus(data.status);
      setLoading(false);
    }
    loadGame();
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const dateTime = new Date(`${date}T${time}`).toISOString();
      const { error } = await supabase.from('games').update({
        title: title.trim(),
        date_time: dateTime,
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
        status,
      }).eq('id', gameId);

      if (error) throw new Error(error.message);
      showToast('Game updated!', 'success');
      router.push('/dashboard/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update game';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('games').delete().eq('id', gameId);
      if (error) throw new Error(error.message);
      showToast('Game deleted', 'success');
      router.push('/dashboard/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete game';
      showToast(message, 'error');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
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
      <h1 className="text-2xl font-bold text-text-primary">Edit Game</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <AddressAutocomplete label="Location" value={location} onChange={(val, coords) => { setLocation(val); if (coords) { setLatitude(coords.lat); setLongitude(coords.lng); } }} placeholder="Court address" />
          <Input label="Fee" type="number" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} placeholder="0.00 (free)" hint="Leave empty for free games" />

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all">
              <option value="upcoming">Upcoming</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-all"
              placeholder="Describe the game..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-all"
              placeholder="Any additional notes..." />
          </div>

          <Button type="submit" loading={saving} className="w-full">
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 border-error/30">
        <h3 className="text-sm font-semibold text-error mb-2">Danger Zone</h3>
        <p className="text-sm text-text-secondary mb-4">
          Permanently delete this game and all associated bookings. This cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 className="h-4 w-4" />}
          loading={deleting}
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete Game
        </Button>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Game"
        message="Are you sure you want to delete this game? All bookings will be removed. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
