import React from 'react';
import { useStore } from '@/store';
import { Page, PageHeader, Card, SectionTitle, Segmented } from '@/components/ui';
import { Toggle, Button } from '@packages/ui';
import { haptic } from '@/lib/feedback';
import { User, Scale, Bell, Vibrate, Target, RotateCcw, ShieldCheck } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetDemoData, toast } = useStore();

  const handleUnitChange = (unit: 'kg' | 'lb') => {
    haptic.tap();
    const bar = unit === 'kg' ? 20 : 45;
    updateSettings({ unit, barWeight: bar });
    toast({
      tone: 'mint',
      title: 'Unit Changed',
      body: `Default units set to ${unit.toUpperCase()}`,
    });
  };

  const handleReset = () => {
    if (window.confirm('Reset all app data to mock training routines and history?')) {
      haptic.click();
      resetDemoData();
      toast({
        tone: 'mint',
        title: 'Demo Data Restored',
        body: 'Fresh workout routines and 12-week history loaded.',
      });
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Preferences"
        title="Settings & Hardware"
        subtitle="Configure barbell weights, measurement units, audio ducking, and tactile feedback."
      />

      <div className="space-y-6 max-w-2xl">
        {/* Profile Card */}
        <Card className="p-5">
          <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
            <div className="rounded-xl bg-white/5 p-2.5 text-peach">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-fg">Athlete Profile</h3>
              <p className="text-xs text-muted">Personal display name and bio</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="label mb-1.5 block">Display Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              className="input font-bold"
            />
          </div>
        </Card>

        {/* Units & Barbell Card */}
        <Card className="p-5">
          <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
            <div className="rounded-xl bg-white/5 p-2.5 text-mint">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-fg">Units & Equipment</h3>
              <p className="text-xs text-muted">Weight calculations and default plates</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-fg">Weight Units</span>
                <p className="text-xs text-muted">Kilograms (kg) or Pounds (lb)</p>
              </div>
              <Segmented<'kg' | 'lb'>
                value={settings.unit}
                onChange={handleUnitChange}
                options={[
                  { value: 'kg', label: 'Metric (KG)' },
                  { value: 'lb', label: 'Imperial (LB)' },
                ]}
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <div>
                <span className="text-sm font-semibold text-fg">Olympic Barbell Weight</span>
                <p className="text-xs text-muted">Default bar weight for plate calculations</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.barWeight}
                  onChange={(e) => updateSettings({ barWeight: Number(e.target.value) })}
                  className="w-20 rounded-xl border border-white/10 bg-ink-900 px-2 py-1 text-center font-mono text-sm font-bold text-fg"
                />
                <span className="text-xs font-mono text-muted">{settings.unit}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Feedback & Rest Timer */}
        <Card className="p-5">
          <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
            <div className="rounded-xl bg-white/5 p-2.5 text-lav">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-fg">Haptics & Audio</h3>
              <p className="text-xs text-muted">In-gym sensory cues between sets</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-fg">Auto-Start Rest Timer</span>
                <p className="text-xs text-muted">Trigger countdown automatically when a set is logged</p>
              </div>
              <Toggle
                checked={settings.autoStartRest}
                onChange={(v) => updateSettings({ autoStartRest: v })}
                label="Auto rest timer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <div>
                <span className="text-sm font-semibold text-fg">Audio Chimes & Tones</span>
                <p className="text-xs text-muted">Play countdown blips and rest completion tones</p>
              </div>
              <Toggle
                checked={settings.sound}
                onChange={(v) => updateSettings({ sound: v })}
                label="Sound effects"
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <div>
                <span className="text-sm font-semibold text-fg">Tactile Haptic Feedback</span>
                <p className="text-xs text-muted">Mechanical click on set log and PR fanfare vibration</p>
              </div>
              <Toggle
                checked={settings.haptics}
                onChange={(v) => updateSettings({ haptics: v })}
                label="Haptic vibrations"
              />
            </div>
          </div>
        </Card>

        {/* Weekly Target */}
        <Card className="p-5">
          <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
            <div className="rounded-xl bg-white/5 p-2.5 text-peach">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-fg">Consistency Goal</h3>
              <p className="text-xs text-muted">Target training sessions per week</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted">Weekly workouts:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateSettings({ weeklyGoal: Math.max(1, settings.weeklyGoal - 1) })}
                className="btn-ghost h-8 w-8 p-0"
              >
                -
              </button>
              <span className="num text-xl font-black text-fg">{settings.weeklyGoal}</span>
              <button
                onClick={() => updateSettings({ weeklyGoal: Math.min(7, settings.weeklyGoal + 1) })}
                className="btn-ghost h-8 w-8 p-0"
              >
                +
              </button>
            </div>
          </div>
        </Card>

        {/* Demo Data Reset */}
        <div className="pt-4">
          <button
            onClick={handleReset}
            className="btn-danger w-full flex items-center justify-center gap-2 py-3"
          >
            <RotateCcw size={16} /> Reset All Demo Data to Defaults
          </button>
          <p className="mt-2 text-center text-xs text-dim">
            Restores initial PPL routines and 12-week historical progressive overload data.
          </p>
        </div>
      </div>
    </Page>
  );
};
