import { Navigate, useLocation } from 'react-router-dom';
import { useSession, hasRole, type Role } from '@/lib/session';

interface AuthGateProps {
  children: React.ReactNode;
  requiredRoles?: Role[];
}

/**
 * Unified auth gate for all protected routes.
 * - Redirects to /login if not authenticated
 * - Redirects to appropriate dashboard if user has wrong role
 * - Allows access if authenticated and has required role(s)
 */
export function AuthGate({ children, requiredRoles }: AuthGateProps) {
  const user = useSession();
  const location = useLocation();

  // Not authenticated
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Authenticated but role not allowed
  if (requiredRoles && requiredRoles.length > 0 && !hasRole(...requiredRoles)) {
    // Redirect to their dashboard based on actual role
    const dashboardMap: Record<string, string> = {
      admin: '/admin',
      team: '/team',
      client: '/client',
    };
    return <Navigate to={dashboardMap[user.role] || '/'} replace />;
  }

  return <>{children}</>;
}
