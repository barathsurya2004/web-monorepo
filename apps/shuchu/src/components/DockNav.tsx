import React from 'react';
import { useApp } from '@/context/AppContext';
import { ActiveScreen } from '@/types';

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
    <nav className="fixed bottom-[max(env(safe-area-inset-bottom,0px),1rem)] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[390px] bg-[var(--surface-floating)] backdrop-blur-2xl border border-[var(--border)] rounded-full px-3 py-2 flex items-center justify-between shadow-2xl shadow-stone-900/15 z-50 select-none md:hidden">
      {/* Today */}
      <button
        onClick={() => handleNav('today')}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
          activeScreen === 'today' || activeScreen === 'empty-today'
            ? 'text-[var(--accent)] bg-[var(--accent-soft)] font-bold'
            : 'text-[var(--muted)] hover:text-[var(--fg)]'
        }`}
      >
        <span className="text-base">🌿</span>
        <span className="text-[10px] tracking-wide font-medium">Today</span>
      </button>

      {/* Habits Library */}
      <button
        onClick={() => handleNav('library')}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
          activeScreen === 'library' || activeScreen === 'detail'
            ? 'text-[var(--accent)] bg-[var(--accent-soft)] font-bold'
            : 'text-[var(--muted)] hover:text-[var(--fg)]'
        }`}
      >
        <span className="text-base">📚</span>
        <span className="text-[10px] tracking-wide font-medium">Habits</span>
      </button>

      {/* Floating Center Focus Pulse */}
      <button
        onClick={() => handleNav('focus')}
        title="Start Pomodoro Sanctuary"
        className="w-12 h-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xl shadow-lg shadow-[var(--clay-glow)] transition-transform hover:scale-110 active:scale-95 cursor-pointer -my-3"
      >
        ⏱
      </button>

      {/* Consistency Calendar */}
      <button
        onClick={() => handleNav('calendar')}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
          activeScreen === 'calendar'
            ? 'text-[var(--accent)] bg-[var(--accent-soft)] font-bold'
            : 'text-[var(--muted)] hover:text-[var(--fg)]'
        }`}
      >
        <span className="text-base">🗓</span>
        <span className="text-[10px] tracking-wide font-medium">Calendar</span>
      </button>

      {/* Mindful Insights */}
      <button
        onClick={() => handleNav('analytics')}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
          activeScreen === 'analytics' || activeScreen === 'challenge' || activeScreen === 'challenge-detail'
            ? 'text-[var(--accent)] bg-[var(--accent-soft)] font-bold'
            : 'text-[var(--muted)] hover:text-[var(--fg)]'
        }`}
      >
        <span className="text-base">🌱</span>
        <span className="text-[10px] tracking-wide font-medium">Insights</span>
      </button>
    </nav>
  );
};
