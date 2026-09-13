import React from 'react';
import { useApp } from '@/context/AppContext';
import { ActiveScreen } from '@/types';
import { Sun, Layers, Timer, CalendarDays, TrendingUp } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'today' as ActiveScreen, label: 'Today', icon: Sun, activeScreens: ['today', 'empty-today'] },
  { id: 'library' as ActiveScreen, label: 'Habits', icon: Layers, activeScreens: ['library', 'detail'] },
];

const RIGHT_ITEMS = [
  { id: 'calendar' as ActiveScreen, label: 'Calendar', icon: CalendarDays, activeScreens: ['calendar'] },
  { id: 'analytics' as ActiveScreen, label: 'Insights', icon: TrendingUp, activeScreens: ['analytics', 'challenge', 'challenge-detail'] },
];

export const DockNav: React.FC = () => {
  const { activeScreen, setScreen, isTimerRunning, timerRemainingSeconds, timerMode } = useApp();

  const handleNav = (screen: ActiveScreen) => {
    if (activeScreen === screen) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } else {
      setScreen(screen);
    }
  };

  const formatTimer = () => {
    const m = Math.floor(timerRemainingSeconds / 60);
    const s = timerRemainingSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isFocusActive = activeScreen === 'focus' || activeScreen === 'focus-setup' || activeScreen === 'focus-complete';

  const handleFocusNav = () => {
    if (isTimerRunning) {
      // Go directly to the running session
      setScreen('focus');
    } else {
      // Go to setup when nothing is running
      setScreen('focus-setup');
    }
  };

  const NavButton: React.FC<{ item: typeof NAV_ITEMS[0] }> = ({ item }) => {
    const isActive = item.activeScreens.includes(activeScreen);
    const Icon = item.icon;
    return (
      <button
        onClick={() => handleNav(item.id)}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl min-h-[52px] transition-all duration-200 cursor-pointer relative ${
          isActive
            ? 'text-[var(--accent)]'
            : 'text-[var(--muted)] hover:text-[var(--fg)]'
        }`}
      >
        {/* Active indicator dot */}
        {isActive && (
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
        )}
        <Icon className={`w-[18px] h-[18px] transition-transform ${isActive ? 'scale-110' : ''}`} />
        <span className={`text-[9px] tracking-wide leading-none font-medium transition-all ${isActive ? 'font-bold' : ''}`}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-[max(env(safe-area-inset-bottom,0px),0.5rem)] left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-[400px] bg-[var(--surface-floating)] backdrop-blur-2xl border border-[var(--border)] rounded-3xl px-2 py-1 flex items-center justify-between shadow-2xl shadow-stone-900/20 z-50 select-none md:hidden">
      {/* Left items */}
      {NAV_ITEMS.map((item) => (
        <NavButton key={item.id} item={item} />
      ))}

      {/* Center Focus Button — elevated */}
      <button
        onClick={handleFocusNav}
        title="Focus Sanctuary"
        className={`relative w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-200 cursor-pointer mx-1 shrink-0 -my-3 gap-0.5 ${
          isFocusActive
            ? 'bg-[var(--fg)] text-[var(--bg)] scale-105'
            : 'bg-[var(--accent)] text-white hover:scale-105 active:scale-95 animate-pulse-ring'
        }`}
      >
        {isTimerRunning && !isFocusActive ? (
          <>
            {/* Live timer indicator */}
            <div className={`w-1.5 h-1.5 rounded-full mb-0.5 animate-island-pulse ${
              timerMode === 'focus' ? 'bg-white' : 'bg-[var(--matcha-soft)]'
            }`} />
            <span className="text-[10px] font-mono font-black leading-none">{formatTimer()}</span>
          </>
        ) : (
          <>
            <Timer className="w-5 h-5" />
            <span className="text-[8px] font-mono font-bold leading-none opacity-80">FOCUS</span>
          </>
        )}
      </button>

      {/* Right items */}
      {RIGHT_ITEMS.map((item) => (
        <NavButton key={item.id} item={item} />
      ))}
    </nav>
  );
};
