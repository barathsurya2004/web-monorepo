import React from 'react';
import { useApp } from '@/context/AppContext';
import { Button, Badge } from '@packages/ui';
import { Trash2, Play, Flame, ArrowLeft } from 'lucide-react';
import { HabitIcon } from '@/components/HabitIcon';

export const HabitDetail: React.FC = () => {
  const { activeHabit, focusSessions, startFocusSession, deleteHabit, setScreen } = useApp();

  if (!activeHabit) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-[var(--muted)]">No habit selected.</p>
        <Button variant="pastelTerracotta" onClick={() => setScreen('today')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // Filter sessions related to this habit
  const habitSessions = focusSessions.filter((s) => s.habitId === activeHabit.id);
  const totalDuration = habitSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = (totalDuration / 60).toFixed(1);

  // Build this week's journey from real session data
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Build Mon–Sun week
  const startOfWeek = new Date(today);
  const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(today.getDate() - daysSinceMon);
  startOfWeek.setHours(0, 0, 0, 0);

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekDays = DAY_LABELS.map((label, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    // Use string comparison for accurate date-only logic (not datetime)
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;

    // Sum minutes from sessions on this day
    const dayMinutes = habitSessions
      .filter((s) => s.timestamp.startsWith(dateStr))
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    return { label, dateStr, isToday, isFuture, minutes: dayMinutes };
  });

  const daysCompleted = weekDays.filter((d) => !d.isFuture && d.minutes > 0).length;
  const totalPastDays = weekDays.filter((d) => !d.isFuture).length;

  // Consistency: days with at least one session in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const daysWith30 = new Set(
    habitSessions
      .filter((s) => new Date(s.timestamp) >= thirtyDaysAgo)
      .map((s) => s.timestamp.split('T')[0])
  ).size;
  const consistencyPct = totalPastDays > 0
    ? Math.round((daysCompleted / totalPastDays) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-soft-fade">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScreen('today')}
          className="!rounded-full text-xs font-semibold !min-h-[36px] px-4 !text-[#383028] !border-[#CFC3B3] hover:!bg-black/5 dark:!text-slate-200 dark:!border-white/15 gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Today</span>
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (window.confirm(`Are you sure you want to remove "${activeHabit.title}"?`)) {
              deleteHabit(activeHabit.id);
            }
          }}
          className="!rounded-full text-xs font-mono !min-h-[36px] px-3.5 gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove</span>
        </Button>
      </div>

      {/* Hero Detail Card */}
      <div className="bg-[var(--surface-warm)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 relative shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <Badge variant="terracotta" className="!text-[10px]">
            {activeHabit.category}
          </Badge>
          <span className="font-mono text-xs font-bold text-[var(--ochre-seed)] bg-[var(--ochre-soft)] border border-[var(--ochre-border)] px-3 py-0.5 rounded-full flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[var(--ochre-seed)] inline" />
            <span>{activeHabit.streak} Days Consistency</span>
          </span>
        </div>

        <div className="flex items-center gap-3 my-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-pebble)] border border-[var(--border)] flex items-center justify-center shrink-0">
            <HabitIcon icon={activeHabit.icon} className="w-6 h-6 text-current" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--fg)]">
            {activeHabit.title}
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-[var(--muted)] font-serif italic mb-5 leading-relaxed">
          {activeHabit.notes || `Daily practice target: ${activeHabit.targetValue} ${activeHabit.unit}.`}
        </p>

        {/* Stats Cluster */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] p-3 rounded-2xl">
            <div className="font-mono text-[9px] uppercase font-bold text-[var(--muted)]">Total Sessions</div>
            <div className="font-display text-lg sm:text-xl font-bold text-[var(--fg)] mt-0.5">
              {habitSessions.length}
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] p-3 rounded-2xl">
            <div className="font-mono text-[9px] uppercase font-bold text-[var(--muted)]">Focus Time</div>
            <div className="font-display text-lg sm:text-xl font-bold text-[var(--fg)] mt-0.5">
              {totalHours}h
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] p-3 rounded-2xl">
            <div className="font-mono text-[9px] uppercase font-bold text-[var(--muted)]">This Week</div>
            <div className="font-display text-lg sm:text-xl font-bold text-[var(--matcha-leaf)] mt-0.5">
              {consistencyPct}%
            </div>
          </div>
        </div>
      </div>

      {/* This Week's Journey */}
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <h3 className="font-display text-lg font-semibold text-[var(--fg)]">This Week's Journey</h3>
          <span className="font-mono text-xs text-[var(--muted)]">
            {daysCompleted} of {totalPastDays} days logged
          </span>
        </div>

        <div className="flex items-center justify-between gap-1.5 p-2.5 bg-[var(--surface-warm)] border border-[var(--border-subtle)] rounded-2xl">
          {weekDays.map((item, i) => {
            const hasData = item.minutes > 0;
            const label = item.minutes > 0 ? `${item.minutes}m` : '—';
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-[var(--muted)]">{item.label}</span>
                <div
                  className={`w-full py-2 rounded-xl text-center font-mono text-[11px] font-bold transition-colors ${
                    item.isToday
                      ? 'border-2 border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : item.isFuture
                      ? 'bg-[var(--surface-pebble)] border border-[var(--border-subtle)] text-[var(--muted)] opacity-40'
                      : hasData
                      ? 'bg-[var(--matcha-soft)] border border-[var(--matcha-border)] text-[var(--matcha-leaf)]'
                      : 'bg-[var(--surface-pebble)] border border-[var(--border-subtle)] text-[var(--muted)] opacity-60'
                  }`}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Focus Launcher & Session History */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-[var(--fg)]">Recent Flow Logs</h3>
          <Button
            variant="pastelTerracotta"
            size="sm"
            onClick={() => startFocusSession(activeHabit.id, activeHabit.targetValue)}
            className="!rounded-full font-mono text-xs !min-h-[36px] px-4 gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Flow</span>
          </Button>
        </div>

        {habitSessions.length === 0 ? (
          <div className="bg-[var(--surface-warm)] border border-dashed border-[var(--border)] rounded-2xl p-6 text-center space-y-1.5">
            <p className="font-display text-sm text-[var(--fg)] opacity-70">No sessions yet</p>
            <p className="font-mono text-xs text-[var(--muted)]">Start your first flow to begin tracking.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {habitSessions.map((session) => (
              <div
                key={session.id}
                className="bg-[var(--surface)] border border-[var(--border)] p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="font-semibold text-xs sm:text-sm text-[var(--fg)] truncate">
                    {session.note || 'Mindful focus practice'}
                  </div>
                  <div className="font-mono text-[10px] text-[var(--muted)]">
                    {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-full shrink-0">
                  {session.durationMinutes} min
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
