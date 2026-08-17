import React, { useState } from 'react';
import { User, AuthSession, Transaction, e5ToAmount } from '@packages/types';
import { Button, Card, Badge } from '@packages/ui';
import {
  User as UserIcon,
  Server,
  LogOut,
  Copy,
  Check,
  Key,
  Clock,
  CreditCard,
  Building2,
  SlidersHorizontal,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { AccountSkeleton } from './Skeleton';

interface AccountViewProps {
  user: User | null;
  authToken: string | null;
  transactions?: Transaction[];
  isMockMode: boolean;
  recentSessions: AuthSession[];
  onToggleMock: () => void;
  onLogout: () => void;
  isLoadingData?: boolean;
}

export function getPaymentLimitStatus(spentAmount: number, limitAmount: number) {
  if (!limitAmount || limitAmount <= 0) {
    return {
      pct: 0,
      label: 'No Limit Set',
      barColor: 'bg-[#81B29A]',
      textColor: 'text-[#81B29A]',
      badgeBg: 'bg-[#81B29A]/15 text-[#81B29A] border-[#81B29A]/30',
      cardBorder: 'border-[#342F2C]',
      bgGlow: 'bg-[#1A1715]',
      isOver: false
    };
  }

  const pct = Math.min(Math.round((spentAmount / limitAmount) * 100), 999);

  if (pct >= 100) {
    return {
      pct,
      label: 'Limit Exceeded!',
      barColor: 'bg-[#EF4444] animate-pulse',
      textColor: 'text-[#EF4444]',
      badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
      cardBorder: 'border-rose-500/60 shadow-lg shadow-rose-950/40',
      bgGlow: 'bg-gradient-to-br from-[#2E1A1A] to-[#221515]',
      isOver: true
    };
  } else if (pct >= 90) {
    return {
      pct,
      label: 'Critical (Near Limit)',
      barColor: 'bg-[#F87171]',
      textColor: 'text-[#F87171]',
      badgeBg: 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/40',
      cardBorder: 'border-[#F87171]/50 shadow-md shadow-rose-950/20',
      bgGlow: 'bg-gradient-to-br from-[#2A1E1E] to-[#201818]',
      isOver: false
    };
  } else if (pct >= 75) {
    return {
      pct,
      label: 'High Caution',
      barColor: 'bg-[#E07A5F]',
      textColor: 'text-[#E07A5F]',
      badgeBg: 'bg-[#E07A5F]/20 text-[#E07A5F] border-[#E07A5F]/40',
      cardBorder: 'border-[#E07A5F]/50',
      bgGlow: 'bg-gradient-to-br from-[#29221F] to-[#211C19]',
      isOver: false
    };
  } else if (pct >= 50) {
    return {
      pct,
      label: 'Moderate Usage',
      barColor: 'bg-[#F2CC8F]',
      textColor: 'text-[#F2CC8F]',
      badgeBg: 'bg-[#F2CC8F]/20 text-[#F2CC8F] border-[#F2CC8F]/40',
      cardBorder: 'border-[#F2CC8F]/40',
      bgGlow: 'bg-gradient-to-br from-[#27241F] to-[#1F1D19]',
      isOver: false
    };
  } else {
    return {
      pct,
      label: 'Safe',
      barColor: 'bg-[#2DD4BF]',
      textColor: 'text-[#2DD4BF]',
      badgeBg: 'bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/30',
      cardBorder: 'border-[#342F2C]',
      bgGlow: 'bg-[#1A1715]',
      isOver: false
    };
  }
}

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  authToken,
  transactions = [],
  isMockMode,
  recentSessions,
  onToggleMock,
  onLogout,
  isLoadingData
}) => {
  const [copied, setCopied] = useState(false);

  // Local storage state for spending limits
  const [cardLimit, setCardLimit] = useState<number>(() => {
    const saved = localStorage.getItem('penne_limit_bank_card');
    return saved ? Number(saved) : 25000;
  });

  const [bankLimit, setBankLimit] = useState<number>(() => {
    const saved = localStorage.getItem('penne_limit_bank_account');
    return saved ? Number(saved) : 50000;
  });

  if (isLoadingData) {
    return <AccountSkeleton />;
  }

  const handleCardLimitChange = (val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setCardLimit(num);
    localStorage.setItem('penne_limit_bank_card', String(num));
  };

  const handleBankLimitChange = (val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setBankLimit(num);
    localStorage.setItem('penne_limit_bank_account', String(num));
  };

  const copyToken = () => {
    if (authToken) {
      navigator.clipboard.writeText(authToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate live spent totals per payment method
  const safeTxns = Array.isArray(transactions) ? transactions : [];

  const cardSpentE5 = safeTxns
    .filter((t) => t && t.txn_type === 'debit' && t.payment_method === 'bank_card')
    .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

  const bankSpentE5 = safeTxns
    .filter((t) => t && t.txn_type === 'debit' && t.payment_method !== 'bank_card')
    .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

  const cardSpent = e5ToAmount(cardSpentE5);
  const bankSpent = e5ToAmount(bankSpentE5);

  const cardStatus = getPaymentLimitStatus(cardSpent, cardLimit);
  const bankStatus = getPaymentLimitStatus(bankSpent, bankLimit);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fadeIn pb-28 w-full max-w-full overflow-x-hidden">
      {/* Account Profile Header */}
      <Card className="text-center py-6 space-y-3">
        <div className="w-16 h-16 rounded-full bg-[#E07A5F]/20 text-[#E07A5F] border-2 border-[#E07A5F]/40 flex items-center justify-center font-black text-2xl mx-auto shadow-md">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h2 className="text-xl font-black text-[#F4F1DE]">{user?.name || 'Penne User'}</h2>
          <p className="text-xs text-[#A89F95] font-mono mt-0.5">{user?.uuid || 'No UUID'}</p>
        </div>
        <div className="pt-2">
          <Badge variant="terracotta" className="text-xs">
            Active Auth Session
          </Badge>
        </div>
      </Card>

      {/* Payment Method Spending Limits Setup */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#F4F1DE] flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#E07A5F]" /> Payment Method Limits Setup
          </h3>
          <span className="text-[10px] font-bold text-[#81B29A] bg-[#81B29A]/15 border border-[#81B29A]/30 px-2 py-0.5 rounded-md">
            Tracked on Home Page
          </span>
        </div>

        <p className="text-xs text-[#A89F95] leading-relaxed">
          Configure monthly spending ceilings for each payment method. Your live progress and heatmap warning indicators will be displayed on the Home Page.
        </p>

        {/* Bank Card Limit Setup */}
        <div className="p-3.5 rounded-2xl border border-[#342F2C] bg-[#1A1715] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#818CF8]/15 text-[#818CF8] shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#F4F1DE] truncate">Bank Card Limit</p>
              <p className="text-[11px] text-[#A89F95] truncate">Current: ₹{cardLimit.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs font-mono text-[#8C837A]">₹</span>
            <input
              type="number"
              min="0"
              step="1000"
              value={cardLimit}
              onChange={(e) => handleCardLimitChange(e.target.value)}
              className="w-28 bg-[#24201D] border border-[#38322E] text-[#F4F1DE] text-xs rounded-xl px-2.5 py-1.5 text-right font-mono focus:outline-none focus:border-[#E07A5F]"
            />
          </div>
        </div>

        {/* Bank Account Limit Setup */}
        <div className="p-3.5 rounded-2xl border border-[#342F2C] bg-[#1A1715] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#2DD4BF]/15 text-[#2DD4BF] shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#F4F1DE] truncate">Bank Account Limit</p>
              <p className="text-[11px] text-[#A89F95] truncate">Current: ₹{bankLimit.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs font-mono text-[#8C837A]">₹</span>
            <input
              type="number"
              min="0"
              step="1000"
              value={bankLimit}
              onChange={(e) => handleBankLimitChange(e.target.value)}
              className="w-28 bg-[#24201D] border border-[#38322E] text-[#F4F1DE] text-xs rounded-xl px-2.5 py-1.5 text-right font-mono focus:outline-none focus:border-[#E07A5F]"
            />
          </div>
        </div>
      </Card>

      {/* Backend & API Server Settings */}
      <Card className="space-y-4">
        <h3 className="text-sm font-extrabold text-[#F4F1DE] flex items-center gap-2">
          <Server className="w-4 h-4 text-[#E07A5F]" /> Server Connection
        </h3>

        <div className="bg-[#1A1715] p-3.5 rounded-2xl border border-[#342F2C] flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-bold text-[#F4F1DE]">Current Backend Mode</p>
            <p className="text-[11px] text-[#A89F95] truncate">
              {isMockMode ? 'Demo Mode (Offline Local State)' : 'Live Go Server'}
            </p>
          </div>

          <button
            onClick={onToggleMock}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isMockMode
                ? 'bg-[#F2CC8F]/15 text-[#F2CC8F] border border-[#F2CC8F]/30'
                : 'bg-[#81B29A]/15 text-[#81B29A] border border-[#81B29A]/30'
            }`}
          >
            {isMockMode ? 'Switch to Live' : 'Switch to Demo'}
          </button>
        </div>
      </Card>

      {/* Auth Token Card */}
      {authToken && (
        <Card className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#F4F1DE] flex items-center gap-2">
            <Key className="w-4 h-4 text-[#81B29A]" /> Active Bearer Token
          </h3>

          <div className="bg-[#1A1715] p-3 rounded-2xl border border-[#342F2C] flex items-center justify-between gap-2">
            <p className="font-mono text-xs text-[#A89F95] truncate max-w-[220px]">
              {authToken}
            </p>
            <button
              onClick={copyToken}
              className="px-3 py-1.5 rounded-xl bg-[#2E2A27] hover:bg-[#3E3835] text-[#F4F1DE] text-xs font-bold flex items-center gap-1 transition-all shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#81B29A]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </Card>
      )}

      {/* Recent Cached Sessions */}
      {recentSessions.length > 0 && (
        <Card className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#F4F1DE] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F2CC8F]" /> Local Sessions ({recentSessions.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {recentSessions.map((session) => (
              <div
                key={session.token}
                className="bg-[#1A1715] border border-[#342F2C] rounded-2xl p-2.5 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#F4F1DE] truncate">{session.name}</p>
                  <p className="font-mono text-[10px] text-[#8C837A] truncate max-w-[180px]">
                    {session.token}
                  </p>
                </div>
                <Badge variant="sage" className="text-[10px]">
                  Active
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sign Out Button */}
      <Button
        variant="danger"
        size="lg"
        onClick={onLogout}
        className="w-full gap-2 font-bold shadow-lg"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of Account</span>
      </Button>
    </div>
  );
};
