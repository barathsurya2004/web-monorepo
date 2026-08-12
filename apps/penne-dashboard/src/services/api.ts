import {
  User,
  Transaction,
  EnvelopeGroup,
  Envelope,
  Allocation,
  AuthResponse,
  AuthSession,
  ActiveCategory,
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
    name: 'Unallocated Budget',
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
    name: 'House Rent & Housing',
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
    name: 'Groceries & Supplies',
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
    name: 'Dining Out & Food',
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
    name: 'Emergency Savings Pool',
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
    envelope_id: 'env-sys-01',
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

export interface ApiEventListenerPayload {
  endpoint: string;
  method: string;
  statusCode?: string | number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  isMock?: boolean;
}

export type ApiEventListener = (event: ApiEventListenerPayload) => void;

export class PenneApiClient {
  private token: string | null = null;
  private userUUID: string = TEST_USER_UUID;
  private useMock: boolean = false;

  private apiListeners: Set<ApiEventListener> = new Set();

  // Local state for mock store
  private mockUser: User = INITIAL_DEMO_USER;
  private mockGroups: EnvelopeGroup[] = [...INITIAL_GROUPS];
  private mockEnvelopes: Envelope[] = [...INITIAL_ENVELOPES];
  private mockAllocations: Allocation[] = [...INITIAL_ALLOCATIONS];
  private mockTransactions: Transaction[] = [...INITIAL_TRANSACTIONS];

  // In-memory Cache for Envelopes and Envelope Groups
  private cacheTTLMs: number = 5 * 60 * 1000; // 5 minutes TTL
  private envelopesCache: { data: Envelope[]; timestamp: number } | null = null;
  private groupsCache: { data: EnvelopeGroup[]; timestamp: number } | null = null;
  private categoriesCache: { data: ActiveCategory[]; timestamp: number } | null = null;

  constructor() {
    this.token = localStorage.getItem('penne_auth_token');
  }

  public onApiResult(listener: ApiEventListener): () => void {
    this.apiListeners.add(listener);
    return () => {
      this.apiListeners.delete(listener);
    };
  }

  public notifyApiResult(event: ApiEventListenerPayload) {
    this.apiListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error executing API result listener', err);
      }
    });
  }


  public clearEnvelopeCache() {
    this.envelopesCache = null;
    this.groupsCache = null;
    this.categoriesCache = null;
  }

  public setToken(token: string) {
    if (this.token !== token) {
      this.clearEnvelopeCache();
    }
    this.token = token;
    localStorage.setItem('penne_auth_token', token);
  }

  public getToken(): string | null {
    return this.token;
  }

  public setUseMock(useMock: boolean) {
    this.clearEnvelopeCache();
    this.useMock = useMock;
  }

  public isUsingMock(): boolean {
    return this.useMock;
  }

  public isUnauthorizedError(err: any): boolean {
    if (!err) return false;
    if (err.status === 401 || err.status === 403) return true;
    const msg = String(err.message || err || '').toLowerCase();
    return (
      msg.includes('unauthorized') ||
      msg.includes('unauthenticated') ||
      msg.includes('invalid token') ||
      msg.includes('expired auth token') ||
      msg.includes('invalid or expired')
    );
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
    this.clearEnvelopeCache();
    localStorage.removeItem('penne_auth_token');
  }

  // HTTP Helper with Safe JSON Response Parsing & Connection Error Handling
  private async request<T>(endpoint: string, options: RequestInit = {}, explicitToken?: string): Promise<T> {
    if (this.useMock) {
      throw new Error('Using mock mode');
    }

    const tokenToUse = explicitToken || this.token;
    const method = (options.method || 'GET').toUpperCase();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers as Record<string, string>)
    };

    if (tokenToUse) {
      headers['Authorization'] = `Bearer ${tokenToUse}`;
    }

    console.log(`[Penne API Request] ${method} ${API_BASE_URL}${endpoint}`);

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
    } catch (networkErr: any) {
      console.warn(`[Penne API Network Error] Backend unreachable at ${API_BASE_URL}${endpoint}`, networkErr);
      const errMsg = `Backend server unreachable at ${API_BASE_URL}. Ensure backend is running.`;
      this.notifyApiResult({
        endpoint,
        method,
        statusCode: 'NETWORK ERR',
        type: 'warning',
        title: 'Backend Server Unreachable',
        message: errMsg,
        isMock: false
      });
      throw new Error(`Failed to fetch from backend at ${API_BASE_URL}. Ensure backend server is running and CORS is enabled.`);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Penne API Error] ${res.status}: ${errText}`);
      const codeStr = `${res.status} ${res.statusText || 'SERVER ERR'}`.trim();
      this.notifyApiResult({
        endpoint,
        method,
        statusCode: codeStr,
        type: 'error',
        title: `Backend Request Failed (${res.status})`,
        message: errText || `Server returned error status code ${res.status}`,
        isMock: false
      });
      const error: any = new Error(errText || `Request failed with status ${res.status}`);
      error.status = res.status;
      throw error;
    }

    const text = await res.text();
    const codeStr = `${res.status} ${res.statusText || 'OK'}`.trim();

    // Trigger success notification for state-modifying requests or auth endpoints
    if (method !== 'GET' || endpoint.includes('/auth/')) {
      this.notifyApiResult({
        endpoint,
        method,
        statusCode: codeStr,
        type: 'success',
        title: `Request Succeeded (${codeStr})`,
        message: `Successfully executed ${method} ${endpoint}`,
        isMock: false
      });
    }

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
    if (this.useMock) return this.mockUser;
    if (!this.token) {
      throw new Error('No active auth session');
    }
    const res = await this.request<User>('/user', { method: 'GET' });
    if (res && res.uuid) {
      this.userUUID = res.uuid;
      return res;
    }
    return { uuid: this.userUUID, name: 'Penne User', created_at: new Date().toISOString() };
  }

  async getEnvelopeGroups(): Promise<EnvelopeGroup[]> {
    if (this.useMock) return this.mockGroups;
    if (this.groupsCache && Date.now() - this.groupsCache.timestamp < this.cacheTTLMs) {
      return this.groupsCache.data;
    }
    try {
      const res = await this.request<EnvelopeGroup[]>(`/envelope-groups?user_uuid=${this.userUUID}`, { method: 'GET' });
      const result = Array.isArray(res) ? res : [];
      this.groupsCache = { data: result, timestamp: Date.now() };
      return result;
    } catch (err) {
      if (this.isUnauthorizedError(err)) throw err;
      console.warn('[Penne API] GET /envelope-groups backend endpoint error', err);
      if (this.groupsCache) return this.groupsCache.data;
      return [];
    }
  }

  async createEnvelopeGroup(name: string): Promise<EnvelopeGroup> {
    this.clearEnvelopeCache();
    const nowIso = new Date().toISOString();
    if (this.useMock) {
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
    try {
      const created = await this.request<EnvelopeGroup>('/envelope-group', {
        method: 'POST',
        body: JSON.stringify({
          name,
          user_uuid: this.userUUID
        })
      });

      const newGroup: EnvelopeGroup = {
        id: created?.id || `group-${Date.now()}`,
        user_uuid: this.userUUID,
        name: created?.name || name,
        is_system: false,
        created_at: nowIso
      };

      if (!this.mockGroups.some((g) => g.id === newGroup.id)) {
        this.mockGroups.push(newGroup);
      }
      return newGroup;
    } catch (err) {
      console.warn('[Penne API] POST /envelope-group backend request failed, creating local envelope group fallback', err);
      const fallbackGroup: EnvelopeGroup = {
        id: `group-${Date.now()}`,
        user_uuid: this.userUUID,
        name,
        is_system: false,
        created_at: nowIso
      };
      this.mockGroups.push(fallbackGroup);
      return fallbackGroup;
    }
  }

  async getEnvelopes(): Promise<Envelope[]> {
    if (this.useMock) return this.mockEnvelopes;
    if (this.envelopesCache && Date.now() - this.envelopesCache.timestamp < this.cacheTTLMs) {
      return this.envelopesCache.data;
    }
    const res = await this.request<Envelope[]>(`/envelopes?user_uuid=${this.userUUID}`, { method: 'GET' });
    const result = Array.isArray(res) ? res : [];
    this.envelopesCache = { data: result, timestamp: Date.now() };
    return result;
  }

  async createEnvelope(envelopeGroupId: string, targetAmountE5: number, cadence: string = 'monthly', name?: string): Promise<Envelope> {
    this.clearEnvelopeCache();
    const nowIso = new Date().toISOString();
    if (this.useMock) {
      const newEnvelope: Envelope = {
        id: `env-${Date.now()}`,
        user_uuid: this.userUUID,
        envelope_group_id: envelopeGroupId,
        name: name || 'Custom Category',
        target_amount_e5: Math.round(targetAmountE5),
        cadence,
        country_iso2: 'IN',
        is_system: false,
        created_at: nowIso
      };
      this.mockEnvelopes.push(newEnvelope);
      return newEnvelope;
    }
    return await this.request<Envelope>('/envelope', {
      method: 'POST',
      body: JSON.stringify({
        user_uuid: this.userUUID,
        envelope_group_id: envelopeGroupId,
        name: name || '',
        target_amount_e5: Math.round(targetAmountE5),
        cadence,
        country_iso2: 'IN'
      })
    });
  }

  async createCategory(
    envelopeGroupId: string,
    categoryName: string,
    targetAmountE5: number,
    cadence: string = 'monthly'
  ): Promise<{ envelope: Envelope; allocation: Allocation }> {
    this.clearEnvelopeCache();
    const envelope = await this.createEnvelope(envelopeGroupId, targetAmountE5, cadence, categoryName);
    const allocation = await this.createAllocation(envelope.id, targetAmountE5);
    return { envelope, allocation };
  }

  async getTransactions(userUuid?: string): Promise<Transaction[]> {
    if (this.useMock) return this.mockTransactions;
    const targetUuid = userUuid || this.userUUID;
    const res = await this.request<Transaction[]>(`/transactions?user_uuid=${targetUuid}`, { method: 'GET' });
    return Array.isArray(res) ? res : [];
  }

  async getSystemEnvelopeId(): Promise<string | null> {
    try {
      const envs = await this.getEnvelopes();
      const sysEnv = envs.find((e) => e && (e.is_system || e.name === 'Unallocated Budget'));
      return sysEnv ? sysEnv.id : null;
    } catch {
      return null;
    }
  }

  async createTransaction(amountE5: number, txnType: string, bankName: string, envelopeId?: string | null): Promise<Transaction> {
    this.clearEnvelopeCache();
    let targetEnvId = envelopeId || null;
    if (!targetEnvId) {
      targetEnvId = await this.getSystemEnvelopeId();
    }
    const nowIso = new Date().toISOString();
    if (this.useMock) {
      const newTxn: Transaction = {
        id: `txn-${Date.now()}`,
        user_id: this.userUUID,
        envelope_id: targetEnvId,
        amount_e5: Math.round(amountE5),
        txn_type: txnType,
        bank_name: bankName,
        country_iso2: 'IN',
        created_at: nowIso
      };
      this.mockTransactions.unshift(newTxn);
      this.notifyApiResult({
        endpoint: '/transaction',
        method: 'POST',
        statusCode: '200 OK (DEMO)',
        type: 'success',
        title: 'Transaction Recorded (Demo)',
        message: `Created ₹${(Math.round(amountE5)/100000).toLocaleString()} ${txnType} in demo store`,
        isMock: true
      });
      return newTxn;
    }
    return await this.request<Transaction>('/transaction', {
      method: 'POST',
      body: JSON.stringify({
        user_id: this.userUUID,
        amount_e5: Math.round(amountE5),
        txn_type: txnType,
        bank_name: bankName,
        envelope_id: targetEnvId,
        country_iso2: 'IN'
      })
    });
  }

  async updateTransaction(
    id: string,
    amountE5: number,
    txnType: string,
    bankName: string,
    envelopeId?: string | null
  ): Promise<Transaction> {
    let targetEnvelopeId = envelopeId || null;
    if (!targetEnvelopeId) {
      targetEnvelopeId = await this.getSystemEnvelopeId();
    }
    const roundedAmount = Math.round(amountE5);

    if (this.useMock) {
      const idx = this.mockTransactions.findIndex((t) => t.id === id);
      if (idx !== -1) {
        this.mockTransactions[idx] = {
          ...this.mockTransactions[idx],
          amount_e5: roundedAmount,
          txn_type: txnType,
          bank_name: bankName,
          envelope_id: targetEnvelopeId
        };
        this.clearEnvelopeCache();
        this.notifyApiResult({
          endpoint: '/transaction',
          method: 'PUT',
          statusCode: '200 OK (DEMO)',
          type: 'success',
          title: 'Transaction Updated (Demo)',
          message: `Updated transaction #${id.slice(-4)} in demo store`,
          isMock: true
        });
        return this.mockTransactions[idx];
      }
      throw new Error('Transaction not found in mock store');
    }

    const updated = await this.request<Transaction>('/transaction', {
      method: 'PUT',
      body: JSON.stringify({
        id,
        user_id: this.userUUID,
        amount_e5: roundedAmount,
        txn_type: txnType,
        bank_name: bankName,
        envelope_id: targetEnvelopeId,
        country_iso2: 'IN'
      })
    });
    this.clearEnvelopeCache();
    return updated;
  }

  async deleteTransaction(id: string): Promise<void> {
    this.clearEnvelopeCache();
    if (this.useMock) {
      this.mockTransactions = this.mockTransactions.filter((t) => t.id !== id);
      this.notifyApiResult({
        endpoint: `/transaction?uuid=${id}`,
        method: 'DELETE',
        statusCode: '200 OK (DEMO)',
        type: 'success',
        title: 'Transaction Deleted (Demo)',
        message: `Removed transaction #${id.slice(-4)} from demo store`,
        isMock: true
      });
      return;
    }

    await this.request(`/transaction?uuid=${id}`, {
      method: 'DELETE'
    });
  }


  async getActiveAllocations(): Promise<Allocation[]> {
    if (this.useMock) return this.mockAllocations;
    const res = await this.request<Allocation[]>(`/allocations/active?user_uuid=${this.userUUID}`, { method: 'GET' });
    return Array.isArray(res) ? res : [];
  }

  async createAllocation(envelopeId: string, allocatedAmountE5: number): Promise<Allocation> {
    this.clearEnvelopeCache();
    const nowIso = new Date().toISOString();
    const hundredYearsLaterIso = new Date(Date.now() + 100 * 365 * 86400000).toISOString();

    if (this.useMock) {
      const existingIdx = this.mockAllocations.findIndex(a => a.envelope_id === envelopeId);
      if (existingIdx >= 0) {
        this.mockAllocations[existingIdx].allocated_amount_e5 += Math.round(allocatedAmountE5);
        return this.mockAllocations[existingIdx];
      } else {
        const newAlloc: Allocation = {
          id: `alloc-${Date.now()}`,
          envelope_id: envelopeId,
          allocated_amount_e5: Math.round(allocatedAmountE5),
          start_date: nowIso,
          end_date: hundredYearsLaterIso,
          created_at: nowIso
        };
        this.mockAllocations.push(newAlloc);
        return newAlloc;
      }
    }
    return await this.request<Allocation>('/allocation', {
      method: 'POST',
      body: JSON.stringify({
        envelope_id: envelopeId,
        allocated_amount_e5: Math.round(allocatedAmountE5),
        start_date: nowIso,
        end_date: hundredYearsLaterIso
      })
    });
  }

  async getActiveCategories(): Promise<ActiveCategory[]> {
    if (this.useMock) {
      const mockCategoryNames: Record<string, string> = {
        'env-sys-01': 'Unallocated Budget',
        'env-rent-02': 'House Rent & Housing',
        'env-groceries-03': 'Groceries & Supplies',
        'env-dining-04': 'Dining Out & Food',
        'env-emergency-05': 'Emergency Savings Pool'
      };

      return this.mockAllocations.map((alloc) => {
        const env = this.mockEnvelopes.find((e) => e.id === alloc.envelope_id);
        const name = (env && env.name) || mockCategoryNames[alloc.envelope_id] || (env ? env.id : 'General Category');
        return {
          name,
          allocated_amount_e5: alloc.allocated_amount_e5,
          is_system: env ? env.is_system : false,
          currency: env ? env.country_iso2 : 'IN',
          cadence: env ? env.cadence : 'monthly',
          envelope_id: alloc.envelope_id
        };
      });
    }

    if (this.categoriesCache && Date.now() - this.categoriesCache.timestamp < this.cacheTTLMs) {
      return this.categoriesCache.data;
    }

    try {
      const res = await this.request<ActiveCategory[]>(`/api/get-active-categories?user_uuid=${this.userUUID}`, { method: 'GET' });
      const result = Array.isArray(res) ? res : [];
      this.categoriesCache = { data: result, timestamp: Date.now() };
      return result;
    } catch (err) {
      console.warn('[Penne API] /api/get-active-categories failed, returning empty list', err);
      return [];
    }
  }
}

export const api = new PenneApiClient();
