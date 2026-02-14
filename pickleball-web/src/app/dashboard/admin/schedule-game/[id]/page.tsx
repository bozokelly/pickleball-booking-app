'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Card, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Game, Profile } from '@/types/database';
import {
  SchedulePlayer,
  AllocationMethod,
  Schedule,
  Round,
  ALLOCATION_LABELS,
  ALLOCATION_DESCRIPTIONS,
  getPlayersPerCourt,
} from '@/lib/scheduling/types';
import {
  generateSchedule,
  generateKingRound1,
  generateNextKingRound,
} from '@/lib/scheduling/algorithms';
import {
  ArrowLeft,
  Loader2,
  CheckSquare,
  Square,
  Trophy,
  Shuffle,
  Printer,
  RefreshCw,
  Crown,
  ChevronDown,
  ChevronUp,
  UserMinus,
} from 'lucide-react';

interface ConfirmedPlayer {
  id: string;
  profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'dupr_rating'>;
}

const METHODS: AllocationMethod[] = [
  'random',
  'dupr_balanced',
  'dupr_competitive',
  'king_of_the_court',
  'round_robin',
];

export default function ScheduleGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gameId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<ConfirmedPlayer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Settings
  const [numCourts, setNumCourts] = useState(2);
  const [numRounds, setNumRounds] = useState(3);
  const [method, setMethod] = useState<AllocationMethod>('random');

  // Schedule
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  // King of the Court state
  const [kingRounds, setKingRounds] = useState<Round[]>([]);
  const [kingSitOutCounts, setKingSitOutCounts] = useState<Map<string, number>>(new Map());
  const [kingWinners, setKingWinners] = useState<Map<number, 1 | 2>>(new Map());
  const [allKingPlayers, setAllKingPlayers] = useState<SchedulePlayer[]>([]);

  useEffect(() => {
    async function load() {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError || !gameData) {
        showToast('Game not found', 'error');
        router.back();
        return;
      }
      setGame(gameData);

      const { data: bookings } = await supabase
        .from('bookings')
        .select('user_id, profile:profiles(id, full_name, avatar_url, dupr_rating)')
        .eq('game_id', gameId)
        .eq('status', 'confirmed');

      if (bookings) {
        const confirmed: ConfirmedPlayer[] = bookings
          .filter((b: any) => b.profile)
          .map((b: any) => ({
            id: b.user_id,
            profile: b.profile,
          }));
        setPlayers(confirmed);
        setSelectedIds(new Set(confirmed.map((p) => p.id)));
      }
      setLoading(false);
    }
    load();
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPlayers: SchedulePlayer[] = players
    .filter((p) => selectedIds.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.profile.full_name || 'Unknown',
      duprRating: p.profile.dupr_rating,
      avatarUrl: p.profile.avatar_url,
    }));

  const playersPerCourt = game ? getPlayersPerCourt(game.game_format) : 4;
  const minPlayers = playersPerCourt;
  const maxCourts = Math.floor(selectedPlayers.length / playersPerCourt) || 1;

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === players.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(players.map((p) => p.id)));
    }
  };

  const handleGenerate = useCallback(() => {
    if (selectedPlayers.length < minPlayers) {
      showToast(`Need at least ${minPlayers} players`, 'error');
      return;
    }

    if (method === 'king_of_the_court') {
      const { round, sitOutCounts } = generateKingRound1(
        selectedPlayers,
        numCourts,
        playersPerCourt
      );
      setKingRounds([round]);
      setKingSitOutCounts(sitOutCounts);
      setKingWinners(new Map());
      setAllKingPlayers(selectedPlayers);
      setSchedule(null);
      setExpandedRound(1);
    } else {
      const result = generateSchedule(
        selectedPlayers,
        numCourts,
        numRounds,
        method,
        game!.game_format
      );
      setSchedule(result);
      setKingRounds([]);
      setExpandedRound(1);
    }
  }, [selectedPlayers, numCourts, numRounds, method, playersPerCourt, minPlayers, game, showToast]);

  const handleKingNextRound = () => {
    const currentRound = kingRounds[kingRounds.length - 1];

    // Check all courts have a winner selected
    for (const court of currentRound.courts) {
      if (!kingWinners.has(court.courtNumber)) {
        showToast('Select a winner for every court', 'error');
        return;
      }
    }

    const { round, sitOutCounts } = generateNextKingRound(
      currentRound,
      kingWinners,
      allKingPlayers,
      numCourts,
      playersPerCourt,
      kingRounds.length + 1,
      kingSitOutCounts
    );

    setKingRounds((prev) => [...prev, round]);
    setKingSitOutCounts(sitOutCounts);
    setKingWinners(new Map());
    setExpandedRound(round.roundNumber);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isKing = method === 'king_of_the_court';
  const displayRounds = isKing ? kingRounds : schedule?.rounds || [];
  const hasSchedule = displayRounds.length > 0;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Schedule Game</h1>
        <p className="text-sm text-text-secondary mt-1">{game?.title}</p>
      </div>

      {/* 1. Player Selection */}
      <Card className="p-5 print:hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Players ({selectedIds.size}/{players.length})
          </h2>
          <button
            onClick={toggleAll}
            className="text-xs text-primary hover:underline font-medium"
          >
            {selectedIds.size === players.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {players.length === 0 ? (
          <p className="text-sm text-text-tertiary">No confirmed players yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {players.map((p) => {
              const selected = selectedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlayer(p.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                    selected
                      ? 'bg-primary/5 border border-primary/20'
                      : 'bg-background/60 border border-transparent hover:bg-background'
                  }`}
                >
                  {selected ? (
                    <CheckSquare className="h-4.5 w-4.5 text-primary flex-shrink-0" />
                  ) : (
                    <Square className="h-4.5 w-4.5 text-text-tertiary flex-shrink-0" />
                  )}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {p.profile.avatar_url ? (
                      <img
                        src={p.profile.avatar_url}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {p.profile.full_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-text-primary truncate">
                      {p.profile.full_name || 'Unknown'}
                    </span>
                  </div>
                  {p.profile.dupr_rating && (
                    <Badge
                      label={p.profile.dupr_rating.toFixed(1)}
                      color="#FF9500"
                      className="flex-shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* 2. Settings */}
      <Card className="p-5 print:hidden">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Settings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Courts
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNumCourts(Math.max(1, numCourts - 1))}
                className="w-9 h-9 rounded-lg bg-background text-text-primary font-bold hover:bg-border transition-colors"
              >
                -
              </button>
              <span className="w-10 text-center font-semibold text-text-primary text-lg">
                {numCourts}
              </span>
              <button
                onClick={() => setNumCourts(Math.min(maxCourts, numCourts + 1))}
                className="w-9 h-9 rounded-lg bg-background text-text-primary font-bold hover:bg-border transition-colors"
              >
                +
              </button>
            </div>
            {maxCourts > 0 && (
              <p className="text-xs text-text-tertiary mt-1">Max {maxCourts} courts</p>
            )}
          </div>

          {method !== 'king_of_the_court' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Rounds
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNumRounds(Math.max(1, numRounds - 1))}
                  className="w-9 h-9 rounded-lg bg-background text-text-primary font-bold hover:bg-border transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-semibold text-text-primary text-lg">
                  {numRounds}
                </span>
                <button
                  onClick={() => setNumRounds(numRounds + 1)}
                  className="w-9 h-9 rounded-lg bg-background text-text-primary font-bold hover:bg-border transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Method selector */}
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Allocation Method
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                method === m
                  ? 'bg-primary text-white'
                  : 'bg-background text-text-secondary hover:bg-border'
              }`}
            >
              {ALLOCATION_LABELS[m]}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-tertiary mb-4">{ALLOCATION_DESCRIPTIONS[method]}</p>

        {/* Capacity info */}
        {selectedPlayers.length > numCourts * playersPerCourt && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-xl mb-4">
            <UserMinus className="h-4 w-4 text-warning flex-shrink-0" />
            <p className="text-xs text-text-secondary">
              {selectedPlayers.length - numCourts * playersPerCourt} player(s) will sit out each
              round, rotating fairly.
            </p>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          icon={<Shuffle className="h-4 w-4" />}
          className="w-full"
          disabled={selectedPlayers.length < minPlayers}
        >
          Generate Schedule
        </Button>
      </Card>

      {/* 3. Schedule Display */}
      {hasSchedule && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">
              {isKing ? 'King of the Court' : ALLOCATION_LABELS[schedule!.method]}
            </h2>
            <div className="flex gap-2 print:hidden">
              <Button variant="ghost" size="sm" onClick={handleGenerate} icon={<RefreshCw className="h-4 w-4" />}>
                Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} icon={<Printer className="h-4 w-4" />}>
                Print
              </Button>
            </div>
          </div>

          {displayRounds.map((round) => {
            const isExpanded = expandedRound === round.roundNumber;
            const isCurrentKingRound = isKing && round.roundNumber === kingRounds.length;

            return (
              <Card key={round.roundNumber} className="overflow-hidden">
                {/* Round header */}
                <button
                  onClick={() => setExpandedRound(isExpanded ? null : round.roundNumber)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-background/50 transition-colors print:hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    {isKing && round.roundNumber === 1 && (
                      <Crown className="h-4 w-4 text-warning" />
                    )}
                    <h3 className="font-semibold text-text-primary">
                      Round {round.roundNumber}
                    </h3>
                    {round.sittingOut.length > 0 && (
                      <span className="text-xs text-text-tertiary">
                        ({round.sittingOut.length} sitting out)
                      </span>
                    )}
                  </div>
                  <span className="print:hidden">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-tertiary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-tertiary" />
                    )}
                  </span>
                </button>

                {/* Round body */}
                {(isExpanded || typeof window !== 'undefined' && window.matchMedia?.('print')?.matches) && (
                  <div className="px-4 pb-4 space-y-3 print:!block">
                    {/* Courts grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {round.courts.map((court) => (
                        <div
                          key={court.courtNumber}
                          className="bg-background/60 rounded-xl p-3 border border-border/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                              Court {court.courtNumber}
                            </span>
                            {isKing && isCurrentKingRound && (
                              <span className="text-[10px] text-text-tertiary">Tap winner</span>
                            )}
                          </div>

                          {/* Team 1 */}
                          <div
                            className={`rounded-lg p-2 mb-1.5 transition-colors ${
                              isKing && isCurrentKingRound
                                ? 'cursor-pointer hover:bg-success/10'
                                : ''
                            } ${
                              kingWinners.get(court.courtNumber) === 1
                                ? 'bg-success/15 ring-1 ring-success/40'
                                : 'bg-white/60'
                            }`}
                            onClick={() => {
                              if (isKing && isCurrentKingRound) {
                                setKingWinners((prev) => {
                                  const next = new Map(prev);
                                  next.set(court.courtNumber, 1);
                                  return next;
                                });
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-semibold text-text-tertiary uppercase">
                                Team 1
                              </span>
                              {kingWinners.get(court.courtNumber) === 1 && (
                                <Trophy className="h-3.5 w-3.5 text-success" />
                              )}
                            </div>
                            {court.team1.map((p) => (
                              <div key={p.id} className="flex items-center gap-2 py-0.5">
                                {p.avatarUrl ? (
                                  <img
                                    src={p.avatarUrl}
                                    alt=""
                                    className="h-5 w-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-primary">
                                      {p.name[0]?.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <span className="text-sm text-text-primary">{p.name}</span>
                                {p.duprRating && (
                                  <span className="text-[10px] text-text-tertiary ml-auto">
                                    {p.duprRating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* VS separator */}
                          <div className="text-center text-[10px] font-bold text-text-tertiary tracking-widest">
                            VS
                          </div>

                          {/* Team 2 */}
                          <div
                            className={`rounded-lg p-2 mt-1.5 transition-colors ${
                              isKing && isCurrentKingRound
                                ? 'cursor-pointer hover:bg-success/10'
                                : ''
                            } ${
                              kingWinners.get(court.courtNumber) === 2
                                ? 'bg-success/15 ring-1 ring-success/40'
                                : 'bg-white/60'
                            }`}
                            onClick={() => {
                              if (isKing && isCurrentKingRound) {
                                setKingWinners((prev) => {
                                  const next = new Map(prev);
                                  next.set(court.courtNumber, 2);
                                  return next;
                                });
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-semibold text-text-tertiary uppercase">
                                Team 2
                              </span>
                              {kingWinners.get(court.courtNumber) === 2 && (
                                <Trophy className="h-3.5 w-3.5 text-success" />
                              )}
                            </div>
                            {court.team2.map((p) => (
                              <div key={p.id} className="flex items-center gap-2 py-0.5">
                                {p.avatarUrl ? (
                                  <img
                                    src={p.avatarUrl}
                                    alt=""
                                    className="h-5 w-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-primary">
                                      {p.name[0]?.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <span className="text-sm text-text-primary">{p.name}</span>
                                {p.duprRating && (
                                  <span className="text-[10px] text-text-tertiary ml-auto">
                                    {p.duprRating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sitting out */}
                    {round.sittingOut.length > 0 && (
                      <div className="bg-warning/5 border border-warning/20 rounded-xl p-3">
                        <span className="text-[10px] font-semibold text-warning uppercase tracking-wider">
                          Sitting Out
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {round.sittingOut.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-1.5 bg-white/80 rounded-lg px-2 py-1"
                            >
                              {p.avatarUrl ? (
                                <img
                                  src={p.avatarUrl}
                                  alt=""
                                  className="h-4 w-4 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-[8px] font-bold text-primary">
                                    {p.name[0]?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="text-xs text-text-secondary">{p.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* King of the Court: Next Round button */}
                    {isKing && isCurrentKingRound && (
                      <Button
                        onClick={handleKingNextRound}
                        icon={<Crown className="h-4 w-4" />}
                        className="w-full"
                      >
                        Next Round
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
