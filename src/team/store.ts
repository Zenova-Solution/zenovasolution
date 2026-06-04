/**
 * Team portal session. Real auth — unified ``POST /auth/login`` with RBAC.
 */

import {
  hasRole,
  isAuthed,
  login as sessionLogin,
  logout as sessionLogout,
  useSession,
  type SessionUser,
} from '@/lib/session';

export interface TeamPortalUser {
  id: string;
  email: string;
  name: string;
  /** Display sub-label. We pass the backend ``role`` ('team'|'admin') for now. */
  role: string;
}

function toTeam(u: SessionUser): TeamPortalUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role === 'admin' ? 'Admin' : 'Team member',
  };
}

export function isTeamAuthed(): boolean {
  return isAuthed() && hasRole('team', 'admin');
}

export async function teamLogin(email: string, password: string): Promise<TeamPortalUser> {
  const user = await sessionLogin(email, password);
  if (user.role !== 'team' && user.role !== 'admin') {
    sessionLogout();
    throw new Error(
      user.role === 'client'
        ? 'This account is a client account — sign in at /client/login.'
        : 'This account does not have team access.',
    );
  }
  return toTeam(user);
}

export function teamLogout(): void {
  sessionLogout();
}

export function useTeamSession(): TeamPortalUser | null {
  const user = useSession();
  if (!user) return null;
  if (user.role !== 'team' && user.role !== 'admin') return null;
  return toTeam(user);
}
