import React, { useState, useEffect } from 'react';
import { Page, PageHeader, Card, Ring, Segmented } from '@/components/ui';
import { Button } from '@packages/ui';
import { fmtClock } from '@/lib/calc';
import { sound, haptic } from '@/lib/feedback';
import { Play, Pause, RotateCcw, Plus, Minus, Bell, Flame } from 'lucide-react';

type TimerType = 'rest' | 'emom' | 'amrap' | 'tabata';

export const TimerStandaloneView: React.FC = () => {
  const [mode, setMode] = useState<TimerType>('rest');

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState(90);
  const [restRemaining, setRestRemaining] = useState(90);
  const [isRestRunning, setIsRestRunning] = useState(false);

  // EMOM State
  const [emomTotalMins, setEmomTotalMins] = useState(10);
  const [emomCurrentMin, setEmomCurrentMin] = useState(1);
  const [emomSecInMin, setEmomSecInMin] = useState(60);
  const [isEmomRunning, setIsEmomRunning] = useState(false);

  // AMRAP State
  const [amrapMins, setAmrapMins] = useState(12);
  const [amrapRemaining, setAmrapRemaining] = useState(12 * 60);
  const [amrapReps, setAmrapReps] = useState(0);
  const [isAmrapRunning, setIsAmrapRunning] = useState(false);

  // Rest timer ticker
  useEffect(() => {
    if (!isRestRunning) return;
    const id = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          sound.chime();
          haptic.done();
          setIsRestRunning(false);
          return restSeconds;
        }
        if (prev <= 4) {
          sound.blip();
          haptic.tick();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRestRunning, restSeconds]);

  // EMOM ticker
  useEffect(() => {
    if (!isEmomRunning) return;
    const id = setInterval(() => {
      setEmomSecInMin((prev) => {
        if (prev <= 1) {
          sound.beep();
          haptic.click();
          if (emomCurrentMin >= emomTotalMins) {
            sound.fanfare();
            haptic.done();
            setIsEmomRunning(false);
            return 60;
          }
          setEmomCurrentMin((m) => m + 1);
          return 60;
        }
        if (prev <= 4) {
          sound.blip();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isEmomRunning, emomCurrentMin, emomTotalMins]);

  // AMRAP ticker
  useEffect(() => {
    if (!isAmrapRunning) return;
    const id = setInterval(() => {
      setAmrapRemaining((prev) => {
        if (prev <= 1) {
          sound.fanfare();
          haptic.done();
          setIsAmrapRunning(false);
          return amrapMins * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isAmrapRunning, amrapMins]);

  return (
    <Page>
      <PageHeader
        eyebrow="Precision Timekeeper"
        title="Interval & Gym Timers"
        subtitle="Rest timers, metronome EMOM cycles, and AMRAP clocks with audio ducking and haptic chimes."
      />

      {/* Mode Switcher */}
      <div className="mb-8 flex justify-center">
        <Segmented<TimerType>
          value={mode}
          onChange={(m) => {
            haptic.tap();
            setMode(m);
            setIsRestRunning(false);
            setIsEmomRunning(false);
            setIsAmrapRunning(false);
          }}
          options={[
            { value: 'rest', label: 'Rest Timer' },
            { value: 'emom', label: 'EMOM' },
            { value: 'amrap', label: 'AMRAP' },
          ]}
        />
      </div>

      {/* Mode 1: Rest Timer */}
      {mode === 'rest' && (
        <Card className="p-8 flex flex-col items-center justify-center max-w-lg mx-auto">
          <Ring
            value={(restSeconds - restRemaining) / restSeconds}
            size={220}
            stroke={12}
            color="#A8E6CF"
            track="rgba(255,255,255,0.08)"
          >
            <div className="flex flex-col items-center">
              <span className="num text-5xl font-black text-mint tracking-tight">
                {fmtClock(restRemaining)}
              </span>
              <span className="text-xs uppercase font-mono text-muted mt-1">
                Target: {fmtClock(restSeconds)}
              </span>
            </div>
          </Ring>

          {/* Quick preset chips */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[30, 60, 90, 120, 180].map((s) => (
              <button
                key={s}
                onClick={() => {
                  haptic.tap();
                  setRestSeconds(s);
                  setRestRemaining(s);
                  setIsRestRunning(false);
                }}
                className={`chip ${restSeconds === s ? 'chip-active' : ''}`}
              >
                {fmtClock(s)}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={() => {
                haptic.tap();
                setRestRemaining(restSeconds);
                setIsRestRunning(false);
              }}
              className="btn-ghost p-3 rounded-full"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={() => {
                haptic.click();
                sound.prime();
                setIsRestRunning(!isRestRunning);
              }}
              className="btn-mint px-8 py-4 text-base font-black rounded-2xl shadow-xl shadow-mint/20"
            >
              {isRestRunning ? <Pause size={20} className="mr-2" /> : <Play size={20} className="mr-2" fill="currentColor" />}
              {isRestRunning ? 'Pause' : 'Start Timer'}
            </button>
          </div>
        </Card>
      )}

      {/* Mode 2: EMOM */}
      {mode === 'emom' && (
        <Card className="p-8 flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="label mb-2">Every Minute on the Minute</div>
          <div className="text-sm text-muted mb-6">
            Minute <strong className="text-peach">{emomCurrentMin}</strong> of {emomTotalMins}
          </div>

          <Ring
            value={(60 - emomSecInMin) / 60}
            size={220}
            stroke={12}
            color="#FBD8B3"
            track="rgba(255,255,255,0.08)"
          >
            <div className="flex flex-col items-center">
              <span className="num text-5xl font-black text-peach tracking-tight">
                :{String(emomSecInMin).padStart(2, '0')}
              </span>
              <span className="text-xs uppercase font-mono text-muted mt-1">
                Round {emomCurrentMin}
              </span>
            </div>
          </Ring>

          {/* Total Minutes adjust */}
          <div className="mt-8 flex items-center gap-4 text-sm font-mono">
            <span className="text-muted">Total rounds:</span>
            <button
              onClick={() => setEmomTotalMins((m) => Math.max(1, m - 1))}
              className="btn-ghost h-8 w-8 p-0"
            >
              -
            </button>
            <span className="text-base font-bold text-fg">{emomTotalMins} mins</span>
            <button
              onClick={() => setEmomTotalMins((m) => m + 1)}
              className="btn-ghost h-8 w-8 p-0"
            >
              +
            </button>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={() => {
                haptic.tap();
                setIsEmomRunning(false);
                setEmomCurrentMin(1);
                setEmomSecInMin(60);
              }}
              className="btn-ghost p-3 rounded-full"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={() => {
                haptic.click();
                sound.prime();
                setIsEmomRunning(!isEmomRunning);
              }}
              className="btn-primary px-8 py-4 text-base font-black rounded-2xl"
            >
              {isEmomRunning ? <Pause size={20} className="mr-2" /> : <Play size={20} className="mr-2" fill="currentColor" />}
              {isEmomRunning ? 'Pause' : 'Start EMOM'}
            </button>
          </div>
        </Card>
      )}

      {/* Mode 3: AMRAP */}
      {mode === 'amrap' && (
        <Card className="p-8 flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="label mb-2">As Many Reps / Rounds as Possible</div>
          <div className="text-sm text-muted mb-6">{amrapMins} Minute Countdown</div>

          <Ring
            value={(amrapMins * 60 - amrapRemaining) / (amrapMins * 60)}
            size={200}
            stroke={10}
            color="#FFB5A7"
            track="rgba(255,255,255,0.08)"
          >
            <div className="flex flex-col items-center">
              <span className="num text-4xl font-black text-coral tracking-tight">
                {fmtClock(amrapRemaining)}
              </span>
            </div>
          </Ring>

          {/* Giant Rep Counter */}
          <div className="mt-6 flex flex-col items-center">
            <span className="text-xs uppercase font-mono text-muted">Completed Reps / Rounds</span>
            <span className="num text-5xl font-black text-fg mt-1">{amrapReps}</span>
            <button
              onClick={() => {
                haptic.click();
                setAmrapReps((r) => r + 1);
              }}
              className="btn-mint mt-4 px-8 py-3 text-sm font-black rounded-xl"
            >
              +1 Rep Completed
            </button>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={() => {
                haptic.tap();
                setIsAmrapRunning(false);
                setAmrapRemaining(amrapMins * 60);
                setAmrapReps(0);
              }}
              className="btn-ghost p-3 rounded-full"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={() => {
                haptic.click();
                sound.prime();
                setIsAmrapRunning(!isAmrapRunning);
              }}
              className="btn-danger px-8 py-3 text-sm font-black rounded-xl"
            >
              {isAmrapRunning ? 'Pause' : 'Start AMRAP'}
            </button>
          </div>
        </Card>
      )}
    </Page>
  );
};
