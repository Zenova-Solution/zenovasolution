/**
 * Legacy admin-only auth module. Keeps the original surface area so existing
 * imports don't need to be touched, but delegates to the unified session at
 * src/lib/session.ts.
 */

export {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  isAccessTokenLikelyValid,
} from './session';
export type { SessionUser as AdminUser, TokenPair } from './session';

import {
  clearTokens as _clear,
  getStoredUser as _getStoredUser,
  type SessionUser,
  type TokenPair,
} from './session';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

const ACCESS_KEY = 'zenova.session.access_token';
const REFRESH_KEY = 'zenova.session.refresh_token';
const USER_KEY = 'zenova.session.user';

/** Writes that bypass the session module — only used by the legacy admin store. */
export function setTokens(tokens: TokenPair): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_KEY, tokens.access_token);
  window.localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function setStoredUser(user: SessionUser): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  _clear();
}

void _getStoredUser; // keep the import to silence unused warnings during refactor
