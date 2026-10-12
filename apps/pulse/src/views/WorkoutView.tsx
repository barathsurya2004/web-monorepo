import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Page, PageHeader, Card, Sheet } from '@/components/ui';
import { Button, Badge } from '@packages/ui';
import { PlateCalculator } from '@/components/PlateCalculator';
import { ExercisePicker } from '@/components/ExercisePicker';
import { getExercise } from '@/data/exercises';
import { fmtNum, fmtClock, e1rm } from '@/lib/calc';
import type { SetType, LoggedSet } from '@/types';
import {
  Check,
  Plus,
  Trash2,
  Trophy,
  Dumbbell,
  Timer,
  Sparkles,
  Link,
  ChevronDown,
  X,
  Disc,
  Play,
  RotateCcw,
  User,
  Layers,
} from 'lucide-react';
import { haptic } from '@/lib/feedback';

export const WorkoutView: React.FC = () => {
  const {
    active,
    updateSet,
    toggleSet,
    addSet,
    removeSet,
    addBlock,
    removeBlock,
    finishWorkout,
    discardWorkout,
    lastPerformance,
    prs,
    settings,
    navigate,
    toast,
    skipDay,
  } = useStore();

  const [elapsed, setElapsed] = useState(0);
  const [calcState, setCalcState] = useState<{
    blockId: string;
    setId: string;
    weight: number;
    exerciseId: string;
  } | null>(null);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isFinishSheetOpen, setIsFinishSheetOpen] = useState(false);
  const [finishRpe, setFinishRpe] = useState(8);
  const [finishNotes, setFinishNotes] = useState('');

  // Live session timer ticker
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      setElapsed(Math.floor((Date.now() - active.startedAt) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) {
    return (
      <Page className="text-center py-20">
        <h2 className="text-2xl font-black text-fg">No Active Workout</h2>
        <p className="mt-2 text-sm text-muted">
          Start a routine from the planner or home screen to track live.
        </p>
        <button
          onClick={() => navigate({ name: 'home' })}
          className="btn-mint mt-6"
        >
          Go to Home
        </button>
      </Page>
    );
  }

  const completedSetsCount = active.blocks.reduce(
    (acc, b) => acc + b.sets.filter((s) => s.done).length,
    0
  );
  const totalSetsCount = active.blocks.reduce((acc, b) => acc + b.sets.length, 0);

  const handleFinish = () => {
    haptic.click();
    finishWorkout({
      rpe: finishRpe,
      notes: finishNotes.trim() || undefined,
    });
  };

  return (
    <Page className="pb-44">
      {/* Active Workout Header */}
      <header className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-mint animate-pulse" />
            <span className="label font-mono text-mint">Live Workout Session</span>
          </div>
          <h1 className="mt-1 text-3xl font-black text-fg sm:text-4xl tracking-tight">
            {active.name}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-xs font-mono text-muted">
            <span className="flex items-center gap-1 text-peach font-bold">
              <Timer size={14} /> {fmtClock(elapsed)}
            </span>
            <span>•</span>
            <span>
              {completedSetsCount}/{totalSetsCount} sets finished
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptic.tap();
              navigate({ name: 'home' });
              toast({
                tone: 'mint',
                title: 'Workout Continuing in Background',
                body: 'Timer and sets stay live while you navigate other pages.',
              });
            }}
            className="btn-ghost flex items-center gap-1.5 text-xs text-slate-300 hover:text-fg border border-white/10 rounded-xl px-2.5 py-2 transition-all hover:bg-white/5 active:scale-95"
            title="Minimize workout and browse other pages"
          >
            <ChevronDown size={15} className="text-mint" />
            <span>Minimize</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm("Discard and mark today's workout as skipped?")) {
                discardWorkout();
                skipDay();
                toast({
                  tone: 'coral',
                  title: 'Workout Discarded & Day Skipped',
                  body: 'Rest and recover. Today marked as rest day.',
                });
              }
            }}
            className="btn-ghost text-xs text-muted hover:text-coral hidden sm:inline-flex"
            title="Discard session and mark today as skipped"
          >
            Skip Day
          </button>
          <button
            onClick={() => {
              if (window.confirm('Discard this workout? Recorded sets will not be saved.')) {
                discardWorkout();
              }
            }}
            className="btn-ghost text-xs text-muted hover:text-coral"
          >
            Discard
          </button>
          <Button
            variant="pastelSage"
            onClick={() => setIsFinishSheetOpen(true)}
            className="font-black shadow-lg shadow-mint/20"
          >
            <Check size={16} className="mr-1.5" /> Finish Workout
          </Button>
        </div>
      </header>

      {/* Persistence Notice Pill */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs text-muted">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-1.5 w-1.5 rounded-full bg-mint shrink-0 animate-ping" />
          <span className="truncate">
            Workout continues in background when changing tabs or pages.
          </span>
        </div>
        <button
          onClick={() => {
            haptic.tap();
            navigate({ name: 'home' });
          }}
          className="text-mint hover:underline font-bold text-[11px] shrink-0 ml-2"
        >
          Browse App →
        </button>
      </div>

      {/* Exercise Blocks */}
      <div className="space-y-6">
        {active.blocks.map((block, blockIdx) => {
          const ex = getExercise(block.exerciseId);
          const previousPerformance = lastPerformance(block.exerciseId);
          const priorPR = prs.get(block.exerciseId);
          const nextBlock = active.blocks[blockIdx + 1];
          const isSuperset = block.supersetId && nextBlock?.supersetId === block.supersetId;

          return (
            <Card
              key={block.id}
              className={`p-5 transition-all ${
                isSuperset ? 'border-lav/40 bg-ink-800/90' : 'border-white/10'
              }`}
            >
              {/* Exercise Header */}
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-fg tracking-tight truncate">
                      {ex.name}
                    </h3>
                    {block.supersetId && (
                      <span className="rounded-full bg-lav/20 px-2 py-0.5 text-[9px] font-mono font-bold text-lav">
                        SUPERSET
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-muted flex-wrap">
                    <span className="uppercase font-mono text-[10px] text-peach font-bold">
                      {ex.equipment}
                    </span>
                    <span>•</span>
                    <span>Rest: {block.rest}s</span>
                    {block.targetReps && (
                      <>
                        <span>•</span>
                        <span className="rounded-md bg-mint/15 px-2 py-0.5 text-[11px] font-mono font-bold text-mint">
                          Target: {block.targetReps} reps
                        </span>
                      </>
                    )}
                    {priorPR && (
                      <>
                        <span>•</span>
                        <span className="text-amber flex items-center gap-1 font-mono">
                          <Trophy size={11} /> All-time 1RM: {fmtNum(priorPR.e1rm, 1)} {settings.unit}
                        </span>
                      </>
                    )}
                  </div>

                  {block.note && (
                    <div className="mt-2 text-xs text-muted/90 bg-white/[0.03] p-2.5 rounded-xl border border-white/5 italic">
                      <span className="font-semibold text-fg/90 not-italic mr-1.5">Cue:</span>
                      {block.note}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeBlock(block.id)}
                  aria-label="Remove exercise"
                  className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-coral transition-colors"
                  title="Remove exercise"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Sets Table */}
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted font-mono px-2">
                  <span className="col-span-1">Set</span>
                  <span className="col-span-3">Previous</span>
                  <span className="col-span-3 text-center">Weight ({settings.unit})</span>
                  <span className="col-span-2 text-center">Reps</span>
                  <span className="col-span-3 text-center">Log</span>
                </div>

                {block.sets.map((set, setIdx) => {
                  const prevSet = previousPerformance?.[setIdx];
                  const setEst1RM = e1rm(set.weight, set.reps);

                  return (
                    <div
                      key={set.id}
                      className={`grid grid-cols-12 items-center gap-2 rounded-2xl p-2.5 transition-all duration-300 ${
                        set.done
                          ? set.isPR
                            ? 'shimmer-gold border border-amber/40 bg-amber/15 text-amber'
                            : 'border border-mint/40 bg-mint/10 text-mint'
                          : 'border border-white/5 bg-ink-950/60'
                      }`}
                    >
                      {/* Set Type indicator (W, 1, 2, 3, D) */}
                      <div className="col-span-1 flex items-center justify-center">
                        <select
                          value={set.type}
                          onChange={(e) =>
                            updateSet(block.id, set.id, {
                              type: e.target.value as SetType,
                            })
                          }
                          className="rounded bg-transparent font-mono text-xs font-black text-muted focus:outline-none cursor-pointer"
                        >
                          <option value="warmup">W</option>
                          <option value="working">{setIdx + 1}</option>
                          <option value="drop">D</option>
                          <option value="failure">F</option>
                        </select>
                      </div>

                      {/* Ghost Data: Previous performance */}
                      <div className="col-span-3 font-mono text-xs text-dim truncate">
                        {prevSet ? (
                          <span>
                            {prevSet.weight}
                            <span className="text-[10px]">{settings.unit}</span> × {prevSet.reps}
                          </span>
                        ) : (
                          <span className="italic text-[11px]">—</span>
                        )}
                      </div>

                      {/* Weight input with Smart Equipment Calculator button */}
                      <div className="col-span-3 relative flex items-center justify-center min-w-0">
                        <input
                          type="number"
                          step={ex.equipment === 'dumbbell' ? '1' : '2.5'}
                          value={set.weight || ''}
                          placeholder={
                            ex.equipment === 'bodyweight' && (!set.weight || set.weight === 0)
                              ? 'BW'
                              : prevSet
                              ? String(prevSet.weight)
                              : '0'
                          }
                          onChange={(e) =>
                            updateSet(block.id, set.id, {
                              weight: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-ink-900 px-1 py-1.5 sm:py-2 pr-6 text-center font-mono text-xs sm:text-sm font-bold text-fg focus:border-lav/50 focus:outline-none"
                        />
                        <button
                          onClick={() =>
                            setCalcState({
                              blockId: block.id,
                              setId: set.id,
                              weight: set.weight || prevSet?.weight || (ex.equipment === 'barbell' ? settings.barWeight : 0),
                              exerciseId: block.exerciseId,
                            })
                          }
                          aria-label={`${ex.equipment} calculator`}
                          className="absolute right-1 text-muted hover:text-fg p-0.5 transition-colors"
                          title={`${ex.equipment} calculator`}
                        >
                          {ex.equipment === 'barbell' && <Disc size={13} className="text-peach" />}
                          {ex.equipment === 'dumbbell' && <Dumbbell size={13} className="text-mint" />}
                          {ex.equipment === 'bodyweight' && <User size={13} className="text-ice" />}
                          {(ex.equipment === 'machine' || ex.equipment === 'cable' || ex.equipment === 'kettlebell') && (
                            <Layers size={13} className="text-lav" />
                          )}
                        </button>
                      </div>

                      {/* Reps input */}
                      <div className="col-span-2 flex items-center justify-center">
                        <input
                          type="number"
                          value={set.reps || ''}
                          placeholder={prevSet ? String(prevSet.reps) : '10'}
                          onChange={(e) =>
                            updateSet(block.id, set.id, {
                              reps: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-ink-900 px-1 py-2 text-center font-mono text-sm font-bold text-fg focus:border-lav/50 focus:outline-none"
                        />
                      </div>

                      {/* Big Tactile Set Completion Button */}
                      <div className="col-span-3 flex items-center justify-center">
                        <button
                          onClick={() => toggleSet(block.id, set.id)}
                          className={`flex h-11 w-full items-center justify-center rounded-xl font-bold transition-all duration-200 active:scale-95 ${
                            set.done
                              ? set.isPR
                                ? 'bg-amber text-ink-950 font-black shadow-lg shadow-amber/30'
                                : 'bg-mint text-ink-950 font-black shadow-lg shadow-mint/30'
                              : 'border border-white/15 bg-white/5 text-muted hover:border-mint/50 hover:bg-mint/20 hover:text-mint'
                          }`}
                        >
                          {set.done ? (
                            set.isPR ? (
                              <span className="flex items-center gap-1 text-xs">
                                <Trophy size={14} /> PR!
                              </span>
                            ) : (
                              <Check size={18} strokeWidth={3} />
                            )
                          ) : (
                            <span className="text-xs">Done</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add set button */}
                <div className="pt-1">
                  <button
                    onClick={() => addSet(block.id)}
                    className="btn-ghost w-full py-2 text-xs font-bold text-muted hover:text-fg"
                  >
                    <Plus size={14} className="mr-1" /> Add Set
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Exercise Floating Button */}
      <div className="mt-8 flex justify-center">
        <Button
          variant="outline"
          onClick={() => setIsExercisePickerOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} /> Add Exercise to Workout
        </Button>
      </div>

      {/* Weight Calculator Sheet */}
      {calcState && (
        <PlateCalculator
          open={calcState !== null}
          initialWeight={calcState.weight}
          equipment={getExercise(calcState.exerciseId).equipment}
          exerciseName={getExercise(calcState.exerciseId).name}
          onClose={() => setCalcState(null)}
          onApply={(newWeight) => {
            updateSet(calcState.blockId, calcState.setId, {
              weight: newWeight,
            });
            setCalcState(null);
          }}
        />
      )}

      {/* Exercise Picker Sheet */}
      <ExercisePicker
        open={isExercisePickerOpen}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelect={(ex) => addBlock(ex.id)}
      />

      {/* Workout Completion Sheet */}
      <Sheet
        open={isFinishSheetOpen}
        onClose={() => setIsFinishSheetOpen(false)}
        title="Session Debrief"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsFinishSheetOpen(false)}
              className="btn-ghost flex-1"
            >
              Resume Lifting
            </button>
            <button onClick={handleFinish} className="btn-mint flex-1 font-black">
              Complete & Celebrate 🎉
            </button>
          </div>
        }
      >
        <div className="space-y-6 pt-3">
          <div className="rounded-2xl border border-white/10 bg-ink-950/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
              Workout Summary
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-fg font-mono">
                  {fmtClock(elapsed)}
                </span>
                <span className="ml-2 text-xs text-muted">duration</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-mint font-mono">
                  {completedSetsCount}
                </span>
                <span className="ml-2 text-xs text-muted">sets logged</span>
              </div>
            </div>
          </div>

          {/* RPE Slider (1-10) */}
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Session RPE (Intensity / Effort)</label>
              <span className="num text-base font-extrabold text-peach">
                {finishRpe} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={finishRpe}
              onChange={(e) => setFinishRpe(Number(e.target.value))}
              className="mt-3 w-full accent-peach cursor-pointer"
            />
            <div className="mt-1 flex justify-between text-[10px] text-dim font-mono">
              <span>1 (Warmup)</span>
              <span>7 (Solid)</span>
              <span>10 (Absolute Failure)</span>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="label mb-1.5 block">Workout Notes</label>
            <textarea
              rows={3}
              placeholder="How did the lifts feel? Any joint soreness, energy highs, or technique notes?"
              value={finishNotes}
              onChange={(e) => setFinishNotes(e.target.value)}
              className="input resize-none"
            />
          </div>
        </div>
      </Sheet>
    </Page>
  );
};
