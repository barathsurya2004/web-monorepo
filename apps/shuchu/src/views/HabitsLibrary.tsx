import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Category } from '@/types';
import { Badge, Button } from '@packages/ui';
import { Search, Plus, Flame, ArrowRight } from 'lucide-react';
import { HabitIcon } from '@/components/HabitIcon';

interface HabitsLibraryProps {
  onOpenAddModal: () => void;
}

export const HabitsLibrary: React.FC<HabitsLibraryProps> = ({ onOpenAddModal }) => {
  const { habits, selectHabitForDetail } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: `All (${habits.length})` },
    { id: 'Creative', label: 'Creative' },
    { id: 'Learning', label: 'Learning' },
    { id: 'Engineering', label: 'Engineering' },
    { id: 'Mindfulness', label: 'Mindfulness' },
    { id: 'Health', label: 'Health' },
  ];

  const filteredHabits = habits.filter((h) => {
    const matchesCategory = activeCategory === 'all' || h.category === activeCategory;
    const matchesQuery =
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.notes && h.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-5 max-w-2xl mx-auto animate-soft-fade">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--fg)]">Habits Sanctuary</h2>
          <p className="text-xs text-[var(--muted)] font-serif italic">Curate your daily rituals</p>
        </div>
        <Button
          variant="pastelTerracotta"
          size="sm"
          onClick={onOpenAddModal}
          className="!rounded-full font-mono text-xs !min-h-[34px] px-3.5 gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Habit</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-4 text-[var(--muted)] pointer-events-none" />
        <input
          type="text"
          placeholder="Search habits, intentions, or categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--surface-warm)] border border-[var(--border)] rounded-full pl-11 pr-4 py-2.5 text-xs sm:text-sm text-[var(--fg)] outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--muted)]"
        />
      </div>

      {/* Category Chips Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={activeCategory === cat.id ? 'pastelTerracotta' : 'outline'}
            onClick={() => setActiveCategory(cat.id)}
            className={`!min-h-[32px] !py-1 !px-3.5 text-xs font-mono whitespace-nowrap shrink-0 ${
              activeCategory === cat.id
                ? ''
                : '!text-[#383028] !border-[#CFC3B3] dark:!text-slate-200 dark:!border-white/15 hover:!bg-black/5'
            }`}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Habits Catalog Cards */}
      <div className="flex flex-col gap-3">
        {filteredHabits.length === 0 ? (
          <div className="p-8 text-center text-[#5C5347] dark:text-[var(--muted)] text-sm font-serif italic">
            No habits found matching your filter.
          </div>
        ) : (
          filteredHabits.map((habit) => (
            <div
              key={habit.id}
              onClick={() => selectHabitForDetail(habit.id)}
              className="bg-[var(--surface)] hover:bg-[var(--surface-warm)] border border-[var(--border)] p-4 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] shadow-sm group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-pebble)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <HabitIcon icon={habit.icon} className="w-5 h-5 text-current" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="slate" className="!text-[9px] !py-0 !px-1.5">
                      {habit.category}
                    </Badge>
                    <span className="font-mono text-[10px] text-[#5C5347] dark:text-[var(--muted)] font-medium">
                      Target: {habit.targetValue} {habit.unit}
                    </span>
                  </div>
                  <h4 className="font-display text-base font-semibold text-[var(--fg)] truncate mt-0.5">
                    {habit.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs font-bold text-[var(--ochre-seed)] bg-[var(--ochre-soft)] border border-[var(--ochre-border)] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[var(--ochre-seed)] inline" />
                  <span>{habit.streak}d</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#695F52] dark:text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
