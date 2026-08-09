import {
  User,
  Transaction,
  EnvelopeGroup,
  Envelope,
  Allocation,
  AuthResponse,
  AuthSession,
  amountToE5
} from '@packages/types';

// Read API Base URL from Vite Environment Variable VITE_API_BASE_URL (defaults to /api proxy)
const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '') : '/api';



// Default Test Token & UUID for offline / demo mode
const TEST_USER_UUID = 'f66dcebd-e275-4b22-83bd-e446e0a45624';
const TEST_BEARER_TOKEN = 'f66dcebd-e275-4b22-83bd-e446e0a45624';

const INITIAL_DEMO_USER: User = {
  uuid: TEST_USER_UUID,
  name: 'Barath (Test User)',
  created_at: new Date().toISOString()
};

const INITIAL_GROUPS: EnvelopeGroup[] = [
  {
    id: 'group-sys-01',
    user_uuid: TEST_USER_UUID,
    name: 'Unallocated Budget',
    is_system: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'group-needs-02',
    user_uuid: TEST_USER_UUID,
    name: 'Monthly Needs',
    is_system: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'group-wants-03',
    user_uuid: TEST_USER_UUID,
    name: 'Lifestyle & Fun',
    is_system: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'group-savings-04',
    user_uuid: TEST_USER_UUID,
    name: 'Goals & Investments',
    is_system: false,
    created_at: new Date().toISOString()
  }
];

const INITIAL_ENVELOPES: Envelope[] = [
  {
    id: 'env-sys-01',
    user_uuid: TEST_USER_UUID,
    envelope_group_id: 'group-sys-01',
    target_amount_e5: 0,
    cadence: 'monthly',
    country_iso2: 'IN',
    is_system: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'env-rent-02',
    user_uuid: TEST_USER_UUID,
    envelope_group_id: 'group-needs-02',
    target_amount_e5: amountToE5(25000),
    cadence: 'monthly',
    country_iso2: 'IN',
    is_system: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'env-groceries-03',
    user_uuid: TEST_USER_UUID,
    envelope_group_id: 'group-needs-02',
    target_amount_e5: amountToE5(12000),
    cadence: 'monthly',
    country_iso2: 'IN',
    is_system: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'env-dining-04',
    user_uuid: TEST_USER_UUID,
    envelope_group_id: 'group-wants-03',
    target_amount_e5: amountToE5(8000),
    cadence: 'monthly',
    country_iso2: 'IN',
    is_system: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'env-emergency-05',
    user_uuid: TEST_USER_UUID,
    envelope_group_id: 'group-savings-04',
    target_amount_e5: amountToE5(50000),
    cadence: 'monthly',
    country_iso2: 'IN',
    is_system: false,
    created_at: new Date().toISOString()
  }
];

const INITIAL_ALLOCATIONS: Allocation[] = [
  {
    id: 'alloc-rent-01',
    envelope_id: 'env-rent-02',
    allocated_amount_e5: amountToE5(25000),
    created_at: new Date().toISOString()
  },
  {
    id: 'alloc-groceries-02',
    envelope_id: 'env-groceries-03',
    allocated_amount_e5: amountToE5(10000),
    created_at: new Date().toISOString()
  },
  {
    id: 'alloc-dining-03',
    envelope_id: 'env-dining-04',
    allocated_amount_e5: amountToE5(5000),
    created_at: new Date().toISOString()
  },
  {
    id: 'alloc-emergency-04',
    envelope_id: 'env-emergency-05',
    allocated_amount_e5: amountToE5(20000),
    created_at: new Date().toISOString()
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-01',
    user_id: TEST_USER_UUID,
    envelope_id: null,
    amount_e5: amountToE5(90000),
    txn_type: 'credit',
    bank_name: 'HDFC Bank',
    country_iso2: 'IN',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'txn-02',
    user_id: TEST_USER_UUID,
    envelope_id: 'env-rent-02',
    amount_e5: amountToE5(25000),
    txn_type: 'debit',
    bank_name: 'HDFC Bank',
    country_iso2: 'IN',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'txn-03',
    user_id: TEST_USER_UUID,
    envelope_id: 'env-groceries-03',
    amount_e5: amountToE5(3450),
    txn_type: 'debit',
    bank_name: 'ICICI Bank',
    country_iso2: 'IN',
    created_at: new Date().toISOString()
  }
];

