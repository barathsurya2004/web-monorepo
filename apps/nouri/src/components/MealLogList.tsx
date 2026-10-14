import React, { useEffect, useState } from 'react';
import { MealItem, MealLog, PendingMealJob } from '../types';
import { Edit2, Trash2, Clock, Sparkles, Loader2, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface MealLogListProps {
  meals: MealLog[];
  pendingJobs?: PendingMealJob[];
  recentlyAddedMealId?: string | null;
  onJobComplete?: (jobId: string, items: MealItem[], mealLogId?: string) => void;
  onDismissPending?: (jobId: string) => void;
  onEditItem: (item: MealItem) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteMeal: (mealId: string) => void;
}

const getMealBadgeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'breakfast':
      return 'text-amber bg-amber/10 border-amber/20';
    case 'lunch':
      return 'text-mint bg-mint/10 border-mint/20';
    case 'dinner':
      return 'text-lav bg-lav/10 border-lav/20';
    default:
      return 'text-peach bg-peach/10 border-peach/20';
  }
};

interface PendingMealCardProps {
  job: PendingMealJob;
  onJobComplete?: (jobId: string, items: MealItem[], mealLogId?: string) => void;
  onDismiss?: (jobId: string) => void;
}

const PendingMealCard: React.FC<PendingMealCardProps> = ({
  job,
  onJobComplete,
  onDismiss,
}) => {
  const [status, setStatus] = useState<string>(job.status || 'PENDING');
  const [stepText, setStepText] = useState<string>(job.stage || 'Staged in processing queue');
  const [progressPercent, setProgressPercent] = useState<number>(25);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let isMounted = true;

    // Ignore placeholder temp jobs until real jobId is set or mock resolves
    const poll = async () => {
      try {
        const data = await api.pollJobStatus(job.job_id);
        if (!isMounted) return;

        if (data.status) {
          setStatus(data.status);
        }

        if (data.status === 'PENDING') {
          setStepText('Queued: Waiting for worker thread...');
          setProgressPercent(35);
        } else if (data.status === 'PROCESSING') {
          setStepText('AI Vision detecting ingredients & portions...');
          setProgressPercent(75);
        } else if (data.status === 'COMPLETED') {
          setStepText('Finished! Syncing to diary...');
          setProgressPercent(100);
          clearInterval(interval);
          if (data.detected_items && data.detected_items.length > 0) {
            onJobComplete?.(job.job_id, data.detected_items, data.meal_log_id);
          } else {
            onJobComplete?.(job.job_id, [], data.meal_log_id);
          }
        } else if (data.status === 'FAILED') {
          setStepText(data.error_message || 'AI parsing encountered an error');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling pending job:', err);
      }
    };

    poll();
    interval = setInterval(poll, 700);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [job.job_id, onJobComplete]);

  return (
    <div className="velvet-card rounded-2xl p-4 sm:p-5 border border-mint/40 bg-gradient-to-r from-mint/[0.04] via-ink-850 to-ink-850 shadow-xl shadow-mint/5 relative overflow-hidden animate-rise">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-mint/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl border ${getMealBadgeColor(
              job.meal_type
            )}`}
          >
            {job.meal_type}
          </span>
          <span className="text-xs text-muted font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-mint" />
            Just now
          </span>
          {job.notes && (
            <span className="text-xs text-muted truncate max-w-[130px] sm:max-w-xs">
              · {job.notes}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'FAILED' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-coral/15 border border-coral/30 text-coral text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Failed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint/15 border border-mint/30 text-mint text-xs font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing with AI...</span>
            </div>
          )}

          {onDismiss && (
            <button
              onClick={() => onDismiss(job.job_id)}
              className="p-1 rounded-lg text-muted/60 hover:text-fg hover:bg-white/5 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex items-center gap-3.5">
        {job.preview_url && (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-mint/30 bg-black/40">
            <img
              src={job.preview_url}
              alt="Analyzing meal"
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-mint/10 animate-pulse" />
          </div>
        )}

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-mint flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-mint animate-pulse" />
              {stepText}
            </span>
            <span className="text-[10px] font-mono text-muted">
              {progressPercent}%
            </span>
          </div>

          {/* Smooth progress bar */}
          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-mint to-mint/70 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="text-[10px] font-mono text-muted/80">
            Asynchronous background task · Photo will be purged from memory once saved
          </div>
        </div>
      </div>
    </div>
  );
};

export const MealLogList: React.FC<MealLogListProps> = ({
  meals,
  pendingJobs = [],
  recentlyAddedMealId,
  onJobComplete,
  onDismissPending,
  onEditItem,
  onDeleteItem,
  onDeleteMeal,
}) => {
  const safeMeals = meals || [];
  const safePending = pendingJobs || [];

  if (safeMeals.length === 0 && safePending.length === 0) {
    return (
      <div className="velvet-card rounded-2xl p-8 border border-white/5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-muted">
          <Clock className="w-6 h-6" />
        </div>
        <h4 className="font-display font-bold text-base text-fg mb-1">
          No meals logged yet today
        </h4>
        <p className="text-xs text-muted max-w-sm mx-auto">
          Paste an image from your clipboard, snap a photo of your plate, or enter your meal manually to start tracking.
        </p>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Asynchronous In-Progress Tasks directly in Today's Meals */}
      {safePending.map((pending) => (
        <PendingMealCard
          key={pending.job_id}
          job={pending}
          onJobComplete={onJobComplete}
          onDismiss={onDismissPending}
        />
      ))}

      {/* Confirmed Daily Meals */}
      {safeMeals.map((meal) => {
        const isRecentlyAdded = meal.id === recentlyAddedMealId;

        return (
          <div
            key={meal.id}
            className={`velvet-card rounded-2xl p-4 sm:p-5 border transition-all duration-700 shadow-lg ${
              isRecentlyAdded
                ? 'border-mint ring-2 ring-mint/40 bg-mint/[0.04] shadow-mint/10 scale-[1.01]'
                : 'border-white/10'
            }`}
          >
            {/* Meal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl border ${getMealBadgeColor(
                    meal.meal_type
                  )}`}
                >
                  {meal.meal_type}
                </span>
                <span className="text-xs text-muted font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(meal.logged_at)}
                </span>
                {meal.notes && (
                  <span className="text-xs text-muted truncate max-w-[160px] sm:max-w-xs">
                    · {meal.notes}
                  </span>
                )}
                {isRecentlyAdded && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint/20 border border-mint/40 text-mint animate-bounce">
                    ✨ Just Added by AI
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-fg">
                  {Math.round(meal.total_calories)} <span className="text-xs text-mint">kcal</span>
                </span>
                <button
                  onClick={() => onDeleteMeal(meal.id)}
                  className="p-1.5 rounded-lg text-muted/60 hover:text-coral hover:bg-coral/10 transition-colors ml-1"
                  title="Delete entire meal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Dish items */}
            <div className="space-y-2.5">
              {meal.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-ink-850/60 rounded-xl p-3 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/10 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-fg">{item.name}</span>
                      {item.confidence_score && (
                        <span className="text-[10px] font-mono text-mint flex items-center gap-0.5 bg-mint/10 px-1.5 py-0.2 rounded">
                          <Sparkles className="w-2.5 h-2.5" />
                          {Math.round(item.confidence_score * 100)}%
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <span className="font-mono text-fg/80">{item.estimated_weight_grams}g</span>
                      {item.ingredients && item.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.ingredients.map((ing, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-muted border border-white/5"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Macros breakdown & actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 flex-wrap">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono">
                      <span className="font-bold text-mint">{Math.round(item.calories)} kcal</span>
                      <span className="text-peach font-semibold">{Math.round(item.protein_grams)}g P</span>
                      <span className="text-lav font-semibold">{Math.round(item.carbs_grams)}g C</span>
                      <span className="text-coral font-semibold">{Math.round(item.fat_grams)}g F</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-white/5 transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-muted/60 hover:text-coral hover:bg-coral/10 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
