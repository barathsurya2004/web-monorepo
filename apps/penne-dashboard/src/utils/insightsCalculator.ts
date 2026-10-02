import {
  Transaction,
  Envelope,
  EnvelopeGroup,
  Subscription,
  MonthlyInsightsReport,
  CategorySpendSplit,
  PeakSpendDayInfo,
  DailySpendingHeatmapItem,
  parseUtcDate,
} from '@packages/types';

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
function toLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Computes a comprehensive monthly insights report from active transaction and envelope state.
 */
export function computeMonthlyInsights(
  transactions: Transaction[],
  envelopes: Envelope[] = [],
  envelopeGroups: EnvelopeGroup[] = [],
  subscriptions: Subscription[] = [],
  targetYear: number,
  targetMonth: number // 1 - 12
): MonthlyInsightsReport {
  const monthIndex = targetMonth - 1;
  const monthLabel = `${MONTH_NAMES[monthIndex]} ${targetYear}`;

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === targetYear && now.getMonth() === monthIndex;

  // Number of days in target month
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const daysElapsed = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;

  // Build lookups
  const envelopeMap = new Map<string, Envelope>();
  envelopes.forEach((e) => {
    if (e?.id) envelopeMap.set(e.id, e);
  });

  const groupMap = new Map<string, string>();
  envelopeGroups.forEach((g) => {
    if (g?.id) groupMap.set(g.id, g.name);
  });

  // Fast set of subscription txn IDs and merchant patterns
  const subTxnIdSet = new Set<string>();
  const subNames = subscriptions.map((s) => s.name?.toLowerCase().trim()).filter(Boolean);
  subscriptions.forEach((s) => {
    if (s.last_transaction_id) subTxnIdSet.add(s.last_transaction_id);
  });

  const isSubscriptionTxn = (t: Transaction): boolean => {
    if (subTxnIdSet.has(t.id)) return true;
    const desc = (t.description || '').toLowerCase();
    if (desc.startsWith('subscription:')) return true;
    for (const name of subNames) {
      if (name && desc.includes(name)) return true;
    }
    return false;
  };

  // Filter transactions belonging to target month
  const monthTxns: Transaction[] = [];
  const prevMonthTxns: Transaction[] = [];

  const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
  const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;

  for (const t of transactions) {
    const d = parseUtcDate(t.created_at || (t as any).CreatedAt);
    if (!d) continue;

    const matchesMonth =
      (d.getUTCFullYear() === targetYear && d.getUTCMonth() === monthIndex) ||
      (d.getFullYear() === targetYear && d.getMonth() === monthIndex);
    const matchesPrevMonth =
      (d.getUTCFullYear() === prevYear && d.getUTCMonth() === prevMonth - 1) ||
      (d.getFullYear() === prevYear && d.getMonth() === prevMonth - 1);

    if (matchesMonth) {
      monthTxns.push(t);
    } else if (matchesPrevMonth) {
      prevMonthTxns.push(t);
    }
  }

  // Aggregate executive metrics
  let totalIncomeE5 = 0;
  let totalExpenseE5 = 0;
  let subscriptionExpenseE5 = 0;
  let discretionaryExpenseE5 = 0;
  let subscriptionCount = 0;

  // Daily spend map for peak day & zero-spend days (ignoring subscriptions)
  const dailyDiscretionaryMap = new Map<
    string,
    {
      date: string;
      dayName: string;
      totalE5: number;
      txns: Transaction[];
    }
  >();

  // Category spend map
  const categorySpendMap = new Map<
    string,
    {
      envelopeId: string;
      spentE5: number;
      count: number;
    }
  >();

  // Payment method spend map
  const paymentMethodMap = new Map<
    string,
    {
      spentE5: number;
      count: number;
    }
  >();

  let largestTxn: Transaction | null = null;

  for (const t of monthTxns) {
    const txnType = (t.txn_type || (t as any).Type || (t as any).type || '').toLowerCase();
    const isCredit = txnType === 'credit';
    const isDebit = txnType === 'debit';
    const amt = Number(t.amount_e5 || (t as any).AmountE5 || 0);

    if (isCredit) {
      totalIncomeE5 += amt;
    } else if (isDebit) {
      totalExpenseE5 += amt;

      const isSub = isSubscriptionTxn(t);
      if (isSub) {
        subscriptionExpenseE5 += amt;
        subscriptionCount++;
      } else {
        discretionaryExpenseE5 += amt;

        // Track largest discretionary expense
        if (!largestTxn || amt > Number(largestTxn.amount_e5 || (largestTxn as any).AmountE5 || 0)) {
          largestTxn = t;
        }

        // Daily bucket for peak spend day calculation
        const d = parseUtcDate(t.created_at || t.CreatedAt);
        if (d) {
          const dateKey = toLocalDateKey(d);
          const dayName = DAY_NAMES[d.getDay()];
          const existing = dailyDiscretionaryMap.get(dateKey) || {
            date: dateKey,
            dayName,
            totalE5: 0,
            txns: [],
          };
          existing.totalE5 += amt;
          existing.txns.push(t);
          dailyDiscretionaryMap.set(dateKey, existing);
        }
      }

      // Category breakdown (for all debits)
      const envId = t.envelope_id || 'unassigned';
      const c = categorySpendMap.get(envId) || {
        envelopeId: envId,
        spentE5: 0,
        count: 0,
      };
      c.spentE5 += amt;
      c.count += 1;
      categorySpendMap.set(envId, c);

      // Payment method breakdown
      const pm = (t.payment_method || 'bank_card').toLowerCase();
      const p = paymentMethodMap.get(pm) || { spentE5: 0, count: 0 };
      p.spentE5 += amt;
      p.count += 1;
      paymentMethodMap.set(pm, p);
    }
  }

  const resolveTxnDetails = (t: Transaction) => {
    const env = t.envelope_id ? envelopeMap.get(t.envelope_id) : undefined;
    const category = (env?.envelope_group_id ? groupMap.get(env.envelope_group_id) : '') || 'General';
    const envelopeName = env?.name || '';
    let description = t.description?.trim();
    if (!description || description.toLowerCase() === 'discretionary purchase' || description.toLowerCase() === 'single expense') {
      if (envelopeName) {
        description = envelopeName;
      } else if (category && category !== 'General') {
        description = category;
      } else {
        description = 'Discretionary Purchase';
      }
    }
    return { category, envelopeName, description: description || 'Discretionary Purchase' };
  };

  // Peak spending day (excluding subscriptions)
  let peakDay: PeakSpendDayInfo | null = null;
  let maxDailyE5 = 0;

  dailyDiscretionaryMap.forEach((daily) => {
    if (daily.totalE5 > maxDailyE5) {
      maxDailyE5 = daily.totalE5;

      const sortedTxns = [...daily.txns]
        .sort((a, b) => b.amount_e5 - a.amount_e5)
        .slice(0, 3)
        .map((t) => {
          const details = resolveTxnDetails(t);
          return {
            id: t.id,
            description: details.description,
            amount_e5: t.amount_e5,
            payment_method: t.payment_method,
            category: details.category,
            envelope_name: details.envelopeName,
          };
        });

      peakDay = {
        date: daily.date,
        day_name: daily.dayName,
        total_spent_e5: daily.totalE5,
        transaction_count: daily.txns.length,
        top_transactions: sortedTxns,
      };
    }
  });

  // Zero-spend days count (days within the month that had ₹0 discretionary debit)
  let noSpendDaysCount = 0;
  for (let day = 1; day <= daysElapsed; day++) {
    const d = new Date(targetYear, monthIndex, day);
    const dateKey = toLocalDateKey(d);
    const spentOnDay = dailyDiscretionaryMap.get(dateKey)?.totalE5 || 0;
    if (spentOnDay === 0) {
      noSpendDaysCount++;
    }
  }

  // Net savings and savings rate
  const netSavingsE5 = totalIncomeE5 - totalExpenseE5;
  const savingsRatePct =
    totalIncomeE5 > 0 ? Math.max(0, Math.round(((totalIncomeE5 - totalExpenseE5) / totalIncomeE5) * 1000) / 10) : 0;

  // Daily average discretionary burn
  const dailyAverageE5 = daysElapsed > 0 ? Math.round(discretionaryExpenseE5 / daysElapsed) : 0;

  // Category splits sorted by spend descending
  const categorySplits: CategorySpendSplit[] = [];
  categorySpendMap.forEach((item, envId) => {
    let envName = 'Unassigned Surplus';
    let groupName = 'General';

    if (envId !== 'unassigned') {
      const env = envelopeMap.get(envId);
      if (env) {
        envName = env.name || (env.is_system ? 'Unallocated Budget' : 'Custom Category');
        const gName = groupMap.get(env.envelope_group_id);
        if (gName) groupName = gName;
      }
    }

    const pct = totalExpenseE5 > 0 ? Math.round((item.spentE5 / totalExpenseE5) * 1000) / 10 : 0;

    categorySplits.push({
      envelope_id: envId,
      envelope_name: envName,
      group_name: groupName,
      spent_e5: item.spentE5,
      percentage: pct,
      transaction_count: item.count,
    });
  });

  categorySplits.sort((a, b) => b.spent_e5 - a.spent_e5);

  // Payment method splits
  const paymentMethodLabels: Record<string, string> = {
    bank_card: 'Debit / Credit Card',
    upi: 'UPI AutoPay / QR',
    bank_account: 'Bank Auto-Debit / Netbanking',
    back_account: 'Bank Auto-Debit',
  };

  const paymentMethodSplits = Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
    method,
    label: paymentMethodLabels[method] || method.toUpperCase(),
    spent_e5: data.spentE5,
    count: data.count,
  }));
  paymentMethodSplits.sort((a, b) => b.spent_e5 - a.spent_e5);

  // Previous month comparison
  let previousMonth: MonthlyInsightsReport['previous_month'] = null;
  if (prevMonthTxns.length > 0) {
    const prevExpenseE5 = prevMonthTxns
      .filter((t) => t.txn_type === 'debit')
      .reduce((sum, t) => sum + t.amount_e5, 0);

    if (prevExpenseE5 > 0) {
      const deltaPct = Math.round(((totalExpenseE5 - prevExpenseE5) / prevExpenseE5) * 1000) / 10;
      previousMonth = {
        total_expense_e5: prevExpenseE5,
        delta_pct: deltaPct,
        is_lower: totalExpenseE5 <= prevExpenseE5,
      };
    }
  }

  // First day offset (0 = Sunday) and monthly heatmap array
  const firstDayOffset = new Date(targetYear, monthIndex, 1).getDay();
  const dailyHeatmap: DailySpendingHeatmapItem[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(targetYear, monthIndex, day);
    const dateKey = toLocalDateKey(d);
    const dayOfWeek = d.getDay();
    const dayName = DAY_NAMES[dayOfWeek];
    const isFuture = isCurrentMonth && day > now.getDate();

    const dailyData = dailyDiscretionaryMap.get(dateKey);
    const totalSpentE5 = dailyData?.totalE5 || 0;
    const txnCount = dailyData?.txns.length || 0;

    let intensityLevel: 0 | 1 | 2 | 3 | 4 = 0;
    if (!isFuture && totalSpentE5 > 0) {
      if (maxDailyE5 > 0) {
        const ratio = totalSpentE5 / maxDailyE5;
        if (ratio <= 0.2) intensityLevel = 1;
        else if (ratio <= 0.45) intensityLevel = 2;
        else if (ratio <= 0.75) intensityLevel = 3;
        else intensityLevel = 4;
      } else {
        intensityLevel = 1;
      }
    }

    dailyHeatmap.push({
      date: dateKey,
      day,
      day_of_week: dayOfWeek,
      day_name: dayName,
      total_spent_e5: totalSpentE5,
      transaction_count: txnCount,
      intensity_level: intensityLevel,
      is_future: isFuture,
      transactions: dailyData?.txns.map((t) => {
        const details = resolveTxnDetails(t);
        return {
          id: t.id,
          description: details.description,
          amount_e5: t.amount_e5,
          payment_method: t.payment_method,
          category: details.category,
          envelope_name: details.envelopeName,
        };
      }),
    });
  }

  return {
    year: targetYear,
    month: targetMonth,
    month_label: monthLabel,
    days_in_month: daysInMonth,
    days_elapsed: daysElapsed,
    total_income_e5: totalIncomeE5,
    total_expense_e5: totalExpenseE5,
    net_savings_e5: netSavingsE5,
    savings_rate_pct: savingsRatePct,
    subscription_expense_e5: subscriptionExpenseE5,
    discretionary_expense_e5: discretionaryExpenseE5,
    subscription_count: subscriptionCount,
    peak_day: peakDay,
    daily_heatmap: dailyHeatmap,
    first_day_offset: firstDayOffset,
    max_daily_spend_e5: maxDailyE5,
    category_splits: categorySplits,
    no_spend_days_count: noSpendDaysCount,
    daily_average_e5: dailyAverageE5,
    largest_transaction: largestTxn
      ? (() => {
          const details = resolveTxnDetails(largestTxn);
          return {
            id: largestTxn.id,
            description: details.description,
            amount_e5: largestTxn.amount_e5,
            date: largestTxn.created_at || (largestTxn as any).CreatedAt || '',
            category: details.category,
            envelope_name: details.envelopeName,
          };
        })()
      : null,
    payment_method_splits: paymentMethodSplits,
    previous_month: previousMonth,
  };
}
