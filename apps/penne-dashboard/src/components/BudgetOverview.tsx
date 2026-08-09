import React from 'react';
import { StatCard, Button } from '@packages/ui';
import { formatCurrency, e5ToAmount } from '@packages/types';
import { ArrowDownLeft, ArrowUpRight, PieChart, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface BudgetOverviewProps {
  totalIncomeE5: number;
  totalAllocatedE5: number;
  totalSpentE5: number;
  readyToAssignE5: number;
  onOpenAllocateModal: () => void;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  totalIncomeE5,
  totalAllocatedE5,
  totalSpentE5,
  readyToAssignE5,
  onOpenAllocateModal
}) => {
  const isZeroBased = readyToAssignE5 === 0;
  const isNegative = readyToAssignE5 < 0;

  return (
    <div className="space-y-6">
      {/* Ready to Assign Hero Banner */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 backdrop-blur-xl transition-all shadow-2xl ${
        isZeroBased
          ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-teal-950/70 border-emerald-500/40 shadow-emerald-950/30'
          : isNegative
          ? 'bg-gradient-to-r from-rose-950/70 via-slate-900/90 to-amber-950/70 border-rose-500/40 shadow-rose-950/30'
          : 'bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-cyan-950/70 border-indigo-500/40 shadow-indigo-950/30'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isZeroBased ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Perfect Zero-Based Budget
                </span>
              ) : isNegative ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Over-Allocated Budget
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                  <PieChart className="w-3.5 h-3.5" /> Ready to Assign
                </span>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {formatCurrency(readyToAssignE5)}
            </h2>

            <p className="text-sm text-slate-300 max-w-xl">
              {isZeroBased
                ? 'Every rupee has been given a job! Your income matches total envelope allocations perfectly.'
                : isNegative
                ? 'You have allocated more than your total income. Adjust envelope amounts to bring ready-to-assign to ₹0.'
                : 'Assign these funds to your envelopes to reach a complete zero-based budget equilibrium.'}
            </p>
          </div>

          <Button
            size="lg"
            variant={isNegative ? 'danger' : 'primary'}
            onClick={onOpenAllocateModal}
            className="w-full md:w-auto shadow-lg flex items-center justify-center gap-2"
          >
            <span>Allocate to Envelopes</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-[#grid-template-columns:repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(totalIncomeE5)}
          subtitle="Total inflows received"
          accentColor="border-l-emerald-500"
          icon={<ArrowDownLeft className="w-5 h-5 text-emerald-400" />}
        />

        <StatCard
          title="Total Allocated"
          value={formatCurrency(totalAllocatedE5)}
          subtitle={`${((totalAllocatedE5 / (totalIncomeE5 || 1)) * 100).toFixed(1)}% of total income`}
          accentColor="border-l-indigo-500"
          icon={<PieChart className="w-5 h-5 text-indigo-400" />}
        />

        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalSpentE5)}
          subtitle="Outflows across all envelopes"
          accentColor="border-l-rose-500"
          icon={<ArrowUpRight className="w-5 h-5 text-rose-400" />}
        />
      </div>
    </div>
  );
};
