import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AuthSession,
  LoggedSet,
  PersonalRecord,
  PlanDay,
  Routine,
  Screen,
  SessionBlock,
  Settings,
  SyncPayload,
  WorkoutSession,
} from '@/types';
import { DEFAULT_SETTINGS, MOCK_PLAN, MOCK_ROUTINES } from '@/data/mock';
import { getExercise } from '@/data/exercises';
import { computePRs, e1rm, fmtNum, todayDateKey, uid } from '@/lib/calc';
import { configureFeedback, haptic, sound } from '@/lib/feedback';
import { pulseApi } from '@/services/api';

const KEYS = {
  routines: 'pulse_routines_v3',
  plan: 'pulse_plan_v3',
  sessions: 'pulse_sessions_v4',
  active: 'pulse_active_v3',
  settings: 'pulse_settings_v3',
  skipped: 'pulse_skipped_v3',
};

function load<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* corrupted → fallback */
  }
  return fallback();
}

function save(key: string, value: unknown) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

// ── Toasts ─────────────────────────────────────────────────

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: 'mint' | 'amber' | 'coral' | 'lav' | 'pr';
}

// ── Store shape ────────────────────────────────────────────

interface Store {
  screen: Screen;
  navigate: (s: Screen) => void;
  back: () => void;
  canGoBack: boolean;

  routines: Routine[];
  saveRoutine: (r: Routine) => void;
  deleteRoutine: (id: string) => void;
  duplicateRoutine: (id: string) => void;

  plan: PlanDay[];
  setPlanDay: (weekday: number, routineId: string | null) => void;

  sessions: WorkoutSession[];
  deleteSession: (id: string) => void;
  prs: Map<string, PersonalRecord>;
  lastPerformance: (exerciseId: string, beforeTs?: number) => LoggedSet[] | null;

  active: WorkoutSession | null;
  startWorkout: (routineId?: string) => void;
  updateSet: (blockId: string, setId: string, patch: Partial<LoggedSet>, propagate?: boolean) => void;
  setBlockBarWeight: (blockId: string, barWeight: number) => void;
  toggleSet: (blockId: string, setId: string) => void;
  addSet: (blockId: string) => void;
  removeSet: (blockId: string, setId: string) => void;
  addBlock: (exerciseId: string) => void;
  removeBlock: (blockId: string) => void;
  updateBlockNote: (blockId: string, note: string) => void;
  finishWorkout: (meta: { rpe?: number; notes?: string }) => void;
  discardWorkout: () => void;

  skippedDates: string[];
  skipDay: (dateKey?: string) => void;
  unskipDay: (dateKey?: string) => void;
  isDaySkipped: (dateKey?: string) => boolean;

  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetDemoData: () => void;

  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;

  // ── Authentication & Cloud Sync ──
  session: AuthSession | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  loginWithToken: (token: string, name?: string) => Promise<void>;
  logout: () => void;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: number | null;
  triggerPushSync: (targetSession?: AuthSession | null) => Promise<void>;
}

const StoreCtx = createContext<Store | null>(null);

// ── Rest timer (separate context so ticking doesn't re-render the app) ──

interface RestState {
  endsAt: number | null;
  total: number;
  remaining: number;
  label: string;
  start: (seconds: number, label?: string) => void;
  adjust: (delta: number) => void;
  skip: () => void;
}

const RestCtx = createContext<RestState | null>(null);

