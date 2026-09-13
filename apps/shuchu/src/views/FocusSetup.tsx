import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@packages/ui';
import { ArrowLeft, Timer, Minus, Plus } from 'lucide-react';
import { HabitIcon } from '@/components/HabitIcon';

const WORK_DURATIONS = [15, 25, 45, 60];
const SHORT_BREAK_OPTS = [3, 5, 10, 15];
const LONG_BREAK_OPTS = [10, 15, 20, 30];
const SESSION_COUNTS = [1, 2, 3, 4, 6, 8];

export const FocusSetup: React.FC = () => {
  const {
    habits,
    shortBreakDurationMinutes,
    longBreakDurationMinutes,
    setShortBreakDuration,
    setLongBreakDuration,
    startFocusSession,
    setScreen,
  } = useApp();

  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(shortBreakDurationMinutes);
  const [longBreak, setLongBreak] = useState(longBreakDurationMinutes);
  const [sessions, setSessions] = useState(4);

  const selectedHabit = habits.find((h) => h.id === selectedHabitId) ?? null;

  const handleStart = () => {
    // Persist break preferences
    setShortBreakDuration(shortBreak);
    setLongBreakDuration(longBreak);
    startFocusSession(selectedHabitId ?? undefined, workDuration, sessions);
  };

  const OptionPill = ({
    value,
    selected,
    onClick,
    label,
  }: {
    value: number;
    selected: boolean;
    onClick: () => void;
    label?: string;
  }) => (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
        selected
          ? 'bg-[var(--clay-terracotta)] text-white border-[var(--clay-terracotta)] shadow-sm'
          : 'bg-[var(--surface-warm)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)] hover:border-[var(--accent)]'
      }`}
    >
      {label ?? `${value}m`}
    </button>
  );

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-y-auto bg-[var(--bg)] flex flex-col animate-soft-fade">
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6 px-5 pt-[max(calc(env(safe-area-inset-top,0px)+1rem),3rem)] pb-[max(calc(env(safe-area-inset-bottom,0px)+1rem),5rem)]">

        {/* Back */}
        <button
          onClick={() => setScreen('today')}
          className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors text-sm font-medium cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Title */}
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-[var(--clay-soft)] border border-[var(--clay-border)] flex items-center justify-center">
              <Timer className="w-5 h-5 text-[var(--clay-terracotta)]" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-[var(--fg)]">Focus Setup</h1>
          </div>
          <p className="text-sm text-[var(--muted)] font-serif italic ml-11">
            Configure your session before entering the sanctuary.
          </p>
        </div>

        {/* ── 1. What to Focus On ── */}
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] uppercase tracking-widest font-bold text-[var(--muted)]">
            What are you focusing on?
          </h2>

          {/* Open Flow option */}
          <button
            onClick={() => setSelectedHabitId(null)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
              selectedHabitId === null
                ? 'bg-[var(--clay-soft)] border-[var(--clay-border)] shadow-sm'
                : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-warm)]'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              selectedHabitId === null
                ? 'bg-[var(--clay-terracotta)] border-[var(--clay-terracotta)]'
                : 'bg-[var(--surface-pebble)] border-[var(--border)]'
            }`}>
              <Timer className={`w-4 h-4 ${selectedHabitId === null ? 'text-white' : 'text-[var(--muted)]'}`} />
            </div>
            <div>
              <div className={`font-semibold text-sm ${selectedHabitId === null ? 'text-[var(--clay-terracotta)]' : 'text-[var(--fg)]'}`}>
                Open Flow
              </div>
              <div className="text-[11px] text-[var(--muted)]">No habit — pure focus time</div>
            </div>
            {selectedHabitId === null && (
              <div className="ml-auto w-5 h-5 rounded-full bg-[var(--clay-terracotta)] flex items-center justify-center">
                <svg viewBox="0 0 12 9" className="w-3 h-3 fill-white"><path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
              </div>
            )}
          </button>

          {/* Habit list */}
          {habits.length > 0 && (
            <div className="flex flex-col gap-2">
              {habits.map((h) => {
                const isSelected = selectedHabitId === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHabitId(h.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[var(--clay-soft)] border-[var(--clay-border)] shadow-sm'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-warm)]'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                      isSelected ? 'bg-[var(--clay-terracotta)] border-[var(--clay-terracotta)]' : 'bg-[var(--surface-pebble)] border-[var(--border)]'
                    }`}>
                      <HabitIcon icon={h.icon} className={`w-4.5 h-4.5 ${isSelected ? 'text-white' : 'text-[var(--muted)]'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`font-semibold text-sm truncate ${isSelected ? 'text-[var(--clay-terracotta)]' : 'text-[var(--fg)]'}`}>
                        {h.title}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">{h.category} · {h.targetValue} {h.unit}</div>
                    </div>
                    {isSelected && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-[var(--clay-terracotta)] flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 12 9" className="w-3 h-3 fill-white"><path d="M1 4l3.5 3.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 2. Session Count ── */}
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] uppercase tracking-widest font-bold text-[var(--muted)]">
            How many sessions?
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {SESSION_COUNTS.map((n) => (
              <OptionPill
                key={n}
                value={n}
                selected={sessions === n}
                onClick={() => setSessions(n)}
                label={`${n} session${n > 1 ? 's' : ''}`}
              />
            ))}
          </div>
        </section>

        {/* ── 3. Durations ── */}
        <section className="space-y-4">
          <h2 className="font-mono text-[11px] uppercase tracking-widest font-bold text-[var(--muted)]">
            Durations
          </h2>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-[var(--border-subtle)]">
            {/* Work */}
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--fg)]">Work</div>
                <div className="text-[11px] text-[var(--muted)]">Focus duration per session</div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {WORK_DURATIONS.map((d) => (
                  <OptionPill key={d} value={d} selected={workDuration === d} onClick={() => setWorkDuration(d)} />
                ))}
              </div>
            </div>

            {/* Short break */}
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--fg)]">Short Break</div>
                <div className="text-[11px] text-[var(--muted)]">Between sessions</div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {SHORT_BREAK_OPTS.map((d) => (
                  <OptionPill key={d} value={d} selected={shortBreak === d} onClick={() => setShortBreak(d)} />
                ))}
              </div>
            </div>

            {/* Long break */}
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--fg)]">Long Break</div>
                <div className="text-[11px] text-[var(--muted)]">After every 4 sessions</div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {LONG_BREAK_OPTS.map((d) => (
                  <OptionPill key={d} value={d} selected={longBreak === d} onClick={() => setLongBreak(d)} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Summary ── */}
        <div className="bg-[var(--surface-warm)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center gap-4 text-center">
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Sessions</div>
            <div className="font-display text-lg font-bold text-[var(--fg)]">{sessions}</div>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Work</div>
            <div className="font-display text-lg font-bold text-[var(--fg)]">{workDuration}m</div>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Breaks</div>
            <div className="font-display text-lg font-bold text-[var(--fg)]">{shortBreak}m / {longBreak}m</div>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase text-[var(--muted)]">Total</div>
            <div className="font-display text-lg font-bold text-[var(--clay-terracotta)]">
              ~{Math.round((workDuration * sessions) + (shortBreak * Math.max(0, sessions - 1)))}m
            </div>
          </div>
        </div>

        {/* ── Start Button ── */}
        <Button
          variant="pastelTerracotta"
          onClick={handleStart}
          className="!rounded-2xl !min-h-[52px] font-mono text-sm font-bold w-full shadow-md"
        >
          <Timer className="w-4 h-4 mr-2" />
          Enter the Sanctuary
          {selectedHabit ? ` · ${selectedHabit.title}` : ' · Open Flow'}
        </Button>
      </div>
    </div>
  );
};
