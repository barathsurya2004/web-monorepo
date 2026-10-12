// ─────────────────────────────────────────────────────────────
// Pulse domain model (client-side, mock-backed)
// ─────────────────────────────────────────────────────────────

export type Muscle =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'traps';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell';

export type Pattern = 'push' | 'pull' | 'squat' | 'hinge' | 'lunge' | 'carry' | 'core' | 'isolation';

export interface Exercise {
  id: string;
  name: string;
  primary: Muscle[];
  secondary: Muscle[];
  equipment: Equipment;
  pattern: Pattern;
  cues: string[];
  /** Default rest in seconds when added to a routine. */
  defaultRest: number;
}

export type SetType = 'warmup' | 'working' | 'drop' | 'failure';

export interface PlannedSet {
  id: string;
  type: SetType;
  reps: number;
  weight: number;
  /** Target RPE (optional). */
  rpe?: number;
}

export interface RoutineBlock {
  id: string;
  exerciseId: string;
  sets: PlannedSet[];
  rest: number;
  /** Blocks sharing a supersetId alternate with no rest between them. */
  supersetId?: string;
  note?: string;
  /** Target rep range or duration description from programming (e.g. '4–6', '10–15', '45–60s') */
  targetReps?: string;
}

export interface Routine {
  id: string;
  name: string;
  focus: string;
  color: Accent;
  blocks: RoutineBlock[];
  estMinutes: number;
  lastPerformed?: string;
  warmupNote?: string;
  nutritionNote?: string;
}

export type Accent = 'mint' | 'peach' | 'lav' | 'coral' | 'amber' | 'ice';

export interface LoggedSet {
  id: string;
  type: SetType;
  reps: number;
  weight: number;
  rpe?: number;
  done: boolean;
  isPR?: boolean;
  completedAt?: number;
}

export interface SessionBlock {
  id: string;
  exerciseId: string;
  sets: LoggedSet[];
  rest: number;
  supersetId?: string;
  note?: string;
  targetReps?: string;
}

export interface WorkoutSession {
  id: string;
  routineId?: string;
  name: string;
  color: Accent;
  startedAt: number;
  endedAt?: number;
  blocks: SessionBlock[];
  rpe?: number;
  mood?: number;
  notes?: string;
}

export interface PlanDay {
  /** 0 = Monday … 6 = Sunday */
  weekday: number;
  routineId: string | null;
}

export interface PersonalRecord {
  exerciseId: string;
  e1rm: number;
  weight: number;
  reps: number;
  date: number;
}

export type Screen =
  | { name: 'home' }
  | { name: 'planner' }
  | { name: 'routines' }
  | { name: 'builder'; routineId?: string }
  | { name: 'workout' }
  | { name: 'summary'; sessionId: string }
  | { name: 'history' }
  | { name: 'session'; sessionId: string }
  | { name: 'analytics' }
  | { name: 'exercises' }
  | { name: 'exercise'; exerciseId: string }
  | { name: 'timer' }
  | { name: 'settings' };

export type ScreenName = Screen['name'];

export interface Settings {
  unit: 'kg' | 'lb';
  barWeight: number;
  defaultRest: number;
  haptics: boolean;
  sound: boolean;
  autoStartRest: boolean;
  weeklyGoal: number;
  bodyweight: number;
  name: string;
}
