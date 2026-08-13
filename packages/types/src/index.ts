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

export interface Transaction {
  id: string;
  user_id: string;
  envelope_id?: string | null; // Nullable if uncategorized yet
  amount_e5: number;
  txn_type: 'credit' | 'debit' | string;
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

// Robust Date Formatting Helper (Handles missing, null, undefined, Go zero-time '0001-01-01T00:00:00Z', and invalid dates)
export function formatDate(dateVal?: string | Date | null): string {
  if (!dateVal) return 'Today';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1 || d.getFullYear() < 2000) {
      return 'Today';
    }
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Today';
  }
}
