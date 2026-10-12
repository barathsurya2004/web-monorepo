import React, { useMemo } from 'react';
import { useStore } from '@/store';
import { Page, PageHeader, Card, SectionTitle } from '@/components/ui';
import { Button, Badge } from '@packages/ui';
import { MuscleMap } from '@/components/MuscleMap';
import { getExercise } from '@/data/exercises';
import {
  sessionVolume,
  sessionSets,
  sessionReps,
  sessionDurationMin,
  fmtNum,
  tonnageComparison,
  e1rm,
} from '@/lib/calc';
import type { Muscle } from '@/types';
import {
  Trophy,
  Flame,
  Clock,
  Dumbbell,
  CheckCircle2,
  Share2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { haptic } from '@/lib/feedback';

interface SummaryViewProps {
  sessionId: string;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ sessionId }) => {
  const { sessions, settings, navigate, toast } = useStore();

  const session = useMemo(
    () => sessions.find((s) => s.id === sessionId),
    [sessions, sessionId]
  );

  if (!session) {
    return (
      <Page className="text-center py-20">
        <h2 className="text-2xl font-black text-fg">Session Not Found</h2>
        <button onClick={() => navigate({ name: 'home' })} className="btn-mint mt-4">
          Return Home
        </button>
      </Page>
    );
  }

  const volume = sessionVolume(session);
  const setsCount = sessionSets(session);
  const repsCount = sessionReps(session);
  const duration = sessionDurationMin(session);

  // Muscle distribution for this session
  const muscles = useMemo(() => {
    const dist: Partial<Record<Muscle, number>> = {};
    for (const b of session.blocks) {
      try {
        const ex = getExercise(b.exerciseId);
        const count = b.sets.filter((s) => s.done && s.type !== 'warmup').length;
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
  }, [session]);

  // PRs hit in this session
  const sessionPRs = session.blocks.flatMap((b) =>
    b.sets
      .filter((s) => s.isPR)
      .map((s) => ({
        exercise: getExercise(b.exerciseId),
        weight: s.weight,
        reps: s.reps,
        e1rm: e1rm(s.weight, s.reps),
      }))
  );

  const handleShare = () => {
    haptic.tap();
    if (navigator.share) {
      void navigator.share({
        title: `PULSE Workout: ${session.name}`,
        text: `Moved ${fmtNum(volume)} ${settings.unit} in ${duration} mins!`,
      });
    } else {
      toast({
        tone: 'mint',
        title: 'Copied to Clipboard',
        body: `Moved ${fmtNum(volume)} ${settings.unit} in ${duration} mins!`,
      });
    }
  };

  return (
    <Page>
      {/* Hero Trophy Card */}
      <div className="relative overflow-hidden rounded-3xl border border-mint/30 bg-gradient-to-br from-ink-800 via-ink-850 to-ink-900 p-6 sm:p-8 shadow-2xl mb-8">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-mint/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-mint font-mono">
          <Sparkles size={16} /> Session Conquered
        </div>

        <h1 className="mt-2 text-3xl font-black text-fg sm:text-4xl tracking-tight">
          Outstanding Work, {settings.name}!
        </h1>
        <p className="mt-1 text-sm text-muted">
          Logged {session.name} • {new Date(session.startedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>

        {/* Tonnage Showcase */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-ink-950/60 p-5">
          <div className="label">Total Tonnage Moved</div>
          <div className="mt-1 flex items-baseline gap-2 font-mono">
            <span className="text-4xl sm:text-5xl font-black text-mint">
              {fmtNum(volume)}
            </span>
            <span className="text-lg text-muted">{settings.unit}</span>
          </div>
          <p className="mt-2 text-xs text-lav font-medium">
            💡 That is equivalent to lifting approx. <strong>{tonnageComparison(volume)}</strong> today!
          </p>
        </div>

        {/* Core Stats Triad */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/5 bg-ink-950/40 p-4 text-center">
            <div className="label">Duration</div>
            <div className="num mt-1 text-2xl font-black text-fg">{duration}m</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-ink-950/40 p-4 text-center">
            <div className="label">Sets</div>
            <div className="num mt-1 text-2xl font-black text-fg">{setsCount}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-ink-950/40 p-4 text-center">
            <div className="label">Reps</div>
            <div className="num mt-1 text-2xl font-black text-fg">{repsCount}</div>
          </div>
        </div>

        {/* Session RPE / Notes if present */}
        {session.rpe && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-2.5 text-xs">
            <span className="text-muted">Effort Rating (RPE)</span>
            <span className="font-mono font-bold text-peach">{session.rpe} / 10</span>
          </div>
        )}
      </div>

      {/* PR Showcase if any were achieved */}
      {sessionPRs.length > 0 && (
        <section className="mb-8">
          <SectionTitle>Milestones & Personal Records 🏆</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sessionPRs.map((pr, idx) => (
              <Card key={idx} className="p-4 border-amber/30 bg-gradient-to-br from-ink-800 to-ink-850">
                <div className="flex items-center gap-2 text-xs font-bold text-amber">
                  <Trophy size={16} /> NEW ESTIMATED 1RM
                </div>
                <h4 className="mt-1 text-base font-black text-fg">
                  {pr.exercise.name}
                </h4>
                <div className="mt-2 flex items-baseline justify-between font-mono">
                  <span className="text-2xl font-black text-amber">
                    {fmtNum(pr.e1rm, 1)} {settings.unit}
                  </span>
                  <span className="text-xs text-muted">
                    {pr.weight}{settings.unit} × {pr.reps} reps
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Muscle Heatmap */}
      <section className="mb-8">
        <MuscleMap distribution={muscles} />
      </section>

      {/* Exercise Breakdown List */}
      <section className="mb-8">
        <SectionTitle>Workout Breakdown</SectionTitle>
        <div className="space-y-3">
          {session.blocks.map((b, idx) => {
            const ex = getExercise(b.exerciseId);
            return (
              <Card key={b.id} className="p-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="font-bold text-fg">{ex.name}</span>
                  <span className="text-xs font-mono text-muted">
                    {b.sets.length} sets completed
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.sets.map((s, sIdx) => (
                    <span
                      key={s.id}
                      className={`rounded-lg px-2.5 py-1 font-mono text-xs ${
                        s.isPR
                          ? 'bg-amber/20 text-amber font-bold border border-amber/40'
                          : 'bg-ink-950/60 text-slate-300'
                      }`}
                    >
                      #{sIdx + 1}: {s.weight}{settings.unit} × {s.reps}
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 pb-12">
        <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
          <Share2 size={16} /> Share Workout
        </Button>
        <Button
          variant="pastelTerracotta"
          onClick={() => {
            haptic.tap();
            navigate({ name: 'home' });
          }}
          className="flex items-center gap-2 font-black"
        >
          Return to Dashboard <ArrowRight size={16} />
        </Button>
      </div>
    </Page>
  );
};
