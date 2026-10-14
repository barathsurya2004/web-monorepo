import React, { useState } from 'react';
import { MealItem } from '../types';
import { X, Check } from 'lucide-react';

interface MealItemEditModalProps {
  item: MealItem;
  onSave: (updated: MealItem) => void;
  onClose: () => void;
}

export const MealItemEditModal: React.FC<MealItemEditModalProps> = ({
  item,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(item.name);
  const [weight, setWeight] = useState(item.estimated_weight_grams || 0);
  const [calories, setCalories] = useState(item.calories);
  const [protein, setProtein] = useState(item.protein_grams);
  const [carbs, setCarbs] = useState(item.carbs_grams);
  const [fat, setFat] = useState(item.fat_grams);
  const [fiber, setFiber] = useState(item.fiber_grams || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...item,
      name,
      estimated_weight_grams: Number(weight),
      calories: Number(calories),
      protein_grams: Number(protein),
      carbs_grams: Number(carbs),
      fat_grams: Number(fat),
      fiber_grams: Number(fiber),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3.5 pt-[max(calc(env(safe-area-inset-top,0px)+1rem),1.25rem)] pb-[max(calc(env(safe-area-inset-bottom,0px)+1rem),1.25rem)] sm:p-4 animate-fade">
      <div className="bg-ink-900 border border-white/15 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-pop">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-display font-bold text-base text-fg">
            Edit Item & Macros
          </h4>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-fg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              Food / Dish Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-fg text-xs focus:outline-none focus:border-mint"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Portion Weight (g)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-fg text-xs focus:outline-none focus:border-mint"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mint uppercase tracking-wider mb-1">
                Calories (kcal)
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-mint/40 text-mint font-bold text-xs focus:outline-none focus:border-mint"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-peach uppercase tracking-wider mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                step="0.1"
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
                step="0.1"
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
                step="0.1"
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
                required
                className="w-full px-2.5 py-2 rounded-xl bg-ink-800 border border-white/10 text-coral text-xs font-bold focus:outline-none focus:border-coral"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
              Dietary Fiber (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={fiber}
              onChange={(e) => setFiber(Number(e.target.value))}
              className="w-full px-2.5 py-2 rounded-xl bg-ink-800 border border-white/10 text-fg text-xs focus:outline-none focus:border-mint"
            />
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
              className="flex-1 py-2.5 rounded-xl bg-mint text-ink-950 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-mint/90 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
