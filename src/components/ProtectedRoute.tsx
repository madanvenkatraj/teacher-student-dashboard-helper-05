import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode | ((props: { currentUser: any }) => React.ReactNode);
  allowedRoles?: Array<'teacher' | 'student' | 'admin'>;
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Always allow admin to access any route
  if (currentUser.role === 'admin') {
    // Check if children is a function and call it with currentUser
    if (typeof children === 'function') {
      return <>{children({ currentUser })}</>;
    }
    
    // Otherwise, render children directly
    return <>{children}</>;
  }

  // For non-admin users, check against allowed roles
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if children is a function and call it with currentUser
  if (typeof children === 'function') {
    return <>{children({ currentUser })}</>;
  }

  // Otherwise, render children directly
  return <>{children}</>;
};

export default ProtectedRoute;
