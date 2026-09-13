import React from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@packages/ui';
import { Plus, Sun, Moon, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal }) => {
  const {
    activeScreen,
    setScreen,
    theme,
    toggleTheme,
    isTimerRunning,
    timerRemainingSeconds,
    timerMode,
    activeHabit,
  } = useApp();

  const formatTimer = () => {
    const m = Math.floor(timerRemainingSeconds / 60);
    const s = timerRemainingSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const desktopNav = [
    { id: 'today', label: 'Today' },
    { id: 'library', label: 'Habits' },
    { id: 'focus', label: 'Focus Sanctuary' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'analytics', label: 'Insights' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface-floating)] backdrop-blur-xl border-b border-[var(--border)] px-4 sm:px-6 pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-3 flex items-center justify-between gap-3 select-none transition-colors duration-300">
      {/* Brand logo & title */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => {
            if (activeScreen === 'today') {
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            } else {
              setScreen('today');
            }
          }}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--clay-terracotta)] flex items-center justify-center text-white text-base shadow-sm shadow-[var(--clay-glow)] transition-transform group-hover:scale-105">
            ✦
          </div>
          <span className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[var(--fg)]">
            Shuchu <em className="not-italic font-normal opacity-70 text-base sm:text-lg">集中</em>
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 font-medium text-xs">
          {desktopNav.map((item) => {
            const isActive = activeScreen === item.id || (item.id === 'library' && activeScreen === 'detail');
            return (
              <Button
                key={item.id}
                size="sm"
                variant={isActive ? 'pastelTerracotta' : 'ghost'}
                onClick={() => {
                  if (isActive) {
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                  } else {
                    setScreen(item.id as any);
                  }
                }}
                className={`!min-h-[32px] !py-1 !px-3 text-xs font-semibold ${
                  isActive ? '' : '!text-[#5C5347] hover:!text-[#1F1B17] dark:!text-slate-400 dark:hover:!text-white'
                }`}
              >
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Center Active Flow Status Pill (Visible if timer is running and not currently on focus screen) */}
      {isTimerRunning && activeScreen !== 'focus' && (
        <button
          onClick={() => setScreen('focus')}
          className="bg-[#181513] text-white px-3 py-1 rounded-full text-xs font-mono flex items-center gap-2 shadow-md hover:scale-105 transition-transform cursor-pointer border border-white/10"
        >
          <div
            className={`w-2 h-2 rounded-full animate-island-pulse ${
              timerMode === 'focus' ? 'bg-[var(--clay-terracotta)]' : 'bg-[var(--matcha-leaf)]'
            }`}
          />
          <span className="font-bold">{formatTimer()}</span>
          <span className="text-[10px] opacity-75 truncate max-w-[80px] hidden sm:inline">
            {timerMode === 'focus' ? activeHabit?.title : 'Break'}
          </span>
        </button>
      )}

      {/* Right Tools */}
      <div className="flex items-center gap-2">
        {/* Add Habit Button */}
        <Button
          variant="pastelTerracotta"
          size="sm"
          onClick={onOpenAddModal}
          className="gap-1.5 shadow-sm hover:scale-[1.02] text-xs font-bold font-mono !min-h-[36px] px-3.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Plant Habit</span>
          <span className="sm:hidden">New</span>
        </Button>

        {/* Theme Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          title={theme === 'dawn' ? 'Switch to Moss (Dark)' : 'Switch to Dawn (Light)'}
          className="!w-9 !h-9 !p-0 !min-h-0 text-[var(--fg)] shrink-0 !border-[#CFC3B3] dark:!border-white/15 hover:!bg-black/5"
        >
          {theme === 'dawn' ? (
            <Sun className="w-4 h-4 text-[var(--ochre-seed)]" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--matcha-leaf)]" />
          )}
        </Button>

        {/* Settings Button */}
        <Button
          variant={activeScreen === 'settings' ? 'pastelTerracotta' : 'outline'}
          size="sm"
          onClick={() => setScreen('settings')}
          title="Preferences & Craft"
          className={`!w-9 !h-9 !p-0 !min-h-0 shrink-0 ${
            activeScreen === 'settings'
              ? ''
              : '!text-[#383028] dark:!text-slate-200 !border-[#CFC3B3] dark:!border-white/15 hover:!bg-black/5'
          }`}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
