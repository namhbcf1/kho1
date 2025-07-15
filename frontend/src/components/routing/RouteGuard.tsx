// Route Guard Component with Vietnamese POS business logic
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { ROUTES } from '../../constants/routes';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredPermissions = [],
  requireAuth = true,
  redirectTo = ROUTES.LOGIN,
}) => {
  const { isAuthenticated, loading, isInitialized, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is initializing
  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    // Save current location to redirect after login
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check permissions if user is authenticated
  if (isAuthenticated && requiredPermissions.length > 0) {
    const hasPermission = checkUserPermissions(user, requiredPermissions);
    
    if (!hasPermission) {
      // Redirect to dashboard if user doesn't have required permissions
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
  }

  return <>{children}</>;
};

// Helper function to check user permissions
const checkUserPermissions = (user: any, requiredPermissions: string[]): boolean => {
  if (!user || !user.role) return false;

  // Vietnamese POS role hierarchy
  const roleHierarchy = {
    'owner': ['owner', 'manager', 'cashier', 'staff'],
    'manager': ['manager', 'cashier', 'staff'],
    'cashier': ['cashier', 'staff'],
    'staff': ['staff'],
  };

  const userRoles = roleHierarchy[user.role as keyof typeof roleHierarchy] || [];
  
  return requiredPermissions.some(permission => 
    userRoles.includes(permission)
  );
};

// Public route guard (redirects authenticated users)
export const PublicRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, isInitialized } = useAuth();

  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

// Role-based route guard
export const RoleGuard: React.FC<{
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}> = ({ children, allowedRoles, fallback = null }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const hasAllowedRole = allowedRoles.includes(user.role);

  if (!hasAllowedRole) {
    return fallback ? <>{fallback}</> : <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

// Vietnamese business hours guard
export const BusinessHoursGuard: React.FC<{
  children: React.ReactNode;
  allowAfterHours?: boolean;
}> = ({ children, allowAfterHours = false }) => {
  const { user } = useAuth();
  
  // Check if current time is within business hours (6 AM - 10 PM)
  const now = new Date();
  const currentHour = now.getHours();
  const isBusinessHours = currentHour >= 6 && currentHour < 22;

  // Allow owners and managers to work after hours
  const canWorkAfterHours = allowAfterHours || 
    (user && ['owner', 'manager'].includes(user.role));

  if (!isBusinessHours && !canWorkAfterHours) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Ngoài giờ làm việc</h2>
          <p className="text-gray-600">
            Hệ thống chỉ hoạt động từ 6:00 - 22:00 hằng ngày
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RouteGuard;