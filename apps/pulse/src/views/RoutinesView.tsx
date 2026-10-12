import React from 'react';
import { useStore } from '@/store';
import { Page, PageHeader, Card } from '@/components/ui';
import { Button, Badge } from '@packages/ui';
import { getExercise } from '@/data/exercises';
import { relDay } from '@/lib/calc';
import {
  Plus,
  Play,
  Edit2,
  Copy,
  Trash2,
  Clock,
  Dumbbell,
  Sparkles,
} from 'lucide-react';
import { haptic } from '@/lib/feedback';

export const RoutinesView: React.FC = () => {
  const {
    routines,
    startWorkout,
    duplicateRoutine,
    deleteRoutine,
    navigate,
    toast,
    active,
  } = useStore();

  const handleDuplicate = (id: string, name: string) => {
    haptic.tap();
    duplicateRoutine(id);
    toast({
      tone: 'mint',
      title: 'Routine Cloned',
      body: `Created a copy of ${name}`,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      haptic.click();
      deleteRoutine(id);
      toast({
        tone: 'coral',
        title: 'Routine Removed',
        body: `${name} has been deleted.`,
      });
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Routine Catalog"
        title="Training Templates"
        subtitle="Custom and pre-designed routines. Launch in one tap or customize sets, reps, and supersets."
        action={
          <Button
            variant="primary"
            onClick={() => {
              haptic.click();
              navigate({ name: 'builder' });
            }}
            className="flex items-center gap-1.5 font-black"
          >
            <Plus size={18} /> Create Routine
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {routines.map((r) => {
          const totalSets = r.blocks.reduce((acc, b) => acc + b.sets.length, 0);

          return (
            <Card
              key={r.id}
              className="flex flex-col justify-between p-5 border-white/10 transition-all hover:border-lav/30 hover:bg-ink-750/70"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-fg tracking-tight">
                      {r.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted font-medium">
                      {r.focus}
                    </p>
                  </div>

                  <Badge variant="indigo" className="shrink-0">
                    ~{r.estMinutes}m
                  </Badge>
                </div>

                {/* Exercises Preview */}
                <div className="mt-4 space-y-1.5">
                  {r.blocks.map((b, idx) => {
                    const ex = getExercise(b.exerciseId);
                    return (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-xl bg-ink-950/50 px-3 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-dim">
                            {idx + 1}.
                          </span>
                          <span className="font-medium text-slate-200 truncate">
                            {ex.name}
                          </span>
                          {b.supersetId && (
                            <span className="rounded bg-lav/20 px-1 py-0.2 text-[9px] font-bold text-lav font-mono">
                              SUPERSET
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-muted shrink-0 pl-2">
                          {b.sets.length} sets{b.targetReps ? ` × ${b.targetReps}` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {r.warmupNote && (
                  <div className="mt-3 text-[11px] text-muted/80 bg-white/[0.02] p-2 rounded-lg border border-white/5 line-clamp-2">
                    <span className="font-semibold text-peach font-mono text-[10px] mr-1">Warm-up:</span>
                    {r.warmupNote}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-[11px] text-dim font-mono">
                  <span>{totalSets} total sets</span>
                  <span>
                    {r.lastPerformed
                      ? `Last: ${relDay(new Date(r.lastPerformed).getTime())}`
                      : 'Never performed'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate({ name: 'builder', routineId: r.id })}
                    aria-label="Edit routine"
                    className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-fg transition-colors"
                    title="Edit routine"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(r.id, r.name)}
                    aria-label="Duplicate routine"
                    className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-fg transition-colors"
                    title="Duplicate routine"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id, r.name)}
                    aria-label="Delete routine"
                    className="rounded-lg p-2 text-muted hover:bg-coral/20 hover:text-coral transition-colors"
                    title="Delete routine"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    haptic.click();
                    if (active?.routineId === r.id) {
                      navigate({ name: 'workout' });
                    } else {
                      startWorkout(r.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 text-xs font-black shadow-md transition-all ${
                    active?.routineId === r.id
                      ? 'btn-mint shadow-mint/30 ring-2 ring-mint/50 animate-pulse'
                      : 'btn-mint shadow-mint/20'
                  }`}
                >
                  <Play size={14} fill="currentColor" />
                  {active?.routineId === r.id ? 'Resume Workout' : 'Start Workout'}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </Page>
  );
};
