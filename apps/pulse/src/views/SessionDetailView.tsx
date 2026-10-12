import React, { useMemo } from 'react';
import { useStore } from '@/store';
import { Page, PageHeader, Card, SectionTitle } from '@/components/ui';
import { MuscleMap } from '@/components/MuscleMap';
import { getExercise } from '@/data/exercises';
import {
  sessionVolume,
  sessionSets,
  sessionDurationMin,
  fmtNum,
  fmtDate,
  e1rm,
} from '@/lib/calc';
import type { Muscle } from '@/types';
import { Trophy, Clock, Dumbbell, Calendar, ArrowLeft } from 'lucide-react';
import { haptic } from '@/lib/feedback';

interface SessionDetailViewProps {
  sessionId: string;
}

export const SessionDetailView: React.FC<SessionDetailViewProps> = ({ sessionId }) => {
  const { sessions, settings, back } = useStore();

  const session = useMemo(
    () => sessions.find((s) => s.id === sessionId),
    [sessions, sessionId]
  );

  if (!session) {
    return (
      <Page className="text-center py-20">
        <h2 className="text-2xl font-black text-fg">Session Not Found</h2>
        <button onClick={back} className="btn-mint mt-4">
          Go Back
        </button>
      </Page>
    );
  }

  const vol = sessionVolume(session);
  const sets = sessionSets(session);
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

  return (
    <Page>
      <PageHeader
        back
        eyebrow={fmtDate(session.startedAt, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        title={session.name}
        subtitle={`${duration} minutes • ${sets} sets • ${fmtNum(vol)} ${settings.unit} volume load`}
      />

      {/* Core Stats Overview */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Card className="p-4 text-center">
          <div className="label">Total Volume</div>
          <div className="num mt-1 text-2xl font-black text-mint">
            {fmtNum(vol)} <span className="text-xs text-muted font-normal">{settings.unit}</span>
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="label">Duration</div>
          <div className="num mt-1 text-2xl font-black text-fg">
            {duration} <span className="text-xs text-muted font-normal">mins</span>
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="label">Effort / RPE</div>
          <div className="num mt-1 text-2xl font-black text-peach">
            {session.rpe ? `${session.rpe}/10` : '—'}
          </div>
        </Card>
      </div>

      {session.notes && (
        <Card className="p-4 mb-6 border-white/10 bg-ink-950/40">
          <div className="label mb-1">Session Notes</div>
          <p className="text-sm text-slate-300 italic">"{session.notes}"</p>
        </Card>
      )}

      {/* Muscle Map */}
      <div className="mb-8">
        <MuscleMap distribution={muscles} />
      </div>

      {/* Exercise by Exercise breakdown */}
      <SectionTitle>Exercise Log</SectionTitle>
      <div className="space-y-4">
        {session.blocks.map((block, idx) => {
          const ex = getExercise(block.exerciseId);

          return (
            <Card key={block.id} className="p-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h4 className="text-lg font-black text-fg">{ex.name}</h4>
                  <div className="text-xs font-mono text-muted uppercase">
                    {ex.equipment} • {block.sets.length} sets
                  </div>
                </div>
              </div>

              {/* Sets grid */}
              <div className="mt-3 space-y-1.5 font-mono text-xs">
                {block.sets.map((set, setIdx) => {
                  const est = e1rm(set.weight, set.reps);

                  return (
                    <div
                      key={set.id}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                        set.isPR
                          ? 'border border-amber/40 bg-amber/15 text-amber'
                          : 'bg-ink-950/60 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-muted">
                          {set.type === 'warmup' ? 'W' : `#${setIdx + 1}`}
                        </span>
                        <span className="font-bold">
                          {set.weight} {settings.unit} × {set.reps} reps
                        </span>
                        {set.isPR && (
                          <span className="rounded bg-amber/20 px-1.5 py-0.5 text-[10px] font-black text-amber">
                            🏆 PR
                          </span>
                        )}
                      </div>

                      <div className="text-dim text-[11px]">
                        e1RM: {fmtNum(est, 1)} {settings.unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </Page>
  );
};
