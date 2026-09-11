/**
 * Cadence and period date utilities for budget envelopes.
 * Calculates remaining days in cadence cycles (daily, weekly, monthly, yearly, etc.)
 * and computes uniform safe daily spend allocations.
 */

/**
 * Calculates the number of remaining days in the current cadence period,
 * including today.
 *
 * @param cadence - Envelope cadence: 'daily', 'weekly', 'monthly', 'yearly', etc. (defaults to 'monthly')
 * @param referenceDate - Reference date (defaults to current local date/time)
 * @returns Number of days remaining in the period (minimum 1)
 */
export function getRemainingDaysInCadence(
  cadence?: string | null,
  referenceDate: Date = new Date()
): number {
  const norm = (cadence || 'monthly').toLowerCase().trim();

  const now = referenceDate;
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  // Midnight of today
  const todayMidnight = new Date(year, month, date);

  if (norm.startsWith('dai') || norm.startsWith('day')) {
    // Daily cadence: only today remains in the current 1-day cycle
    return 1;
  }

  if (norm.startsWith('week')) {
    // Weekly cadence: days remaining in current week (Monday to Sunday)
    // getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
    // Convert to Monday = 0, Tuesday = 1, ..., Sunday = 6
    const dayOfWeek = now.getDay();
    const mondayBasedDay = (dayOfWeek + 6) % 7;
    // Remaining days in week including today:
    // Monday (0) -> 7 days remaining
    // Friday (4) -> 3 days remaining
    // Saturday (5) -> 2 days remaining
    // Sunday (6) -> 1 day remaining
    const daysRemaining = 7 - mondayBasedDay;
    return Math.max(1, daysRemaining);
  }

  if (norm.includes('biweek') || norm.includes('fortnight')) {
    // Bi-weekly cadence: 14 days cycle
    const dayOfWeek = now.getDay();
    const mondayBasedDay = (dayOfWeek + 6) % 7;
    return Math.max(1, 14 - mondayBasedDay);
  }

  if (norm.startsWith('quarter')) {
    // Quarterly cadence: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
    const currentQuarter = Math.floor(month / 3);
    const endOfQuarterMonth = (currentQuarter + 1) * 3;
    // Day 0 of next month is the last day of this month
    const endOfQuarter = new Date(year, endOfQuarterMonth, 0);
    const diffMs = endOfQuarter.getTime() - todayMidnight.getTime();
    const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, daysRemaining);
  }

  if (norm.startsWith('year') || norm.startsWith('annual')) {
    // Yearly cadence: days remaining in current calendar year through Dec 31 inclusive
    const endOfYear = new Date(year, 11, 31);
    const diffMs = endOfYear.getTime() - todayMidnight.getTime();
    const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, daysRemaining);
  }

  // Default: Monthly cadence
  // Days remaining in current calendar month through last day of month inclusive
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const daysRemaining = lastDayOfMonth - date + 1;
  return Math.max(1, daysRemaining);
}

/**
 * Calculates uniform safe daily spend for the remaining days of an envelope's cadence.
 *
 * @param remainingAmount - Remaining balance in currency units (e.g. ₹75)
 * @param cadence - Envelope cadence ('weekly', 'monthly', etc.)
 * @param referenceDate - Optional reference date
 * @returns Object with safeDaily amount and daysRemaining count
 */
export function calculateSafeDailySpend(
  remainingAmount: number,
  cadence?: string | null,
  referenceDate: Date = new Date()
): {
  safeDaily: number;
  daysRemaining: number;
} {
  const daysRemaining = getRemainingDaysInCadence(cadence, referenceDate);
  const remaining = Math.max(0, remainingAmount);
  const safeDaily = Math.round(remaining / daysRemaining);

  return {
    safeDaily,
    daysRemaining
  };
}
