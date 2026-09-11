import React, { useState, useMemo } from 'react';
import { Transaction, EnvelopeGroup, Envelope, ActiveCategory, e5ToAmount, parseUtcDate } from '@packages/types';
import { Button } from '@packages/ui';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CreditCard,
  Landmark,
  Search,
  Filter,
  X,
  Plus,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { formatTransactionDateTime } from './HomePage';
import { TransactionListSkeleton } from './Skeleton';

interface TransactionsPageProps {
  transactions: Transaction[];
  envelopeGroups?: EnvelopeGroup[];
  envelopes?: Envelope[];
  categories?: ActiveCategory[];
  isServerOffline?: boolean;
  isMockMode?: boolean;
  onRetryConnection?: () => void;
  onToggleMock?: () => void;
  onOpenNewTxnModal: () => void;
  onSelectTxnForEdit?: (txn: Transaction) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isLoadingTransactions?: boolean;
}

const formatINR = (val: number) => {
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
};

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  envelopes = [],
  categories = [],
  isServerOffline,
  isMockMode,
  onRetryConnection,
  onToggleMock,
  onOpenNewTxnModal,
  onSelectTxnForEdit,
  onLoadMore,
  hasMore,
  isLoadingMore,
  isLoadingTransactions
}) => {
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState<'all' | 'bank_card' | 'bank_account'>('all');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit' | 'transfer'>('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const safeTxns = Array.isArray(transactions) ? transactions : [];
  const safeEnvelopes = Array.isArray(envelopes) ? envelopes : [];

  // Sort newest transactions first consistently with HomePage
  const sortedTxns = useMemo(() => {
    return [...safeTxns].sort((a, b) => {
      const timeA = parseUtcDate(a.created_at || a.CreatedAt)?.getTime() || 0;
      const timeB = parseUtcDate(b.created_at || b.CreatedAt)?.getTime() || 0;
      return timeB - timeA;
    });
  }, [safeTxns]);

  const envelopeMap = useMemo(() => {
    const map = new Map<string, { id: string; name?: string }>();
    safeEnvelopes.forEach((e) => {
      if (e && e.id) map.set(e.id, e);
    });
    (categories || []).forEach((c) => {
      if (c && c.envelope_id) {
        const existing = map.get(c.envelope_id);
        if (existing) {
          if (!existing.name && c.name) existing.name = c.name;
        } else {
          map.set(c.envelope_id, { id: c.envelope_id, name: c.name });
        }
      }
    });
    return map;
  }, [safeEnvelopes, categories]);

  const { cardCount, bankCount } = useMemo(() => {
    let cards = 0;
    let bank = 0;
    sortedTxns.forEach((t) => {
      if (!t) return;
      if (t.payment_method === 'bank_card') cards++;
      else bank++;
    });
    return { cardCount: cards, bankCount: bank };
  }, [sortedTxns]);

  const filteredTxns = useMemo(() => {
    return sortedTxns.filter((t) => {
      if (!t) return false;
      if (filterMethod !== 'all' && t.payment_method !== filterMethod) return false;
      if (filterType !== 'all' && t.txn_type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const env = t.envelope_id ? envelopeMap.get(t.envelope_id) : null;
        const envName = (env?.name || '').toLowerCase();
        const method = (t.payment_method || '').toLowerCase();
        const type = (t.txn_type || '').toLowerCase();
        return envName.includes(q) || method.includes(q) || type.includes(q);
      }
      return true;
    });
  }, [sortedTxns, filterMethod, filterType, search, envelopeMap]);

  interface DateGroupedTransactions {
    key: string;
    label: string;
    subLabel?: string;
    totalExpenseE5: number;
    totalIncomeE5: number;
    txns: Transaction[];
  }

  // Date-wise separation: Today, Yesterday, and then "date and day" (e.g. 10 Sep, Wednesday)
  const groupedTxns = useMemo(() => {
    const groups: DateGroupedTransactions[] = [];
    const groupMap = new Map<string, DateGroupedTransactions>();

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    filteredTxns.forEach((tx) => {
      const d = parseUtcDate(tx.created_at || tx.CreatedAt) || new Date();
      const dateMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayDiff = Math.round((todayMidnight - dateMidnight) / ONE_DAY_MS);

      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      let existing = groupMap.get(dayKey);
      if (!existing) {
        const dayName = d.toLocaleDateString('en-IN', { weekday: 'long' });
        const dateStr = d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });

        let label = `${dateStr}, ${dayName}`;
        let subLabel: string | undefined;

        if (dayDiff === 0) {
          label = 'Today';
          subLabel = `${dateStr}, ${dayName}`;
        } else if (dayDiff === 1) {
          label = 'Yesterday';
          subLabel = `${dateStr}, ${dayName}`;
        }

        existing = {
          key: dayKey,
          label,
          subLabel,
          totalExpenseE5: 0,
          totalIncomeE5: 0,
          txns: []
        };
        groupMap.set(dayKey, existing);
        groups.push(existing);
      }

      existing.txns.push(tx);
      if (tx.txn_type === 'debit') {
        existing.totalExpenseE5 += tx.amount_e5 || 0;
      } else if (tx.txn_type === 'credit') {
        existing.totalIncomeE5 += tx.amount_e5 || 0;
      }
    });

    return groups;
  }, [filteredTxns]);

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

      {/* Header & New Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-white leading-tight">Ledger Records</h2>
          <p className="text-xs font-mono text-slate-400">{filteredTxns.length} entries filtered</p>
        </div>
        <button
          onClick={onOpenNewTxnModal}
          className="px-3.5 py-1.5 rounded-xl bg-[#FBD8B3] hover:bg-[#f7c495] text-[#1A1835] font-black text-xs flex items-center gap-1.5 shadow-[0_2px_12px_rgba(251,216,179,0.35)] active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3] text-[#1A1835]" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Search Bar & Segment Pills */}
      <div className="space-y-2.5">
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-[#FBD8B3]">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memo, envelope or rail..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#232044] border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FBD8B3] focus:ring-1 focus:ring-[#FBD8B3]/30 font-mono shadow-inner transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 text-slate-400 hover:text-white cursor-pointer p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Rail Segments */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setFilterMethod('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all duration-200 cursor-pointer active:scale-95 ${
              filterMethod === 'all'
                ? 'bg-[#FBD8B3] text-[#1A1835] font-black shadow-sm'
                : 'bg-[#232044] text-slate-300 border border-white/5 hover:text-white hover:bg-[#2C2856]'
            }`}
          >
            All Rails ({safeTxns.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMethod('bank_card')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all duration-200 cursor-pointer active:scale-95 ${
              filterMethod === 'bank_card'
                ? 'bg-[#FBD8B3] text-[#1A1835] font-black shadow-sm'
                : 'bg-[#232044] text-slate-300 border border-white/5 hover:text-white hover:bg-[#2C2856]'
            }`}
          >
            Cards ({cardCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterMethod('bank_account')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all duration-200 cursor-pointer active:scale-95 ${
              filterMethod === 'bank_account'
                ? 'bg-[#FBD8B3] text-[#1A1835] font-black shadow-sm'
                : 'bg-[#232044] text-slate-300 border border-white/5 hover:text-white hover:bg-[#2C2856]'
            }`}
          >
            Bank Vaults ({bankCount})
          </button>

          <button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`ml-auto p-2 rounded-xl border text-xs flex items-center gap-1 transition-all duration-200 cursor-pointer active:scale-95 ${
              filterType !== 'all' || isFilterExpanded
                ? 'bg-[#FBD8B3] text-[#1A1835] border-[#FBD8B3] font-black'
                : 'border-white/10 text-slate-300 bg-[#232044] hover:bg-[#2C2856]'
            }`}
            title="Filter by Transaction Type"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable Advanced Filter Drawer */}
        {isFilterExpanded && (
          <div className="p-3.5 bg-[#232044] rounded-2xl border border-white/10 space-y-2 text-xs animate-slide-down">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Filter By Type</span>
            <div className="flex gap-1.5">
              {(['all', 'debit', 'credit', 'transfer'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-mono text-[11px] transition-all duration-200 cursor-pointer ${
                    filterType === type
                      ? 'bg-[#FBD8B3] text-[#1A1835] font-black shadow-sm'
                      : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Date-wise Grouped Ledger Records */}
      <div className="space-y-3">
        {isLoadingTransactions ? (
          <div className="velvet-card p-3 shadow-xl">
            <TransactionListSkeleton count={5} />
          </div>
        ) : groupedTxns.length === 0 ? (
          <div className="velvet-card p-12 text-center text-slate-400 text-xs font-mono shadow-xl">
            No ledger transactions match this filter.
          </div>
        ) : (
          groupedTxns.map((group) => (
            <div key={group.key} className="space-y-1.5">
              {/* Date Header Separator */}
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-black font-mono tracking-wider text-[#FBD8B3] uppercase">
                    {group.label}
                  </span>
                  {group.subLabel && (
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      • {group.subLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono shrink-0 pl-2">
                  {group.totalExpenseE5 > 0 && (
                    <span className="text-rose-300 font-semibold">
                      -{formatINR(e5ToAmount(group.totalExpenseE5))}
                    </span>
                  )}
                  {group.totalIncomeE5 > 0 && (
                    <span className="text-[#A8E6CF] font-semibold">
                      +{formatINR(e5ToAmount(group.totalIncomeE5))}
                    </span>
                  )}
                  <span className="text-slate-500 font-bold">
                    {group.txns.length}
                  </span>
                </div>
              </div>

              {/* Transactions in this Date Group */}
              <div className="velvet-card p-2.5 divide-y divide-white/[0.04] shadow-md">
                {group.txns.map((tx) => {
                  const isCredit = tx.txn_type === 'credit';
                  const isTransfer = tx.txn_type === 'transfer';
                  const assignedEnv = tx.envelope_id ? envelopeMap.get(tx.envelope_id) : null;
                  const { timeStr } = formatTransactionDateTime(tx.created_at || tx.CreatedAt);

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTxnForEdit?.(tx)}
                      className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] hover:translate-x-1 px-2 rounded-xl transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                            isCredit
                              ? 'bg-[#A8E6CF]/20 text-[#A8E6CF] border border-[#A8E6CF]/30'
                              : isTransfer
                              ? 'bg-[#FBD8B3]/20 text-[#FBD8B3] border border-[#FBD8B3]/30'
                              : tx.payment_method === 'bank_card'
                              ? 'bg-[#C8B6FF]/20 text-[#C8B6FF] border border-[#C8B6FF]/35'
                              : 'bg-[#64D2FF]/20 text-[#64D2FF] border border-[#64D2FF]/35'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4 text-[#A8E6CF]" />
                          ) : isTransfer ? (
                            <ArrowLeftRight className="w-4 h-4 text-[#FBD8B3]" />
                          ) : tx.payment_method === 'bank_card' ? (
                            <CreditCard className="w-4 h-4 text-[#C8B6FF]" />
                          ) : (
                            <Landmark className="w-4 h-4 text-[#64D2FF]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-xs font-bold text-slate-100 truncate group-hover:text-[#FBD8B3] transition-colors">
                              {assignedEnv?.name || (isCredit
                                ? 'Direct Inflow'
                                : isTransfer
                                ? 'Account Transfer'
                                : 'Uncategorized')}
                            </p>
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
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {timeStr}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3 font-mono">
                        <span
                          className={`text-xs font-bold ${
                            isCredit ? 'text-[#A8E6CF]' : 'text-slate-100'
                          }`}
                        >
                          {isCredit ? '+' : '-'}{formatINR(e5ToAmount(tx.amount_e5))}
                        </span>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {tx.payment_method.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Load More Button */}
      {onLoadMore && hasMore !== false && (
        <div className="pt-2 text-center">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full gap-2 font-bold font-mono py-2.5 text-xs text-white bg-[#343060] hover:bg-[#3D3870] border border-white/10 rounded-2xl shadow-md transition-all active:scale-[0.99]"
          >
            {isLoadingMore ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#FBD8B3]" />
                <span>Loading More Records...</span>
              </>
            ) : (
              <span>Load More Records</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
