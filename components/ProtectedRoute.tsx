import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Wait until auth is checked
    if (loading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check for role if required
    if (requiredRole && user?.role !== requiredRole) {
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/student');
      }
    }
  }, [isAuthenticated, user, loading, router, requiredRole]);

  // Show nothing while checking authentication
  if (loading || !isAuthenticated) {
    return null;
  }

  // Show nothing if role check fails
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
