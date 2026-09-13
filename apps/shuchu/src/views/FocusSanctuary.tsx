import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sparkles, RotateCcw, Coffee, Brain } from 'lucide-react';
import { Button } from '@packages/ui';
import { GuidedBreathingOrb } from '@/components/GuidedBreathingOrb';

export const FocusSanctuary: React.FC = () => {
  const {
    activeHabit,
    timerMode,
    timerDurationMinutes,
    timerRemainingSeconds,
    isTimerRunning,
    timerCycle,
    toggleTimer,
    resetTimer,
    addFiveMinutes,
    setTimerDuration,
    switchTimerMode,
    skipBreak,
    finishCurrentSession,
    setScreen,
    theme,
  } = useApp();

  const [sanctuaryMode, setSanctuaryMode] = useState<'stone' | 'hearth'>('stone');
  const [breakViewMode, setBreakViewMode] = useState<'orb' | 'timer'>('orb');

  const isBreakMode = timerMode === 'shortBreak' || timerMode === 'longBreak';

  // SVG Circle Progress calculations
  const totalSeconds = timerDurationMinutes * 60;
  const radius = 100;
  const circumference = 2 * Math.PI * radius; // ~628.3
  const progressRatio = totalSeconds > 0 ? (totalSeconds - timerRemainingSeconds) / totalSeconds : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const formatTimer = () => {
    const m = Math.floor(timerRemainingSeconds / 60);
    const s = timerRemainingSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine active visual theme
  const isHearthTheme = !isBreakMode && (sanctuaryMode === 'hearth' || theme === 'moss');

  return (
    <div
      className={`min-h-[640px] sm:min-h-[690px] rounded-3xl p-5 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl transition-all duration-300 select-none animate-soft-fade ${
        isBreakMode
          ? 'bg-gradient-to-br from-[#EEF5F1] via-[#E4EFE8] to-[#D5E6DC] dark:from-[#17241C] dark:via-[#131C16] dark:to-[#0E1510] text-[#1E3B29] dark:text-[#E2F0E7] border border-[#C6DFD0]/60 dark:border-[#2D4C38]/50'
          : isHearthTheme
          ? 'sanctuary-hearth-theme shadow-stone-950/40 text-white'
          : 'sanctuary-stone-theme shadow-stone-900/10 text-[#24201D]'
      }`}
      style={{
        background: isBreakMode
          ? undefined
          : isHearthTheme
          ? theme === 'moss'
            ? 'radial-gradient(circle at 50% 25%, #2D1813 0%, #1F100D 50%, #120907 100%)'
            : 'radial-gradient(circle at 50% 25%, #DE6D53 0%, #C45B43 45%, #9E402B 100%)'
          : 'linear-gradient(145deg, #FAF7F2 0%, #F3EDE2 50%, #EAE2D2 100%)',
      }}
    >
      {/* Ambient glow orb */}
      <div
        className={`absolute w-72 h-72 rounded-full top-16 left-1/2 -translate-x-1/2 blur-3xl pointer-events-none animate-ambient-breathe ${
          isBreakMode
            ? 'bg-[#537D63]/25'
            : isHearthTheme
            ? 'bg-white/20'
            : 'bg-[#C8634B]/15'
        }`}
      />

      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-2 relative z-20 flex-wrap">
        <Button
          variant={isHearthTheme ? 'outline' : 'secondary'}
          size="sm"
          onClick={() => setScreen('today')}
          className="!rounded-full text-xs font-semibold gap-1.5 !min-h-[38px] px-4"
        >
          <span>←</span>
          <span>Back to Today</span>
        </Button>

        {/* Mode Pill Toggle (Focus vs Rest Break) */}
        <div className="flex items-center gap-1 bg-black/10 dark:bg-white/10 p-1 rounded-2xl border border-black/10 dark:border-white/10 text-xs font-mono">
          <Button
            size="sm"
            variant={!isBreakMode ? (isHearthTheme ? 'apple' : 'pastelTerracotta') : 'ghost'}
            onClick={() => switchTimerMode('focus')}
            className="!min-h-[30px] !py-0.5 !px-3 font-bold text-xs gap-1"
          >
            <Brain className="w-3 h-3" />
            <span>Focus</span>
          </Button>
          <Button
            size="sm"
            variant={isBreakMode ? 'pastelSage' : 'ghost'}
            onClick={() => switchTimerMode('shortBreak')}
            className="!min-h-[30px] !py-0.5 !px-3 font-bold text-xs gap-1"
          >
            <Coffee className="w-3 h-3" />
            <span>Break</span>
          </Button>
        </div>

        {/* Top Right Action Button */}
        {!isBreakMode ? (
          <Button
            variant={isHearthTheme ? 'apple' : 'pastelTerracotta'}
            size="sm"
            onClick={() => finishCurrentSession(0)}
            className="!rounded-full text-xs font-bold gap-1.5 !min-h-[38px] px-4 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Finish Session</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={skipBreak}
            className="!rounded-full text-xs font-bold gap-1.5 !min-h-[38px] px-4 shadow-sm !text-[#383028] !border-[#CFC3B3] hover:!bg-black/5 dark:!text-slate-200 dark:!border-white/15"
          >
            <span>Skip Break ➔</span>
          </Button>
        )}
      </div>

      {/* Central Vessel: Focus vs Rest Break */}
      <div className="relative z-20 flex flex-col items-center text-center my-auto py-2">
        {/* Cycle & Status Kicker */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`font-mono text-xs uppercase tracking-widest font-bold ${
              isBreakMode
                ? 'text-[var(--matcha-leaf)] font-black'
                : isHearthTheme
                ? 'text-white/80 drop-shadow-sm'
                : 'text-[#5C5347] dark:text-[#A89F93]'
            }`}
          >
            {isBreakMode
              ? timerMode === 'longBreak'
                ? '☕ RESTORATIVE LONG BREAK'
                : '☕ REFRESHING SHORT BREAK'
              : activeHabit?.category
              ? `${activeHabit.category.toUpperCase()} PRACTICE`
              : 'DEEP FLOW'}
          </span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-bold">
            Pomodoro {timerCycle} of 4
          </span>
        </div>

        {/* Main Title */}
        <h2
          className={`font-display text-2xl sm:text-4xl font-semibold tracking-tight mb-4 ${
            isBreakMode
              ? 'text-[var(--matcha-leaf)] dark:text-[#A8E6CF]'
              : isHearthTheme
              ? 'text-white drop-shadow-md'
              : 'text-[#24201D]'
          }`}
        >
          {isBreakMode ? 'Mindful Rest & Renewal' : activeHabit?.title || 'Figure Drawing'}
        </h2>

        {/* Content Body: Guided Breathing Orb or Countdown Ring */}
        {isBreakMode && breakViewMode === 'orb' ? (
          <div className="my-2">
            <GuidedBreathingOrb />
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="font-mono text-sm font-bold opacity-80">
                Break remaining: {formatTimer()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBreakViewMode('timer')}
                className="!min-h-[28px] text-[11px] font-mono underline"
              >
                View Clock Ring
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Circular Countdown Ring */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center mb-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
                {/* Background Track */}
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  fill="none"
                  stroke={
                    isBreakMode
                      ? 'rgba(83, 125, 99, 0.2)'
                      : isHearthTheme
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(200, 99, 75, 0.15)'
                  }
                  strokeWidth="8"
                />
                {/* Glowing Progress Arc */}
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  fill="none"
                  stroke={
                    isBreakMode
                      ? '#537D63'
                      : isHearthTheme
                      ? '#FFFFFF'
                      : '#C8634B'
                  }
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                  style={{
                    filter: isBreakMode
                      ? 'drop-shadow(0 0 8px rgba(83, 125, 99, 0.45))'
                      : isHearthTheme
                      ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))'
                      : 'drop-shadow(0 0 8px rgba(200, 99, 75, 0.45))',
                  }}
                />
              </svg>

              {/* Inner Digital Clock */}
              <div className="absolute flex flex-col items-center">
                <span
                  className={`font-mono text-5xl sm:text-6xl font-black tracking-tight ${
                    isBreakMode
                      ? 'text-[var(--matcha-leaf)] dark:text-white'
                      : isHearthTheme
                      ? 'text-white drop-shadow-md'
                      : 'text-[#24201D]'
                  }`}
                >
                  {formatTimer()}
                </span>
                <span
                  className={`text-xs sm:text-sm font-serif italic mt-1 ${
                    isBreakMode
                      ? 'text-[var(--matcha-leaf)] opacity-80'
                      : isHearthTheme
                      ? 'text-white/85'
                      : 'text-[#82786D]'
                  }`}
                >
                  {isBreakMode ? 'Restorative Pause' : `Pomodoro ${timerCycle} of 4 • Deep Flow`}
                </span>
              </div>
            </div>

            {isBreakMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBreakViewMode('orb')}
                className="!min-h-[28px] text-[11px] font-mono underline -mt-2 mb-3"
              >
                Guided Breathing Orb 🍃
              </Button>
            )}
          </div>
        )}

        {/* Duration Presets Row */}
        <div
          className={`flex items-center gap-1.5 p-1.5 rounded-2xl mb-4 max-w-xs border ${
            isBreakMode
              ? 'bg-[#E4EFE8] dark:bg-[#1E2C24] border-[#C3DFC9] dark:border-[#2D4C38]'
              : isHearthTheme
              ? 'bg-black/25 border-white/20'
              : 'bg-[#EFE9DE] border-[#DDD5C7]'
          }`}
        >
          {(isBreakMode ? [3, 5, 10, 15] : [15, 25, 45, 60]).map((mins) => (
            <Button
              key={mins}
              size="sm"
              variant={
                timerDurationMinutes === mins
                  ? isBreakMode
                    ? 'pastelSage'
                    : isHearthTheme
                    ? 'apple'
                    : 'pastelTerracotta'
                  : 'ghost'
              }
              onClick={() => setTimerDuration(mins)}
              className="!min-h-[32px] !py-1 !px-3.5 text-xs font-mono font-bold"
            >
              {mins}m
            </Button>
          ))}
        </div>

      </div>

      {/* Tactile Controls reusing @packages/ui Button */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 relative z-20 pt-2">
        {/* Reset Button */}
        <Button
          variant={isHearthTheme ? 'outline' : 'secondary'}
          size="md"
          onClick={resetTimer}
          title="Restart Timer"
          className="!rounded-full !w-12 !h-12 !p-0 !min-h-[48px] !min-w-[48px] shadow-sm"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        {/* Primary Play / Pause Button */}
        <Button
          variant={
            isBreakMode
              ? 'pastelSage'
              : isHearthTheme
              ? 'apple'
              : 'pastelTerracotta'
          }
          size="lg"
          onClick={toggleTimer}
          className="!rounded-full px-8 sm:px-10 !min-h-[50px] shadow-xl font-mono text-sm tracking-wider uppercase gap-2"
        >
          <span className="text-base">{isTimerRunning ? '❚❚' : '▶'}</span>
          <span>
            {isTimerRunning
              ? isBreakMode
                ? 'Pause Rest'
                : 'Pause Flow'
              : isBreakMode
              ? 'Begin Rest'
              : 'Begin Focus'}
          </span>
        </Button>

        {/* +5 Min Button */}
        <Button
          variant={isHearthTheme ? 'outline' : 'secondary'}
          size="md"
          onClick={addFiveMinutes}
          title="Add 5 Minutes"
          className="!rounded-full !w-12 !h-12 !p-0 !min-h-[48px] !min-w-[48px] font-mono font-bold text-xs shadow-sm"
        >
          +5m
        </Button>
      </div>
    </div>
  );
};
