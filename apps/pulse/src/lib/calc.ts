import type { Accent, LoggedSet, SessionBlock, WorkoutSession, Muscle, PersonalRecord } from '@/types';
import { getExercise } from '@/data/exercises';

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
