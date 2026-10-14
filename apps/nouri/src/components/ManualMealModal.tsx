import React, { useState } from 'react';
import { X, Plus, Utensils } from 'lucide-react';
import { MealItem } from '../types';

interface ManualMealModalProps {
  onSave: (meal: {
    meal_type: string;
    notes?: string;
    items: Omit<MealItem, 'id'>[];
  }) => void;
  onClose: () => void;
}

export const ManualMealModal: React.FC<ManualMealModalProps> = ({
  onSave,
  onClose,
}) => {
  const [mealType, setMealType] = useState('snack');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState(150);
  const [calories, setCalories] = useState(250);
  const [protein, setProtein] = useState(20);
  const [carbs, setCarbs] = useState(25);
  const [fat, setFat] = useState(6);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      meal_type: mealType,
      notes,
      items: [
        {
          name,
          estimated_weight_grams: Number(weight),
          calories: Number(calories),
          protein_grams: Number(protein),
          carbs_grams: Number(carbs),
          fat_grams: Number(fat),
          fiber_grams: 3,
          confidence_score: 1.0,
          ingredients: [name],
        },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3.5 pt-[max(calc(env(safe-area-inset-top,0px)+1rem),1.25rem)] pb-[max(calc(env(safe-area-inset-bottom,0px)+1rem),1.25rem)] sm:p-4 animate-fade">
      <div className="bg-ink-900 border border-white/15 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-pop">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-mint" />
            <h4 className="font-display font-bold text-base text-fg">
              Manual Meal Entry
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
          {/* Meal type */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`py-2 rounded-xl capitalize transition-all ${
                    mealType === type
                      ? 'bg-mint text-ink-950 font-bold'
                      : 'bg-ink-800 text-muted hover:text-fg border border-white/5'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              Food / Item Description
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Protein shake with banana & almond butter"
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
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Post-workout snack"
              className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-fg text-xs focus:outline-none focus:border-mint"
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
              <Plus className="w-4 h-4" />
              <span>Add to Diary</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
