import React, { useState, useEffect } from 'react';
import { Wind, Lightbulb } from 'lucide-react';

export const GuidedBreathingOrb: React.FC = () => {
  // Breathing phases: Inhale (4s), Hold (4s), Exhale (4s), Rest (2s)
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    'Release tension held in your shoulders, jaw, and neck.',
    'Gaze softly at the furthest distance out a window or across the room.',
    'Sip cool water mindfully and ground your feet into the floor.',
    'Notice the quiet stillness between breaths.',
    'Let thoughts drift past like fallen leaves on a river stream.',
  ];

  useEffect(() => {
    let timeoutId: number;

    if (phase === 'inhale') {
      timeoutId = window.setTimeout(() => setPhase('hold'), 4000);
    } else if (phase === 'hold') {
      timeoutId = window.setTimeout(() => setPhase('exhale'), 4000);
    } else if (phase === 'exhale') {
      timeoutId = window.setTimeout(() => setPhase('rest'), 4000);
    } else {
      timeoutId = window.setTimeout(() => {
        setPhase('inhale');
        setTipIndex((prev) => (prev + 1) % tips.length);
      }, 2000);
    }

    return () => window.clearTimeout(timeoutId);
  }, [phase, tips.length]);

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale':
        return { text: 'Inhale Slowly', sub: 'Fill your lungs with fresh clarity' };
      case 'hold':
        return { text: 'Hold Gently', sub: 'Rest in this suspended pause' };
      case 'exhale':
        return { text: 'Exhale Completely', sub: 'Let go of all residual effort' };
      case 'rest':
        return { text: 'Stillness', sub: 'Quiet equilibrium' };
    }
  };

  const currentInst = getPhaseInstruction();

  return (
    <div className="flex flex-col items-center justify-center my-3 max-w-sm mx-auto text-center space-y-5">
      {/* Animated Concentric Breathing Orb */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
        {/* Outer Glow Halo */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-[var(--matcha-border)] transition-all duration-[4000ms] ease-in-out ${
            phase === 'inhale' || phase === 'hold'
              ? 'scale-100 opacity-60 bg-[var(--matcha-soft)] shadow-xl shadow-[var(--matcha-glow)]'
              : 'scale-75 opacity-25 bg-transparent'
          }`}
        />

        {/* Middle Resonance Ring */}
        <div
          className={`absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-[var(--matcha-leaf)]/40 transition-all duration-[4000ms] ease-in-out ${
            phase === 'inhale' || phase === 'hold'
              ? 'scale-95 opacity-80'
              : 'scale-65 opacity-30'
          }`}
        />

        {/* Core Vessel Orb */}
        <div
          className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[var(--matcha-leaf)] text-white flex flex-col items-center justify-center shadow-lg transition-all duration-[4000ms] ease-in-out ${
            phase === 'inhale' || phase === 'hold'
              ? 'scale-110 shadow-[var(--matcha-glow)] shadow-2xl'
              : 'scale-85 shadow-md'
          }`}
        >
          <Wind className="w-6 h-6 mb-1 text-white" />
          <span className="font-mono text-[11px] uppercase tracking-widest font-black">
            {phase.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Synchronized Text Cue */}
      <div className="space-y-1">
        <h4 className="font-display text-xl sm:text-2xl font-semibold text-[var(--fg)] transition-all">
          {currentInst.text}
        </h4>
        <p className="font-serif italic text-xs text-[var(--muted)]">
          {currentInst.sub}
        </p>
      </div>

      {/* Mindful Pause Tip */}
      <div className="bg-[var(--surface-warm)] border border-[var(--border)] rounded-2xl px-4 py-3 text-xs text-[var(--fg-soft)] font-serif italic max-w-xs shadow-sm flex items-start gap-2 text-left">
        <Lightbulb className="w-3.5 h-3.5 text-[var(--ochre-seed)] shrink-0 mt-0.5" />
        <span>{tips[tipIndex]}</span>
      </div>
    </div>
  );
};
