import React, { useState } from 'react';
import { useStore } from '@/store';
import { Page, PageHeader, Card, Sheet, SectionTitle } from '@/components/ui';
import { Button, Badge } from '@packages/ui';
import { WEEKDAYS, weekdayIdx } from '@/lib/calc';
import { MuscleMap } from '@/components/MuscleMap';
import { muscleSets } from '@/lib/calc';
import { CalendarDays, Plus, Check, Moon, Zap, ArrowRight, SkipForward, RotateCcw } from 'lucide-react';
import { haptic } from '@/lib/feedback';

export const PlannerView: React.FC = () => {
  const {
    plan,
    setPlanDay,
    routines,
    startWorkout,
    navigate,
    active,
    isDaySkipped,
    skipDay,
    unskipDay,
    toast,
  } = useStore();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const todayIdx = weekdayIdx(Date.now());
  const todaySkipped = isDaySkipped();

  // Aggregate planned muscle volume
  const plannedMuscles = routines.reduce<Record<string, number>>((acc, r) => {
    const isPlanned = plan.some((p) => p.routineId === r.id);
    if (!isPlanned) return acc;
    // count approx sets
    r.blocks.forEach((b) => {
      // rough
    });
    return acc;
  }, {});

  const handleAssign = (routineId: string | null) => {
    if (selectedDay === null) return;
    haptic.click();
    setPlanDay(selectedDay, routineId);
    setSelectedDay(null);
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Mesocycle Architecture"
        title="Weekly Training Planner"
        subtitle="Structure your training split. Drag or assign workouts to days to optimize volume and rest."
      />

      {/* 7-Day Week Matrix */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {WEEKDAYS.map((dayName, idx) => {
          const planEntry = plan.find((p) => p.weekday === idx);
          const routine = routines.find((r) => r.id === planEntry?.routineId);
          const isToday = idx === todayIdx;
          const isSkippedToday = isToday && todaySkipped;

          return (
            <div
              key={dayName}
              onClick={() => {
                haptic.tap();
                setSelectedDay(idx);
              }}
              className={`group flex min-h-[170px] cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 hover:border-lav/50 ${
                isToday
                  ? isSkippedToday
                    ? 'border-coral/50 bg-gradient-to-b from-ink-800 to-ink-850 shadow-lg shadow-coral/10'
                    : 'border-peach/50 bg-gradient-to-b from-ink-800 to-ink-850 shadow-lg shadow-peach/10'
                  : routine
                  ? 'border-white/10 bg-ink-800/70 hover:bg-ink-750'
                  : 'border-dashed border-white/10 bg-ink-950/40 hover:bg-white/[0.03]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold font-mono ${isToday ? (isSkippedToday ? 'text-coral' : 'text-peach') : 'text-muted'}`}>
                    {dayName}
                  </span>
                  {isToday && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black font-mono ${
                      isSkippedToday ? 'bg-coral/20 text-coral' : 'bg-peach/20 text-peach'
                    }`}>
                      {isSkippedToday ? 'SKIPPED' : 'TODAY'}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  {isSkippedToday ? (
                    <div>
                      <div className="font-bold text-coral text-sm flex items-center gap-1.5">
                        <SkipForward size={14} /> Skipped
                      </div>
                      <div className="mt-1 text-[11px] text-muted line-clamp-2">
                        Active recovery & mobility
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-dim">
                        Original: {routine?.name || 'Workout'}
                      </div>
                    </div>
                  ) : routine ? (
                    <div>
                      <div className="font-bold text-fg text-sm group-hover:text-lav transition-colors">
                        {routine.name}
                      </div>
                      <div className="mt-1 text-[11px] text-muted line-clamp-2">
                        {routine.focus}
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-dim">
                        ~{routine.estMinutes}m • {routine.blocks.length} exercises
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-dim italic pt-2">
                      <Moon size={14} className="opacity-60" /> Rest Day
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
                <span className="text-dim group-hover:text-lav">Change</span>
                {isToday && isSkippedToday && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.click();
                      unskipDay();
                      toast({ title: 'Workout Restored', body: 'Ready to train!', tone: 'mint' });
                    }}
                    className="chip text-[10px] font-bold text-peach hover:bg-peach/20 flex items-center gap-1"
                  >
                    <RotateCcw size={10} /> Unskip
                  </button>
                )}
                {isToday && !isSkippedToday && routine && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic.click();
                        skipDay();
                        toast({ title: "Today's Workout Skipped", body: 'Marked as rest.', tone: 'coral' });
                      }}
                      className="chip text-[10px] font-bold text-muted hover:text-coral hover:bg-coral/10"
                      title="Skip today's workout"
                    >
                      Skip
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic.click();
                        if (active?.routineId === routine.id) {
                          navigate({ name: 'workout' });
                        } else {
                          startWorkout(routine.id);
                        }
                      }}
                      className={`chip text-[10px] font-bold ${
                        active?.routineId === routine.id
                          ? 'bg-mint/30 text-mint ring-1 ring-mint animate-pulse'
                          : 'text-mint hover:bg-mint/20'
                      }`}
                    >
                      {active?.routineId === routine.id ? 'Resume' : 'Start'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Routine Assignment Sheet */}
      <Sheet
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay !== null ? `Plan ${WEEKDAYS[selectedDay]}` : 'Plan Day'}
      >
        <div className="space-y-3 pt-2">
          {/* Skip / Unskip Toggle if Selected Day is Today */}
          {selectedDay === todayIdx && (
            todaySkipped ? (
              <div
                onClick={() => {
                  unskipDay();
                  setSelectedDay(null);
                  toast({ title: 'Workout Restored', body: "Today is back on schedule!", tone: 'mint' });
                }}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-peach/30 bg-peach/10 p-4 transition-all hover:bg-peach/15"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-peach/20 p-2 text-peach">
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-fg">Restore Today's Workout</div>
                    <div className="text-xs text-muted">Currently marked as skipped for today</div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  skipDay();
                  setSelectedDay(null);
                  toast({ title: "Today's Workout Skipped", body: "Marked as an active recovery day.", tone: 'coral' });
                }}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-coral/30 bg-coral/10 p-4 transition-all hover:bg-coral/15"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-coral/20 p-2 text-coral">
                    <SkipForward size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-fg">Skip Today's Workout</div>
                    <div className="text-xs text-muted">Take today off as an active recovery / rest day</div>
                  </div>
                </div>
              </div>
            )
          )}
          {/* Rest Day option */}
          <div
            onClick={() => handleAssign(null)}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-ink-950/60 p-4 transition-all hover:border-white/20 hover:bg-ink-800"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/5 p-2 text-muted">
                <Moon size={18} />
              </div>
              <div>
                <div className="font-bold text-fg">Scheduled Rest Day</div>
                <div className="text-xs text-muted">No workout assigned</div>
              </div>
            </div>
            {selectedDay !== null && !plan.find((p) => p.weekday === selectedDay)?.routineId && (
              <Check size={18} className="text-mint" />
            )}
          </div>

          <div className="label pt-2">Assign from Routines:</div>

          {routines.map((r) => {
            const isAssigned = selectedDay !== null && plan.find((p) => p.weekday === selectedDay)?.routineId === r.id;

            return (
              <div
                key={r.id}
                onClick={() => handleAssign(r.id)}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all hover:border-lav/40 hover:bg-ink-800 ${
                  isAssigned ? 'border-lav/50 bg-lav/10' : 'border-white/10 bg-ink-950/60'
                }`}
              >
                <div>
                  <div className="font-bold text-fg">{r.name}</div>
                  <div className="mt-0.5 text-xs text-muted">{r.focus} • ~{r.estMinutes} mins</div>
                  <div className="mt-1 text-[11px] text-dim">{r.blocks.length} exercises</div>
                </div>

                {isAssigned && <Check size={18} className="text-lav" />}
              </div>
            );
          })}

          <div className="pt-2 text-center">
            <button
              onClick={() => {
                setSelectedDay(null);
                navigate({ name: 'builder' });
              }}
              className="btn-ghost text-xs w-full"
            >
              <Plus size={14} className="mr-1" /> Create Brand New Routine
            </button>
          </div>
        </div>
      </Sheet>

      {/* Routine Overview Section */}
      <section className="mt-10">
        <SectionTitle
          action={
            <Button
              variant="pastelSage"
              size="sm"
              onClick={() => navigate({ name: 'builder' })}
            >
              <Plus size={14} className="mr-1" /> New Routine
            </Button>
          }
        >
          Routine Quick Library
        </SectionTitle>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {routines.map((r) => (
            <Card key={r.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-fg">{r.name}</h3>
                  <Badge variant="indigo">~{r.estMinutes}m</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{r.focus}</p>

                <div className="my-3 flex flex-wrap gap-1.5">
                  {r.blocks.map((b) => (
                    <span key={b.id} className="rounded-lg bg-ink-950/60 px-2 py-1 text-[11px] text-slate-300 font-mono">
                      {b.sets.length}× sets
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                <button
                  onClick={() => navigate({ name: 'builder', routineId: r.id })}
                  className="text-xs font-bold text-lav hover:underline"
                >
                  Edit Routine
                </button>
                <button
                  onClick={() => startWorkout(r.id)}
                  className="btn-mint text-xs py-1.5 px-3"
                >
                  Start Workout
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </Page>
  );
};
