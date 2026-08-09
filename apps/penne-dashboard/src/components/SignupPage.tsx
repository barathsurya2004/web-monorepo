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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#171513] relative overflow-hidden">
      {/* Warm Ambient Soft Pastel Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#81B29A]/15 via-[#E07A5F]/10 to-[#F2CC8F]/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex p-3 rounded-3xl bg-[#24201D] border border-[#342F2C] shadow-xl shadow-black/40">
            <div className="w-12 h-12 rounded-2xl bg-[#81B29A] p-0.5 flex items-center justify-center shadow-md shadow-[#81B29A]/20">
              <div className="w-full h-full bg-[#1A1715] rounded-[14px] flex items-center justify-center">
                <Wallet className="w-6 h-6 text-[#81B29A]" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#F4F1DE] flex items-center justify-center gap-2">
              Penne <span className="text-[#81B29A]">Budget</span>
            </h1>
            <p className="text-xs text-[#A89F95] font-medium mt-1">
              Create your personal expense account
            </p>
          </div>
        </div>

        {/* Signup Card */}
        <div className="bg-[#24201D] border border-[#38322E] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6">
          <div className="flex items-center justify-between border-b border-[#342F2C] pb-4">
            <div className="space-y-0.5 text-left">
              <Badge variant="sage">New Account</Badge>
              <h2 className="text-lg font-bold text-[#F4F1DE]">Join Penne Budget</h2>
            </div>
            <button
              onClick={onNavigateToLogin}
              className="text-[#A89F95] hover:text-[#F4F1DE] flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-[#E8A598]/15 border border-[#E8A598]/30 text-[#E8A598] text-xs font-medium flex items-center gap-2 animate-fadeIn">
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
              icon={<UserIcon className="w-4 h-4 text-[#8C837A]" />}
              required
            />

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
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-[#8C837A]" />}
              required
            />

            <Button
              type="submit"
              variant="pastelSage"
              size="lg"
              disabled={loading}
              className="w-full gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            </Button>
          </form>

          <div className="pt-4 border-t border-[#342F2C] text-center text-xs text-[#A89F95]">
            Already have an account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="font-bold text-[#81B29A] hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
