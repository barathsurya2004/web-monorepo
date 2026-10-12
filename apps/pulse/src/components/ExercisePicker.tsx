import React, { useState, useMemo } from 'react';
import { Sheet } from '@/components/ui';
import { EXERCISES, MUSCLE_LABEL } from '@/data/exercises';
import type { Exercise, Muscle } from '@/types';
import { Search, Dumbbell, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/feedback';

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  title?: string;
}

const MUSCLE_GROUPS: { label: string; muscles: Muscle[] }[] = [
  { label: 'All', muscles: [] },
  { label: 'Chest', muscles: ['chest'] },
  { label: 'Back', muscles: ['back', 'traps'] },
  { label: 'Shoulders', muscles: ['shoulders'] },
  { label: 'Arms', muscles: ['biceps', 'triceps', 'forearms'] },
  { label: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { label: 'Core', muscles: ['abs'] },
];

export const ExercisePicker: React.FC<ExercisePickerProps> = ({
  open,
  onClose,
  onSelect,
  title = 'Add Exercise',
}) => {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const group = MUSCLE_GROUPS.find((g) => g.label === activeGroup);

    return EXERCISES.filter((ex) => {
      const matchSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q) ||
        ex.primary.some((m) => MUSCLE_LABEL[m]?.toLowerCase().includes(q));

      const matchGroup =
        !group ||
        group.muscles.length === 0 ||
        ex.primary.some((m) => group.muscles.includes(m)) ||
        ex.secondary.some((m) => group.muscles.includes(m));

      return matchSearch && matchGroup;
    });
  }, [search, activeGroup]);

  const handlePick = (ex: Exercise) => {
    haptic.tap();
    onSelect(ex);
    onClose();
    setSearch('');
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} wide>
      <div className="space-y-4 pt-1">
        {/* Search input */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search exercise, equipment or muscle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 pr-4"
            autoFocus
          />
        </div>

        {/* Muscle group chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g.label}
              onClick={() => {
                haptic.tap();
                setActiveGroup(g.label);
              }}
              className={`chip whitespace-nowrap ${activeGroup === g.label ? 'chip-active' : ''}`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted">
              <Dumbbell size={32} className="mx-auto mb-2 opacity-40 text-lav" />
              <p className="text-sm font-medium">No exercises found</p>
              <p className="text-xs text-dim">Try adjusting your filter or search query</p>
            </div>
          ) : (
            filtered.map((ex) => (
              <div
                key={ex.id}
                onClick={() => handlePick(ex)}
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-white/5 bg-ink-950/40 p-3.5 transition-all hover:border-lav/40 hover:bg-ink-800/80 active:scale-[0.99]"
              >
                <div className="min-w-0 pr-3">
                  <div className="font-semibold text-fg group-hover:text-lav transition-colors">
                    {ex.name}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                      {ex.equipment}
                    </span>
                    <span className="text-dim">•</span>
                    <span className="text-muted">
                      {ex.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="chip text-[11px] text-lav group-hover:border-lav/50 group-hover:bg-lav/20">
                    <Sparkles size={11} className="mr-0.5" /> Select
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Sheet>
  );
};
