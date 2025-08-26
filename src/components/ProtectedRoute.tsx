import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAdminRoute?: boolean;
}

const ProtectedRoute = ({ children, isAdminRoute = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  
  // Debug auth state on protected routes
  useEffect(() => {
    // Debug current auth state
    console.log("ProtectedRoute auth status:", { 
      path: location.pathname,
      user: !!user, 
      userId: user?.id,
      isAdmin, 
      adminOnly: isAdminRoute,
      loading
    });
  }, [user, loading, isAdmin, isAdminRoute, location.pathname]);

  // Show loading state if auth context is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-green"></div>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    console.log("No user, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // For admin routes, check admin status
  if (isAdminRoute && !isAdmin) {
    // Add more descriptive console.log for debugging
    console.log("Access denied: User is not an admin", { 
      userId: user.id, 
      isAdmin, 
      email: user.email,
      metadata: user.user_metadata 
    });
    
    // Redirect to admin login instead of homepage
    return <Navigate to="/login?adminAccess=required" replace />;
  }

  // If we reach here, user is authenticated and has proper permissions
  console.log("Access granted to protected route");
  return <>{children}</>;
};

export default ProtectedRoute;