import React from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@packages/ui';

interface EmptyTodayProps {
  onOpenAddModal: () => void;
}

export const EmptyToday: React.FC<EmptyTodayProps> = ({ onOpenAddModal }) => {
  const { setScreen } = useApp();

  return (
    <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-auto flex flex-col items-center justify-center space-y-5 animate-soft-fade">
      <div className="w-16 h-16 rounded-2xl bg-[var(--matcha-soft)] border-2 border-[var(--matcha-border)] text-[var(--matcha-leaf)] flex items-center justify-center text-3xl shadow-md">
        🌱
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--fg)]">
          A Fresh, Quiet Canvas
        </h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed font-serif">
          No habits are currently active for today. This quiet moment is yours to shape.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full justify-center">
        <Button
          variant="pastelTerracotta"
          onClick={onOpenAddModal}
          className="font-mono text-xs font-bold !min-h-[44px] px-6"
        >
          + Plant Your First Habit
        </Button>
        <Button
          variant="ghost"
          onClick={() => setScreen('today')}
          className="font-mono text-xs !min-h-[44px] px-5 !text-[#5C5347] hover:!text-[#1F1B17] dark:!text-slate-400 dark:hover:!text-white font-semibold"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
