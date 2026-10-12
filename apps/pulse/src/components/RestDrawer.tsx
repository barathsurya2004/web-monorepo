import React, { useState } from 'react';
import { useRest, useStore } from '@/store';
import { fmtClock } from '@/lib/calc';
import { Ring } from '@/components/ui';
import { Play, Plus, Minus, X, Bell } from 'lucide-react';
import { haptic } from '@/lib/feedback';

export const RestDrawer: React.FC = () => {
  const { endsAt, total, remaining, label, adjust, skip } = useRest();
  const { active, screen } = useStore();
  const [expanded, setExpanded] = useState(false);

  if (!endsAt || remaining <= 0) return null;

  const hasActiveWorkoutBar = Boolean(active && screen.name !== 'workout');
  const progress = total > 0 ? (total - remaining) / total : 0;
  const isUrgent = remaining <= 5;
  const accentColor = isUrgent ? '#FFB5A7' : remaining <= 15 ? '#FBD8B3' : '#A8E6CF';

  return (
    <aside
      aria-label="Rest timer"
      className={`fixed left-1/2 z-50 -translate-x-1/2 px-4 transition-all duration-300 ${
        hasActiveWorkoutBar ? 'bottom-[136px] sm:bottom-[144px]' : 'bottom-20 sm:bottom-20'
      }`}
    >
      {/* Minimized Pill View */}
      {!expanded ? (
        <div
          onClick={() => {
            haptic.tap();
            setExpanded(true);
          }}
          className={`flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2.5 shadow-2xl backdrop-blur-2xl transition-all hover:scale-105 active:scale-95 ${
            isUrgent
              ? 'animate-heartbeat border-coral/60 bg-coral/20 text-coral'
              : 'border-white/15 bg-ink-850/95 text-fg'
          }`}
          style={{
            boxShadow: `0 10px 30px -10px ${accentColor}40`,
          }}
        >
          <Ring
            value={progress}
            size={34}
            stroke={3.5}
            color={accentColor}
            track="rgba(255,255,255,0.1)"
          >
            <Bell size={12} className={isUrgent ? 'animate-pulse text-coral' : 'text-muted'} />
          </Ring>

          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {label || 'Rest'}
            </span>
            <span className="num text-base font-extrabold tracking-tight" style={{ color: accentColor }}>
              {fmtClock(remaining)}
            </span>
          </div>

          <div className="ml-2 flex items-center gap-1.5 border-l border-white/10 pl-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                adjust(30);
              }}
              className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-fg hover:bg-white/20 active:scale-95"
            >
              +30s
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                skip();
              }}
              className="rounded-full p-1 text-muted hover:bg-white/10 hover:text-fg"
              title="Skip rest"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Floating Card */
        <div className="w-[320px] rounded-3xl border border-white/15 bg-ink-850/95 p-5 shadow-2xl backdrop-blur-2xl animate-rise">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Rest Period
              </span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="rounded-full p-1 text-muted hover:bg-white/10 hover:text-fg"
            >
              <X size={16} />
            </button>
          </div>

          <div className="my-5 flex flex-col items-center justify-center">
            <Ring
              value={progress}
              size={130}
              stroke={8}
              color={accentColor}
              track="rgba(255,255,255,0.08)"
            >
              <div className="flex flex-col items-center">
                <span className="num text-3xl font-black tracking-tight" style={{ color: accentColor }}>
                  {fmtClock(remaining)}
                </span>
                <span className="text-[11px] font-medium text-muted">
                  of {fmtClock(total)}
                </span>
              </div>
            </Ring>

            {label && (
              <p className="mt-3 truncate text-center text-xs font-medium text-muted max-w-[240px]">
                Up next: <strong className="text-fg">{label}</strong>
              </p>
            )}
          </div>

          {/* Quick adjustment controls */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => adjust(-15)}
              className="btn-ghost flex items-center justify-center py-2 text-xs font-bold"
            >
              -15s
            </button>
            <button
              onClick={() => adjust(+15)}
              className="btn-ghost flex items-center justify-center py-2 text-xs font-bold"
            >
              +15s
            </button>
            <button
              onClick={() => adjust(+30)}
              className="btn-ghost flex items-center justify-center py-2 text-xs font-bold"
            >
              +30s
            </button>
            <button
              onClick={() => skip()}
              className="btn-mint flex items-center justify-center py-2 text-xs font-bold"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
