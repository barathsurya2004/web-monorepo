import React from 'react';
import { useApp } from '@/context/AppContext';
import { Category } from '@/types';
import { Badge, Button } from '@packages/ui';
import { Sparkles, Compass, Clock, BookOpen, Flame, Sunrise, Sun, Sunset, Moon } from 'lucide-react';

interface GrowthAnalyticsProps {
  onOpenAddModal?: () => void;
}

export const GrowthAnalytics: React.FC<GrowthAnalyticsProps> = ({ onOpenAddModal }) => {
  const { habits, focusSessions, setScreen } = useApp();

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sun, 1 = Mon ...
  const distToMon = (currentDay + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distToMon);
  monday.setHours(0, 0, 0, 0);

  // 1. Weekly Focus Calculation
  const thisWeekSessions = focusSessions.filter((s) => new Date(s.timestamp) >= monday);
  const thisWeekMinutes = thisWeekSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const thisWeekHours = Math.floor(thisWeekMinutes / 60);
  const thisWeekMins = thisWeekMinutes % 60;
  const thisWeekString =
    thisWeekHours > 0 ? `${thisWeekHours}h ${thisWeekMins}m` : `${thisWeekMins}m`;

  // 2. All-Time Stats
  const totalMinutesAllTime = focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHoursAllTime = (totalMinutesAllTime / 60).toFixed(1);

  // 3. Consistency Rate (Days in the last 7 days that had focus sessions or completed habits)
  const last7DaysWithActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    return focusSessions.some((s) => s.timestamp.startsWith(dateStr));
  }).filter(Boolean).length;
  const consistencyPercent = Math.round((last7DaysWithActivity / 7) * 100);

  // 4. Longest Streak across habits
  const longestStreak =
    habits.length > 0
      ? Math.max(0, ...habits.map((h) => Math.max(h.streak || 0, (h as any).longestStreak || 0)))
      : 0;

  // 5. Monday - Sunday Weekly Distribution
  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDayShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekDaysData = weekDayLabels.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = dateStr === now.toISOString().split('T')[0];
    const daySessions = focusSessions.filter((s) => s.timestamp.startsWith(dateStr));
    const dayMinutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    return {
      day: weekDayShort[i],
      fullName: name,
      dateStr,
      minutes: dayMinutes,
      isToday,
      sessionsCount: daySessions.length,
    };
  });

  const maxDayMinutes = Math.max(30, ...weekDaysData.map((d) => d.minutes));

  // 6. Category Harmony Breakdown
  const categoryTotals: Record<Category, number> = {
    Creative: 0,
    Learning: 0,
    Engineering: 0,
    Mindfulness: 0,
    Health: 0,
    Personal: 0,
  };

  focusSessions.forEach((s) => {
    if (categoryTotals[s.category] !== undefined) {
      categoryTotals[s.category] += s.durationMinutes;
    } else {
      categoryTotals.Mindfulness += s.durationMinutes;
    }
  });

  const activeCategories = (Object.keys(categoryTotals) as Category[])
    .map((cat) => ({
      category: cat,
      minutes: categoryTotals[cat],
      percent:
        totalMinutesAllTime > 0
          ? Math.round((categoryTotals[cat] / totalMinutesAllTime) * 100)
          : 0,
    }))
    .filter((c) => c.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const getCategoryColor = (cat: Category) => {
    switch (cat) {
      case 'Creative':
        return 'bg-[var(--clay-terracotta)] text-white';
      case 'Learning':
        return 'bg-[var(--matcha-leaf)] text-white';
      case 'Mindfulness':
        return 'bg-[var(--wild-plum)] text-white';
      case 'Engineering':
        return 'bg-[var(--ochre-seed)] text-white';
      case 'Health':
        return 'bg-[var(--river-mist)] text-white';
      default:
        return 'bg-[#7A7063] text-white';
    }
  };

  const getCategoryBadgeVariant = (cat: Category): 'terracotta' | 'sage' | 'amber' | 'indigo' | 'rose' => {
    switch (cat) {
      case 'Creative':
        return 'terracotta';
      case 'Learning':
        return 'sage';
      case 'Engineering':
        return 'amber';
      case 'Health':
        return 'indigo';
      case 'Mindfulness':
      default:
        return 'rose';
    }
  };

  // 7. Peak Flow Rhythm
  const timeBuckets = {
    Dawn: { minutes: 0, label: 'Dawn (5am – 11am)', icon: <Sunrise className="w-5 h-5 text-[var(--ochre-seed)]" />, desc: 'Your deepest flow awakens during quiet dawn and morning hours.' },
    Midday: { minutes: 0, label: 'Midday (11am – 4pm)', icon: <Sun className="w-5 h-5 text-[var(--clay-terracotta)]" />, desc: 'Your concentration peaks during energetic midday sessions.' },
    Evening: { minutes: 0, label: 'Evening (4pm – 9pm)', icon: <Sunset className="w-5 h-5 text-[var(--matcha-leaf)]" />, desc: 'You find restorative mindfulness during twilight reflection.' },
    Night: { minutes: 0, label: 'Night (9pm – 5am)', icon: <Moon className="w-5 h-5 text-[var(--river-mist)]" />, desc: 'You thrive in serene, distraction-free late night silence.' },
  };

  focusSessions.forEach((s) => {
    const h = new Date(s.timestamp).getHours();
    if (h >= 5 && h < 11) timeBuckets.Dawn.minutes += s.durationMinutes;
    else if (h >= 11 && h < 16) timeBuckets.Midday.minutes += s.durationMinutes;
    else if (h >= 16 && h < 21) timeBuckets.Evening.minutes += s.durationMinutes;
    else timeBuckets.Night.minutes += s.durationMinutes;
  });

  const sortedBuckets = (Object.keys(timeBuckets) as (keyof typeof timeBuckets)[]).sort(
    (a, b) => timeBuckets[b].minutes - timeBuckets[a].minutes
  );
  const peakBucketKey = sortedBuckets[0];
  const peakRhythm = timeBuckets[peakBucketKey];

  // 8. Consistency Champions (Top habits ranked by streak)
  const champions = [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0)).slice(0, 3);

  // 9. Reflections Journal
  const reflectionSessions = focusSessions
    .filter((s) => s.note && s.note.trim().length > 0)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  const isCleanSlate = habits.length === 0 && focusSessions.length === 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-soft-fade">
      {/* Title & Philosophy */}
      <div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#5C5347] dark:text-[var(--muted)] font-semibold mb-1">
          <span className="text-[var(--matcha-leaf)]">✦</span>
          <span>Mindful Insights • 集中 分析</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium leading-tight text-[var(--fg)]">
          Your Focus Garden<br />
          <em className="italic text-[var(--clay-terracotta)] font-serif">Observing natural rhythms without judgment.</em>
        </h1>
      </div>

      {/* Hero Summary Metrics */}
      <div className="bg-gradient-to-br from-[var(--surface-warm)] to-[#F5EDE0] dark:from-[var(--surface-warm)] dark:to-[#1B241E] border border-[var(--border)] rounded-2xl p-5 sm:p-6 text-center space-y-3 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)] border-b border-[var(--border-subtle)] pb-2.5">
          <span>Weekly Cultivation</span>
          <span>
            {focusSessions.length} sessions logged • {totalHoursAllTime}h all-time
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div>
            <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--accent)]">
              {thisWeekString}
            </div>
            <div className="font-mono text-[10px] uppercase text-[var(--muted)] font-bold mt-0.5">
              THIS WEEK
            </div>
            <div className="text-[10px] text-[var(--muted)] font-mono opacity-80 mt-0.5">
              {thisWeekSessions.length} session{thisWeekSessions.length === 1 ? '' : 's'}
            </div>
          </div>

          <div>
            <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--matcha-leaf)]">
              {consistencyPercent}%
            </div>
            <div className="font-mono text-[10px] uppercase text-[var(--muted)] font-bold mt-0.5">
              CONSISTENCY
            </div>
            <div className="text-[10px] text-[var(--muted)] font-mono opacity-80 mt-0.5">
              {last7DaysWithActivity} of 7 days active
            </div>
          </div>

          <div>
            <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--ochre-seed)]">
              {longestStreak}d
            </div>
            <div className="font-mono text-[10px] uppercase text-[var(--muted)] font-bold mt-0.5">
              LONGEST STREAK
            </div>
            <div className="text-[10px] text-[var(--muted)] font-mono opacity-80 mt-0.5">
              active rhythm
            </div>
          </div>
        </div>
      </div>

      {/* Starter Guide Card (Visible when user has zero data) */}
      {isCleanSlate && (
        <div className="bg-[var(--surface)] border-2 border-dashed border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--matcha-soft)] border border-[var(--matcha-border)] text-[var(--matcha-leaf)] flex items-center justify-center text-xl shrink-0">
              🌱
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-semibold text-[var(--fg)]">
                Your Garden Awaits Its First Seed
              </h3>
              <p className="text-xs text-[var(--muted)] font-serif italic">
                Real insights will bloom here as you practice and track.
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[var(--fg-soft)] leading-relaxed font-serif">
            As you log Pomodoro sessions and check off daily habits, this page will automatically analyze your weekly rhythm, category balance, peak focus hours, and reflection notes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="bg-[var(--surface-warm)] p-3 rounded-xl border border-[var(--border-subtle)] space-y-1">
              <div className="text-xs font-semibold text-[var(--fg)] flex items-center gap-1.5">
                <span>📈</span> Weekly Flow
              </div>
              <p className="text-[11px] text-[var(--muted)] leading-normal">
                Daily hours distribution from Mon to Sun with active highlights.
              </p>
            </div>

            <div className="bg-[var(--surface-warm)] p-3 rounded-xl border border-[var(--border-subtle)] space-y-1">
              <div className="text-xs font-semibold text-[var(--fg)] flex items-center gap-1.5">
                <span>⚖️</span> Category Harmony
              </div>
              <p className="text-[11px] text-[var(--muted)] leading-normal">
                Understand how you balance creative, learning, and mindfulness habits.
              </p>
            </div>

            <div className="bg-[var(--surface-warm)] p-3 rounded-xl border border-[var(--border-subtle)] space-y-1">
              <div className="text-xs font-semibold text-[var(--fg)] flex items-center gap-1.5">
                <span>🌅</span> Peak Rhythm
              </div>
              <p className="text-[11px] text-[var(--muted)] leading-normal">
                Discover whether you thrive in dawn, midday, or twilight hours.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <Button
              variant="pastelTerracotta"
              size="sm"
              onClick={onOpenAddModal}
              className="font-mono text-xs font-bold gap-1.5 !min-h-[34px]"
            >
              <span>🌱</span> Plant First Habit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScreen('focus')}
              className="font-mono text-xs !min-h-[34px] !text-[#383028] !border-[#CFC3B3] hover:!bg-black/5 dark:!text-slate-200 dark:!border-white/15"
            >
              <span>⏱</span> Start Sanctuary Focus
            </Button>
          </div>
        </div>
      )}

      {/* Weekly Growth Distribution (Dynamic Bar Chart) */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-[var(--fg)]">
              Weekly Flow Rhythm
            </h3>
            <p className="text-xs text-[var(--muted)] font-serif italic">
              Focus minutes logged each day this week
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-[var(--accent)]">
            Total: {thisWeekString}
          </span>
        </div>

        {/* Dynamic Bars Grid */}
        <div className="h-40 bg-[var(--surface-warm)] border border-[var(--border-subtle)] rounded-xl p-4 flex items-end justify-between gap-2 sm:gap-4 relative">
          {weekDaysData.map((item, idx) => {
            const heightPercent =
              item.minutes > 0
                ? Math.max(12, Math.round((item.minutes / maxDayMinutes) * 100))
                : 4;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1C1815] text-white text-[10px] font-mono px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md">
                  {item.fullName}: {item.minutes}m
                </div>

                {/* Stems bar */}
                <div
                  className={`w-full max-w-[28px] rounded-full transition-all duration-700 ease-out flex items-center justify-center ${
                    item.isToday
                      ? 'bg-[var(--accent)] shadow-md shadow-[var(--clay-glow)]'
                      : item.minutes > 0
                      ? 'bg-[var(--matcha-leaf)] text-white'
                      : 'bg-[var(--surface-pebble)] border border-[var(--border-subtle)]'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Day label */}
                <div className="flex flex-col items-center">
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      item.isToday ? 'text-[var(--accent)] font-black underline' : 'text-[var(--muted)]'
                    }`}
                  >
                    {item.day}
                  </span>
                  <span className="font-mono text-[9px] text-[var(--muted)] opacity-75">
                    {item.minutes > 0 ? `${item.minutes}m` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Harmony Breakdown */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-[var(--fg)] flex items-center gap-2">
              <span>Category Harmony</span>
              <span className="text-xs font-mono text-[var(--muted)] font-normal">
                ({activeCategories.length} disciplines)
              </span>
            </h3>
            <p className="text-xs text-[var(--muted)] font-serif italic">
              Balance of your mindful attention across practices
            </p>
          </div>
          <span className="font-mono text-xs text-[var(--muted)]">All-Time Distribution</span>
        </div>

        {activeCategories.length > 0 ? (
          <div className="space-y-3">
            {/* Proportional Segmented Meter */}
            <div className="h-3 w-full bg-[var(--surface-pebble)] rounded-full overflow-hidden flex border border-[var(--border-subtle)]">
              {activeCategories.map((item) => (
                <div
                  key={item.category}
                  title={`${item.category}: ${item.percent}% (${item.minutes}m)`}
                  className={`h-full transition-all duration-500 ${getCategoryColor(item.category)}`}
                  style={{ width: `${item.percent}%` }}
                />
              ))}
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {activeCategories.map((item) => {
                const hours = Math.floor(item.minutes / 60);
                const mins = item.minutes % 60;
                const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

                return (
                  <div
                    key={item.category}
                    className="bg-[var(--surface-warm)] border border-[var(--border-subtle)] p-3 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <Badge variant={getCategoryBadgeVariant(item.category)} className="!text-[10px] !py-0.5">
                        {item.category}
                      </Badge>
                      <div className="font-mono text-xs font-bold text-[var(--fg)] mt-1">
                        {timeStr}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[var(--muted)] shrink-0">
                      {item.percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-[var(--surface-warm)] rounded-xl border border-dashed border-[var(--border-subtle)] space-y-1">
            <p className="text-xs text-[var(--fg)] font-medium">No category data yet</p>
            <p className="text-[11px] text-[var(--muted)] font-serif italic">
              Log focus sessions under different habit categories to view your balance.
            </p>
          </div>
        )}
      </div>

      {/* Peak Flow Rhythm Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-[var(--fg)]">
            Biological Flow Rhythm
          </h3>
          <span className="font-mono text-xs text-[var(--muted)]">Focus Windows</span>
        </div>

        <div className="bg-[var(--surface-warm)] border border-[var(--border-subtle)] rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-sm">
            {peakRhythm.icon}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                {peakRhythm.label}
              </span>
              {peakRhythm.minutes > 0 && (
                <Badge variant="sage" className="!text-[9px] !py-0">
                  {peakRhythm.minutes}m Flow
                </Badge>
              )}
            </div>
            <p className="text-xs text-[var(--fg-soft)] font-serif leading-relaxed">
              {peakRhythm.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Consistency Champions */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-lg font-semibold text-[var(--fg)]">
            Consistency Champions
          </h3>
          <span className="font-mono text-xs text-[var(--muted)]">Active Habits</span>
        </div>

        {champions.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {champions.map((habit, index) => (
              <div
                key={habit.id}
                onClick={() => setScreen('library')}
                className="bg-[var(--surface-warm)] border border-[var(--border-subtle)] p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-[var(--muted)] shrink-0">
                    #{index + 1}
                  </span>
                  <span className="text-xl shrink-0">{habit.icon}</span>
                  <div className="min-w-0">
                    <span className="font-medium text-xs sm:text-sm text-[var(--fg)] truncate block">
                      {habit.title}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      {habit.category} • {habit.targetValue} {habit.unit}/day
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`font-mono text-xs font-bold px-3 py-1 rounded-full border ${
                      habit.streak > 0
                        ? 'text-[var(--ochre-seed)] bg-[var(--ochre-soft)] border-[var(--ochre-border)]'
                        : 'text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]'
                    }`}
                  >
                    {habit.streak > 0 ? `🔥 ${habit.streak}d streak` : '0d (Ready)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-[var(--surface-warm)] rounded-xl border border-dashed border-[var(--border-subtle)] space-y-2">
            <p className="text-xs text-[var(--fg)] font-medium">No habits planted yet</p>
            <p className="text-[11px] text-[var(--muted)] font-serif italic">
              Plant daily habits to build streaks and crown your consistency champions.
            </p>
            <Button
              variant="pastelTerracotta"
              size="sm"
              onClick={onOpenAddModal}
              className="font-mono text-xs font-bold !min-h-[32px] mt-1"
            >
              + Plant a Habit
            </Button>
          </div>
        )}
      </div>

      {/* Mindful Reflections Journal Feed */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-lg font-semibold text-[var(--fg)] flex items-center gap-2">
            <span>Mindful Reflections Journal</span>
            <span className="font-mono text-xs text-[var(--muted)] font-normal">
              ({reflectionSessions.length})
            </span>
          </h3>
          <span className="font-mono text-xs text-[var(--muted)]">Post-Flow Archive</span>
        </div>

        {reflectionSessions.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {reflectionSessions.map((session) => (
              <div
                key={session.id}
                className="bg-[var(--surface-warm)] border border-[var(--border-subtle)] p-4 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[var(--accent)]">
                      {session.habitTitle}
                    </span>
                    <Badge variant={getCategoryBadgeVariant(session.category)} className="!text-[9px] !py-0">
                      {session.durationMinutes}m flow
                    </Badge>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--muted)]">
                    {new Date(session.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--fg)] italic font-serif leading-relaxed border-l-2 border-[var(--clay-terracotta)] pl-3">
                  "{session.note}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-[var(--surface-warm)] rounded-xl border border-dashed border-[var(--border-subtle)] space-y-1">
            <p className="text-xs text-[var(--fg)] font-medium">No reflections recorded yet</p>
            <p className="text-[11px] text-[var(--muted)] font-serif italic max-w-sm mx-auto">
              Whenever you complete a session in the Focus Sanctuary, write down a gentle reflection. Your thoughts will be preserved here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
