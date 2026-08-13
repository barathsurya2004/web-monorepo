import React, { useState, useMemo } from 'react';
import { Transaction, EnvelopeGroup, Envelope, e5ToAmount } from '@packages/types';
import { Button, Card, Badge } from '@packages/ui';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Calendar,
  Clock,
  Tag,
  Folder,
  CreditCard,
  Building2,
  WifiOff,
  RefreshCw,
  Plus
} from 'lucide-react';
import { formatTransactionDateTime } from './HomePage';
import { TransactionsPageSkeleton } from './Skeleton';

interface TransactionsPageProps {
  transactions: Transaction[];
  envelopeGroups?: EnvelopeGroup[];
  envelopes?: Envelope[];
  isServerOffline?: boolean;
  isMockMode?: boolean;
  onRetryConnection?: () => void;
  onToggleMock?: () => void;
  onOpenNewTxnModal: () => void;
  onSelectTxnForEdit?: (txn: Transaction) => void;
  isLoadingData?: boolean;
}

export function getDateGroupHeader(isoString?: string): string {
  if (!isoString) return 'Other Transactions';
  try {
    let normalized = isoString.trim();
    if (normalized.includes(' ') && !normalized.includes('T')) {
      normalized = normalized.replace(' ', 'T');
    }
    if (!normalized.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(normalized)) {
      normalized += 'Z';
    }

    const d = new Date(normalized);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1 || d.getFullYear() < 2000) {
      return 'Today';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (targetDate.getTime() === today.getTime()) {
      return 'Today';
    }
    if (targetDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }

    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Other Transactions';
  }
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  envelopeGroups = [],
  envelopes = [],
  isServerOffline,
  isMockMode,
  onRetryConnection,
  onToggleMock,
  onOpenNewTxnModal,
  onSelectTxnForEdit,
  isLoadingData
}) => {
  if (isLoadingData) {
    return <TransactionsPageSkeleton />;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupTag, setSelectedGroupTag] = useState<string>('all');
  const [selectedCategoryEnv, setSelectedCategoryEnv] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const safeTxns = Array.isArray(transactions) ? transactions : [];
  const safeGroups = Array.isArray(envelopeGroups) ? envelopeGroups : [];
  const safeEnvelopes = Array.isArray(envelopes) ? envelopes : [];

  // Lookup maps for fast lookup of group & category details
  const envelopeMap = useMemo(() => {
    const map = new Map<string, Envelope>();
    safeEnvelopes.forEach((e) => {
      if (e && e.id) map.set(e.id, e);
    });
    return map;
  }, [safeEnvelopes]);

  const groupMap = useMemo(() => {
    const map = new Map<string, EnvelopeGroup>();
    safeGroups.forEach((g) => {
      if (g && g.id) map.set(g.id, g);
    });
    return map;
  }, [safeGroups]);

  // Extract unique Tag (Group) names for clean select list
  const uniqueTagNames = useMemo(() => {
    const names = new Set<string>();
    safeGroups.forEach((g) => {
      if (g && g.name && g.name.trim()) {
        names.add(g.name.trim());
      }
    });
    return Array.from(names).sort();
  }, [safeGroups]);

  // Map of Group Name -> Set of Group IDs sharing that name
  const groupIdsByNameMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    safeGroups.forEach((g) => {
      if (g && g.name && g.id) {
        const nameKey = g.name.trim();
        if (!map.has(nameKey)) {
          map.set(nameKey, new Set());
        }
        map.get(nameKey)!.add(g.id);
      }
    });
    return map;
  }, [safeGroups]);

  // Categories filtered by selected group (if group filter active)
  const availableEnvelopes = useMemo(() => {
    if (selectedGroupTag === 'all') return safeEnvelopes;
    return safeEnvelopes.filter((e) => e.envelope_group_id === selectedGroupTag);
  }, [safeEnvelopes, selectedGroupTag]);

  // Filter transactions
  const filteredTxns = useMemo(() => {
    return safeTxns.filter((t) => {
      if (!t) return false;

      // Type filter
      if (typeFilter !== 'all' && t.txn_type !== typeFilter) {
        return false;
      }

      const assignedEnv = t.envelope_id ? envelopeMap.get(t.envelope_id) : null;
      const assignedGroupId = assignedEnv?.envelope_group_id;

      // Group Tag filter
      if (selectedGroupTag !== 'all') {
        if (!assignedGroupId || assignedGroupId !== selectedGroupTag) {
          return false;
        }
      }

      // Category Envelope filter
      if (selectedCategoryEnv !== 'all') {
        if (t.envelope_id !== selectedCategoryEnv) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const paymentMethodMatch = (t.payment_method || '').toLowerCase().includes(query);
        const categoryMatch = (assignedEnv?.name || '').toLowerCase().includes(query);
        const groupMatch = assignedGroupId
          ? (groupMap.get(assignedGroupId)?.name || '').toLowerCase().includes(query)
          : false;

        if (!paymentMethodMatch && !categoryMatch && !groupMatch) {
          return false;
        }
      }

      return true;
    });
  }, [safeTxns, typeFilter, selectedGroupTag, selectedCategoryEnv, searchTerm, envelopeMap, groupMap]);

  // Group transactions by date & sort timewise (newest first) within each group
  const groupedTransactions = useMemo(() => {
    // Sort transactions timewise descending (newest first)
    const sorted = [...filteredTxns].sort((a, b) => {
      const getTime = (iso?: string) => {
        if (!iso) return Date.now();
        const d = new Date(iso);
        if (isNaN(d.getTime()) || d.getFullYear() <= 1 || d.getFullYear() < 2000) return Date.now();
        return d.getTime();
      };
      return getTime(b.created_at) - getTime(a.created_at);
    });

    const map = new Map<string, Transaction[]>();
    sorted.forEach((t) => {
      const dateHeader = getDateGroupHeader(t.created_at);
      if (!map.has(dateHeader)) {
        map.set(dateHeader, []);
      }
      map.get(dateHeader)!.push(t);
    });

    return Array.from(map.entries());
  }, [filteredTxns]);

  // Active filter count calculation
  const activeFiltersCount =
    (selectedGroupTag !== 'all' ? 1 : 0) +
    (selectedCategoryEnv !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSelectedGroupTag('all');
    setSelectedCategoryEnv('all');
    setTypeFilter('all');
    setSearchTerm('');
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 space-y-5 animate-fadeIn pb-28 overflow-x-hidden">
      {/* Offline Banner */}
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

      {/* Page Header */}
      <div className="flex items-center justify-between bg-[#24201D] border border-[#38322E] rounded-3xl p-4 shadow-lg shadow-black/20 gap-2">
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#E07A5F]" />
            <h2 className="text-base font-extrabold text-[#F4F1DE] truncate">All Transactions</h2>
          </div>
          <p className="text-xs text-[#A89F95] truncate">
            {filteredTxns.length} of {safeTxns.length} transaction{safeTxns.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onOpenNewTxnModal}
          className="gap-1.5 shadow-lg font-bold shrink-0 text-xs px-3.5"
          disabled={isServerOffline && !isMockMode}
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </Button>
      </div>

      {/* Search & Filter Trigger Bar */}
      <div className="space-y-3 w-full">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C837A]" />
            <input
              type="text"
              placeholder="Search bank or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1A1715] border border-[#38322E] text-[#F4F1DE] placeholder-[#6E665E] text-xs rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#E07A5F]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C837A] hover:text-[#F4F1DE]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`flex items-center gap-2 py-2.5 px-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${isFilterPanelOpen || activeFiltersCount > 0
                ? 'bg-[#E07A5F] text-white border-[#E07A5F] shadow-lg shadow-[#E07A5F]/30'
                : 'bg-[#1A1715] text-[#A89F95] border-[#38322E] hover:text-[#F4F1DE] hover:border-[#524B45]'
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-[#E07A5F] text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterPanelOpen && (
          <div className="bg-[#24201D] border border-[#38322E] rounded-3xl p-4 space-y-4 animate-fadeIn shadow-xl">
            <div className="flex items-center justify-between border-b border-[#342F2C] pb-2.5">
              <h3 className="text-xs font-extrabold text-[#F4F1DE] flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#E07A5F]" />
                <span>Filter Transactions</span>
              </h3>
              {(activeFiltersCount > 0 || searchTerm) && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] font-bold text-[#E07A5F] hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Filter 1: Tag (Envelope Group) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#A89F95] flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#E07A5F]" />
                <span>Tag (Envelope Group)</span>
              </label>
              <select
                value={selectedGroupTag}
                onChange={(e) => {
                  setSelectedGroupTag(e.target.value);
                  setSelectedCategoryEnv('all'); // Reset category selection on group change
                }}
                className="w-full bg-[#1A1715] border border-[#38322E] text-[#F4F1DE] text-xs rounded-2xl px-3 py-2.5 focus:outline-none focus:border-[#E07A5F]"
              >
                <option value="all">All Tags / Groups</option>
                {safeGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Category (Envelope) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#A89F95] flex items-center gap-1">
                <Folder className="w-3 h-3 text-[#81B29A]" />
                <span>Category (Envelope)</span>
              </label>
              <select
                value={selectedCategoryEnv}
                onChange={(e) => setSelectedCategoryEnv(e.target.value)}
                className="w-full bg-[#1A1715] border border-[#38322E] text-[#F4F1DE] text-xs rounded-2xl px-3 py-2.5 focus:outline-none focus:border-[#E07A5F]"
              >
                <option value="all">All Categories</option>
                {availableEnvelopes.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name || (env.is_system ? 'Unallocated Pool' : `Envelope #${env.id.slice(-4)}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Transaction Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#A89F95]">Transaction Type</label>
              <div className="flex items-center gap-1.5 bg-[#1A1715] p-1 rounded-2xl border border-[#38322E]">
                {(['all', 'debit', 'credit'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-xl capitalize transition-all cursor-pointer ${typeFilter === type
                        ? 'bg-[#38322E] text-[#F4F1DE] shadow-sm'
                        : 'text-[#A89F95] hover:text-[#F4F1DE]'
                      }`}
                  >
                    {type === 'debit' ? 'Expense' : type === 'credit' ? 'Income' : 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Chips Preview */}
      {activeFiltersCount > 0 && !isFilterPanelOpen && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-bold text-[#8C837A] uppercase shrink-0">Filters:</span>
          {selectedGroupTag !== 'all' && (
            <Badge variant="terracotta" className="text-[10px] gap-1 shrink-0">
              <span>Tag: {groupMap.get(selectedGroupTag)?.name || 'Group'}</span>
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedGroupTag('all')} />
            </Badge>
          )}
          {selectedCategoryEnv !== 'all' && (
            <Badge variant="indigo" className="text-[10px] gap-1 shrink-0">
              <span>Cat: {envelopeMap.get(selectedCategoryEnv)?.name || 'Envelope'}</span>
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategoryEnv('all')} />
            </Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge variant="sage" className="text-[10px] gap-1 shrink-0 capitalize">
              <span>Type: {typeFilter}</span>
              <X className="w-3 h-3 cursor-pointer" onClick={() => setTypeFilter('all')} />
            </Badge>
          )}
        </div>
      )}

      {/* Transactions List Grouped Date-Wise */}
      {groupedTransactions.length === 0 ? (
        <Card className="text-center py-12 space-y-3 w-full">
          <div className="w-12 h-12 rounded-2xl bg-[#2E2A27] text-[#A89F95] flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#F4F1DE]">No transactions found</h3>
            <p className="text-xs text-[#8C837A] max-w-xs mx-auto">
              {safeTxns.length === 0
                ? "You haven't recorded any expenses or income yet. Tap '+ New' to create one!"
                : 'No transactions match your active filters or search keyword.'}
            </p>
          </div>
          {activeFiltersCount > 0 && (
            <Button size="sm" variant="secondary" onClick={resetFilters} className="text-xs font-bold">
              Clear All Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6 w-full">
          {groupedTransactions.map(([dateHeader, txns]) => (
            <div key={dateHeader} className="space-y-2.5">
              {/* Date Group Section Header */}
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-3.5 h-3.5 text-[#E07A5F]" />
                <h3 className="text-xs font-extrabold text-[#F4F1DE] uppercase tracking-wider">
                  {dateHeader}
                </h3>
                <div className="h-[1px] bg-[#342F2C] flex-1 ml-1" />
                <span className="text-[10px] font-mono text-[#8C837A]">
                  {txns.length} txn{txns.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Transactions in Date Group (Ordered Timewise) */}
              <div className="space-y-2.5">
                {txns.map((txn) => {
                  const isDebit = txn.txn_type === 'debit';
                  const formattedAmt = `₹${e5ToAmount(txn.amount_e5).toLocaleString('en-IN')}`;
                  const { timeStr } = formatTransactionDateTime(txn.created_at);

                  const assignedEnv = txn.envelope_id ? envelopeMap.get(txn.envelope_id) : null;
                  const cardHeading = (!assignedEnv || assignedEnv.is_system || assignedEnv.name === 'Unallocated Budget')
                    ? 'General'
                    : (assignedEnv.name || 'General');

                  const groupName = assignedEnv?.envelope_group_id
                    ? groupMap.get(assignedEnv.envelope_group_id)?.name
                    : null;
                  const isBankCard = txn.payment_method === 'bank_card';

                  return (
                    <div
                      key={txn.id}
                      onClick={() => onSelectTxnForEdit?.(txn)}
                      className="bg-[#24201D] border border-[#342F2C] hover:border-[#E07A5F]/60 hover:bg-[#2B2623] cursor-pointer rounded-2xl p-3.5 transition-all flex items-center justify-between gap-2.5 shadow-md w-full min-w-0 group"
                      title="Click to edit transaction"
                    >
                      {/* Left: Icon & Details */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-x-hidden">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${isDebit
                              ? 'bg-[#E8A598]/15 text-[#E8A598] border border-[#E8A598]/20'
                              : 'bg-[#81B29A]/15 text-[#81B29A] border border-[#81B29A]/20'
                            }`}
                        >
                          {isDebit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <p className="text-xs font-extrabold text-[#F4F1DE] group-hover:text-[#E07A5F] transition-colors truncate">
                              {cardHeading}
                            </p>
                          </div>

                          {/* Tags & Time */}
                          <div className="flex items-center gap-2 text-[11px] text-[#A89F95] flex-wrap">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
