import { GameFormat } from '@/types/database';

export interface SchedulePlayer {
  id: string;
  name: string;
  duprRating: number | null;
  avatarUrl: string | null;
}

export interface CourtAssignment {
  courtNumber: number;
  team1: SchedulePlayer[];
  team2: SchedulePlayer[];
}

export interface Round {
  roundNumber: number;
  courts: CourtAssignment[];
  sittingOut: SchedulePlayer[];
}

export interface Schedule {
  rounds: Round[];
  method: AllocationMethod;
  playersPerCourt: number;
  totalPlayers: number;
  totalCourts: number;
}

export type AllocationMethod =
  | 'random'
  | 'dupr_balanced'
  | 'dupr_competitive'
  | 'king_of_the_court'
  | 'round_robin';

export const ALLOCATION_LABELS: Record<AllocationMethod, string> = {
  random: 'Random',
  dupr_balanced: 'DUPR Balanced',
  dupr_competitive: 'DUPR Competitive',
  king_of_the_court: 'King of the Court',
  round_robin: 'Round Robin',
};

export const ALLOCATION_DESCRIPTIONS: Record<AllocationMethod, string> = {
  random: 'Shuffle and assign randomly each round',
  dupr_balanced: 'Mix skill levels per court — high paired with low',
  dupr_competitive: 'Group similar skill levels on each court',
  king_of_the_court: 'Winners stay on court 1, losers rotate down',
  round_robin: 'Rotate partners so everyone plays with everyone',
};

export function getPlayersPerCourt(format: GameFormat): number {
  return format === 'singles' ? 2 : 4;
}
