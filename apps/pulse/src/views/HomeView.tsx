import React from 'react';
import { useStore } from '@/store';
import { Page, Card, Stat, Ring, SectionTitle } from '@/components/ui';
import { StatCard, Button, Badge } from '@packages/ui';
import { getExercise } from '@/data/exercises';
import {
  Play,
  Flame,
  Trophy,
  Plus,
  Calendar,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  SkipForward,
  RotateCcw,
  Moon,
  Award,
} from 'lucide-react';
import { weekdayIdx, startOfWeek, fmtNum, relDay, e1rm, computeStrengthProfile } from '@/lib/calc';
import { haptic } from '@/lib/feedback';

export const HomeView: React.FC = () => {
  const {
    routines,
    plan,
    sessions,
    startWorkout,
    discardWorkout,
    navigate,
    prs,
    active,
    settings,
    isDaySkipped,
    skipDay,
    unskipDay,
    toast,
  } = useStore();

  const todayIdx = weekdayIdx(Date.now());
  const todayPlan = plan.find((p) => p.weekday === todayIdx);
  const plannedRoutine = routines.find((r) => r.id === todayPlan?.routineId);
  const todaySkipped = isDaySkipped();

  // Check if already worked out today
  const weekStart = startOfWeek(Date.now());
  const todaySessions = sessions.filter((s) => s.startedAt >= Date.now() - 20 * 3600000);
  const doneToday = todaySessions.length > 0;

  // Weekly workouts count
  const weeklyWorkouts = sessions.filter((s) => s.startedAt >= weekStart).length;
  const weeklyGoalRatio = Math.min(1, weeklyWorkouts / (settings.weeklyGoal || 5));

  // Recent PRs list
  const recentPRList = Array.from(prs.values())
    .sort((a, b) => b.date - a.date)
    .slice(0, 3);

  // Strength standards calculation
  const strengthProfile = React.useMemo(
    () => computeStrengthProfile(prs, settings.bodyweight || 58.5),
    [prs, settings.bodyweight]
  );

  return (
    <Page>
      {/* Hero Welcome & Today Focus */}
      <section className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted font-mono">
              <Calendar size={14} className="text-peach" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            <h1 className="mt-1 text-3xl font-black text-fg sm:text-4xl tracking-tight">
              Ready to lift, <span className="text-peach">{settings.name || 'Athlete'}</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              {doneToday
                ? 'Session logged for today! Focus on hydration and recovery.'
                : todaySkipped
                ? "Today's workout skipped — active recovery and mobility day."
                : plannedRoutine
                ? `Today's target: ${plannedRoutine.name} (${plannedRoutine.focus})`
                : 'Rest or freestyle active recovery session today.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {todaySkipped ? (
              <button
                onClick={() => {
                  haptic.click();
                  unskipDay();
                  toast({
                    title: 'Workout Restored',
                    body: "Today's workout is back on schedule!",
                    tone: 'mint',
                  });
                }}
                className="btn-peach flex items-center gap-2 text-xs font-bold"
              >
                <RotateCcw size={14} /> Resume Today's Routine
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    haptic.click();
                    if (active) {
                      if (window.confirm(`Discard active workout ("${active.name}") to start a blank one?`)) {
                        discardWorkout();
                        startWorkout();
                      }
                    } else {
                      startWorkout();
                    }
                  }}
                  className="btn-ghost flex items-center gap-2 text-xs"
                >
                  <Plus size={16} /> Quick Blank
                </button>
                <button
                  onClick={() => {
                    haptic.click();
                    if (active) {
                      navigate({ name: 'workout' });
                    } else if (plannedRoutine) {
                      startWorkout(plannedRoutine.id);
                    } else {
                      startWorkout();
                    }
                  }}
                  className="btn-mint flex items-center gap-2 font-black shadow-lg shadow-mint/20"
                >
                  <Play size={18} fill="currentColor" />
                  {active ? 'Resume Session' : plannedRoutine ? `Start ${plannedRoutine.name}` : 'Start Workout'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Ongoing Workout In Progress Banner */}
      {active && (
        <div
          onClick={() => {
            haptic.click();
            navigate({ name: 'workout' });
          }}
          className="mb-8 cursor-pointer rounded-2xl border border-mint/40 bg-gradient-to-r from-mint/15 via-ink-850 to-ink-850 p-4 sm:p-5 shadow-lg shadow-mint/10 transition-all hover:border-mint/60 hover:scale-[1.008] active:scale-[0.99] select-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint/20 text-mint shrink-0 shadow-inner">
                <Flame size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-mint font-mono">
                    Session In Progress · Running in Background
                  </span>
                </div>
                <div className="text-xl font-black text-fg tracking-tight">
                  {active.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
              <span className="text-xs font-mono text-muted">
                {active.blocks.reduce((acc, b) => acc + b.sets.filter((s) => s.done).length, 0)}/
                {active.blocks.reduce((acc, b) => acc + b.sets.length, 0)} sets logged
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.click();
                  navigate({ name: 'workout' });
                }}
                className="btn-mint flex items-center gap-1.5 text-xs font-black shadow-md shadow-mint/20"
              >
                <Play size={14} fill="currentColor" /> Resume Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Status Grid: Today's Routine Card + Weekly Habit Goal */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        {/* Planned Routine Hero Card */}
        <div className="sm:col-span-2">
          {todaySkipped ? (
            <Card className="relative overflow-hidden p-6 border-coral/30 bg-gradient-to-br from-ink-800 to-ink-850">
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-coral/10 blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="rose" className="mb-2 flex items-center gap-1.5">
                    <SkipForward size={12} /> Today Skipped · Active Recovery
                  </Badge>
                  <h2 className="text-2xl font-black text-fg tracking-tight">
                    {plannedRoutine ? `Skipped: ${plannedRoutine.name}` : "Today's Session Skipped"}
                  </h2>
                  <p className="mt-1 text-sm text-muted font-medium">
                    Rest days are when you recover and get stronger. They are not lazy days.
                  </p>
                </div>

                <div className="rounded-2xl bg-coral/10 p-3 text-coral">
                  <Moon size={24} />
                </div>
              </div>

              <div className="my-5 rounded-xl border border-white/5 bg-ink-950/60 p-4 text-xs text-muted space-y-2">
                <div className="flex items-center gap-3 text-fg font-semibold flex-wrap">
                  <span className="flex items-center gap-1 text-peach">🚶 8,000–10,000 steps</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-mint">💧 ~3 litres water</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-lav">😴 In bed by 11 pm</span>
                </div>
                <p>
                  Take two short walks of 10 to 15 minutes after lunch and dinner. If you are feeling extra fatigue or joint strain, an extra rest day lets your nervous system recover.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.08] pt-4 flex-wrap gap-3">
                <button
                  onClick={() => {
                    haptic.click();
                    unskipDay();
                    toast({
                      title: 'Workout Restored',
                      body: 'Today is unskipped. Ready to lift!',
                      tone: 'mint',
                    });
                  }}
                  className="btn-ghost flex items-center gap-1.5 text-xs text-peach hover:text-white"
                >
                  <RotateCcw size={14} /> Undo Skip (Train Today)
                </button>

                <Button
                  variant="pastelSage"
                  onClick={() => {
                    haptic.click();
                    startWorkout('rest-mobility');
                  }}
                  className="font-bold text-xs"
                >
                  Do 10-Min Mobility Routine
                </Button>
              </div>
            </Card>
          ) : plannedRoutine ? (
            <Card className="relative overflow-hidden p-6 border-peach/20 bg-gradient-to-br from-ink-800 to-ink-850">
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-peach/10 blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="terracotta" className="mb-2">
                    Today's Assignment
                  </Badge>
                  <h2 className="text-2xl font-black text-fg tracking-tight">
                    {plannedRoutine.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted font-medium">
                    {plannedRoutine.focus} • ~{plannedRoutine.estMinutes} mins
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-3 text-peach">
                  <Zap size={24} />
                </div>
              </div>

              {/* Exercises in routine preview */}
              <div className="my-5 flex flex-wrap gap-2">
                {plannedRoutine.blocks.slice(0, 4).map((b) => (
                  <span
                    key={b.id}
                    className="rounded-xl border border-white/5 bg-ink-950/60 px-3 py-1.5 text-xs font-semibold text-slate-300"
                  >
                    {getExercise(b.exerciseId).name} ({b.sets.length} sets{b.targetReps ? ` × ${b.targetReps}` : ''})
                  </span>
                ))}
                {plannedRoutine.blocks.length > 4 && (
                  <span className="rounded-xl border border-white/5 bg-ink-950/40 px-2.5 py-1.5 text-xs text-muted">
                    +{plannedRoutine.blocks.length - 4} more
                  </span>
                )}
              </div>

              {plannedRoutine.warmupNote && (
                <div className="mb-4 text-[11px] text-muted/90 bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                  <span className="font-mono uppercase font-bold text-peach text-[10px] mr-1.5">Warm-up:</span>
                  {plannedRoutine.warmupNote}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/[0.08] pt-4 flex-wrap gap-2">
                <span className="text-xs text-muted">
                  {doneToday ? (
                    <span className="flex items-center gap-1.5 text-mint font-semibold">
                      <CheckCircle2 size={16} /> Completed today!
                    </span>
                  ) : (
                    'Pre-loaded with last week’s numbers'
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      haptic.click();
                      skipDay();
                      toast({
                        title: "Today's Workout Skipped",
                        body: "Marked as an active recovery day. Rest and recover!",
                        tone: 'coral',
                      });
                    }}
                    className="btn-ghost flex items-center gap-1.5 text-xs text-muted hover:text-coral transition-colors px-3 py-2 rounded-xl"
                    title="Skip today's workout"
                  >
                    <SkipForward size={14} /> Skip Today
                  </button>

                  <Button
                    variant={active?.routineId === plannedRoutine.id ? 'pastelSage' : 'pastelTerracotta'}
                    onClick={() => {
                      haptic.click();
                      if (active?.routineId === plannedRoutine.id) {
                        navigate({ name: 'workout' });
                      } else {
                        startWorkout(plannedRoutine.id);
                      }
                    }}
                    className="font-black"
                  >
                    <Play size={16} className="mr-1.5" fill="currentColor" />
                    {active?.routineId === plannedRoutine.id ? 'Resume Routine' : 'Launch Routine'}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col justify-between p-6">
              <div>
                <Badge variant="slate" className="mb-2">
                  Rest Day / Recovery
                </Badge>
                <h2 className="text-2xl font-black text-fg tracking-tight">
                  Scheduled Rest Day
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Muscle protein synthesis and neurological recovery happen while you rest.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => navigate({ name: 'routines' })}
                  className="text-xs font-bold text-lav hover:underline flex items-center gap-1"
                >
                  Browse Routine Catalog <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => startWorkout()}
                  className="btn-ghost text-xs"
                >
                  Start Freestyle Anyway
                </button>
              </div>
            </Card>
          )}
        </div>

        {/* Weekly Consistency Card */}
        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="label">Weekly Goal Progress</div>
            <div className="mt-4 flex items-center justify-center">
              <Ring
                value={weeklyGoalRatio}
                size={110}
                stroke={8}
                color="#A8E6CF"
                track="rgba(255,255,255,0.08)"
              >
                <div className="flex flex-col items-center">
                  <span className="num text-2xl font-black text-fg">
                    {weeklyWorkouts}/{settings.weeklyGoal || 5}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted">
                    Workouts
                  </span>
                </div>
              </Ring>
            </div>
          </div>

          <div className="mt-4 border-t border-white/[0.08] pt-3 text-center">
            <span className="text-xs font-medium text-muted">
              {weeklyWorkouts >= (settings.weeklyGoal || 5)
                ? 'Weekly target reached! Phenomenal consistency.'
                : `${(settings.weeklyGoal || 5) - weeklyWorkouts} more sessions to hit this week's target.`}
            </span>
          </div>
        </Card>
      </div>

      {/* Strength Standards & Kinetic Radar Card */}
      <div className="mb-8">
        <div
          onClick={() => {
            haptic.tap();
            navigate({ name: 'analytics', tab: 'radar' });
          }}
          className="group cursor-pointer rounded-2xl border border-amber/25 bg-gradient-to-br from-ink-800 to-ink-850 p-5 shadow-lg transition-all hover:border-amber/50 hover:-translate-y-0.5 active:scale-[0.99]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-amber/15 p-2 text-amber">
                <Award size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber">
                  Kinetic Standards
                </span>
                <h3 className="text-base font-black text-fg group-hover:text-amber transition-colors">
                  Strength Standards & Radar Matrix
                </h3>
              </div>
            </div>
            <ArrowRight size={16} className="text-muted group-hover:text-amber transition-transform group-hover:translate-x-1" />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <span className="text-slate-300">
              Overall Athlete Level: <strong className="text-amber font-black text-sm">{strengthProfile.overallTier}</strong> ({strengthProfile.overallScore} / 5.0)
            </span>
            <span className="rounded-full bg-amber/15 border border-amber/30 px-2.5 py-0.5 text-[11px] font-bold text-amber self-start sm:self-auto">
              {strengthProfile.symmetryBalance}
            </span>
          </div>

          {/* 3-Movement Score Pills */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
            <div className="rounded-xl bg-white/5 py-1.5 border border-white/5">
              <span className="text-muted text-[10px]">Push </span>
              <strong className="text-fg">{strengthProfile.pushScore}</strong>
            </div>
            <div className="rounded-xl bg-white/5 py-1.5 border border-white/5">
              <span className="text-muted text-[10px]">Pull </span>
              <strong className="text-fg">{strengthProfile.pullScore}</strong>
            </div>
            <div className="rounded-xl bg-white/5 py-1.5 border border-white/5">
              <span className="text-muted text-[10px]">Legs </span>
              <strong className="text-fg">{strengthProfile.legScore}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Carousel / Routines */}
      <section className="mb-8">
        <SectionTitle
          action={
            <button
              onClick={() => navigate({ name: 'routines' })}
              className="text-xs font-bold text-lav hover:underline"
            >
              View All ({routines.length})
            </button>
          }
        >
          My Training Routines
        </SectionTitle>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {routines.slice(0, 3).map((r) => (
            <div
              key={r.id}
              onClick={() => {
                haptic.tap();
                startWorkout(r.id);
              }}
              className="group cursor-pointer rounded-2xl border border-white/10 bg-ink-800/80 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-lav/40 hover:bg-ink-750"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-muted">
                  {r.blocks.length} exercises
                </span>
                <span className="text-xs font-mono text-dim">
                  ~{r.estMinutes}m
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold text-fg group-hover:text-lav transition-colors">
                {r.name}
              </h3>
              <p className="text-xs text-muted truncate mt-0.5">{r.focus}</p>

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[11px] text-dim">
                  {r.lastPerformed ? `Last: ${relDay(new Date(r.lastPerformed).getTime())}` : 'Not logged yet'}
                </span>
                <span className="chip text-[11px] font-bold text-mint group-hover:bg-mint/20">
                  <Play size={10} className="mr-1" fill="currentColor" /> Start
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent PR Trophy Showcase */}
      {recentPRList.length > 0 && (
        <section className="mb-8">
          <SectionTitle
            action={
              <button
                onClick={() => navigate({ name: 'analytics' })}
                className="text-xs font-bold text-lav hover:underline"
              >
                Analytics & Records
              </button>
            }
          >
            Recent Personal Records (PRs)
          </SectionTitle>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {recentPRList.map((pr) => {
              const ex = getExercise(pr.exerciseId);
              return (
                <Card key={pr.exerciseId} className="p-4 border-amber/20 bg-gradient-to-br from-ink-800 to-ink-850">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber">
                        <Trophy size={14} /> NEW 1RM PR
                      </div>
                      <h4 className="mt-1 text-sm font-bold text-fg truncate">
                        {ex.name}
                      </h4>
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between font-mono">
                    <div>
                      <span className="text-2xl font-black text-amber">
                        {fmtNum(pr.e1rm, 1)}
                      </span>
                      <span className="ml-1 text-xs text-muted">{settings.unit}</span>
                    </div>
                    <span className="text-xs text-dim">
                      {pr.weight}{settings.unit} × {pr.reps} reps
                    </span>
                  </div>

                  <div className="mt-2 text-[10px] text-dim font-mono">
                    {relDay(pr.date)}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </Page>
  );
};
