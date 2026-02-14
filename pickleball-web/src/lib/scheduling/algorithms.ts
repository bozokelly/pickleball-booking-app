import { GameFormat } from '@/types/database';
import {
  SchedulePlayer,
  CourtAssignment,
  Round,
  Schedule,
  AllocationMethod,
  getPlayersPerCourt,
} from './types';

// ── Utilities ──────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function assignToCourts(
  activePlayers: SchedulePlayer[],
  numCourts: number,
  playersPerCourt: number
): CourtAssignment[] {
  const teamSize = playersPerCourt / 2;
  const courts: CourtAssignment[] = [];
  for (let c = 0; c < numCourts; c++) {
    const start = c * playersPerCourt;
    const group = activePlayers.slice(start, start + playersPerCourt);
    courts.push({
      courtNumber: c + 1,
      team1: group.slice(0, teamSize),
      team2: group.slice(teamSize, playersPerCourt),
    });
  }
  return courts;
}

// ── Fair Sub Rotation ──────────────────────────────────────
// Guarantees: no one sits out twice before everyone has sat out once.

function computeSubSchedule(
  players: SchedulePlayer[],
  numCourts: number,
  playersPerCourt: number,
  numRounds: number
): SchedulePlayer[][] {
  const capacity = numCourts * playersPerCourt;
  const subsPerRound = Math.max(0, players.length - capacity);

  if (subsPerRound <= 0) {
    return Array.from({ length: numRounds }, () => []);
  }

  const sitOutCounts = new Map<string, number>();
  players.forEach((p) => sitOutCounts.set(p.id, 0));

  const schedule: SchedulePlayer[][] = [];

  for (let r = 0; r < numRounds; r++) {
    // Sort ascending by sit-out count, break ties randomly
    const candidates = shuffle([...players]).sort(
      (a, b) => (sitOutCounts.get(a.id)! - sitOutCounts.get(b.id)!)
    );

    // Those with the HIGHEST sit-out count stay; lowest sit out
    // Actually we want to pick those who have sat out LEAST to sit out next
    // No — we want fairness: pick those who have sat out the LEAST to sit out
    // Wait — that's backwards. We want those who HAVEN'T sat out yet to take their turn.
    // Correct: sort ascending, the ones at the END have sat out most.
    // We want the ones at the END (most sat out) to play, and the ones in the middle
    // No. Think simply: we want the people who have sat out the LEAST to be the next subs.
    // This ensures everyone gets a turn before repeats.

    // Sort descending by count — those who've sat out MOST play first
    // The last `subsPerRound` in this order are those who've sat out LEAST → they sub
    const sorted = shuffle([...players]).sort(
      (a, b) => (sitOutCounts.get(b.id)! - sitOutCounts.get(a.id)!)
    );

    const subs = sorted.slice(sorted.length - subsPerRound);
    subs.forEach((p) => sitOutCounts.set(p.id, sitOutCounts.get(p.id)! + 1));
    schedule.push(subs);
  }

  return schedule;
}

// ── 1. Random ──────────────────────────────────────────────

function generateRandom(
  players: SchedulePlayer[],
  numCourts: number,
  numRounds: number,
  playersPerCourt: number
): Schedule {
  const subSchedule = computeSubSchedule(players, numCourts, playersPerCourt, numRounds);
  const rounds: Round[] = [];

  for (let r = 0; r < numRounds; r++) {
    const subIds = new Set(subSchedule[r].map((s) => s.id));
    const active = shuffle(players.filter((p) => !subIds.has(p.id)));

    rounds.push({
      roundNumber: r + 1,
      courts: assignToCourts(active, numCourts, playersPerCourt),
      sittingOut: subSchedule[r],
    });
  }

  return { rounds, method: 'random', playersPerCourt, totalPlayers: players.length, totalCourts: numCourts };
}

// ── 2. DUPR Balanced (snake draft — mix skills per court) ──

function generateDuprBalanced(
  players: SchedulePlayer[],
  numCourts: number,
  numRounds: number,
  playersPerCourt: number
): Schedule {
  const subSchedule = computeSubSchedule(players, numCourts, playersPerCourt, numRounds);
  const rounds: Round[] = [];
  const teamSize = playersPerCourt / 2;

  for (let r = 0; r < numRounds; r++) {
    const subIds = new Set(subSchedule[r].map((s) => s.id));
    const active = players
      .filter((p) => !subIds.has(p.id))
      .sort((a, b) => (b.duprRating ?? 0) - (a.duprRating ?? 0));

    // Snake draft: 1,2,3,3,2,1,1,2,3...
    const buckets: SchedulePlayer[][] = Array.from({ length: numCourts }, () => []);
    let idx = 0;
    let forward = true;

    for (const player of active) {
      buckets[idx].push(player);
      if (forward) {
        if (idx >= numCourts - 1) forward = false;
        else idx++;
      } else {
        if (idx <= 0) forward = true;
        else idx--;
      }
    }

    const courts: CourtAssignment[] = buckets.map((bucket, i) => {
      const shuffled = shuffle(bucket);
      return {
        courtNumber: i + 1,
        team1: shuffled.slice(0, teamSize),
        team2: shuffled.slice(teamSize),
      };
    });

    rounds.push({ roundNumber: r + 1, courts, sittingOut: subSchedule[r] });
  }

  return { rounds, method: 'dupr_balanced', playersPerCourt, totalPlayers: players.length, totalCourts: numCourts };
}

