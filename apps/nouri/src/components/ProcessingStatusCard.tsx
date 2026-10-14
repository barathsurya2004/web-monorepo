import React, { useEffect, useState } from 'react';
import { JobStatus, MealItem } from '../types';
import { api } from '../services/api';
import { Check, Loader2, Sparkles, Trash2, X } from 'lucide-react';

interface ProcessingStatusCardProps {
  jobId: string;
  onJobComplete: (items: MealItem[], mealLogId?: string) => void;
  onDismiss: () => void;
  onStatusChange?: (status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED') => void;
}

export const ProcessingStatusCard: React.FC<ProcessingStatusCardProps> = ({
  jobId,
  onJobComplete,
  onDismiss,
  onStatusChange,
}) => {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const data = await api.pollJobStatus(jobId);
        if (!isMounted) return;
        setJob(data);
        onStatusChange?.(data.status);

        if (data.status === 'PENDING') {
          setCurrentStep(1);
        } else if (data.status === 'PROCESSING') {
          setCurrentStep(2);
        } else if (data.status === 'COMPLETED') {
          setCurrentStep(4);
          clearInterval(interval);
          if (data.detected_items) {
            onJobComplete(data.detected_items, data.meal_log_id);
          }
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling job:', err);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 700);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [jobId]);

  const steps = [
    { label: 'Staged in processing queue', doneAt: 1 },
    { label: 'AI Vision extracting food & portion sizes', doneAt: 2 },
    { label: 'Backend optimization: Purging raw photo from queue', doneAt: 3 },
    { label: 'Nutrients & macros saved to diary', doneAt: 4 },
  ];

  return (
    <div className="velvet-card rounded-2xl p-5 border border-mint/30 shadow-xl relative overflow-hidden animate-rise">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-mint/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-mint/15 border border-mint/30 flex items-center justify-center">
            {job?.status === 'COMPLETED' ? (
              <Check className="w-4 h-4 text-mint" />
            ) : (
              <Loader2 className="w-4 h-4 text-mint animate-spin" />
            )}
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-fg flex items-center gap-1.5">
              <span>
                {job?.status === 'COMPLETED'
                  ? 'Meal Logged Successfully'
                  : job?.status === 'FAILED'
                  ? 'Processing Failed'
                  : 'AI Analyzing Nutrition...'}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-mint" />
            </h4>
            <p className="text-[11px] font-mono text-muted">
              Job ID: {jobId.substring(0, 12)}
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-muted hover:text-fg hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="space-y-2 mb-4">
        {steps.map((st, i) => {
          const isDone = (job?.status === 'COMPLETED') || currentStep > i + 1;
          const isActive = currentStep === i + 1 && job?.status !== 'COMPLETED';

          return (
            <div key={i} className="flex items-center gap-2.5 text-xs">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold transition-all ${
                  isDone
                    ? 'bg-mint text-ink-950'
                    : isActive
                    ? 'bg-mint/20 text-mint border border-mint/40 animate-pulse'
                    : 'bg-ink-800 text-muted border border-white/5'
                }`}
              >
                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : i + 1}
              </div>
              <span
                className={`transition-colors ${
                  isDone
                    ? 'text-fg font-medium'
                    : isActive
                    ? 'text-mint font-semibold'
                    : 'text-muted'
                }`}
              >
                {st.label}
              </span>
              {i === 2 && isDone && (
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-muted flex items-center gap-1">
                  <Trash2 className="w-2.5 h-2.5 text-coral" /> Photo deleted
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Detected Food Items Preview */}
      {job?.detected_items && job.detected_items.length > 0 && (
        <div className="pt-3 border-t border-white/10">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
            Identified Dishes & Macros:
          </div>
          <div className="space-y-1.5">
            {job.detected_items.map((item, idx) => (
              <div
                key={idx}
                className="bg-ink-850/80 rounded-xl p-2.5 border border-white/5 flex items-center justify-between text-xs gap-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-fg truncate block">{item.name}</span>
                  <div className="text-[10px] font-mono text-muted truncate">
                    {item.estimated_weight_grams}g · {item.ingredients?.slice(0, 3).join(', ')}
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] shrink-0">
                  <span className="text-mint font-bold">{Math.round(item.calories)} kcal</span>
                  <div className="text-muted text-[10px]">
                    <span className="text-peach">{Math.round(item.protein_grams)}P</span> ·{' '}
                    <span className="text-lav">{Math.round(item.carbs_grams)}C</span> ·{' '}
                    <span className="text-coral">{Math.round(item.fat_grams)}F</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
