import React, { useMemo } from 'react';
import { Transaction, Envelope, EnvelopeGroup, DashboardSummary, e5ToAmount, parseUtcDate } from '@packages/types';
import { Button } from '@packages/ui';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CreditCard,
  Landmark,
  Search,
  WifiOff,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { EnvelopeMonogramBadge } from '../utils/envelopeVisuals';
import { StatCardsSkeleton, PaymentLimitsSkeleton, TransactionListSkeleton } from './Skeleton';

interface HomePageProps {
  transactions: Transaction[];
  envelopes?: Envelope[];
  envelopeGroups?: EnvelopeGroup[];
  dashboardSummary?: DashboardSummary | null;
  isServerOffline?: boolean;
  isMockMode?: boolean;
  onRetryConnection?: () => void;
  onToggleMock?: () => void;
  onOpenNewTxnModal: () => void;
  onOpenNewCategoryModal?: () => void;
  onSelectTxnForEdit?: (txn: Transaction) => void;
  onNavigateToTransactions?: () => void;
  isLoadingTransactions?: boolean;
  isLoadingEnvelopes?: boolean;
  isLoadingSummary?: boolean;
}

export function formatTransactionDateTime(isoString?: string): { dateStr: string; timeStr: string } {
  const d = parseUtcDate(isoString) || new Date();

  const dateStr = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });

  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return { dateStr, timeStr };
}

