import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * AuthGuard renders child routes (via <Outlet />) only when a valid
 * session exists in localStorage. Otherwise it redirects to /login.
 */
export default function AuthGuard() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
