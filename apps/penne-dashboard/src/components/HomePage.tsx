import React, { useState } from 'react';
import { Transaction, e5ToAmount } from '@packages/types';
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
  RefreshCw
} from 'lucide-react';

interface HomePageProps {
  transactions: Transaction[];
  isServerOffline?: boolean;
  isMockMode?: boolean;
  onRetryConnection?: () => void;
  onToggleMock?: () => void;
  onOpenNewTxnModal: () => void;
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

    const d = new Date(normalized);
    if (isNaN(d.getTime())) return { dateStr: 'Recent', timeStr: '' };

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
  isServerOffline,
  isMockMode,
  onRetryConnection,
  onToggleMock,
  onOpenNewTxnModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');

  const safeTxns = Array.isArray(transactions) ? transactions : [];

  // Sort newest transactions first by created_at timestamp
  const sortedTxns = [...safeTxns].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  // Calculate Total Income & Total Spend
  const totalIncomeE5 = sortedTxns
    .filter((t) => t && t.txn_type === 'credit')
    .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

  const totalSpentE5 = sortedTxns
    .filter((t) => t && t.txn_type === 'debit')
    .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);

  const totalRemainingE5 = totalIncomeE5 - totalSpentE5;

  const totalSpentFormatted = `₹${e5ToAmount(totalSpentE5).toLocaleString('en-IN')}`;
  const totalRemainingFormatted = `₹${e5ToAmount(totalRemainingE5).toLocaleString('en-IN')}`;
  const totalIncomeFormatted = `₹${e5ToAmount(totalIncomeE5).toLocaleString('en-IN')}`;

  // Filter transactions
  const filteredTxns = sortedTxns.filter((t) => {
    if (!t) return false;
    const matchesType = filterType === 'all' || t.txn_type === filterType;
    const matchesSearch =
      !searchTerm ||
      (t.bank_name && t.bank_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-full overflow-x-hidden">
        {/* Total Spend Card */}
        <StatCard
          title="Total Spend"
          value={totalSpentFormatted}
          subtitle="Total recorded expenses"
          variant="rose"
          icon={<TrendingDown className="w-5 h-5 text-[#E8A598]" />}
          className="w-full min-w-0"
        />

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

      {/* Action Banner: Add Transaction */}
      <div className="flex items-center justify-between bg-[#24201D] border border-[#38322E] rounded-3xl p-4 shadow-lg shadow-black/20 w-full max-w-full overflow-x-hidden">
        <div className="space-y-0.5 min-w-0 pr-2">
          <h2 className="text-sm font-extrabold text-[#F4F1DE] truncate">Recent Activity</h2>
          <p className="text-xs text-[#A89F95] truncate">
            {sortedTxns.length} transaction{sortedTxns.length !== 1 ? 's' : ''} (Newest First)
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
          <span>New Expense</span>
        </Button>
      </div>

      {/* Search & Filter Section */}
      <div className="space-y-3 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-2.5 w-full max-w-full overflow-x-hidden">
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C837A]" />
            <input
              type="text"
              placeholder="Search bank name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1A1715] border border-[#38322E] text-[#F4F1DE] placeholder-[#6E665E] text-xs rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#E07A5F]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#1A1715] p-1 rounded-2xl border border-[#38322E] w-full justify-between">
            {(['all', 'debit', 'credit'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl capitalize transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-[#38322E] text-[#F4F1DE] shadow-sm'
                    : 'text-[#A89F95] hover:text-[#F4F1DE]'
                }`}
              >
                {type === 'debit' ? 'Expenses' : type === 'credit' ? 'Income' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {filteredTxns.length === 0 ? (
          <Card className="text-center py-10 space-y-3 w-full max-w-full">
            <div className="w-12 h-12 rounded-2xl bg-[#2E2A27] text-[#A89F95] flex items-center justify-center mx-auto">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#F4F1DE]">
                {isServerOffline && !isMockMode ? 'Server Offline' : 'No transactions found'}
              </h3>
              <p className="text-xs text-[#8C837A] max-w-xs mx-auto">
                {isServerOffline && !isMockMode
                  ? 'Connect your backend server to view your live transactions.'
                  : sortedTxns.length === 0
                  ? "You haven't recorded any expenses yet. Tap '+ New Expense' to get started!"
                  : 'No transactions match your search query.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2.5 w-full max-w-full overflow-x-hidden">
            {filteredTxns.map((txn) => {
              const isDebit = txn.txn_type === 'debit';
              const formattedAmt = `₹${e5ToAmount(txn.amount_e5).toLocaleString('en-IN')}`;
              
              // Format RFC3339/ISO-8601 date & time in UTC to match exact DB timestamp
              const { dateStr, timeStr } = formatTransactionDateTime(txn.created_at);

              return (
                <div
                  key={txn.id}
                  className="bg-[#24201D] border border-[#342F2C] rounded-2xl p-3.5 transition-all flex items-center justify-between gap-2.5 shadow-md w-full max-w-full overflow-x-hidden min-w-0"
                >
                  {/* Left: Icon & Bank Details */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-x-hidden">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                        isDebit
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

                    <div className="min-w-0 flex-1 space-y-0.5 overflow-x-hidden">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs font-extrabold text-[#F4F1DE] truncate">
                          {txn.bank_name || 'Bank Txn'}
                        </p>
                        <Badge
                          variant={isDebit ? 'rose' : 'sage'}
                          className="text-[9px] py-0 px-1.5 font-bold uppercase shrink-0"
                        >
                          {isDebit ? 'Expense' : 'Income'}
                        </Badge>
                      </div>

                      {/* Display Date and Time of Transaction (UUID removed from FE display) */}
                      <div className="flex items-center gap-2 text-[11px] text-[#A89F95] min-w-0">
                        <span className="flex items-center gap-1 font-mono text-[10px] text-[#C4BBB1]">
                          <Calendar className="w-3 h-3 text-[#8C837A]" />
                          {dateStr}
                        </span>
                        {timeStr && (
                          <>
                            <span className="text-[#8C837A]">•</span>
                            <span className="flex items-center gap-1 font-mono text-[10px] text-[#A89F95]">
                              <Clock className="w-3 h-3 text-[#8C837A]" />
                              {timeStr}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right shrink-0 pl-1">
                    <span
                      className={`text-sm sm:text-base font-black tracking-tight ${
                        isDebit ? 'text-[#E8A598]' : 'text-[#81B29A]'
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
