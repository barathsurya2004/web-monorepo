import React, { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Page, PageHeader, Card } from '@/components/ui';
import { Badge } from '@packages/ui';
import { getExercise } from '@/data/exercises';
import {
  sessionVolume,
  sessionSets,
  sessionDurationMin,
  fmtNum,
  fmtDate,
  relDay,
} from '@/lib/calc';
import { Calendar, Dumbbell, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { haptic } from '@/lib/feedback';

export const HistoryView: React.FC = () => {
  const { sessions, deleteSession, navigate, settings, toast } = useStore();
  const [filterRoutine, setFilterRoutine] = useState<string>('all');

  // Sorted latest first
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.startedAt - a.startedAt),
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    if (filterRoutine === 'all') return sortedSessions;
    return sortedSessions.filter((s) => s.routineId === filterRoutine);
  }, [sortedSessions, filterRoutine]);

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Delete workout record "${name}"?`)) {
      haptic.click();
      deleteSession(id);
      toast({
        tone: 'coral',
        title: 'Workout Deleted',
        body: 'Session removed from training history.',
      });
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Training Log"
        title="Workout History"
        subtitle={`Review past performance and logbook entries across ${sessions.length} recorded workouts.`}
      />

      {/* Routine Quick Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        <button
          onClick={() => setFilterRoutine('all')}
          className={`chip whitespace-nowrap ${filterRoutine === 'all' ? 'chip-active' : ''}`}
        >
          All Sessions ({sortedSessions.length})
        </button>
        {Array.from(new Set(sessions.map((s) => s.routineId).filter(Boolean))).map((rid) => {
          const sample = sessions.find((s) => s.routineId === rid);
          return (
            <button
              key={rid}
              onClick={() => setFilterRoutine(rid!)}
              className={`chip whitespace-nowrap ${filterRoutine === rid ? 'chip-active' : ''}`}
            >
              {sample?.name || rid}
            </button>
          );
        })}
      </div>

      {/* Sessions Feed */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="py-20 text-center text-muted">
            <Dumbbell size={36} className="mx-auto mb-2 opacity-30 text-lav" />
            <p className="text-base font-semibold">No recorded workouts found</p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const vol = sessionVolume(session);
            const sets = sessionSets(session);
            const duration = sessionDurationMin(session);

            return (
              <Card
                key={session.id}
                hover
                onClick={() => {
                  haptic.tap();
                  navigate({ name: 'session', sessionId: session.id });
                }}
                className="p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-peach">
                        {fmtDate(session.startedAt, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-dim">•</span>
                      <span className="text-xs text-muted font-mono">{relDay(session.startedAt)}</span>
                    </div>

                    <h3 className="mt-1 text-lg font-black text-fg truncate">
                      {session.name}
                    </h3>

                    {/* Exercise tags */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {session.blocks.slice(0, 4).map((b) => (
                        <span
                          key={b.id}
                          className="rounded-lg bg-ink-950/60 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                        >
                          {getExercise(b.exerciseId).name} ({b.sets.length})
                        </span>
                      ))}
                      {session.blocks.length > 4 && (
                        <span className="rounded-lg bg-ink-950/40 px-1.5 py-0.5 text-[11px] text-muted">
                          +{session.blocks.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1 font-mono text-base font-black text-mint">
                      <span>{fmtNum(vol)}</span>
                      <span className="text-xs text-muted font-normal">{settings.unit}</span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs font-mono text-dim">
                      <span>{sets} sets</span>
                      <span>•</span>
                      <span>{duration}m</span>
                    </div>

                    <div className="mt-4 flex items-center gap-1">
                      <button
                        onClick={(e) => handleDelete(e, session.id, session.name)}
                        aria-label="Delete session"
                        className="rounded p-1 text-muted hover:text-coral transition-colors"
                        title="Delete session"
                      >
                        <Trash2 size={15} />
                      </button>
                      <ChevronRight size={18} className="text-muted" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </Page>
  );
};
