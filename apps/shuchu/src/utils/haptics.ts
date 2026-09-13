/**
 * Haptic Tactile Feedback Engine for Mobile Devices
 * Gracefully degrades on desktop / unsupported environments.
 */

let isHapticsEnabled = localStorage.getItem('shuchu_haptics') !== 'false';

export const setHapticsEnabled = (enabled: boolean) => {
  isHapticsEnabled = enabled;
  localStorage.setItem('shuchu_haptics', enabled ? 'true' : 'false');
};

export const getHapticsEnabled = (): boolean => {
  return isHapticsEnabled;
};

export const hapticLight = () => {
  if (!isHapticsEnabled) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      // Ignore
    }
  }
};

export const hapticSuccess = () => {
  if (!isHapticsEnabled) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([35, 45, 60]);
    } catch {
      // Ignore
    }
  }
};

export const hapticNotice = () => {
  if (!isHapticsEnabled) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([25, 40, 25]);
    } catch {
      // Ignore
    }
  }
};
