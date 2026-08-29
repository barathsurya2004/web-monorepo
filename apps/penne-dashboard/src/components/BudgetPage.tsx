import React, { useState } from 'react';
import { ActiveCategory, Transaction, EnvelopeGroup, Envelope, e5ToAmount } from '@packages/types';
import { Button, Card, Badge, ProgressBar } from '@packages/ui';
import {
  PieChart,
  Search,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  ArrowUpRight,
  Layers,
  Sparkles,
  HelpCircle,
  FolderSync,
  ShieldAlert,
  SlidersHorizontal,
  Plus,
  CreditCard,
  Building2,
  Folder,
  X
} from 'lucide-react';
import { formatTransactionDateTime } from './HomePage';
import { BudgetOverviewSkeleton, CategoryListSkeleton } from './Skeleton';

interface BudgetPageProps {
  categories: ActiveCategory[];
  transactions: Transaction[];
  envelopeGroups?: EnvelopeGroup[];
  envelopes?: Envelope[];
  isServerOffline?: boolean;
  isMockMode?: boolean;
  onRetryConnection?: () => void;
  onToggleMock?: () => void;
  onOpenNewTxnModal: () => void;
  onOpenNewCategoryModal?: () => void;
  onSelectTxnForEdit?: (txn: Transaction) => void;
  isLoadingCategories?: boolean;
  isLoadingTransactions?: boolean;
  isLoadingEnvelopes?: boolean;
}

