import React, { useState } from 'react';
import { Button, Input, Card, Badge } from '@packages/ui';
import { User } from '@packages/types';
import { Wallet, UserPlus, ArrowRight, ShieldCheck, Mail, Lock, User as UserIcon } from 'lucide-react';

interface SignupPageProps {
  onSignupSuccess: (user: User) => void;
  onNavigateToLogin: () => void;
  onSignup: (name: string, email: string, password: string) => Promise<User>;
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
      const user = await onSignup(name.trim(), email.trim(), password);
      onSignupSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#020617] relative overflow-hidden">
      {/* Apple Ambient Dynamic Background Glow */}
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
              Zero-Based Budgeting • Signup Page
            </p>
          </div>
        </div>

        {/* Signup Card */}
        <div className="bg-slate-900/70 backdrop-blur-3xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="space-y-1 text-left border-b border-slate-800/60 pb-4">
            <Badge variant="emerald" className="mb-2">
              New User Registration
            </Badge>
            <h2 className="text-xl font-bold text-slate-100">Create your Penne Account</h2>
            <p className="text-xs text-slate-400">Sign up to get your secure auth token and initialize your budget</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Barath Surya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<UserIcon className="w-4 h-4 text-slate-500" />}
              required
            />

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
              variant="apple"
              size="lg"
              disabled={loading}
              className="w-full gap-2 shadow-xl mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Navigation link to Login */}
          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Already have an account?</span>
            <button
              onClick={onNavigateToLogin}
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Sign In →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
