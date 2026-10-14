import React, { useState } from 'react';
import { NutritionGoals } from '../types';
import { X, Sliders, Check } from 'lucide-react';

interface GoalsModalProps {
  currentGoals: NutritionGoals;
  onSave: (goals: NutritionGoals) => void;
  onClose: () => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({
  currentGoals,
  onSave,
  onClose,
}) => {
  const [calories, setCalories] = useState(currentGoals.calories_target);
  const [protein, setProtein] = useState(currentGoals.protein_grams);
  const [carbs, setCarbs] = useState(currentGoals.carbs_grams);
  const [fat, setFat] = useState(currentGoals.fat_grams);
  const [fiber, setFiber] = useState(currentGoals.fiber_grams || 30);
  const [sodium, setSodium] = useState(currentGoals.sodium_mg || 2300);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...currentGoals,
      calories_target: Number(calories),
      protein_grams: Number(protein),
      carbs_grams: Number(carbs),
      fat_grams: Number(fat),
      fiber_grams: Number(fiber),
      sodium_mg: Number(sodium),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3.5 pt-[max(calc(env(safe-area-inset-top,0px)+1rem),1.25rem)] pb-[max(calc(env(safe-area-inset-bottom,0px)+1rem),1.25rem)] sm:p-4 animate-fade">
      <div className="bg-ink-900 border border-white/15 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-pop">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-peach" />
            <h4 className="font-display font-bold text-base text-fg">
              Daily Nutrition Goals
            </h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-fg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-mint uppercase tracking-wider mb-1">
              Daily Calorie Target (kcal)
            </label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              required
              className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-mint/30 text-mint font-bold text-sm focus:outline-none focus:border-mint"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-peach uppercase tracking-wider mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                required
                className="w-full px-2.5 py-2 rounded-xl bg-ink-800 border border-white/10 text-peach text-xs font-bold focus:outline-none focus:border-peach"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-lav uppercase tracking-wider mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                required
                className="w-full px-2.5 py-2 rounded-xl bg-ink-800 border border-white/10 text-lav text-xs font-bold focus:outline-none focus:border-lav"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-coral uppercase tracking-wider mb-1">
                Fat (g)
              </label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
                required
                className="w-full px-2.5 py-2 rounded-xl bg-ink-800 border border-white/10 text-coral text-xs font-bold focus:outline-none focus:border-coral"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Fiber Target (g)
              </label>
              <input
                type="number"
                value={fiber}
                onChange={(e) => setFiber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-fg text-xs focus:outline-none focus:border-mint"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Sodium Limit (mg)
              </label>
              <input
                type="number"
                value={sodium}
                onChange={(e) => setSodium(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-fg text-xs focus:outline-none focus:border-mint"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-ink-800 border border-white/10 text-xs font-semibold text-muted hover:text-fg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-peach text-ink-950 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-peach/90 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Update Targets</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
