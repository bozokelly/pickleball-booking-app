'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useClubStore } from '@/stores/clubStore';
import { supabase } from '@/lib/supabase';
import { Game } from '@/types/database';
import { Card, Button, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { SKILL_LEVEL_LABELS, SKILL_LEVEL_COLORS, GAME_FORMAT_LABELS } from '@/constants/theme';
import { Plus, MapPin, Users, Pencil, Clock, Trash2, LayoutGrid } from 'lucide-react';

export default function AdminPage() {
  const { myAdminClubs, fetchMyAdminClubs, deleteClub } = useClubStore();
  const { showToast } = useToast();
  const [clubGames, setClubGames] = useState<Record<string, Game[]>>({});
  const [deleteClubId, setDeleteClubId] = useState<string | null>(null);
  const [deletingClub, setDeletingClub] = useState(false);

  useEffect(() => {
    fetchMyAdminClubs();
  }, [fetchMyAdminClubs]);

  useEffect(() => {
    async function loadGames() {
      for (const club of myAdminClubs) {
        const { data } = await supabase
          .from('games')
          .select('*')
          .eq('club_id', club.id)
          .order('date_time', { ascending: false });
        if (data) {
          setClubGames((prev) => ({ ...prev, [club.id]: data }));
        }
      }
    }
    if (myAdminClubs.length > 0) loadGames();
  }, [myAdminClubs]);

  const handleDeleteClub = async () => {
    if (!deleteClubId) return;
    setDeletingClub(true);
    try {
      await deleteClub(deleteClubId);
      setClubGames((prev) => {
        const next = { ...prev };
        delete next[deleteClubId];
        return next;
      });
      showToast('Club deleted', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete club';
      showToast(message, 'error');
    } finally {
      setDeletingClub(false);
      setDeleteClubId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
        <Link href="/dashboard/admin/create-club">
          <Button size="sm" icon={<Plus className="h-4 w-4" />}>
            Create Club
          </Button>
        </Link>
      </div>

      {myAdminClubs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">You don&apos;t manage any clubs yet</p>
          <Link href="/dashboard/admin/create-club" className="text-primary text-sm hover:underline mt-2 inline-block">
            Create your first club
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {myAdminClubs.map((club) => {
            const games = clubGames[club.id] || [];
            return (
              <div key={club.id} className="space-y-3">
                {/* Club header */}
                <Card className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-text-primary">{club.name}</h3>
                      {club.location && (
                        <p className="text-sm text-text-secondary flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5" /> {club.location}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/admin/club/${club.id}/members`}>
                        <Button variant="outline" size="sm" icon={<Users className="h-4 w-4" />}>
                          Members
                        </Button>
                      </Link>
                      <Link href={`/dashboard/admin/create-game?clubId=${club.id}`}>
                        <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />}>
                          New Game
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => setDeleteClubId(club.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Games list */}
                {games.length === 0 ? (
                  <p className="text-sm text-text-tertiary pl-2">No games yet</p>
                ) : (
                  <div className="space-y-2 pl-2">
                    {games.map((game) => {
                      const dt = new Date(game.date_time);
                      return (
                        <Card key={game.id} className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-text-primary truncate">{game.title}</h4>
                                <Badge
                                  label={game.status}
                                  color={game.status === 'upcoming' ? '#34C759' : game.status === 'cancelled' ? '#FF3B30' : '#8E8E93'}
                                />
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-text-secondary">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {format(dt, 'MMM d, yyyy h:mm a')}
                                </span>
                                {game.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span className="truncate max-w-[150px]">{game.location}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {game.max_spots} spots
                                </span>
                              </div>
                              <div className="flex gap-2 mt-1.5">
                                <Badge label={SKILL_LEVEL_LABELS[game.skill_level] || game.skill_level} color={SKILL_LEVEL_COLORS[game.skill_level]} />
                                <Badge label={GAME_FORMAT_LABELS[game.game_format] || game.game_format} color="#5856D6" />
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Link href={`/dashboard/admin/schedule-game/${game.id}`}>
                                <Button variant="outline" size="sm" icon={<LayoutGrid className="h-4 w-4" />}>
                                  Schedule
                                </Button>
                              </Link>
                              <Link href={`/dashboard/admin/edit-game/${game.id}`}>
                                <Button variant="outline" size="sm" icon={<Pencil className="h-4 w-4" />}>
                                  Edit
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteClubId}
        title="Delete Club"
        message="Are you sure you want to delete this club? All games under this club will also be deleted. This action cannot be undone."
        confirmLabel="Delete Club"
        variant="danger"
        onConfirm={handleDeleteClub}
        onCancel={() => setDeleteClubId(null)}
      />
    </div>
  );
}
