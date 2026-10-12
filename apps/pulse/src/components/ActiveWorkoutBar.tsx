import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { fmtClock } from '@/lib/calc';
import { Play, Timer, Dumbbell, ChevronRight, Check } from 'lucide-react';
import { haptic } from '@/lib/feedback';

export const ActiveWorkoutBar: React.FC = () => {
  const { active, screen, navigate } = useStore();
  const [elapsed, setElapsed] = useState(0);

  // Live timer interval that continues ticking across all pages
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - active.startedAt) / 1000)));
    };
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [active?.startedAt]);

  // Only render when a workout is active AND user is not already on the workout screen
  if (!active || screen.name === 'workout') {
    return null;
  }

  const totalSets = active.blocks.reduce((acc, b) => acc + b.sets.length, 0);
  const doneSets = active.blocks.reduce(
    (acc, b) => acc + b.sets.filter((s) => s.done).length,
    0
  );
  const progressPercent = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const handleResume = () => {
    haptic.click();
    navigate({ name: 'workout' });
  };

  return (
    <aside
      aria-label="Active workout in progress"
      onClick={handleResume}
      className="fixed bottom-[max(calc(env(safe-area-inset-bottom,0px)+4.25rem),4.25rem)] sm:bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-lg cursor-pointer rounded-2xl border border-mint/40 bg-ink-950/95 p-2.5 sm:p-3 shadow-2xl shadow-mint/20 backdrop-blur-2xl transition-all duration-200 hover:border-mint/70 hover:scale-[1.01] active:scale-[0.99] select-none"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Indicator & Workout Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-mint/15 text-mint shrink-0">
            <Dumbbell size={18} className="text-mint animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-mint shadow-[0_0_8px_#A8E6CF]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mint font-mono leading-none">
                Active Workout
              </span>
              <span className="text-slate-500 text-[10px]">•</span>
              <span className="text-[10px] font-bold text-peach font-mono leading-none flex items-center gap-0.5">
                <Timer size={10} />
                {fmtClock(elapsed)}
              </span>
            </div>
            <div className="truncate text-sm font-black text-fg tracking-tight">
              {active.name}
            </div>
          </div>
        </div>

        {/* Right: Progress & Resume Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden xs:flex flex-col items-end text-right">
            <span className="text-[11px] font-mono font-bold text-fg">
              {doneSets}/{totalSets} sets
            </span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10 mt-0.5">
              <div
                className="h-full bg-mint transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResume();
            }}
            className="flex items-center gap-1 rounded-xl bg-mint px-3 py-1.5 text-xs font-black text-ink-950 shadow-md shadow-mint/25 transition-all hover:bg-mint/90 active:scale-95 whitespace-nowrap"
          >
            <Play size={13} fill="currentColor" />
            <span>Resume</span>
            <ChevronRight size={14} className="opacity-70" />
          </button>
        </div>
      </div>
    </aside>
  );
};
