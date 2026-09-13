export type Category = 'Creative' | 'Learning' | 'Engineering' | 'Mindfulness' | 'Health' | 'Personal';

export type GoalType = 'duration' | 'quantity' | 'open-ended';

export type ColorTheme = 'clay' | 'matcha' | 'ochre' | 'river' | 'plum';

export type FrequencyType = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface Habit {
  id: string;
  title: string;
  category: Category;
  icon: string;
  colorTheme: ColorTheme;
  goalType: GoalType;
  targetValue: number; // e.g., 30 for 30 min, 20 for 20 pages, 1 for 1 session
  currentValue: number; // e.g., 18 min logged today
  unit: string; // 'min', 'pages', 'session'
  isCompleted: boolean;
  streak: number;
  lastCompletedDate?: string;
  notes?: string;
  // Flexible frequencies & Grace days
  frequencyType?: FrequencyType;
  customDays?: number[]; // [0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat]
  streakFreezesAvailable?: number; // available grace days
  freezesUsed?: string[]; // dates 'YYYY-MM-DD'
}

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerPersistedState {
  isTimerRunning: boolean;
  timerTargetEndTime: number | null;
  timerRemainingSeconds: number;
  timerDurationMinutes: number;
  timerMode: TimerMode;
  activeHabitId: string | null;
  timerCycle: number;
}

export interface FocusSession {
  id: string;
  habitId: string;
  habitTitle: string;
  category: Category;
  durationMinutes: number;
  targetMinutes: number;
  isBonusFlow: boolean;
  timestamp: string; // ISO string
  note?: string;
}

export interface ChallengePrompt {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChallengeWeek {
  weekNumber: number;
  title: string;
  subtitle: string;
  targetSessions: number;
  completedSessions: number;
  isCurrent: boolean;
  isLocked: boolean;
  prompts: ChallengePrompt[];
}


export type ActiveScreen =
  | 'today'
  | 'empty-today'
  | 'focus'
  | 'focus-complete'
  | 'detail'
  | 'library'
  | 'calendar'
  | 'analytics'
  | 'challenge'
  | 'challenge-detail'
  | 'settings';
