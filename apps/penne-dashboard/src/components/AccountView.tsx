import React, { useState } from 'react';
import { User, AuthSession, Transaction } from '@packages/types';
import { Button, Badge } from '@packages/ui';
import {
  Copy,
  Check,
  LogOut,
  Clock,
  Key,
  Server
} from 'lucide-react';
import { UserProfileSkeleton } from './Skeleton';

interface AccountViewProps {
  user: User | null;
  authToken: string | null;
  transactions?: Transaction[];
  isMockMode: boolean;
  recentSessions: AuthSession[];
  onToggleMock: () => void;
  onLogout: () => void;
  isLoadingUser?: boolean;
  isLoadingTransactions?: boolean;
}

const formatINR = (val: number) => {
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  authToken,
  isMockMode,
  recentSessions,
  onToggleMock,
  onLogout,
  isLoadingUser
}) => {
  const [copied, setCopied] = useState(false);

  // Local storage state for spending limits
  const [cardLimit, setCardLimit] = useState<number>(() => {
    const saved = localStorage.getItem('penne_limit_bank_card');
    const val = saved ? Number(saved) : 25000;
    return Math.min(50000, Math.max(0, isNaN(val) ? 25000 : val));
  });

  const [bankLimit, setBankLimit] = useState<number>(() => {
    const saved = localStorage.getItem('penne_limit_bank_account');
    const val = saved ? Number(saved) : 10000;
    return Math.min(10000, Math.max(0, isNaN(val) ? 10000 : val));
  });

  const [cardLimitStr, setCardLimitStr] = useState<string>(() => String(cardLimit));
  const [bankLimitStr, setBankLimitStr] = useState<string>(() => String(bankLimit));

  const handleCardLimitChange = (val: number) => {
    const clamped = Math.min(50000, Math.max(0, val));
    setCardLimit(clamped);
    setCardLimitStr(String(clamped));
    localStorage.setItem('penne_limit_bank_card', String(clamped));
  };

  const handleBankLimitChange = (val: number) => {
    const clamped = Math.min(10000, Math.max(0, val));
    setBankLimit(clamped);
    setBankLimitStr(String(clamped));
    localStorage.setItem('penne_limit_bank_account', String(clamped));
  };

  const handleCardInputBlur = () => {
    const num = Number(cardLimitStr);
    const clamped = isNaN(num) ? 0 : Math.min(50000, Math.max(0, num));
    setCardLimit(clamped);
    setCardLimitStr(String(clamped));
    localStorage.setItem('penne_limit_bank_card', String(clamped));
  };

  const handleBankInputBlur = () => {
    const num = Number(bankLimitStr);
    const clamped = isNaN(num) ? 0 : Math.min(10000, Math.max(0, num));
    setBankLimit(clamped);
    setBankLimitStr(String(clamped));
    localStorage.setItem('penne_limit_bank_account', String(clamped));
  };

  const handleCopyToken = () => {
    if (authToken) {
      navigator.clipboard?.writeText?.(authToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const userName = user?.name || 'Barath Surya';
  const firstLetter = userName.charAt(0).toUpperCase();

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fadeIn pb-28 overflow-x-hidden">
      {/* Profile Card */}
      {isLoadingUser ? (
        <UserProfileSkeleton />
      ) : (
        <div className="velvet-card p-4 sm:p-5 flex items-center gap-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#232044] border-2 border-[#FBD8B3] flex items-center justify-center text-[#FBD8B3] text-xl font-black shadow-md shrink-0 aspect-square font-mono">
            {firstLetter}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-extrabold text-white truncate tracking-tight">
              {userName} <span className="text-slate-400 font-normal text-xs">• Principal User</span>
            </h2>
            <p className="text-[11px] sm:text-xs font-mono text-slate-400 truncate mt-0.5">
              UUID: {user?.uuid || '88a62c21-penne-core'}
            </p>
            <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full bg-[#FBD8B3]/15 text-[#FBD8B3] text-[9px] font-mono font-bold border border-[#FBD8B3]/30 tracking-wider">
              ACTIVE AUTH SESSION
            </span>
          </div>
        </div>
      )}

      {/* Payment Method Spending Limits Settings (Interactive Sliders + Type-in) */}
      <div className="velvet-card p-4 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Rail Burn Limits (Monthly)
          </span>
          <span className="text-[10px] font-mono text-[#FBD8B3] font-bold">Instant Reactive</span>
        </div>

        {/* Card Limit Slider & Type-in (0 - 50k) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300">Obsidian CC Limit</span>
            <div className="flex items-center gap-1 bg-[#1A1835] border border-white/10 focus-within:border-[#FBD8B3] rounded-lg px-2 py-0.5 transition-colors">
              <span className="text-[11px] font-mono text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                max="50000"
                step="500"
                value={cardLimitStr}
                onChange={(e) => {
                  const raw = e.target.value;
                  setCardLimitStr(raw);
                  const num = Number(raw);
                  if (!isNaN(num) && num >= 0 && num <= 50000) {
                    setCardLimit(num);
                    localStorage.setItem('penne_limit_bank_card', String(num));
                  }
                }}
                onBlur={handleCardInputBlur}
                className="w-16 bg-transparent text-right font-mono font-bold text-xs text-[#FBD8B3] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                aria-label="Obsidian CC Limit input"
              />
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="50000"
            step="1000"
            value={cardLimit}
            onChange={(e) => handleCardLimitChange(Number(e.target.value))}
            className="w-full custom-slider cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>₹0</span>
            <span>₹25,000</span>
            <span>₹50,000</span>
          </div>
        </div>

        {/* Bank Limit Slider & Type-in (0 - 10k) */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300">Primary Bank Vault Limit</span>
            <div className="flex items-center gap-1 bg-[#1A1835] border border-white/10 focus-within:border-[#A7D7F9] rounded-lg px-2 py-0.5 transition-colors">
              <span className="text-[11px] font-mono text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                max="10000"
                step="250"
                value={bankLimitStr}
                onChange={(e) => {
                  const raw = e.target.value;
                  setBankLimitStr(raw);
                  const num = Number(raw);
                  if (!isNaN(num) && num >= 0 && num <= 10000) {
                    setBankLimit(num);
                    localStorage.setItem('penne_limit_bank_account', String(num));
                  }
                }}
                onBlur={handleBankInputBlur}
                className="w-16 bg-transparent text-right font-mono font-bold text-xs text-[#A7D7F9] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                aria-label="Primary Bank Vault Limit input"
              />
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="10000"
            step="500"
            value={bankLimit}
            onChange={(e) => handleBankLimitChange(Number(e.target.value))}
            className="w-full custom-slider cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>₹0</span>
            <span>₹5,000</span>
            <span>₹10,000</span>
          </div>
        </div>
      </div>

      {/* Connection & Backend Dispatch Rail */}
      <div className="velvet-card p-4 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
          <Server className="w-3.5 h-3.5 text-[#FBD8B3]" />
          <span>Backend Connection Rail</span>
        </div>
        <div className="p-3 bg-[#232044] rounded-2xl border border-white/5 flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <p className="font-semibold text-slate-200 truncate">
              {!isMockMode ? 'Live Go Server' : 'In-Memory Demo Mode'}
            </p>
            <p className="text-[10px] font-mono text-slate-400 truncate">
              {!isMockMode ? 'http://localhost:8080/api' : 'Local browser simulated store'}
            </p>
          </div>
          <button
            onClick={onToggleMock}
            className="px-3.5 py-1.5 rounded-xl bg-[#FBD8B3] hover:bg-[#f7c495] text-[#1A1835] font-black font-mono text-[11px] shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            {!isMockMode ? 'Use Demo' : 'Go Live'}
          </button>
        </div>
      </div>

      {/* Session Token Drawer */}
      {authToken && (
        <div className="velvet-card p-4 space-y-2 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
            <Key className="w-3.5 h-3.5 text-[#FBD8B3]" />
            <span>Bearer Authorization Token</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={authToken}
              className="flex-1 px-3 py-2 bg-[#232044] border border-white/10 rounded-xl text-xs font-mono text-slate-300 overflow-hidden text-ellipsis select-all"
            />
            <button
              onClick={handleCopyToken}
              className="px-3.5 py-2 rounded-xl bg-[#FBD8B3] hover:bg-[#f7c495] text-[#1A1835] font-mono text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#1A1835]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cached Local Sessions */}
      {recentSessions.length > 0 && (
        <div className="velvet-card p-4 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
            <Clock className="w-3.5 h-3.5 text-[#FBD8B3]" /> Cached Local Sessions ({recentSessions.length})
          </h3>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {recentSessions.map((session) => (
              <div
                key={session.token}
                className="bg-[#232044] border border-white/5 rounded-2xl p-2.5 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{session.name}</p>
                  <p className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">
                    {session.token}
                  </p>
                </div>
                <Badge variant="sage" className="text-[10px]">
                  Cached
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign Out Button */}
      <div className="pt-2">
        <Button
          variant="danger"
          size="lg"
          onClick={onLogout}
          className="w-full gap-2 font-black shadow-lg font-mono text-xs cursor-pointer py-3 hover:scale-[1.01] active:scale-98 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Account</span>
        </Button>
      </div>
    </div>
  );
};
