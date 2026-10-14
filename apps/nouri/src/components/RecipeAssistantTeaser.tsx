import React from 'react';
import { DailyNutritionSummary } from '../types';
import { Sparkles, ChefHat, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface RecipeAssistantTeaserProps {
  summary: DailyNutritionSummary;
}

export const RecipeAssistantTeaser: React.FC<RecipeAssistantTeaserProps> = ({ summary }) => {
  const { total_calories = 0, total_protein = 0, total_carbs = 0, total_fat = 0, goals, meals } = summary || {};
  const safeGoals = goals || ({} as any);
  const safeMeals = meals || [];

  const calRemaining = Math.max(0, (safeGoals.calories_target || 2200) - total_calories);
  const protRemaining = Math.max(0, (safeGoals.protein_grams || 160) - total_protein);
  const carbsRemaining = Math.max(0, (safeGoals.carbs_grams || 220) - total_carbs);
  const fatRemaining = Math.max(0, (safeGoals.fat_grams || 65) - total_fat);

  // Extract unique ingredients gathered from today's logged meals
  const gatheredIngredients = Array.from(
    new Set(
      safeMeals.flatMap((m) => (m.items || []).flatMap((it) => it.ingredients || []))
    )
  ).slice(0, 8);

  const sampleSuggestedRecipes = [
    {
      title: 'Seared Lemon Cod with Herb Quinoa & Greens',
      prepTime: '20 min',
      calories: Math.round(calRemaining * 0.7),
      protein: Math.round(protRemaining * 0.8),
      carbs: Math.round(carbsRemaining * 0.6),
      fat: Math.round(fatRemaining * 0.6),
      tag: 'Best Macro Match',
      matchedIngredients: ['Quinoa', 'Olive oil', 'Black pepper'],
    },
    {
      title: 'Whipped Greek Yogurt & Berry Chia Parfait',
      prepTime: '5 min',
      calories: Math.round(calRemaining * 0.4),
      protein: Math.round(protRemaining * 0.5),
      carbs: Math.round(carbsRemaining * 0.4),
      fat: Math.round(fatRemaining * 0.3),
      tag: 'Quick Snack Match',
      matchedIngredients: ['Greek yogurt', 'Chia seeds', 'Blueberries'],
    },
  ];

  return (
    <div className="space-y-6 animate-rise">
      {/* Intro Card */}
      <div className="velvet-card rounded-2xl p-6 border border-lav/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lav/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-lav/20 border border-lav/30 flex items-center justify-center shrink-0">
            <ChefHat className="w-5 h-5 text-lav" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-lg text-fg">
                Smart Macro-Balanced Recipe Generator
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lav/20 text-lav font-bold border border-lav/30">
                Roadmap Preview
              </span>
            </div>
            <p className="text-xs text-muted max-w-xl">
              Nouri uses the parsed nutrients and ingredients from your photos to dynamically suggest meals that hit your remaining macro targets before the day ends.
            </p>
          </div>
        </div>

        {/* Current Macro Deficit */}
        <div className="bg-ink-850/80 rounded-xl p-4 border border-white/10">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2.5">
            Today's Target Deficit to Fill:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
            <div className="p-2.5 rounded-lg bg-ink-800 border border-mint/20">
              <span className="text-lg font-bold text-mint">{Math.round(calRemaining)}</span>
              <div className="text-[10px] text-muted uppercase">kcal left</div>
            </div>
            <div className="p-2.5 rounded-lg bg-ink-800 border border-peach/20">
              <span className="text-lg font-bold text-peach">{Math.round(protRemaining)}g</span>
              <div className="text-[10px] text-muted uppercase">Protein left</div>
            </div>
            <div className="p-2.5 rounded-lg bg-ink-800 border border-lav/20">
              <span className="text-lg font-bold text-lav">{Math.round(carbsRemaining)}g</span>
              <div className="text-[10px] text-muted uppercase">Carbs left</div>
            </div>
            <div className="p-2.5 rounded-lg bg-ink-800 border border-coral/20">
              <span className="text-lg font-bold text-coral">{Math.round(fatRemaining)}g</span>
              <div className="text-[10px] text-muted uppercase">Fats left</div>
            </div>
          </div>
        </div>

        {/* Ingredients gathered from food photos */}
        {gatheredIngredients.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="text-xs text-muted mb-2 font-medium">
              Ingredients detected from your photo logs today:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {gatheredIngredients.map((ing, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-fg font-mono flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-mint" />
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested Recipes */}
      <div>
        <h4 className="font-display font-bold text-base text-fg mb-3 flex items-center gap-2">
          <span>AI Suggested Dishes to Close Today's Gap</span>
          <Sparkles className="w-4 h-4 text-lav" />
        </h4>

        <div className="grid sm:grid-cols-2 gap-4">
          {sampleSuggestedRecipes.map((recipe, idx) => (
            <div
              key={idx}
              className="velvet-card rounded-2xl p-5 border border-white/10 velvet-card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lav/15 text-lav border border-lav/30">
                    {recipe.tag}
                  </span>
                  <span className="text-xs text-muted font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {recipe.prepTime}
                  </span>
                </div>

                <h5 className="font-display font-bold text-sm text-fg mb-2">
                  {recipe.title}
                </h5>

                <div className="flex flex-wrap gap-1 mb-4">
                  {recipe.matchedIngredients.map((ing, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted border border-white/5"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                {/* Target match summary */}
                <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-white/5 mb-3">
                  <span className="text-mint font-bold">{recipe.calories} kcal</span>
                  <span className="text-peach">{recipe.protein}g P</span>
                  <span className="text-lav">{recipe.carbs}g C</span>
                  <span className="text-coral">{recipe.fat}g F</span>
                </div>

                <button
                  type="button"
                  className="w-full py-2 rounded-xl bg-ink-800 hover:bg-lav/20 hover:text-lav border border-white/10 text-xs font-semibold text-fg flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>View Step-by-Step Recipe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
