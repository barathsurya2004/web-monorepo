import React, { useState } from 'react';
import { Button, Input, SegmentedControl, Badge } from '@packages/ui';
import { User, AuthSession } from '@packages/types';
import { Wallet, ShieldCheck, Key, UserPlus, LogIn, Sparkles, ArrowRight, Clock, Copy, Check } from 'lucide-react';

interface AuthCardProps {
  onLoginSuccess: (user: User) => void;
  recentSessions: AuthSession[];
  onRegister: (name: string) => Promise<User>;
  onLoginWithToken: (token: string) => Promise<User>;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  onLoginSuccess,
  recentSessions,
  onRegister,
  onLoginWithToken
}) => {
  const [activeTab, setActiveTab] = useState<'signup' | 'login' | 'recent'>('signup');
  const [name, setName] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const TEST_TOKEN = 'f66dcebd-e275-4b22-83bd-e446e0a45624';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const user = await onRegister(name.trim());
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Failed to create user account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
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
      setError('Cached token expired. Please enter a valid token.');
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
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-[max(env(safe-area-inset-bottom,0px),1rem)] bg-[#020617] relative overflow-hidden w-full max-w-full">
      {/* Apple Ambient Dynamic Background Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-indigo-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Apple Auth Window */}
      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        {/* Top Floating App Icon Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex p-3 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              Penne <span className="text-emerald-400">Budget</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Zero-Based Budgeting • Apple Architecture
            </p>
          </div>
        </div>

        {/* Translucent Glass Card */}
        <div className="bg-slate-900/70 backdrop-blur-3xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          {/* Segmented Control Switcher */}
          <SegmentedControl
            activeId={activeTab}
            onChange={(id) => {
              setError(null);
              setActiveTab(id as any);
            }}
            options={[
              { id: 'signup', label: 'Create Account', icon: <UserPlus className="w-3.5 h-3.5" /> },
              { id: 'login', label: 'Auth Token', icon: <Key className="w-3.5 h-3.5" /> },
              { id: 'recent', label: 'Sessions', icon: <Clock className="w-3.5 h-3.5" /> }
            ]}
          />

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: SIGNUP */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-5 animate-fadeIn">
              <div className="space-y-1 text-left">
                <h3 className="text-base font-bold text-slate-100">Create New Account</h3>
                <p className="text-xs text-slate-400">Registers your user profile and generates a secure Auth Token</p>
              </div>

              <Input
                label="Full Name"
                type="text"
                placeholder="e.g. Barath Surya"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="apple"
                size="lg"
                disabled={loading}
                className="w-full gap-2 shadow-xl"
              >
                <span>{loading ? 'Creating Profile...' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* TAB 2: LOGIN WITH TOKEN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5 animate-fadeIn">
              <div className="space-y-1 text-left">
                <h3 className="text-base font-bold text-slate-100">Sign In with Bearer Token</h3>
                <p className="text-xs text-slate-400">Authenticate using an existing token UUID generated by penne-server</p>
              </div>

              <Input
                label="Auth Token (UUID)"
                type="text"
                placeholder="e.g. f66dcebd-e275-4b22-83bd-e446e0a45624"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                icon={<Key className="w-4 h-4 text-slate-500" />}
                required
              />

              {/* Preset Test Token Helper */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Default Test Token</span>
                  <p className="font-mono text-slate-300 text-[11px] truncate max-w-[200px]">{TEST_TOKEN}</p>
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
                className="w-full gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              </Button>
            </form>
          )}

          {/* TAB 3: RECENT CACHED SESSIONS */}
          {activeTab === 'recent' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1 text-left">
                <h3 className="text-base font-bold text-slate-100">Cached Sessions</h3>
                <p className="text-xs text-slate-400">Tokens stored locally in your browser cache</p>
              </div>

              {recentSessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  No cached sessions found. Create an account or sign in with a token.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {recentSessions.map((session) => (
                    <div
                      key={session.token}
                      onClick={() => handleQuickSessionLogin(session.token)}
                      className="bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-emerald-400 text-sm">
                          {session.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">
                            {session.name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 truncate max-w-[170px]">
                            {session.token}
                          </p>
                        </div>
                      </div>
                      <Badge variant="emerald" className="text-[10px] gap-1">
                        <span>Sign In</span>
                        <ArrowRight className="w-3 h-3" />
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Security Footer */}
          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Token Storage • penne-server Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};