export class PenneApiClient {
  private token: string | null = null;
  private userUUID: string = TEST_USER_UUID;
  private useMock: boolean = false;

  // Local state for mock store
  private mockUser: User = INITIAL_DEMO_USER;
  private mockGroups: EnvelopeGroup[] = [...INITIAL_GROUPS];
  private mockEnvelopes: Envelope[] = [...INITIAL_ENVELOPES];
  private mockAllocations: Allocation[] = [...INITIAL_ALLOCATIONS];
  private mockTransactions: Transaction[] = [...INITIAL_TRANSACTIONS];

  constructor() {
    this.token = localStorage.getItem('penne_auth_token');
  }

  public setToken(token: string) {
    this.token = token;
    localStorage.setItem('penne_auth_token', token);
  }

  public getToken(): string | null {
    return this.token;
  }

  public setUseMock(useMock: boolean) {
    this.useMock = useMock;
  }

  public isUsingMock(): boolean {
    return this.useMock;
  }

  // --- TOKEN CACHING & SESSION MANAGEMENT ---

  public getCachedSessions(): AuthSession[] {
    try {
      const raw = localStorage.getItem('penne_sessions');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public saveSession(token: string, name: string, userUuid: string) {
    this.setToken(token);
    this.userUUID = userUuid;
    const sessions = this.getCachedSessions();

    const existingIdx = sessions.findIndex((s) => s.token === token);
    const newSession: AuthSession = {
      token,
      name,
      user_uuid: userUuid,
      lastUsed: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      sessions[existingIdx] = newSession;
    } else {
      sessions.unshift(newSession);
    }

    localStorage.setItem('penne_sessions', JSON.stringify(sessions.slice(0, 5)));
  }

  public logout() {
    this.token = null;
    localStorage.removeItem('penne_auth_token');
  }

  // HTTP Helper with Safe JSON Response Parsing & Connection Error Handling
  private async request<T>(endpoint: string, options: RequestInit = {}, explicitToken?: string): Promise<T> {
    if (this.useMock) {
      throw new Error('Using mock mode');
    }

    const tokenToUse = explicitToken || this.token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers as Record<string, string>)
    };

    if (tokenToUse) {
      headers['Authorization'] = `Bearer ${tokenToUse}`;
    }

    console.log(`[Penne API Request] ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
    } catch (networkErr: any) {
      console.warn(`[Penne API Network Error] Backend unreachable at ${API_BASE_URL}${endpoint}`, networkErr);
      throw new Error(`Failed to fetch from backend at ${API_BASE_URL}. Ensure backend server is running and CORS is enabled.`);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Penne API Error] ${res.status}: ${errText}`);
      throw new Error(errText || `Request failed with status ${res.status}`);
    }

    const text = await res.text();
    if (!text) return [] as unknown as T;

