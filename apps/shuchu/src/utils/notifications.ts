/**
 * Web Notifications & Tab Title Presence Engine
 * Keeps user informed even when tab is backgrounded or phone screen locked.
 */

export const getNotificationSupport = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!getNotificationSupport()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!getNotificationSupport()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch {
    return false;
  }
};

export const sendFocusCompleteNotification = (habitTitle: string, breakMinutes: number) => {
  if (!getNotificationSupport() || Notification.permission !== 'granted') return;
  try {
    new Notification('Focus Session Complete! 🌸', {
      body: `Great work on "${habitTitle}". Time for a ${breakMinutes}-minute restorative pause.`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌸</text></svg>',
      tag: 'shuchu-session-complete',
    });
  } catch {
    // Ignore notification error
  }
};

export const sendBreakCompleteNotification = (nextCycle: number) => {
  if (!getNotificationSupport() || Notification.permission !== 'granted') return;
  try {
    new Notification('Restorative Break Concluded 🍃', {
      body: `Ready for Pomodoro ${nextCycle} of 4? Return to your flow whenever you are ready.`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍃</text></svg>',
      tag: 'shuchu-break-complete',
    });
  } catch {
    // Ignore
  }
};

export const updateDocumentTitle = (
  timeStr: string,
  mode: 'focus' | 'shortBreak' | 'longBreak',
  habitTitle?: string,
  isRunning?: boolean
) => {
  if (typeof document === 'undefined') return;
  if (!isRunning) {
    document.title = 'Shuchu 集中 — Mindful Habit & Focus Companion';
    return;
  }
  const icon = mode === 'focus' ? '🎯' : '🍃';
  const label = mode === 'focus' ? (habitTitle || 'Focus') : 'Mindful Break';
  document.title = `(${timeStr}) ${icon} ${label} • Shuchu`;
};
