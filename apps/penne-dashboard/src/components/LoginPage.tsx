import React, { useState } from 'react';
import { Button, Input, Badge } from '@packages/ui';
import { User, AuthSession } from '@packages/types';
import { Wallet, LogIn, ArrowRight, Mail, Lock, Key, Clock, Copy, Check, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 pt-[max(calc(env(safe-area-inset-top,0px)+1.25rem),2rem)] pb-[max(calc(env(safe-area-inset-bottom,0px)+0.75rem),1.5rem)] bg-[#171513] relative overflow-hidden w-full max-w-full">
      {/* Warm Ambient Soft Pastel Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#E07A5F]/15 via-[#81B29A]/10 to-[#F2CC8F]/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex p-3 rounded-3xl bg-[#24201D] border border-[#342F2C] shadow-xl shadow-black/40">
            <div className="w-12 h-12 rounded-2xl bg-[#E07A5F] p-0.5 flex items-center justify-center shadow-md shadow-[#E07A5F]/20">
              <div className="w-full h-full bg-[#1A1715] rounded-[14px] flex items-center justify-center">
                <Wallet className="w-6 h-6 text-[#E07A5F]" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#F4F1DE] flex items-center justify-center gap-2">
              Penne <span className="text-[#E07A5F]">Budget</span>
            </h1>
            <p className="text-xs text-[#A89F95] font-medium mt-1">
              Personal Expenses & Transactions Tracker
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#24201D] border border-[#38322E] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6">
          <div className="flex items-center justify-between border-b border-[#342F2C] pb-4">
            <div className="space-y-0.5 text-left">
              <Badge variant="terracotta">Welcome Back</Badge>
              <h2 className="text-lg font-bold text-[#F4F1DE]">Sign in to Penne</h2>
            </div>
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-[#1A1715] p-1 rounded-xl border border-[#342F2C]">
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  authMode === 'password' ? 'bg-[#38322E] text-[#F4F1DE]' : 'text-[#A89F95] hover:text-[#F4F1DE]'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('token')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  authMode === 'token' ? 'bg-[#38322E] text-[#F4F1DE]' : 'text-[#A89F95] hover:text-[#F4F1DE]'
                }`}
              >
                Token
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-[#E8A598]/15 border border-[#E8A598]/30 text-[#E8A598] text-xs font-medium flex items-center gap-2 animate-fadeIn">
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
                icon={<Mail className="w-4 h-4 text-[#8C837A]" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-[#8C837A]" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full gap-2 mt-2"
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
                icon={<Key className="w-4 h-4 text-[#8C837A]" />}
                required
              />

              {/* Preset Test Token Banner */}
              <div className="bg-[#1A1715] p-3 rounded-2xl border border-[#342F2C] flex items-center justify-between text-xs">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] text-[#A89F95] font-semibold uppercase">Default Test Token</span>
                  <p className="font-mono text-[#F4F1DE] text-[11px] truncate max-w-[170px]">{TEST_TOKEN}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTokenInput(TEST_TOKEN)}
                    className="px-2.5 py-1 rounded-lg bg-[#81B29A]/15 text-[#81B29A] border border-[#81B29A]/30 hover:bg-[#81B29A]/25 transition-all font-semibold text-xs"
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(TEST_TOKEN)}
                    className="p-1.5 rounded-lg text-[#A89F95] hover:text-[#F4F1DE] hover:bg-[#2E2A27] transition-all"
                  >
                    {copiedToken === TEST_TOKEN ? <Check className="w-3.5 h-3.5 text-[#81B29A]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full gap-2 mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Validating Token...' : 'Sign In with Token'}</span>
              </Button>
            </form>
          )}

          {/* RECENT CACHED SESSIONS */}
          {recentSessions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[#342F2C]">
              <div className="flex items-center justify-between text-xs text-[#A89F95]">
                <span className="font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#8C837A]" /> Cached Local Sessions
                </span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {recentSessions.map((session) => (
                  <div
                    key={session.token}
                    onClick={() => handleQuickSessionLogin(session.token)}
                    className="bg-[#1A1715] border border-[#342F2C] hover:border-[#E07A5F]/50 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] group"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="w-8 h-8 rounded-xl bg-[#2E2A27] flex items-center justify-center font-bold text-[#E07A5F] text-xs">
                        {session.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-[#F4F1DE] group-hover:text-[#E07A5F] transition-colors">
                          {session.name}
                        </p>
                        <p className="font-mono text-[10px] text-[#8C837A] truncate max-w-[150px]">
                          {session.token}
                        </p>
                      </div>
                    </div>
                    <Badge variant="sage" className="text-[10px] gap-1">
                      <span>Login</span>
                      <ArrowRight className="w-3 h-3" />
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation link to Signup */}
          <div className="pt-4 border-t border-[#342F2C] flex items-center justify-between text-xs">
            <span className="text-[#A89F95]">Don't have an account?</span>
            <button
              onClick={onNavigateToSignup}
              className="font-bold text-[#E07A5F] hover:text-[#e89078] transition-colors cursor-pointer"
            >
              Create Account →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
