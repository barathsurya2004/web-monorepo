import React from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@packages/ui';

export const SettingsView: React.FC = () => {
  const {
    habits,
    focusSessions,
    timerDurationMinutes,
    setTimerDuration,
    shortBreakDurationMinutes,
    setShortBreakDuration,
    longBreakDurationMinutes,
    setLongBreakDuration,
    isNotificationsEnabled,
    requestNotifications,
    isHapticsEnabled,
    setHaptics,
    theme,
    toggleTheme,
    resetAllData,
  } = useApp();

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-soft-fade">
      {/* Title */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--fg)]">Preferences & Craft</h2>
        <p className="text-xs text-[var(--muted)] font-serif italic">Fine-tune your mindful sanctuary</p>
      </div>

      {/* Philosophy Card */}
      <div className="bg-[var(--surface-warm)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-2 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-[var(--fg)]">
          The Shuchu (集中) Philosophy
        </h3>
        <p className="text-xs sm:text-sm text-[var(--fg-soft)] font-serif italic leading-relaxed">
          Shuchu embodies clean simplicity, calm focus, and natural grace. We believe tracking habits should feel like tending a quiet space, not filling out a corporate spreadsheet. Every stone laid in focus builds your inner temple.
        </p>
      </div>

      {/* Settings Rows */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl divide-y divide-[var(--border-subtle)] shadow-sm overflow-hidden text-xs sm:text-sm">
        {/* Default Pomodoro Interval */}
        <div className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-[var(--fg)]">Default Focus Interval</div>
            <div className="text-xs text-[var(--muted)]">Session duration before break</div>
          </div>
          <div className="flex gap-1.5 font-mono text-xs">
            {[15, 25, 45, 60].map((mins) => (
              <Button
                key={mins}
                size="sm"
                variant={timerDurationMinutes === mins ? 'pastelTerracotta' : 'outline'}
                onClick={() => setTimerDuration(mins)}
                className="!min-h-[32px] !py-1 !px-3 font-mono text-xs"
              >
                {mins}m
              </Button>
            ))}
          </div>
        </div>

        {/* Short & Long Break Intervals */}
        <div className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-[var(--fg)]">Restorative Break Intervals</div>
            <div className="text-xs text-[var(--muted)]">Short pause (every session) & Long pause (every 4th)</div>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold">Short:</span>
              {[3, 5, 10].map((mins) => (
                <Button
                  key={mins}
                  size="sm"
                  variant={shortBreakDurationMinutes === mins ? 'pastelSage' : 'outline'}
                  onClick={() => setShortBreakDuration(mins)}
                  className="!min-h-[30px] !py-0.5 !px-2 text-xs font-mono"
                >
                  {mins}m
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold">Long:</span>
              {[15, 20, 30].map((mins) => (
                <Button
                  key={mins}
                  size="sm"
                  variant={longBreakDurationMinutes === mins ? 'pastelSage' : 'outline'}
                  onClick={() => setLongBreakDuration(mins)}
                  className="!min-h-[30px] !py-0.5 !px-2 text-xs font-mono"
                >
                  {mins}m
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Web Notifications */}
        <div className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-[var(--fg)]">Web Notifications</div>
            <div className="text-xs text-[var(--muted)]">Chime alert when session or break completes in background</div>
          </div>
          <Button
            variant={isNotificationsEnabled ? 'pastelSage' : 'outline'}
            size="sm"
            onClick={async () => {
              await requestNotifications();
            }}
            className="!min-h-[34px] px-3.5 font-mono text-xs font-bold"
          >
            {isNotificationsEnabled ? '✓ Enabled' : 'Enable Alerts 🔔'}
          </Button>
        </div>

        {/* Mobile Haptic Feedback */}
        <div className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-[var(--fg)]">Tactile Haptics</div>
            <div className="text-xs text-[var(--muted)]">Subtle vibration pulse on mobile buttons & timer chime</div>
          </div>
          <Button
            variant={isHapticsEnabled ? 'pastelTerracotta' : 'outline'}
            size="sm"
            onClick={() => setHaptics(!isHapticsEnabled)}
            className="!min-h-[34px] px-3.5 font-mono text-xs font-bold"
          >
            {isHapticsEnabled ? '📳 Haptics On' : 'Haptics Off'}
          </Button>
        </div>


        {/* Theme Appearance */}
        <div className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-[var(--fg)]">Visual Appearance</div>
            <div className="text-xs text-[var(--muted)]">Dawn Linen (Light) vs Moss Clay (Dark)</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="!min-h-[34px] px-3.5 font-mono text-xs font-bold !text-[#383028] !border-[#CFC3B3] hover:!bg-black/5 dark:!text-slate-200 dark:!border-white/15"
          >
            {theme === 'dawn' ? '☀️ Dawn Mode' : '🌙 Moss Mode'}
          </Button>
        </div>

        {/* Reset Data */}
        <div className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-[var(--fg)]">Clear All Local Data</div>
            <div className="text-xs text-[var(--muted)]">
              Permanently delete all {habits.length} habits and {focusSessions.length} logged focus sessions from local storage
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete all local data? This will reset your habits and focus session history to a fresh blank slate.')) {
                resetAllData();
              }
            }}
            className="font-mono text-xs !min-h-[34px] px-3.5"
          >
            🗑 Clear Data
          </Button>
        </div>
      </div>
    </div>
  );
};
