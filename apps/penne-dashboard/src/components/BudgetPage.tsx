import React, { useState, useMemo } from 'react';
import { ActiveCategory, Transaction, EnvelopeGroup, Envelope, e5ToAmount } from '@packages/types';
import { Button } from '@packages/ui';
import {
  Folder,
  Plus,
  Pencil,
  Receipt,
  ChevronDown,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { EnvelopeMonogramBadge } from '../utils/envelopeVisuals';
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
  onSelectEnvelopeForEdit?: (env: Envelope) => void;
  onSelectGroupForEdit?: (group: EnvelopeGroup) => void;
  isLoadingCategories?: boolean;
  isLoadingTransactions?: boolean;
  isLoadingEnvelopes?: boolean;
}

const formatINR = (val: number) => {
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export const BudgetPage: React.FC<BudgetPageProps> = ({
  categories = [],
  transactions = [],
  envelopeGroups = [],
  envelopes = [],
  isServerOffline,
  isMockMode,
  onRetryConnection,
  onToggleMock,
  onOpenNewCategoryModal,
  onSelectTxnForEdit,
  onSelectEnvelopeForEdit,
  onSelectGroupForEdit,
  isLoadingCategories,
  isLoadingEnvelopes
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'healthy' | 'warning' | 'over' | 'untracked'>('all');
  const [expandedEnvId, setExpandedEnvId] = useState<string | null>(null);

  const safeTxns = Array.isArray(transactions) ? transactions : [];

  // Group name lookup
  const groupNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (envelopeGroups || []).forEach((g) => {
      if (g && g.id) map.set(g.id, g.name);
    });
    return map;
  }, [envelopeGroups]);

  // Combine envelopes and categories seamlessly so data is never missed
  const unifiedEnvelopes = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      target_amount_e5: number;
      cadence: string;
      is_system: boolean;
      envelope_group_id?: string;
      groupName?: string;
      matchedEnv?: Envelope;
    }>();

    // 1. Seed from envelopes prop
    (envelopes || []).forEach((env) => {
      if (!env || !env.id) return;
      const gName = env.envelope_group_id ? groupNameMap.get(env.envelope_group_id) : undefined;
      map.set(env.id, {
        id: env.id,
        name: env.name || 'Category Envelope',
        target_amount_e5: env.target_amount_e5 || 0,
        cadence: env.cadence || 'monthly',
        is_system: !!env.is_system,
        envelope_group_id: env.envelope_group_id,
        groupName: gName,
        matchedEnv: env
      });
    });

    // 2. Add or enrich from categories prop
    (categories || []).forEach((cat) => {
      if (!cat || !cat.envelope_id) return;
      const existing = map.get(cat.envelope_id);
      if (existing) {
        if (!existing.target_amount_e5 && cat.allocated_amount_e5) {
          existing.target_amount_e5 = cat.allocated_amount_e5;
        }
        if (cat.name && (!existing.name || existing.name === 'Category Envelope')) {
          existing.name = cat.name;
        }
      } else {
        const matchedEnv = (envelopes || []).find((e) => e && e.id === cat.envelope_id);
        const gId = matchedEnv?.envelope_group_id;
        const gName = gId ? groupNameMap.get(gId) : undefined;
        map.set(cat.envelope_id, {
          id: cat.envelope_id,
          name: cat.name || matchedEnv?.name || 'Category Envelope',
          target_amount_e5: cat.allocated_amount_e5 || 0,
          cadence: cat.cadence || matchedEnv?.cadence || 'monthly',
          is_system: !!cat.is_system,
          envelope_group_id: gId,
          groupName: gName,
          matchedEnv
        });
      }
    });

    return Array.from(map.values());
  }, [envelopes, categories, groupNameMap]);

  // Compute spent per envelope
  const envStats = useMemo(() => {
    const map = new Map<string, { spent_e5: number; count: number }>();
    unifiedEnvelopes.forEach((e) => {
      map.set(e.id, { spent_e5: 0, count: 0 });
    });

    safeTxns.forEach((t) => {
      if (t && t.envelope_id && t.txn_type === 'debit') {
        const current = map.get(t.envelope_id);
        if (current) {
          current.spent_e5 += t.amount_e5 || 0;
          current.count += 1;
        } else {
          map.set(t.envelope_id, { spent_e5: t.amount_e5 || 0, count: 1 });
        }
      }
    });
    return map;
  }, [unifiedEnvelopes, safeTxns]);

  const totalBudgetedAmount = unifiedEnvelopes
    .filter((e) => !e.is_system)
    .reduce((acc, e) => acc + e5ToAmount(e.target_amount_e5), 0);

  const totalSpentAmount = safeTxns
    .filter((t) => t && t.txn_type === 'debit')
    .reduce((acc, t) => acc + e5ToAmount(t.amount_e5), 0);

  const totalIncomeAmount = safeTxns
    .filter((t) => t && t.txn_type === 'credit')
    .reduce((acc, t) => acc + e5ToAmount(t.amount_e5), 0);

  const totalRemainingAmount = totalIncomeAmount - totalSpentAmount;

  const filteredEnvelopes = useMemo(() => {
    return unifiedEnvelopes.filter((e) => {
      if (filterTab === 'untracked') return e.is_system;
      if (filterTab === 'all') {
        const hasCustom = unifiedEnvelopes.some((item) => !item.is_system);
        if (hasCustom && e.is_system) return false;
        return true;
      }
      if (e.is_system) return false;
      const stats = envStats.get(e.id) || { spent_e5: 0, count: 0 };
      const spent = e5ToAmount(stats.spent_e5);
      const target = e5ToAmount(e.target_amount_e5);
      const pct = target > 0 ? (spent / target) * 100 : 0;

      if (filterTab === 'warning') return pct >= 80 && pct <= 100;
      if (filterTab === 'over') return pct > 100;
      if (filterTab === 'healthy') return pct < 80;
      return true;
    });
  }, [unifiedEnvelopes, filterTab, envStats]);

  // Unassigned debit transactions
  const unassignedTxns = useMemo(() => {
    const knownEnvIds = new Set(unifiedEnvelopes.map((e) => e.id));
    return safeTxns.filter((t) => (!t.envelope_id || !knownEnvIds.has(t.envelope_id)) && t.txn_type === 'debit');
  }, [safeTxns, unifiedEnvelopes]);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fadeIn pb-28 overflow-x-hidden">
      {/* Offline Banner */}
      {isServerOffline && !isMockMode && (
        <div className="velvet-card p-4 space-y-3 text-left border-rose-500/30 bg-rose-950/30">
          <div className="flex items-center gap-2 text-rose-300">
            <WifiOff className="w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-sm text-white">Backend Server Offline</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            Cannot reach backend server. Please verify <code className="text-[#FBD8B3] font-mono">penne-server</code> is running.
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

      {/* Hero Budget Allocation Card */}
      {isLoadingCategories ? (
        <BudgetOverviewSkeleton />
      ) : (
        <div className="velvet-card p-5 relative overflow-hidden shadow-2xl">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                Total Envelope Budget
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                {formatINR(totalBudgetedAmount)}
              </div>
            </div>
            {onOpenNewCategoryModal && (
              <button
                onClick={onOpenNewCategoryModal}
                className="px-3.5 py-1.5 rounded-xl bg-[#FBD8B3] hover:bg-[#f7c495] text-[#1A1835] font-black text-xs flex items-center gap-1.5 shadow-[0_2px_12px_rgba(251,216,179,0.35)] active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3] text-[#1A1835]" />
                <span>Envelope</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Spent in Envelopes</span>
              <span className="text-[#FFB5A7] font-bold text-sm">{formatINR(totalSpentAmount)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">General Surplus Pool</span>
              <span className="text-[#A8E6CF] font-bold text-sm">{formatINR(totalRemainingAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'all', label: 'All Active' },
          { id: 'healthy', label: 'Healthy (<80%)' },
          { id: 'warning', label: 'Warning (80%+)' },
          { id: 'over', label: 'Over Budget' },
          { id: 'untracked', label: 'General Pool' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 ${
              filterTab === tab.id
                ? 'bg-[#FBD8B3] text-[#1A1835] font-black shadow-sm'
                : 'bg-[#232044] text-slate-300 border border-white/5 hover:text-white hover:bg-[#2C2856]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Unassigned Expenses Alert Ticket */}
      {unassignedTxns.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#FDEBD6] hover:bg-[#fce3cb] transition-colors text-[#1A1835] flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#1A1835] text-[#FBD8B3] flex items-center justify-center font-bold shrink-0">
              !
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-[#1A1835] truncate">
                {unassignedTxns.length} Unassigned Expense{unassignedTxns.length > 1 ? 's' : ''}
              </p>
              <p className="text-[10px] font-mono text-indigo-950/80 truncate">Map to envelope for zero-based balance</p>
            </div>
          </div>
          {onSelectTxnForEdit && (
            <button
              onClick={() => onSelectTxnForEdit(unassignedTxns[0])}
              className="px-3 py-1.5 rounded-xl bg-[#1A1835] text-white font-bold text-[11px] shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer font-mono shrink-0 ml-2"
            >
              Assign
            </button>
          )}
        </div>
      )}

      {/* Envelope Cards List */}
      {isLoadingEnvelopes ? (
        <CategoryListSkeleton count={3} />
      ) : filteredEnvelopes.length === 0 ? (
        <div className="velvet-card p-8 text-center text-slate-400 text-xs font-mono">
          No budget envelopes match this filter.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredEnvelopes.map((env) => {
            const stats = envStats.get(env.id) || { spent_e5: 0, count: 0 };
            const spent = e5ToAmount(stats.spent_e5);
            const target = e5ToAmount(env.target_amount_e5);
            const remaining = target - spent;
            const pct = target > 0 ? Math.min(Math.round((spent / target) * 100), 150) : 0;
            const isWarning = pct >= 80 && pct <= 100;
            const isOver = pct > 100;
            const isExpanded = expandedEnvId === env.id;

            const mappedTxns = safeTxns.filter((t) => t && t.envelope_id === env.id && t.txn_type === 'debit');

            return (
              <div key={env.id} className="velvet-card p-4 space-y-3 shadow-xl">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 min-w-0">
                    <EnvelopeMonogramBadge name={env.name} size="md" />
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-white truncate">{env.name || 'Custom Category'}</h3>
                      <span className="text-[10px] font-mono text-slate-400 capitalize">{env.cadence || 'monthly'} allocation</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isOver
                          ? 'bg-[#FFB5A7]/20 text-[#FFB5A7] border border-[#FFB5A7]/30'
                          : isWarning
                          ? 'bg-[#FBD8B3]/20 text-[#FBD8B3] border border-[#FBD8B3]/30'
                          : 'bg-[#A8E6CF]/20 text-[#A8E6CF] border border-[#A8E6CF]/20'
                      }`}
                    >
                      {isOver ? 'Over Limit' : isWarning ? '80%+ Alert' : 'Healthy'}
                    </span>
                    {onSelectEnvelopeForEdit && (
                      <button
                        onClick={() =>
                          onSelectEnvelopeForEdit(
                            env.matchedEnv || {
                              id: env.id,
                              user_uuid: '',
                              envelope_group_id: env.envelope_group_id || '',
                              name: env.name,
                              target_amount_e5: env.target_amount_e5,
                              cadence: env.cadence,
                              country_iso2: 'IN',
                              is_system: env.is_system,
                            }
                          )
                        }
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                        title="Edit Envelope"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar styled with track dots */}
                <div className="space-y-1.5">
                  <div className="relative h-3 w-full bg-[#1A1835] rounded-full overflow-hidden p-0.5 border border-white/5 track-dots">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-[#FFB5A7]' : isWarning ? 'bg-[#FBD8B3]' : 'bg-[#A8E6CF]'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>{pct}% allocated burn</span>
                    <span>Safe: ~{formatINR(Math.round(Math.max(0, remaining) / 22))}/day</span>
                  </div>
                </div>

                {/* 3-Column Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center font-mono">
                  <div className="velvet-card-subtle p-2">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Budget</span>
                    <span className="text-xs font-semibold text-slate-200">{formatINR(target)}</span>
                  </div>
                  <div className="velvet-card-subtle p-2">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Spent</span>
                    <span className={`text-xs font-semibold ${isOver ? 'text-[#FFB5A7]' : 'text-slate-200'}`}>
                      {formatINR(spent)}
                    </span>
                  </div>
                  <div className="velvet-card-subtle p-2">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Left</span>
                    <span className={`text-xs font-bold ${remaining < 0 ? 'text-[#FFB5A7]' : 'text-[#FBD8B3]'}`}>
                      {formatINR(remaining)}
                    </span>
                  </div>
                </div>

                {/* Mapped Transactions Accordion */}
                {mappedTxns.length > 0 && (
                  <div className="pt-1">
                    <button
                      onClick={() => setExpandedEnvId(isExpanded ? null : env.id)}
                      className="w-full text-left text-[11px] font-mono text-slate-300 flex items-center justify-between py-1.5 hover:text-white cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-[#FBD8B3]" />
                        <span>Mapped Receipts ({mappedTxns.length})</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-[#FBD8B3]' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-[#FBD8B3]/30 text-xs font-mono animate-slide-down">
                        {mappedTxns.map((tx) => (
                          <div
                            key={tx.id}
                            onClick={() => onSelectTxnForEdit?.(tx)}
                            className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 cursor-pointer text-[11px] transition-colors"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 mr-2">
                              <span className="text-slate-200 truncate">
                                {env.name}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black shrink-0 tracking-wider uppercase leading-none shadow-sm ${
                                  tx.payment_method === 'bank_card'
                                    ? 'bg-[#C8B6FF]/25 text-[#E2D8FF] border border-[#C8B6FF]/55'
                                    : 'bg-[#64D2FF]/20 text-[#64D2FF] border border-[#64D2FF]/50'
                                }`}
                                title={tx.payment_method === 'bank_card' ? 'Obsidian Card (CC)' : 'Primary Bank (BA)'}
                              >
                                {tx.payment_method === 'bank_card' ? 'CC' : 'BA'}
                              </span>
                            </div>
                            <span className="text-[#FFB5A7] font-bold shrink-0">
                              -{formatINR(e5ToAmount(tx.amount_e5))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetPage;