    try {
      const data = JSON.parse(text);
      console.log(`[Penne API Response] ${endpoint}`, data);
      return data as T;
    } catch {
      return [] as unknown as T;
    }
  }

  // --- AUTH METHODS (Matching /auth/signup & /auth/login) ---

  async signup(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      // Call POST /auth/signup
      const authRes = await this.request<{ token?: string; auth_token?: string; user_auth_token?: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          country_iso2: 'IN'
        })
      });

      const token = authRes.token || authRes.auth_token || authRes.user_auth_token;
      if (!token) {
        throw new Error('No token returned from server');
      }

      this.setToken(token);

      // Fetch User Profile
      let user: User;
      try {
        user = await this.request<User>('/user', { method: 'GET' }, token);
      } catch {
        user = { uuid: TEST_USER_UUID, name, created_at: new Date().toISOString() };
      }

      this.saveSession(token, user.name || name, user.uuid || TEST_USER_UUID);
      return { token, user };
    } catch (err: any) {
      console.warn('Backend /auth/signup failed, using fallback mode', err);
      // If server unreachable, create local session
      if (err.message.includes('Failed to fetch')) {
        const mockToken = `token-signup-${Date.now()}`;
        const mockUser: User = {
          uuid: `user-${Date.now()}`,
          name,
          created_at: new Date().toISOString()
        };
        this.mockUser = mockUser;
        this.saveSession(mockToken, name, mockUser.uuid);
        return { token: mockToken, user: mockUser };
      }
      throw err;
    }
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      // Call POST /auth/login
      const authRes = await this.request<{ token?: string; auth_token?: string; user_auth_token?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      });

      const token = authRes.token || authRes.auth_token || authRes.user_auth_token;
      if (!token) {
        throw new Error('Invalid email or password');
      }

      this.setToken(token);

      let user: User;
      try {
        user = await this.request<User>('/user', { method: 'GET' }, token);
      } catch {
        user = { uuid: TEST_USER_UUID, name: email.split('@')[0], created_at: new Date().toISOString() };
      }

      this.saveSession(token, user.name || email.split('@')[0], user.uuid || TEST_USER_UUID);
      return { token, user };
    } catch (err: any) {
      console.warn('Backend /auth/login failed', err);
      throw new Error(err.message || 'Incorrect email or password');
    }
  }

  async loginWithToken(token: string): Promise<User> {
    try {
      const user = await this.request<User>('/user', { method: 'GET' }, token);
      this.setToken(token);
      this.userUUID = user.uuid || TEST_USER_UUID;
      this.saveSession(token, user.name || 'Penne User', user.uuid || TEST_USER_UUID);
      return user;
    } catch (err) {
      console.warn('Live token validation failed, checking fallback token', err);
      if (token === TEST_BEARER_TOKEN || token.startsWith('token-')) {
        const mockUser: User = {
          uuid: TEST_USER_UUID,
          name: 'Barath (Test User)',
          created_at: new Date().toISOString()
        };
        this.setToken(token);
        this.saveSession(token, mockUser.name, mockUser.uuid);
        return mockUser;
      }
      throw new Error('Invalid or Expired Auth Token');
    }
  }

  async getUser(): Promise<User> {
    if (!this.token) {
      throw new Error('No active auth session');
    }
    try {
      const res = await this.request<User>('/user', { method: 'GET' });
      if (res && res.uuid) {
        this.userUUID = res.uuid;
        return res;
      }
      return { uuid: this.userUUID, name: 'Penne User', created_at: new Date().toISOString() };
    } catch (err) {
      console.log('[Penne API] Using mock fallback for user profile');
      return this.mockUser;
    }
  }

  async getEnvelopeGroups(): Promise<EnvelopeGroup[]> {
    try {
      const res = await this.request<EnvelopeGroup[]>(`/envelope-groups?user_uuid=${this.userUUID}`, { method: 'GET' });
      return Array.isArray(res) ? res : this.mockGroups;
    } catch {
      return this.mockGroups;
    }
  }

  async createEnvelopeGroup(name: string): Promise<EnvelopeGroup> {
    const nowIso = new Date().toISOString();
    try {
      const res = await this.request<EnvelopeGroup>('/envelope-group', {
        method: 'POST',
        body: JSON.stringify({
          name,
          user_uuid: this.userUUID,
          created_at: nowIso,
          updated_at: nowIso
        })
      });
      return res;
    } catch {
      const newGroup: EnvelopeGroup = {
        id: `group-${Date.now()}`,
        user_uuid: this.userUUID,
        name,
        is_system: false,
        created_at: nowIso
      };
      this.mockGroups.push(newGroup);
      return newGroup;
    }
  }

  async getEnvelopes(): Promise<Envelope[]> {
    try {
      const res = await this.request<Envelope[]>(`/envelopes?user_uuid=${this.userUUID}`, { method: 'GET' });
      return Array.isArray(res) ? res : this.mockEnvelopes;
    } catch {
      return this.mockEnvelopes;
    }
  }

  async createEnvelope(envelopeGroupId: string, targetAmountE5: number, cadence: string = 'monthly'): Promise<Envelope> {
    const nowIso = new Date().toISOString();
    try {
      return await this.request<Envelope>('/envelope', {
        method: 'POST',
        body: JSON.stringify({
          user_uuid: this.userUUID,
          envelope_group_id: envelopeGroupId,
          target_amount_e5: targetAmountE5,
          cadence,
          country_iso2: 'IN',
          created_at: nowIso,
          updated_at: nowIso
        })
      });
    } catch {
      const newEnvelope: Envelope = {
        id: `env-${Date.now()}`,
        user_uuid: this.userUUID,
        envelope_group_id: envelopeGroupId,
        target_amount_e5: targetAmountE5,
        cadence,
        country_iso2: 'IN',
        is_system: false,
        created_at: nowIso
      };
      this.mockEnvelopes.push(newEnvelope);
      return newEnvelope;
    }
  }

  async getTransactions(userUuid?: string): Promise<Transaction[]> {
    const targetUuid = userUuid || this.userUUID;
    try {
      const res = await this.request<Transaction[]>(`/transactions?user_uuid=${targetUuid}`, { method: 'GET' });
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn('Failed to fetch transactions from live server', err);
      return this.mockTransactions;
    }
  }

  async createTransaction(amountE5: number, txnType: string, bankName: string, envelopeId?: string | null): Promise<Transaction> {
    const nowIso = new Date().toISOString();
    try {
      return await this.request<Transaction>('/transaction', {
        method: 'POST',
        body: JSON.stringify({
          user_id: this.userUUID,
          amount_e5: amountE5,
          txn_type: txnType,
          bank_name: bankName,
          envelope_id: envelopeId || null,
          country_iso2: 'IN',
          created_at: nowIso
        })
      });
    } catch {
      const newTxn: Transaction = {
        id: `txn-${Date.now()}`,
        user_id: this.userUUID,
        envelope_id: envelopeId || null,
        amount_e5: amountE5,
        txn_type: txnType,
        bank_name: bankName,
        country_iso2: 'IN',
        created_at: nowIso
      };
      this.mockTransactions.unshift(newTxn);
      return newTxn;
    }
  }

  async getActiveAllocations(): Promise<Allocation[]> {
    try {
      const res = await this.request<Allocation[]>(`/allocations/active?user_uuid=${this.userUUID}`, { method: 'GET' });
      return Array.isArray(res) ? res : this.mockAllocations;
    } catch {
      return this.mockAllocations;
    }
  }

  async createAllocation(envelopeId: string, allocatedAmountE5: number): Promise<Allocation> {
    const nowIso = new Date().toISOString();
    try {
      return await this.request<Allocation>('/allocation', {
        method: 'POST',
        body: JSON.stringify({
          envelope_id: envelopeId,
          allocated_amount_e5: allocatedAmountE5,
          created_at: nowIso,
          updated_at: nowIso
        })
      });
    } catch {
      const existingIdx = this.mockAllocations.findIndex(a => a.envelope_id === envelopeId);
      if (existingIdx >= 0) {
        this.mockAllocations[existingIdx].allocated_amount_e5 += allocatedAmountE5;
        return this.mockAllocations[existingIdx];
      } else {
        const newAlloc: Allocation = {
          id: `alloc-${Date.now()}`,
          envelope_id: envelopeId,
          allocated_amount_e5: allocatedAmountE5,
          created_at: nowIso
        };
        this.mockAllocations.push(newAlloc);
        return newAlloc;
      }
    }
  }
}

export const api = new PenneApiClient();
