import type { Accent, LoggedSet, SessionBlock, WorkoutSession, Muscle, PersonalRecord } from '@/types';
import { getExercise, ALL_MUSCLES, MUSCLE_LABEL } from '@/data/exercises';

// ── Strength math ──────────────────────────────────────────

/** Epley estimated one-rep max. */
export function e1rm(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function setVolume(s: { weight: number; reps: number }): number {
  return s.weight * s.reps;
}

export function blockVolume(b: SessionBlock, includeWarmups = false): number {
  return b.sets
    .filter((s) => s.done && (includeWarmups || s.type !== 'warmup'))
    .reduce((acc, s) => acc + setVolume(s), 0);
}

export function sessionVolume(s: WorkoutSession): number {
  return s.blocks.reduce((acc, b) => acc + blockVolume(b), 0);
}

export function sessionSets(s: WorkoutSession): number {
  return s.blocks.reduce((acc, b) => acc + b.sets.filter((x) => x.done && x.type !== 'warmup').length, 0);
}

export function sessionReps(s: WorkoutSession): number {
  return s.blocks.reduce(
    (acc, b) => acc + b.sets.filter((x) => x.done && x.type !== 'warmup').reduce((a, x) => a + x.reps, 0),
    0,
  );
}

export function sessionDurationMin(s: WorkoutSession): number {
  if (!s.endedAt) return Math.round((Date.now() - s.startedAt) / 60000);
  return Math.round((s.endedAt - s.startedAt) / 60000);
}

export function bestSet(sets: LoggedSet[]): LoggedSet | undefined {
  return sets
    .filter((s) => s.done && s.type !== 'warmup')
    .reduce<LoggedSet | undefined>((best, s) => (!best || e1rm(s.weight, s.reps) > e1rm(best.weight, best.reps) ? s : best), undefined);
}

/** Hard sets per muscle — primary counts 1, secondary counts 0.5. */
export function muscleSets(sessions: WorkoutSession[]): Record<Muscle, number> {
  const out = {} as Record<Muscle, number>;
  for (const s of sessions) {
    for (const b of s.blocks) {
      const ex = getExercise(b.exerciseId);
      const n = b.sets.filter((x) => x.done && x.type !== 'warmup').length;
      ex.primary.forEach((m) => (out[m] = (out[m] ?? 0) + n));
      ex.secondary.forEach((m) => (out[m] = (out[m] ?? 0) + n * 0.5));
    }
  }
  return out;
}

export function computePRs(sessions: WorkoutSession[]): Map<string, PersonalRecord> {
  const prs = new Map<string, PersonalRecord>();
  for (const s of [...sessions].sort((a, b) => a.startedAt - b.startedAt)) {
    for (const b of s.blocks) {
      for (const set of b.sets) {
        if (!set.done || set.type === 'warmup') continue;
        const est = e1rm(set.weight, set.reps);
        const cur = prs.get(b.exerciseId);
        if (!cur || est > cur.e1rm) {
          prs.set(b.exerciseId, { exerciseId: b.exerciseId, e1rm: est, weight: set.weight, reps: set.reps, date: s.startedAt });
        }
      }
    }
  }
  return prs;
}

// ── Plate calculator ───────────────────────────────────────

export const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
export const PLATES_LB = [45, 35, 25, 10, 5, 2.5];

export const PLATE_COLOR: Record<string, string> = {
  '25': '#FF4D6D',
  '20': '#7DD3FC',
  '15': '#FFD166',
  '10': '#00F5A0',
  '5': '#F5F3FF',
  '2.5': '#C8B6FF',
  '1.25': '#94A3B8',
  '0.5': '#E2E8F0',
  '45': '#7DD3FC',
  '35': '#FFD166',
};

export function platesPerSide(total: number, bar: number, unit: 'kg' | 'lb'): { plates: number[]; remainder: number } {
  const inventory = unit === 'kg' ? PLATES_KG : PLATES_LB;
  let side = Math.max(0, (total - bar) / 2);
  const plates: number[] = [];
  for (const p of inventory) {
    while (side + 1e-9 >= p) {
      plates.push(p);
      side -= p;
    }
  }
  return { plates, remainder: Math.round(side * 2 * 100) / 100 };
}

// ── Formatting ─────────────────────────────────────────────

export function fmtNum(n: number, digits = 0): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return fmtNum(n);
}

export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function fmtDate(ts: number, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  return new Date(ts).toLocaleDateString('en-US', opts);
}