// ── 3. DUPR Competitive (group similar skills together) ────

function generateDuprCompetitive(
  players: SchedulePlayer[],
  numCourts: number,
  numRounds: number,
  playersPerCourt: number
): Schedule {
  const subSchedule = computeSubSchedule(players, numCourts, playersPerCourt, numRounds);
  const rounds: Round[] = [];
  const teamSize = playersPerCourt / 2;

  for (let r = 0; r < numRounds; r++) {
    const subIds = new Set(subSchedule[r].map((s) => s.id));
    const active = players
      .filter((p) => !subIds.has(p.id))
      .sort((a, b) => (b.duprRating ?? 0) - (a.duprRating ?? 0));

    // Sequential: top N on court 1, next N on court 2, etc.
    const courts: CourtAssignment[] = [];
    for (let c = 0; c < numCourts; c++) {
      const group = active.slice(c * playersPerCourt, (c + 1) * playersPerCourt);
      const shuffled = shuffle(group);
      courts.push({
        courtNumber: c + 1,
        team1: shuffled.slice(0, teamSize),
        team2: shuffled.slice(teamSize),
      });
    }

    rounds.push({ roundNumber: r + 1, courts, sittingOut: subSchedule[r] });
  }

  return { rounds, method: 'dupr_competitive', playersPerCourt, totalPlayers: players.length, totalCourts: numCourts };
}

// ── 4. King of the Court ───────────────────────────────────
// Round 1 is generated. Subsequent rounds are interactive (admin picks winners).

export function generateKingRound1(
  players: SchedulePlayer[],
  numCourts: number,
  playersPerCourt: number
): { round: Round; sitOutCounts: Map<string, number> } {
  const capacity = numCourts * playersPerCourt;
  const subsPerRound = Math.max(0, players.length - capacity);
  const sitOutCounts = new Map<string, number>();
  players.forEach((p) => sitOutCounts.set(p.id, 0));

  let subs: SchedulePlayer[] = [];
  let active: SchedulePlayer[];

  if (subsPerRound > 0) {
    const shuffled = shuffle([...players]);
    active = shuffled.slice(0, capacity);
    subs = shuffled.slice(capacity);
    subs.forEach((p) => sitOutCounts.set(p.id, 1));
  } else {
    active = shuffle([...players]);
  }

  return {
    round: {
      roundNumber: 1,
      courts: assignToCourts(active, numCourts, playersPerCourt),
      sittingOut: subs,
    },
    sitOutCounts,
  };
}

export function generateNextKingRound(
  previousRound: Round,
  winnersByCourt: Map<number, 1 | 2>,
  allPlayers: SchedulePlayer[],
  numCourts: number,
  playersPerCourt: number,
  roundNumber: number,
  prevSitOutCounts: Map<string, number>
): { round: Round; sitOutCounts: Map<string, number> } {
  const teamSize = playersPerCourt / 2;
  const sitOutCounts = new Map(prevSitOutCounts);

  // Determine winners and losers per court
  const courtWinners: SchedulePlayer[][] = [];
  const courtLosers: SchedulePlayer[][] = [];

  for (const court of previousRound.courts) {
    const winTeam = winnersByCourt.get(court.courtNumber) ?? 1;
    courtWinners.push(winTeam === 1 ? [...court.team1] : [...court.team2]);
    courtLosers.push(winTeam === 1 ? [...court.team2] : [...court.team1]);
  }

  // Build new court buckets
  const buckets: SchedulePlayer[][] = Array.from({ length: numCourts }, () => []);

  // Court 1 winners stay on court 1
  buckets[0].push(...courtWinners[0]);

  // Winners from court N (N>1) move up one court
  for (let c = 1; c < numCourts; c++) {
    buckets[c - 1].push(...courtWinners[c]);
  }

  // Losers from court 1 move to court 2 (or sub pool if only 1 court)
  if (numCourts > 1) {
    buckets[1].push(...courtLosers[0]);
  }

  // Losers from middle courts move down one
  for (let c = 1; c < numCourts - 1; c++) {
    buckets[c + 1].push(...courtLosers[c]);
  }

  // Losers from last court go to sub pool
  const outgoing = numCourts > 1 ? [...courtLosers[numCourts - 1]] : [...courtLosers[0]];

  // Merge outgoing with previous subs
  const subPool = [...outgoing, ...previousRound.sittingOut];

  // Figure out how many spots are still open in buckets
  const capacity = numCourts * playersPerCourt;
  const filled = buckets.reduce((sum, b) => sum + b.length, 0);
  const spotsToFill = capacity - filled;

  // Pick from sub pool: those who've sat out most come in first
  const sortedPool = [...subPool].sort(
    (a, b) => (sitOutCounts.get(b.id) ?? 0) - (sitOutCounts.get(a.id) ?? 0)
  );

  const comingIn = sortedPool.splice(0, spotsToFill);
  const sittingOut = sortedPool;
  sittingOut.forEach((p) => sitOutCounts.set(p.id, (sitOutCounts.get(p.id) ?? 0) + 1));

  // Fill open spots in buckets
  let inIdx = 0;
  for (let c = 0; c < numCourts; c++) {
    while (buckets[c].length < playersPerCourt && inIdx < comingIn.length) {
      buckets[c].push(comingIn[inIdx++]);
    }
  }

  const courts: CourtAssignment[] = buckets.map((bucket, i) => ({
    courtNumber: i + 1,
    team1: bucket.slice(0, teamSize),
    team2: bucket.slice(teamSize, playersPerCourt),
  }));

  return {
    round: { roundNumber, courts, sittingOut },
    sitOutCounts,
  };
}

