import React from 'react';
import { useApp } from '@/context/AppContext';
import { EmptyToday } from '@/views/EmptyToday';
import { Badge, Button } from '@packages/ui';
import { Coffee } from 'lucide-react';

interface TodayDashboardProps {
  onOpenAddModal?: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({ onOpenAddModal }) => {
  const {
    habits,
    focusSessions,
    toggleHabitCompletion,
    startFocusSession,
    selectHabitForDetail,
    toggleStreakFreeze,
    isHabitScheduledToday,
    timerMode,
    timerRemainingSeconds,
    setScreen,
  } = useApp();

  // Completed count and percentage
  const totalCount = habits.length;
  const completedCount = habits.filter((h) => h.isCompleted).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate real total focus time logged TODAY
  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const todaySessions = focusSessions.filter((s) => s.timestamp.startsWith(todayStr));
  const totalFocusMinutes = todaySessions.reduce((acc, sess) => acc + sess.durationMinutes, 0);
  const hours = Math.floor(totalFocusMinutes / 60);
  const mins = totalFocusMinutes % 60;
  const focusTimeString = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  // Real week strip computation (Monday through Sunday)
  const weekDays = React.useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon...
    const distToMon = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distToMon);

    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return labels.map((char, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isCurrent = dateStr === todayStr;
      const isPast = d < now && !isCurrent;
      const hasSessions = focusSessions.some((s) => s.timestamp.startsWith(dateStr));
      const isDone = isPast && hasSessions;

      return {
        day: char,
        label: names[i],
        dateStr,
        isCurrent,
        isDone,
        stat: `${completedCount}/${totalCount}`,
      };
    });
  }, [focusSessions, completedCount, totalCount, todayStr]);

  if (habits.length === 0) {
    return <EmptyToday onOpenAddModal={onOpenAddModal || (() => {})} />;
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.';
  const timeOfDayTag = hour < 12 ? 'Dawn Practice' : hour < 17 ? 'Noon Flow' : 'Evening Reflection';
  const formattedToday = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const getBlobClass = (theme: string) => {
    switch (theme) {
      case 'matcha':
        return 'bg-[var(--matcha-soft)] border-[var(--matcha-border)] text-[var(--matcha-leaf)]';
      case 'ochre':
        return 'bg-[var(--ochre-soft)] border-[var(--ochre-border)] text-[var(--ochre-seed)]';
      case 'river':
        return 'bg-[var(--river-soft)] border-[var(--river-border)] text-[var(--river-mist)]';
      case 'plum':
        return 'bg-[var(--wild-soft)] border-[var(--wild-border)] text-[var(--wild-plum)]';
      default:
        return 'bg-[var(--clay-soft)] border-[var(--clay-border)] text-[var(--clay-terracotta)]';
    }
  };

  const getBadgeVariant = (theme: string): 'terracotta' | 'sage' | 'amber' | 'indigo' | 'rose' => {
    switch (theme) {
      case 'matcha':
        return 'sage';
      case 'ochre':
        return 'amber';
      case 'river':
        return 'indigo';
      case 'plum':
        return 'rose';
      default:
        return 'terracotta';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-soft-fade">
      {/* Mindful Greeting */}
      <div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#5C5347] dark:text-[var(--muted)] font-semibold mb-1">
          <span className="text-[var(--matcha-leaf)]">✦</span>
          <span>{formattedToday} • {timeOfDayTag}</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium leading-tight text-[var(--fg)]">
          {greeting}<br />
          <em className="italic text-[var(--clay-terracotta)]">Small steps become meaning.</em>
        </h1>
      </div>

      {/* Break Mode Alert Banner */}
      {(timerMode === 'shortBreak' || timerMode === 'longBreak') && (
        <div
          onClick={() => setScreen('focus')}
          className="bg-[var(--matcha-soft)] border border-[var(--matcha-border)] text-[var(--matcha-leaf)] p-4 rounded-2xl flex items-center justify-between gap-3 cursor-pointer shadow-sm hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--matcha-leaf)] text-white flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider">
                Restorative Break in Progress
              </div>
              <div className="text-xs opacity-80 font-serif">
                {Math.floor(timerRemainingSeconds / 60)}m {timerRemainingSeconds % 60}s remaining • Tap to return to Sanctuary
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="!rounded-xl text-xs font-mono !min-h-[32px] !text-[#383028] !border-[#CFC3B3] hover:!bg-black/5 dark:!text-slate-200 dark:!border-white/15">
            Resume ➔
          </Button>
        </div>
      )}

      {/* Clean Wave Summary Card */}
      <div className="bg-[var(--surface-warm)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Today's Practice
          </div>
          <div className="font-display text-xl sm:text-2xl font-semibold text-[var(--fg)]">
            <span className="text-[var(--accent)] font-bold">{completedCount}</span> of {totalCount} habits completed
          </div>
          <div className="text-xs text-[var(--muted)] font-mono">
            {focusTimeString} focused flow logged today
          </div>
        </div>

        {/* Geometric Progress Ring */}
        <div 
          className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0"
          title={`${percent}% of daily habits completed`}
        >
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="var(--border)"
              strokeWidth="4"
              className="opacity-40"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="4"
              strokeDasharray={125.6}
              strokeDashoffset={125.6 - (125.6 * percent) / 100}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute font-mono text-xs font-black text-[var(--fg)]">
            {percent}%
          </span>
        </div>
      </div>

      {/* Week Streak Clean Strip */}
      <div className="flex items-center justify-between gap-1.5 p-2 sm:p-2.5 bg-[var(--surface-warm)] border border-[var(--border-subtle)] rounded-2xl">
        {weekDays.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1 cursor-pointer group">
            <span className="text-[10px] font-mono text-[var(--muted)] font-semibold">{item.day}</span>
            <div
              className={`w-full py-2 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                item.isCurrent
                  ? 'border-2 border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm'
                  : item.isDone
                  ? 'bg-[var(--matcha-soft)] border border-[var(--matcha-border)] text-[var(--matcha-leaf)]'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[#7A7063] dark:text-[var(--muted)]'
              }`}
            >
              {item.isCurrent ? item.stat : item.isDone ? '✓' : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Habits Header */}
      <div className="flex items-baseline justify-between pt-1">
        <h2 className="font-display text-xl font-semibold text-[var(--fg)] flex items-center gap-2">
          <span>Today's Habits</span>
          <span className="font-mono text-xs font-normal text-[var(--muted)]">({totalCount})</span>
        </h2>
        <span className="font-mono text-xs text-[var(--muted)]">Tap card to inspect</span>
      </div>

      {/* Clean Habit Cards List */}
      <div className="flex flex-col gap-3">
        {habits.map((habit) => {
          const isDone = habit.isCompleted;
          const progPercent = Math.min(Math.round((habit.currentValue / habit.targetValue) * 100), 100);

          return (
            <article
              key={habit.id}
              onClick={() => selectHabitForDetail(habit.id)}
              className={`bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3.5 cursor-pointer relative ${
                isDone ? '!bg-[var(--surface-warm)]' : 'hover:-translate-y-0.5'
              }`}
            >
              {/* Card Top Line */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shrink-0 ${getBlobClass(
                      habit.colorTheme
                    )}`}
                  >
                    {habit.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={getBadgeVariant(habit.colorTheme)} className="!text-[9px] !py-0.5 !px-2">
                        {habit.category}
                      </Badge>
                      <span className="font-mono text-[11px] font-bold text-[var(--ochre-seed)]">
                        🔥 {habit.streak}d
                      </span>
                      {habit.frequencyType && habit.frequencyType !== 'daily' && (
                        <span className="font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[var(--surface-warm)] border border-[#CFC3B3] dark:border-[var(--border)] text-[#5C5347] dark:text-[var(--muted)] capitalize">
                          {habit.frequencyType}
                        </span>
                      )}
                      {habit.freezesUsed?.includes(new Date().toISOString().split('T')[0]) ? (
                        <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-300 border border-cyan-400">
                          ❄️ Protected
                        </span>
                      ) : !isHabitScheduledToday(habit) ? (
                        <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-400">
                          🍃 Rest Day
                        </span>
                      ) : null}
                    </div>
                    <h3
                      className={`font-display text-lg font-semibold text-[var(--fg)] mt-0.5 truncate ${
                        isDone ? 'line-through text-[#665D52] dark:text-[#A89F93]' : ''
                      }`}
                    >
                      {habit.title}
                    </h3>
                  </div>
                </div>

                {/* Right Actions: Freeze & Completion */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isDone && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStreakFreeze(habit.id);
                      }}
                      title={
                        habit.freezesUsed?.includes(new Date().toISOString().split('T')[0])
                          ? 'Streak freeze active for today'
                          : `Protect streak with freeze (${habit.streakFreezesAvailable ?? 2} available)`
                      }
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                        habit.freezesUsed?.includes(new Date().toISOString().split('T')[0])
                          ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-300 border-cyan-400 shadow-sm'
                          : 'bg-[var(--surface-warm)] text-[#544B40] border-[#CFC3B3] hover:border-cyan-500 hover:text-cyan-800 dark:border-[var(--border)] dark:text-[var(--muted)]'
                      }`}
                    >
                      <span>❄️</span>
                      <span className="hidden sm:inline">
                        {habit.freezesUsed?.includes(new Date().toISOString().split('T')[0])
                          ? 'Frozen'
                          : 'Freeze'}
                      </span>
                    </button>
                  )}

                  {/* Reused @packages/ui Button for Completion */}
                  <Button
                    type="button"
                    variant={isDone ? 'pastelSage' : 'outline'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHabitCompletion(habit.id);
                    }}
                    title={isDone ? 'Mark uncompleted' : 'Mark completed'}
                    className={`!w-9 !h-9 !min-h-[36px] !p-0 !rounded-full text-sm font-bold shrink-0 transition-all ${
                      isDone
                        ? '!bg-[var(--matcha-leaf)] !text-white !border-[var(--matcha-leaf)] shadow-sm'
                        : '!border-2 !border-[#B5A795] dark:!border-white/25 !text-transparent hover:!border-[var(--matcha-leaf)] hover:!bg-[var(--matcha-soft)]'
                    }`}
                  >
                    ✓
                  </Button>
                </div>
              </div>

              {/* Progress & Focus Launcher */}
              <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-dashed border-[var(--border-subtle)]">
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between font-mono text-xs text-[#5C5347] dark:text-[var(--muted)] font-medium">
                    <span>Target: {habit.targetValue} {habit.unit}</span>
                    <strong className={isDone ? 'text-[var(--matcha-leaf)] font-bold' : 'text-[var(--fg)] font-bold'}>
                      {isDone ? `${habit.currentValue} / ${habit.targetValue} ${habit.unit} ✓` : `${habit.currentValue} / ${habit.targetValue} ${habit.unit}`}
                    </strong>
                  </div>
                  <div className="h-2 bg-[var(--surface-pebble)] border border-[var(--border-subtle)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone
                          ? 'bg-gradient-to-r from-[var(--matcha-leaf)] to-[#7CB28F]'
                          : 'bg-gradient-to-r from-[var(--clay-terracotta)] to-[#E3866E]'
                      }`}
                      style={{ width: `${isDone ? 100 : progPercent}%` }}
                    />
                  </div>
                </div>

                {/* Focus Button reusing @packages/ui Button */}
                <Button
                  variant={isDone ? 'outline' : 'pastelTerracotta'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    startFocusSession(habit.id, habit.goalType === 'duration' ? habit.targetValue : 25);
                  }}
                  className={`!rounded-xl text-xs font-mono font-bold shrink-0 !min-h-[34px] px-3 gap-1 ${
                    isDone
                      ? '!text-[#383028] !border-[#CFC3B3] hover:!bg-black/5 dark:!text-slate-200 dark:!border-white/20'
                      : ''
                  }`}
                >
                  <span>⏱</span>
                  <span>{isDone ? '+ Flow' : 'Focus'}</span>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
