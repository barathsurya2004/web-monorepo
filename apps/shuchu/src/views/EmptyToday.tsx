import React from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@packages/ui';
import { Sprout, ArrowRight } from 'lucide-react';

interface EmptyTodayProps {
  onOpenAddModal: () => void;
}

const SEED_HINTS = [
  'Morning meditation',
  'Read 20 pages',
  'Deep work session',
  'Sketch practice',
  'Evening walk',
];

export const EmptyToday: React.FC<EmptyTodayProps> = ({ onOpenAddModal }) => {
  const { setScreen } = useApp();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-12 max-w-sm mx-auto animate-soft-fade">
      {/* Icon with ambient glow */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-[var(--matcha-leaf)] opacity-10 blur-2xl scale-150" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--matcha-soft)] to-[var(--surface-pebble)] border-2 border-[var(--matcha-border)] flex items-center justify-center shadow-lg animate-gentle-float">
          <Sprout className="w-10 h-10 text-[var(--matcha-leaf)]" />
        </div>
      </div>

      <div className="text-center space-y-3 mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--fg)]">
          A Fresh Canvas
        </h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed font-serif italic">
          Every practice begins with a single intention. Plant your first habit and watch it grow.
        </p>
      </div>

      {/* Seed hints */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {SEED_HINTS.map((hint) => (
          <button
            key={hint}
            onClick={onOpenAddModal}
            className="px-3 py-1.5 rounded-full bg-[var(--surface-warm)] border border-[var(--border)] text-xs font-mono text-[var(--muted)] hover:text-[var(--fg)] hover:border-[var(--accent)] hover:bg-[var(--clay-soft)] transition-all cursor-pointer"
          >
            {hint}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full">
        <Button
          variant="pastelTerracotta"
          onClick={onOpenAddModal}
          className="font-mono text-xs font-bold !min-h-[48px] px-6 !rounded-2xl w-full shadow-sm"
        >
          <Sprout className="w-4 h-4 mr-2" />
          Plant Your First Habit
        </Button>
        <Button
          variant="ghost"
          onClick={() => setScreen('analytics')}
          className="font-mono text-xs !min-h-[40px] px-5 !text-[#5C5347] hover:!text-[#1F1B17] dark:!text-slate-400 dark:hover:!text-white font-semibold flex items-center justify-center gap-1"
        >
          <span>Explore Insights</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
