import {
  User,
  Transaction,
  EnvelopeGroup,
  Envelope,
  Allocation,
  AuthResponse,
  AuthSession,
  ActiveCategory,
  DashboardSummary,
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
    payment_method: 'bank_account',
    country_iso2: 'IN',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'txn-02',
    user_id: TEST_USER_UUID,
    envelope_id: 'env-rent-02',
    amount_e5: amountToE5(25000),
    txn_type: 'debit',
    payment_method: 'bank_card',
    country_iso2: 'IN',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'txn-03',
    user_id: TEST_USER_UUID,
    envelope_id: 'env-groceries-03',
    amount_e5: amountToE5(3450),
    txn_type: 'debit',
    payment_method: 'bank_card',
    country_iso2: 'IN',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'txn-04',
    user_id: TEST_USER_UUID,
    envelope_id: 'env-sys-01',
    amount_e5: amountToE5(10000),
    txn_type: 'transfer',
    payment_method: 'bank_account',
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

  // In-memory caching removed in favor of TanStack React Query authoritative cache


  private loadMockStore<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveMockStore<T>(key: string, data: T) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  constructor() {
    this.token = localStorage.getItem('penne_auth_token');
    const savedUserUUID = localStorage.getItem('penne_user_uuid');
    if (savedUserUUID) {
      this.userUUID = savedUserUUID;
    } else {
      const sessions = this.getCachedSessions();
      if (sessions.length > 0 && sessions[0].user_uuid) {
        this.userUUID = sessions[0].user_uuid;
      }
    }
    this.mockGroups = this.loadMockStore('penne_mock_groups', [...INITIAL_GROUPS]);
    this.mockEnvelopes = this.loadMockStore('penne_mock_envelopes', [...INITIAL_ENVELOPES]);
    this.mockAllocations = this.loadMockStore('penne_mock_allocations', [...INITIAL_ALLOCATIONS]);
    this.mockTransactions = this.loadMockStore('penne_mock_transactions', [...INITIAL_TRANSACTIONS]);
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
    // No-op: caching, invalidation, and persistence are managed by TanStack React Query
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

  public getUserUUID(): string {
    return this.userUUID || TEST_USER_UUID;
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

  /**
   * Simulates realistic staggered network delays when running in demo/mock mode
   */
  private async simulateDemoDelay(baseMs: number = 50, varianceMs: number = 20): Promise<void> {
    if (!this.useMock) return;
    const jitter = Math.round(Math.random() * varianceMs * 2 - varianceMs);
    const delay = Math.max(10, baseMs + jitter);
    await new Promise((resolve) => setTimeout(resolve, delay));
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
    localStorage.setItem('penne_user_uuid', userUuid);
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
    localStorage.removeItem('penne_user_uuid');
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

    // Explicitly prevent browser, WebKit, and intermediary HTTP caching for GET queries
    if (method === 'GET') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
    }

    const REQUEST_TIMEOUT_MS = 20000; // 20 seconds maximum per request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    let requestUrl = `${API_BASE_URL}${endpoint}`;
    if (method === 'GET' && !requestUrl.includes('_t=')) {
      const sep = requestUrl.includes('?') ? '&' : '?';
      requestUrl += `${sep}_t=${Date.now()}`;
    }

    console.log(`[Penne API Request] ${method} ${requestUrl}`);

    const fetchOptions: RequestInit = {
      ...options,
      headers,
      signal: controller.signal
    };

    if (method === 'GET') {
      fetchOptions.cache = 'no-store';
    }

    let res: Response;
    try {
      res = await fetch(requestUrl, fetchOptions);
    } catch (networkErr: any) {
      clearTimeout(timeoutId);
      if (networkErr.name === 'AbortError' || controller.signal.aborted) {
        console.warn(`[Penne API Timeout] Request to ${API_BASE_URL}${endpoint} timed out after 20s`);
        this.notifyApiResult({
          endpoint,
          method,
          statusCode: 'TIMEOUT',
          type: 'warning',
          title: 'Request Timed Out (20s)',
          message: `Request to ${endpoint} timed out after 20 seconds.`,
          isMock: false
        });
        const timeoutError: any = new Error(`Request to ${endpoint} timed out after 20 seconds.`);
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }

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
    } finally {
      clearTimeout(timeoutId);
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
    if (this.useMock) {
      await this.simulateDemoDelay(350, 80);
      return this.mockUser;
    }
    if (!this.token) {
      throw new Error('No active auth session');
    }
    const res = await this.request<User>('/user', { method: 'GET' });
    if (res && res.uuid) {
      this.userUUID = res.uuid;
      localStorage.setItem('penne_user_uuid', res.uuid);
      return res;
    }
    return { uuid: this.userUUID, name: 'Penne User', created_at: new Date().toISOString() };
  }

  async getEnvelopeGroups(): Promise<EnvelopeGroup[]> {
    if (this.useMock) {
      await this.simulateDemoDelay(50, 20);
      return this.mockGroups;
    }
    try {
      const res = await this.request<EnvelopeGroup[]>(`/envelope-groups?user_uuid=${this.userUUID}`, { method: 'GET' });
      return Array.isArray(res) ? res : [];
    } catch (err) {
      if (this.isUnauthorizedError(err)) throw err;
      console.warn('[Penne API] GET /envelope-groups backend endpoint error', err);
      return [];
    }
  }

  async createEnvelopeGroup(name: string): Promise<EnvelopeGroup> {
    this.clearEnvelopeCache();
    const nowIso = new Date().toISOString();
    if (this.useMock) {
      await this.simulateDemoDelay(700, 120);
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
    if (this.useMock) {
      await this.simulateDemoDelay(50, 20);
      return this.mockEnvelopes;
    }
    const res = await this.request<Envelope[]>(`/envelopes?user_uuid=${this.userUUID}`, { method: 'GET' });
    return Array.isArray(res) ? res : [];
  }

  async createEnvelope(envelopeGroupId: string, targetAmountE5: number, cadence: string = 'monthly', name?: string): Promise<Envelope> {
    this.clearEnvelopeCache();
    const nowIso = new Date().toISOString();
    if (this.useMock) {
      await this.simulateDemoDelay(800, 150);
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

  async updateEnvelopeGroup(id: string, name: string): Promise<EnvelopeGroup> {
    this.clearEnvelopeCache();
    if (this.useMock) {
      await this.simulateDemoDelay(650, 120);
      const idx = this.mockGroups.findIndex((g: EnvelopeGroup) => g.id === id);
      if (idx !== -1) {
        this.mockGroups[idx] = { ...this.mockGroups[idx], name };
        return this.mockGroups[idx];
      }
    }
    return await this.request<EnvelopeGroup>('/envelope-group', {
      method: 'PUT',
      body: JSON.stringify({
        id,
        user_uuid: this.userUUID,
        name
      })
    });
  }

  async deleteEnvelopeGroup(id: string): Promise<void> {
    this.clearEnvelopeCache();
    if (this.useMock) {
      await this.simulateDemoDelay(600, 100);
      this.mockGroups = this.mockGroups.filter((g: EnvelopeGroup) => g.id !== id);
      return;
    }
    await this.request<void>(`/envelope-group?id=${id}`, { method: 'DELETE' });
  }

  async updateEnvelope(
    id: string,
    name: string,
    targetAmountE5: number,
    cadence: string = 'monthly',
    envelopeGroupId?: string
  ): Promise<Envelope> {
    this.clearEnvelopeCache();
    if (this.useMock) {
      await this.simulateDemoDelay(700, 120);
      const idx = this.mockEnvelopes.findIndex((e) => e.id === id);
      if (idx !== -1) {
        const updated: Envelope = {
          ...this.mockEnvelopes[idx],
          name,
          target_amount_e5: Math.round(targetAmountE5),
          cadence,
          ...(envelopeGroupId ? { envelope_group_id: envelopeGroupId } : {})
        };
        this.mockEnvelopes[idx] = updated;
        return updated;
      }
    }

    const payload: Record<string, any> = {
      id,
      user_uuid: this.userUUID,
      name,
      target_amount_e5: Math.round(targetAmountE5),
      cadence,
      country_iso2: 'IN'
    };
    if (envelopeGroupId) {
      payload.envelope_group_id = envelopeGroupId;
    }

    return await this.request<Envelope>('/envelope', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async deleteEnvelope(id: string): Promise<void> {
    this.clearEnvelopeCache();
    if (this.useMock) {
      await this.simulateDemoDelay(600, 100);
      this.mockEnvelopes = this.mockEnvelopes.filter((e) => e.id !== id);
      return;
    }
    await this.request<void>(`/envelope?id=${id}`, { method: 'DELETE' });
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

  async getTransactions(
    userUuid?: string,
    limit?: number,
    lastTransactionCreatedAt?: string,
    lastTransactionID?: string
  ): Promise<Transaction[]> {
    if (this.useMock) {
      await this.simulateDemoDelay(1050, 200);
      let filtered = [...this.mockTransactions];
      if (lastTransactionCreatedAt && lastTransactionID) {
        const cursorTime = new Date(lastTransactionCreatedAt).getTime();
        filtered = filtered.filter((t) => {
          const tTime = t.created_at ? new Date(t.created_at).getTime() : 0;
          if (tTime < cursorTime) return true;
          if (tTime === cursorTime && t.id < lastTransactionID) return true;
          return false;
        });
      }
      if (limit && limit > 0) {
        return filtered.slice(0, limit);
      }
      return filtered;
    }

    const targetUuid = userUuid || this.userUUID;
    let url = `/transactions?user_uuid=${targetUuid}`;
    const fetchLimit = limit && limit > 0 ? limit : 50;
    url += `&limit=${fetchLimit}`;
    if (lastTransactionCreatedAt) {
      url += `&lastTransactionCreatedAt=${encodeURIComponent(lastTransactionCreatedAt)}`;
    }
    if (lastTransactionID) {
      url += `&lastTransactionID=${encodeURIComponent(lastTransactionID)}`;
    }

    const res = await this.request<Transaction[]>(url, { method: 'GET' });
    const list = Array.isArray(res) ? res : [];
    return list.map((t) => {
      if (!t.created_at || t.created_at.startsWith('0001-01-01')) {
        return { ...t, created_at: new Date().toISOString() };
      }
      return t;
    });
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

  async createTransaction(
    amountE5: number,
    txnType: string,
    paymentMethod: string,
    envelopeId?: string | null,
    createdAt?: string
  ): Promise<Transaction> {
    this.clearEnvelopeCache();
    let targetEnvId = envelopeId || null;
    if (!targetEnvId) {
      targetEnvId = await this.getSystemEnvelopeId();
    }
    const nowIso = createdAt || new Date().toISOString();
    if (this.useMock) {
      // Simulate realistic backend round-trip delay of ~1.2s to showcase instant optimistic UI snappiness
      await this.simulateDemoDelay(1200, 200);
      const newTxn: Transaction = {
        id: `txn-${Date.now()}`,
        user_id: this.userUUID,
        envelope_id: targetEnvId,
        amount_e5: Math.round(amountE5),
        txn_type: txnType,
        payment_method: paymentMethod,
        country_iso2: 'IN',
        created_at: nowIso
      };
      this.mockTransactions.unshift(newTxn);
      this.saveMockStore('penne_mock_transactions', this.mockTransactions);
      this.notifyApiResult({
        endpoint: '/transaction',
        method: 'POST',
        statusCode: '200 OK (DEMO)',
        type: 'success',
        title: 'Transaction Recorded (Demo)',
        message: `Created ₹${(Math.round(amountE5) / 100000).toLocaleString()} ${txnType} in demo store`,
        isMock: true
      });
      return newTxn;
    }
    const payload: Record<string, any> = {
      user_id: this.userUUID,
      amount_e5: Math.round(amountE5),
      txn_type: txnType,
      payment_method: paymentMethod,
      envelope_id: targetEnvId,
      country_iso2: 'IN'
    };
    if (createdAt) {
      payload.created_at = createdAt;
    }
    const created = await this.request<Transaction>('/transaction', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const result: Transaction = {
      id: (created && created.id) ? created.id : `txn-${Date.now()}`,
      user_id: (created && created.user_id) ? created.user_id : this.userUUID,
      amount_e5: (created && typeof created.amount_e5 === 'number') ? created.amount_e5 : Math.round(amountE5),
      txn_type: (created && created.txn_type) ? created.txn_type : txnType,
      payment_method: (created && created.payment_method) ? created.payment_method : paymentMethod,
      envelope_id: (created && created.envelope_id) ? created.envelope_id : targetEnvId,
      country_iso2: (created && created.country_iso2) ? created.country_iso2 : 'IN',
      created_at: (created && created.created_at && !created.created_at.startsWith('0001-01-01')) ? created.created_at : nowIso
    };
    return result;
  }

  async updateTransaction(
    id: string,
    amountE5: number,
    txnType: string,
    paymentMethod: string,
    envelopeId?: string | null,
    existingCreatedAt?: string
  ): Promise<Transaction> {
    let targetEnvelopeId = envelopeId || null;
    if (!targetEnvelopeId) {
      targetEnvelopeId = await this.getSystemEnvelopeId();
    }
    const roundedAmount = Math.round(amountE5);

    if (this.useMock) {
      await this.simulateDemoDelay(50, 20);
      const idx = this.mockTransactions.findIndex((t) => t.id === id);
      if (idx !== -1) {
        this.mockTransactions[idx] = {
          ...this.mockTransactions[idx],
          amount_e5: roundedAmount,
          txn_type: txnType,
          payment_method: paymentMethod,
          envelope_id: targetEnvelopeId
        };
        this.saveMockStore('penne_mock_transactions', this.mockTransactions);
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
        payment_method: paymentMethod,
        envelope_id: targetEnvelopeId,
        country_iso2: 'IN'
      })
    });

    const finalCreatedAt =
      (updated && updated.created_at && !updated.created_at.startsWith('0001-01-01'))
        ? updated.created_at
        : (existingCreatedAt || new Date().toISOString());

    const result: Transaction = {
      id: (updated && updated.id) ? updated.id : id,
      user_id: (updated && updated.user_id) ? updated.user_id : this.userUUID,
      amount_e5: (updated && typeof updated.amount_e5 === 'number') ? updated.amount_e5 : roundedAmount,
      txn_type: (updated && updated.txn_type) ? updated.txn_type : txnType,
      payment_method: (updated && updated.payment_method) ? updated.payment_method : paymentMethod,
      envelope_id: (updated && updated.envelope_id) ? updated.envelope_id : targetEnvelopeId,
      country_iso2: (updated && updated.country_iso2) ? updated.country_iso2 : 'IN',
      created_at: finalCreatedAt
    };
    return result;
  }

  async deleteTransaction(id: string): Promise<void> {
    this.clearEnvelopeCache();
    if (this.useMock) {
      await this.simulateDemoDelay(700, 150);
      this.mockTransactions = this.mockTransactions.filter((t) => t.id !== id);
      this.saveMockStore('penne_mock_transactions', this.mockTransactions);
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
    if (this.useMock) {
      await this.simulateDemoDelay(650, 120);
      return this.mockAllocations;
    }
    const res = await this.request<Allocation[]>(`/allocations/active?user_uuid=${this.userUUID}`, { method: 'GET' });
    return Array.isArray(res) ? res : [];
  }

  async createAllocation(envelopeId: string, allocatedAmountE5: number): Promise<Allocation> {
    this.clearEnvelopeCache();
    const now = new Date();
    const nowIso = now.toISOString();

    if (this.useMock) {
      await this.simulateDemoDelay(750, 150);
      const existingIdx = this.mockAllocations.findIndex(a => a.envelope_id === envelopeId);
      if (existingIdx >= 0) {
        this.mockAllocations[existingIdx].allocated_amount_e5 += Math.round(allocatedAmountE5);
        return this.mockAllocations[existingIdx];
      } else {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
        const newAlloc: Allocation = {
          id: `alloc-${Date.now()}`,
          envelope_id: envelopeId,
          allocated_amount_e5: Math.round(allocatedAmountE5),
          start_date: startOfMonth,
          end_date: endOfMonth,
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
      })
    });
  }

  async updateAllocation(allocation: Allocation): Promise<Allocation> {
    this.clearEnvelopeCache();
    if (this.useMock) {
      await this.simulateDemoDelay(700, 120);
      const idx = this.mockAllocations.findIndex((a) => a.id === allocation.id || a.envelope_id === allocation.envelope_id);
      if (idx !== -1) {
        this.mockAllocations[idx] = { ...this.mockAllocations[idx], ...allocation };
        return this.mockAllocations[idx];
      }
      this.mockAllocations.push(allocation);
      return allocation;
    }
    return await this.request<Allocation>('/allocation', {
      method: 'PUT',
      body: JSON.stringify(allocation)
    });
  }

  async getActiveCategories(): Promise<ActiveCategory[]> {
    if (this.useMock) {
      await this.simulateDemoDelay(850, 150);
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
        const spentE5 = this.mockTransactions
          .filter((t) => t.envelope_id === alloc.envelope_id && t.txn_type === 'debit')
          .reduce((acc, t) => acc + (t.amount_e5 || 0), 0);
        return {
          name,
          allocated_amount_e5: alloc.allocated_amount_e5,
          spent_amount_e5: spentE5,
          is_system: env ? env.is_system : false,
          currency: env ? env.country_iso2 : 'IN',
          cadence: env ? env.cadence : 'monthly',
          envelope_id: alloc.envelope_id,
          allocation_id: alloc.id
        };
      });
    }

    try {
      const res = await this.request<ActiveCategory[]>(`/api/get-active-categories?user_uuid=${this.userUUID}`, { method: 'GET' });
      return Array.isArray(res) ? res : [];
    } catch (err) {
      console.warn('[Penne API] /api/get-active-categories failed, returning empty list', err);
      return [];
    }
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    if (this.useMock) {
      await this.simulateDemoDelay(1350, 200);
      const cardLimit = Number(localStorage.getItem('penne_limit_bank_card') || 25000);
      const bankLimit = Number(localStorage.getItem('penne_limit_bank_account') || 10000);

      const totalIncomeE5 = this.mockTransactions
        .filter((t) => t.txn_type === 'credit')
        .reduce((sum, t) => sum + (t.amount_e5 || 0), 0);

      const debitTxns = this.mockTransactions.filter((t) => t.txn_type === 'debit');

      const cardSpentE5 = debitTxns
        .filter((t) => t.payment_method === 'bank_card')
        .reduce((sum, t) => sum + (t.amount_e5 || 0), 0);

      const bankSpentE5 = debitTxns
        .filter((t) => t.payment_method !== 'bank_card')
        .reduce((sum, t) => sum + (t.amount_e5 || 0), 0);

      const totalExpenseE5 = cardSpentE5 + bankSpentE5;
      const totalRemainingE5 = totalIncomeE5 - totalExpenseE5;

      return {
        total_income_e5: totalIncomeE5,
        total_expense_e5: totalExpenseE5,
        total_remaining_e5: totalRemainingE5,
        card_spent_e5: cardSpentE5,
        card_limit_e5: amountToE5(cardLimit),
        bank_spent_e5: bankSpentE5,
        bank_limit_e5: amountToE5(bankLimit)
      };
    }

    try {
      const res = await this.request<DashboardSummary>(`/api/dashboard-summary?user_uuid=${this.userUUID}`, { method: 'GET' });
      if (res && typeof res.total_expense_e5 === 'number') {
        return res;
      }
      throw new Error('Invalid summary response');
    } catch (err) {
      console.warn('[Penne API] GET /api/dashboard-summary failed, calculating fallback summary', err);
      const cardLimit = Number(localStorage.getItem('penne_limit_bank_card') || 25000);
      const bankLimit = Number(localStorage.getItem('penne_limit_bank_account') || 10000);

      const txns = await this.getTransactions();
      const totalIncomeE5 = txns
        .filter((t) => t.txn_type === 'credit')
        .reduce((sum, t) => sum + (t.amount_e5 || 0), 0);

      const debitTxns = txns.filter((t) => t.txn_type === 'debit');

      const cardSpentE5 = debitTxns
        .filter((t) => t.payment_method === 'bank_card')
        .reduce((sum, t) => sum + (t.amount_e5 || 0), 0);

      const bankSpentE5 = debitTxns
        .filter((t) => t.payment_method !== 'bank_card')
        .reduce((sum, t) => sum + (t.amount_e5 || 0), 0);

      const totalExpenseE5 = cardSpentE5 + bankSpentE5;

      return {
        total_income_e5: totalIncomeE5,
        total_expense_e5: totalExpenseE5,
        total_remaining_e5: totalIncomeE5 - totalExpenseE5,
        card_spent_e5: cardSpentE5,
        card_limit_e5: amountToE5(cardLimit),
        bank_spent_e5: bankSpentE5,
        bank_limit_e5: amountToE5(bankLimit)
      };
    }
  }
}

export const api = new PenneApiClient();

// ─────────────────────────────────────────────────────────────────────────────
// Wishlist API Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  user_uuid: string;
  title: string;
  target_amount_e5: number;
  saved_amount_e5: number;
  priority: number;   // 1–5
  urgency: number;    // 1–5
  item_type: string;  // 'want' | 'need' | 'investment'
  status: string;     // 'active' | 'fulfilled' | 'paused'
  target_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemForecast {
  item_id: string;
  item_title: string;
  target_amount_e5: number;
  saved_amount_e5: number;
  remaining_amount_e5: number;
  priority: number;
  urgency: number;
  weight: number;
  monthly_contribution_e5: number;
  estimated_months: number;
  estimated_date?: string;
  progress_percentage: number;
}

export interface WishlistForecastSummary {
  cycle_start_date: string;
  cycle_end_date: string;
  monthly_budget_e5: number;
  cycle_expenses_e5: number;
  projected_surplus_e5: number;
  savings_rate_percent: number;
  items: ItemForecast[];
}

export interface ItemAllocationSimulation {
  item_id: string;
  item_title: string;
  allocated_e5: number;
  previous_saved_e5: number;
  new_saved_e5: number;
  target_amount_e5: number;
  is_fulfilled: boolean;
  weight: number;
}

export interface CreateWishlistItemPayload {
  title: string;
  target_amount_e5: number;
  priority: number;
  urgency: number;
  item_type: string;
  notes?: string;
  target_date?: string;
}

export interface UpdateWishlistItemPayload extends Partial<CreateWishlistItemPayload> {
  id: string;
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wishlist API Client (supports live backend with automatic demo fallback)
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_DEMO_WISHLIST_ITEMS: WishlistItem[] = [
  {
    id: 'wish-01',
    user_uuid: TEST_USER_UUID,
    title: 'Sony WH-1000XM5 Headphones',
    target_amount_e5: 2999000000, // ₹29,990
    saved_amount_e5: 1200000000,  // ₹12,000
    priority: 4,
    urgency: 3,
    item_type: 'want',
    status: 'active',
    notes: 'For deep focus and noise-free work sessions',
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'wish-02',
    user_uuid: TEST_USER_UUID,
    title: 'Standing Desk Converter',
    target_amount_e5: 1850000000, // ₹18,500
    saved_amount_e5: 1850000000,  // ₹18,500 (fulfilled)
    priority: 5,
    urgency: 4,
    item_type: 'need',
    status: 'fulfilled',
    notes: 'Ergonomic workspace health',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'wish-03',
    user_uuid: TEST_USER_UUID,
    title: 'Index Fund Lump Sum',
    target_amount_e5: 5000000000, // ₹50,000
    saved_amount_e5: 1500000000,  // ₹15,000
    priority: 3,
    urgency: 2,
    item_type: 'investment',
    status: 'active',
    notes: 'Annual portfolio top-up',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

function getMockWishlistItems(): WishlistItem[] {
  try {
    const raw = localStorage.getItem('penne_mock_wishlist');
    return raw ? JSON.parse(raw) : [...INITIAL_DEMO_WISHLIST_ITEMS];
  } catch {
    return [...INITIAL_DEMO_WISHLIST_ITEMS];
  }
}

function saveMockWishlistItems(items: WishlistItem[]) {
  try {
    localStorage.setItem('penne_mock_wishlist', JSON.stringify(items));
  } catch {
    // ignore
  }
}

function getMockBudgetSettings(): { monthlyBudgetE5: number; salaryDay: number } {
  try {
    const raw = localStorage.getItem('penne_mock_budget_settings');
    return raw ? JSON.parse(raw) : { monthlyBudgetE5: 10000000000, salaryDay: 25 }; // ₹1,00,000 default
  } catch {
    return { monthlyBudgetE5: 10000000000, salaryDay: 25 };
  }
}

function computeMockForecast(): WishlistForecastSummary {
  const items = getMockWishlistItems();
  const { monthlyBudgetE5 } = getMockBudgetSettings();
  
  // Use representative expenses (~65k) giving ~35k surplus
  const cycleExpensesE5 = 6500000000;
  const projectedSurplusE5 = Math.max(0, monthlyBudgetE5 - cycleExpensesE5);
  const savingsRate = monthlyBudgetE5 > 0 ? Math.round((projectedSurplusE5 / monthlyBudgetE5) * 100) : 0;

  const activeItems = items.filter((i) => i.status !== 'fulfilled' && (i.target_amount_e5 - i.saved_amount_e5) > 0);
  const totalWeight = activeItems.reduce((acc, i) => acc + (i.priority * i.urgency), 0) || 1;

  const itemForecasts: ItemForecast[] = items.map((item) => {
    const remaining = Math.max(0, item.target_amount_e5 - item.saved_amount_e5);
    const weight = item.priority * item.urgency;
    const share = remaining > 0 ? weight / totalWeight : 0;
    const monthlyContribution = Math.round(projectedSurplusE5 * share);
    const months = monthlyContribution > 0 ? remaining / monthlyContribution : 0;
    const progress = item.target_amount_e5 > 0 ? (item.saved_amount_e5 / item.target_amount_e5) * 100 : 0;

    return {
      item_id: item.id,
      item_title: item.title,
      target_amount_e5: item.target_amount_e5,
      saved_amount_e5: item.saved_amount_e5,
      remaining_amount_e5: remaining,
      priority: item.priority,
      urgency: item.urgency,
      weight,
      monthly_contribution_e5: monthlyContribution,
      estimated_months: Math.round(months * 10) / 10,
      progress_percentage: Math.min(100, Math.round(progress)),
    };
  });

  const now = new Date();
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  return {
    cycle_start_date: cycleStart,
    cycle_end_date: cycleEnd,
    monthly_budget_e5: monthlyBudgetE5,
    cycle_expenses_e5: cycleExpensesE5,
    projected_surplus_e5: projectedSurplusE5,
    savings_rate_percent: savingsRate,
    items: itemForecasts,
  };
}

async function wishlistFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = api.getToken() || localStorage.getItem('penne_auth_token');
  const userUUID = api.getUserUUID() || localStorage.getItem('penne_user_uuid');
  const method = (options.method || 'GET').toUpperCase();

  // Append user_uuid and cache-bust as query params
  const sep = path.includes('?') ? '&' : '?';
  let queryPath = `${path}${userUUID ? `${sep}user_uuid=${userUUID}` : ''}`;
  if (method === 'GET' && !queryPath.includes('_t=')) {
    const qSep = queryPath.includes('?') ? '&' : '?';
    queryPath += `${qSep}_t=${Date.now()}`;
  }

  const fullUrl = `${API_BASE_URL}${queryPath}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (method === 'GET') {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    headers['Pragma'] = 'no-cache';
  }

  let res: Response;
  try {
    res = await fetch(fullUrl, { ...options, headers });
  } catch (netErr: any) {
    throw new Error('BACKEND_UNAVAILABLE');
  }

  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    throw new Error('BACKEND_UNAVAILABLE');
  }

  const isHtml = rawText.trim().startsWith('<') || res.headers.get('content-type')?.includes('text/html');

  if (!res.ok || isHtml) {
    throw new Error('BACKEND_UNAVAILABLE');
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error('BACKEND_UNAVAILABLE');
  }
}

export const wishlistApi = {
  async getWishlists(): Promise<WishlistForecastSummary> {
    try {
      return await wishlistFetch<WishlistForecastSummary>('/wishlists');
    } catch {
      return computeMockForecast();
    }
  },
  async getForecast(): Promise<WishlistForecastSummary> {
    try {
      return await wishlistFetch<WishlistForecastSummary>('/wishlist/forecast');
    } catch {
      return computeMockForecast();
    }
  },
  async createItem(payload: CreateWishlistItemPayload): Promise<WishlistItem> {
    try {
      return await wishlistFetch<WishlistItem>('/wishlist', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const items = getMockWishlistItems();
      const newItem: WishlistItem = {
        id: `wish-${Date.now()}`,
        user_uuid: api.getUserUUID(),
        title: payload.title,
        target_amount_e5: payload.target_amount_e5,
        saved_amount_e5: 0,
        priority: payload.priority,
        urgency: payload.urgency,
        item_type: payload.item_type,
        status: 'active',
        notes: payload.notes,
        target_date: payload.target_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      items.push(newItem);
      saveMockWishlistItems(items);
      return newItem;
    }
  },
  async updateItem(payload: UpdateWishlistItemPayload): Promise<{ message: string }> {
    try {
      return await wishlistFetch<{ message: string }>(`/wishlist?id=${payload.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } catch {
      const items = getMockWishlistItems();
      const idx = items.findIndex((i) => i.id === payload.id);
      if (idx >= 0) {
        items[idx] = {
          ...items[idx],
          ...payload,
          updated_at: new Date().toISOString(),
        };
        saveMockWishlistItems(items);
      }
      return { message: 'Item updated successfully' };
    }
  },
  async deleteItem(itemId: string): Promise<{ message: string }> {
    try {
      return await wishlistFetch<{ message: string }>(`/wishlist?id=${itemId}`, {
        method: 'DELETE',
      });
    } catch {
      const items = getMockWishlistItems().filter((i) => i.id !== itemId);
      saveMockWishlistItems(items);
      return { message: 'Item deleted successfully' };
    }
  },
  async distributeSurplus(): Promise<{ message: string; allocations: ItemAllocationSimulation[] }> {
    try {
      return await wishlistFetch<{ message: string; allocations: ItemAllocationSimulation[] }>('/wishlist/distribute', {
        method: 'POST',
      });
    } catch {
      const items = getMockWishlistItems();
      const forecast = computeMockForecast();
      const allocations: ItemAllocationSimulation[] = [];
      let surplus = forecast.projected_surplus_e5;

      for (const f of forecast.items) {
        if (f.remaining_amount_e5 <= 0 || surplus <= 0) continue;
        const alloc = Math.min(surplus, f.monthly_contribution_e5 || f.remaining_amount_e5);
        surplus -= alloc;
        const itemIdx = items.findIndex((i) => i.id === f.item_id);
        if (itemIdx >= 0) {
          const prev = items[itemIdx].saved_amount_e5;
          const next = prev + alloc;
          items[itemIdx].saved_amount_e5 = next;
          if (next >= items[itemIdx].target_amount_e5) {
            items[itemIdx].status = 'fulfilled';
          }
          allocations.push({
            item_id: f.item_id,
            item_title: f.item_title,
            allocated_e5: alloc,
            previous_saved_e5: prev,
            new_saved_e5: next,
            target_amount_e5: f.target_amount_e5,
            is_fulfilled: next >= f.target_amount_e5,
            weight: f.weight,
          });
        }
      }
      saveMockWishlistItems(items);
      return { message: 'Surplus distributed successfully (demo)', allocations };
    }
  },
  async updateBudgetSettings(monthlyBudgetE5: number, salaryDay: number): Promise<{ message: string }> {
    try {
      return await wishlistFetch<{ message: string }>('/user/budget-settings', {
        method: 'PUT',
        body: JSON.stringify({ monthly_budget_e5: monthlyBudgetE5, salary_day: salaryDay }),
      });
    } catch {
      try {
        localStorage.setItem('penne_mock_budget_settings', JSON.stringify({ monthlyBudgetE5, salaryDay }));
      } catch {
        // ignore
      }
      return { message: 'Budget settings updated successfully' };
    }
  },
};

// Helpers
export function e5ToINR(e5: number): string {
  const amount = e5 / 100000;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function inrToE5(inr: number): number {
  return Math.round(inr * 100000);
}

export function formatWishlistMonths(months: number): string {
  if (months <= 0) return 'Fulfilled';
  if (months < 1) return `~${Math.round(months * 30)}d`;
  if (months < 12) return `~${Math.ceil(months)}mo`;
  const yrs = Math.floor(months / 12);
  const mo = Math.ceil(months % 12);
  return mo > 0 ? `~${yrs}y ${mo}mo` : `~${yrs}y`;
}

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Critical',
};
export const URGENCY_LABELS: Record<number, string> = {
  1: 'Whenever', 2: 'Eventually', 3: 'This Year', 4: 'This Quarter', 5: 'This Month',
};


