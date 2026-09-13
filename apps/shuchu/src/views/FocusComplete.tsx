import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@packages/ui';
import { Sparkles, Check, ArrowRight, Flame } from 'lucide-react';

const CONFETTI_COLORS = ['#B8472E', '#2A6642', '#9E5B0E', '#6D3D5D', '#2E5C70'];

export const FocusComplete: React.FC = () => {
  const { lastCompletedSession, activeHabit, setScreen } = useApp();
  const [reflectionNote, setReflectionNote] = useState('');
  const [savedToast, setSavedToast] = useState(false);
  const [confettiPieces] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: `${8 + i * 7.5}%`,
      delay: `${(i * 0.07).toFixed(2)}s`,
      size: `${6 + (i % 4) * 3}px`,
    }))
  );

  const duration = lastCompletedSession?.durationMinutes || 25;
  const habitTitle = lastCompletedSession?.habitTitle || activeHabit?.title || 'Practice Flow';
  const target = activeHabit?.targetValue || 30;
  const totalToday = activeHabit?.currentValue || duration;
  const overtime = Math.max(0, totalToday - target);
  const isDone = totalToday >= target;

  const handleSaveReflection = () => {
    if (lastCompletedSession && reflectionNote.trim()) {
      lastCompletedSession.note = reflectionNote.trim();
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-auto animate-soft-fade">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
        {/* Confetti burst */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {confettiPieces.map((p) => (
            <div
              key={p.id}
              className="absolute top-0 rounded-full opacity-0"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                animation: `confettiDrop 1.2s ${p.delay} ease-out forwards`,
              }}
            />
          ))}
        </div>

        {/* Floating celebration icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--matcha-soft)] to-[var(--clay-soft)] border-2 border-[var(--matcha-border)] flex items-center justify-center mx-auto mb-5 shadow-xl animate-bounce-in animate-pulse-ring">
            <Sparkles className="w-10 h-10 text-[var(--clay-terracotta)]" />
          </div>
          {isDone && (
            <div className="absolute -top-1 -right-1 left-1/2 ml-4 w-7 h-7 rounded-full bg-[var(--matcha-leaf)] text-white flex items-center justify-center shadow-md animate-bounce-in">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--fg)] mb-1">
          {duration} {duration === 1 ? 'Minute' : 'Minutes'} of Flow
        </h2>
        <p className="text-xs sm:text-sm text-[var(--muted)] font-serif italic mb-6">
          {habitTitle} · Mindful practice logged
        </p>

        {/* Summary Tiles */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-left">
          <div className="bg-[var(--surface-warm)] border border-[var(--border-subtle)] p-3.5 rounded-2xl">
            <div className="font-mono text-[10px] uppercase font-bold text-[var(--muted)] mb-1">
              Session
            </div>
            <div className="font-display text-xl font-bold text-[var(--fg)]">
              {duration} {activeHabit?.unit || 'min'}
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border ${isDone ? 'bg-[var(--matcha-soft)] border-[var(--matcha-border)]' : 'bg-[var(--surface-warm)] border-[var(--border-subtle)]'}`}>
            <div className="font-mono text-[10px] uppercase font-bold text-[var(--muted)] mb-1">
              Total Today
            </div>
            <div className={`font-display text-xl font-bold flex items-center gap-1.5 ${isDone ? 'text-[var(--matcha-leaf)]' : 'text-[var(--fg)]'}`}>
              <span>{totalToday} {activeHabit?.unit || 'min'}</span>
              {isDone && <Check className="w-4 h-4 text-[var(--matcha-leaf)]" />}
            </div>
          </div>
        </div>

        {/* Target / Bonus callout */}
        <div className="bg-[var(--ochre-soft)] border border-[var(--ochre-border)] rounded-2xl p-3.5 text-left text-xs text-[var(--fg-soft)] mb-6 flex items-start gap-3">
          {isDone ? (
            <Flame className="w-5 h-5 text-[var(--ochre-seed)] shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-5 h-5 text-[var(--ochre-seed)] shrink-0 mt-0.5" />
          )}
          <div>
            <strong className="text-[var(--fg)] block font-bold mb-0.5">
              {isDone
                ? `Target Complete${overtime > 0 ? ` · +${overtime}m Bonus` : ''}`
                : `${target - totalToday} ${activeHabit?.unit || 'min'} remaining to target`}
            </strong>
            {isDone
              ? 'Your habit is marked done for today. Every focused minute shapes the practice.'
              : 'Great progress! Start another flow session to hit your daily target.'}
          </div>
        </div>

        {/* Reflection input */}
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
              onKeyDown={(e) => e.key === 'Enter' && handleSaveReflection()}
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
              <Check className="w-3.5 h-3.5" /> Reflection recorded
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
            <span>View Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
