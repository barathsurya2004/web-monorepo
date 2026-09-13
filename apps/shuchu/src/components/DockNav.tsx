import React from 'react';
import { useApp } from '@/context/AppContext';
import { ActiveScreen } from '@/types';
import { Sun, Layers, Timer, CalendarDays, Sparkles } from 'lucide-react';

export const DockNav: React.FC = () => {
  const { activeScreen, setScreen } = useApp();

  const handleNav = (screen: ActiveScreen) => {
    if (activeScreen === screen) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } else {
      setScreen(screen);
    }
  };

  return (
    <nav className="fixed bottom-[max(env(safe-area-inset-bottom,0px),0.75rem)] left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-[390px] bg-[var(--surface-floating)] backdrop-blur-2xl border border-[var(--border)] rounded-full px-2 py-1.5 flex items-center justify-between shadow-2xl shadow-stone-900/15 z-50 select-none md:hidden">
      {/* Today */}
      <button
        onClick={() => handleNav('today')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-full min-h-[44px] transition-all cursor-pointer ${
          activeScreen === 'today' || activeScreen === 'empty-today'
            ? 'text-[var(--accent)] bg-[var(--accent-soft)] font-bold'
            : 'text-[var(--muted)] hover:text-[var(--fg)]'
        }`}
      >
        <Sun className="w-4 h-4" />
        <span className="text-[10px] tracking-wide font-medium leading-none">Today</span>
      </button>

      {/* Habits Library */}
      <button
        onClick={() => handleNav('library')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-full min-h-[44px] transition-all cursor-pointer ${
          activeScreen === 'library' || activeScreen === 'detail'
            ? 'text-[var(--accent)] bg-[var(--accent-soft)] font-bold'
            : 'text-[var(--muted)] hover:text-[var(--fg)]'
        }`}
      >
        <Layers className="w-4 h-4" />
        <span className="text-[10px] tracking-wide font-medium leading-none">Habits</span>
      </button>

      {/* Floating Center Focus Pulse */}
      <button
        onClick={() => handleNav('focus')}
        title="Start Pomodoro Sanctuary"
        className="w-12 h-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--clay-glow)] transition-transform hover:scale-105 active:scale-95 cursor-pointer mx-1 shrink-0 -my-2.5"
      >
        <Timer className="w-5 h-5 text-white" />
      </button>

      {/* Consistency Calendar */}
      <button
        onClick={() => handleNav('calendar')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-full min-h-[44px] transition-all cursor-pointer ${
          activeScreen === 'calendar'
            ? 'text-[var(--accent)] bg-[var(--accent-soft)] font-bold'
            : 'text-[var(--muted)] hover:text-[var(--fg)]'
        }`}
      >
        <CalendarDays className="w-4 h-4" />
        <span className="text-[10px] tracking-wide font-medium leading-none">Calendar</span>
      </button>

      {/* Mindful Insights */}
      <button
        onClick={() => handleNav('analytics')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-full min-h-[44px] transition-all cursor-pointer ${
          activeScreen === 'analytics' || activeScreen === 'challenge' || activeScreen === 'challenge-detail'
            ? 'text-[var(--accent)] bg-[var(--accent-soft)] font-bold'
            : 'text-[var(--muted)] hover:text-[var(--fg)]'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-[10px] tracking-wide font-medium leading-none">Insights</span>
      </button>
    </nav>
  );
};
