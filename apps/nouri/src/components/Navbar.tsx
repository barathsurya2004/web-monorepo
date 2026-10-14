import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles,
  Utensils,
  User as UserIcon,
  LogOut,
  Users,
  Flame,
  ChevronDown,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  onOpenGoals: () => void;
  activeTab: 'diary' | 'recipes';
  onTabChange: (tab: 'diary' | 'recipes') => void;
  user: User;
  onOpenAuth: (tab?: 'login' | 'signup' | 'switch') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  onDateChange,
  onOpenGoals,
  activeTab,
  onTabChange,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const isToday = currentDate === new Date().toISOString().split('T')[0];

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (isToday) return 'Today';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const isGuest = user.uuid.startsWith('guest-');

  return (
    <header className="sticky top-0 z-40 bg-ink-900/95 backdrop-blur-xl border-b border-white/5 px-3 py-2.5 sm:px-4 sm:py-3 w-full">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        {/* Top Row on mobile: Brand + Date & Settings & Profile */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-mint/20 to-lav/30 border border-mint/40 flex items-center justify-center shadow-lg shadow-mint/10 shrink-0">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-mint" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base sm:text-lg tracking-tight text-fg">Nouri</span>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-mint/10 border border-mint/20 text-mint font-semibold">
                AI Vision
              </span>
            </div>
          </div>

          {/* Date Selector & Actions (Mobile View) */}
          <div className="flex sm:hidden items-center gap-1">
            <div className="flex items-center bg-ink-800/80 border border-white/5 rounded-xl px-1 py-0.5">
              <button
                onClick={handlePrevDay}
                className="p-1 rounded-lg text-muted hover:text-fg hover:bg-white/5 transition-colors"
                title="Previous day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-semibold px-1 text-fg min-w-[56px] text-center font-mono">
                {formatDisplayDate(currentDate)}
              </span>
              <button
                onClick={handleNextDay}
                className="p-1 rounded-lg text-muted hover:text-fg hover:bg-white/5 transition-colors"
                title="Next day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onOpenGoals}
              className="p-1.5 rounded-xl bg-ink-800/80 border border-white/5 text-muted hover:text-peach hover:bg-peach/10 transition-colors"
              title="Configure Daily Goals"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Mobile User Profile Avatar */}
            <button
              onClick={() => onOpenAuth('switch')}
              className="p-1 rounded-xl bg-ink-800/80 border border-white/5 hover:border-mint/30 transition-all flex items-center justify-center"
              title="User Profile & Accounts"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-5 h-5 rounded-lg object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-lg bg-mint/20 text-mint text-[10px] font-bold flex items-center justify-center">
                  {user.name[0] || 'U'}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Tab switchers: Full-width segmented pill on mobile, centered on desktop */}
        <div className="flex items-center p-1 rounded-xl bg-ink-800/80 border border-white/5 text-xs font-medium w-full sm:w-auto justify-center">
          <button
            onClick={() => onTabChange('diary')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'diary'
                ? 'bg-ink-700 text-fg shadow-sm font-semibold'
                : 'text-muted hover:text-fg'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Diary</span>
          </button>
          <button
            onClick={() => onTabChange('recipes')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'recipes'
                ? 'bg-lav/20 text-lav border border-lav/30 font-semibold'
                : 'text-muted hover:text-lav'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recipes</span>
          </button>
        </div>

        {/* Desktop Controls: Date Selector, Goals Trigger & Profile Dropdown */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Date Selector */}
          <div className="flex items-center bg-ink-800/80 border border-white/5 rounded-xl px-1.5 py-1">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded-lg text-muted hover:text-fg hover:bg-white/5 transition-colors"
              title="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-fg min-w-[70px] text-center font-mono">
              {formatDisplayDate(currentDate)}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1 rounded-lg text-muted hover:text-fg hover:bg-white/5 transition-colors"
              title="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Goals Trigger */}
          <button
            onClick={onOpenGoals}
            className="p-2 rounded-xl bg-ink-800/80 border border-white/5 text-muted hover:text-peach hover:bg-peach/10 transition-colors"
            title="Configure Daily Goals"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 py-1 px-2 rounded-xl bg-ink-800/80 border border-white/5 hover:border-mint/30 transition-all text-left"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-6 h-6 rounded-lg object-cover border border-white/10"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-mint/20 text-mint text-xs font-bold flex items-center justify-center">
                  {user.name[0] || 'U'}
                </div>
              )}
              <div className="flex flex-col pr-0.5">
                <span className="text-xs font-semibold text-fg leading-tight truncate max-w-[90px]">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-muted font-mono leading-tight">
                  {user.calorie_goal || 2250} kcal
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-muted" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-ink-850/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-ink-950/90 py-2 z-50 animate-fade-in">
                {/* Header info */}
                <div className="px-3.5 py-2.5 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-9 h-9 rounded-xl object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-mint/20 text-mint text-sm font-bold flex items-center justify-center">
                        {user.name[0] || 'U'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-fg truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-muted truncate font-mono">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between bg-ink-900/60 rounded-lg px-2.5 py-1.5 border border-white/5">
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <Flame className="w-3 h-3 text-peach" /> Calorie Goal
                    </span>
                    <span className="text-xs font-mono font-bold text-peach">
                      {user.calorie_goal || 2250} kcal
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenAuth('switch');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-fg hover:bg-white/5 rounded-xl transition-colors text-left"
                  >
                    <Users className="w-3.5 h-3.5 text-lav" />
                    <span>Switch User Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenAuth('login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-fg hover:bg-white/5 rounded-xl transition-colors text-left"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-mint" />
                    <span>Sign In to Another Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenGoals();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-fg hover:bg-white/5 rounded-xl transition-colors text-left"
                  >
                    <Sliders className="w-3.5 h-3.5 text-peach" />
                    <span>Adjust Macro Goals</span>
                  </button>

                  <div className="my-1 border-t border-white/5" />

                  {isGuest ? (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenAuth('signup');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-mint hover:bg-mint/10 rounded-xl transition-colors text-left font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create Free Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-coral hover:bg-coral/10 rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
