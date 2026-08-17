import React, { useState, useMemo } from 'react';
import { Transaction, Envelope, EnvelopeGroup, e5ToAmount } from '@packages/types';
import { Button, Card, Badge, StatCard } from '@packages/ui';
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Clock,
  WifiOff,
  RefreshCw,
  Tag,
  CreditCard,
  Building2
} from 'lucide-react';
import { HomePageSkeleton } from './Skeleton';

interface HomePageProps {
  transactions: Transaction[];
  envelopes?: Envelope[];
  envelopeGroups?: EnvelopeGroup[];
  isServerOffline?: boolean;
  isMockMode?: boolean;
  onRetryConnection?: () => void;
  onToggleMock?: () => void;
  onOpenNewTxnModal: () => void;
  onOpenNewCategoryModal?: () => void;
  onSelectTxnForEdit?: (txn: Transaction) => void;
  onNavigateToTransactions?: () => void;
  isLoadingData?: boolean;
}

export function formatTransactionDateTime(isoString?: string): { dateStr: string; timeStr: string } {
  if (!isoString) return { dateStr: 'Recent', timeStr: '' };
  try {
    let normalized = isoString.trim();
    if (normalized.includes(' ') && !normalized.includes('T')) {
      normalized = normalized.replace(' ', 'T');
    }
    // If ISO timestamp string has no offset or Z suffix, append Z so JavaScript parses as UTC ISO-8601
    if (!normalized.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(normalized)) {
      normalized += 'Z';
    }

    let d = new Date(normalized);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1 || d.getFullYear() < 2000) {
      d = new Date();
    }

    // Format in user's local timezone for date & time
    const dateStr = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const timeStr = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return { dateStr, timeStr };
  } catch {
    return { dateStr: 'Recent', timeStr: '' };
  }
}

