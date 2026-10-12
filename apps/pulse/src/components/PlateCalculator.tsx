import React, { useState, useEffect } from 'react';
import { Sheet, Segmented } from '@/components/ui';
import { platesPerSide, PLATE_COLOR, fmtNum } from '@/lib/calc';
import { useStore } from '@/store';
import { haptic } from '@/lib/feedback';
import type { Equipment } from '@/types';
import { Disc, Dumbbell, User, Layers, ArrowRight, ShieldAlert, Sparkles, Check } from 'lucide-react';

export interface PlateCalculatorProps {
  open: boolean;
  onClose: () => void;
  initialWeight: number;
  equipment?: Equipment;
  exerciseName?: string;
  onApply?: (weight: number) => void;
}

type CalcMode = 'barbell' | 'dumbbell' | 'bodyweight' | 'machine';

export const PlateCalculator: React.FC<PlateCalculatorProps> = ({
  open,
  onClose,
  initialWeight,
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

  // Barbell specific state
  const [bar, setBar] = useState(settings.barWeight || 20);

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
      setBar(settings.barWeight || 20);

      if (initialMode === 'barbell') {
        setTargetWeight(initialWeight || settings.barWeight || 20);
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
  }, [open, equipment, initialWeight, settings.barWeight]);

  // Barbell plate calculations
  const { plates, remainder } = platesPerSide(targetWeight, bar, settings.unit);

  // Sled plate calculations for plate-loaded machines (e.g. Leg Press)
  const sledPlates = platesPerSide(Math.max(sledWeight, targetWeight), sledWeight, settings.unit);

  const bump = (delta: number) => {
    haptic.tap();
    setTargetWeight((w) => {
      const minVal = mode === 'barbell' ? bar : mode === 'machine' && machineMode === 'sled' ? sledWeight : 0;
      return Math.max(minVal, Math.round((w + delta) * 10) / 10);
    });
  };

  const handleApply = () => {
    haptic.click();
    let weightToApply = targetWeight;
    if (mode === 'bodyweight') {
      if (bwMode === 'bw') weightToApply = 0;
      else if (bwMode === 'assisted') weightToApply = -Math.abs(targetWeight);
      else weightToApply = Math.abs(targetWeight);
    }
    onApply?.(weightToApply);
    onClose();
  };

  // Dumbbell standard rack options
  const DUMBBELL_RACK = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40];

  // Machine stack options
  const MACHINE_STACK = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 100];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={exerciseName ? `${exerciseName}` : 'Weight Calculator'}
      footer={
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={handleApply} className="btn-mint flex-1 font-black">
            Apply {mode === 'bodyweight' && bwMode === 'bw' ? 'Bodyweight (0 kg)' : `${fmtNum(targetWeight, 1)} ${settings.unit}`}
          </button>
        </div>
      }
    >
      <div className="space-y-5 pt-2">
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-ink-950/80 p-1 border border-white/10">
          <button
            onClick={() => {
              haptic.tap();
              setMode('barbell');
              setTargetWeight((w) => Math.max(bar, w || bar));
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              mode === 'barbell'
                ? 'bg-peach/20 text-peach shadow border border-peach/30'
                : 'text-muted hover:text-fg hover:bg-white/5'
            }`}
          >
            <Disc size={14} /> Barbell
          </button>
          <button
            onClick={() => {
              haptic.tap();
              setMode('dumbbell');
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              mode === 'dumbbell'
                ? 'bg-mint/20 text-mint shadow border border-mint/30'
                : 'text-muted hover:text-fg hover:bg-white/5'
            }`}
          >
            <Dumbbell size={14} /> Dumbbell
          </button>
          <button
            onClick={() => {
              haptic.tap();
              setMode('bodyweight');
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              mode === 'bodyweight'
                ? 'bg-ice/20 text-ice shadow border border-ice/30'
                : 'text-muted hover:text-fg hover:bg-white/5'
            }`}
          >
            <User size={14} /> Bodyweight
          </button>
          <button
            onClick={() => {
              haptic.tap();
              setMode('machine');
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              mode === 'machine'
                ? 'bg-lav/20 text-lav shadow border border-lav/30'
                : 'text-muted hover:text-fg hover:bg-white/5'
            }`}
          >
            <Layers size={14} /> Machine
          </button>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* MODE 1: BARBELL PLATE CALCULATOR                          */}
        {/* ────────────────────────────────────────────────────────── */}
        {mode === 'barbell' && (
          <div className="space-y-5">
            {/* Target Weight Header */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-ink-950/70 p-4">
              <div>
                <div className="label">Total Barbell Load</div>
                <div className="num mt-1 text-3xl font-extrabold text-fg">
                  {fmtNum(targetWeight, 1)}{' '}
                  <span className="text-base font-normal text-muted">{settings.unit}</span>
                </div>
                {remainder > 0 && (
                  <div className="mt-1 text-xs text-amber">
                    +{remainder} {settings.unit} remainder (plates don’t divide evenly)
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => bump(-2.5)}
                  className="btn-ghost h-11 w-11 p-0 text-lg font-bold"
                >
                  -
                </button>
                <button
                  onClick={() => bump(+2.5)}
                  className="btn-ghost h-11 w-11 p-0 text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Stepper Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[-20, -10, -5, -2.5, +2.5, +5, +10, +20].map((delta) => (
                <button
                  key={delta}
                  onClick={() => bump(delta)}
                  className="chip hover:border-white/20 active:scale-95 text-xs font-mono"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>

            {/* Barbell Sleeve Graphic */}
            <div className="rounded-2xl border border-white/10 bg-ink-900/90 p-5">
              <div className="mb-4 flex items-center justify-between text-xs text-muted">
                <span className="font-semibold uppercase tracking-wider">Per Side Breakdown</span>
                <span>
                  Bar: <strong className="text-fg">{bar} {settings.unit}</strong>
                </span>
              </div>

              <div className="relative my-4 flex h-32 items-center justify-center overflow-x-auto rounded-xl bg-ink-950/80 px-4">
                <div className="absolute left-0 right-0 h-4 bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 shadow" />
                <div className="absolute left-6 h-12 w-4 rounded-sm bg-slate-300 shadow-lg" />

                <div className="relative z-10 flex items-center gap-1 pl-12">
                  {plates.length === 0 ? (
                    <div className="text-xs italic text-dim">Empty bar ({bar} {settings.unit})</div>
                  ) : (
                    plates.map((p, idx) => {
                      const color = PLATE_COLOR[String(p)] || '#C8B6FF';
                      const h = Math.min(110, Math.max(38, p * 2.8 + 24));
                      return (
                        <div
                          key={idx}
                          className="group relative flex flex-col items-center justify-center rounded-md font-mono text-[10px] font-black text-ink-900 shadow-md transition-transform hover:scale-105"
                          style={{
                            height: `${h}px`,
                            width: '26px',
                            backgroundColor: color,
                            border: '1px solid rgba(0,0,0,0.3)',
                          }}
                          title={`${p} ${settings.unit}`}
                        >
                          <span className="-rotate-90 select-none whitespace-nowrap">{p}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Plate inventory tags */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {plates.length > 0 ? (
                  plates
                    .reduce<{ weight: number; count: number }[]>((acc, p) => {
                      const found = acc.find((x) => x.weight === p);
                      if (found) found.count += 1;
                      else acc.push({ weight: p, count: 1 });
                      return acc;
                    }, [])
                    .map(({ weight, count }) => (
                      <span
                        key={weight}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300"
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: PLATE_COLOR[String(weight)] || '#C8B6FF' }}
                        />
                        <strong>{weight} {settings.unit}</strong> × {count}
                      </span>
                    ))
                ) : (
                  <span className="text-dim">Bare barbell with no plates loaded.</span>
                )}
              </div>
            </div>

            {/* Barbell Weight Toggle */}
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
              <span className="text-sm text-muted">Barbell weight</span>
              <Segmented
                value={String(bar)}
                onChange={(v) => {
                  const nb = Number(v);
                  setBar(nb);
                  setTargetWeight((t) => Math.max(nb, t));
                }}
                options={
                  settings.unit === 'kg'
                    ? [
                        { value: '20', label: 'Olympic 20kg' },
                        { value: '15', label: 'Women’s 15kg' },
                        { value: '10', label: 'Technique 10kg' },
                      ]
                    : [
                        { value: '45', label: 'Olympic 45lb' },
                        { value: '35', label: 'Women’s 35lb' },
                        { value: '15', label: 'Bar 15lb' },
                      ]
                }
              />
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* MODE 2: DUMBBELL SELECTOR                                  */}
        {/* ────────────────────────────────────────────────────────── */}
        {mode === 'dumbbell' && (
          <div className="space-y-5">
            {/* Dumbbell Header & Pair Toggle */}
            <div className="rounded-2xl border border-mint/20 bg-gradient-to-br from-ink-950/80 to-ink-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="label text-mint">
                    {dbIsPair ? 'Total Pair Weight (Both Hands)' : 'Per Dumbbell Weight (Each Hand)'}
                  </div>
                  <div className="num mt-1 text-3xl font-black text-fg">
                    {fmtNum(targetWeight, 1)}{' '}
                    <span className="text-base font-normal text-muted">{settings.unit}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {dbIsPair
                      ? `Each hand holds ${fmtNum(targetWeight / 2, 1)} ${settings.unit}`
                      : `Pair total load: ${fmtNum(targetWeight * 2, 1)} ${settings.unit}`}
                  </div>
                </div>

                <button
                  onClick={() => setDbIsPair((p) => !p)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-mint hover:bg-white/10"
                >
                  {dbIsPair ? 'Switch to Single' : 'Switch to Pair'}
                </button>
              </div>

              {/* Visual Dumbbell Icon */}
              <div className="mt-4 flex items-center justify-center p-4 bg-ink-950/90 rounded-xl border border-white/5">
                <div className="flex items-center">
                  <div className="h-14 w-6 rounded-md bg-gradient-to-b from-slate-600 via-slate-400 to-slate-700 border border-slate-500 shadow-md" />
                  <div className="h-4 w-16 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 flex items-center justify-center text-[10px] font-black text-ink-950 font-mono shadow-inner select-none">
                    {targetWeight}
                  </div>
                  <div className="h-14 w-6 rounded-md bg-gradient-to-b from-slate-600 via-slate-400 to-slate-700 border border-slate-500 shadow-md" />
                </div>
              </div>
            </div>

            {/* Steppers */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[-10, -5, -2, -1, +1, +2, +5, +10].map((delta) => (
                <button
                  key={delta}
                  onClick={() => bump(delta)}
                  className="chip hover:border-white/20 active:scale-95 text-xs font-mono"
                >
                  {delta > 0 ? `+${delta}` : delta} {settings.unit}
                </button>
              ))}
            </div>

            {/* Interactive Dumbbell Rack */}
            <div className="rounded-2xl border border-white/10 bg-ink-900/90 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Dumbbell Rack Quick Select ({settings.unit})
              </div>
              <div className="grid grid-cols-6 gap-2">
                {DUMBBELL_RACK.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      haptic.tap();
                      setTargetWeight(w);
                    }}
                    className={`rounded-xl py-2 font-mono text-xs font-bold transition-all ${
                      targetWeight === w
                        ? 'bg-mint text-ink-950 ring-2 ring-mint/50 shadow-md font-black scale-105'
                        : 'border border-white/10 bg-ink-950/60 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Doc Double Progression Rule Tip */}
            <div className="rounded-xl border border-mint/20 bg-mint/5 p-3 text-xs text-mint/90 flex items-start gap-2">
              <Sparkles size={15} className="shrink-0 mt-0.5 text-mint" />
              <span>
                <strong>Double Progression (from workout plan):</strong> When you hit the top of the rep range on every set with 1–2 RIR, add <strong>1 to 2 kg</strong> on dumbbells next session and reset to the bottom of the range.
              </span>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* MODE 3: BODYWEIGHT & ASSIST CALCULATOR                     */}
        {/* ────────────────────────────────────────────────────────── */}
        {mode === 'bodyweight' && (
          <div className="space-y-5">
            {/* Submode Segmented */}
            <div className="flex rounded-xl bg-ink-950/90 p-1 border border-white/10 gap-1">
              <button
                onClick={() => {
                  haptic.tap();
                  setBwMode('bw');
                  setTargetWeight(0);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                  bwMode === 'bw' ? 'bg-ice/20 text-ice border border-ice/30' : 'text-muted hover:text-fg'
                }`}
              >
                Pure Bodyweight
              </button>
              <button
                onClick={() => {
                  haptic.tap();
                  setBwMode('weighted');
                  if (targetWeight <= 0) setTargetWeight(5);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                  bwMode === 'weighted' ? 'bg-peach/20 text-peach border border-peach/30' : 'text-muted hover:text-fg'
                }`}
              >
                Weighted (+kg)
              </button>
              <button
                onClick={() => {
                  haptic.tap();
                  setBwMode('assisted');
                  if (targetWeight <= 0) setTargetWeight(10);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                  bwMode === 'assisted' ? 'bg-mint/20 text-mint border border-mint/30' : 'text-muted hover:text-fg'
                }`}
              >
                Assisted (-kg)
              </button>
            </div>

            {/* Total Load Display */}
            <div className="rounded-2xl border border-white/10 bg-ink-950/80 p-4">
              <div className="label">
                {bwMode === 'bw'
                  ? 'Pure Bodyweight Exercise'
                  : bwMode === 'weighted'
                  ? 'Added Load (Dip Belt / Vest)'
                  : 'Counterweight / Band Assistance'}
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div className="num text-3xl font-black text-fg">
                  {bwMode === 'bw'
                    ? 'BW'
                    : bwMode === 'weighted'
                    ? `+${fmtNum(targetWeight, 1)} ${settings.unit}`
                    : `-${fmtNum(targetWeight, 1)} ${settings.unit}`}
                </div>
                <div className="text-xs font-mono text-muted">
                  Athlete BW: <strong>{userBw} {settings.unit}</strong>
                </div>
              </div>

              {/* Effective Load Math */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-ink-900 p-2.5 text-xs text-slate-300 font-mono">
                <span>Total System Load:</span>
                <span className="font-bold text-fg">
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
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Quick Steppers
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(bwMode === 'weighted'
                    ? [2.5, 5, 7.5, 10, 12.5, 15, 20, 25]
                    : [5, 10, 15, 20, 25, 30]
                  ).map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        haptic.tap();
                        setTargetWeight(val);
                      }}
                      className={`chip text-xs font-mono ${
                        targetWeight === val ? 'bg-ice/20 text-ice border-ice/40 font-bold' : ''
                      }`}
                    >
                      {bwMode === 'weighted' ? `+${val}` : `-${val}`} {settings.unit}
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
          <div className="space-y-5">
            {/* Machine Type Toggle */}
            <div className="flex rounded-xl bg-ink-950/90 p-1 border border-white/10 gap-1">
              <button
                onClick={() => {
                  haptic.tap();
                  setMachineMode('stack');
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                  machineMode === 'stack' ? 'bg-lav/20 text-lav border border-lav/30' : 'text-muted hover:text-fg'
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
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                  machineMode === 'sled' ? 'bg-peach/20 text-peach border border-peach/30' : 'text-muted hover:text-fg'
                }`}
              >
                Plate-Loaded Sled (Leg Press)
              </button>
            </div>

            {/* Target Display */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-ink-950/70 p-4">
              <div>
                <div className="label">
                  {machineMode === 'stack' ? 'Machine Stack Setting' : 'Total Leg Press / Sled Weight'}
                </div>
                <div className="num mt-1 text-3xl font-black text-fg">
                  {fmtNum(targetWeight, 1)}{' '}
                  <span className="text-base font-normal text-muted">{settings.unit}</span>
                </div>
                {machineMode === 'sled' && (
                  <div className="mt-1 text-xs text-muted">
                    Sled base: {sledWeight} {settings.unit} + {fmtNum(Math.max(0, targetWeight - sledWeight), 1)} {settings.unit} plates
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => bump(-2.5)}
                  className="btn-ghost h-11 w-11 p-0 text-lg font-bold"
                >
                  -
                </button>
                <button
                  onClick={() => bump(+2.5)}
                  className="btn-ghost h-11 w-11 p-0 text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Pin Stack Grid if Stack Mode */}
            {machineMode === 'stack' ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-ink-900/90 p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Pin Stack Plates ({settings.unit})
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                    {MACHINE_STACK.map((w) => (
                      <button
                        key={w}
                        onClick={() => {
                          haptic.tap();
                          setTargetWeight(w + microAddon);
                        }}
                        className={`rounded-xl py-2 font-mono text-xs font-bold transition-all ${
                          Math.floor(targetWeight) === w
                            ? 'bg-lav text-ink-950 ring-2 ring-lav/50 shadow-md font-black scale-105'
                            : 'border border-white/10 bg-ink-950/60 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Magnetic Micro-Plates */}
                <div className="flex items-center justify-between rounded-xl bg-ink-950/70 p-3 border border-white/5">
                  <span className="text-xs text-muted">Magnetic micro-plate add-on:</span>
                  <div className="flex gap-1.5">
                    {[0, 1.25, 2.5].map((addon) => (
                      <button
                        key={addon}
                        onClick={() => {
                          haptic.tap();
                          setMicroAddon(addon);
                          setTargetWeight((w) => Math.floor(w / 5) * 5 + addon);
                        }}
                        className={`chip text-xs font-mono ${
                          microAddon === addon ? 'bg-lav/20 text-lav border-lav/40 font-bold' : ''
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
              <div className="rounded-2xl border border-white/10 bg-ink-900/90 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold uppercase tracking-wider">Per Side Plate Breakdown</span>
                  <span>
                    Sled: <strong>{sledWeight} {settings.unit}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
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
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300"
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: PLATE_COLOR[String(weight)] || '#C8B6FF' }}
                          />
                          <strong>{weight} {settings.unit}</strong> × {count}
                        </span>
                      ))
                  ) : (
                    <span className="text-dim">Just push the empty sled ({sledWeight} {settings.unit}).</span>
                  )}
                </div>
              </div>
            )}

            {/* Stepper buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[-20, -10, -5, -2.5, +2.5, +5, +10, +20].map((delta) => (
                <button
                  key={delta}
                  onClick={() => bump(delta)}
                  className="chip hover:border-white/20 active:scale-95 text-xs font-mono"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>

            {/* Doc Progression Rule Tip */}
            <div className="rounded-xl border border-lav/20 bg-lav/5 p-3 text-xs text-lav/90 flex items-start gap-2">
              <Sparkles size={15} className="shrink-0 mt-0.5 text-lav" />
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
