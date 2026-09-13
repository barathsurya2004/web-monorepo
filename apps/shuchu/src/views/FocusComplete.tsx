import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@packages/ui';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

export const FocusComplete: React.FC = () => {
  const { lastCompletedSession, activeHabit, setScreen } = useApp();
  const [reflectionNote, setReflectionNote] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  const duration = lastCompletedSession?.durationMinutes || 25;
  const habitTitle = lastCompletedSession?.habitTitle || activeHabit?.title || 'Practice Flow';
  const target = activeHabit?.targetValue || 30;
  const totalToday = activeHabit?.currentValue || duration;
  const overtime = Math.max(0, totalToday - target);

  const handleSaveReflection = () => {
    if (lastCompletedSession && reflectionNote.trim()) {
      lastCompletedSession.note = reflectionNote.trim();
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-auto animate-soft-fade">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 text-center shadow-lg relative">
        {/* Blooming flower icon */}
        <div className="w-16 h-16 rounded-full bg-[var(--matcha-soft)] border-2 border-[var(--matcha-border)] text-[var(--matcha-leaf)] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--matcha-glow)] animate-gentle-float">
          <Sparkles className="w-8 h-8 text-[var(--clay-terracotta)]" />
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--fg)] mb-1">
          {duration} Minutes of Flow
        </h2>
        <p className="text-xs sm:text-sm text-[var(--muted)] font-serif italic mb-6">
          {habitTitle} • Mindful practice logged seamlessly
        </p>

        {/* Summary Tiles */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-left">
          <div className="bg-[var(--surface-warm)] border border-[var(--border-subtle)] p-3.5 rounded-2xl">
            <div className="font-mono text-[10px] uppercase font-bold text-[var(--muted)] mb-1">
              Habit Target
            </div>
            <div className="font-display text-xl font-bold text-[var(--fg)]">
              {target} {activeHabit?.unit || 'min'}
            </div>
          </div>

          <div className="bg-[var(--surface-warm)] border border-[var(--border-subtle)] p-3.5 rounded-2xl">
            <div className="font-mono text-[10px] uppercase font-bold text-[var(--muted)] mb-1">
              Total Today
            </div>
            <div className="font-display text-xl font-bold text-[var(--matcha-leaf)] flex items-center gap-1.5">
              <span>{totalToday} {activeHabit?.unit || 'min'}</span>
              <Check className="w-4 h-4 text-[var(--matcha-leaf)]" />
            </div>
          </div>
        </div>

        {/* Target vs Overtime Bonus Callout */}
        <div className="bg-[var(--ochre-soft)] border border-[var(--ochre-border)] rounded-2xl p-3.5 text-left text-xs text-[var(--fg-soft)] mb-6 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[var(--ochre-seed)] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[var(--fg)] block font-bold mb-0.5">
              Target Completed {overtime > 0 ? `+ ${overtime}m Bonus Flow` : ''}
            </strong>
            Your habit is marked done for today. Extra focus time has been quietly credited to your Consistency Garden.
          </div>
        </div>

        {/* Mindful reflection input */}
        <div className="text-left mb-6 space-y-2">
          <label className="font-mono text-[11px] uppercase font-bold text-[var(--muted)]">
            Session Reflection (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="What did you cultivate in this session?"
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              className="flex-1 bg-[var(--surface-warm)] border border-[var(--border)] rounded-2xl px-4 py-2.5 text-xs text-[var(--fg)] outline-none focus:border-[var(--accent)] transition-colors"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveReflection}
              className="!rounded-2xl !min-h-[38px] text-xs font-mono !text-[#383028] !border-[#CFC3B3] hover:!bg-black/5 dark:!text-slate-200 dark:!border-white/15"
            >
              Save
            </Button>
          </div>
          {savedToast && (
            <span className="text-xs text-[var(--matcha-leaf)] font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Reflection recorded to timeline
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button
            variant="pastelTerracotta"
            onClick={() => setScreen('today')}
            className="flex-1 !rounded-full font-mono text-xs font-bold !min-h-[44px]"
          >
            Return to Dashboard
          </Button>
          <Button
            variant="ghost"
            onClick={() => setScreen('analytics')}
            className="!rounded-full font-mono text-xs !min-h-[44px] px-5 !text-[#5C5347] hover:!text-[#1F1B17] dark:!text-slate-400 dark:hover:!text-white font-semibold flex items-center justify-center gap-1"
          >
            <span>View Garden</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
