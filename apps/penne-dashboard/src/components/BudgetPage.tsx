import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActiveCategory,
  Transaction,
  EnvelopeGroup,
  Envelope,
  DashboardSummary,
  Subscription,
  SubscriptionSummary,
  SubscriptionStatus,
  SubscriptionCycle,
  e5ToAmount,
} from '@packages/types';
import { Button } from '@packages/ui';
import {
  Folder,
  Plus,
  Pencil,
  Receipt,
  ChevronDown,
  WifiOff,
  RefreshCw,
  Calendar,
  Clock,
  Zap,
  Play,
  Pause,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { EnvelopeMonogramBadge } from '../utils/envelopeVisuals';
import { calculateSafeDailySpend } from '../utils/cadence';
import { BudgetOverviewSkeleton, CategoryListSkeleton } from './Skeleton';
import { PageTagHeader } from './PageTagHeader';
import { QUERY_KEYS } from '../hooks/useDashboardData';
import { subscriptionsApi } from '../services/api';
import { SubscriptionModal } from './Modals';

const getSubscriptionBrand = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('netflix')) {
    return { bg: 'bg-red-500/15 text-red-400 border-red-500/30', monogram: 'NF' };
  }
  if (lower.includes('spotify')) {
    return { bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', monogram: 'SP' };
  }
  if (lower.includes('youtube')) {
    return { bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30', monogram: 'YT' };
  }
  if (lower.includes('apple') || lower.includes('icloud')) {
    return { bg: 'bg-slate-300/15 text-slate-200 border-slate-400/30', monogram: '' };
  }
  if (lower.includes('prime') || lower.includes('amazon')) {
    return { bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30', monogram: 'PR' };
  }
  if (lower.includes('chatgpt') || lower.includes('openai')) {
    return { bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30', monogram: 'AI' };
  }
  if (lower.includes('github') || lower.includes('copilot')) {
    return { bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30', monogram: 'GH' };
  }
  if (lower.includes('disney') || lower.includes('hotstar')) {
    return { bg: 'bg-blue-600/15 text-blue-300 border-blue-500/30', monogram: 'D+' };
  }
  const parts = name.trim().split(/\s+/);
  const monogram = parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return { bg: 'bg-[#FBD8B3]/15 text-[#FBD8B3] border-[#FBD8B3]/30', monogram };
};

const getDaysUntil = (dateStr?: string) => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((utcTarget - utcNow) / (1000 * 60 * 60 * 24));
};

interface BudgetPageProps {
  categories: ActiveCategory[];
  transactions: Transaction[];
  dashboardSummary?: DashboardSummary | null;
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
  dashboardSummary,
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

  // Sub-view Toggle
  const [activeSubView, setActiveSubView] = useState<'envelopes' | 'subscriptions'>('envelopes');
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subToEdit, setSubToEdit] = useState<Subscription | null>(null);
  const [subFilter, setSubFilter] = useState<'all' | 'due_soon' | 'monthly' | 'annual' | 'paused'>('all');
  const [renewingSubId, setRenewingSubId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id?: string; type: 'success' | 'error'; message: string } | null>(null);

  const queryClient = useQueryClient();

  const {
    data: subscriptionsData,
    isLoading: isLoadingSubs,
  } = useQuery<SubscriptionSummary>({
    queryKey: QUERY_KEYS.subscriptions,
    queryFn: () => subscriptionsApi.getSubscriptions(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });

  const subscriptionsList = useMemo(() => {
    return Array.isArray(subscriptionsData?.subscriptions) ? subscriptionsData.subscriptions : [];
  }, [subscriptionsData]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptionsList.filter((s) => {
      if (subFilter === 'all') return true;
      if (subFilter === 'paused') return s.status === 'paused';
      if (subFilter === 'monthly') return s.billing_cycle === 'monthly' && s.status !== 'paused';
      if (subFilter === 'annual') return s.billing_cycle === 'yearly' && s.status !== 'paused';
      if (subFilter === 'due_soon') {
        if (s.status === 'paused') return false;
        const days = getDaysUntil(s.next_billing_date);
        return days !== null && days >= 0 && days <= 7;
      }
      return true;
    });
  }, [subscriptionsList, subFilter]);

  const handleRenewSubscription = async (sub: Subscription) => {
    setRenewingSubId(sub.id);
    setActionFeedback(null);
    try {
      await subscriptionsApi.renewSubscription(sub.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptions }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardSummary }),
      ]);
      setActionFeedback({
        id: sub.id,
        type: 'success',
        message: `Renewed ${sub.name}! Next charge scheduled for next cycle.`,
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback({
        id: sub.id,
        type: 'error',
        message: `Renewal failed: ${err.message || 'Error'}`,
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } finally {
      setRenewingSubId(null);
    }
  };

  const handleToggleSubStatus = async (sub: Subscription) => {
    try {
      const nextStatus: SubscriptionStatus = sub.status === 'active' ? 'paused' : 'active';
      await subscriptionsApi.updateSubscription({
        id: sub.id,
        name: sub.name,
        amount_e5: sub.amount_e5,
        billing_cycle: sub.billing_cycle,
        next_billing_date: sub.next_billing_date,
        payment_method: sub.payment_method,
        status: nextStatus,
        envelope_id: sub.envelope_id || undefined,
        auto_renew: sub.auto_renew,
        notes: sub.notes,
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptions });
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleSaveSubscription = async (payload: Partial<Subscription>) => {
    try {
      if (payload.id) {
        await subscriptionsApi.updateSubscription(payload as any);
      } else {
        await subscriptionsApi.createSubscription(payload as any);
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptions });
    } catch (err: any) {
      console.error('Failed to save subscription:', err);
      throw err;
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      await subscriptionsApi.deleteSubscription(id);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptions });
    } catch (err: any) {
      console.error('Failed to delete subscription:', err);
      throw err;
    }
  };

  const safeTxns = Array.isArray(transactions) ? transactions : [];

  // Group name lookup
  const groupNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (envelopeGroups || []).forEach((g) => {
      if (g && g.id) map.set(g.id, g.name);
    });
    return map;
  }, [envelopeGroups]);

  // Category allocation lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, ActiveCategory>();
    (categories || []).forEach((c) => {
      if (c && c.envelope_id) {
        map.set(c.envelope_id, c);
      }
    });
    return map;
  }, [categories]);

  // Combine envelopes and categories seamlessly so data is never missed
  const unifiedEnvelopes = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      target_amount_e5: number;
      allocated_amount_e5: number;
      spent_amount_e5: number;
      cadence: string;
      is_system: boolean;
      envelope_group_id?: string;
      groupName?: string;
      matchedEnv?: Envelope;
      allocation_id?: string;
    }>();

    // 1. Seed from envelopes prop
    (envelopes || []).forEach((env) => {
      if (!env || !env.id) return;
      const gName = env.envelope_group_id ? groupNameMap.get(env.envelope_group_id) : undefined;
      const activeCat = categoryMap.get(env.id);
      map.set(env.id, {
        id: env.id,
        name: activeCat?.name || env.name || 'Category Envelope',
        target_amount_e5: env.target_amount_e5 || 0,
        allocated_amount_e5: (activeCat && activeCat.allocated_amount_e5 !== undefined)
          ? activeCat.allocated_amount_e5
          : (env.target_amount_e5 || 0),
        spent_amount_e5: activeCat?.spent_amount_e5 ?? 0,
        cadence: activeCat?.cadence || env.cadence || 'monthly',
        is_system: !!(activeCat ? activeCat.is_system : env.is_system),
        envelope_group_id: env.envelope_group_id,
        groupName: gName,
        matchedEnv: env,
        allocation_id: activeCat?.allocation_id,
      });
    });

    // 2. Add or enrich from categories prop for any category not in envelopes yet
    (categories || []).forEach((cat) => {
      if (!cat || !cat.envelope_id) return;
      if (map.has(cat.envelope_id)) return;
      const matchedEnv = (envelopes || []).find((e) => e && e.id === cat.envelope_id);
      const gId = matchedEnv?.envelope_group_id;
      const gName = gId ? groupNameMap.get(gId) : undefined;
      map.set(cat.envelope_id, {
        id: cat.envelope_id,
        name: cat.name || matchedEnv?.name || 'Category Envelope',
        target_amount_e5: matchedEnv?.target_amount_e5 || cat.allocated_amount_e5 || 0,
        allocated_amount_e5: cat.allocated_amount_e5 || 0,
        spent_amount_e5: cat.spent_amount_e5 ?? 0,
        cadence: cat.cadence || matchedEnv?.cadence || 'monthly',
        is_system: !!cat.is_system,
        envelope_group_id: gId,
        groupName: gName,
        matchedEnv,
        allocation_id: cat.allocation_id,
      });
    });

    return Array.from(map.values());
  }, [envelopes, categories, categoryMap, groupNameMap]);

  // Compute spent per envelope using authoritative active allocation spent amount,
  // plus any optimistic pending transactions created client-side.
  const envStats = useMemo(() => {
    const map = new Map<string, { spent_e5: number; count: number }>();
    const hasCategoryData = categoryMap.size > 0;

    unifiedEnvelopes.forEach((e) => {
      // Use the database's cadence-scoped active cycle spent amount as authoritative base
      map.set(e.id, {
        spent_e5: hasCategoryData ? (e.spent_amount_e5 || 0) : 0,
        count: 0
      });
    });

    safeTxns.forEach((t) => {
      if (t && t.envelope_id && t.txn_type === 'debit') {
        const current = map.get(t.envelope_id);
        if (current) {
          current.count += 1;
          // If we have authoritative category data from backend, only add pending optimistic debits
          // If category data is empty/unavailable, fall back to summing in-memory transactions
          if (!hasCategoryData || t.id.startsWith('opt-txn-')) {
            current.spent_e5 += t.amount_e5 || 0;
          }
        } else {
          map.set(t.envelope_id, {
            spent_e5: (!hasCategoryData || t.id.startsWith('opt-txn-')) ? (t.amount_e5 || 0) : 0,
            count: 1
          });
        }
      }
    });
    return map;
  }, [unifiedEnvelopes, safeTxns, categoryMap]);

  const totalBudgetedAmount = unifiedEnvelopes
    .filter((e) => !e.is_system)
    .reduce((acc, e) => acc + e5ToAmount(e.allocated_amount_e5 || e.target_amount_e5), 0);

  const totalEnvelopeSpentAmount = unifiedEnvelopes
    .filter((e) => !e.is_system)
    .reduce((acc, e) => {
      const stats = envStats.get(e.id);
      return acc + e5ToAmount(stats ? stats.spent_e5 : 0);
    }, 0);

  const totalSpentAmount = dashboardSummary
    ? e5ToAmount(dashboardSummary.total_expense_e5)
    : totalEnvelopeSpentAmount;

  const totalIncomeAmount = dashboardSummary
    ? e5ToAmount(dashboardSummary.total_income_e5)
    : safeTxns
        .filter((t) => t && t.txn_type === 'credit')
        .reduce((acc, t) => acc + e5ToAmount(t.amount_e5), 0);

  const totalRemainingAmount = dashboardSummary
    ? e5ToAmount(dashboardSummary.total_remaining_e5)
    : totalIncomeAmount - totalSpentAmount;

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
      const target = e5ToAmount(e.allocated_amount_e5 || e.target_amount_e5);
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
      {/* Top Tag Header */}
      <PageTagHeader
        title={activeSubView === 'subscriptions' ? 'Subscriptions & Recurring' : 'Budgets & Envelopes'}
        dotColor={activeSubView === 'subscriptions' ? '#A8E6CF' : '#C8B6FF'}
        badgeText={
          activeSubView === 'subscriptions'
            ? `${subscriptionsData?.active_count ?? subscriptionsList.filter(s => s.status === 'active').length} Active`
            : `${unifiedEnvelopes.filter((e) => !e.is_system).length} Envelopes`
        }
      />

      {/* Segmented Sub-view Navigation Toggle */}
      <div className="flex items-center p-1 rounded-2xl bg-[#14122B]/90 border border-white/10 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveSubView('envelopes')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
            activeSubView === 'envelopes'
              ? 'bg-gradient-to-r from-[#2A2454] to-[#1E1A3D] text-white shadow-md border border-white/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Folder className="w-3.5 h-3.5 text-[#FBD8B3]" />
          <span>Envelopes ({unifiedEnvelopes.filter((e) => !e.is_system).length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubView('subscriptions')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
            activeSubView === 'subscriptions'
              ? 'bg-gradient-to-r from-[#2A2454] to-[#1E1A3D] text-white shadow-md border border-white/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-[#A8E6CF]" />
          <span>Subscriptions ({subscriptionsData?.active_count ?? subscriptionsList.length})</span>
        </button>
      </div>

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

      {/* SUB-VIEW 1: ENVELOPES */}
      {activeSubView === 'envelopes' && (
        <div className="space-y-4">
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
              <span className="text-[#FFB5A7] font-bold text-sm">{formatINR(totalEnvelopeSpentAmount)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">General Surplus Pool</span>
              <span className="text-[#A8E6CF] font-bold text-sm">{formatINR(totalRemainingAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Next Cadence Buffered Paycheck Card */}
      {dashboardSummary?.buffered_remaining_e5 && dashboardSummary.buffered_remaining_e5 > 0 ? (
        <div className="velvet-card p-3.5 border-indigo-500/30 bg-[#1D1A3B] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#232044] border border-[#FBD8B3]/30 flex items-center justify-center text-[#FBD8B3] shrink-0 font-bold text-xs">
              ₹
            </div>
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                Next Cadence Buffer
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-emerald-300">
                +{formatINR(e5ToAmount(dashboardSummary.buffered_remaining_e5))}
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#FBD8B3]/10 text-[#FBD8B3] text-[9px] font-mono font-bold border border-[#FBD8B3]/20">
            Unlocks on 1st
          </span>
        </div>
      ) : null}

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
            const target = e5ToAmount(env.allocated_amount_e5 || env.target_amount_e5);
            const remaining = target - spent;
            const pct = target > 0 ? Math.min(Math.round((spent / target) * 100), 150) : 0;
            const isWarning = pct >= 80 && pct <= 100;
            const isOver = pct > 100;
            const isExpanded = expandedEnvId === env.id;
            const { safeDaily, daysRemaining } = calculateSafeDailySpend(remaining, env.cadence);

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
                            env.matchedEnv
                              ? {
                                  ...env.matchedEnv,
                                  name: env.name,
                                  target_amount_e5: env.allocated_amount_e5 || env.target_amount_e5,
                                  cadence: env.cadence,
                                }
                              : {
                                  id: env.id,
                                  user_uuid: '',
                                  envelope_group_id: env.envelope_group_id || '',
                                  name: env.name,
                                  target_amount_e5: env.allocated_amount_e5 || env.target_amount_e5,
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
                    <span
                      title={`${formatINR(Math.max(0, remaining))} remaining across ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} in this ${env.cadence || 'monthly'} cadence`}
                    >
                      Safe: ~{formatINR(safeDaily)}/day
                    </span>
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
      )}

      {/* SUB-VIEW 2: SUBSCRIPTIONS TRACKER */}
      {activeSubView === 'subscriptions' && (
        <div className="space-y-4">
          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 animate-fadeIn ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          {/* Hero Subscription Commitment Card */}
          <div className="velvet-card p-5 relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                  Total Monthly Commitment
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                  {formatINR(e5ToAmount(subscriptionsData?.total_monthly_commitment_e5 ?? 0))}
                  <span className="text-xs text-slate-400 font-normal ml-1">/ month</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubToEdit(null);
                  setIsSubModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#FBD8B3] hover:bg-[#f7c495] text-[#1A1835] font-black text-xs flex items-center gap-1.5 shadow-[0_2px_12px_rgba(251,216,179,0.35)] active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3] text-[#1A1835]" />
                <span>Subscription</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Active</span>
                <span className="text-[#A8E6CF] font-bold text-sm">
                  {subscriptionsData?.active_count ?? subscriptionsList.filter((s) => s.status === 'active').length}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Paused</span>
                <span className="text-slate-400 font-bold text-sm">
                  {subscriptionsData?.paused_count ?? subscriptionsList.filter((s) => s.status === 'paused').length}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Annualized</span>
                <span className="text-[#C8B6FF] font-bold text-sm">
                  {formatINR(e5ToAmount((subscriptionsData?.total_monthly_commitment_e5 ?? 0) * 12))}
                </span>
              </div>
            </div>
          </div>

          {/* Next Upcoming Banner */}
          {subscriptionsData?.next_upcoming && (
            <div className="velvet-card p-3.5 border-indigo-500/30 bg-[#1D1A3B] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#232044] border border-[#A8E6CF]/30 flex items-center justify-center text-[#A8E6CF] shrink-0 font-bold text-xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Next Renewal
                    </span>
                    {(() => {
                      const days = getDaysUntil(subscriptionsData.next_upcoming.next_billing_date);
                      if (days === null) return null;
                      if (days <= 3) {
                        return (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-[#FFB5A7] text-[9px] font-mono font-bold animate-pulse">
                            {days <= 0 ? 'Today' : `In ${days}d`}
                          </span>
                        );
                      }
                      return (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#A8E6CF]/20 text-[#A8E6CF] text-[9px] font-mono font-bold">
                          In {days}d
                        </span>
                      );
                    })()}
                  </div>
                  <div className="font-bold text-white truncate text-xs sm:text-sm">
                    {subscriptionsData.next_upcoming.name} • {formatINR(e5ToAmount(subscriptionsData.next_upcoming.amount_e5))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRenewSubscription(subscriptionsData.next_upcoming!)}
                disabled={renewingSubId === subscriptionsData.next_upcoming.id}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[10px] font-mono font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1"
              >
                {renewingSubId === subscriptionsData.next_upcoming.id ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Zap className="w-3 h-3 text-[#FBD8B3]" />
                )}
                <span>Renew Early</span>
              </button>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: `All (${subscriptionsList.length})` },
              { id: 'due_soon', label: 'Due Soon' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'annual', label: 'Annual' },
              { id: 'paused', label: 'Paused' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSubFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  subFilter === tab.id
                    ? 'bg-white/15 text-white shadow-sm border border-white/20'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subscriptions List */}
          {isLoadingSubs ? (
            <CategoryListSkeleton />
          ) : filteredSubscriptions.length === 0 ? (
            <div className="velvet-card p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">No Subscriptions Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {subFilter === 'all'
                    ? 'Track your monthly Netflix, Spotify, gym, and cloud subscriptions with adaptive Cadence matching.'
                    : `No subscriptions match the "${subFilter}" filter.`}
                </p>
              </div>
              {subFilter === 'all' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSubToEdit(null);
                    setIsSubModalOpen(true);
                  }}
                  className="gap-1.5 text-xs font-bold mx-auto"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add First Subscription</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubscriptions.map((sub) => {
                const brand = getSubscriptionBrand(sub.name);
                const days = getDaysUntil(sub.next_billing_date);
                const isPaused = sub.status === 'paused';
                const isDueSoon = !isPaused && days !== null && days >= 0 && days <= 7;
                const isRenewing = renewingSubId === sub.id;
                const linkedEnvelope = sub.envelope_id ? unifiedEnvelopes.find((e) => e.id === sub.envelope_id) : null;

                return (
                  <div
                    key={sub.id}
                    className={`velvet-card p-4 transition-all duration-200 relative overflow-hidden group ${
                      isPaused ? 'opacity-70 border-white/5' : 'hover:border-white/20 hover:shadow-lg'
                    }`}
                  >
                    {/* Top Row: Brand Monogram + Title + Amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${brand.bg}`}
                        >
                          {brand.monogram}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-white truncate">{sub.name}</h4>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                              {sub.billing_cycle}
                            </span>
                            {isPaused && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/20">
                                Paused
                              </span>
                            )}
                          </div>
                          {sub.notes && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                              {sub.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <div className="text-base sm:text-lg font-black font-mono text-white">
                          {formatINR(e5ToAmount(sub.amount_e5))}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block -mt-0.5">
                          /{sub.billing_cycle === 'yearly' ? 'yr' : sub.billing_cycle === 'quarterly' ? 'qtr' : sub.billing_cycle === 'weekly' ? 'wk' : 'mo'}
                        </span>
                      </div>
                    </div>

                    {/* Meta Row: Next Billing Date + Linked Envelope */}
                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-white/5 text-xs font-mono">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Next: {sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                        </span>
                        {days !== null && !isPaused && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                              isDueSoon ? 'bg-rose-500/20 text-[#FFB5A7]' : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            {days <= 0 ? 'Due Today' : `In ${days}d`}
                          </span>
                        )}
                      </div>

                      {linkedEnvelope && (
                        <div className="flex items-center gap-1 text-[11px] text-[#FBD8B3] bg-[#FBD8B3]/10 px-2 py-0.5 rounded-lg border border-[#FBD8B3]/20">
                          <EnvelopeMonogramBadge name={linkedEnvelope.name} size="xs" />
                          <span className="truncate max-w-[100px]">{linkedEnvelope.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Adaptive Smart Intent Pill */}
                    <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono bg-white/[0.02] border border-white/5 rounded-xl px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 text-slate-400 truncate mr-2">
                        {sub.occurrence_count && sub.occurrence_count >= 2 ? (
                          <>
                            <Zap className="w-3 h-3 text-[#A8E6CF] shrink-0" />
                            <span className="text-[#A8E6CF] font-bold">Calibrated (±12h)</span>
                          </>
                        ) : sub.occurrence_count && sub.occurrence_count === 1 ? (
                          <>
                            <RefreshCw className="w-3 h-3 text-[#FBD8B3] shrink-0" />
                            <span className="text-[#FBD8B3] font-bold">Learning (±24h)</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-[#C8B6FF] shrink-0" />
                            <span className="text-[#C8B6FF] font-bold">Initial (±48h)</span>
                          </>
                        )}
                        {sub.merchant_pattern && (
                          <span className="text-slate-400 truncate max-w-[140px]" title={sub.merchant_pattern}>
                            • {sub.merchant_pattern}
                          </span>
                        )}
                      </div>

                      <span className="text-slate-400 shrink-0 capitalize">
                        {sub.payment_method === 'bank_card' ? 'Card' : sub.payment_method === 'upi' ? 'UPI' : 'Bank'}
                      </span>
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSubStatus(sub)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-3 h-3 text-[#A8E6CF]" />
                              <span>Resume</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-3 h-3 text-slate-400" />
                              <span>Pause</span>
                            </>
                          )}
                        </button>

                        {!isPaused && (
                          <button
                            type="button"
                            onClick={() => handleRenewSubscription(sub)}
                            disabled={isRenewing}
                            className="px-2.5 py-1 rounded-lg bg-[#A8E6CF]/10 hover:bg-[#A8E6CF]/20 text-[#A8E6CF] border border-[#A8E6CF]/20 text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isRenewing ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3" />
                            )}
                            <span>Renew Now</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSubToEdit(sub);
                            setIsSubModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Edit Subscription"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubscription(sub.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-[#FFB5A7] transition-colors cursor-pointer"
                          title="Delete Subscription"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Subscription Add / Edit Modal */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => {
          setIsSubModalOpen(false);
          setSubToEdit(null);
        }}
        subscriptionToEdit={subToEdit}
        envelopes={envelopes}
        onSubmit={handleSaveSubscription}
        onDelete={handleDeleteSubscription}
      />
    </div>
  );
};

export default BudgetPage;