export function relDay(ts: number): string {
  const d = startOfDay(Date.now()) - startOfDay(ts);
  const days = Math.round(d / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return fmtDate(ts);
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Local date key 'YYYY-MM-DD' */
export function todayDateKey(ts = Date.now()): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Monday-based weekday index 0…6 */
export function weekdayIdx(ts: number): number {
  return (new Date(ts).getDay() + 6) % 7;
}

export function startOfWeek(ts: number): number {
  return startOfDay(ts) - weekdayIdx(ts) * 86400000;
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Accent helpers ─────────────────────────────────────────

export const ACCENT_HEX: Record<Accent, string> = {
  mint: '#00F5A0',
  peach: '#FBD8B3',
  lav: '#C8B6FF',
  coral: '#FF4D6D',
  amber: '#FFD166',
  ice: '#7DD3FC',
};

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

/** Fun tonnage comparisons for the post-workout hero card (kg). */
export function tonnageComparison(kg: number): string {
  const things: Array<[number, string, string]> = [
    [6000, 'African elephant', 'African elephants'],
    [1500, 'family car', 'family cars'],
    [450, 'grand piano', 'grand pianos'],
    [200, 'vending machine', 'vending machines'],
  ];
  for (const [w, one, many] of things) {
    if (kg >= w) {
      const n = kg / w;
      return `${n.toFixed(1)} ${n < 1.05 ? one : many}`;
    }
  }
  return `${Math.round(kg / 20)} car tyres`;
}

// ── Strength Standards & Level Tiers ───────────────────────

export type StrengthTier = 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Elite';

export const STRENGTH_TIERS: StrengthTier[] = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];

export const TIER_COLOR: Record<StrengthTier, string> = {
  Beginner: '#94A3B8',
  Novice: '#7DD3FC',
  Intermediate: '#00F5A0',
  Advanced: '#FFD166',
  Elite: '#FF4D6D',
};

export interface StrengthBenchmark {
  id: string;
  name: string;
  movementType: 'Push' | 'Pull' | 'Legs' | 'Core';
  userE1RM: number;
  ratio: number;
  tier: StrengthTier;
  tierScore: number; // 1 to 5 scale for radar plotting
  standards: Record<StrengthTier, number>;
  nextTier: StrengthTier | null;
  weightToNextTier: number;
}

export interface StrengthProfile {
  benchmarks: StrengthBenchmark[];
  overallTier: StrengthTier;
  overallScore: number;
  pushScore: number;
  pullScore: number;
  legScore: number;
  symmetryBalance: 'Balanced' | 'Push-Dominant' | 'Pull-Dominant' | 'Leg-Dominant' | 'Upper-Dominant';
  insight: string;
}

// Multipliers relative to bodyweight
export const BENCHMARK_RATIOS: Record<string, { name: string; type: 'Push' | 'Pull' | 'Legs' | 'Core'; multipliers: Record<StrengthTier, number> }> = {
  bench: {
    name: 'Bench Press',
    type: 'Push',
    multipliers: { Beginner: 0.65, Novice: 0.95, Intermediate: 1.25, Advanced: 1.6, Elite: 2.0 },
  },
  squat: {
    name: 'Back Squat',
    type: 'Legs',
    multipliers: { Beginner: 0.9, Novice: 1.25, Intermediate: 1.65, Advanced: 2.15, Elite: 2.65 },
  },
  deadlift: {
    name: 'Deadlift',
    type: 'Legs',
    multipliers: { Beginner: 1.1, Novice: 1.5, Intermediate: 1.95, Advanced: 2.5, Elite: 3.1 },
  },
  ohp: {
    name: 'Overhead Press',
    type: 'Push',
    multipliers: { Beginner: 0.45, Novice: 0.65, Intermediate: 0.85, Advanced: 1.1, Elite: 1.35 },
  },
  row: {
    name: 'Barbell Row',
    type: 'Pull',
    multipliers: { Beginner: 0.55, Novice: 0.8, Intermediate: 1.05, Advanced: 1.35, Elite: 1.7 },
  },
};

export function computeStrengthProfile(prs: Map<string, PersonalRecord>, bodyweight = 58.5): StrengthProfile {
  const benchmarks: StrengthBenchmark[] = Object.entries(BENCHMARK_RATIOS).map(([id, config]) => {
    const pr = prs.get(id);
    const userE1RM = pr?.e1rm ?? 0;
    const ratio = userE1RM > 0 ? userE1RM / bodyweight : 0;

    const standards = {
      Beginner: Math.round(bodyweight * config.multipliers.Beginner * 10) / 10,
      Novice: Math.round(bodyweight * config.multipliers.Novice * 10) / 10,
      Intermediate: Math.round(bodyweight * config.multipliers.Intermediate * 10) / 10,
      Advanced: Math.round(bodyweight * config.multipliers.Advanced * 10) / 10,
      Elite: Math.round(bodyweight * config.multipliers.Elite * 10) / 10,
    };

    let tier: StrengthTier = 'Beginner';
    let tierScore = 1;
    let nextTier: StrengthTier | null = 'Novice';
    let weightToNextTier = Math.max(0, standards.Novice - userE1RM);

    if (userE1RM >= standards.Elite) {
      tier = 'Elite';
      tierScore = 5;
      nextTier = null;
      weightToNextTier = 0;
    } else if (userE1RM >= standards.Advanced) {
      tier = 'Advanced';
      const progress = (userE1RM - standards.Advanced) / (standards.Elite - standards.Advanced || 1);
      tierScore = 4 + Math.min(0.99, progress);
      nextTier = 'Elite';
      weightToNextTier = Math.max(0, standards.Elite - userE1RM);
    } else if (userE1RM >= standards.Intermediate) {
      tier = 'Intermediate';
      const progress = (userE1RM - standards.Intermediate) / (standards.Advanced - standards.Intermediate || 1);
      tierScore = 3 + Math.min(0.99, progress);
      nextTier = 'Advanced';
      weightToNextTier = Math.max(0, standards.Advanced - userE1RM);
    } else if (userE1RM >= standards.Novice) {
      tier = 'Novice';
      const progress = (userE1RM - standards.Novice) / (standards.Intermediate - standards.Novice || 1);
      tierScore = 2 + Math.min(0.99, progress);
      nextTier = 'Intermediate';
      weightToNextTier = Math.max(0, standards.Intermediate - userE1RM);
    } else {
      tier = 'Beginner';
      const progress = standards.Beginner > 0 ? Math.min(1, userE1RM / standards.Beginner) : 0;
      tierScore = Math.max(0.4, 1 * progress);
      nextTier = 'Novice';
      weightToNextTier = Math.max(0, standards.Novice - userE1RM);
    }

    return {
      id,
      name: config.name,
      movementType: config.type,
      userE1RM: Math.round(userE1RM * 10) / 10,
      ratio: Math.round(ratio * 100) / 100,
      tier,
      tierScore: Math.round(tierScore * 100) / 100,
      standards,
      nextTier,
      weightToNextTier: Math.round(weightToNextTier * 10) / 10,
    };
  });

  const testedBenchmarks = benchmarks.filter((b) => b.userE1RM > 0);
  const avgScore =
    testedBenchmarks.length > 0
      ? testedBenchmarks.reduce((sum, b) => sum + b.tierScore, 0) / testedBenchmarks.length
      : 1;

  let overallTier: StrengthTier = 'Beginner';
  if (avgScore >= 4.5) overallTier = 'Elite';
  else if (avgScore >= 3.5) overallTier = 'Advanced';
  else if (avgScore >= 2.5) overallTier = 'Intermediate';
  else if (avgScore >= 1.5) overallTier = 'Novice';

  const pushBench = benchmarks.filter((b) => b.movementType === 'Push');
  const pullBench = benchmarks.filter((b) => b.movementType === 'Pull');
  const legBench = benchmarks.filter((b) => b.movementType === 'Legs');

  const pushScore = pushBench.reduce((acc, b) => acc + b.tierScore, 0) / (pushBench.length || 1);
  const pullScore = pullBench.reduce((acc, b) => acc + b.tierScore, 0) / (pullBench.length || 1);
  const legScore = legBench.reduce((acc, b) => acc + b.tierScore, 0) / (legBench.length || 1);

  let symmetryBalance: StrengthProfile['symmetryBalance'] = 'Balanced';
  let insight = 'Balanced full-body kinetic symmetry across push, pull, and leg compound movements.';

  if (testedBenchmarks.length === 0) {
    insight = 'Log sets in Bench Press, Squat, Deadlift, OHP, or Barbell Row to analyze your kinetic balance and strength tier.';
  } else if (legScore > pushScore + 0.8 && legScore > pullScore + 0.8) {
    symmetryBalance = 'Leg-Dominant';
    insight = 'Exceptional lower body power! Prioritize horizontal & vertical pressing to build an evenly balanced upper physique.';
  } else if (pushScore > pullScore + 0.8) {
    symmetryBalance = 'Push-Dominant';
    insight = 'Strong pressing strength! Add more posterior rowing & vertical pull volume to protect shoulder joint integrity.';
  } else if (pullScore > pushScore + 0.8) {
    symmetryBalance = 'Pull-Dominant';
    insight = 'Superior back and pulling strength! Focus on progressive overload in Bench Press and Overhead Press.';
  } else if (pushScore + pullScore > legScore * 2 + 0.6) {
    symmetryBalance = 'Upper-Dominant';
    insight = 'Upper body outpaces your legs. Prioritize squat depth and deadlift frequency to establish a solid foundation.';
  }

  return {
    benchmarks,
    overallTier,
    overallScore: Math.round(avgScore * 10) / 10,
    pushScore: Math.round(pushScore * 10) / 10,
    pullScore: Math.round(pullScore * 10) / 10,
    legScore: Math.round(legScore * 10) / 10,
    symmetryBalance,
    insight,
  };
}
