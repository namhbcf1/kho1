import { useAuth } from './useAuth';

// Define permission constants
export const PERMISSIONS = {
  // POS permissions
  POS_ACCESS: 'pos.access',
  POS_REFUND: 'pos.refund',
  POS_DISCOUNT: 'pos.discount',
  
  // Product permissions
  PRODUCT_VIEW: 'product.view',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  
  // Customer permissions
  CUSTOMER_VIEW: 'customer.view',
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_UPDATE: 'customer.update',
  CUSTOMER_DELETE: 'customer.delete',
  
  // Order permissions
  ORDER_VIEW: 'order.view',
  ORDER_UPDATE: 'order.update',
  ORDER_DELETE: 'order.delete',
  
  // Analytics permissions
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  
  // Staff permissions
  STAFF_VIEW: 'staff.view',
  STAFF_MANAGE: 'staff.manage',
  
  // Settings permissions
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
} as const;

// Role-based permissions mapping
const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_REFUND,
    PERMISSIONS.POS_DISCOUNT,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  cashier: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.ORDER_VIEW,
  ],
  staff: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.ORDER_VIEW,
  ],
};

export const usePermissions = () => {
  const { user } = useAuth();

  const getUserPermissions = () => {
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
  };

  const hasPermission = (permission: string) => {
    const userPermissions = getUserPermissions();
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]) => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canAccess = (requiredPermissions: string | string[]) => {
    if (typeof requiredPermissions === 'string') {
      return hasPermission(requiredPermissions);
    }
    return hasAnyPermission(requiredPermissions);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    getUserPermissions,
    userRole: user?.role,
  };
};