export const BudgetPage: React.FC<BudgetPageProps> = ({
  categories,
  transactions,
  envelopeGroups = [],
  envelopes = [],
  isServerOffline,
  isMockMode,
  onRetryConnection,
  onToggleMock,
  onOpenNewTxnModal,
  onOpenNewCategoryModal,
  onSelectTxnForEdit,
  isLoadingCategories,
  isLoadingTransactions,
  isLoadingEnvelopes
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'tracked' | 'untracked' | 'ontrack' | 'warning' | 'overbudget'>('all');
  const [expandedEnvelopeId, setExpandedEnvelopeId] = useState<string | null>(null);

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeTxns = Array.isArray(transactions) ? transactions : [];

  const parentGroupMap = new Map<string, string>();
  (envelopeGroups || []).forEach((g) => {
    if (g && g.id) parentGroupMap.set(g.id, g.name);
  });

  const envelopeGroupLinkMap = new Map<string, string>();
  (envelopes || []).forEach((env) => {
    if (env && env.id && env.envelope_group_id) {
      envelopeGroupLinkMap.set(env.id, env.envelope_group_id);
    }
  });

  const categorySpending = safeCategories.map((cat) => {
    const matchingDebitTxns = safeTxns.filter(
      (t) => t && t.envelope_id === cat.envelope_id && t.txn_type === 'debit'
    );
    const spentE5 = matchingDebitTxns.reduce((sum, t) => sum + (t.amount_e5 || 0), 0);
    const remainingE5 = cat.allocated_amount_e5 - spentE5;
    const usagePercent = cat.allocated_amount_e5 > 0 ? (spentE5 / cat.allocated_amount_e5) * 100 : 0;
    const isOverBudget = spentE5 > cat.allocated_amount_e5;
    const isWarning = usagePercent >= 80 && !isOverBudget;

    const matchedEnv = (envelopes || []).find((e) => e && e.id === cat.envelope_id);
    const envGroupId = matchedEnv?.envelope_group_id || envelopeGroupLinkMap.get(cat.envelope_id);
    const groupName =
      (envGroupId ? parentGroupMap.get(envGroupId) : null) ||
      (cat.is_system ? 'Unallocated Budget' : 'General Group');
    const envelopeName = cat.name || matchedEnv?.name || 'Category Envelope';

    return {
      ...cat,
      envelopeName,
      groupName,
      envGroupId,
      spentE5,
      remainingE5,
      usagePercent,
      isOverBudget,
      isWarning,
      matchingDebitTxns
    };
  });

  const filteredCategories = categorySpending.filter((cat) => {
    if (statusFilter === 'tracked' && cat.is_system) return false;
    if (statusFilter === 'untracked' && !cat.is_system) return false;
    if (statusFilter === 'ontrack' && (cat.isOverBudget || cat.isWarning)) return false;
    if (statusFilter === 'warning' && !cat.isWarning) return false;
    if (statusFilter === 'overbudget' && !cat.isOverBudget) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = cat.envelopeName.toLowerCase().includes(q);
      const matchGroup = cat.groupName.toLowerCase().includes(q);
      if (!matchName && !matchGroup) return false;
    }

    return true;
  });

  const totalAllocatedE5 = safeCategories.reduce((sum, c) => sum + (c.allocated_amount_e5 || 0), 0);
  const totalSpentE5 = categorySpending.reduce((sum, c) => sum + c.spentE5, 0);
  const totalNetRemainingE5 = totalAllocatedE5 - totalSpentE5;

  const untrackedAllocatedE5 = safeCategories
    .filter((c) => c.is_system)
    .reduce((sum, c) => sum + (c.allocated_amount_e5 || 0), 0);
  const trackedAllocatedE5 = totalAllocatedE5 - untrackedAllocatedE5;

  const uncategorizedDebitTxns = safeTxns.filter(
    (t) => t && t.txn_type === 'debit' && (!t.envelope_id || !new Set(safeCategories.map((c) => c.envelope_id)).has(t.envelope_id))
  );
  const uncategorizedSpentE5 = uncategorizedDebitTxns.reduce((sum, t) => sum + (t.amount_e5 || 0), 0);

  const toggleExpand = (envId: string) => {
    setExpandedEnvelopeId(expandedEnvelopeId === envId ? null : envId);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 space-y-5 animate-fadeIn pb-28 overflow-x-hidden">
      {isServerOffline && !isMockMode && (
        <div className="bg-[#E8A598]/15 border border-[#E8A598]/40 rounded-3xl p-4 space-y-3 text-left animate-fadeIn">
          <div className="flex items-center gap-2 text-[#E8A598]">
            <WifiOff className="w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-sm text-[#F4F1DE]">Backend Server Offline</h3>
          </div>
          <p className="text-xs text-[#A89F95] leading-relaxed">
            Cannot reach backend server. Please verify <code className="text-[#F2CC8F] font-mono">penne-server</code> is running.
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

      {isLoadingCategories || isLoadingTransactions ? (
        <BudgetOverviewSkeleton />
      ) : (
        <div className="relative overflow-hidden bg-gradient-to-br from-[#292421] via-[#1E1B19] to-[#141210] border border-[#3E3835] rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#E07A5F] to-[#C96449] text-white shadow-lg shadow-[#E07A5F]/20 shrink-0">
                <PieChart className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-extrabold text-[#F4F1DE] tracking-tight flex items-center gap-1.5 truncate">
                  <span>Budget Overview</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#F2CC8F] shrink-0" />
                </h1>
                <p className="text-[11px] text-[#A89F95] truncate">Active Categories & Live Tracking</p>
              </div>
            </div>
            {onOpenNewCategoryModal && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenNewCategoryModal}
                className="gap-1.5 font-bold text-xs shrink-0 shadow-md px-3"
              >
                <Plus className="w-4 h-4" />
                <span>New Category</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#342F2C]">
            <div className="bg-[#1A1715]/90 p-2.5 rounded-2xl border border-[#342F2C] min-w-0">
              <p className="text-[9px] text-[#8C837A] uppercase font-bold tracking-wider truncate">Total Budgeted</p>
              <p className="text-xs sm:text-sm font-black text-[#F4F1DE] mt-0.5 truncate">
                ₹{e5ToAmount(totalAllocatedE5).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-[#1A1715]/90 p-2.5 rounded-2xl border border-[#342F2C] min-w-0">
              <p className="text-[9px] text-[#8C837A] uppercase font-bold tracking-wider truncate">Total Spent</p>
              <p className="text-xs sm:text-sm font-black text-[#E8A598] mt-0.5 truncate">
                ₹{e5ToAmount(totalSpentE5).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-[#1A1715]/90 p-2.5 rounded-2xl border border-[#342F2C] min-w-0">
              <p className="text-[9px] text-[#8C837A] uppercase font-bold tracking-wider truncate">Net Remaining</p>
              <p
                className={`text-xs sm:text-sm font-black mt-0.5 truncate ${totalNetRemainingE5 < 0 ? 'text-[#E8A598]' : 'text-[#81B29A]'
                  }`}
              >
                ₹{e5ToAmount(totalNetRemainingE5).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {untrackedAllocatedE5 > 0 && (
            <div className="bg-[#1A1715]/60 border border-[#342F2C] rounded-2xl p-3 flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[#81B29A] shrink-0" />
                <span className="text-[#A89F95] truncate">
                  Tracked: <strong className="text-[#F4F1DE]">₹{e5ToAmount(trackedAllocatedE5).toLocaleString('en-IN')}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[#F2CC8F] shrink-0" />
                <span className="text-[#A89F95] truncate">
                  Untracked Pool: <strong className="text-[#F2CC8F]">₹{e5ToAmount(untrackedAllocatedE5).toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-2.5 w-full">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C837A]" />
            <input
              type="text"
              placeholder="Search envelope or group name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1A1715] border border-[#38322E] text-[#F4F1DE] placeholder-[#6E665E] text-xs rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#E07A5F] transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#1A1715] p-1 rounded-2xl border border-[#38322E] overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'tracked', label: 'Tracked' },
                { id: 'untracked', label: 'Untracked Pool' },
                { id: 'ontrack', label: 'On Track' },
                { id: 'warning', label: 'Warning' },
                { id: 'overbudget', label: 'Over Budget' }
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`px-3 py-1.5 min-h-[36px] text-[11px] font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${statusFilter === filter.id
                    ? 'bg-[#38322E] text-[#F4F1DE] shadow-md border border-[#4A433F]'
                    : 'text-[#A89F95] hover:text-[#F4F1DE]'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoadingCategories || isLoadingEnvelopes ? (
        <CategoryListSkeleton count={3} />
      ) : filteredCategories.length === 0 ? (
        <Card className="text-center py-10 space-y-3 w-full max-w-full">
          <div className="w-12 h-12 rounded-2xl bg-[#2E2A27] text-[#A89F95] flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#F4F1DE]">No budget categories found</h3>
            <p className="text-xs text-[#8C837A] max-w-xs mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No categories match your search or filter criteria.'
                : 'No active budget categories returned from backend.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3.5 w-full max-w-full">
          {filteredCategories.map((cat) => {
            const isExpanded = expandedEnvelopeId === cat.envelope_id;
            const categoryTitle = cat.is_system ? 'Untracked General Budget' : cat.envelopeName;

            return (
              <div
                key={cat.envelope_id}
                className={`bg-[#24201D] border rounded-3xl p-4 transition-all shadow-xl space-y-3.5 w-full overflow-x-hidden min-w-0 ${cat.is_system
                    ? 'border-[#D4A373]/30 bg-gradient-to-b from-[#292420] to-[#211D1A]'
                    : 'border-[#342F2C] hover:border-[#4A433F]'
                  }`}
              >
                {/* Category Header Row: Envelope Heading + Group Name Tag */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-[#F4F1DE] tracking-tight truncate">{categoryTitle}</h3>

                      {/* Group Name Tag */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E07A5F] bg-[#E07A5F]/15 border border-[#E07A5F]/35 px-2.5 py-0.5 rounded-lg shadow-sm">
                        <Folder className="w-3 h-3 text-[#E07A5F]" />
                        <span>{cat.groupName}</span>
                      </span>

                      {/* Untracked Pool Badge */}
                      {cat.is_system && (
                        <Badge variant="amber" className="text-[9px] py-0 px-2 font-bold flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-[#F2CC8F]" /> Untracked Pool
                        </Badge>
                      )}

                      {cat.isOverBudget && (
                        <Badge variant="rose" className="text-[9px] py-0 px-2 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Over Budget
                        </Badge>
                      )}

                      {cat.isWarning && (
                        <Badge variant="amber" className="text-[9px] py-0 px-2 font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> 80%+ Used
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Spending Progress Indicator */}
                {!cat.is_system ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#A89F95] text-[11px]">Usage Status</span>
                      <span
                        className={
                          cat.isOverBudget
                            ? 'text-[#E8A598]'
                            : cat.isWarning
                              ? 'text-[#F2CC8F]'
                              : 'text-[#81B29A]'
                        }
                      >
                        {cat.usagePercent.toFixed(1)}% Spent
                      </span>
                    </div>
                    <ProgressBar
                      value={cat.usagePercent}
                      colorVariant={cat.isOverBudget ? 'rose' : cat.isWarning ? 'amber' : 'emerald'}
                    />
                  </div>
                ) : (
                  <div className="bg-[#1A1715]/70 p-2.5 rounded-2xl border border-[#342F2C] text-xs text-[#A89F95] leading-relaxed flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#F2CC8F] shrink-0" />
                    <span>This pool holds untracked budget allocations reserved for flexible or general spending.</span>
                  </div>
                )}

                {/* Financial Grid (Total, Spent, Remaining) */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#342F2C] text-center">
                  <div className="bg-[#1A1715] p-2.5 rounded-2xl border border-[#342F2C] min-w-0">
                    <p className="text-[9px] text-[#8C837A] uppercase font-bold tracking-wider truncate">Total</p>
                    <p className="text-xs sm:text-sm font-black text-[#F4F1DE] mt-0.5 truncate">
                      ₹{e5ToAmount(cat.allocated_amount_e5).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="bg-[#1A1715] p-2.5 rounded-2xl border border-[#342F2C] min-w-0">
                    <p className="text-[9px] text-[#8C837A] uppercase font-bold tracking-wider truncate">Spent</p>
                    <p className="text-xs sm:text-sm font-black text-[#E8A598] mt-0.5 truncate">
                      ₹{e5ToAmount(cat.spentE5).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="bg-[#1A1715] p-2.5 rounded-2xl border border-[#342F2C] min-w-0">
                    <p className="text-[9px] text-[#8C837A] uppercase font-bold tracking-wider truncate">Remaining</p>
                    <p
                      className={`text-xs sm:text-sm font-black mt-0.5 truncate ${cat.remainingE5 < 0 ? 'text-[#E8A598]' : 'text-[#81B29A]'
                        }`}
                    >
                      ₹{e5ToAmount(cat.remainingE5).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Mapped Transactions Accordion */}
                <button
                  onClick={() => toggleExpand(cat.envelope_id)}
                  className="w-full flex items-center justify-between text-xs text-[#A89F95] hover:text-[#F4F1DE] pt-2 border-t border-[#342F2C] font-semibold cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#E07A5F]" />
                    <span>Mapped Transactions ({cat.matchingDebitTxns.length})</span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[#E07A5F]" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Expanded Transactions List */}
                {isExpanded && (
                  <div className="space-y-2 pt-2 animate-fadeIn">
                    {cat.matchingDebitTxns.length === 0 ? (
                      <div className="p-3 text-center text-xs text-[#8C837A] bg-[#1A1715] border border-dashed border-[#342F2C] rounded-2xl">
                        No expenses logged for this category envelope yet.
                      </div>
                    ) : (
                      cat.matchingDebitTxns.map((txn: Transaction) => {
                        const { dateStr, timeStr } = formatTransactionDateTime(txn.created_at);
                        const envHeading = (cat.is_system || cat.name === 'Unallocated Budget') ? 'General' : (cat.name || 'General');
                        const isBankCard = txn.payment_method === 'bank_card';

                        return (
                          <div
                            key={txn.id}
                            onClick={() => onSelectTxnForEdit?.(txn)}
                            className="bg-[#1A1715] border border-[#342F2C] hover:border-[#E07A5F]/60 hover:bg-[#25201C] cursor-pointer rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-inner transition-all group"
                            title="Click to edit transaction"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-xl bg-[#E8A598]/15 text-[#E8A598] flex items-center justify-center shrink-0 border border-[#E8A598]/20 group-hover:scale-105 transition-transform">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <p className="text-xs font-bold text-[#F4F1DE] group-hover:text-[#E07A5F] transition-colors truncate">
                                  {envHeading}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-[#A89F95] flex-wrap">
                                  <span>{dateStr}</span>
                                  {timeStr && <span>• {timeStr}</span>}
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded font-extrabold border ${isBankCard
                                        ? 'bg-[#818CF8]/15 text-[#818CF8] border-[#818CF8]/30'
                                        : 'bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/30'
                                      }`}
                                  >
                                    {isBankCard ? <CreditCard className="w-2.5 h-2.5 shrink-0" /> : <Building2 className="w-2.5 h-2.5 shrink-0" />}
                                    <span>{isBankCard ? 'Card' : 'Account'}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-black text-[#E8A598] shrink-0">
                              -₹{e5ToAmount(txn.amount_e5).toLocaleString('en-IN')}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Uncategorized Expenses Section */}
      {uncategorizedDebitTxns.length > 0 && (
        <div className="bg-[#24201D] border border-[#38322E] rounded-3xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-[#F4F1DE] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F2CC8F]" />
                Unassigned Expenses
              </h3>
              <p className="text-[11px] text-[#A89F95]">
                {uncategorizedDebitTxns.length} transaction{uncategorizedDebitTxns.length !== 1 ? 's' : ''} outside active category envelopes (click to assign)
              </p>
            </div>
            <span className="text-xs font-black text-[#E8A598]">
              ₹{e5ToAmount(uncategorizedSpentE5).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-2 pt-1 border-t border-[#342F2C]">
            {uncategorizedDebitTxns.map((txn) => {
              const { dateStr, timeStr } = formatTransactionDateTime(txn.created_at);
              const isBankCard = txn.payment_method === 'bank_card';

              return (
                <div
                  key={txn.id}
                  onClick={() => onSelectTxnForEdit?.(txn)}
                  className="bg-[#1A1715] border border-[#342F2C] hover:border-[#F2CC8F]/60 hover:bg-[#25201C] cursor-pointer rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-inner transition-all group"
                  title="Click to assign to an envelope"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-[#F2CC8F]/15 text-[#F2CC8F] flex items-center justify-center shrink-0 border border-[#F2CC8F]/20 group-hover:scale-105 transition-transform">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-bold text-[#F4F1DE] group-hover:text-[#F2CC8F] transition-colors truncate">
                        General
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#A89F95] flex-wrap">
                        <span>{dateStr}</span>
                        {timeStr && <span>• {timeStr}</span>}
                        <span
                          className={`inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded font-extrabold border ${isBankCard
                              ? 'bg-[#818CF8]/15 text-[#818CF8] border-[#818CF8]/30'
                              : 'bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/30'
                            }`}
                        >
                          {isBankCard ? <CreditCard className="w-2.5 h-2.5 shrink-0" /> : <Building2 className="w-2.5 h-2.5 shrink-0" />}
                          <span>{isBankCard ? 'Card' : 'Account'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="amber" className="text-[9px] py-0.5 px-1.5 font-bold">Assign</Badge>
                    <span className="text-xs font-black text-[#E8A598]">
                      -₹{e5ToAmount(txn.amount_e5).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetPage;
