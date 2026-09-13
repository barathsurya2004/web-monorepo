import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Habit,
  FocusSession,
  ChallengeWeek,
  ActiveScreen,
  TimerMode,
  TimerPersistedState,
} from '@/types';
import {
  hapticLight,
  hapticSuccess,
  hapticNotice,
  getHapticsEnabled,
  setHapticsEnabled,
} from '@/utils/haptics';
import {
  sendFocusCompleteNotification,
  sendBreakCompleteNotification,
  updateDocumentTitle,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/utils/notifications';

const STORAGE_KEYS = {
  habits: 'shuchu_habits_v3',
  sessions: 'shuchu_sessions_v3',
  challenges: 'shuchu_challenges_v3',
  timer: 'shuchu_timer_state_v3',
  theme: 'shuchu_theme_v3',
  shortBreak: 'shuchu_short_break_v3',
  longBreak: 'shuchu_long_break_v3',
  lastActiveDate: 'shuchu_last_active_date_v3',
};

interface AppContextType {
  habits: Habit[];
  focusSessions: FocusSession[];
  challenges: ChallengeWeek[];
  activeScreen: ActiveScreen;
  activeHabit: Habit | null;
  theme: 'dawn' | 'moss';
  isDesktopMode: boolean;

  // Pomodoro Cycles & Wall-Clock Timer
  timerMode: TimerMode;
  timerDurationMinutes: number;
  timerRemainingSeconds: number;
  isTimerRunning: boolean;
  timerCycle: number;
  shortBreakDurationMinutes: number;
  longBreakDurationMinutes: number;
  lastCompletedSession: FocusSession | null;
  selectedDateStr: string;

  // Actions
  setScreen: (screen: ActiveScreen) => void;
  toggleTheme: () => void;
  toggleDesktopMode: () => void;
  toggleHabitCompletion: (id: string) => void;
  selectHabitForDetail: (id: string) => void;
  startFocusSession: (habitId?: string, durationMinutes?: number) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  addFiveMinutes: () => void;
  setTimerDuration: (minutes: number) => void;
  setShortBreakDuration: (minutes: number) => void;
  setLongBreakDuration: (minutes: number) => void;
  switchTimerMode: (mode: TimerMode) => void;
  skipBreak: () => void;
  finishCurrentSession: (manualBonus?: number, note?: string) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'isCompleted' | 'currentValue'>) => void;
  deleteHabit: (id: string) => void;
  toggleStreakFreeze: (habitId: string) => void;
  isHabitScheduledToday: (habit: Habit, date?: Date) => boolean;
  toggleChallengePrompt: (weekNumber: number, promptId: string) => void;
  setSelectedDateStr: (dateStr: string) => void;
  resetAllData: () => void;

  // Notifications & Haptics
  isNotificationsEnabled: boolean;
  requestNotifications: () => Promise<boolean>;
  isHapticsEnabled: boolean;
  setHaptics: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Data Persistence ---
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      localStorage.removeItem('shuchu_habits_v2');
      localStorage.removeItem('shuchu_habits');

      const stored = localStorage.getItem(STORAGE_KEYS.habits);
      if (!stored) return [];
      const parsed: Habit[] = JSON.parse(stored);
      // Filter out any prototype mock habit titles/IDs
      const mockIds = new Set(['drawing', 'piano', 'reading', 'coding', 'health']);
      return parsed.filter(
        (h) =>
          !mockIds.has(h.id) &&
          h.title !== 'Figure Drawing' &&
          h.title !== 'Practice Piano' &&
          h.title !== 'Read 20 Pages' &&
          h.title !== 'Study C Systems' &&
          h.title !== 'Strength & Mobility'
      );
    } catch {
      return [];
    }
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    try {
      localStorage.removeItem('shuchu_sessions_v2');
      localStorage.removeItem('shuchu_sessions');

      const stored = localStorage.getItem(STORAGE_KEYS.sessions);
      if (!stored) return [];
      const parsed: FocusSession[] = JSON.parse(stored);
      const mockSessIds = new Set(['sess-1', 'sess-2', 'sess-3']);
      return parsed.filter(
        (s) =>
          !mockSessIds.has(s.id) &&
          s.habitTitle !== 'Figure Drawing' &&
          s.habitTitle !== 'Practice Piano' &&
          s.habitTitle !== 'Study C Systems'
      );
    } catch {
      return [];
    }
  });

  const [challenges, setChallenges] = useState<ChallengeWeek[]>(() => {
    try {
      localStorage.removeItem('shuchu_challenges_v2');
      localStorage.removeItem('shuchu_challenges');

      const stored = localStorage.getItem(STORAGE_KEYS.challenges);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('today');
  const [activeHabitId, setActiveHabitId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.timer);
      if (saved) {
        const parsed: TimerPersistedState = JSON.parse(saved);
        if (parsed.activeHabitId) return parsed.activeHabitId;
      }
    } catch {}
    return '';
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

  const [theme, setThemeState] = useState<'dawn' | 'moss'>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.theme);
      return stored === 'moss' ? 'moss' : 'dawn';
    } catch {
      return 'dawn';
    }
  });

  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(false);

  // --- Break Duration Settings ---
  const [shortBreakDurationMinutes, setShortBreakDurationMinutes] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.shortBreak);
      return stored ? parseInt(stored, 10) : 5;
    } catch {
      return 5;
    }
  });

  const [longBreakDurationMinutes, setLongBreakDurationMinutes] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.longBreak);
      return stored ? parseInt(stored, 10) : 15;
    } catch {
      return 15;
    }
  });

  // --- Wall-Clock & Persistent Pomodoro Timer State ---
  const [timerMode, setTimerMode] = useState<TimerMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.timer);
      if (saved) {
        const parsed: TimerPersistedState = JSON.parse(saved);
        return parsed.timerMode || 'focus';
      }
    } catch {}
    return 'focus';
  });

  const [timerDurationMinutes, setTimerDurationMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.timer);
      if (saved) {
        const parsed: TimerPersistedState = JSON.parse(saved);
        return parsed.timerDurationMinutes || 25;
      }
    } catch {}
    return 25;
  });

  const [timerTargetEndTime, setTimerTargetEndTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.timer);
      if (saved) {
        const parsed: TimerPersistedState = JSON.parse(saved);
        if (parsed.isTimerRunning && parsed.timerTargetEndTime && parsed.timerTargetEndTime > Date.now()) {
          return parsed.timerTargetEndTime;
        }
      }
    } catch {}
    return null;
  });

  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.timer);
      if (saved) {
        const parsed: TimerPersistedState = JSON.parse(saved);
        return Boolean(parsed.isTimerRunning && parsed.timerTargetEndTime && parsed.timerTargetEndTime > Date.now());
      }
    } catch {}
    return false;
  });

  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.timer);
      if (saved) {
        const parsed: TimerPersistedState = JSON.parse(saved);
        if (parsed.isTimerRunning && parsed.timerTargetEndTime) {
          const remaining = Math.max(0, Math.ceil((parsed.timerTargetEndTime - Date.now()) / 1000));
          return remaining;
        }
        return parsed.timerRemainingSeconds || 25 * 60;
      }
    } catch {}
    return 25 * 60;
  });

  const [timerCycle, setTimerCycle] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.timer);
      if (saved) {
        const parsed: TimerPersistedState = JSON.parse(saved);
        return parsed.timerCycle || 1;
      }
    } catch {}
    return 1;
  });

  const [lastCompletedSession, setLastCompletedSession] = useState<FocusSession | null>(null);

  // --- Notifications & Haptics Preferences ---
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(() => {
    return getNotificationPermission() === 'granted';
  });

  const requestNotifications = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    setIsNotificationsEnabled(granted);
    return granted;
  };

  const [isHapticsEnabledState, setIsHapticsState] = useState<boolean>(getHapticsEnabled);

  const setHaptics = (enabled: boolean) => {
    setHapticsEnabled(enabled);
    setIsHapticsState(enabled);
    if (enabled) hapticLight();
  };

  // --- LocalStorage Synchronization ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.habits, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(focusSessions));
  }, [focusSessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.challenges, JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.shortBreak, shortBreakDurationMinutes.toString());
  }, [shortBreakDurationMinutes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.longBreak, longBreakDurationMinutes.toString());
  }, [longBreakDurationMinutes]);

  // Persist timer state for background & app close recovery
  useEffect(() => {
    const stateToSave: TimerPersistedState = {
      isTimerRunning,
      timerTargetEndTime,
      timerRemainingSeconds,
      timerDurationMinutes,
      timerMode,
      activeHabitId,
      timerCycle,
    };
    localStorage.setItem(STORAGE_KEYS.timer, JSON.stringify(stateToSave));
  }, [isTimerRunning, timerTargetEndTime, timerRemainingSeconds, timerDurationMinutes, timerMode, activeHabitId, timerCycle]);

  // Sync Theme to HTML class & meta theme-color
  useEffect(() => {
    const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
    const color = theme === 'moss' ? '#141715' : '#FAF7F2';
    if (theme === 'moss') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }
    metaThemeColors.forEach((el) => el.setAttribute('content', color));
  }, [theme]);

  // Daily Rollover: Reset daily counts and evaluate streaks
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastActive = localStorage.getItem(STORAGE_KEYS.lastActiveDate);

    if (lastActive && lastActive !== todayStr) {
      setHabits((prev) =>
        prev.map((h) => {
          const wasDone = h.isCompleted;
          const wasFrozen = h.freezesUsed?.includes(lastActive);

          let newStreak = h.streak;
          // If not completed and not frozen, reset streak
          if (!wasDone && !wasFrozen) {
            newStreak = 0;
          }

          return {
            ...h,
            currentValue: 0,
            isCompleted: false,
            streak: newStreak,
          };
        })
      );
    }
    localStorage.setItem(STORAGE_KEYS.lastActiveDate, todayStr);
  }, []);

  // Active Habit derivation
  const activeHabit = habits.find((h) => h.id === activeHabitId) || habits[0] || null;

  // Refs for background synchronization without stale closures
  const isTimerRunningRef = useRef(isTimerRunning);
  const timerTargetEndTimeRef = useRef(timerTargetEndTime);
  const timerModeRef = useRef(timerMode);
  const timerDurationMinutesRef = useRef(timerDurationMinutes);
  const timerCycleRef = useRef(timerCycle);
  const activeHabitRef = useRef(activeHabit);
  const shortBreakDurationMinutesRef = useRef(shortBreakDurationMinutes);
  const longBreakDurationMinutesRef = useRef(longBreakDurationMinutes);

  useEffect(() => {
    isTimerRunningRef.current = isTimerRunning;
    timerTargetEndTimeRef.current = timerTargetEndTime;
    timerModeRef.current = timerMode;
    timerDurationMinutesRef.current = timerDurationMinutes;
    timerCycleRef.current = timerCycle;
    activeHabitRef.current = activeHabit;
    shortBreakDurationMinutesRef.current = shortBreakDurationMinutes;
    longBreakDurationMinutesRef.current = longBreakDurationMinutes;
  });

  // --- Completion Handler for Timer Reaching Zero ---
  const handleTimerNaturalComplete = useCallback(() => {
    setIsTimerRunning(false);
    setTimerTargetEndTime(null);

    const currentMode = timerModeRef.current;
    const currentHabit = activeHabitRef.current;
    const currentDuration = timerDurationMinutesRef.current;
    const currentCycle = timerCycleRef.current;

    if (currentMode === 'focus') {
      // 1. Focus session completed
      hapticSuccess();
      sendFocusCompleteNotification(
        currentHabit?.title || 'Habit Flow',
        shortBreakDurationMinutesRef.current
      );

      // Record focus session
      const newSession: FocusSession = {
        id: `sess-${Date.now()}`,
        habitId: currentHabit ? currentHabit.id : 'open-flow',
        habitTitle: currentHabit ? currentHabit.title : 'Open Mindful Flow',
        category: currentHabit ? currentHabit.category : 'Mindfulness',
        durationMinutes: currentDuration,
        targetMinutes: currentHabit ? currentHabit.targetValue : currentDuration,
        isBonusFlow: currentHabit ? (currentHabit.currentValue || 0) + currentDuration > currentHabit.targetValue : false,
        timestamp: new Date().toISOString(),
        note: 'Mindful flow completed.',
      };
      setFocusSessions((prev) => [newSession, ...prev]);
      setLastCompletedSession(newSession);

      // Update habit progress if attached to a habit
      if (currentHabit) {
        setHabits((prev) =>
          prev.map((h) => {
            if (h.id === currentHabit.id) {
              const nextVal = (h.currentValue || 0) + currentDuration;
              const isDone = nextVal >= h.targetValue;
              return {
                ...h,
                currentValue: nextVal,
                isCompleted: isDone,
                streak: isDone && !h.isCompleted ? h.streak + 1 : h.streak,
              };
            }
            return h;
          })
        );
      }

      // Determine next break mode (Cycle 4 triggers Long Break)
      const nextCycle = currentCycle + 1;
      setTimerCycle(nextCycle);
      const isLong = (nextCycle - 1) % 4 === 0;
      const nextMode: TimerMode = isLong ? 'longBreak' : 'shortBreak';
      const breakMins = isLong ? longBreakDurationMinutesRef.current : shortBreakDurationMinutesRef.current;

      setTimerMode(nextMode);
      setTimerDurationMinutes(breakMins);
      setTimerRemainingSeconds(breakMins * 60);
    } else {
      // 2. Break session completed
      hapticNotice();
      sendBreakCompleteNotification(currentCycle);

      // Return to focus mode
      setTimerMode('focus');
      const focusMins = 25;
      setTimerDurationMinutes(focusMins);
      setTimerRemainingSeconds(focusMins * 60);
    }
  }, []);

  // --- Wall-Clock Timer Tick & Background / Lock-Screen Recovery ---
  useEffect(() => {
    if (!isTimerRunning || !timerTargetEndTime) return;

    const tick = () => {
      const now = Date.now();
      const target = timerTargetEndTimeRef.current;
      if (!target) return;

      const diffSecs = Math.max(0, Math.ceil((target - now) / 1000));
      if (diffSecs <= 0) {
        setTimerRemainingSeconds(0);
        handleTimerNaturalComplete();
      } else {
        setTimerRemainingSeconds(diffSecs);
      }
    };

    // Run tick every 500ms for smooth, drift-free second updates
    const interval = window.setInterval(tick, 500);

    // Synchronize instantly when app is reopened / phone unlocked from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    const handleFocus = () => tick();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isTimerRunning, timerTargetEndTime, handleTimerNaturalComplete]);

  // --- Document Title Presence (e.g. "(24:12) 🎯 Figure Drawing • Shuchu") ---
  useEffect(() => {
    const mins = Math.floor(timerRemainingSeconds / 60);
    const secs = timerRemainingSeconds % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    updateDocumentTitle(timeStr, timerMode, activeHabit?.title, isTimerRunning);
  }, [timerRemainingSeconds, timerMode, activeHabit?.title, isTimerRunning]);

  // --- Navigation & Scroll Helpers ---
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const setScreen = (screen: ActiveScreen) => {
    setActiveScreen(screen);
    scrollToTop();
  };

  const selectHabitForDetail = (id: string) => {
    setActiveHabitId(id);
    setActiveScreen('detail');
    scrollToTop();
  };

  const startFocusSession = (habitId?: string, durationMinutes = 25) => {
    if (habitId) {
      setActiveHabitId(habitId);
    }
    setTimerMode('focus');
    setTimerDurationMinutes(durationMinutes);
    setTimerRemainingSeconds(durationMinutes * 60);
    setIsTimerRunning(false);
    setTimerTargetEndTime(null);
    setActiveScreen('focus');
    scrollToTop();
  };

  // --- Timer Controls ---
  const toggleTimer = () => {
    if (!isTimerRunning) {
      // Start or Resume with Wall-Clock Target
      let remaining = timerRemainingSeconds;
      if (remaining <= 0) {
        remaining = timerDurationMinutes * 60;
        setTimerRemainingSeconds(remaining);
      }
      const target = Date.now() + remaining * 1000;
      setTimerTargetEndTime(target);
      setIsTimerRunning(true);
      hapticLight();
    } else {
      // Pause
      setIsTimerRunning(false);
      setTimerTargetEndTime(null);
      hapticLight();
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerTargetEndTime(null);
    setTimerRemainingSeconds(timerDurationMinutes * 60);
    hapticLight();
  };

  const addFiveMinutes = () => {
    const additional = 5 * 60;
    setTimerDurationMinutes((prev) => prev + 5);
    setTimerRemainingSeconds((prev) => {
      const nextSecs = prev + additional;
      if (isTimerRunning && timerTargetEndTime) {
        setTimerTargetEndTime(timerTargetEndTime + additional * 1000);
      }
      return nextSecs;
    });
    hapticLight();
  };

  const setTimerDuration = (minutes: number) => {
    setIsTimerRunning(false);
    setTimerTargetEndTime(null);
    setTimerDurationMinutes(minutes);
    setTimerRemainingSeconds(minutes * 60);
    hapticLight();
  };

  const setShortBreakDuration = (minutes: number) => {
    setShortBreakDurationMinutes(minutes);
    if (timerMode === 'shortBreak' && !isTimerRunning) {
      setTimerDurationMinutes(minutes);
      setTimerRemainingSeconds(minutes * 60);
    }
  };

  const setLongBreakDuration = (minutes: number) => {
    setLongBreakDurationMinutes(minutes);
    if (timerMode === 'longBreak' && !isTimerRunning) {
      setTimerDurationMinutes(minutes);
      setTimerRemainingSeconds(minutes * 60);
    }
  };

  const switchTimerMode = (mode: TimerMode) => {
    setIsTimerRunning(false);
    setTimerTargetEndTime(null);
    hapticLight();
    setTimerMode(mode);
    const mins = mode === 'focus' ? 25 : mode === 'shortBreak' ? shortBreakDurationMinutes : longBreakDurationMinutes;
    setTimerDurationMinutes(mins);
    setTimerRemainingSeconds(mins * 60);
  };

  const skipBreak = () => {
    setIsTimerRunning(false);
    setTimerTargetEndTime(null);
    hapticNotice();
    setTimerMode('focus');
    const focusMins = 25;
    setTimerDurationMinutes(focusMins);
    setTimerRemainingSeconds(focusMins * 60);
  };

  const finishCurrentSession = (manualBonus = 0, note?: string) => {
    setIsTimerRunning(false);
    setTimerTargetEndTime(null);
    hapticSuccess();

    const habit = habits.find((h) => h.id === activeHabitId) || habits[0] || null;
    const loggedMins = timerDurationMinutes + manualBonus;
    const isBonus = habit ? (habit.currentValue || 0) + loggedMins > habit.targetValue : false;

    const newSession: FocusSession = {
      id: `sess-${Date.now()}`,
      habitId: habit ? habit.id : 'open-flow',
      habitTitle: habit ? habit.title : 'Open Mindful Flow',
      category: habit ? habit.category : 'Mindfulness',
      durationMinutes: loggedMins,
      targetMinutes: habit ? habit.targetValue : loggedMins,
      isBonusFlow: isBonus,
      timestamp: new Date().toISOString(),
      note: note || 'Mindful flow completed in stillness.',
    };

    setFocusSessions((prev) => [newSession, ...prev]);
    setLastCompletedSession(newSession);

    // Update habit progress and completion
    if (habit) {
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id === habit.id) {
            const nextVal = (h.currentValue || 0) + loggedMins;
            const isDone = nextVal >= h.targetValue;
            return {
              ...h,
              currentValue: nextVal,
              isCompleted: isDone,
              streak: isDone && !h.isCompleted ? h.streak + 1 : h.streak,
            };
          }
          return h;
        })
      );
    }

    setTimerCycle((prev) => (prev % 4) + 1);
    setActiveScreen('focus-complete');
    scrollToTop();
  };

  // --- Habit Completion & Streak Freeze ---
  const toggleHabitCompletion = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextCompleted = !h.isCompleted;
          if (nextCompleted) {
            hapticSuccess();
          } else {
            hapticLight();
          }
          return {
            ...h,
            isCompleted: nextCompleted,
            currentValue: nextCompleted ? h.targetValue : Math.floor(h.targetValue * 0.5),
            streak: nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1),
          };
        }
        return h;
      })
    );
  };

  const toggleStreakFreeze = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const used = h.freezesUsed || [];
          const isFrozen = used.includes(today);
          let newUsed: string[];
          let freezesAvail = h.streakFreezesAvailable ?? 2;

          if (isFrozen) {
            newUsed = used.filter((d) => d !== today);
            freezesAvail += 1;
            hapticLight();
          } else {
            if (freezesAvail <= 0) return h;
            newUsed = [...used, today];
            freezesAvail -= 1;
            hapticNotice();
          }

          return {
            ...h,
            freezesUsed: newUsed,
            streakFreezesAvailable: freezesAvail,
          };
        }
        return h;
      })
    );
  };

  const isHabitScheduledToday = (habit: Habit, date = new Date()): boolean => {
    const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const freq = habit.frequencyType || 'daily';
    switch (freq) {
      case 'daily':
        return true;
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'weekends':
        return dayOfWeek === 0 || dayOfWeek === 6;
      case 'custom':
        return habit.customDays ? habit.customDays.includes(dayOfWeek) : true;
      default:
        return true;
    }
  };

  const toggleTheme = () => {
    hapticLight();
    setThemeState((prev) => (prev === 'dawn' ? 'moss' : 'dawn'));
  };

  const toggleDesktopMode = () => {
    hapticLight();
    setIsDesktopMode((prev) => !prev);
  };


  const addHabit = (data: Omit<Habit, 'id' | 'streak' | 'isCompleted' | 'currentValue'>) => {
    hapticSuccess();
    const newHabit: Habit = {
      ...data,
      id: `habit-${Date.now()}`,
      streak: 1,
      isCompleted: false,
      currentValue: 0,
      frequencyType: data.frequencyType || 'daily',
      customDays: data.customDays || [1, 2, 3, 4, 5],
      streakFreezesAvailable: 2,
      freezesUsed: [],
    };
    setHabits((prev) => [newHabit, ...prev]);
  };

  const deleteHabit = (id: string) => {
    hapticNotice();
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setActiveScreen('today');
  };

  const toggleChallengePrompt = (weekNumber: number, promptId: string) => {
    hapticLight();
    setChallenges((prev) =>
      prev.map((week) => {
        if (week.weekNumber === weekNumber) {
          const nextPrompts = week.prompts.map((p) =>
            p.id === promptId ? { ...p, completed: !p.completed } : p
          );
          const doneCount = nextPrompts.filter((p) => p.completed).length;
          return {
            ...week,
            prompts: nextPrompts,
            completedSessions: Math.min(week.targetSessions, doneCount),
          };
        }
        return week;
      })
    );
  };

  const resetAllData = () => {
    hapticNotice();
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    // Purge all legacy and v2 keys
    localStorage.removeItem('shuchu_habits_v2');
    localStorage.removeItem('shuchu_sessions_v2');
    localStorage.removeItem('shuchu_challenges_v2');
    localStorage.removeItem('shuchu_timer_state_v2');
    localStorage.removeItem('shuchu_last_active_date_v2');
    localStorage.removeItem('shuchu_habits');
    localStorage.removeItem('shuchu_sessions');
    localStorage.removeItem('shuchu_challenges');
    localStorage.removeItem('shuchu_timer_state');

    setHabits([]);
    setFocusSessions([]);
    setChallenges([]);
    setTimerMode('focus');
    setTimerDurationMinutes(25);
    setTimerRemainingSeconds(25 * 60);
    setIsTimerRunning(false);
    setTimerTargetEndTime(null);
    setActiveHabitId('');
    setActiveScreen('today');
  };

  return (
    <AppContext.Provider
      value={{
        habits,
        focusSessions,
        challenges,
        activeScreen,
        activeHabit,
        theme,
        isDesktopMode,
        timerMode,
        timerDurationMinutes,
        timerRemainingSeconds,
        isTimerRunning,
        timerCycle,
        shortBreakDurationMinutes,
        longBreakDurationMinutes,
        lastCompletedSession,
        selectedDateStr,
        setScreen,
        toggleTheme,
        toggleDesktopMode,
        toggleHabitCompletion,
        selectHabitForDetail,
        startFocusSession,
        toggleTimer,
        resetTimer,
        addFiveMinutes,
        setTimerDuration,
        setShortBreakDuration,
        setLongBreakDuration,
        switchTimerMode,
        skipBreak,
        finishCurrentSession,
        addHabit,
        deleteHabit,
        toggleStreakFreeze,
        isHabitScheduledToday,
        toggleChallengePrompt,
        setSelectedDateStr,
        resetAllData,
        isNotificationsEnabled,
        requestNotifications,
        isHapticsEnabled: isHapticsEnabledState,
        setHaptics,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
