import React, { useState } from 'react';
import { useStore } from '@/store';
import { haptic } from '@/lib/feedback';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Key,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Sparkles,
  Cloud,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { session, login, signup, loginWithToken, toast } = useStore();
  const [tab, setTab] = useState<'login' | 'signup' | 'token'>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter your email and password');
        }
        await login(email.trim(), password);
        toast({
          tone: 'mint',
          title: 'Welcome Back!',
          body: 'Logged in successfully. Your local workouts are backed up.',
        });
      } else if (tab === 'signup') {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('Please fill in all fields');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await signup(name.trim(), email.trim(), password);
        toast({
          tone: 'mint',
          title: 'Account Created',
          body: 'Account registered. All device workouts are synced!',
        });
      } else {
        if (!tokenInput.trim()) {
          throw new Error('Please enter a valid authentication token');
        }
        await loginWithToken(tokenInput.trim());
        toast({
          tone: 'mint',
          title: 'Connected',
          body: 'Authenticated via token. Backfill sync initiated.',
        });
      }

      haptic.done();
      onClose();
    } catch (err: any) {
      haptic.click();
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoUser = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithToken('f66dcebd-e275-4b22-83bd-e446e0a45624', 'Barath');
      toast({
        tone: 'mint',
        title: 'Demo Connected',
        body: 'Connected with test account. Syncing device data...',
      });
      haptic.done();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick connect failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink-950 p-6 shadow-2xl shadow-mint/10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Glow ambient background element */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-mint/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-peach/15 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={() => {
            haptic.tap();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-muted hover:text-fg rounded-xl hover:bg-white/5 transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-mint/20 to-lav/20 border border-mint/30 shadow-md shadow-mint/20 text-mint">
            <Sparkles size={24} />
          </div>
          <h2 id="auth-modal-title" className="text-xl font-black tracking-tight text-fg">
            {session ? 'Account Connected' : 'Sync Workout History'}
          </h2>
          <p className="mt-1 text-xs text-muted max-w-xs mx-auto">
            {session
              ? `Signed in as ${session.name} (${session.email || session.userUUID.slice(0, 8)}...)`
              : 'Sign in or create an account to back up your routines and session logs to the cloud.'}
          </p>
        </div>

        {/* Data Safety Banner */}
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-mint/25 bg-mint/10 p-3.5 text-xs text-mint">
          <ShieldCheck size={18} className="shrink-0 text-mint mt-0.5" />
          <div>
            <span className="font-bold text-mint">Zero Data Loss Guarantee:</span>
            <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
              All your existing workouts and custom routines on this phone/browser are preserved and will be automatically backfilled to your cloud account upon signing in.
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl border border-coral/30 bg-coral/10 p-3 text-xs text-coral">
            {error}
          </div>
        )}

        {/* Mode Tabs */}
        <div className="mb-4 flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'login' ? 'bg-mint text-ink-950 font-bold shadow' : 'text-muted hover:text-fg'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setTab('signup');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'signup' ? 'bg-mint text-ink-950 font-bold shadow' : 'text-muted hover:text-fg'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setTab('token');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'token' ? 'bg-mint text-ink-950 font-bold shadow' : 'text-muted hover:text-fg'
            }`}
          >
            Token / Demo
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Barath Surya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-ink-900 pl-10 pr-3.5 py-2.5 text-sm text-fg placeholder:text-dim focus:border-mint focus:outline-none"
                />
              </div>
            </div>
          )}

          {tab !== 'token' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-ink-900 pl-10 pr-3.5 py-2.5 text-sm text-fg placeholder:text-dim focus:border-mint focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-ink-900 pl-10 pr-3.5 py-2.5 text-sm text-fg placeholder:text-dim focus:border-mint focus:outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">User Token or UUID</label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="Paste UUID or Bearer Token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-ink-900 pl-10 pr-3.5 py-2.5 text-xs font-mono text-fg placeholder:text-dim focus:border-mint focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Connect directly using your existing Penne / Cadence token.
              </p>

              {/* 1-Click Quick Demo User Connect */}
              <div className="mt-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleQuickDemoUser}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-peach/30 bg-peach/10 py-2 px-3 text-xs font-bold text-peach hover:bg-peach/20 active:scale-95 transition-all"
                >
                  <Sparkles size={14} /> Connect as Barath (Quick Test User)
                </button>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-mint to-mint/90 py-3 px-4 font-bold text-ink-950 shadow-lg shadow-mint/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Connecting & Syncing...</span>
                </>
              ) : (
                <>
                  <span>
                    {tab === 'login'
                      ? 'Log In & Sync Workouts'
                      : tab === 'signup'
                      ? 'Create Account & Backfill Data'
                      : 'Authenticate'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-[10px] text-dim">
          Secure end-to-end synchronization with Penne Cloud Core.
        </p>
      </div>
    </div>
  );
};
