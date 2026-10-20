import React from 'react';
import { useStore } from '@/store';
import { Page, PageHeader, Card, SectionTitle, Segmented } from '@/components/ui';
import { Toggle, Button } from '@packages/ui';
import { haptic } from '@/lib/feedback';
import { User, Scale, Bell, Vibrate, Target, RotateCcw, ShieldCheck, Cloud, CloudOff, RefreshCw, LogOut, LogIn, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetDemoData,
    toast,
    session,
    syncStatus,
    lastSyncedAt,
    openAuthModal,
    triggerPushSync,
    logout,
  } = useStore();

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
    if (window.confirm('Restore default PDF training routines and clear logged workout history?')) {
      haptic.click();
      resetDemoData();
      toast({
        tone: 'mint',
        title: 'Routines Restored',
        body: 'Program routines reset and workout history cleared.',
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
        {/* Account & Cloud Sync Card */}
        <Card className="p-5 border-mint/20 bg-gradient-to-br from-white/[0.04] to-mint/[0.03]">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-mint/10 p-2.5 text-mint border border-mint/20">
                <Cloud size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-fg">Account & Cloud Backup</h3>
                <p className="text-xs text-muted">
                  {session ? 'Workouts securely synced to cloud' : 'Local device mode (offline resilient)'}
                </p>
              </div>
            </div>

            {session ? (
              <span className="flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-2.5 py-1 text-[11px] font-bold text-mint font-mono">
                {syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw size={12} className="animate-spin text-mint" /> Syncing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} className="text-mint" /> Connected
                  </>
                )}
              </span>
            ) : (
              <button
                onClick={() => {
                  haptic.tap();
                  openAuthModal();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-peach/30 bg-peach/10 px-3 py-1.5 text-xs font-bold text-peach hover:bg-peach/20 active:scale-95 transition-all shadow-sm"
              >
                <LogIn size={13} /> Sign In
              </button>
            )}
          </div>

          <div className="mt-4">
            {session ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-black/20 p-3 border border-white/5">
                  <div>
                    <p className="text-xs font-semibold text-fg">{session.name}</p>
                    <p className="text-[11px] text-muted font-mono truncate max-w-xs">
                      {session.email || `UUID: ${session.userUUID}`}
                    </p>
                  </div>
                  {lastSyncedAt && (
                    <span className="text-[10px] text-dim font-mono">
                      Last sync: {new Date(lastSyncedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      haptic.tap();
                      triggerPushSync();
                      toast({
                        tone: 'mint',
                        title: 'Syncing',
                        body: 'Pushing latest workouts to cloud server...',
                      });
                    }}
                    disabled={syncStatus === 'syncing'}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-mint/30 bg-mint/10 py-2 px-3 text-xs font-bold text-mint hover:bg-mint/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                    Sync Now
                  </button>
                  <button
                    onClick={() => {
                      haptic.tap();
                      if (window.confirm('Log out of this cloud account? Your workouts remain safely stored on this device.')) {
                        logout();
                        toast({
                          tone: 'amber',
                          title: 'Signed Out',
                          body: 'Device workouts preserved locally.',
                        });
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs font-medium text-slate-400 hover:text-coral hover:border-coral/30 hover:bg-coral/5 active:scale-95 transition-all"
                  >
                    <LogOut size={13} /> Log Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 rounded-xl border border-peach/20 bg-peach/5 p-3 text-xs text-slate-300">
                  <ShieldCheck size={16} className="text-peach shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    You have active workout data stored on this device. When you log in, all historical sessions and routines will be seamlessly backfilled to your cloud account without any data loss.
                  </p>
                </div>
                <button
                  onClick={() => {
                    haptic.tap();
                    openAuthModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-peach to-peach/90 py-2.5 px-4 text-xs font-bold text-ink-950 shadow-md shadow-peach/15 hover:opacity-95 active:scale-95 transition-all"
                >
                  <LogIn size={14} /> Connect Cloud Account & Backfill History
                </button>
              </div>
            )}
          </div>
        </Card>

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

        {/* Data Reset */}
        <div className="pt-4">
          <button
            onClick={handleReset}
            className="btn-danger w-full flex items-center justify-center gap-2 py-3"
          >
            <RotateCcw size={16} /> Restore Default Program Routines & Clear History
          </button>
          <p className="mt-2 text-center text-xs text-dim">
            Restores the program routines from your PDF and wipes local workout session logs.
          </p>
        </div>
      </div>
    </Page>
  );
};
