// Permissions hook
import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

export const usePermissions = () => {
  const { user } = useAuthStore();

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check user permissions
    if (user.permissions && user.permissions.includes(permission)) {
      return true;
    }

    // Role-based permissions
    const rolePermissions = {
      manager: [
        'view_dashboard',
        'manage_products',
        'manage_customers',
        'process_orders',
        'view_reports',
        'manage_inventory',
        'process_refunds',
        'manage_staff',
        'view_analytics',
        'export_data',
      ],
      cashier: [
        'view_dashboard',
        'process_orders',
        'manage_customers',
        'view_products',
        'process_refunds',
      ],
      staff: [
        'view_dashboard',
        'process_orders',
        'view_products',
        'view_customers',
      ],
    };

    const userRolePermissions = rolePermissions[user.role as keyof typeof rolePermissions] || [];
    return userRolePermissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  const canAccess = useCallback((resource: string, action: string = 'view'): boolean => {
    const permission = `${action}_${resource}`;
    return hasPermission(permission);
  }, [hasPermission]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    user,
  };
};
