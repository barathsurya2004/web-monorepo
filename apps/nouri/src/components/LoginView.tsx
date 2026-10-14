import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  Flame,
  Target,
  Utensils,
  Camera,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { User } from '../types';
import { api, DEMO_PROFILES } from '../services/api';

interface LoginViewProps {
  onSuccess: (user: User, action: 'login' | 'signup' | 'switch') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'demo'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [calorieGoal, setCalorieGoal] = useState<number>(2250);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { user } = await api.login(email, password);
      onSuccess(user, 'login');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { user } = await api.signup(name, email, password, calorieGoal);
      onSuccess(user, 'signup');
    } catch (err: any) {
      setError(err?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (uuid: string) => {
    const { user } = api.loginWithDemo(uuid);
    onSuccess(user, 'switch');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full flex flex-col justify-center items-center px-4 sm:px-6 pt-[max(calc(env(safe-area-inset-top,0px)+1.5rem),3.25rem)] pb-[max(calc(env(safe-area-inset-bottom,0px)+1rem),2.25rem)] relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-mint/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-lav/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-auto space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-mint/25 to-lav/30 border border-mint/40 shadow-xl shadow-mint/10 mb-1">
            <Utensils className="w-7 h-7 text-mint animate-pulse" />
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-fg">
            Welcome to <span className="bg-gradient-to-r from-mint via-fg to-lav bg-clip-text text-transparent">Nouri</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xs mx-auto">
            AI-powered photo nutrition tracker with instant calorie and macro breakdown
          </p>

          {/* Feature Highlights Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-mint/10 border border-mint/20 text-mint font-medium">
              <Camera className="w-3 h-3" /> Photo & Clipboard AI
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-lav/10 border border-lav/20 text-lav font-medium">
              <Target className="w-3 h-3" /> Macro Ring Goals
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-peach/10 border border-peach/20 text-peach font-medium">
              <Flame className="w-3 h-3" /> Calorie Deficit/Surplus
            </span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="velvet-card rounded-2xl border border-white/10 shadow-2xl p-5 sm:p-6 backdrop-blur-2xl">
          {/* Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-ink-950/80 border border-white/5 text-xs font-medium mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                activeTab === 'login'
                  ? 'bg-ink-800 text-fg shadow-sm font-semibold border border-white/10'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                activeTab === 'signup'
                  ? 'bg-ink-800 text-fg shadow-sm font-semibold border border-white/10'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('demo');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'demo'
                  ? 'bg-mint/20 text-mint shadow-sm font-semibold border border-mint/30'
                  : 'text-mint/80 hover:text-mint'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Demo Mode
            </button>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-ink-900/90 border border-white/10 text-fg text-xs focus:outline-none focus:border-mint transition-colors placeholder:text-muted/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-ink-900/90 border border-white/10 text-fg text-xs focus:outline-none focus:border-mint transition-colors placeholder:text-muted/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 mt-2 rounded-xl bg-gradient-to-r from-mint to-mint/80 text-ink-950 font-display font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-mint/10 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In to Dashboard <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('demo')}
                  className="text-xs text-muted hover:text-mint transition-colors"
                >
                  Just exploring? <span className="underline decoration-mint/50">Try with Demo Mock Data</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SIGNUP */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-ink-900/90 border border-white/10 text-fg text-xs focus:outline-none focus:border-mint transition-colors placeholder:text-muted/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-ink-900/90 border border-white/10 text-fg text-xs focus:outline-none focus:border-mint transition-colors placeholder:text-muted/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-ink-900/90 border border-white/10 text-fg text-xs focus:outline-none focus:border-mint transition-colors placeholder:text-muted/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                    Daily Calorie Target
                  </label>
                  <span className="text-xs font-mono font-bold text-mint">
                    {calorieGoal} kcal
                  </span>
                </div>
                <input
                  type="range"
                  min="1400"
                  max="3800"
                  step="50"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(Number(e.target.value))}
                  className="w-full accent-mint h-1.5 bg-ink-950 rounded-lg cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 mt-2 rounded-xl bg-gradient-to-r from-mint to-mint/80 text-ink-950 font-display font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-mint/10 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account & Start Fresh <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: DEMO ACCOUNTS (MOCK DATA ON DEMAND) */}
          {activeTab === 'demo' && (
            <div className="space-y-3">
              <p className="text-xs text-muted mb-2">
                Select a pre-configured profile to test Nouri with pre-loaded mock meals, macros, and sample daily logs:
              </p>

              <div className="space-y-2">
                {DEMO_PROFILES.map((profile) => (
                  <button
                    key={profile.uuid}
                    type="button"
                    onClick={() => handleSelectDemo(profile.uuid)}
                    className="w-full p-3 rounded-xl bg-ink-900/80 border border-white/10 hover:border-mint/50 hover:bg-ink-800 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-fg group-hover:text-mint transition-colors truncate">
                          {profile.name}
                        </div>
                        <div className="text-[11px] font-mono text-muted flex items-center gap-2">
                          <span>{profile.calorie_goal} kcal target</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-mint">Pre-loaded Mock Data</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-mint group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-muted hover:text-fg transition-colors"
                >
                  ← Return to regular Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-[11px] text-muted/70 font-mono">
            Nouri AI Vision Engine · Standalone PWA Ready
          </p>
        </div>
      </div>
    </div>
  );
};
