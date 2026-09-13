import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Badge, Button } from '@packages/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HabitIcon } from '@/components/HabitIcon';
import { FocusSession } from '@/types';

export const ConsistencyCalendar: React.FC = () => {
  const { focusSessions, habits } = useApp();
  const [viewDate, setViewDate] = useState<Date>(() => new Date());

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthLabel = useMemo(() => {
    return viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [viewDate]);

  // Navigate months
  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Calendar days computation
  const { offsetDays, daysInMonth } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { offsetDays: offset, daysInMonth: totalDays };
  }, [year, month]);

  // Map each day to user focus sessions
  const daysData = useMemo(() => {
    const result = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const sessions = focusSessions.filter((s) => s.timestamp.startsWith(dateStr));
      const focusMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      let level = 0;
      if (focusMinutes > 90) level = 4;
      else if (focusMinutes > 50) level = 3;
      else if (focusMinutes > 25) level = 2;
      else if (focusMinutes > 0) level = 1;

      result.push({
        day,
        dateStr,
        level,
        focusMinutes,
        sessions,
        isToday: dateStr === todayStr,
      });
    }
    return result;
  }, [year, month, daysInMonth, focusSessions, todayStr]);

  // Selected Day Details
  const selectedDayInfo = useMemo(() => {
    const match = daysData.find((d) => d.dateStr === selectedDateStr);
    if (match) return match;

    // Fallback if selected date is in another month
    const parts = selectedDateStr.split('-');
    const parsedDate = new Date(selectedDateStr + 'T12:00:00');
    const dayNum = parseInt(parts[2], 10) || 1;
    const sessions = focusSessions.filter((s) => s.timestamp.startsWith(selectedDateStr));
    const focusMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    return {
      day: dayNum,
      dateStr: selectedDateStr,
      level: 0,
      focusMinutes,
      sessions,
      isToday: selectedDateStr === todayStr,
      formattedDate: parsedDate.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  }, [daysData, selectedDateStr, focusSessions, todayStr]);

  const selectedFormattedDate = useMemo(() => {
    const parsedDate = new Date(selectedDateStr + 'T12:00:00');
    return isNaN(parsedDate.getTime())
      ? selectedDateStr
      : parsedDate.toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
  }, [selectedDateStr]);

  const getLevelClasses = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#E4EFE8] border-[#C3DFC9] text-[#265B37] font-semibold';
      case 2:
        return 'bg-[#C4DFC9] border-[#9ECBA7] text-[#1E4C2C] font-semibold';
      case 3:
        return 'bg-[#88BD96] border-[#65A776] text-white font-bold shadow-sm shadow-[#88BD96]/30';
      case 4:
        return 'bg-[#2A6642] border-[#1E4D31] text-white font-bold shadow-md shadow-[#2A6642]/30';
      default:
        return 'bg-[var(--surface-pebble)] border-[var(--border-subtle)] text-[#706659] dark:text-[var(--muted)]';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-soft-fade">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--fg)]">{monthLabel}</h2>
          <p className="text-xs text-[#5C5347] dark:text-[var(--muted)] font-serif italic">Consistency Garden Heatmap</p>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            title="Previous Month"
            className="!w-8 !h-8 !p-0 !min-h-0 text-sm font-bold !text-[#383028] !border-[#CFC3B3] hover:!bg-black/5 dark:!text-slate-200 dark:!border-white/15 flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            title="Next Month"
            className="!w-8 !h-8 !p-0 !min-h-0 text-sm font-bold !text-[#383028] !border-[#CFC3B3] hover:!bg-black/5 dark:!text-slate-200 dark:!border-white/15 flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 7-Day Clean Heatmap Grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center font-mono text-[11px] text-[var(--muted)] font-bold">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="py-0.5 sm:py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells before month begins */}
          {Array.from({ length: offsetDays }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square opacity-0 pointer-events-none" />
          ))}

          {/* Real Month Days */}
          {daysData.map((item) => (
            <button
              key={item.dateStr}
              onClick={() => setSelectedDateStr(item.dateStr)}
              className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-mono transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 relative ${getLevelClasses(
                item.level
              )} ${
                selectedDateStr === item.dateStr
                  ? 'ring-2 ring-[var(--accent)] ring-offset-2 !opacity-100 scale-105 z-10'
                  : ''
              } ${item.isToday ? 'border-2 !border-[var(--accent)]' : ''}`}
            >
              <span>{item.day}</span>
              {item.isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] absolute bottom-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-[var(--muted)]">
        <span>Less flow</span>
        <div className="w-3.5 h-3.5 rounded-[4px] bg-[var(--surface-pebble)] border border-[var(--border-subtle)]" />
        <div className="w-3.5 h-3.5 rounded-[4px] bg-[#E4EFE8] border border-[#C3DFC9]" />
        <div className="w-3.5 h-3.5 rounded-[4px] bg-[#C4DFC9] border border-[#9ECBA7]" />
        <div className="w-3.5 h-3.5 rounded-[4px] bg-[#88BD96] border border-[#65A776]" />
        <div className="w-3.5 h-3.5 rounded-[4px] bg-[#2A6642] border border-[#1E4D31]" />
        <span>Deep flow</span>
      </div>

      {/* Selected Day Inspection Drawer */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-display text-lg font-semibold text-[var(--fg)]">
              {selectedFormattedDate} {selectedDayInfo.isToday ? '(Today)' : ''}
            </h3>
            <p className="text-xs text-[#5C5347] dark:text-[var(--muted)] font-mono font-medium">
              Total Flow Logged: {Math.floor(selectedDayInfo.focusMinutes / 60)}h{' '}
              {selectedDayInfo.focusMinutes % 60}m
            </p>
          </div>
          <Badge variant="sage">
            {selectedDayInfo.sessions.length} {selectedDayInfo.sessions.length === 1 ? 'session' : 'sessions'}
          </Badge>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-3 space-y-2 text-xs">
          {selectedDayInfo.sessions.length > 0 ? (
            selectedDayInfo.sessions.map((sess: FocusSession) => {
              const matchedHabit = habits.find((h) => h.id === sess.habitId);
              const timeStr = new Date(sess.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sess.id}
                  className="flex flex-col gap-1 p-2.5 rounded-xl bg-[var(--surface-warm)] border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[var(--fg)] font-semibold">
                      <HabitIcon icon={matchedHabit?.icon || 'timer'} className="w-4 h-4 text-current shrink-0" />
                      <span>{sess.habitTitle}</span>
                    </span>
                    <span className="font-mono text-[11px] text-[var(--matcha-leaf)] font-bold">
                      {sess.durationMinutes} min • {timeStr}
                    </span>
                  </div>
                  {sess.note && (
                    <p className="text-[11px] text-[var(--muted)] italic font-serif pl-6">
                      "{sess.note}"
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-3 text-[var(--muted)] font-serif italic">
              Restful pause day recorded in the garden.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
