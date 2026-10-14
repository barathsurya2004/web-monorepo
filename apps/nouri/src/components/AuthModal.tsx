import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Sparkles, Check, ArrowRight, Flame, Target } from 'lucide-react';
import { User } from '../types';
import { api, DEMO_PROFILES } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, action: 'login' | 'signup' | 'switch') => void;
  initialTab?: 'login' | 'signup' | 'switch';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'switch'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [calorieGoal, setCalorieGoal] = useState<number>(2250);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUser = api.getCurrentUser();

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
      onClose();
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
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = (profile: User) => {
    const user = api.switchDemoProfile(profile.uuid);
    onSuccess(user, 'switch');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 pt-[max(calc(env(safe-area-inset-top,0px)+1rem),1.25rem)] pb-[max(calc(env(safe-area-inset-bottom,0px)+1rem),1.25rem)] sm:p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-ink-850/95 border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl shadow-ink-950/80 overflow-hidden relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="relative px-5 pt-6 pb-4 sm:px-6 sm:pt-7 sm:pb-5 bg-gradient-to-b from-mint/10 via-transparent to-transparent border-b border-white/5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-muted hover:text-fg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-mint/30 to-lav/30 border border-mint/40 flex items-center justify-center shadow-lg shadow-mint/10">
              <Sparkles className="w-5 h-5 text-mint" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-fg">
                {activeTab === 'login' && 'Welcome Back'}
                {activeTab === 'signup' && 'Create Your Account'}
                {activeTab === 'switch' && 'Switch User Profile'}
              </h2>
              <p className="text-xs text-muted">
                {activeTab === 'login' && 'Sign in to access your personal nutrition diary'}
                {activeTab === 'signup' && 'Personalized macro targets & AI vision tracking'}
                {activeTab === 'switch' && 'Quickly toggle between tester profiles'}
              </p>
            </div>
          </div>

          {/* Segmented Tab Bar */}
          <div className="flex items-center p-1 mt-4 rounded-xl bg-ink-900/80 border border-white/5 text-xs font-medium">
            <button
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                activeTab === 'login'
                  ? 'bg-ink-700 text-fg shadow-sm font-semibold'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                activeTab === 'signup'
                  ? 'bg-ink-700 text-fg shadow-sm font-semibold'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => {
                setActiveTab('switch');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                activeTab === 'switch'
                  ? 'bg-lav/20 text-lav border border-lav/30 font-semibold'
                  : 'text-muted hover:text-lav'
              }`}
            >
              Profiles
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs flex items-center gap-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. barath@nouri.ai"
                    className="w-full pl-10 pr-4 py-2.5 bg-ink-900/90 border border-white/10 rounded-xl text-sm text-fg placeholder:text-muted/60 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-ink-900/90 border border-white/10 rounded-xl text-sm text-fg placeholder:text-muted/60 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-mint to-mint/80 text-ink-950 font-bold text-sm shadow-lg shadow-mint/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-muted">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setError(null);
                  }}
                  className="text-xs text-mint hover:underline font-semibold"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Barath Surya"
                    className="w-full pl-10 pr-4 py-2.5 bg-ink-900/90 border border-white/10 rounded-xl text-sm text-fg placeholder:text-muted/60 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. barath@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-ink-900/90 border border-white/10 rounded-xl text-sm text-fg placeholder:text-muted/60 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-ink-900/90 border border-white/10 rounded-xl text-sm text-fg placeholder:text-muted/60 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Daily Calorie Target (kcal)
                </label>
                <div className="relative">
                  <Flame className="w-4 h-4 text-peach absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1200"
                    max="5000"
                    step="50"
                    value={calorieGoal}
                    onChange={(e) => setCalorieGoal(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-ink-900/90 border border-white/10 rounded-xl text-sm text-fg font-mono focus:outline-none focus:border-peach/50 focus:ring-1 focus:ring-peach/50"
                  />
                </div>
                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setCalorieGoal(1850)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${
                      calorieGoal === 1850
                        ? 'bg-peach/20 border-peach text-peach font-bold'
                        : 'bg-ink-900/60 border-white/5 text-muted hover:text-fg'
                    }`}
                  >
                    Cutting (1,850)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalorieGoal(2250)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${
                      calorieGoal === 2250
                        ? 'bg-mint/20 border-mint text-mint font-bold'
                        : 'bg-ink-900/60 border-white/5 text-muted hover:text-fg'
                    }`}
                  >
                    Balanced (2,250)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalorieGoal(2800)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${
                      calorieGoal === 2800
                        ? 'bg-lav/20 border-lav text-lav font-bold'
                        : 'bg-ink-900/60 border-white/5 text-muted hover:text-fg'
                    }`}
                  >
                    Bulking (2,800)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-mint to-mint/80 text-ink-950 font-bold text-sm shadow-lg shadow-mint/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'switch' && (
            <div className="space-y-3">
              <p className="text-xs text-muted mb-2">
                Click any profile to instantly switch context, diary meals, and nutrition goals:
              </p>
              {DEMO_PROFILES.map((profile) => {
                const isActive = currentUser?.uuid === profile.uuid;
                return (
                  <button
                    key={profile.uuid}
                    onClick={() => handleQuickSwitch(profile)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all group ${
                      isActive
                        ? 'bg-mint/10 border-mint/50 shadow-lg shadow-mint/10'
                        : 'bg-ink-900/80 border-white/5 hover:border-white/20 hover:bg-ink-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.name}
                          className="w-10 h-10 rounded-xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-ink-700 border border-white/10 flex items-center justify-center text-sm font-bold text-fg">
                          {profile.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-fg group-hover:text-mint transition-colors">
                            {profile.name}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-mint/20 text-mint font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted font-mono flex items-center gap-2 mt-0.5">
                          <span>{profile.email}</span>
                          <span>•</span>
                          <span className="text-peach">{profile.calorie_goal} kcal</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {isActive ? (
                        <div className="w-6 h-6 rounded-full bg-mint text-ink-950 flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-muted group-hover:border-mint group-hover:text-mint transition-all">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
