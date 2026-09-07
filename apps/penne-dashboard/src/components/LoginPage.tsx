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
    } catch {
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
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 pt-[max(calc(env(safe-area-inset-top,0px)+1.25rem),2rem)] pb-[max(calc(env(safe-area-inset-bottom,0px)+0.75rem),1.5rem)] bg-[#1A1735] relative overflow-hidden w-full max-w-full">
      {/* Warm Ambient Soft Pastel Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#FBD8B3]/15 via-[#C8B6FF]/10 to-[#A7D7F9]/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex p-3 rounded-3xl bg-[#232044] border border-white/10 shadow-xl shadow-black/40">
            <div className="w-12 h-12 rounded-2xl bg-[#FBD8B3] p-0.5 flex items-center justify-center shadow-md shadow-[#FBD8B3]/20">
              <div className="w-full h-full bg-[#1A1735] rounded-[14px] flex items-center justify-center">
                <Wallet className="w-6 h-6 text-[#FBD8B3]" />
              </div>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-medium tracking-wide text-slate-400 block uppercase font-mono">
              Penne
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              Bill & <span className="text-[#FBD8B3]">Budget</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1 font-mono">
              Zero-Based Expenses & Vault Tracker
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="velvet-card p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="space-y-0.5 text-left">
              <Badge variant="terracotta">Welcome Back</Badge>
              <h2 className="text-lg font-bold text-white">Sign in to Penne</h2>
            </div>
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-[#1A1735] p-1 rounded-xl border border-white/10 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'password' ? 'bg-[#FBD8B3] text-[#1A1835]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('token')}
                className={`px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'token' ? 'bg-[#FBD8B3] text-[#1A1835]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Token
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-[#FFB5A7]/15 border border-[#FFB5A7]/30 text-[#FFB5A7] text-xs font-medium flex items-center gap-2 animate-fadeIn font-mono">
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
                icon={<Mail className="w-4 h-4 text-[#FBD8B3]" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-[#FBD8B3]" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full gap-2 mt-2 font-mono text-xs py-3"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Signing In...' : 'Sign In to Ledger'}</span>
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
                icon={<Key className="w-4 h-4 text-[#FBD8B3]" />}
                required
              />

              {/* Preset Test Token Banner */}
              <div className="bg-[#1A1735] p-3 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                <div className="space-y-0.5 text-left min-w-0">
                  <span className="text-[10px] text-slate-400 font-semibold font-mono uppercase block">Default Test Token</span>
                  <p className="font-mono text-white text-[11px] truncate max-w-[170px]">{TEST_TOKEN}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTokenInput(TEST_TOKEN)}
                    className="px-2.5 py-1 rounded-lg bg-[#FBD8B3]/20 text-[#FBD8B3] border border-[#FBD8B3]/30 hover:bg-[#FBD8B3]/30 transition-all font-mono font-bold text-xs cursor-pointer"
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(TEST_TOKEN)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    {copiedToken === TEST_TOKEN ? <Check className="w-3.5 h-3.5 text-[#A8E6CF]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full gap-2 mt-2 font-mono text-xs py-3"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Validating Token...' : 'Sign In with Token'}</span>
              </Button>
            </form>
          )}

          {/* RECENT CACHED SESSIONS */}
          {recentSessions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Cached Local Sessions
                </span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {recentSessions.map((session) => (
                  <div
                    key={session.token}
                    onClick={() => handleQuickSessionLogin(session.token)}
                    className="bg-[#1A1735] border border-white/10 hover:border-[#FBD8B3]/50 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] group"
                  >
                    <div className="flex items-center gap-2.5 text-left min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#232044] border border-white/5 flex items-center justify-center font-bold text-[#FBD8B3] text-xs shrink-0 font-mono">
                        {session.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-white group-hover:text-[#FBD8B3] transition-colors truncate">
                          {session.name}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                          {session.token}
                        </p>
                      </div>
                    </div>
                    <Badge variant="sage" className="text-[10px] gap-1 shrink-0">
                      <span>Login</span>
                      <ArrowRight className="w-3 h-3" />
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation link to Signup */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Don't have an account?</span>
            <button
              onClick={onNavigateToSignup}
              className="font-bold text-[#FBD8B3] hover:underline transition-colors cursor-pointer"
            >
              Create Account →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