export const HomePage: React.FC<HomePageProps> = ({
  transactions,
  envelopes = [],
  envelopeGroups = [],
  isServerOffline,
  isMockMode,
  onRetryConnection,
  onToggleMock,
  onOpenNewTxnModal,
  onOpenNewCategoryModal,
  onSelectTxnForEdit,
  onNavigateToTransactions,
  isLoadingData
}) => {
  const envelopeMap = useMemo(() => {
    const map = new Map<string, Envelope>();
    (envelopes || []).forEach((e) => {
      if (e && e.id) map.set(e.id, e);
    });
    return map;
  }, [envelopes]);

  const groupMap = useMemo(() => {
    const map = new Map<string, EnvelopeGroup>();
    (envelopeGroups || []).forEach((g) => {
      if (g && g.id) map.set(g.id, g);
    });
    return map;
  }, [envelopeGroups]);
  if (isLoadingData) {
    return <HomePageSkeleton />;
  }

  const safeTxns = Array.isArray(transactions) ? transactions : [];

  // Sort newest transactions first by created_at timestamp
  const sortedTxns = [...safeTxns].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  // Display only the top 5-6 recent transactions (both credit & debit)
  const recentTxns = sortedTxns.slice(0, 6);

  // Calculate Total Income & Total Spend
  const totalIncomeE5 = sortedTxns
    .filter((t) => t && t.txn_type === 'credit')
    .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

  const debitTxns = sortedTxns.filter((t) => t && t.txn_type === 'debit');

  const cardSpentE5 = debitTxns
    .filter((t) => t.payment_method === 'bank_card')
    .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

  const bankAccountSpentE5 = debitTxns
    .filter((t) => t.payment_method !== 'bank_card')
    .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

  const totalSpentE5 = cardSpentE5 + bankAccountSpentE5;

  const totalRemainingE5 = totalIncomeE5 - totalSpentE5;

  const totalSpentFormatted = `₹${e5ToAmount(totalSpentE5).toLocaleString('en-IN')}`;
  const cardSpentFormatted = `₹${e5ToAmount(cardSpentE5).toLocaleString('en-IN')}`;
  const bankAccountSpentFormatted = `₹${e5ToAmount(bankAccountSpentE5).toLocaleString('en-IN')}`;
  const totalRemainingFormatted = `₹${e5ToAmount(totalRemainingE5).toLocaleString('en-IN')}`;
  const totalIncomeFormatted = `₹${e5ToAmount(totalIncomeE5).toLocaleString('en-IN')}`;

  const cardPercent = totalSpentE5 > 0 ? Math.round((cardSpentE5 / totalSpentE5) * 100) : 0;
  const bankPercent = totalSpentE5 > 0 ? 100 - cardPercent : 0;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 space-y-5 animate-fadeIn pb-28 overflow-x-hidden">
      {/* Explicit Server Offline Banner (No false mock data fallback) */}
      {isServerOffline && !isMockMode && (
        <div className="bg-[#E8A598]/15 border border-[#E8A598]/40 rounded-3xl p-4 space-y-3 text-left animate-fadeIn">
          <div className="flex items-center gap-2 text-[#E8A598]">
            <WifiOff className="w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-sm text-[#F4F1DE]">Backend Server Offline</h3>
          </div>
          <p className="text-xs text-[#A89F95] leading-relaxed">
            Cannot reach backend server. Please verify <code className="text-[#F2CC8F] font-mono">penne-server</code> is running on port 8080 or CORS is enabled.
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

      {/* Overview Stat Cards: Total Spend & Total Remaining */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-full overflow-x-hidden items-start">
        {/* Total Spend Card */}
        <StatCard
          title="Total Spend"
          value={totalSpentFormatted}
          subtitle="Total recorded expenses"
          variant="rose"
          icon={<TrendingDown className="w-5 h-5 text-[#E8A598]" />}
          className="w-full min-w-0"
        >
          <div className="space-y-2">
            {/* Visual proportion bar */}
            <div
              className="w-full h-1.5 bg-[#1A1715] rounded-full overflow-hidden flex border border-[#38322E]/40"
              title={`Card: ${cardPercent}%, Bank Account: ${bankPercent}%`}
            >
              <div
                className="h-full bg-[#818CF8] transition-all duration-500"
                style={{ width: `${totalSpentE5 > 0 ? cardPercent : 50}%` }}
              />
              <div
                className="h-full bg-[#2DD4BF] transition-all duration-500"
                style={{ width: `${totalSpentE5 > 0 ? bankPercent : 50}%` }}
              />
            </div>

            {/* Breakdown Chips */}
            <div className="flex items-center justify-between gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-[#818CF8] bg-[#818CF8]/10 px-2 py-1 rounded-lg border border-[#818CF8]/25 font-bold min-w-0 truncate">
                <CreditCard className="w-3 h-3 shrink-0" />
                <span className="truncate">Card: {cardSpentFormatted}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#2DD4BF] bg-[#2DD4BF]/10 px-2 py-1 rounded-lg border border-[#2DD4BF]/25 font-bold min-w-0 truncate">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">Bank: {bankAccountSpentFormatted}</span>
              </div>
            </div>
          </div>
        </StatCard>

        {/* Total Remaining Card */}
        <StatCard
          title="Total Remaining"
          value={totalRemainingFormatted}
          subtitle={`Out of ${totalIncomeFormatted} income`}
          variant="sage"
          icon={<TrendingUp className="w-5 h-5 text-[#81B29A]" />}
          className="w-full min-w-0"
        />
      </div>

      {/* Action Banner: Add Transaction & Add Category */}
      <div className="flex items-center justify-between bg-[#24201D] border border-[#38322E] rounded-3xl p-4 shadow-lg shadow-black/20 w-full max-w-full overflow-x-hidden gap-2">
        <div className="space-y-0.5 min-w-0 pr-1 flex-1">
          <h2 className="text-sm font-extrabold text-[#F4F1DE] truncate">Quick Actions</h2>
          <p className="text-xs text-[#A89F95] truncate">Record expenses & manage budget</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenNewCategoryModal && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenNewCategoryModal}
              className="gap-1.5 font-bold shrink-0 text-xs px-3"
              disabled={isServerOffline && !isMockMode}
            >
              <Plus className="w-4 h-4" />
              <span>Category</span>
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={onOpenNewTxnModal}
            className="gap-1.5 shadow-lg font-bold shrink-0 text-xs px-3.5"
            disabled={isServerOffline && !isMockMode}
          >
            <Plus className="w-4 h-4" />
            <span>New Expense</span>
          </Button>
        </div>
      </div>

      {/* Recent Transactions Preview Section (Only Top 5-6 Txns, No Filters) */}
      <div className="space-y-3 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold text-[#F4F1DE]">Recent Transactions</h3>
          {onNavigateToTransactions && (
            <button
              onClick={onNavigateToTransactions}
              className="text-xs font-bold text-[#E07A5F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentTxns.length === 0 ? (
          <Card className="text-center py-10 space-y-3 w-full max-w-full">
            <div className="w-12 h-12 rounded-2xl bg-[#2E2A27] text-[#A89F95] flex items-center justify-center mx-auto">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#F4F1DE]">
                {isServerOffline && !isMockMode ? 'Server Offline' : 'No transactions yet'}
              </h3>
              <p className="text-xs text-[#8C837A] max-w-xs mx-auto">
                {isServerOffline && !isMockMode
                  ? 'Connect your backend server to view your live transactions.'
                  : "You haven't recorded any transactions yet. Tap '+ New Expense' to get started!"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2.5 w-full max-w-full overflow-x-hidden">
            {recentTxns.map((txn) => {
              const isDebit = txn.txn_type === 'debit';
              const formattedAmt = `₹${e5ToAmount(txn.amount_e5).toLocaleString('en-IN')}`;

              // Format ISO-8601 date & time
              const { dateStr, timeStr } = formatTransactionDateTime(txn.created_at);

              const assignedEnv = txn.envelope_id ? envelopeMap.get(txn.envelope_id) : null;
              const cardHeading = (!assignedEnv || assignedEnv.is_system || assignedEnv.name === 'Unallocated Budget')
                ? 'General'
                : (assignedEnv.name || 'General');

              const groupName = assignedEnv?.envelope_group_id ? groupMap.get(assignedEnv.envelope_group_id)?.name : null;
              const isBankCard = txn.payment_method === 'bank_card';

              return (
                <div
                  key={txn.id}
                  onClick={() => onSelectTxnForEdit?.(txn)}
                  className="bg-[#24201D] border border-[#342F2C] hover:border-[#E07A5F]/60 hover:bg-[#2B2623] cursor-pointer rounded-2xl p-3.5 transition-all flex items-center justify-between gap-2.5 shadow-md w-full max-w-full overflow-x-hidden min-w-0 group"
                  title="Click to edit transaction details"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-x-hidden">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${isDebit
                          ? 'bg-[#E8A598]/15 text-[#E8A598] border border-[#E8A598]/20'
                          : 'bg-[#81B29A]/15 text-[#81B29A] border border-[#81B29A]/20'
                        }`}
                    >
                      {isDebit ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1 overflow-x-hidden">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs font-extrabold text-[#F4F1DE] group-hover:text-[#E07A5F] transition-colors truncate">
                          {cardHeading}
                        </p>
                      </div>

                      {/* Tags & Time */}
                      <div className="flex items-center gap-2 text-[11px] text-[#A89F95] flex-wrap">
                        {dateStr && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-[#C4BBB1]">
                            <Calendar className="w-3 h-3 text-[#8C837A]" />
                            {dateStr}
                          </span>
                        )}
                        {timeStr && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-[#A89F95]">
                            <Clock className="w-3 h-3 text-[#8C837A]" />
                            {timeStr}
                          </span>
                        )}

                        {groupName && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-[#E07A5F]/15 text-[#E07A5F] border border-[#E07A5F]/30 px-1.5 py-0.5 rounded-md font-extrabold truncate max-w-[110px]">
                            <Tag className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{groupName}</span>
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-extrabold border ${isBankCard
                              ? 'bg-[#818CF8]/15 text-[#818CF8] border-[#818CF8]/30'
                              : 'bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/30'
                            }`}
                        >
                          {isBankCard ? <CreditCard className="w-2.5 h-2.5 shrink-0" /> : <Building2 className="w-2.5 h-2.5 shrink-0" />}
                          <span>{isBankCard ? 'Bank Card' : 'Bank Account'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right shrink-0 pl-1">
                    <span
                      className={`text-sm sm:text-base font-black tracking-tight ${isDebit ? 'text-[#E8A598]' : 'text-[#81B29A]'
                        }`}
                    >
                      {isDebit ? '-' : '+'}{formattedAmt}
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

