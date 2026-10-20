import { AuthSession, AuthUser, PlanDay, PulseUserStats, Routine, Settings, SyncPayload, SyncResponse, WorkoutSession } from '../types';

const DEFAULT_GATEWAY_URL = 'http://localhost:8080';

export const GATEWAY_BASE = (
  (import.meta as any).env?.VITE_GATEWAY_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined'
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8080'
      : window.location.origin
    : DEFAULT_GATEWAY_URL)
).replace(/\/+$/, '');

const AUTH_STORAGE_KEY = 'pulse_auth_session';
const BACKUP_STORAGE_KEY = 'pulse_pre_auth_emergency_backup_v1';

export class PulseApiService {
  private token: string | null = null;
  private userUUID: string | null = null;

  constructor() {
    this.restoreSession();
    this.ensureSafetyBackup();
  }

  /**
   * Safety snapshot: Guarantees user data is NEVER lost.
   * If local routines/sessions exist, snapshots them before any auth operations.
   */
  public ensureSafetyBackup(): void {
    try {
      if (typeof window === 'undefined') return;
      if (localStorage.getItem(BACKUP_STORAGE_KEY)) return;

      const snapshot: Record<string, string | null> = {
        routines: localStorage.getItem('pulse_routines_v3'),
        plan: localStorage.getItem('pulse_plan_v3'),
        sessions: localStorage.getItem('pulse_sessions_v4'),
        settings: localStorage.getItem('pulse_settings_v3'),
        skipped: localStorage.getItem('pulse_skipped_v3'),
        timestamp: new Date().toISOString(),
      };

      if (snapshot.sessions || snapshot.routines) {
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(snapshot));
      }
    } catch (e) {
      console.warn('[PulseAPI] Emergency snapshot failed:', e);
    }
  }

  public getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  public restoreSession(): AuthSession | null {
    const session = this.getSession();
    if (session) {
      this.token = session.token;
      this.userUUID = session.userUUID;
    }
    return session;
  }

  public saveSession(session: AuthSession): void {
    this.token = session.token;
    this.userUUID = session.userUUID;
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('[PulseAPI] Failed to save session:', e);
    }
  }

  public clearSession(): void {
    this.token = null;
    this.userUUID = null;
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      // NOTE: We deliberately do NOT remove workout routines/sessions!
      // Existing data is kept safe in browser localStorage for offline/guest continuity.
    } catch (e) {
      console.error('[PulseAPI] Failed to clear session:', e);
    }
  }

  private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '1',
      ...extraHeaders,
    };

    if (this.userUUID) {
      headers['x-user-uuid'] = this.userUUID;
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * User Signup via Pulse Service (/api/v1/pulse/auth/signup)
   */
  public async signup(name: string, email: string, password: string): Promise<AuthSession> {
    const res = await fetch(`${GATEWAY_BASE}/api/v1/pulse/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '1',
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = 'Signup failed';
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.error || errorMsg;
      } catch {
        errorMsg = errText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const token = data.token || data.user_uuid;
    const userUUID = data.user_uuid || (data.user && data.user.user_uuid) || token;
    const userName = (data.user && data.user.name) || name;

    const session: AuthSession = {
      token,
      userUUID,
      name: userName,
      email,
    };

    this.saveSession(session);
    return session;
  }

  /**
   * User Login via Pulse Service (/api/v1/pulse/auth/login)
   */
  public async login(email: string, password: string): Promise<AuthSession> {
    const res = await fetch(`${GATEWAY_BASE}/api/v1/pulse/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '1',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = 'Invalid email or password';
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.error || errorMsg;
      } catch {
        errorMsg = errText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const token = data.token || data.user_uuid;
    const userUUID = data.user_uuid || (data.user && data.user.user_uuid) || token;
    const userName = (data.user && data.user.name) || email.split('@')[0];

    const session: AuthSession = {
      token,
      userUUID,
      name: userName,
      email,
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Quick token or test user login
   */
  public async loginWithToken(token: string, name = 'Athlete'): Promise<AuthSession> {
    const trimmed = token.trim();
    if (!trimmed) throw new Error('Token is required');

    let userUUID = trimmed;
    let athleteName = name;

    try {
      const userRes = await fetch(`${GATEWAY_BASE}/api/v1/pulse/user`, {
        headers: {
          'Authorization': `Bearer ${trimmed}`,
          'x-user-uuid': trimmed,
          'ngrok-skip-browser-warning': '1',
        },
      });
      if (userRes.ok) {
        const u = await userRes.json();
        if (u.user_uuid) userUUID = u.user_uuid;
        if (u.name) athleteName = u.name;
      }
    } catch {
      // Offline/fallback
    }

    const session: AuthSession = {
      token: trimmed,
      userUUID,
      name: athleteName,
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Push-Only Sync: Seamlessly syncs local frontend workouts to backend
   */
  public async pushSync(payload: SyncPayload): Promise<SyncResponse> {
    const session = this.getSession();
    const userUUID = payload.user_uuid || session?.userUUID;

    if (!userUUID) {
      throw new Error('Cannot sync: No authenticated user session found');
    }

    const headers = this.getHeaders({
      'x-user-uuid': userUUID,
    });

    const bodyData = {
      ...payload,
      user_uuid: userUUID,
      client_time: payload.client_time || Date.now(),
    };

    const res = await fetch(`${GATEWAY_BASE}/api/v1/pulse/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Sync failed (${res.status}): ${errText}`);
    }

    return (await res.json()) as SyncResponse;
  }

  /**
   * Fetch user workout stats from backend
   */
  public async getUserStats(userUUID?: string): Promise<PulseUserStats> {
    const session = this.getSession();
    const targetUUID = userUUID || session?.userUUID;
    if (!targetUUID) {
      throw new Error('Target user UUID is required');
    }

    const headers = this.getHeaders({
      'x-user-uuid': targetUUID,
    });

    const res = await fetch(`${GATEWAY_BASE}/api/v1/pulse/stats?user_uuid=${encodeURIComponent(targetUUID)}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stats: ${res.status}`);
    }

    return (await res.json()) as PulseUserStats;
  }

  /**
   * Check whether this user has already completed the initial one-time backfill
   */
  public isBackfilled(userUUID: string): boolean {
    try {
      return localStorage.getItem(`pulse_backfill_done_${userUUID}`) === 'true';
    } catch {
      return false;
    }
  }

  public markBackfillDone(userUUID: string): void {
    try {
      localStorage.setItem(`pulse_backfill_done_${userUUID}`, 'true');
    } catch {
      // ignore
    }
  }
}

export const pulseApi = new PulseApiService();
