import React, { useState } from 'react';
import { Button, Input, Badge } from '@packages/ui';
import { User } from '@packages/types';
import { Wallet, UserPlus, ArrowLeft, Mail, Lock, User as UserIcon } from 'lucide-react';

interface SignupPageProps {
  onSignupSuccess: (user: User) => void;
  onNavigateToLogin: () => void;
  onSignup: (name: string, email: string, pass: string) => Promise<User>;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  onSignupSuccess,
  onNavigateToLogin,
  onSignup
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      const newUser = await onSignup(name.trim(), email.trim(), password);
      onSignupSuccess(newUser);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 pt-[max(calc(env(safe-area-inset-top,0px)+1.25rem),2rem)] pb-[max(calc(env(safe-area-inset-bottom,0px)+0.75rem),1.5rem)] bg-[#1A1735] relative overflow-hidden w-full max-w-full">
      {/* Warm Ambient Soft Pastel Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#A8E6CF]/15 via-[#FBD8B3]/10 to-[#C8B6FF]/15 rounded-full blur-[130px] pointer-events-none" />

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
              Create your zero-based ledger account
            </p>
          </div>
        </div>

        {/* Signup Card */}
        <div className="velvet-card p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="space-y-0.5 text-left">
              <Badge variant="terracotta">New Profile</Badge>
              <h2 className="text-lg font-bold text-white">Join Penne Budget</h2>
            </div>
            <button
              onClick={onNavigateToLogin}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-mono font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-[#FFB5A7]/15 border border-[#FFB5A7]/30 text-[#FFB5A7] text-xs font-medium flex items-center gap-2 animate-fadeIn font-mono">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Barath Surya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<UserIcon className="w-4 h-4 text-[#FBD8B3]" />}
              required
            />

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
              placeholder="Create a secure passcode"
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
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating Profile...' : 'Create Account'}</span>
            </Button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400 font-mono">
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="font-bold text-[#FBD8B3] hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
