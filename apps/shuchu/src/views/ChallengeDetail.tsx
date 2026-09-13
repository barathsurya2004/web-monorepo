import React from 'react';
import { useApp } from '@/context/AppContext';
import { Button, Badge } from '@packages/ui';
import { ArrowLeft, Timer, Check } from 'lucide-react';

export const ChallengeDetail: React.FC = () => {
  const { challenges, toggleChallengePrompt, startFocusSession, setScreen, activeHabit, habits } = useApp();
  const currentWeek = challenges.find((c) => c.isCurrent) || challenges[0];

  const prompts = currentWeek ? currentWeek.prompts : [];
  const completedCount = prompts.filter((p) => p.completed).length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-soft-fade">
      {/* Back Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setScreen('challenge')}
        className="!rounded-full text-xs font-semibold !min-h-[36px] px-4 !text-[#383028] !border-[#CFC3B3] hover:!bg-black/5 dark:!text-slate-200 dark:!border-white/15 gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Challenge Track</span>
      </Button>

      {/* Week Banner */}
      <div className="bg-gradient-to-br from-[var(--clay-soft)] to-[var(--surface-warm)] border border-[var(--clay-border)] rounded-2xl p-6 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <Badge variant="terracotta">Week {currentWeek.weekNumber} Focused Track</Badge>
          <span className="font-mono text-xs font-bold text-[var(--accent)]">
            {completedCount} / {prompts.length} Prompts Done
          </span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--fg)]">
          {currentWeek.title}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--fg-soft)] font-serif italic leading-relaxed">
          {currentWeek.subtitle}. Cultivate intentional practice for at least {currentWeek.targetSessions} sessions this week.
        </p>

        <Button
          variant="pastelTerracotta"
          onClick={() => startFocusSession(activeHabit?.id || habits[0]?.id || '', 30)}
          className="w-full sm:w-auto !rounded-full font-mono text-xs font-bold !min-h-[42px] px-6 mt-2 gap-2 flex items-center justify-center"
        >
          <Timer className="w-4 h-4" />
          <span>Start Week {currentWeek.weekNumber} Focus Session (30m)</span>
        </Button>
      </div>

      {/* Suggested Prompts Checklist */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-lg font-semibold text-[var(--fg)]">Guided Study Prompts</h3>
          <span className="font-mono text-xs text-[var(--muted)] font-medium">Tap to mark complete</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {prompts.map((prompt, idx) => (
            <div
              key={prompt.id}
              onClick={() => toggleChallengePrompt(currentWeek.weekNumber, prompt.id)}
              className={`bg-[var(--surface)] border p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm ${
                prompt.completed
                  ? 'border-[var(--matcha-border)] bg-[var(--matcha-soft)] text-[var(--matcha-leaf)]'
                  : 'border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs opacity-60">#{idx + 1}</span>
                <span className={`text-xs sm:text-sm font-medium ${prompt.completed ? 'line-through opacity-80' : ''}`}>
                  {prompt.text}
                </span>
              </div>
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                  prompt.completed
                    ? 'bg-[var(--matcha-leaf)] border-[var(--matcha-leaf)] text-white'
                    : 'border-[var(--border)] text-transparent'
                }`}
              >
                {prompt.completed && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
