// src/api/auth.ts
// Matches auth.py routes exactly:
//   POST /auth/register
//   POST /auth/login
//   POST /auth/refresh        (jwt refresh token required)
//   GET  /auth/me             (jwt required)
//   PUT  /auth/update-profile (jwt required)
//   PUT  /auth/change-password (jwt required)

import api from '../utils/api';

// ── Types matching backend User.to_dict() ─────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at: string;
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

// ── Response shapes from auth.py ──────────────────────────────────────────────

export interface AuthTokenResponse {
  success: boolean;
  message: string;
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

// ── Token helpers ─────────────────────────────────────────────────────────────

export const tokenStorage = {
  set: (accessToken: string, refreshToken: string, user: AuthUser) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('auth_user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  },
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    delete api.defaults.headers.common['Authorization'];
  },
  getAccessToken: (): string | null => localStorage.getItem('access_token'),
  getRefreshToken: (): string | null => localStorage.getItem('refresh_token'),
  getUser: (): AuthUser | null => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') ?? 'null');
    } catch {
      return null;
    }
  },
  restore: () => {
    // Call this on app init to re-attach the Authorization header if token exists
    const token = localStorage.getItem('access_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },
};

// ── API ───────────────────────────────────────────────────────────────────────

export const authAPI = {

  /**
   * POST /auth/register
   * Required: name, email, password
   * Optional: phone
   * Returns: access_token, refresh_token, user
   */
  register: async (data: RegisterData): Promise<AuthTokenResponse> => {
    const response = await api.post('/auth/register', data);
    const result: AuthTokenResponse = response.data;
    if (result.success && result.access_token) {
      tokenStorage.set(result.access_token, result.refresh_token, result.user);
    }
    return result;
  },

  /**
   * POST /auth/login
   * Required: email, password
   * Returns: access_token, refresh_token, user
   */
  login: async (credentials: LoginCredentials): Promise<AuthTokenResponse> => {
    const response = await api.post('/auth/login', credentials);
    const result: AuthTokenResponse = response.data;
    if (result.success && result.access_token) {
      tokenStorage.set(result.access_token, result.refresh_token, result.user);
    }
    return result;
  },

  /**
   * POST /auth/refresh
   * Requires refresh token in Authorization header
   * Returns: new access_token
   */
  refresh: async (): Promise<string | null> => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return null;
    try {
      const response = await api.post(
        '/auth/refresh',
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      );
      const { access_token } = response.data;
      if (access_token) {
        localStorage.setItem('access_token', access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        return access_token;
      }
      return null;
    } catch {
      tokenStorage.clear();
      return null;
    }
  },

  /**
   * GET /auth/me
   * JWT required — returns current user from token identity
   */
  getMe: async (): Promise<AuthUser> => {
    const response = await api.get('/auth/me');
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  /**
   * PUT /auth/update-profile
   * JWT required — update name and/or phone
   */
  updateProfile: async (data: UpdateProfileData): Promise<AuthUser> => {
    const response = await api.put('/auth/update-profile', data);
    const user = response.data?.data ?? response.data;
    // Update cached user in localStorage
    const current = tokenStorage.getUser();
    if (current) {
      tokenStorage.set(
        tokenStorage.getAccessToken()!,
        tokenStorage.getRefreshToken()!,
        { ...current, ...user }
      );
    }
    return user;
  },

  /**
   * PUT /auth/change-password
   * JWT required — requires current_password + new_password
   */
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await api.put('/auth/change-password', data);
  },

  /**
   * Client-side logout — clears tokens, no backend endpoint needed
   * (auth.py has no /logout route — tokens are stateless JWTs)
   */
  logout: () => {
    tokenStorage.clear();
  },

  /** Returns true if a valid token exists in localStorage */
  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken();
  },
};