// ── 5. Round Robin (minimize repeat partners) ──────────────

function generateRoundRobin(
  players: SchedulePlayer[],
  numCourts: number,
  numRounds: number,
  playersPerCourt: number
): Schedule {
  const subSchedule = computeSubSchedule(players, numCourts, playersPerCourt, numRounds);
  const teamSize = playersPerCourt / 2;
  const rounds: Round[] = [];

  // Track partner history
  const partnerCount = new Map<string, Map<string, number>>();
  players.forEach((p) => partnerCount.set(p.id, new Map()));

  const incPartner = (a: string, b: string) => {
    partnerCount.get(a)!.set(b, (partnerCount.get(a)!.get(b) ?? 0) + 1);
    partnerCount.get(b)!.set(a, (partnerCount.get(b)!.get(a) ?? 0) + 1);
  };

  for (let r = 0; r < numRounds; r++) {
    const subIds = new Set(subSchedule[r].map((s) => s.id));
    const active = players.filter((p) => !subIds.has(p.id));

    if (playersPerCourt === 4) {
      // Doubles: form pairs that minimize repeat partnerships
      const allPairs: { a: SchedulePlayer; b: SchedulePlayer; count: number }[] = [];
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const count = partnerCount.get(active[i].id)?.get(active[j].id) ?? 0;
          allPairs.push({ a: active[i], b: active[j], count });
        }
      }
      // Sort by count ascending, random tiebreak
      allPairs.sort((x, y) => x.count - y.count || Math.random() - 0.5);

      const used = new Set<string>();
      const pairs: [SchedulePlayer, SchedulePlayer][] = [];
      for (const { a, b } of allPairs) {
        if (used.has(a.id) || used.has(b.id)) continue;
        pairs.push([a, b]);
        used.add(a.id);
        used.add(b.id);
        if (pairs.length === numCourts * 2) break;
      }

      const courts: CourtAssignment[] = [];
      for (let c = 0; c < numCourts; c++) {
        const p1 = pairs[c * 2];
        const p2 = pairs[c * 2 + 1];
        if (p1 && p2) {
          courts.push({
            courtNumber: c + 1,
            team1: [p1[0], p1[1]],
            team2: [p2[0], p2[1]],
          });
          incPartner(p1[0].id, p1[1].id);
          incPartner(p2[0].id, p2[1].id);
        }
      }

      rounds.push({ roundNumber: r + 1, courts, sittingOut: subSchedule[r] });
    } else {
      // Singles: just shuffle and pair up
      const shuffled = shuffle(active);
      const courts: CourtAssignment[] = [];
      for (let c = 0; c < numCourts; c++) {
        const p1 = shuffled[c * 2];
        const p2 = shuffled[c * 2 + 1];
        if (p1 && p2) {
          courts.push({ courtNumber: c + 1, team1: [p1], team2: [p2] });
        }
      }
      rounds.push({ roundNumber: r + 1, courts, sittingOut: subSchedule[r] });
    }
  }

  return { rounds, method: 'round_robin', playersPerCourt, totalPlayers: players.length, totalCourts: numCourts };
}

// ── Main Entry Point ───────────────────────────────────────

export function generateSchedule(
  players: SchedulePlayer[],
  numCourts: number,
  numRounds: number,
  method: AllocationMethod,
  gameFormat: GameFormat
): Schedule {
  const playersPerCourt = getPlayersPerCourt(gameFormat);

  switch (method) {
    case 'random':
      return generateRandom(players, numCourts, numRounds, playersPerCourt);
    case 'dupr_balanced':
      return generateDuprBalanced(players, numCourts, numRounds, playersPerCourt);
    case 'dupr_competitive':
      return generateDuprCompetitive(players, numCourts, numRounds, playersPerCourt);
    case 'king_of_the_court': {
      const { round } = generateKingRound1(players, numCourts, playersPerCourt);
      return {
        rounds: [round],
        method: 'king_of_the_court',
        playersPerCourt,
        totalPlayers: players.length,
        totalCourts: numCourts,
      };
    }
    case 'round_robin':
      return generateRoundRobin(players, numCourts, numRounds, playersPerCourt);
  }
}
