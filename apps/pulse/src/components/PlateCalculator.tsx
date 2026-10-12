import React, { useState, useEffect } from 'react';
import { Sheet } from '@/components/ui';
import { platesPerSide, PLATE_COLOR, fmtNum } from '@/lib/calc';
import { useStore } from '@/store';
import { haptic } from '@/lib/feedback';
import type { Equipment } from '@/types';
import {
  Disc,
  Dumbbell,
  User,
  Layers,
  Sparkles,
  RotateCcw,
  Plus,
  Minus,
  Check,
} from 'lucide-react';

export interface PlateCalculatorProps {
  open: boolean;
  onClose: () => void;
  initialWeight: number;
  /** Persisted barbell weight for this exercise block (e.g. 20, 15, 10) */
  barWeight?: number;
  equipment?: Equipment;
  exerciseName?: string;
  onApply?: (weight: number, barWeight: number) => void;
}

type CalcMode = 'barbell' | 'dumbbell' | 'bodyweight' | 'machine';

export const PlateCalculator: React.FC<PlateCalculatorProps> = ({
  open,
  onClose,
  initialWeight,
  barWeight,
  equipment = 'barbell',
  exerciseName,
  onApply,
}) => {
  const { settings } = useStore();

  // Determine initial mode based on equipment
  const getInitialMode = (eq: Equipment): CalcMode => {
    if (eq === 'dumbbell') return 'dumbbell';
    if (eq === 'bodyweight') return 'bodyweight';
    if (eq === 'machine' || eq === 'cable') return 'machine';
    return 'barbell';
  };

  const [mode, setMode] = useState<CalcMode>(() => getInitialMode(equipment));
  const [targetWeight, setTargetWeight] = useState(initialWeight || 0);

  // Barbell specific state (Fixed bar weight + user-added plates per side)
  const [bar, setBar] = useState(barWeight || settings.barWeight || 20);
  const [loadedPlates, setLoadedPlates] = useState<number[]>([]);

  // Dumbbell specific state: 'single' (per hand) or 'pair' (both hands)
  const [dbIsPair, setDbIsPair] = useState(false);

  // Bodyweight specific state: 'bw' (0), 'weighted' (+kg), 'assisted' (-kg)
  const [bwMode, setBwMode] = useState<'bw' | 'weighted' | 'assisted'>('bw');
  const userBw = settings.bodyweight || 58.5;

  // Machine specific state: 'stack' or 'sled'
  const [machineMode, setMachineMode] = useState<'stack' | 'sled'>('stack');
  const [sledWeight, setSledWeight] = useState(45); // standard 45° leg press carriage
  const [microAddon, setMicroAddon] = useState(0);

  // Reset and sync state on open or equipment change
  useEffect(() => {
    if (open) {
      const initialMode = getInitialMode(equipment);
      setMode(initialMode);
      const barWt = barWeight || settings.barWeight || 20;
      setBar(barWt);

      if (initialMode === 'barbell') {
        if (initialWeight > barWt) {
          const { plates: initPlates } = platesPerSide(initialWeight, barWt, settings.unit);
          setLoadedPlates(initPlates);
        } else {
          setLoadedPlates([]);
        }
      } else if (initialMode === 'bodyweight') {
        if (initialWeight > 0) {
          setBwMode('weighted');
          setTargetWeight(initialWeight);
        } else if (initialWeight < 0) {
          setBwMode('assisted');
          setTargetWeight(Math.abs(initialWeight));
        } else {
          setBwMode('bw');
          setTargetWeight(0);
        }
      } else {
        setTargetWeight(initialWeight || 0);
      }
    }
  }, [open, equipment, initialWeight, settings.barWeight, settings.unit]);

  // Forward Barbell calculation:
  // Total Weight = Barbell Weight (Fixed) + 2 × (Sum of Plates on One Side)
  const sidePlatesWeight = loadedPlates.reduce((sum, p) => sum + p, 0);
  const totalPlatesWeight = sidePlatesWeight * 2;
  const totalBarbellWeight = bar + totalPlatesWeight;

  const addPlate = (p: number) => {
    haptic.tap();
    setLoadedPlates((current) => [...current, p].sort((a, b) => b - a));
  };

  const removePlateAtIndex = (idx: number) => {
    haptic.tap();
    setLoadedPlates((current) => current.filter((_, i) => i !== idx));
  };

  const removePlateByWeight = (val: number) => {
    haptic.tap();
    setLoadedPlates((current) => {
      const index = current.indexOf(val);
      if (index === -1) return current;
      const copy = [...current];
      copy.splice(index, 1);
      return copy;
    });
  };

  const clearPlates = () => {
    haptic.click();
    setLoadedPlates([]);
  };

  const plateCounts = loadedPlates.reduce<{ weight: number; count: number }[]>((acc, p) => {
    const found = acc.find((x) => x.weight === p);
    if (found) found.count += 1;
    else acc.push({ weight: p, count: 1 });
    return acc;
  }, []);

  const AVAILABLE_PLATES =
    settings.unit === 'kg' ? [25, 20, 15, 10, 5, 2.5, 1.25, 0.5] : [45, 35, 25, 10, 5, 2.5];

  // Sled plate calculations for plate-loaded machines (e.g. Leg Press)
  const sledPlates = platesPerSide(Math.max(sledWeight, targetWeight), sledWeight, settings.unit);

  const bump = (delta: number) => {
    haptic.tap();
    setTargetWeight((w) => {
      const minVal = mode === 'machine' && machineMode === 'sled' ? sledWeight : 0;
      return Math.max(minVal, Math.round((w + delta) * 10) / 10);
    });
  };

  const handleApply = () => {
    haptic.click();
    let weightToApply = targetWeight;
    if (mode === 'barbell') {
      weightToApply = totalBarbellWeight;
    } else if (mode === 'bodyweight') {
      if (bwMode === 'bw') weightToApply = 0;
      else if (bwMode === 'assisted') weightToApply = -Math.abs(targetWeight);
      else weightToApply = Math.abs(targetWeight);
    }
    onApply?.(weightToApply, bar);
    onClose();
  };

  // Dumbbell standard rack options
  const DUMBBELL_RACK = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40];

  // Machine stack options
  const MACHINE_STACK = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 100];

  // Weight badge display text for footer
  const appliedWeightLabel =
    mode === 'barbell'
      ? `${fmtNum(totalBarbellWeight, 1)} ${settings.unit}`
      : mode === 'bodyweight' && bwMode === 'bw'
      ? 'Bodyweight (0 kg)'
      : `${fmtNum(targetWeight, 1)} ${settings.unit}`;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      wide={true}
      title={
        <div className="flex flex-col">
          <span className="text-base sm:text-lg font-bold text-fg leading-tight truncate">
            {exerciseName || 'Plate & Weight Calculator'}
          </span>
          <span className="text-xs text-muted font-normal">
            Mobile-optimized gym load calculator
          </span>
        </div>
      }
      footer={
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="btn-ghost h-14 px-5 text-sm font-semibold rounded-2xl"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="btn-mint flex-1 h-14 rounded-2xl text-base font-black tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-mint/20 active:scale-[0.98]"
          >
            <Check size={20} className="stroke-[3]" />
            Apply {appliedWeightLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-6 pt-1 pb-4">
        {/* ── MODE SELECTOR TABS (TOUCH-OPTIMIZED) ── */}
        <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-ink-950/90 p-1.5 border border-white/10 shadow-inner">
          <button
            onClick={() => {
              haptic.tap();
              setMode('barbell');
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all ${
              mode === 'barbell'
                ? 'bg-peach/20 text-peach shadow-md border border-peach/40 font-black'
                : 'text-muted hover:text-fg hover:bg-white/5'
            }`}
          >
            <Disc size={18} className={mode === 'barbell' ? 'text-peach' : ''} />
            <span>Barbell</span>
          </button>

          <button
            onClick={() => {
              haptic.tap();
              setMode('dumbbell');
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all ${
              mode === 'dumbbell'
                ? 'bg-mint/20 text-mint shadow-md border border-mint/40 font-black'
                : 'text-muted hover:text-fg hover:bg-white/5'
            }`}
          >
            <Dumbbell size={18} className={mode === 'dumbbell' ? 'text-mint' : ''} />
            <span>Dumbbell</span>
          </button>

          <button
            onClick={() => {
              haptic.tap();
              setMode('bodyweight');
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all ${
              mode === 'bodyweight'
                ? 'bg-ice/20 text-ice shadow-md border border-ice/40 font-black'
                : 'text-muted hover:text-fg hover:bg-white/5'
            }`}
          >
            <User size={18} className={mode === 'bodyweight' ? 'text-ice' : ''} />
            <span>Bodyweight</span>
          </button>

          <button
            onClick={() => {
              haptic.tap();
              setMode('machine');
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all ${
              mode === 'machine'
                ? 'bg-lav/20 text-lav shadow-md border border-lav/40 font-black'
                : 'text-muted hover:text-fg hover:bg-white/5'
            }`}
          >
            <Layers size={18} className={mode === 'machine' ? 'text-lav' : ''} />
            <span>Machine</span>
          </button>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* MODE 1: BARBELL PLATE CALCULATOR (FORWARD SUMMATION)      */}
        {/* ────────────────────────────────────────────────────────── */}
        {mode === 'barbell' && (
          <div className="space-y-6">
            {/* HERO TOTAL WEIGHT READOUT */}
            <div className="rounded-3xl border border-peach/30 bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 p-5 shadow-xl shadow-peach/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="label text-peach tracking-widest font-black text-xs">
                    TOTAL BARBELL LOAD
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="font-mono text-5xl sm:text-6xl font-black text-fg tracking-tight">
                      {fmtNum(totalBarbellWeight, 1)}
                    </span>
                    <span className="ml-2 text-xl sm:text-2xl font-bold text-peach/80">
                      {settings.unit}
                    </span>
                  </div>
                </div>

                <button
                  onClick={clearPlates}
                  disabled={loadedPlates.length === 0}
                  className="h-11 px-4 rounded-2xl border border-coral/30 bg-coral/10 text-coral text-xs sm:text-sm font-bold hover:bg-coral/20 active:scale-95 disabled:opacity-25 transition-all flex items-center gap-2 shadow-sm"
                  title="Remove all plates from bar"
                >
                  <RotateCcw size={16} />
                  <span>Clear</span>
                </button>
              </div>

              {/* Exact Formula Breakdown Badges */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3.5 text-xs sm:text-sm font-mono">
                <span className="rounded-xl bg-white/[0.07] px-3 py-1.5 text-slate-200 border border-white/10">
                  Bar: <strong className="text-fg">{bar} {settings.unit}</strong> (fixed)
                </span>
                <span className="text-muted font-bold text-base">+</span>
                <span className="rounded-xl bg-mint/15 border border-mint/30 px-3 py-1.5 text-mint font-semibold">
                  Plates: <strong>{fmtNum(totalPlatesWeight, 1)} {settings.unit}</strong> (2 × {fmtNum(sidePlatesWeight, 1)})
                </span>
                <span className="text-muted font-bold text-base">=</span>
                <span className="rounded-xl bg-peach/20 border border-peach/40 px-3 py-1.5 text-peach font-black">
                  Total: {fmtNum(totalBarbellWeight, 1)} {settings.unit}
                </span>
              </div>
            </div>

            {/* VISUAL BARBELL SLEEVE (EXPANDED TOUCH TARGETS) */}
            <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 sm:p-5 shadow-lg">
              <div className="mb-3 flex items-center justify-between text-xs sm:text-sm text-muted">
                <span className="font-bold uppercase tracking-wider text-slate-300">
                  Per-Side Sleeve ({loadedPlates.length} plates)
                </span>
                <span className="text-peach/90 text-xs font-medium">
                  Tap plate to unload
                </span>
              </div>

              {/* Barbell Sleeve Graphic */}
              <div className="relative my-2 flex h-36 items-center justify-center overflow-x-auto rounded-2xl bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 px-6 py-2 border border-white/5">
                {/* Barbell Steel Shaft */}
                <div className="absolute left-0 right-0 h-5 bg-gradient-to-r from-slate-500 via-slate-300 to-slate-500 shadow-inner rounded-full" />
                {/* Barbell Collar Stopper */}
                <div className="absolute left-6 h-16 w-5 rounded-md bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow-xl border border-slate-500 z-10" />

                {/* Loaded Plates Container */}
                <div className="relative z-20 flex items-center gap-1.5 pl-14 min-w-max">
                  {loadedPlates.length === 0 ? (
                    <div className="text-xs sm:text-sm italic text-muted/70 font-medium py-4 px-2">
                      Bare bar ({bar} {settings.unit}). Tap bumper plates below to load!
                    </div>
                  ) : (
                    loadedPlates.map((p, idx) => {
                      const color = PLATE_COLOR[String(p)] || '#C8B6FF';
                      // Sizing: Ensure tall enough and comfortably wide (w-9 sm:w-11)
                      const h = Math.min(124, Math.max(46, p * 3.2 + 28));
                      return (
                        <button
                          key={idx}
                          onClick={() => removePlateAtIndex(idx)}
                          className="group relative flex flex-col items-center justify-center rounded-lg font-mono text-xs font-black text-ink-950 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer ring-1 ring-black/40"
                          style={{
                            height: `${h}px`,
                            width: '38px',
                            backgroundColor: color,
                          }}
                          title={`Tap to remove ${p} ${settings.unit} plate`}
                        >
                          {/* Inner bevel border */}
                          <div className="absolute inset-1 rounded border border-black/20 pointer-events-none" />
                          <span className="-rotate-90 select-none whitespace-nowrap text-ink-950 font-black tracking-tight">
                            {p}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* LOADED PLATES SUMMARY & LARGE STEPPERS */}
              {loadedPlates.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-white/[0.08] pt-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted">
                    Loaded On Each Side:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {plateCounts.map(({ weight, count }) => (
                      <div
                        key={weight}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 px-3.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-4 w-4 rounded-full border border-black/40 shadow-sm"
                            style={{ backgroundColor: PLATE_COLOR[String(weight)] || '#C8B6FF' }}
                          />
                          <div>
                            <span className="font-mono text-sm font-black text-fg">
                              {weight} {settings.unit}
                            </span>
                            <span className="ml-1.5 text-xs font-mono text-muted font-bold">
                              × {count}
                            </span>
                            <span className="ml-2 text-[11px] font-mono text-dim">
                              (+{weight * 2 * count} total)
                            </span>
                          </div>
                        </div>

                        {/* Large Touch Steppers (Minimum 38px touch target) */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => removePlateByWeight(weight)}
                            className="h-10 w-10 rounded-xl bg-ink-950 border border-white/10 hover:border-coral/40 hover:bg-coral/20 hover:text-coral active:scale-90 flex items-center justify-center text-fg font-bold transition-all"
                            title={`Remove one ${weight} plate`}
                            aria-label={`Remove one ${weight} plate`}
                          >
                            <Minus size={18} />
                          </button>
                          <button
                            onClick={() => addPlate(weight)}
                            className="h-10 w-10 rounded-xl bg-ink-950 border border-white/10 hover:border-mint/40 hover:bg-mint/20 hover:text-mint active:scale-90 flex items-center justify-center text-fg font-bold transition-all"
                            title={`Add another ${weight} plate`}
                            aria-label={`Add another ${weight} plate`}
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BUMPER PLATE RACK (LARGE PRIMARY TAP TARGETS) */}
            <div className="rounded-3xl border border-white/10 bg-ink-900/70 p-4 sm:p-5 shadow-lg">
              <div className="mb-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-fg">
                    Plate Rack (Add Per Side)
                  </span>
                  <p className="text-[11px] text-muted">
                    Automatically loads both sides (+2× to barbell total)
                  </p>
                </div>
              </div>

              {/* 4-Column Large Plate Cards (Minimum 76px tall with huge touch zone) */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {AVAILABLE_PLATES.map((p) => {
                  const color = PLATE_COLOR[String(p)] || '#C8B6FF';
                  return (
                    <button
                      key={p}
                      onClick={() => addPlate(p)}
                      className="group flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-ink-950/80 p-3 sm:p-3.5 min-h-[76px] transition-all hover:border-white/30 hover:bg-white/5 active:scale-95 shadow-md"
                    >
                      {/* Olympic Color Bar Indicator */}
                      <span
                        className="h-2.5 w-10 sm:w-12 rounded-full mb-1.5 shadow-sm transition-transform group-hover:scale-110"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-mono text-base sm:text-lg font-black text-fg">
                        +{p}
                      </span>
                      <span className="text-[10px] sm:text-xs font-mono text-dim mt-0.5">
                        (+{p * 2})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FIXED BARBELL WEIGHT SELECTOR */}
            <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-fg">Barbell Shaft Weight</span>
                  <p className="text-xs text-muted">Fixed bar weight before adding plates</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(settings.unit === 'kg'
                  ? [
                      { val: 20, name: 'Olympic Bar', sub: '20 kg Standard' },
                      { val: 15, name: 'Women’s Bar', sub: '15 kg / 25mm' },
                      { val: 10, name: 'Technique Bar', sub: '10 kg Light' },
                    ]
                  : [
                      { val: 45, name: 'Olympic Bar', sub: '45 lb Standard' },
                      { val: 35, name: 'Women’s Bar', sub: '35 lb' },
                      { val: 15, name: 'Technique Bar', sub: '15 lb Light' },
                    ]
                ).map((barOpt) => (
                  <button
                    key={barOpt.val}
                    onClick={() => {
                      haptic.tap();
                      setBar(barOpt.val);
                    }}
                    className={`rounded-xl p-2.5 text-center transition-all ${
                      bar === barOpt.val
                        ? 'bg-peach/20 border border-peach/50 text-peach font-black shadow-md'
                        : 'border border-white/10 bg-ink-950/70 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-mono text-sm sm:text-base font-black">
                      {barOpt.val} {settings.unit}
                    </div>
                    <div className="text-[10px] text-muted truncate">{barOpt.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* MODE 2: DUMBBELL SELECTOR                                  */}
        {/* ────────────────────────────────────────────────────────── */}
        {mode === 'dumbbell' && (
          <div className="space-y-6">
            {/* Dumbbell Header & Pair Toggle */}
            <div className="rounded-3xl border border-mint/30 bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 p-5 shadow-xl shadow-mint/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="label text-mint tracking-wider font-black text-xs">
                    {dbIsPair ? 'TOTAL PAIR LOAD (BOTH HANDS)' : 'PER DUMBBELL WEIGHT (EACH HAND)'}
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="font-mono text-5xl sm:text-6xl font-black text-fg tracking-tight">
                      {fmtNum(targetWeight, 1)}
                    </span>
                    <span className="ml-2 text-xl sm:text-2xl font-bold text-mint/80">
                      {settings.unit}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {dbIsPair
                      ? `Each hand holds ${fmtNum(targetWeight / 2, 1)} ${settings.unit}`
                      : `Pair total weight: ${fmtNum(targetWeight * 2, 1)} ${settings.unit}`}
                  </div>
                </div>

                <button
                  onClick={() => {
                    haptic.tap();
                    setDbIsPair((p) => !p);
                  }}
                  className="h-11 px-4 rounded-2xl border border-mint/30 bg-mint/10 text-mint text-xs sm:text-sm font-bold hover:bg-mint/20 active:scale-95 transition-all shadow-sm"
                >
                  {dbIsPair ? 'Switch to Single' : 'Switch to Pair'}
                </button>
              </div>

              {/* Visual Dumbbell Icon */}
              <div className="mt-4 flex items-center justify-center p-5 bg-ink-950/90 rounded-2xl border border-white/5">
                <div className="flex items-center">
                  <div className="h-16 w-8 rounded-lg bg-gradient-to-b from-slate-600 via-slate-400 to-slate-700 border border-slate-500 shadow-md" />
                  <div className="h-5 w-20 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 flex items-center justify-center text-xs font-black text-ink-950 font-mono shadow-inner select-none">
                    {targetWeight} {settings.unit}
                  </div>
                  <div className="h-16 w-8 rounded-lg bg-gradient-to-b from-slate-600 via-slate-400 to-slate-700 border border-slate-500 shadow-md" />
                </div>
              </div>
            </div>

            {/* Large Stepper Buttons */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted">
                Quick Increments
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[-10, -5, -2, -1, +1, +2, +5, +10].map((delta) => (
                  <button
                    key={delta}
                    onClick={() => bump(delta)}
                    className="h-12 rounded-xl border border-white/10 bg-ink-950/80 hover:bg-white/10 active:scale-95 text-xs sm:text-sm font-mono font-bold text-slate-200 transition-all flex items-center justify-center"
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Dumbbell Rack (4 Columns for Mobile Ergonomics) */}
            <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 sm:p-5">
              <div className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-muted">
                Dumbbell Rack ({settings.unit})
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-2.5">
                {DUMBBELL_RACK.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      haptic.tap();
                      setTargetWeight(w);
                    }}
                    className={`h-13 rounded-2xl font-mono text-base font-bold transition-all flex items-center justify-center ${
                      targetWeight === w
                        ? 'bg-mint text-ink-950 ring-2 ring-mint/50 shadow-lg font-black scale-105'
                        : 'border border-white/10 bg-ink-950/70 text-slate-300 hover:bg-white/10 active:scale-95'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Double Progression Rule Tip */}
            <div className="rounded-2xl border border-mint/20 bg-mint/5 p-3.5 text-xs sm:text-sm text-mint/90 flex items-start gap-2.5">
              <Sparkles size={18} className="shrink-0 mt-0.5 text-mint" />
              <span>
                <strong>Double Progression:</strong> When you hit the top of the rep range on every set with 1–2 RIR, add <strong>1 to 2 kg</strong> on dumbbells next session and reset to the bottom of the range.
              </span>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* MODE 3: BODYWEIGHT & ASSIST CALCULATOR                     */}
        {/* ────────────────────────────────────────────────────────── */}
        {mode === 'bodyweight' && (
          <div className="space-y-6">
            {/* Submode Segmented Tabs */}
            <div className="flex rounded-2xl bg-ink-950/90 p-1.5 border border-white/10 gap-1.5">
              <button
                onClick={() => {
                  haptic.tap();
                  setBwMode('bw');
                  setTargetWeight(0);
                }}
                className={`flex-1 rounded-xl py-3 text-xs sm:text-sm font-bold transition-all ${
                  bwMode === 'bw'
                    ? 'bg-ice/20 text-ice border border-ice/40 shadow font-black'
                    : 'text-muted hover:text-fg'
                }`}
              >
                Pure BW
              </button>
              <button
                onClick={() => {
                  haptic.tap();
                  setBwMode('weighted');
                  if (targetWeight <= 0) setTargetWeight(5);
                }}
                className={`flex-1 rounded-xl py-3 text-xs sm:text-sm font-bold transition-all ${
                  bwMode === 'weighted'
                    ? 'bg-peach/20 text-peach border border-peach/40 shadow font-black'
                    : 'text-muted hover:text-fg'
                }`}
              >
                + Weighted
              </button>
              <button
                onClick={() => {
                  haptic.tap();
                  setBwMode('assisted');
                  if (targetWeight <= 0) setTargetWeight(10);
                }}
                className={`flex-1 rounded-xl py-3 text-xs sm:text-sm font-bold transition-all ${
                  bwMode === 'assisted'
                    ? 'bg-mint/20 text-mint border border-mint/40 shadow font-black'
                    : 'text-muted hover:text-fg'
                }`}
              >
                − Assisted
              </button>
            </div>

            {/* Total Load Display */}
            <div className="rounded-3xl border border-white/10 bg-ink-950/90 p-5 shadow-xl">
              <div className="label text-ice font-bold text-xs tracking-wider">
                {bwMode === 'bw'
                  ? 'PURE BODYWEIGHT EXERCISE'
                  : bwMode === 'weighted'
                  ? 'ADDED LOAD (DIP BELT / VEST / PLATES)'
                  : 'COUNTERWEIGHT / BAND ASSISTANCE'}
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div className="font-mono text-5xl sm:text-6xl font-black text-fg tracking-tight">
                  {bwMode === 'bw'
                    ? 'BW'
                    : bwMode === 'weighted'
                    ? `+${fmtNum(targetWeight, 1)}`
                    : `-${fmtNum(targetWeight, 1)}`}
                  {bwMode !== 'bw' && (
                    <span className="ml-2 text-xl font-bold text-muted">{settings.unit}</span>
                  )}
                </div>
                <div className="text-xs font-mono text-muted">
                  Athlete BW: <strong className="text-fg">{userBw} {settings.unit}</strong>
                </div>
              </div>

              {/* Effective Load Math */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-900/90 p-3 text-xs sm:text-sm text-slate-300 font-mono border border-white/5">
                <span>Total System Load:</span>
                <span className="font-bold text-fg text-sm">
                  {bwMode === 'bw'
                    ? `${userBw} ${settings.unit}`
                    : bwMode === 'weighted'
                    ? `${fmtNum(userBw + targetWeight, 1)} ${settings.unit} (${userBw} + ${targetWeight})`
                    : `${fmtNum(Math.max(0, userBw - targetWeight), 1)} ${settings.unit} (${userBw} - ${targetWeight})`}
                </span>
              </div>
            </div>

            {/* Steppers if weighted or assisted */}
            {bwMode !== 'bw' && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted">
                  Quick Load Presets ({settings.unit})
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(bwMode === 'weighted'
                    ? [2.5, 5, 7.5, 10, 12.5, 15, 20, 25]
                    : [5, 10, 15, 20, 25, 30, 35, 40]
                  ).map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        haptic.tap();
                        setTargetWeight(val);
                      }}
                      className={`h-12 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all flex items-center justify-center ${
                        targetWeight === val
                          ? 'bg-ice/25 text-ice border border-ice/50 font-black shadow-md scale-105'
                          : 'border border-white/10 bg-ink-950/70 text-slate-300 hover:bg-white/10 active:scale-95'
                      }`}
                    >
                      {bwMode === 'weighted' ? `+${val}` : `-${val}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* MODE 4: MACHINE & CABLE PIN STACK CALCULATOR               */}
        {/* ────────────────────────────────────────────────────────── */}
        {mode === 'machine' && (
          <div className="space-y-6">
            {/* Machine Type Toggle */}
            <div className="flex rounded-2xl bg-ink-950/90 p-1.5 border border-white/10 gap-1.5">
              <button
                onClick={() => {
                  haptic.tap();
                  setMachineMode('stack');
                }}
                className={`flex-1 rounded-xl py-3 text-xs sm:text-sm font-bold transition-all ${
                  machineMode === 'stack'
                    ? 'bg-lav/20 text-lav border border-lav/40 shadow font-black'
                    : 'text-muted hover:text-fg'
                }`}
              >
                Pin Selector Stack / Cable
              </button>
              <button
                onClick={() => {
                  haptic.tap();
                  setMachineMode('sled');
                  setTargetWeight((w) => Math.max(sledWeight, w));
                }}
                className={`flex-1 rounded-xl py-3 text-xs sm:text-sm font-bold transition-all ${
                  machineMode === 'sled'
                    ? 'bg-peach/20 text-peach border border-peach/40 shadow font-black'
                    : 'text-muted hover:text-fg'
                }`}
              >
                Plate-Loaded Sled (Leg Press)
              </button>
            </div>

            {/* Target Display */}
            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-ink-950/80 p-5 shadow-xl">
              <div>
                <div className="label text-lav font-bold text-xs">
                  {machineMode === 'stack' ? 'MACHINE STACK SETTING' : 'TOTAL LEG PRESS / SLED LOAD'}
                </div>
                <div className="mt-1 flex items-baseline">
                  <span className="font-mono text-5xl sm:text-6xl font-black text-fg tracking-tight">
                    {fmtNum(targetWeight, 1)}
                  </span>
                  <span className="ml-2 text-xl font-bold text-lav/80">
                    {settings.unit}
                  </span>
                </div>
                {machineMode === 'sled' && (
                  <div className="mt-1 text-xs text-muted">
                    Sled base: {sledWeight} {settings.unit} + {fmtNum(Math.max(0, targetWeight - sledWeight), 1)} {settings.unit} plates
                  </div>
                )}
              </div>

              {/* Large Stepper Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => bump(-2.5)}
                  className="h-12 w-12 rounded-2xl bg-ink-900 border border-white/10 hover:border-white/20 active:scale-95 flex items-center justify-center text-xl font-black text-fg shadow-sm"
                  aria-label="Decrease weight by 2.5"
                >
                  <Minus size={20} />
                </button>
                <button
                  onClick={() => bump(+2.5)}
                  className="h-12 w-12 rounded-2xl bg-ink-900 border border-white/10 hover:border-white/20 active:scale-95 flex items-center justify-center text-xl font-black text-fg shadow-sm"
                  aria-label="Increase weight by 2.5"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Pin Stack Grid if Stack Mode */}
            {machineMode === 'stack' ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-4 sm:p-5">
                  <div className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-muted">
                    Stack Plate Pin Selection ({settings.unit})
                  </div>
                  {/* 4 or 5 Columns with generous 48px height */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {MACHINE_STACK.map((w) => (
                      <button
                        key={w}
                        onClick={() => {
                          haptic.tap();
                          setTargetWeight(w + microAddon);
                        }}
                        className={`h-12 rounded-xl font-mono text-sm sm:text-base font-bold transition-all flex items-center justify-center ${
                          Math.floor(targetWeight) === w
                            ? 'bg-lav text-ink-950 ring-2 ring-lav/50 shadow-md font-black scale-105'
                            : 'border border-white/10 bg-ink-950/70 text-slate-300 hover:bg-white/10 active:scale-95'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Magnetic Micro-Plates */}
                <div className="flex items-center justify-between rounded-2xl bg-ink-950/80 p-3.5 border border-white/10">
                  <span className="text-xs sm:text-sm font-semibold text-slate-300">
                    Micro-plate pin add-on:
                  </span>
                  <div className="flex gap-2">
                    {[0, 1.25, 2.5].map((addon) => (
                      <button
                        key={addon}
                        onClick={() => {
                          haptic.tap();
                          setMicroAddon(addon);
                          setTargetWeight((w) => Math.floor(w / 5) * 5 + addon);
                        }}
                        className={`h-10 px-3.5 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all flex items-center justify-center ${
                          microAddon === addon
                            ? 'bg-lav/20 text-lav border border-lav/40 font-black shadow'
                            : 'border border-white/10 bg-white/5 text-muted hover:bg-white/10'
                        }`}
                      >
                        +{addon} {settings.unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Plate-loaded Sled breakdown for Leg Press */
              <div className="rounded-3xl border border-white/10 bg-ink-900/90 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm text-muted">
                  <span className="font-bold uppercase tracking-wider text-slate-300">
                    Per Side Plate Breakdown
                  </span>
                  <span>
                    Sled Base: <strong>{sledWeight} {settings.unit}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                  {sledPlates.plates.length > 0 ? (
                    sledPlates.plates
                      .reduce<{ weight: number; count: number }[]>((acc, p) => {
                        const found = acc.find((x) => x.weight === p);
                        if (found) found.count += 1;
                        else acc.push({ weight: p, count: 1 });
                        return acc;
                      }, [])
                      .map(({ weight, count }) => (
                        <span
                          key={weight}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 font-mono"
                        >
                          <span
                            className="inline-block h-3 w-3 rounded-full shadow"
                            style={{ backgroundColor: PLATE_COLOR[String(weight)] || '#C8B6FF' }}
                          />
                          <strong>{weight} {settings.unit}</strong> × {count}
                        </span>
                      ))
                  ) : (
                    <span className="text-muted italic">
                      Empty sled ({sledWeight} {settings.unit}).
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stepper buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[-20, -10, -5, -2.5, +2.5, +5, +10, +20].map((delta) => (
                <button
                  key={delta}
                  onClick={() => bump(delta)}
                  className="h-12 rounded-xl border border-white/10 bg-ink-950/80 hover:bg-white/10 active:scale-95 text-xs sm:text-sm font-mono font-bold text-slate-200 transition-all flex items-center justify-center"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>

            {/* Progression Rule Tip */}
            <div className="rounded-2xl border border-lav/20 bg-lav/5 p-3.5 text-xs sm:text-sm text-lav/90 flex items-start gap-2.5">
              <Sparkles size={18} className="shrink-0 mt-0.5 text-lav" />
              <span>
                <strong>Progress rule:</strong> On Leg Press add <strong>5 kg</strong> (2.5 kg if too heavy). On cable & isolation machines add <strong>2.5 kg</strong> or 1 rep once you reach the top of the range.
              </span>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
};