const formatINR = (val: number) => {
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export const HomePage: React.FC<HomePageProps> = ({
  transactions,
  envelopes = [],
  dashboardSummary,
  isServerOffline,
  isMockMode,
  onRetryConnection,
  onToggleMock,
  onOpenNewTxnModal,
  onOpenNewCategoryModal,
  onSelectTxnForEdit,
  onNavigateToTransactions,
  isLoadingTransactions,
  isLoadingEnvelopes,
  isLoadingSummary
}) => {
  const envelopeMap = useMemo(() => {
    const map = new Map<string, Envelope>();
    (envelopes || []).forEach((e) => {
      if (e && e.id) map.set(e.id, e);
    });
    return map;
  }, [envelopes]);

  const fallbackCardLimit = useMemo(() => {
    const saved = localStorage.getItem('penne_limit_bank_card');
    const val = saved ? Number(saved) : 25000;
    return Math.min(50000, Math.max(0, isNaN(val) ? 25000 : val));
  }, []);

  const fallbackBankLimit = useMemo(() => {
    const saved = localStorage.getItem('penne_limit_bank_account');
    const val = saved ? Number(saved) : 10000;
    return Math.min(10000, Math.max(0, isNaN(val) ? 10000 : val));
  }, []);

  const cardLimit = (dashboardSummary && dashboardSummary.card_limit_e5 > 0)
    ? e5ToAmount(dashboardSummary.card_limit_e5)
    : fallbackCardLimit;

  const bankLimit = (dashboardSummary && dashboardSummary.bank_limit_e5 > 0)
    ? e5ToAmount(dashboardSummary.bank_limit_e5)
    : fallbackBankLimit;

  const safeTxns = Array.isArray(transactions) ? transactions : [];

  // Sort newest transactions first
  const sortedTxns = [...safeTxns].sort((a, b) => {
    const timeA = parseUtcDate(a.created_at || a.CreatedAt)?.getTime() || 0;
    const timeB = parseUtcDate(b.created_at || b.CreatedAt)?.getTime() || 0;
    return timeB - timeA;
  });

  const recentTxns = sortedTxns.slice(0, 5);

  let totalIncomeE5 = 0;
  let totalSpentE5 = 0;
  let totalRemainingE5 = 0;
  let cardSpentE5 = 0;
  let bankSpentE5 = 0;

  if (dashboardSummary) {
    totalIncomeE5 = dashboardSummary.total_income_e5;
    totalSpentE5 = dashboardSummary.total_expense_e5;
    totalRemainingE5 = dashboardSummary.total_remaining_e5;
    cardSpentE5 = dashboardSummary.card_spent_e5;
    bankSpentE5 = dashboardSummary.bank_spent_e5;
  } else {
    totalIncomeE5 = sortedTxns
      .filter((t) => t && t.txn_type === 'credit')
      .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

    const debitTxns = sortedTxns.filter((t) => t && t.txn_type === 'debit');

    cardSpentE5 = debitTxns
      .filter((t) => t.payment_method === 'bank_card')
      .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

    bankSpentE5 = debitTxns
      .filter((t) => t.payment_method !== 'bank_card')
      .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

    totalSpentE5 = cardSpentE5 + bankSpentE5;
    totalRemainingE5 = totalIncomeE5 - totalSpentE5;
  }

  const cardSpentAmount = e5ToAmount(cardSpentE5);
  const bankSpentAmount = e5ToAmount(bankSpentE5);
  const totalRemainingAmount = e5ToAmount(totalRemainingE5);
  const totalIncomeAmount = e5ToAmount(totalIncomeE5);
  const totalSpentAmount = e5ToAmount(totalSpentE5);

  const cardPct = cardLimit > 0 ? Math.min(Math.round((cardSpentAmount / cardLimit) * 100), 100) : 0;
  const bankPct = bankLimit > 0 ? Math.min(Math.round((bankSpentAmount / bankLimit) * 100), 100) : 0;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fadeIn pb-28 overflow-x-hidden">
      {/* Explicit Server Offline Banner */}
      {isServerOffline && !isMockMode && (
        <div className="velvet-card p-4 space-y-3 text-left border-rose-500/30 bg-rose-950/30">
          <div className="flex items-center gap-2 text-rose-300">
            <WifiOff className="w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-sm text-white">Backend Server Offline</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Cannot reach backend server. Please verify <code className="text-[#FBD8B3] font-mono">penne-server</code> is running on port 8080.
          </p>
          <div className="flex items-center gap-2 pt-1">
            {onRetryConnection && (
              <Button size="sm" variant="pastelRose" onClick={onRetryConnection} className="gap-1.5 font-bold text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </Button>
            )}
            {onToggleMock && (
              <Button size="sm" variant="secondary" onClick={onToggleMock} className="text-xs">
                Switch to Demo Mode
              </Button>
            )}
          </div>
        </div>
      )}

      {/* SIGNATURE APRICOT HERO CARD */}
      {isLoadingSummary ? (
        <StatCardsSkeleton />
      ) : (
        <div className="hero-apricot-card p-5 relative overflow-hidden group">
          {/* Split With Capsule (Right Tab from reference) */}
          <div className="absolute right-4 top-4 bg-white/95 backdrop-blur-md rounded-2xl py-2 px-1.5 flex flex-col items-center gap-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-10 transition-transform duration-200 group-hover:scale-105">
            <span className="text-[8px] font-mono font-bold text-indigo-950 uppercase tracking-tighter block">
              Pool
            </span>
            <div className="w-6 h-6 rounded-full bg-[#A7D7F9]/50 text-indigo-900 border border-indigo-950/20 flex items-center justify-center text-[10px] shadow-sm">
              🍽️
            </div>
            <div className="w-6 h-6 rounded-full bg-[#C8B6FF]/50 text-indigo-900 border border-indigo-950/20 flex items-center justify-center text-[10px] shadow-sm">
              ☕
            </div>
            <div className="w-6 h-6 rounded-full bg-[#FFB5A7]/50 text-indigo-900 border border-indigo-950/20 flex items-center justify-center text-[10px] shadow-sm">
              🛒
            </div>
            {onOpenNewCategoryModal && (
              <div
                className="w-6 h-6 rounded-full bg-[#FFD5B8] hover:bg-[#FBD8B3] text-indigo-950 flex items-center justify-center text-[11px] font-black cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-sm"
                onClick={onOpenNewCategoryModal}
                title="Add Envelope"
              >
                +
              </div>
            )}
          </div>

          {/* Left Content Column */}
          <div className="pr-16 space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-950/70 block">
              Net Remaining Headroom
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-indigo-950 font-mono">
              {formatINR(totalRemainingAmount)}
            </div>

            {/* Quick Split / Record Action Button */}
            <div className="pt-3 flex items-center gap-2.5 flex-wrap">
              <button
                onClick={onOpenNewTxnModal}
                className="px-4 py-2 rounded-xl bg-[#232044] hover:bg-[#2C2856] text-white font-bold text-xs shadow-md active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer hover:shadow-lg"
              >
                <span>Split / Record</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#FBD8B3]" />
              </button>
              <div className="px-2.5 py-1 rounded-lg bg-indigo-950/10 text-[10px] font-mono text-indigo-950 font-semibold">
                ~{formatINR(Math.round(totalRemainingAmount / 22))}/day safe
              </div>
            </div>
          </div>

          {/* Inflow vs Outflow Mini Split at bottom of card */}
          <div className="mt-5 pt-3.5 border-t border-indigo-950/10 grid grid-cols-2 gap-3 pr-14 text-indigo-950">
            <div>
              <span className="text-[9px] font-mono uppercase text-indigo-950/60 block font-bold">Monthly Inflow</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-emerald-900 flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />
                {formatINR(totalIncomeAmount)}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase text-indigo-950/60 block font-bold">Monthly Outflow</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-rose-900 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-700" />
                {formatINR(totalSpentAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Context Strip (Active Envelopes Pills Row with Emojis) */}
      <div className="velvet-card p-4 space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-100 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#FBD8B3] animate-pulse"></span>
            Active Envelopes
          </span>
          {onOpenNewCategoryModal && (
            <button
              onClick={onOpenNewCategoryModal}
              className="text-[11px] font-mono text-[#FBD8B3] hover:underline cursor-pointer transition-colors"
            >
              + Add Category
            </button>
          )}
        </div>

        {/* Avatar Pill Strip */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {/* Peach Search Trigger */}
          {onNavigateToTransactions && (
            <div
              onClick={onNavigateToTransactions}
              className="w-12 h-12 rounded-2xl bg-[#FBD8B3] hover:bg-[#f7c495] text-[#1A1835] flex items-center justify-center shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
              title="Search Ledger"
            >
              <Search className="w-4 h-4 text-[#1A1835]" />
            </div>
          )}

          {/* Category Pills */}
          {isLoadingEnvelopes ? (
            <div className="text-xs font-mono text-slate-400 py-2">Loading envelopes...</div>
          ) : (envelopes || []).filter((e) => !e.is_system).length === 0 ? (
            <div className="text-xs font-mono text-slate-400 py-2">No custom envelopes yet</div>
          ) : (
            (envelopes || [])
              .filter((e) => !e.is_system)
              .map((env) => (
                <div key={env.id} className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer">
                  <EnvelopeMonogramBadge name={env.name} size="lg" />
                  <span className="text-[10px] font-medium text-slate-300 group-hover:text-white truncate max-w-[60px] text-center font-mono transition-colors">
                    {(env.name || 'Category').split(' ')[0]}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>

      {/* PAYMENT RAILS VELOCITY WITH DOTTED SLIDERS & CREAM KNOBS */}
      {isLoadingSummary ? (
        <PaymentLimitsSkeleton />
      ) : (
        <div className="velvet-card p-4 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FBD8B3]"></span>
              Payment Rails Velocity
            </span>
            <span className="text-[10px] font-mono text-slate-400">Monthly Burn</span>
          </div>

          {/* Rail 1: Bank Card */}
          <div className="velvet-card-subtle p-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#C8B6FF]/25 text-[#C8B6FF] flex items-center justify-center text-xs font-mono font-bold shadow-sm">
                  CC
                </div>
                <div>
                  <span className="font-bold text-slate-100 block text-xs">Obsidian Credit Rail</span>
                  <span className="text-[10px] font-mono text-slate-400">Card Limit</span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-slate-100 font-bold text-xs">{formatINR(cardSpentAmount)}</span>
                <span className="text-slate-400 text-[10px]"> / {formatINR(cardLimit)}</span>
              </div>
            </div>

            {/* Slider Track with Dotted Snap Markers */}
            <div className="relative h-4 w-full bg-[#1A1835]/90 rounded-full p-0.5 flex items-center overflow-hidden border border-white/5 track-dots">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#C8B6FF] to-[#A7D7F9] transition-all duration-500 shadow-sm"
                style={{ width: `${cardPct}%` }}
              />
              <div
                className="absolute w-4 h-4 rounded-full bg-[#FDE2B8] border-2 border-[#2C2856] shadow-md -ml-2 pointer-events-none transition-all duration-300"
                style={{ left: `${Math.max(4, Math.min(96, cardPct))}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>{cardPct}% consumed</span>
              <span className="text-[#FBD8B3] font-medium">{formatINR(Math.max(0, cardLimit - cardSpentAmount))} headroom</span>
            </div>
          </div>

          {/* Rail 2: Bank Account Liquid Vault */}
          <div className="velvet-card-subtle p-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#A7D7F9]/25 text-[#A7D7F9] flex items-center justify-center text-xs font-mono font-bold shadow-sm">
                  ACH
                </div>
                <div>
                  <span className="font-bold text-slate-100 block text-xs">Primary Liquid Vault</span>
                  <span className="text-[10px] font-mono text-slate-400">Direct Debit Rail</span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-slate-100 font-bold text-xs">{formatINR(bankSpentAmount)}</span>
                <span className="text-slate-400 text-[10px]"> / {formatINR(bankLimit)}</span>
              </div>
            </div>

            {/* Slider Track */}
            <div className="relative h-4 w-full bg-[#1A1835]/90 rounded-full p-0.5 flex items-center overflow-hidden border border-white/5 track-dots">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#A7D7F9] to-[#A8E6CF] transition-all duration-500 shadow-sm"
                style={{ width: `${bankPct}%` }}
              />
              <div
                className="absolute w-4 h-4 rounded-full bg-[#FDE2B8] border-2 border-[#2C2856] shadow-md -ml-2 pointer-events-none transition-all duration-300"
                style={{ left: `${Math.max(4, Math.min(96, bankPct))}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>{bankPct}% consumed</span>
              <span className="text-[#FBD8B3] font-medium">{formatINR(Math.max(0, bankLimit - bankSpentAmount))} headroom</span>
            </div>
          </div>
        </div>
      )}

      {/* RECENT TRANSACTIONS FEED */}
      <div className="velvet-card p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FBD8B3]"></span>
            Recently Recorded
          </span>
          {onNavigateToTransactions && (
            <button
              onClick={onNavigateToTransactions}
              className="text-xs font-mono text-[#FBD8B3] hover:underline flex items-center gap-0.5 cursor-pointer transition-colors"
            >
              <span>View All ({safeTxns.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isLoadingTransactions ? (
          <TransactionListSkeleton count={4} />
        ) : recentTxns.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-mono">
            No transactions recorded yet. Tap '+ New Expense' to get started!
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {recentTxns.map((tx) => {
              const isCredit = tx.txn_type === 'credit';
              const isTransfer = tx.txn_type === 'transfer';
              const { dateStr, timeStr } = formatTransactionDateTime(tx.created_at || tx.CreatedAt);
              const assignedEnv = tx.envelope_id ? envelopeMap.get(tx.envelope_id) : null;
              const heading = assignedEnv?.name || (isCredit
                ? 'Income Inflow'
                : isTransfer
                ? 'Account Transfer'
                : tx.payment_method === 'bank_card'
                ? 'Obsidian Card Expense'
                : 'Primary Bank Debit');

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTxnForEdit?.(tx)}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] hover:translate-x-1 -mx-2 px-2 rounded-xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isCredit
                          ? 'bg-[#A8E6CF]/20 text-[#A8E6CF] border border-[#A8E6CF]/30'
                          : isTransfer
                          ? 'bg-[#C8B6FF]/20 text-[#C8B6FF] border border-[#C8B6FF]/30'
                          : tx.payment_method === 'bank_card'
                          ? 'bg-[#FBD8B3]/20 text-[#FBD8B3] border border-[#FBD8B3]/30'
                          : 'bg-[#A7D7F9]/20 text-[#A7D7F9] border border-[#A7D7F9]/30'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4 text-[#A8E6CF]" />
                      ) : isTransfer ? (
                        <ArrowLeftRight className="w-4 h-4 text-[#C8B6FF]" />
                      ) : tx.payment_method === 'bank_card' ? (
                        <CreditCard className="w-4 h-4 text-[#FBD8B3]" />
                      ) : (
                        <Landmark className="w-4 h-4 text-[#A7D7F9]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-100 truncate group-hover:text-[#FBD8B3] transition-colors">
                        {heading}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span className="capitalize">{tx.payment_method.replace('_', ' ')}</span>
                        {assignedEnv && (
                          <>
                            <span>•</span>
                            <span className="text-[#FBD8B3] font-medium">{assignedEnv.name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{dateStr} {timeStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2 font-mono">
                    <span
                      className={`text-xs font-bold ${
                        isCredit ? 'text-[#A8E6CF]' : 'text-slate-100'
                      }`}
                    >
                      {isCredit ? '+' : '-'}{formatINR(e5ToAmount(tx.amount_e5))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
