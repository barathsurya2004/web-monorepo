import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  LineChart,
  PieChart,
  Repeat,
  Compass,
  Check,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Flame,
  Zap,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CreditCard,
  Wallet,
  Receipt,
  Award,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  Transaction,
  formatCurrency,
  e5ToAmount,
  formatDate,
} from '@packages/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from '../hooks/useDashboardData';
import { PageTagHeader } from './PageTagHeader';
import { EnvelopeMonogramBadge } from '../utils/envelopeVisuals';
import { SpendingHeatmap } from './SpendingHeatmap';

interface InsightsPageProps {
  transactions?: Transaction[];
  onOpenNewTxnModal?: () => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({
  transactions = [],
  onOpenNewTxnModal,
}) => {
  // Current calendar date anchor
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Selected period state
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;

  // Compute available past months from the transactions list for quick-switch pills
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    transactions.forEach((t) => {
      const d = t.created_at ? new Date(t.created_at) : null;
      if (d && !isNaN(d.getTime()) && d.getFullYear() >= 2020) {
        set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    const list = Array.from(set).map((key) => {
      const [yStr, mStr] = key.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      return {
        key,
        year: y,
        month: m,
        label: new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      };
    });
    list.sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month));
    return list.slice(0, 5);
  }, [transactions, currentYear, currentMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 12) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Fetch insights from backend (with transparent offline fallback inside api client)
  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.monthlyInsights(selectedYear, selectedMonth),
    queryFn: () => api.getMonthlyInsights(selectedYear, selectedMonth),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  // Show skeleton while loading
  if (isLoading || !report) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fadeIn pb-32">
        <PageTagHeader title="Monthly Intelligence" dotColor="#C8B6FF" badgeText="Insight Engine" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="velvet-card p-4 rounded-2xl border border-white/10 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-8 bg-white/8 rounded w-2/3 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fadeIn pb-32">
        <PageTagHeader title="Monthly Intelligence" dotColor="#C8B6FF" badgeText="Insight Engine" />
        <div className="velvet-card p-6 rounded-2xl border border-white/10 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-[#FFB5A7]" />
          <p className="text-slate-300 text-sm">Could not load insights for this month.</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      </div>
    );
  }

  const hasActivity = report.total_income_e5 > 0 || report.total_expense_e5 > 0;

  // Proportions for fixed vs flexible bar
  const subPct =
    report.total_expense_e5 > 0
      ? Math.round((report.subscription_expense_e5 / report.total_expense_e5) * 100)
      : 0;
  const discPct =
    report.total_expense_e5 > 0
      ? Math.max(0, 100 - subPct)
      : 0;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 space-y-4 animate-fadeIn pb-32 overflow-x-hidden">
      {/* Page Header */}
      <PageTagHeader
        title="Monthly Intelligence"
        dotColor="#C8B6FF"
        badgeText="Insight Engine"
      />

      {/* Month Navigator Toolbar */}
      <div className="velvet-card p-2 sm:p-2.5 rounded-2xl border border-white/10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center border border-white/5"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C8B6FF]" />
              <h2 className="text-sm sm:text-base font-bold text-white font-mono tracking-tight">
                {report.month_label}
              </h2>
            </div>
            {isCurrentMonth ? (
              <span className="text-[10px] font-mono text-[#A8E6CF] font-bold uppercase tracking-wider">
                ● Current Active Cycle
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400">
                Archived Period ({report.days_in_month} Days)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className={`p-2 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center border ${
              isCurrentMonth
                ? 'opacity-30 cursor-not-allowed bg-transparent border-transparent text-slate-600'
                : 'bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white cursor-pointer border-white/5'
            }`}
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Month Switcher Chips */}
        {availableMonths.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 -mx-0.5 px-0.5 border-t border-white/5">
            {availableMonths.map((m) => {
              const isSelected = m.year === selectedYear && m.month === selectedMonth;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setSelectedYear(m.year);
                    setSelectedMonth(m.month);
                  }}
                  className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#C8B6FF]/25 border border-[#C8B6FF] text-[#C8B6FF] font-bold shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!hasActivity ? (
        /* Empty State */
        <div className="velvet-card p-6 sm:p-8 rounded-3xl border border-white/10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#232044] border border-white/10 flex items-center justify-center mx-auto text-[#C8B6FF]">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Activity in {report.month_label}</h3>
            <p className="text-xs text-slate-300 font-sans max-w-xs mx-auto leading-relaxed">
              No income or expenses recorded during this calendar period. Switch to another month or log a new transaction.
            </p>
          </div>
          {onOpenNewTxnModal && (
            <button
              onClick={onOpenNewTxnModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FBD8B3] text-[#1A1835] font-bold text-xs font-mono shadow-md hover:bg-[#f5caa0] cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record Transaction</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. Executive Cash Flow Hero Card */}
          <div className="velvet-card p-5 rounded-3xl border border-white/10 relative overflow-hidden space-y-4 shadow-xl">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#A8E6CF]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#FBD8B3]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#FBD8B3]" />
                  Cash Flow Summary
                </span>
                {report.previous_month && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      report.previous_month.is_lower
                        ? 'bg-[#A8E6CF]/15 text-[#A8E6CF] border-[#A8E6CF]/30'
                        : 'bg-[#FFB5A7]/15 text-[#FFB5A7] border-[#FFB5A7]/30'
                    }`}
                  >
                    {report.previous_month.is_lower ? '↓' : '↑'}{' '}
                    {Math.abs(report.previous_month.delta_pct)}% vs Prev Mo
                  </span>
                )}
              </div>

              {/* Inflow & Outflow Dual Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Total Earned / Inflow */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#A8E6CF] font-mono font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Total Inflow</span>
                  </div>
                  <div className="text-lg sm:text-xl font-mono font-black text-white truncate">
                    {formatCurrency(report.total_income_e5)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Credits & Income
                  </span>
                </div>

                {/* Total Spent / Outflow */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#FFB5A7] font-mono font-bold">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Total Outflow</span>
                  </div>
                  <div className="text-lg sm:text-xl font-mono font-black text-white truncate">
                    {formatCurrency(report.total_expense_e5)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Debits & Charges
                  </span>
                </div>
              </div>

              {/* Net Cash Flow & Savings Rate Banner */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  report.net_savings_e5 >= 0
                    ? 'bg-[#A8E6CF]/10 border-[#A8E6CF]/30'
                    : 'bg-[#FFB5A7]/10 border-[#FFB5A7]/30'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 block">
                    Net Monthly Cash Flow
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-lg sm:text-xl font-mono font-black ${
                        report.net_savings_e5 >= 0 ? 'text-[#A8E6CF]' : 'text-[#FFB5A7]'
                      }`}
                    >
                      {report.net_savings_e5 >= 0 ? '+' : ''}
                      {formatCurrency(report.net_savings_e5)}
                    </span>
                  </div>
                </div>

                {/* Savings Rate Badge */}
                <div className="text-right">
                  <div className="text-base sm:text-lg font-mono font-black text-white">
                    {report.savings_rate_pct}%
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Savings Rate
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Monthly Spending Intensity Heatmap (GitHub-style daily matrix) */}
          <SpendingHeatmap
            items={report.daily_heatmap}
            firstDayOffset={report.first_day_offset}
            monthLabel={report.month_label}
            maxDailySpendE5={report.max_daily_spend_e5}
            noSpendDaysCount={report.no_spend_days_count}
            daysElapsed={report.days_elapsed}
          />

          {/* 3. Subscriptions vs Discretionary Outflow Split */}
          <div className="velvet-card p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-[#C8B6FF]" />
                Fixed Subscriptions vs Flexible Spend
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {report.subscription_count} Active Bill{report.subscription_count === 1 ? '' : 's'}
              </span>
            </div>

            {/* Split Bar */}
            <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
              <div
                style={{ width: `${subPct}%` }}
                className="bg-[#C8B6FF] h-full transition-all duration-500 rounded-l-full"
                title={`Subscriptions: ${subPct}%`}
              />
              <div
                style={{ width: `${discPct}%` }}
                className="bg-[#A8E6CF] h-full transition-all duration-500 rounded-r-full"
                title={`Discretionary: ${discPct}%`}
              />
            </div>

            {/* Legend Details */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C8B6FF] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block truncate">Subscriptions</span>
                  <span className="font-bold text-white">
                    {formatCurrency(report.subscription_expense_e5)}{' '}
                    <span className="text-[10px] text-[#C8B6FF]">({subPct}%)</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A8E6CF] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block truncate">Discretionary</span>
                  <span className="font-bold text-white">
                    {formatCurrency(report.discretionary_expense_e5)}{' '}
                    <span className="text-[10px] text-[#A8E6CF]">({discPct}%)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Peak Spend Day Spotlight (Excluding Subscriptions) */}
          {report.peak_day && (
            <div className="velvet-card p-4 sm:p-5 rounded-2xl border border-[#FBD8B3]/30 bg-gradient-to-br from-[#2D2852] to-[#231F44] relative overflow-hidden space-y-3 shadow-lg">
              {/* Ambient Glow */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#FBD8B3]/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#FBD8B3]/20 text-[#FBD8B3] border border-[#FBD8B3]/30">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                        Peak Spending Day
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">
                        Excluding Fixed Subscriptions
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FBD8B3]/20 text-[#FBD8B3] border border-[#FBD8B3]/40">
                    Highest Discretionary Outflow
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#1A1735]/90 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-extrabold text-white block">
                        {report.peak_day.day_name}, {formatDate(report.peak_day.date)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {report.peak_day.transaction_count} transaction{report.peak_day.transaction_count === 1 ? '' : 's'} logged
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-mono font-black text-[#FBD8B3]">
                        {formatCurrency(report.peak_day.total_spent_e5)}
                      </span>
                    </div>
                  </div>

                  {/* Top transactions that drove the spike */}
                  {report.peak_day.top_transactions.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                        Primary Purchases on this Day:
                      </span>
                      {report.peak_day.top_transactions.map((tx) => {
                        const categoryLabel = tx.category || tx.envelope_name || 'General';
                        const displayName = tx.envelope_name || tx.description || categoryLabel;
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between text-[11px] font-mono bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1.5 rounded-lg border border-white/5 transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FBD8B3]/15 text-[#FBD8B3] border border-[#FBD8B3]/30 shrink-0 font-bold">
                                {categoryLabel}
                              </span>
                              <span className="text-slate-200 truncate font-medium">
                                {displayName}
                              </span>
                            </div>
                            <span className="text-white font-bold shrink-0 ml-2">
                              {formatCurrency(tx.amount_e5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. Category & Envelope Spending Split */}
          <div className="velvet-card p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-[#A8E6CF]" />
                Category Spending Distribution
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {report.category_splits.length} Categor{report.category_splits.length === 1 ? 'y' : 'ies'}
              </span>
            </div>

            {report.category_splits.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono py-2 text-center">
                No categorized debits found for this month.
              </p>
            ) : (
              <div className="space-y-3">
                {report.category_splits.map((cat, idx) => {
                  const colors = [
                    'bg-[#A8E6CF]',
                    'bg-[#FBD8B3]',
                    'bg-[#C8B6FF]',
                    'bg-[#FFB5A7]',
                    'bg-[#FDE2B8]',
                    'bg-slate-400',
                  ];
                  const barColor = colors[idx % colors.length];

                  return (
                    <div key={cat.envelope_id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 min-w-0">
                          <EnvelopeMonogramBadge name={cat.envelope_name} size="sm" />
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">
                              {cat.envelope_name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {cat.group_name} • {cat.transaction_count} txn{cat.transaction_count === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-white block">
                            {formatCurrency(cat.spent_e5)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Behavioral Habits & Extremes (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Zero-Spend Days Counter */}
            <div className="velvet-card p-3.5 rounded-2xl border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                  Zero-Spend Days
                </span>
                <ShieldCheck className="w-4 h-4 text-[#A8E6CF]" />
              </div>
              <div className="text-xl sm:text-2xl font-mono font-black text-white">
                {report.no_spend_days_count}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">
                  / {report.days_elapsed}d
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                ₹0 Discretionary Outflow
              </span>
            </div>

            {/* Daily Discretionary Burn */}
            <div className="velvet-card p-3.5 rounded-2xl border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                  Daily Burn Rate
                </span>
                <Clock className="w-4 h-4 text-[#FBD8B3]" />
              </div>
              <div className="text-xl sm:text-2xl font-mono font-black text-white truncate">
                {formatCurrency(report.daily_average_e5)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                Average Per Day
              </span>
            </div>

            {/* Largest Purchase of the Month */}
            {report.largest_transaction && (
              <div className="velvet-card p-3.5 rounded-2xl border border-white/10 space-y-1 col-span-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#FFB5A7]" />
                    Largest Single Expense
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {formatDate(report.largest_transaction.date)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {(report.largest_transaction.category || report.largest_transaction.envelope_name) && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FFB5A7]/15 text-[#FFB5A7] border border-[#FFB5A7]/30 shrink-0 font-bold">
                        {report.largest_transaction.category || report.largest_transaction.envelope_name}
                      </span>
                    )}
                    <span className="text-xs font-bold text-white truncate max-w-[200px]">
                      {report.largest_transaction.envelope_name || report.largest_transaction.description}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-black text-[#FFB5A7] shrink-0 ml-2">
                    {formatCurrency(report.largest_transaction.amount_e5)}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method Breakdown */}
            {report.payment_method_splits.length > 0 && (
              <div className="velvet-card p-3.5 rounded-2xl border border-white/10 space-y-2 col-span-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#C8B6FF]" />
                  Payment Channels
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {report.payment_method_splits.map((pm) => (
                    <div
                      key={pm.method}
                      className="p-2 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5"
                    >
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {pm.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-white block">
                        {formatCurrency(pm.spent_e5)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InsightsPage;
