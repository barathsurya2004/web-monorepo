import React, { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Page, PageHeader, Card, SectionTitle } from '@/components/ui';
import { Button, Input, Select, Badge } from '@packages/ui';
import { ExercisePicker } from '@/components/ExercisePicker';
import { MuscleMap } from '@/components/MuscleMap';
import { getExercise } from '@/data/exercises';
import { uid } from '@/lib/calc';
import type { Routine, RoutineBlock, PlannedSet, SetType, Exercise, Muscle } from '@/types';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Link,
  Unlink,
  Clock,
  Sparkles,
  Save,
} from 'lucide-react';
import { haptic } from '@/lib/feedback';

interface BuilderViewProps {
  routineId?: string;
}

export const BuilderView: React.FC<BuilderViewProps> = ({ routineId }) => {
  const { routines, saveRoutine, back, toast, settings } = useStore();

  const existing = useMemo(
    () => routines.find((r) => r.id === routineId),
    [routines, routineId]
  );

  const [name, setName] = useState(existing?.name || '');
  const [focus, setFocus] = useState(existing?.focus || '');
  const [estMinutes, setEstMinutes] = useState(existing?.estMinutes || 60);
  const [blocks, setBlocks] = useState<RoutineBlock[]>(() =>
    existing
      ? structuredClone(existing.blocks)
      : [
          {
            id: uid('rb'),
            exerciseId: 'bench',
            rest: 120,
            sets: [
              { id: uid('ps'), type: 'warmup', reps: 10, weight: 40 },
              { id: uid('ps'), type: 'working', reps: 8, weight: 80, rpe: 8 },
              { id: uid('ps'), type: 'working', reps: 8, weight: 80, rpe: 8 },
              { id: uid('ps'), type: 'working', reps: 8, weight: 80, rpe: 8.5 },
            ],
          },
        ]
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Live muscle distribution calculation
  const muscleDistribution = useMemo(() => {
    const dist: Partial<Record<Muscle, number>> = {};
    for (const b of blocks) {
      try {
        const ex = getExercise(b.exerciseId);
        const count = b.sets.filter((s) => s.type !== 'warmup').length;
        ex.primary.forEach((m) => {
          dist[m] = (dist[m] || 0) + count;
        });
        ex.secondary.forEach((m) => {
          dist[m] = (dist[m] || 0) + count * 0.5;
        });
      } catch {
        /* skip */
      }
    }
    return dist;
  }, [blocks]);

  // Actions
  const handleAddExercise = (ex: Exercise) => {
    haptic.tap();
    const newBlock: RoutineBlock = {
      id: uid('rb'),
      exerciseId: ex.id,
      rest: ex.defaultRest,
      sets: [
        { id: uid('ps'), type: 'working', reps: 10, weight: 0, rpe: 8 },
        { id: uid('ps'), type: 'working', reps: 10, weight: 0, rpe: 8 },
        { id: uid('ps'), type: 'working', reps: 10, weight: 0, rpe: 8 },
      ],
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleRemoveBlock = (blockId: string) => {
    haptic.tap();
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const handleMoveBlock = (idx: number, direction: 'up' | 'down') => {
    haptic.tap();
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleToggleSuperset = (idx: number) => {
    haptic.click();
    setBlocks((prev) => {
      const copy = [...prev];
      const cur = copy[idx];
      const next = copy[idx + 1];
      if (!next) return prev;

      if (cur.supersetId && cur.supersetId === next.supersetId) {
        // Unlink
        delete cur.supersetId;
        delete next.supersetId;
      } else {
        // Link
        const sid = uid('ss');
        cur.supersetId = sid;
        next.supersetId = sid;
        cur.rest = 0; // zero rest between superset items
      }
      return copy;
    });
  };

  const handleAddSet = (blockId: string) => {
    haptic.tap();
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const last = b.sets[b.sets.length - 1];
        return {
          ...b,
          sets: [
            ...b.sets,
            {
              id: uid('ps'),
              type: 'working',
              reps: last?.reps || 10,
              weight: last?.weight || 0,
              rpe: last?.rpe || 8,
            },
          ],
        };
      })
    );
  };

  const handleRemoveSet = (blockId: string, setId: string) => {
    haptic.tap();
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, sets: b.sets.filter((s) => s.id !== setId) } : b))
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a routine name');
      return;
    }
    if (blocks.length === 0) {
      alert('Please add at least one exercise to the routine');
      return;
    }

    haptic.click();
    const newRoutine: Routine = {
      id: existing?.id || uid('rt'),
      name: name.trim(),
      focus: focus.trim() || 'Full Body',
      color: existing?.color || 'peach',
      estMinutes: Number(estMinutes) || 60,
      blocks,
      lastPerformed: existing?.lastPerformed,
    };

    saveRoutine(newRoutine);
    toast({
      tone: 'mint',
      title: 'Routine Saved',
      body: `"${newRoutine.name}" is ready to perform!`,
    });
    back();
  };

  return (
    <Page>
      <PageHeader
        back
        eyebrow="Routine Studio"
        title={existing ? `Edit ${existing.name}` : 'Design New Routine'}
        subtitle="Configure exercise sequence, warmups, working volumes, target RPEs, and superset pairings."
        action={
          <Button
            variant="pastelSage"
            onClick={handleSave}
            className="flex items-center gap-2 font-black shadow-lg shadow-mint/20"
          >
            <Save size={18} /> Save Routine
          </Button>
        }
      />

      {/* Routine Metadata Form */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label mb-1.5 block">Routine Title</label>
            <input
              type="text"
              placeholder="e.g. Upper Body Hypertrophy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input text-base font-bold"
            />
          </div>

          <div>
            <label className="label mb-1.5 block">Estimated Duration (mins)</label>
            <input
              type="number"
              value={estMinutes}
              onChange={(e) => setEstMinutes(Number(e.target.value))}
              className="input font-mono"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="label mb-1.5 block">Focus / Muscle Targets</label>
            <input
              type="text"
              placeholder="e.g. Chest, Lats, Side Delts, Arms"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </Card>

      {/* Live Anatomical Heatmap Preview */}
      <div className="mb-6">
        <MuscleMap distribution={muscleDistribution} />
      </div>

      {/* Exercise Blocks */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <SectionTitle>Exercise Sequence ({blocks.length})</SectionTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus size={16} /> Add Exercise
          </Button>
        </div>

        {blocks.map((block, idx) => {
          const ex = getExercise(block.exerciseId);
          const nextBlock = blocks[idx + 1];
          const isSupersetWithNext =
            block.supersetId && nextBlock?.supersetId === block.supersetId;

          return (
            <div key={block.id} className="relative">
              <Card className="p-5 border-white/10">
                {/* Exercise Header */}
                <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 font-mono text-xs font-bold text-muted">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-lg font-black text-fg">{ex.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="uppercase font-mono text-[10px] text-peach">
                          {ex.equipment}
                        </span>
                        <span>•</span>
                        <span>Rest: {block.rest}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Block ordering & deletion */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveBlock(idx, 'up')}
                      aria-label="Move exercise up"
                      className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-fg disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      disabled={idx === blocks.length - 1}
                      onClick={() => handleMoveBlock(idx, 'down')}
                      aria-label="Move exercise down"
                      className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-fg disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveBlock(block.id)}
                      aria-label="Remove exercise"
                      className="rounded-lg p-1.5 text-muted hover:bg-coral/20 hover:text-coral transition-colors"
                      title="Remove exercise"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Planned Sets Table */}
                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted font-mono px-2">
                    <span className="col-span-2">Set</span>
                    <span className="col-span-3">Type</span>
                    <span className="col-span-3">Target Weight ({settings.unit})</span>
                    <span className="col-span-2">Reps</span>
                    <span className="col-span-2 text-right">Action</span>
                  </div>

                  {block.sets.map((set, setIdx) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-12 items-center gap-2 rounded-xl bg-ink-950/60 p-2 font-mono text-xs"
                    >
                      <span className="col-span-2 font-bold text-muted pl-1">
                        #{setIdx + 1}
                      </span>

                      {/* Set type selector */}
                      <select
                        value={set.type}
                        onChange={(e) => {
                          const val = e.target.value as SetType;
                          setBlocks((prev) =>
                            prev.map((b) =>
                              b.id === block.id
                                ? {
                                    ...b,
                                    sets: b.sets.map((s) => (s.id === set.id ? { ...s, type: val } : s)),
                                  }
                                : b
                            )
                          );
                        }}
                        className="col-span-3 rounded-lg border border-white/10 bg-ink-900 px-2 py-1.5 text-[11px] font-semibold text-fg focus:outline-none"
                      >
                        <option value="warmup">Warmup (W)</option>
                        <option value="working">Working</option>
                        <option value="drop">Drop set</option>
                        <option value="failure">Failure (AMRAP)</option>
                      </select>

                      {/* Weight input */}
                      <input
                        type="number"
                        step="2.5"
                        value={set.weight || ''}
                        placeholder="0"
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setBlocks((prev) =>
                            prev.map((b) =>
                              b.id === block.id
                                ? {
                                    ...b,
                                    sets: b.sets.map((s) => (s.id === set.id ? { ...s, weight: val } : s)),
                                  }
                                : b
                            )
                          );
                        }}
                        className="col-span-3 rounded-lg border border-white/10 bg-ink-900 px-2 py-1 text-center font-bold text-fg focus:outline-none"
                      />

                      {/* Reps input */}
                      <input
                        type="number"
                        value={set.reps || ''}
                        placeholder="10"
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setBlocks((prev) =>
                            prev.map((b) =>
                              b.id === block.id
                                ? {
                                    ...b,
                                    sets: b.sets.map((s) => (s.id === set.id ? { ...s, reps: val } : s)),
                                  }
                                : b
                            )
                          );
                        }}
                        className="col-span-2 rounded-lg border border-white/10 bg-ink-900 px-2 py-1 text-center font-bold text-fg focus:outline-none"
                      />

                      <div className="col-span-2 text-right">
                        <button
                          disabled={block.sets.length <= 1}
                          onClick={() => handleRemoveSet(block.id, set.id)}
                          aria-label="Remove set"
                          className="rounded p-1 text-muted hover:bg-white/5 hover:text-coral disabled:opacity-20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-1">
                    <button
                      onClick={() => handleAddSet(block.id)}
                      className="btn-ghost w-full py-1.5 text-xs font-bold"
                    >
                      <Plus size={14} className="mr-1" /> Add Set
                    </button>
                  </div>
                </div>
              </Card>

              {/* Superset Link Bridge if next block exists */}
              {nextBlock && (
                <div className="my-2 flex justify-center">
                  <button
                    onClick={() => handleToggleSuperset(idx)}
                    className={`chip text-[11px] font-bold transition-all ${
                      isSupersetWithNext
                        ? 'border-lav/50 bg-lav/20 text-lav'
                        : 'hover:border-white/20'
                    }`}
                  >
                    {isSupersetWithNext ? (
                      <>
                        <Link size={12} className="mr-1" /> Linked as Superset (0s rest)
                      </>
                    ) : (
                      <>
                        <Unlink size={12} className="mr-1 text-dim" /> Link Superset with next
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pb-8">
        <Button
          variant="outline"
          onClick={() => setIsPickerOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} /> Add Another Exercise
        </Button>
      </div>

      {/* Exercise Picker Modal */}
      <ExercisePicker
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleAddExercise}
      />
    </Page>
  );
};
