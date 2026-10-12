// Haptics + audio cues. Both are best-effort: navigator.vibrate is unsupported
// on iOS Safari, and AudioContext needs a prior user gesture.

let enabledHaptics = true;
let enabledSound = true;
let ctx: AudioContext | null = null;

export function configureFeedback(opts: { haptics: boolean; sound: boolean }) {
  enabledHaptics = opts.haptics;
  enabledSound = opts.sound;
}

function vibrate(pattern: number | number[]) {
  if (!enabledHaptics) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export const haptic = {
  tap: () => vibrate(8),
  click: () => vibrate(18),
  success: () => vibrate([20, 40, 30]),
  pr: () => vibrate([30, 50, 30, 50, 60]),
  tick: () => vibrate(12),
  done: () => vibrate([60, 80, 120]),
};

function audio(): AudioContext | null {
  if (!enabledSound) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, gain = 0.12, type: OscillatorType = 'sine') {
  const a = audio();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = a.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sound = {
  /** Soft countdown blip (last 3 seconds). */
  blip: () => tone(880, 0, 0.12, 0.07),
  /** Two-tone "rest over" chime. */
  chime: () => {
    tone(784, 0, 0.35);
    tone(1175, 0.16, 0.5);
  },
  /** Bright ascending arpeggio for PRs. */
  fanfare: () => {
    tone(523, 0, 0.18, 0.09, 'triangle');
    tone(659, 0.1, 0.18, 0.09, 'triangle');
    tone(784, 0.2, 0.18, 0.09, 'triangle');
    tone(1047, 0.3, 0.45, 0.1, 'triangle');
  },
  /** Metronome click for EMOM / intervals. */
  beep: () => tone(1320, 0, 0.08, 0.08, 'square'),
  /** Unlock the audio context on first user gesture. */
  prime: () => {
    audio();
  },
};
