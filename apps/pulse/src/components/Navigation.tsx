import React from 'react';
import { useStore } from '@/store';
import {
  LayoutDashboard,
  CalendarDays,
  Dumbbell,
  LineChart,
  History,
  Timer,
  Settings as SettingsIcon,
  Flame,
  ChevronDown,
} from 'lucide-react';
import { haptic } from '@/lib/feedback';

export const Navigation: React.FC = () => {
  const { screen, navigate, active } = useStore();

  const navItems = [
    { name: 'home' as const, label: 'Today', icon: LayoutDashboard },
    { name: 'planner' as const, label: 'Planner', icon: CalendarDays },
    { name: 'routines' as const, label: 'Routines', icon: Dumbbell },
    { name: 'analytics' as const, label: 'Analytics', icon: LineChart },
    { name: 'history' as const, label: 'History', icon: History },
  ];

  const currentTab = screen.name;

  return (
    <>
      {/* Top App Header with iOS / Android Status Bar clearance - Opaque solid velvet to prevent status bar blur & compositing artifacts on iOS PWAs */}
      <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden border-b border-white/[0.08] bg-ink-950 shadow-[0_4px_24px_rgba(0,0,0,0.5)] pt-[max(calc(env(safe-area-inset-top,0px)+0.75rem),3.25rem)] pb-2.5 sm:pt-4 sm:pb-3 transition-all">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3 sm:px-6 gap-2 min-w-0">
          {/* Brand Logo & Name */}
          <div
            onClick={() => {
              haptic.tap();
              navigate({ name: 'home' });
            }}
            className="flex cursor-pointer items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-80 shrink-0 select-none"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-mint to-lav shadow-md shadow-mint/20 shrink-0">
              <Flame size={18} className="text-ink-950 sm:size-5" />
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-display text-base sm:text-lg font-black tracking-wider text-fg leading-none">
                PULSE
              </span>
              <span className="rounded-full border border-mint/30 bg-mint/10 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-mint font-mono whitespace-nowrap leading-tight">
                PRO
              </span>
            </div>
          </div>

          {/* Right Action Icons & Active Resume Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink min-w-0 justify-end">
            {/* Live session pill if active and not on workout screen */}
            {active && currentTab !== 'workout' && (
              <button
                onClick={() => {
                  haptic.click();
                  navigate({ name: 'workout' });
                }}
                className="flex items-center gap-1.5 rounded-full border border-mint/40 bg-mint/15 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold text-mint shadow-md shadow-mint/15 transition-all hover:scale-105 active:scale-95 shrink min-w-0"
                title={`Resume ${active.name}`}
              >
                <span className="h-2 w-2 rounded-full bg-mint shrink-0 animate-pulse" />
                <span className="truncate max-w-[85px] xs:max-w-[130px] sm:max-w-[200px] md:max-w-xs whitespace-nowrap">
                  Resume: {active.name}
                </span>
              </button>
            )}

            {/* Minimize button if on workout screen */}
            {currentTab === 'workout' && (
              <button
                onClick={() => {
                  haptic.tap();
                  navigate({ name: 'home' });
                }}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold text-slate-300 hover:text-fg hover:bg-white/10 transition-all active:scale-95 shrink-0"
                title="Minimize workout and browse app"
              >
                <ChevronDown size={14} className="text-mint" />
                <span className="hidden xs:inline">Minimize</span>
              </button>
            )}

            {/* Standalone timer modal trigger */}
            <button
              onClick={() => {
                haptic.tap();
                navigate({ name: 'timer' });
              }}
              aria-label="Interval and Rest Timer"
              className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-fg shrink-0 ${
                currentTab === 'timer' ? 'bg-white/10 text-fg' : ''
              }`}
              title="Interval & Rest Timer"
            >
              <Timer size={18} className="sm:size-5" />
            </button>

            {/* Settings button */}
            <button
              onClick={() => {
                haptic.tap();
                navigate({ name: 'settings' });
              }}
              aria-label="Settings"
              className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-fg shrink-0 ${
                currentTab === 'settings' ? 'bg-white/10 text-fg' : ''
              }`}
              title="Settings"
            >
              <SettingsIcon size={18} className="sm:size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Floating Navigation Dock */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-40 glass-dock px-2 pt-2 pb-[max(calc(env(safe-area-inset-bottom,0px)+0.25rem),0.875rem)] select-none"
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-1 sm:px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.name;

            return (
              <button
                key={item.name}
                onClick={() => {
                  haptic.tap();
                  navigate({ name: item.name });
                }}
                className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-2xl transition-all duration-200 cursor-pointer active:scale-90 ${
                  isActive ? 'text-peach font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-peach/20 text-peach scale-110 shadow-[0_0_12px_rgba(251,216,179,0.25)]'
                      : ''
                  }`}
                >
                  <Icon size={19} className="transition-transform duration-200" />
                </div>
                <span className="text-[10px] tracking-tight font-medium font-mono whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
