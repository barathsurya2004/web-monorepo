import React from 'react';
import { DailyNutritionSummary } from '../types';
import { Flame, Beef, Wheat, Droplets } from 'lucide-react';

interface MacroRingCardProps {
  summary: DailyNutritionSummary;
}

export const MacroRingCard: React.FC<MacroRingCardProps> = ({ summary }) => {
  const {
    total_calories = 0,
    total_protein = 0,
    total_carbs = 0,
    total_fat = 0,
    total_fiber = 0,
    total_sodium = 0,
    goals,
  } = summary || {};
  const safeGoals = goals || ({} as any);

  const calGoal = safeGoals.calories_target || 2200;
  const protGoal = safeGoals.protein_grams || 160;
  const carbsGoal = safeGoals.carbs_grams || 220;
  const fatGoal = safeGoals.fat_grams || 65;

  const calRemaining = Math.max(0, calGoal - total_calories);
  const calPercent = Math.min(100, Math.round((total_calories / calGoal) * 100));

  const protPercent = Math.min(100, Math.round((total_protein / protGoal) * 100));
  const carbsPercent = Math.min(100, Math.round((total_carbs / carbsGoal) * 100));
  const fatPercent = Math.min(100, Math.round((total_fat / fatGoal) * 100));

  return (
    <div className="velvet-card rounded-2xl p-3.5 sm:p-5 border border-white/10 shadow-xl w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        {/* Main Calorie Ring / Visual Counter */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-white/5"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-mint transition-all duration-700 ease-out"
                strokeWidth="10"
                strokeDasharray={263.89}
                strokeDashoffset={263.89 - (263.89 * calPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display font-extrabold text-lg sm:text-2xl text-fg tracking-tight">
                {Math.round(total_calories)}
              </span>
              <span className="text-[9px] sm:text-[11px] font-mono text-muted uppercase tracking-wider">
                kcal
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-mint text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-mint" />
              <span>Energy Budget</span>
            </div>
            <h2 className="text-base sm:text-xl font-display font-bold text-fg truncate">
              {calRemaining > 0 ? (
                <>
                  <span className="text-mint">{Math.round(calRemaining)}</span> kcal left
                </>
              ) : (
                <span className="text-mint">Goal Reached!</span>
              )}
            </h2>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5 sm:mt-1 font-mono">
              Target: <span className="text-fg font-semibold">{calGoal} kcal</span> ({calPercent}%)
            </p>
          </div>
        </div>

        {/* Macro Bars Grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 flex-1 w-full">
          {/* Protein */}
          <div className="bg-ink-850/80 rounded-xl p-2 sm:p-3 border border-peach/15 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="flex items-center gap-1 text-peach min-w-0">
                <Beef className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="text-[10px] sm:text-xs font-semibold truncate">Protein</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-muted">{protPercent}%</span>
            </div>
            <div>
              <div className="text-xs sm:text-base font-display font-bold text-fg mb-1 sm:mb-1.5 truncate">
                {Math.round(total_protein)}
                <span className="text-[9px] sm:text-xs font-normal text-muted font-mono"> / {protGoal}g</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-peach h-full rounded-full transition-all duration-500"
                  style={{ width: `${protPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-ink-850/80 rounded-xl p-2 sm:p-3 border border-lav/15 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="flex items-center gap-1 text-lav min-w-0">
                <Wheat className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="text-[10px] sm:text-xs font-semibold truncate">Carbs</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-muted">{carbsPercent}%</span>
            </div>
            <div>
              <div className="text-xs sm:text-base font-display font-bold text-fg mb-1 sm:mb-1.5 truncate">
                {Math.round(total_carbs)}
                <span className="text-[9px] sm:text-xs font-normal text-muted font-mono"> / {carbsGoal}g</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-lav h-full rounded-full transition-all duration-500"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fats */}
          <div className="bg-ink-850/80 rounded-xl p-2 sm:p-3 border border-coral/15 flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="flex items-center gap-1 text-coral min-w-0">
                <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="text-[10px] sm:text-xs font-semibold truncate">Fats</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-muted">{fatPercent}%</span>
            </div>
            <div>
              <div className="text-xs sm:text-base font-display font-bold text-fg mb-1 sm:mb-1.5 truncate">
                {Math.round(total_fat)}
                <span className="text-[9px] sm:text-xs font-normal text-muted font-mono"> / {fatGoal}g</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-coral h-full rounded-full transition-all duration-500"
                  style={{ width: `${fatPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Micro-Nutrient bar */}
      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/5 flex items-center justify-between text-[11px] sm:text-xs text-muted font-mono">
        <div>
          Fiber:{' '}
          <span className="text-fg font-semibold">
            {Math.round(total_fiber * 10) / 10}g
          </span>{' '}
          / {safeGoals.fiber_grams || 30}g
        </div>
        <div>
          Sodium:{' '}
          <span className="text-fg font-semibold">
            {Math.round(total_sodium)}mg
          </span>{' '}
          / {safeGoals.sodium_mg || 2300}mg
        </div>
      </div>
    </div>
  );
};
