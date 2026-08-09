import React, { useState } from 'react';
import { Button, Input, Badge } from '@packages/ui';
import { User, AuthSession } from '@packages/types';
import { Wallet, LogIn, ArrowRight, Mail, Lock, Key, Clock, Copy, Check } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToSignup: () => void;
  recentSessions: AuthSession[];
  onLoginWithEmail: (email: string, pass: string) => Promise<User>;
  onLoginWithToken: (token: string) => Promise<User>;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToSignup,
  recentSessions,
  onLoginWithEmail,
  onLoginWithToken
}) => {
  const [authMode, setAuthMode] = useState<'password' | 'token'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const TEST_TOKEN = 'f66dcebd-e275-4b22-83bd-e446e0a45624';

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      const user = await onLoginWithEmail(email.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const user = await onLoginWithToken(tokenInput.trim());
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Invalid or Expired Auth Token');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSessionLogin = async (sessionToken: string) => {
    setError(null);
    setLoading(true);
    try {
      const user = await onLoginWithToken(sessionToken);
      onLoginSuccess(user);
    } catch (err: any) {
      setError('Cached token expired. Please enter your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#020617] relative overflow-hidden">
      {/* Apple Ambient Dynamic Background Light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-indigo-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        {/* Logo Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex p-3 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              Penne <span className="text-emerald-400">Budget</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Zero-Based Budgeting • Login Page
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/70 backdrop-blur-3xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
            <div className="space-y-1 text-left">
              <Badge variant="indigo">Welcome Back</Badge>
              <h2 className="text-xl font-bold text-slate-100">Sign in to Penne</h2>
            </div>
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  authMode === 'password' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('token')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  authMode === 'token' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Token
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* MODE 1: Email & Password */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-fadeIn">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4 text-slate-500" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-500" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full gap-2 shadow-xl mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              </Button>
            </form>
          )}

          {/* MODE 2: Direct Token Input */}
          {authMode === 'token' && (
            <form onSubmit={handleTokenSubmit} className="space-y-4 animate-fadeIn">
              <Input
                label="Auth Token (UUID)"
                type="text"
                placeholder="e.g. f66dcebd-e275-4b22-83bd-e446e0a45624"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                icon={<Key className="w-4 h-4 text-slate-500" />}
                required
              />

              {/* Preset Test Token Banner */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Default Test Token</span>
                  <p className="font-mono text-slate-300 text-[11px] truncate max-w-[190px]">{TEST_TOKEN}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTokenInput(TEST_TOKEN)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-semibold"
                  >
                    Use Test
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(TEST_TOKEN)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                  >
                    {copiedToken === TEST_TOKEN ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full gap-2 shadow-xl mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Validating Token...' : 'Sign In with Token'}</span>
              </Button>
            </form>
          )}

          {/* RECENT CACHED SESSIONS */}
          {recentSessions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Cached Local Sessions
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {recentSessions.map((session) => (
                  <div
                    key={session.token}
                    onClick={() => handleQuickSessionLogin(session.token)}
                    className="bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] group"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-emerald-400 text-xs">
                        {session.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {session.name}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400 truncate max-w-[170px]">
                          {session.token}
                        </p>
                      </div>
                    </div>
                    <Badge variant="emerald" className="text-[10px] gap-1">
                      <span>Login</span>
                      <ArrowRight className="w-3 h-3" />
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation link to Signup */}
          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Don't have an account?</span>
            <button
              onClick={onNavigateToSignup}
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Create Account →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
