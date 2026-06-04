/**
 * Unified session for all three portals (admin / team / client).
 *
 * One ``POST /auth/login`` endpoint on the backend, one set of localStorage
 * keys here. The user's ``role`` field decides which dashboard they land on
 * and what they can read or write.
 */

import { useEffect, useReducer } from 'react';
import { api, ApiError } from './api';

const ACCESS_KEY = 'zenova.session.access_token';
const REFRESH_KEY = 'zenova.session.refresh_token';
const USER_KEY = 'zenova.session.user';

// Legacy admin-only keys, kept so existing logins survive the migration.
const LEGACY_ACCESS_KEY = 'zenova.admin.access_token';
const LEGACY_REFRESH_KEY = 'zenova.admin.refresh_token';
const LEGACY_USER_KEY = 'zenova.admin.user';

export type Role = 'admin' | 'team' | 'client';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
}

interface LoginResponse {
  user: SessionUser;
  tokens: TokenPair;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// ---------------------------------------------------------------------------
// Storage helpers (one-time migration from the old admin-only keys)
// ---------------------------------------------------------------------------

function migrateLegacy() {
  if (!isBrowser()) return;
  const ls = window.localStorage;
  const legacyAccess = ls.getItem(LEGACY_ACCESS_KEY);
  if (legacyAccess && !ls.getItem(ACCESS_KEY)) {
    ls.setItem(ACCESS_KEY, legacyAccess);
    const refresh = ls.getItem(LEGACY_REFRESH_KEY);
    if (refresh) ls.setItem(REFRESH_KEY, refresh);
    const user = ls.getItem(LEGACY_USER_KEY);
    if (user) ls.setItem(USER_KEY, user);
  }
  ls.removeItem(LEGACY_ACCESS_KEY);
  ls.removeItem(LEGACY_REFRESH_KEY);
  ls.removeItem(LEGACY_USER_KEY);
}

migrateLegacy();

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): SessionUser | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function setTokens(tokens: TokenPair) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_KEY, tokens.access_token);
  window.localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

function setStoredUser(user: SessionUser) {
  if (!isBrowser()) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(USER_KEY);
}

/** Best-effort client-side expiry check. Server is the source of truth. */
export function isAccessTokenLikelyValid(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 > Date.now() + 5_000;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

if (isBrowser()) {
  // Cross-tab: if another tab logs in or out, refresh hooks here.
  window.addEventListener('storage', (e) => {
    if (e.key === USER_KEY || e.key === ACCESS_KEY) emit();
  });
}

export function useSession(): SessionUser | null {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const l: Listener = () => force();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return getStoredUser();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function isAuthed(): boolean {
  return getAccessToken() !== null && getStoredUser() !== null;
}

export function currentRole(): Role | null {
  return getStoredUser()?.role ?? null;
}

export function hasRole(...allowed: Role[]): boolean {
  const role = currentRole();
  return role !== null && allowed.includes(role);
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const res = await api<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setTokens(res.tokens);
  setStoredUser(res.user);
  emit();
  return res.user;
}

export function logout(): void {
  clearTokens();
  emit();
}

export async function refreshCurrentUser(): Promise<SessionUser | null> {
  try {
    const user = await api<SessionUser>('/auth/me', { auth: true });
    setStoredUser(user);
    emit();
    return user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearTokens();
      emit();
    }
    return null;
  }
}
