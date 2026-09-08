import React, { useState, useMemo } from 'react';
import { User, AuthSession, Transaction, DashboardSummary, e5ToAmount } from '@packages/types';
import { Button, Badge } from '@packages/ui';
import {
  Copy,
  Check,
  LogOut,
  Clock,
  Key,
  Server,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Landmark,
  Sparkles
} from 'lucide-react';
import { UserProfileSkeleton } from './Skeleton';

interface AccountViewProps {
  user: User | null;
  authToken: string | null;
  transactions?: Transaction[];
  dashboardSummary?: DashboardSummary | null;
  isMockMode: boolean;
  recentSessions: AuthSession[];
  onToggleMock: () => void;
  onLogout: () => void;
  isLoadingUser?: boolean;
  isLoadingTransactions?: boolean;
  isLoadingSummary?: boolean;
}

const formatINR = (val: number) => {
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  authToken,
  transactions = [],
  dashboardSummary,
  isMockMode,
  recentSessions,
  onToggleMock,
  onLogout,
  isLoadingUser,
  isLoadingTransactions,
  isLoadingSummary
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
    return Math.min(20000, Math.max(0, isNaN(val) ? 10000 : val));
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
    const clamped = Math.min(20000, Math.max(0, val));
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
    const clamped = isNaN(num) ? 0 : Math.min(20000, Math.max(0, num));
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

  // Live balances: derive from dashboardSummary if provided, or compute from transactions
  const safeTxns = Array.isArray(transactions) ? transactions : [];

  const {
    totalIncomeAmt,
    totalSpentAmt,
    totalRemainingAmt,
    cardSpentAmt,
    bankSpentAmt,
    effectiveCardLimit,
    effectiveBankLimit,
    cardAvailableAmt,
    bankAvailableAmt,
    hasOptimisticTxn
  } = useMemo(() => {
    let incE5 = 0;
    let expE5 = 0;
    let remE5 = 0;
    let cSpentE5 = 0;
    let bSpentE5 = 0;

    if (dashboardSummary) {
      incE5 = dashboardSummary.total_income_e5;
      expE5 = dashboardSummary.total_expense_e5;
      remE5 = dashboardSummary.total_remaining_e5;
      cSpentE5 = dashboardSummary.card_spent_e5;
      bSpentE5 = dashboardSummary.bank_spent_e5;
    } else {
      incE5 = safeTxns
        .filter((t) => t && t.txn_type === 'credit')
        .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

      const debitTxns = safeTxns.filter((t) => t && t.txn_type === 'debit');

      cSpentE5 = debitTxns
        .filter((t) => t.payment_method === 'bank_card')
        .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

      bSpentE5 = debitTxns
        .filter((t) => t.payment_method !== 'bank_card')
        .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

      expE5 = cSpentE5 + bSpentE5;
      remE5 = incE5 - expE5;
    }

    const effCardLim = (dashboardSummary && dashboardSummary.card_limit_e5 > 0)
      ? e5ToAmount(dashboardSummary.card_limit_e5)
      : cardLimit;

    const effBankLim = (dashboardSummary && dashboardSummary.bank_limit_e5 > 0)
      ? e5ToAmount(dashboardSummary.bank_limit_e5)
      : bankLimit;

    const cSpent = e5ToAmount(cSpentE5);
    const bSpent = e5ToAmount(bSpentE5);

    const isOptimistic = safeTxns.some((t) => t && t.id && (t.id.startsWith('opt-') || t.id.startsWith('txn-opt')));

    return {
      totalIncomeAmt: e5ToAmount(incE5),
      totalSpentAmt: e5ToAmount(expE5),
      totalRemainingAmt: e5ToAmount(remE5),
      cardSpentAmt: cSpent,
      bankSpentAmt: bSpent,
      effectiveCardLimit: effCardLim,
      effectiveBankLimit: effBankLim,
      cardAvailableAmt: Math.max(0, effCardLim - cSpent),
      bankAvailableAmt: Math.max(0, effBankLim - bSpent),
      hasOptimisticTxn: isOptimistic
    };
  }, [dashboardSummary, safeTxns, cardLimit, bankLimit]);

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

      {/* Real-time Account Liquidity & Balances (Optimistic Live UI) */}
      <div className="velvet-card p-5 space-y-4 shadow-xl border border-white/10 relative overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#FBD8B3]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#232044] border border-[#FBD8B3]/30 flex items-center justify-center text-[#FBD8B3]">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block">
                Account Balances
              </span>
              <h3 className="text-xs font-bold text-white font-mono">Net Liquid Funds</h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A1835] border border-[#FBD8B3]/20">
            <span
              className={`w-2 h-2 rounded-full ${
                hasOptimisticTxn ? 'bg-[#FBD8B3] animate-ping' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="text-[10px] font-mono font-bold text-[#FBD8B3]">
              {hasOptimisticTxn ? 'Optimistic Syncing' : 'Instant Active'}
            </span>
          </div>
        </div>

        {/* Big Balance Number */}
        <div className="pt-1">
          <span className="text-xs font-mono text-slate-400 block mb-0.5">Total Available Balance</span>
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white transition-all duration-300">
              {formatINR(totalRemainingAmt)}
            </h1>
            <span className="text-xs font-mono text-slate-400">INR</span>
          </div>
        </div>

        {/* Income vs Spent Summary Badges */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-[#232044] p-3 rounded-xl border border-white/5 space-y-1">
            <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>Total Inflow</span>
            </div>
            <p className="text-sm font-black font-mono text-emerald-300">
              +{formatINR(totalIncomeAmt)}
            </p>
          </div>

          <div className="bg-[#232044] p-3 rounded-xl border border-white/5 space-y-1">
            <div className="flex items-center gap-1 text-[#FBD8B3] text-[10px] font-mono font-bold">
              <TrendingDown className="w-3 h-3" />
              <span>Total Spent</span>
            </div>
            <p className="text-sm font-black font-mono text-[#FBD8B3]">
              -{formatINR(totalSpentAmt)}
            </p>
          </div>
        </div>

        {/* Payment Rails Balances Breakdown */}
        <div className="space-y-3 pt-2 border-t border-white/5 font-mono text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Payment Rails Breakdown
          </span>

          {/* Obsidian Card Rail */}
          <div className="bg-[#1A1835] p-3 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-[#FBD8B3]" />
                <span className="font-semibold text-slate-200">Obsidian CC Rail</span>
              </div>
              <span className="text-[#FBD8B3] font-bold">
                {formatINR(cardAvailableAmt)} available
              </span>
            </div>
            <div className="w-full bg-[#232044] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FBD8B3] to-[#F7A072] rounded-full transition-all duration-300"
                style={{
                  width: `${
                    effectiveCardLimit > 0
                      ? Math.min(100, Math.round((cardSpentAmt / effectiveCardLimit) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Spent: {formatINR(cardSpentAmt)}</span>
              <span>Limit: {formatINR(effectiveCardLimit)}</span>
            </div>
          </div>

          {/* Primary Bank Vault Rail */}
          <div className="bg-[#1A1835] p-3 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <Landmark className="w-3.5 h-3.5 text-[#A7D7F9]" />
                <span className="font-semibold text-slate-200">Primary Bank Vault</span>
              </div>
              <span className="text-[#A7D7F9] font-bold">
                {formatINR(bankAvailableAmt)} available
              </span>
            </div>
            <div className="w-full bg-[#232044] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#A7D7F9] to-[#70B4E8] rounded-full transition-all duration-300"
                style={{
                  width: `${
                    effectiveBankLimit > 0
                      ? Math.min(100, Math.round((bankSpentAmt / effectiveBankLimit) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Spent: {formatINR(bankSpentAmt)}</span>
              <span>Limit: {formatINR(effectiveBankLimit)}</span>
            </div>
          </div>
        </div>
      </div>

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

        {/* Bank Limit Slider & Type-in (0 - 20k) */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300">Primary Bank Vault Limit</span>
            <div className="flex items-center gap-1 bg-[#1A1835] border border-white/10 focus-within:border-[#A7D7F9] rounded-lg px-2 py-0.5 transition-colors">
              <span className="text-[11px] font-mono text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                max="20000"
                step="500"
                value={bankLimitStr}
                onChange={(e) => {
                  const raw = e.target.value;
                  setBankLimitStr(raw);
                  const num = Number(raw);
                  if (!num && num !== 0) return;
                  if (!isNaN(num) && num >= 0 && num <= 20000) {
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
            max="20000"
            step="500"
            value={bankLimit}
            onChange={(e) => handleBankLimitChange(Number(e.target.value))}
            className="w-full custom-slider cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>₹0</span>
            <span>₹10,000</span>
            <span>₹20,000</span>
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