function RestProvider({ children }: { children: React.ReactNode }) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [label, setLabel] = useState('');
  const [now, setNow] = useState(Date.now());
  const lastBlip = useRef<number>(-1);

  useEffect(() => {
    if (!endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const remaining = endsAt ? Math.max(0, (endsAt - now) / 1000) : 0;

  useEffect(() => {
    if (!endsAt) return;
    const secs = Math.ceil(remaining);
    if (remaining <= 0) {
      sound.chime();
      haptic.done();
      setEndsAt(null);
      lastBlip.current = -1;
      return;
    }
    if (secs <= 3 && secs !== lastBlip.current) {
      lastBlip.current = secs;
      sound.blip();
      haptic.tick();
    }
  }, [remaining, endsAt]);

  const start = useCallback((seconds: number, l = 'Rest') => {
    if (seconds <= 0) return;
    lastBlip.current = -1;
    setTotal(seconds);
    setLabel(l);
    setNow(Date.now());
    setEndsAt(Date.now() + seconds * 1000);
  }, []);

  const adjust = useCallback((delta: number) => {
    haptic.tap();
    setEndsAt((e) => (e ? Math.max(Date.now() + 1000, e + delta * 1000) : e));
    setTotal((t) => Math.max(1, t + delta));
  }, []);

  const skip = useCallback(() => {
    haptic.click();
    setEndsAt(null);
  }, []);

  const value = useMemo(() => ({ endsAt, total, remaining, label, start, adjust, skip }), [endsAt, total, remaining, label, start, adjust, skip]);
  return <RestCtx.Provider value={value}>{children}</RestCtx.Provider>;
}

export function useRest(): RestState {
  const ctx = useContext(RestCtx);
  if (!ctx) throw new Error('useRest outside provider');
  return ctx;
}

// ── Provider ───────────────────────────────────────────────

function cloneRoutineToSession(r: Routine | undefined, lastPerf: Store['lastPerformance']): WorkoutSession {
  const blocks: SessionBlock[] = (r?.blocks ?? []).map((b) => {
    const prev = lastPerf(b.exerciseId);
    const prevWorking = prev?.filter((s) => s.type === 'working');
    const lastWorking = prevWorking?.[prevWorking.length - 1];

    return {
      id: uid('sb'),
      exerciseId: b.exerciseId,
      rest: b.rest,
      supersetId: b.supersetId,
      note: b.note,
      targetReps: b.targetReps,
      sets: b.sets.map((ps, i) => {
        // 1. If user previously logged this exact set index with matching type:
        const p = prev?.[i];
        if (p && p.type === ps.type) {
          return {
            id: uid('ls'),
            type: ps.type,
            reps: p.reps,
            weight: p.weight,
            rpe: p.rpe ?? ps.rpe,
            done: false,
          };
        }

        // 2. If user previously completed working sets and this is an additional working set:
        if (ps.type === 'working' && lastWorking) {
          return {
            id: uid('ls'),
            type: 'working',
            reps: lastWorking.reps,
            weight: lastWorking.weight,
            rpe: lastWorking.rpe ?? ps.rpe,
            done: false,
          };
        }

        // 3. First time doing this workout / exercise: default strictly to the PDF routine values
        return {
          id: uid('ls'),
          type: ps.type,
          reps: ps.reps,
          weight: ps.weight,
          rpe: ps.rpe,
          done: false,
        };
      }),
    };
  });
  return {
    id: uid('ws'),
    routineId: r?.id,
    name: r?.name ?? 'Freestyle Session',
    color: r?.color ?? 'mint',
    startedAt: Date.now(),
    blocks,
  };
}

function Inner({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Screen[]>(() => {
    const active = load<WorkoutSession | null>(KEYS.active, () => null);
    return active ? [{ name: 'home' }, { name: 'workout' }] : [{ name: 'home' }];
  });
  const [routines, setRoutines] = useState<Routine[]>(() => load(KEYS.routines, () => MOCK_ROUTINES));
  const [plan, setPlan] = useState<PlanDay[]>(() => load(KEYS.plan, () => MOCK_PLAN));
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => load(KEYS.sessions, () => []));
  const [active, setActive] = useState<WorkoutSession | null>(() => load(KEYS.active, () => null));
  const [skippedDates, setSkippedDates] = useState<string[]>(() => load(KEYS.skipped, () => []));
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...load(KEYS.settings, () => DEFAULT_SETTINGS) }));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const rest = useRest();

  // ── Auth & Cloud Sync State ──
  const [session, setSession] = useState<AuthSession | null>(() => pulseApi.restoreSession());
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('pulse_last_synced_at');
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  useEffect(() => save(KEYS.routines, routines), [routines]);
  useEffect(() => save(KEYS.plan, plan), [plan]);
  useEffect(() => save(KEYS.sessions, sessions), [sessions]);
  useEffect(() => save(KEYS.active, active), [active]);
  useEffect(() => save(KEYS.skipped, skippedDates), [skippedDates]);
  useEffect(() => {
    save(KEYS.settings, settings);
    configureFeedback({ haptics: settings.haptics, sound: settings.sound });
  }, [settings]);

  const screen = stack[stack.length - 1];

  const navigate = useCallback((s: Screen) => {
    setStack((st) => {
      // Top-level tabs reset the stack so "back" stays intuitive.
      const tabs = ['home', 'planner', 'routines', 'analytics', 'history'];
      if (tabs.includes(s.name)) return [s];
      return [...st, s];
    });
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const back = useCallback(() => {
    setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid('t');
    setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.tone === 'pr' ? 4200 : 2600);
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);

  // ── Routines ──
  const saveRoutine = useCallback((r: Routine) => {
    setRoutines((rs) => (rs.some((x) => x.id === r.id) ? rs.map((x) => (x.id === r.id ? r : x)) : [...rs, r]));
  }, []);
  const deleteRoutine = useCallback((id: string) => {
    setRoutines((rs) => rs.filter((r) => r.id !== id));
    setPlan((p) => p.map((d) => (d.routineId === id ? { ...d, routineId: null } : d)));
  }, []);
  const duplicateRoutine = useCallback((id: string) => {
    setRoutines((rs) => {
      const src = rs.find((r) => r.id === id);
      if (!src) return rs;
      const copy: Routine = {
        ...structuredClone(src),
        id: uid('rt'),
        name: `${src.name} (copy)`,
        lastPerformed: undefined,
      };
      return [...rs, copy];
    });
  }, []);

  const setPlanDay = useCallback((weekday: number, routineId: string | null) => {
    setPlan((p) => p.map((d) => (d.weekday === weekday ? { ...d, routineId } : d)));
  }, []);

  // ── History ──
  const prs = useMemo(() => computePRs(sessions), [sessions]);

  const lastPerformance = useCallback(
    (exerciseId: string, beforeTs = Infinity): LoggedSet[] | null => {
      let bestSets: LoggedSet[] | null = null;
      let bestTs = -Infinity;
      for (const s of sessions) {
        if (s.startedAt >= beforeTs) continue;
        const blk = s.blocks.find((b) => b.exerciseId === exerciseId);
        if (!blk || !blk.sets || blk.sets.length === 0) continue;
        if (s.startedAt > bestTs) {
          bestTs = s.startedAt;
          bestSets = blk.sets;
        }
      }
      return bestSets;
    },
    [sessions],
  );

  const deleteSession = useCallback((id: string) => setSessions((ss) => ss.filter((s) => s.id !== id)), []);

  // ── Live workout ──
  const startWorkout = useCallback(
    (routineId?: string) => {
      sound.prime();
      haptic.click();

      // If a workout is already in progress, resume it without losing sets or timer
      if (active) {
        if (!routineId || routineId === active.routineId) {
          setStack((st) => (st[st.length - 1]?.name === 'workout' ? st : [...st, { name: 'workout' }]));
          return;
        }

        // User clicked to launch a DIFFERENT routine while one is in progress
        const targetRoutine = routines.find((x) => x.id === routineId);
        const confirmDiscard = window.confirm(
          `A workout is currently in progress ("${active.name}").\n\nDiscard the current workout and start "${targetRoutine?.name ?? 'New Routine'}" instead?`
        );
        if (!confirmDiscard) {
          setStack((st) => (st[st.length - 1]?.name === 'workout' ? st : [...st, { name: 'workout' }]));
          return;
        }
      }

      const r = routines.find((x) => x.id === routineId);
      setActive(cloneRoutineToSession(r, lastPerformance));
      setStack((st) => [...st, { name: 'workout' }]);
    },
    [active, routines, lastPerformance],
  );

  const mutateBlock = useCallback((blockId: string, fn: (b: SessionBlock) => SessionBlock) => {
    setActive((a) => (a ? { ...a, blocks: a.blocks.map((b) => (b.id === blockId ? fn(b) : b)) } : a));
  }, []);

  const setBlockBarWeight = useCallback(
    (blockId: string, barWeight: number) => {
      mutateBlock(blockId, (b) => ({ ...b, barWeight }));
    },
    [mutateBlock],
  );

  const updateSet = useCallback(
    (blockId: string, setId: string, patch: Partial<LoggedSet>, propagate = false) =>
      mutateBlock(blockId, (b) => {
        const setIdx = b.sets.findIndex((s) => s.id === setId);
        if (setIdx === -1) return b;
        return {
          ...b,
          sets: b.sets.map((s, idx) => {
            if (s.id === setId) return { ...s, ...patch };
            // If propagating weight changes to subsequent uncompleted sets in this block:
            if (propagate && idx > setIdx && !s.done && patch.weight !== undefined) {
              return { ...s, weight: patch.weight };
            }
            return s;
          }),
        };
      }),
    [mutateBlock],
  );

  const toggleSet = useCallback(
    (blockId: string, setId: string) => {
      if (!active) return;
      const blockIdx = active.blocks.findIndex((b) => b.id === blockId);
      const blk = active.blocks[blockIdx];
      const set = blk?.sets.find((s) => s.id === setId);
      if (!blk || !set) return;

      if (set.done) {
        haptic.tap();
        updateSet(blockId, setId, { done: false, isPR: false, completedAt: undefined });
        return;
      }

      // PR detection — compare against all-time best and any PR already set this session.
      const est = e1rm(set.weight, set.reps);
      const prior = prs.get(blk.exerciseId)?.e1rm ?? 0;
      const sessionBest = Math.max(
        0,
        ...active.blocks
          .filter((b) => b.exerciseId === blk.exerciseId)
          .flatMap((b) => b.sets)
          .filter((s) => s.done && s.type !== 'warmup')
          .map((s) => e1rm(s.weight, s.reps)),
      );
      const isPR = set.type !== 'warmup' && prior > 0 && est > Math.max(prior, sessionBest) + 0.01;

      updateSet(blockId, setId, { done: true, isPR, completedAt: Date.now() });

      // Automatically keep the same weight for the next uncompleted set in this exercise block
      const currentBlock = active.blocks.find((b) => b.id === blockId);
      const setIndex = currentBlock?.sets.findIndex((s) => s.id === setId);
      if (currentBlock && setIndex !== undefined && setIndex >= 0) {
        const nextSet = currentBlock.sets[setIndex + 1];
        if (nextSet && !nextSet.done && (!nextSet.weight || nextSet.weight === 0)) {
          updateSet(blockId, nextSet.id, { weight: set.weight }, true);
        }
      }

      if (isPR) {
        haptic.pr();
        sound.fanfare();
        toast({
          tone: 'pr',
          title: `New e1RM PR · ${fmtNum(est, 1)} ${settings.unit}`,
          body: `${getExercise(blk.exerciseId).name} · +${fmtNum(est - prior, 1)} ${settings.unit}`,
        });
      } else {
        haptic.success();
      }

      // Rest logic: supersets only rest after the last exercise of the group.
      if (settings.autoStartRest) {
        const next = active.blocks[blockIdx + 1];
        const inSupersetChain = blk.supersetId && next?.supersetId === blk.supersetId;
        const restSecs = inSupersetChain ? 0 : set.type === 'warmup' ? Math.min(60, blk.rest) : blk.rest;
        if (restSecs > 0) rest.start(restSecs, getExercise(blk.exerciseId).name);
      }
    },
    [active, prs, updateSet, toast, settings.unit, settings.autoStartRest, rest],
  );

  const addSet = useCallback(
    (blockId: string) => {
      haptic.tap();
      mutateBlock(blockId, (b) => {
        const last = b.sets[b.sets.length - 1];
        return {
          ...b,
          sets: [
            ...b.sets,
            { id: uid('ls'), type: last?.type === 'warmup' ? 'working' : last?.type ?? 'working', reps: last?.reps ?? 10, weight: last?.weight ?? 0, done: false },
          ],
        };
      });
    },
    [mutateBlock],
  );

  const removeSet = useCallback(
    (blockId: string, setId: string) => mutateBlock(blockId, (b) => ({ ...b, sets: b.sets.filter((s) => s.id !== setId) })),
    [mutateBlock],
  );

  const addBlock = useCallback(
    (exerciseId: string) => {
      const ex = getExercise(exerciseId);
      const prev = lastPerformance(exerciseId);
      const src = prev?.filter((s) => s.type !== 'warmup').slice(0, 3);

      // If first time doing this exercise, check if any routine in MOCK_ROUTINES defines default sets
      const routineMatch = MOCK_ROUTINES.flatMap((r) => r.blocks).find((b) => b.exerciseId === exerciseId);
      const defaultSets = routineMatch?.sets.filter((s) => s.type === 'working').slice(0, 3);

      const fallbackWeight = ex.equipment === 'barbell' ? 20 : ex.equipment === 'dumbbell' ? 10 : 0;
      const initialSets = src?.length
        ? src.map((s) => ({ reps: s.reps, weight: s.weight }))
        : defaultSets?.length
        ? defaultSets.map((s) => ({ reps: s.reps, weight: s.weight }))
        : [
            { reps: 10, weight: fallbackWeight },
            { reps: 10, weight: fallbackWeight },
            { reps: 10, weight: fallbackWeight },
          ];

      setActive((a) =>
        a
          ? {
              ...a,
              blocks: [
                ...a.blocks,
                {
                  id: uid('sb'),
                  exerciseId,
                  rest: ex.defaultRest,
                  targetReps: routineMatch?.targetReps,
                  note: routineMatch?.note,
                  sets: initialSets.map((s) => ({
                    id: uid('ls'),
                    type: 'working' as const,
                    reps: s.reps,
                    weight: s.weight,
                    done: false,
                  })),
                },
              ],
            }
          : a,
      );
    },
    [lastPerformance],
  );

  const removeBlock = useCallback((blockId: string) => {
    setActive((a) => (a ? { ...a, blocks: a.blocks.filter((b) => b.id !== blockId) } : a));
  }, []);

  const updateBlockNote = useCallback((blockId: string, note: string) => mutateBlock(blockId, (b) => ({ ...b, note })), [mutateBlock]);

  const finishWorkout = useCallback(
    ({ rpe, notes }: { rpe?: number; notes?: string }) => {
      if (!active) return;
      const finished: WorkoutSession = {
        ...active,
        endedAt: Date.now(),
        rpe,
        notes,
        // Drop un-performed sets and empty blocks from the log.
        blocks: active.blocks.map((b) => ({ ...b, sets: b.sets.filter((s) => s.done) })).filter((b) => b.sets.length > 0),
      };
      setSessions((ss) => [...ss, finished]);
      if (active.routineId) {
        setRoutines((rs) => rs.map((r) => (r.id === active.routineId ? { ...r, lastPerformed: new Date().toISOString() } : r)));
      }
      setActive(null);
      rest.skip();
      haptic.done();
      setStack([{ name: 'home' }, { name: 'summary', sessionId: finished.id }]);

      // Auto background push sync if logged in
      if (session) {
        pulseApi
          .pushSync({
            user_uuid: session.userUUID,
            client_time: Date.now(),
            settings,
            routines,
            sessions: [...sessions, finished],
            plan,
            skipped_dates: skippedDates,
          })
          .then((resp) => {
            setSyncStatus('synced');
            setLastSyncedAt(resp.synced_at);
            try {
              localStorage.setItem('pulse_last_synced_at', String(resp.synced_at));
            } catch {}
          })
          .catch((err) => {
            console.warn('[Pulse] Background sync after workout failed:', err);
            setSyncStatus('error');
          });
      }
    },
    [active, rest, session, settings, routines, sessions, plan, skippedDates],
  );

  const discardWorkout = useCallback(() => {
    setActive(null);
    rest.skip();
    setStack([{ name: 'home' }]);
  }, [rest]);

  const skipDay = useCallback((dateKey = todayDateKey()) => {
    setSkippedDates((prev) => (prev.includes(dateKey) ? prev : [...prev, dateKey]));
    haptic.tick();
  }, []);

  const unskipDay = useCallback((dateKey = todayDateKey()) => {
    setSkippedDates((prev) => prev.filter((d) => d !== dateKey));
    haptic.tick();
  }, []);

  const isDaySkipped = useCallback(
    (dateKey = todayDateKey()) => skippedDates.includes(dateKey),
    [skippedDates],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const resetDemoData = useCallback(() => {
    setRoutines(MOCK_ROUTINES);
    setPlan(MOCK_PLAN);
    setSessions([]);
    setActive(null);
    setSkippedDates([]);
    setSettings(DEFAULT_SETTINGS);
    setStack([{ name: 'home' }]);
  }, []);

  // ── Authentication & Zero-Data-Loss Backfill Sync ──
  const triggerPushSync = useCallback(
    async (targetSession?: AuthSession | null) => {
      const activeSession = targetSession || session;
      if (!activeSession) return;

      setSyncStatus('syncing');
      try {
        const payload: SyncPayload = {
          user_uuid: activeSession.userUUID,
          client_time: Date.now(),
          settings,
          routines,
          sessions,
          plan,
          skipped_dates: skippedDates,
        };

        const resp = await pulseApi.pushSync(payload);
        pulseApi.markBackfillDone(activeSession.userUUID);
        setSyncStatus('synced');
        setLastSyncedAt(resp.synced_at);
        try {
          localStorage.setItem('pulse_last_synced_at', String(resp.synced_at));
        } catch {}
      } catch (err) {
        console.warn('[Pulse] Push sync failed:', err);
        setSyncStatus('error');
        throw err;
      }
    },
    [session, settings, routines, sessions, plan, skippedDates],
  );

  const login = useCallback(
    async (email: string, pass: string) => {
      const newSession = await pulseApi.login(email, pass);
      setSession(newSession);
      // Zero data loss backfill: Existing browser workouts are preserved and synced
      try {
        await triggerPushSync(newSession);
      } catch (e) {
        console.warn('[Pulse] Initial login backfill sync deferred:', e);
      }
    },
    [triggerPushSync],
  );

  const signup = useCallback(
    async (name: string, email: string, pass: string) => {
      const newSession = await pulseApi.signup(name, email, pass);
      setSession(newSession);
      // Zero data loss backfill: Existing workouts synced to new user
      try {
        await triggerPushSync(newSession);
      } catch (e) {
        console.warn('[Pulse] Initial signup backfill sync deferred:', e);
      }
    },
    [triggerPushSync],
  );

  const loginWithToken = useCallback(
    async (token: string, name?: string) => {
      const newSession = await pulseApi.loginWithToken(token, name);
      setSession(newSession);
      // Zero data loss backfill
      try {
        await triggerPushSync(newSession);
      } catch (e) {
        console.warn('[Pulse] Initial token login backfill sync deferred:', e);
      }
    },
    [triggerPushSync],
  );

  const logout = useCallback(() => {
    pulseApi.clearSession();
    setSession(null);
    setSyncStatus('idle');
  }, []);

  // One-time auto-backfill on mount if already logged in and backfill hasn't completed
  useEffect(() => {
    if (session && !pulseApi.isBackfilled(session.userUUID)) {
      triggerPushSync(session).catch((e) => console.warn('[Pulse] Mount backfill sync deferred:', e));
    }
  }, [session, triggerPushSync]);

  const value: Store = {
    screen,
    navigate,
    back,
    canGoBack: stack.length > 1,
    routines,
    saveRoutine,
    deleteRoutine,
    duplicateRoutine,
    plan,
    setPlanDay,
    sessions,
    deleteSession,
    prs,
    lastPerformance,
    active,
    startWorkout,
    updateSet,
    setBlockBarWeight,
    toggleSet,
    addSet,
    removeSet,
    addBlock,
    removeBlock,
    updateBlockNote,
    finishWorkout,
    discardWorkout,
    skippedDates,
    skipDay,
    unskipDay,
    isDaySkipped,
    settings,
    updateSettings,
    resetDemoData,
    toasts,
    toast,
    dismissToast,
    session,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    login,
    signup,
    loginWithToken,
    logout,
    syncStatus,
    lastSyncedAt,
    triggerPushSync,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <RestProvider>
      <Inner>{children}</Inner>
    </RestProvider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
