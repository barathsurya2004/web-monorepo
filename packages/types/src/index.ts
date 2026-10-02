// Shared TypeScript models matching penne-server Go API definitions

export interface User {
  uuid: string;
  name: string;
  created_at?: string;
  CreatedAt?: string;
  updated_at?: string;
  UpdatedAt?: string;
}

export type PaymentMethod = 'bank_card' | 'bank_account' | 'back_account';

export type TxnType = 'credit' | 'debit' | 'transfer' | string;

export interface Transaction {
  id: string;
  user_id: string;
  envelope_id?: string | null; // Nullable if uncategorized yet
  amount_e5: number;
  txn_type: 'credit' | 'debit' | 'transfer' | string;
  payment_method: PaymentMethod | string;
  country_iso2: string;
  created_at?: string;
  CreatedAt?: string;
  description?: string;
  wishlist_item_id?: string;
}

export interface EnvelopeGroup {
  id: string;
  user_uuid: string;
  name: string;
  is_system: boolean;
  created_at?: string;
  CreatedAt?: string;
  updated_at?: string;
  UpdatedAt?: string;
}

export interface Envelope {
  id: string;
  user_uuid: string;
  envelope_group_id: string;
  name?: string;
  target_amount_e5: number;
  cadence: string;
  country_iso2: string;
  is_system: boolean;
  created_at?: string;
  CreatedAt?: string;
  updated_at?: string;
  UpdatedAt?: string;
}

export interface Allocation {
  id: string;
  envelope_id: string;
  allocated_amount_e5: number;
  spent_amount_e5?: number;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  CreatedAt?: string;
  updated_at?: string;
  UpdatedAt?: string;
}

export interface AuthResponse {
  user_auth_token: string;
}

export interface AuthSession {
  token: string;
  name: string;
  user_uuid: string;
  lastUsed: string;
}

export interface ActiveCategory {
  name: string;
  allocated_amount_e5: number;
  spent_amount_e5?: number;
  is_system: boolean;
  currency: string;
  cadence: string;
  envelope_id: string;
  allocation_id?: string;
}

export interface DashboardSummary {
  total_income_e5: number;
  base_income_e5?: number;
  buffered_income_e5?: number;
  buffered_used_e5?: number;
  buffered_remaining_e5?: number;
  total_expense_e5: number;
  total_remaining_e5: number;
  card_spent_e5: number;
  card_limit_e5: number;
  bank_spent_e5: number;
  bank_limit_e5: number;
}


// E5 Helpers (penne-server uses E5 format where 1 unit = 100,000 E5)
export const E5_FACTOR = 100000;

export function e5ToAmount(e5: number): number {
  return e5 / E5_FACTOR;
}

export function amountToE5(amount: number): number {
  return Math.round(amount * E5_FACTOR);
}

export function formatCurrency(e5: number, symbol: string = '₹'): string {
  const amount = e5ToAmount(e5);
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Centralized UTC Date Parser (Handles missing, null, undefined, Go zero-time '0001-01-01T00:00:00Z', SQL space 'YYYY-MM-DD HH:MM:SS', and un-suffixed ISO strings)
export function parseUtcDate(dateVal?: string | Date | null): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  try {
    let normalized = String(dateVal).trim();
    if (!normalized || normalized.startsWith('0001-01-01')) return null;

    if (normalized.includes(' ') && !normalized.includes('T')) {
      normalized = normalized.replace(' ', 'T');
    }
    // If ISO timestamp string has no timezone offset or Z suffix, append Z so JavaScript parses as UTC ISO-8601
    if (!normalized.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(normalized)) {
      normalized += 'Z';
    }

    const d = new Date(normalized);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1 || d.getFullYear() < 2000) {
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

// Robust Date Formatting Helper
export function formatDate(dateVal?: string | Date | null): string {
  const d = parseUtcDate(dateVal);
  if (!d) return 'Today';
  try {
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Today';
  }
}

// Subscription Types
export type SubscriptionCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface Subscription {
  id: string;
  user_uuid: string;
  envelope_id?: string | null;
  name: string;
  amount_e5: number;
  billing_cycle: SubscriptionCycle;
  next_billing_date: string;
  payment_method: 'bank_card' | 'bank_account' | 'upi' | string;
  status: SubscriptionStatus;
  auto_renew: boolean;
  notes?: string;
  last_charged_at?: string | null;
  last_transaction_id?: string | null;
  merchant_pattern?: string;
  charge_window_hours?: number;
  occurrence_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionSummary {
  total_monthly_commitment_e5: number;
  active_count: number;
  paused_count: number;
  next_upcoming?: Subscription | null;
  subscriptions: Subscription[];
}

// Monthly Insights & Analytics Models
export interface CategorySpendSplit {
  envelope_id: string;
  envelope_name: string;
  group_name: string;
  spent_e5: number;
  percentage: number;
  transaction_count: number;
}

export interface PeakSpendDayInfo {
  date: string; // YYYY-MM-DD
  day_name: string; // "Saturday"
  total_spent_e5: number;
  transaction_count: number;
  top_transactions: Array<{
    id: string;
    description: string;
    amount_e5: number;
    payment_method?: string;
  }>;
}

export interface DailySpendingHeatmapItem {
  date: string; // YYYY-MM-DD
  day: number; // 1 - 31
  day_of_week: number; // 0 - 6 (0 = Sun)
  day_name: string; // "Saturday"
  total_spent_e5: number;
  transaction_count: number;
  intensity_level: 0 | 1 | 2 | 3 | 4;
  is_future: boolean;
  transactions?: Array<{
    id: string;
    description: string;
    amount_e5: number;
    payment_method?: string;
  }>;
}

export interface MonthlyInsightsReport {
  year: number;
  month: number; // 1-12
  month_label: string; // e.g. "October 2026"
  days_in_month: number;
  days_elapsed: number;

  // Executive Totals
  total_income_e5: number;
  total_expense_e5: number;
  net_savings_e5: number;
  savings_rate_pct: number;

  // Subscriptions vs Discretionary
  subscription_expense_e5: number;
  discretionary_expense_e5: number;
  subscription_count: number;

  // Peak Day (Excluding Subscriptions)
  peak_day?: PeakSpendDayInfo | null;

  // Daily Spending Heatmap (All days in month)
  daily_heatmap: DailySpendingHeatmapItem[];
  first_day_offset: number; // 0 = Sun, 1 = Mon ...
  max_daily_spend_e5: number;

  // Category Breakdown
  category_splits: CategorySpendSplit[];

  // Habits & Extremes
  no_spend_days_count: number;
  daily_average_e5: number;
  largest_transaction?: {
    id: string;
    description: string;
    amount_e5: number;
    date: string;
  } | null;

  // Payment Method Breakdown
  payment_method_splits: Array<{
    method: string;
    label: string;
    spent_e5: number;
    count: number;
  }>;

  // Month-over-Month Delta (vs previous month)
  previous_month?: {
    total_expense_e5: number;
    delta_pct: number;
    is_lower: boolean;
  } | null;
}




