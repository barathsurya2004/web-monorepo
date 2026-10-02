import React, { useState } from 'react';
import {
  DailySpendingHeatmapItem,
  formatCurrency,
  formatDate,
} from '@packages/types';
import { Flame, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';

interface SpendingHeatmapProps {
  items: DailySpendingHeatmapItem[];
  firstDayOffset: number;
  monthLabel: string;
  maxDailySpendE5: number;
  noSpendDaysCount: number;
  daysElapsed: number;
}

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({
  items = [],
  firstDayOffset = 0,
  monthLabel,
  maxDailySpendE5,
  noSpendDaysCount,
  daysElapsed,
}) => {
  // Find peak day or default to today/first item
  const defaultSelected = items.find((it) => it.intensity_level === 4) || items[0] || null;
  const [selectedItem, setSelectedItem] = useState<DailySpendingHeatmapItem | null>(defaultSelected);

  // Intensity color styles matching velvet theme
  const getIntensityClass = (level: number, isFuture: boolean, isSelected: boolean) => {
    const base = 'transition-all duration-200 cursor-pointer active:scale-90';
    const ring = isSelected ? 'ring-2 ring-white scale-105 z-10 shadow-lg' : 'hover:scale-105';

    if (isFuture) {
      return `${base} bg-white/[0.02] border border-white/5 text-slate-600 opacity-40 cursor-default`;
    }

    switch (level) {
      case 1:
        // Subtle Low spend (Mint tint)
        return `${base} ${ring} bg-[#A8E6CF]/20 border border-[#A8E6CF]/35 text-[#A8E6CF] font-bold`;
      case 2:
        // Moderate spend (Medium Mint)
        return `${base} ${ring} bg-[#A8E6CF]/45 border border-[#A8E6CF]/60 text-white font-extrabold shadow-sm`;
      case 3:
        // High spend (Warm Peach)
        return `${base} ${ring} bg-[#FBD8B3]/50 border border-[#FBD8B3]/75 text-white font-extrabold shadow-sm`;
      case 4:
        // Peak / Spike spend (Coral Glow)
        return `${base} ${ring} bg-[#FFB5A7]/75 border border-[#FFB5A7] text-white font-black shadow-[0_0_12px_rgba(255,181,167,0.35)]`;
      case 0:
      default:
        // Zero spend day
        return `${base} ${ring} bg-[#232044]/90 border border-white/10 text-slate-400 hover:border-white/20`;
    }
  };

  return (
    <div className="velvet-card p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#FBD8B3]/15 text-[#FBD8B3] border border-[#FBD8B3]/30">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Spending Intensity Heatmap
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Daily discretionary outflow matrix
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
          {noSpendDaysCount} Zero-Spend Days
        </span>
      </div>

      {/* Weekday Labels (7 columns) */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono font-bold text-slate-400 select-none pb-0.5">
        {WEEKDAY_HEADERS.map((day, idx) => (
          <div key={`${day}-${idx}`} className="py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* The Heatmap Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Leading empty offset cells */}
        {Array.from({ length: firstDayOffset }).map((_, idx) => (
          <div
            key={`offset-${idx}`}
            className="aspect-square rounded-xl bg-transparent pointer-events-none"
          />
        ))}

        {/* Calendar Day Squares */}
        {items.map((item) => {
          const isSelected = selectedItem?.date === item.date;
          return (
            <button
              key={item.date}
              type="button"
              onClick={() => setSelectedItem(item)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 relative ${getIntensityClass(
                item.intensity_level,
                item.is_future,
                isSelected
              )}`}
              title={`${item.date} (${item.day_name}): ${
                item.total_spent_e5 > 0 ? formatCurrency(item.total_spent_e5) : '₹0 spent'
              }`}
            >
              <span className="text-[11px] font-mono leading-none select-none">
                {item.day}
              </span>
              {item.intensity_level > 0 && !item.is_future && (
                <span className="w-1 h-1 rounded-full bg-white/80 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend Row */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
        <span>Less spend</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px]">₹0</span>
          <span className="w-3 h-3 rounded-md bg-[#232044] border border-white/10" title="Level 0: ₹0" />
          <span className="w-3 h-3 rounded-md bg-[#A8E6CF]/25 border border-[#A8E6CF]/40" title="Level 1: Low" />
          <span className="w-3 h-3 rounded-md bg-[#A8E6CF]/50 border border-[#A8E6CF]/60" title="Level 2: Moderate" />
          <span className="w-3 h-3 rounded-md bg-[#FBD8B3]/50 border border-[#FBD8B3]/75" title="Level 3: Elevated" />
          <span className="w-3 h-3 rounded-md bg-[#FFB5A7]/75 border border-[#FFB5A7]" title="Level 4: Spike" />
          <span className="text-[9px]">Peak</span>
        </div>
      </div>

      {/* Interactive Day Inspector Box */}
      {selectedItem && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#1A1735]/90 border border-white/10 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#C8B6FF]" />
              <span className="text-xs font-bold text-white font-mono">
                {selectedItem.day_name}, {selectedItem.day} {monthLabel.split(' ')[0]}
              </span>
              {selectedItem.is_future && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                  Upcoming
                </span>
              )}
            </div>
            <div className="text-right font-mono">
              <span
                className={`text-xs sm:text-sm font-black ${
                  selectedItem.total_spent_e5 > 0 ? 'text-[#FBD8B3]' : 'text-[#A8E6CF]'
                }`}
              >
                {selectedItem.total_spent_e5 > 0
                  ? formatCurrency(selectedItem.total_spent_e5)
                  : '₹0.00 Spent'}
              </span>
            </div>
          </div>

          {/* Transactions on Selected Day */}
          {selectedItem.transactions && selectedItem.transactions.length > 0 ? (
            <div className="space-y-1.5 pt-1.5 border-t border-white/5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Expenses on this day ({selectedItem.transactions.length}):
              </span>
              {selectedItem.transactions.map((tx) => {
                const categoryLabel = tx.category || tx.envelope_name || 'General';
                const displayName = tx.envelope_name || tx.description || categoryLabel;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between text-[11px] font-mono bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1.5 rounded-lg border border-white/5 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#C8B6FF]/15 text-[#C8B6FF] border border-[#C8B6FF]/30 shrink-0 font-bold">
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
          ) : !selectedItem.is_future ? (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#A8E6CF] pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Zero discretionary spend recorded on this day. Great discipline!</span>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 block pt-1">
              Day has not occurred yet in this billing cycle.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
