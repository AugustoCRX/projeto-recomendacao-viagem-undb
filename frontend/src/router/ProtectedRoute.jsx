import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Spinner } from '@/components/ui';
import { ROUTES } from '@/constants';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, validating } = useAuth();
  const location = useLocation();

  if (validating) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  return children;
}
