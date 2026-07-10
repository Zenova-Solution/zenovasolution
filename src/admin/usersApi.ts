/**
 * Admin user-account management — thin typed fetchers over /admin/users.
 *
 * Deliberately not a `Store` from store.ts: those exist so the public site can
 * share cached content datasets. Auth accounts are admin-only, consumed by a
 * single page, and should never be cached in localStorage.
 */

import { api } from '@/lib/api';
import type { Role, SessionUser } from '@/lib/session';

/** Same shape as the backend's AdminUserOut. */
export type UserAccount = SessionUser;

export interface UserCreatePayload {
  email: string;
  name: string;
  role: Role;
  password: string;
}

export type UserPatchPayload = Partial<{
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  password: string;
}>;

export function listUsers(): Promise<UserAccount[]> {
  return api<UserAccount[]>('/admin/users', { auth: true });
}

export function createUser(payload: UserCreatePayload): Promise<UserAccount> {
  return api<UserAccount>('/admin/users', { method: 'POST', body: payload, auth: true });
}

export function patchUser(id: string, payload: UserPatchPayload): Promise<UserAccount> {
  return api<UserAccount>(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
    auth: true,
  });
}

export function deleteUser(id: string): Promise<void> {
  return api<void>(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
}
