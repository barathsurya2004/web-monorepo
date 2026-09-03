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
  is_system: boolean;
  currency: string;
  cadence: string;
  envelope_id: string;
}

export interface DashboardSummary {
  total_income_e5: number;
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

