import React, { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Page, PageHeader, Card, SectionTitle, Segmented } from '@/components/ui';
import { Badge } from '@packages/ui';
import { getExercise, ALL_MUSCLES, MUSCLE_LABEL } from '@/data/exercises';
import {
  e1rm,
  sessionVolume,
  startOfWeek,
  startOfDay,
  fmtNum,
  fmtCompact,
  fmtDate,
  muscleSets,
} from '@/lib/calc';
import {
  Trophy,
  TrendingUp,
  BarChart3,
  Flame,
  Calendar,
  Zap,
} from 'lucide-react';
import { haptic } from '@/lib/feedback';

const BIG_FOUR = [
  { id: 'bench', name: 'Bench Press' },
  { id: 'squat', name: 'Back Squat' },
  { id: 'deadlift', name: 'Deadlift' },
  { id: 'ohp', name: 'Overhead Press' },
];

export const AnalyticsView: React.FC = () => {
  const { sessions, prs, settings } = useStore();
  const [selectedLift, setSelectedLift] = useState<string>('bench');

  // Sorted chronologically
  const chronological = useMemo(
    () => [...sessions].sort((a, b) => a.startedAt - b.startedAt),
    [sessions]
  );

  // 1RM points over time for the selected lift
  const liftTrajectory = useMemo(() => {
    const points: { date: number; weight: number; reps: number; e1rm: number }[] = [];
    let record = 0;

    for (const s of chronological) {
      for (const b of s.blocks) {
        if (b.exerciseId !== selectedLift) continue;
        for (const set of b.sets) {
          if (!set.done || set.type === 'warmup') continue;
          const est = e1rm(set.weight, set.reps);
          if (est > 0) {
            points.push({
              date: s.startedAt,
              weight: set.weight,
              reps: set.reps,
              e1rm: est,
            });
            if (est > record) record = est;
          }
        }
      }
    }
    return points;
  }, [chronological, selectedLift]);

  // Weekly volume bars (last 10 weeks)
  const weeklyVolumes = useMemo(() => {
    const weeksMap = new Map<number, number>();
    const now = Date.now();
    const tenWeeksAgo = startOfWeek(now) - 9 * 7 * 86400000;

    // Initialize 10 weeks
    for (let i = 0; i < 10; i++) {
      const wStart = tenWeeksAgo + i * 7 * 86400000;
      weeksMap.set(wStart, 0);
    }

    for (const s of chronological) {
      const sw = startOfWeek(s.startedAt);
      if (weeksMap.has(sw)) {
        weeksMap.set(sw, (weeksMap.get(sw) || 0) + sessionVolume(s));
      }
    }

    return Array.from(weeksMap.entries()).map(([wStart, vol], idx) => ({
      weekIdx: idx + 1,
      wStart,
      volume: vol,
    }));
  }, [chronological]);

  const maxWeeklyVol = Math.max(1, ...weeklyVolumes.map((w) => w.volume));

  // Muscle sets distribution
  const muscleDistribution = useMemo(() => muscleSets(sessions), [sessions]);
  const maxMuscleCount = Math.max(1, ...Object.values(muscleDistribution));

  // Consistency heatmap (last 12 weeks: 12 cols x 7 rows)
  const heatmapData = useMemo(() => {
    const today = startOfDay(Date.now());
    const days: { date: number; hasSession: boolean }[] = [];
    const totalDays = 12 * 7;

    const sessionDays = new Set(sessions.map((s) => startOfDay(s.startedAt)));

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = today - i * 86400000;
      days.push({
        date: d,
        hasSession: sessionDays.has(d),
      });
    }
    return days;
  }, [sessions]);

  // Selected lift best
  const currentLiftPR = prs.get(selectedLift);

  return (
    <Page>
      <PageHeader
        eyebrow="Biometric Intelligence"
        title="Strength & Volume Analytics"
        subtitle="Track progressive overload, rolling 1-rep maximums, periodization curves, and muscle balance."
      />

      {/* 1RM Progression Section */}
      <Card className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="label">Estimated 1RM Trajectory</div>
            <div className="mt-1 flex items-baseline gap-2 font-mono">
              <span className="text-3xl font-black text-amber">
                {currentLiftPR ? fmtNum(currentLiftPR.e1rm, 1) : '—'}
              </span>
              <span className="text-sm text-muted">{settings.unit} PR</span>
              {currentLiftPR && (
                <span className="text-xs text-dim">
                  ({currentLiftPR.weight}{settings.unit} × {currentLiftPR.reps})
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {BIG_FOUR.map((lift) => (
              <button
                key={lift.id}
                onClick={() => {
                  haptic.tap();
                  setSelectedLift(lift.id);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-mono font-bold transition-all ${
                  selectedLift === lift.id
                    ? 'bg-amber text-ink-950 shadow-md shadow-amber/20'
                    : 'text-muted hover:text-fg hover:bg-white/5'
                }`}
              >
                {lift.name}
              </button>
            ))}
          </div>
        </div>

        {/* 1RM Sparkline / Trajectory SVG */}
        <div className="mt-6">
          {liftTrajectory.length < 2 ? (
            <div className="py-12 text-center text-xs text-dim italic">
              Log at least 2 sessions of {getExercise(selectedLift).name} to render the trajectory curve.
            </div>
          ) : (
            <div className="relative h-44 w-full">
              {/* SVG Trendline */}
              <svg className="h-full w-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD166" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FFD166" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {(() => {
                  const min = Math.min(...liftTrajectory.map((p) => p.e1rm)) * 0.95;
                  const max = Math.max(...liftTrajectory.map((p) => p.e1rm)) * 1.05;
                  const range = max - min || 1;

                  const coords = liftTrajectory.map((p, idx) => {
                    const x = (idx / (liftTrajectory.length - 1)) * 500;
                    const y = 150 - ((p.e1rm - min) / range) * 130;
                    return { x, y, p };
                  });

                  const pathD = coords.reduce(
                    (acc, c, idx) => (idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`),
                    ''
                  );
                  const areaD = `${pathD} L 500 160 L 0 160 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#curveGradient)" />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#FFD166"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {coords.map((c, idx) => (
                        <circle
                          key={idx}
                          cx={c.x}
                          cy={c.y}
                          r={idx === coords.length - 1 ? 5 : 3}
                          fill="#FFD166"
                          stroke="#141226"
                          strokeWidth="2"
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>

              <div className="mt-2 flex justify-between text-[10px] font-mono text-dim">
                <span>Earliest recorded</span>
                <span>Current strength level</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Weekly Volume Load Bar Chart */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="label">Weekly Training Volume Load</div>
            <div className="mt-1 text-sm text-muted">
              Periodization curves and cumulative tonnage ({settings.unit})
            </div>
          </div>
          <BarChart3 size={20} className="text-mint" />
        </div>

        <div className="mt-6 flex h-48 items-end gap-2 sm:gap-4">
          {weeklyVolumes.map((w, idx) => {
            const heightPct = Math.max(8, (w.volume / maxWeeklyVol) * 100);
            const isLast = idx === weeklyVolumes.length - 1;

            return (
              <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                {/* Tooltip on hover */}
                <div className="absolute -top-8 hidden rounded-lg bg-ink-950 px-2 py-1 font-mono text-[10px] text-fg shadow-lg group-hover:block whitespace-nowrap z-10 border border-white/10">
                  {fmtCompact(w.volume)} {settings.unit}
                </div>

                <div
                  className={`w-full rounded-t-xl transition-all duration-500 ${
                    isLast
                      ? 'bg-mint shadow-[0_0_12px_rgba(168,230,207,0.5)]'
                      : 'bg-white/10 group-hover:bg-mint/60'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />

                <span className="mt-2 font-mono text-[10px] text-dim">
                  W{w.weekIdx}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Consistency Heatmap */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="label">Consistency Streak (Last 12 Weeks)</div>
            <div className="mt-1 text-sm text-muted">
              {sessions.length} total workout sessions completed
            </div>
          </div>
          <Flame size={20} className="text-peach" />
        </div>

        <div className="mt-6 overflow-x-auto pb-2 no-scrollbar">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-max">
            {heatmapData.map((d, idx) => (
              <div
                key={idx}
                className={`h-3.5 w-3.5 rounded-sm transition-colors ${
                  d.hasSession
                    ? 'bg-mint shadow-[0_0_6px_rgba(168,230,207,0.6)]'
                    : 'bg-white/[0.04]'
                }`}
                title={fmtDate(d.date)}
              />
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-dim font-mono">
          <span>Rest</span>
          <span className="h-2.5 w-2.5 rounded-sm bg-white/[0.04]" />
          <span className="h-2.5 w-2.5 rounded-sm bg-mint" />
          <span>Active Session</span>
        </div>
      </Card>

      {/* Muscle Volume Breakdown */}
      <Card className="p-6 mb-8">
        <div className="label mb-1">Cumulative Muscle Volume Balance</div>
        <p className="text-xs text-muted mb-4">Hard working sets logged per muscle group</p>

        <div className="space-y-3">
          {ALL_MUSCLES.map((muscle) => {
            const count = muscleDistribution[muscle] || 0;
            const pct = (count / maxMuscleCount) * 100;

            return (
              <div key={muscle} className="flex items-center gap-3 text-xs">
                <span className="w-24 font-bold text-slate-300 truncate">
                  {MUSCLE_LABEL[muscle]}
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lav to-mint transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-muted">
                  {Math.round(count)} sets
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </Page>
  );
};
