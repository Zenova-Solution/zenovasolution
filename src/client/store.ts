/**
 * Client portal session. Real auth — unified ``POST /auth/login`` with RBAC.
 */

import {
  hasRole,
  isAuthed,
  login as sessionLogin,
  logout as sessionLogout,
  useSession,
  type SessionUser,
} from '@/lib/session';

export interface ClientUser {
  id: string;
  email: string;
  name: string;
  /** Display label — falls back to the email local-part if unknown. */
  company: string;
}

// Re-export shared project types & helpers so existing imports keep working.
export {
  fetchProjectSnapshot,
  useProjectSnapshot,
  type ProjectSnapshot,
  type ProjectPhase,
  type ProjectActivity,
  type ProjectStat,
} from '@/lib/projectData';

function toClient(u: SessionUser): ClientUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    company: u.email.includes('@') ? u.email.split('@')[1].split('.')[0] : u.name,
  };
}

export function isClientAuthed(): boolean {
  return isAuthed() && hasRole('client', 'admin');
}

/**
 * Sign in via the unified endpoint. Throws if the credentials work but the
 * account isn't a client (or admin previewing).
 */
export async function clientLogin(email: string, password: string): Promise<ClientUser> {
  const user = await sessionLogin(email, password);
  if (user.role !== 'client' && user.role !== 'admin') {
    sessionLogout();
    throw new Error(
      user.role === 'team'
        ? 'This account is a team account — sign in at /team/login.'
        : 'This account does not have client access.',
    );
  }
  return toClient(user);
}

export function clientLogout(): void {
  sessionLogout();
}

export function useClientSession(): ClientUser | null {
  const user = useSession();
  if (!user) return null;
  if (user.role !== 'client' && user.role !== 'admin') return null;
  return toClient(user);
}
