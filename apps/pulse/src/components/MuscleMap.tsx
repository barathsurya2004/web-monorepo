import React from 'react';
import type { Muscle } from '@/types';
import { MUSCLE_LABEL } from '@/data/exercises';

interface MuscleMapProps {
  distribution: Partial<Record<Muscle, number>>;
  maxSets?: number;
  className?: string;
}

export const MuscleMap: React.FC<MuscleMapProps> = ({
  distribution,
  maxSets = 16,
  className = '',
}) => {
  const getIntensityColor = (m: Muscle): string => {
    const val = distribution[m] || 0;
    if (val === 0) return 'rgba(255, 255, 255, 0.04)';
    const ratio = Math.min(1, val / maxSets);
    if (ratio > 0.7) return '#A8E6CF'; // Intense mint
    if (ratio > 0.4) return '#FBD8B3'; // Medium peach
    return '#C8B6FF'; // Light lavender
  };

  const getIntensityBorder = (m: Muscle): string => {
    const val = distribution[m] || 0;
    if (val === 0) return 'rgba(255, 255, 255, 0.08)';
    const ratio = Math.min(1, val / maxSets);
    if (ratio > 0.7) return 'rgba(168, 230, 207, 0.6)';
    if (ratio > 0.4) return 'rgba(251, 216, 179, 0.6)';
    return 'rgba(200, 182, 255, 0.4)';
  };

  const musclesList: { key: Muscle; label: string }[] = [
    { key: 'chest', label: 'Chest' },
    { key: 'back', label: 'Back' },
    { key: 'shoulders', label: 'Shoulders' },
    { key: 'biceps', label: 'Biceps' },
    { key: 'triceps', label: 'Triceps' },
    { key: 'abs', label: 'Core / Abs' },
    { key: 'quads', label: 'Quads' },
    { key: 'hamstrings', label: 'Hamstrings' },
    { key: 'glutes', label: 'Glutes' },
    { key: 'calves', label: 'Calves' },
  ];

  return (
    <div className={`rounded-2xl border border-white/10 bg-ink-950/60 p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-muted">Muscle Impact Heatmap</span>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-lav" /> Light
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-peach" /> Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-mint" /> High
          </span>
        </div>
      </div>

      {/* Grid of muscle blocks */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {musclesList.map(({ key, label }) => {
          const count = distribution[key] || 0;
          const bg = getIntensityColor(key);
          const border = getIntensityBorder(key);
          const hasSets = count > 0;

          return (
            <div
              key={key}
              className="group relative flex flex-col justify-between rounded-xl p-2.5 transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: bg,
                border: `1px solid ${border}`,
              }}
            >
              <div className="text-[11px] font-semibold text-fg/90 truncate">{label}</div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span
                  className={`text-base font-extrabold ${
                    hasSets ? 'text-ink-950 font-black' : 'text-dim'
                  }`}
                  style={hasSets ? { color: '#0F0D24' } : undefined}
                >
                  {count > 0 ? `${count} sets` : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
