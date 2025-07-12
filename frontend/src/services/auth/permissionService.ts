// Role-based permission service
import { authService } from './authService';
import { tokenService } from './tokenService';
import type { User } from '../api/types';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: number;
}

// Define permission constants
export const PERMISSIONS = {
  // POS permissions
  POS_ACCESS: 'pos.access',
  POS_SELL: 'pos.sell',
  POS_REFUND: 'pos.refund',
  POS_DISCOUNT: 'pos.discount',
  POS_VOID: 'pos.void',

  // Product permissions
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_IMPORT: 'products.import',
  PRODUCTS_EXPORT: 'products.export',

  // Inventory permissions
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_TRANSFER: 'inventory.transfer',

  // Customer permissions
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',
  CUSTOMERS_EXPORT: 'customers.export',

  // Order permissions
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_REFUND: 'orders.refund',
  ORDERS_EXPORT: 'orders.export',

  // Analytics permissions
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  ANALYTICS_ADVANCED: 'analytics.advanced',

  // Staff permissions
  STAFF_VIEW: 'staff.view',
  STAFF_CREATE: 'staff.create',
  STAFF_UPDATE: 'staff.update',
  STAFF_DELETE: 'staff.delete',
  STAFF_PERMISSIONS: 'staff.permissions',

  // Settings permissions
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_BUSINESS: 'settings.business',
  SETTINGS_PAYMENT: 'settings.payment',
  SETTINGS_TAX: 'settings.tax',

  // Admin permissions
  ADMIN_ACCESS: 'admin.access',
  ADMIN_USERS: 'admin.users',
  ADMIN_SYSTEM: 'admin.system',
  ADMIN_BACKUP: 'admin.backup',
  ADMIN_LOGS: 'admin.logs',

  // Special permissions
  ALL: '*',
} as const;

// Define role constants
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  STAFF: 'staff',
} as const;

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.ADMIN]: [PERMISSIONS.ALL],
  
  [ROLES.MANAGER]: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_SELL,
    PERMISSIONS.POS_REFUND,
    PERMISSIONS.POS_DISCOUNT,
    PERMISSIONS.POS_VOID,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.PRODUCTS_IMPORT,
    PERMISSIONS.PRODUCTS_EXPORT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_DELETE,
    PERMISSIONS.CUSTOMERS_EXPORT,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_REFUND,
    PERMISSIONS.ORDERS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.ANALYTICS_ADVANCED,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.SETTINGS_BUSINESS,
    PERMISSIONS.SETTINGS_PAYMENT,
    PERMISSIONS.SETTINGS_TAX,
  ],
  
  [ROLES.CASHIER]: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_SELL,
    PERMISSIONS.POS_REFUND,
    PERMISSIONS.POS_DISCOUNT,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  
  [ROLES.STAFF]: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_SELL,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
  ],
};

class PermissionService {
  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string, user?: User): boolean {
    const currentUser = user || authService.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    // Admin has all permissions
    if (currentUser.role === ROLES.ADMIN) {
      return true;
    }

    // Check if user has the specific permission
    return currentUser.permissions.includes(permission) ||
           currentUser.permissions.includes(PERMISSIONS.ALL);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[], user?: User): boolean {
    return permissions.some(permission => this.hasPermission(permission, user));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[], user?: User): boolean {
    return permissions.every(permission => this.hasPermission(permission, user));
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string, user?: User): boolean {
    const currentUser = user || authService.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    return currentUser.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[], user?: User): boolean {
    return roles.some(role => this.hasRole(role, user));
  }

  /**
   * Check if user has role level or higher
   */
  hasRoleLevel(minLevel: number, user?: User): boolean {
    const currentUser = user || authService.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const roleLevels = {
      [ROLES.STAFF]: 1,
      [ROLES.CASHIER]: 2,
      [ROLES.MANAGER]: 3,
      [ROLES.ADMIN]: 4,
    };

    const userLevel = roleLevels[currentUser.role] || 0;
    return userLevel >= minLevel;
  }

  /**
   * Get user permissions
   */
  getUserPermissions(user?: User): string[] {
    const currentUser = user || authService.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    return currentUser.permissions;
  }

  /**
   * Get role permissions
   */
  getRolePermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Get all permissions for user's role
   */
  getAllUserPermissions(user?: User): string[] {
    const currentUser = user || authService.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    const rolePermissions = this.getRolePermissions(currentUser.role);
    const userPermissions = currentUser.permissions;

    // Combine and deduplicate
    const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];
    
    // If user has ALL permission, return all available permissions
    if (allPermissions.includes(PERMISSIONS.ALL)) {
      return Object.values(PERMISSIONS);
    }

    return allPermissions;
  }

  /**
   * Check if permission exists
   */
  isValidPermission(permission: string): boolean {
    return Object.values(PERMISSIONS).includes(permission as any);
  }

  /**
   * Check if role exists
   */
  isValidRole(role: string): boolean {
    return Object.values(ROLES).includes(role as any);
  }

  /**
   * Get permission category
   */
  getPermissionCategory(permission: string): string {
    const parts = permission.split('.');
    return parts[0] || 'unknown';
  }

  /**
   * Get permission action
   */
  getPermissionAction(permission: string): string {
    const parts = permission.split('.');
    return parts[1] || 'unknown';
  }

  /**
   * Filter permissions by category
   */
  filterPermissionsByCategory(permissions: string[], category: string): string[] {
    return permissions.filter(permission => 
      this.getPermissionCategory(permission) === category
    );
  }

  /**
   * Check resource access
   */
  canAccessResource(resource: string, action: string, user?: User): boolean {
    const permission = `${resource}.${action}`;
    return this.hasPermission(permission, user);
  }

  /**
   * Check if user can perform action on resource
   */
  canPerformAction(resource: string, action: string, user?: User): boolean {
    return this.canAccessResource(resource, action, user);
  }

  /**
   * Get accessible resources for user
   */
  getAccessibleResources(user?: User): string[] {
    const permissions = this.getAllUserPermissions(user);
    const resources = new Set<string>();

    permissions.forEach(permission => {
      if (permission === PERMISSIONS.ALL) {
        // Add all resources
        Object.values(PERMISSIONS).forEach(p => {
          if (p !== PERMISSIONS.ALL) {
            resources.add(this.getPermissionCategory(p));
          }
        });
      } else {
        resources.add(this.getPermissionCategory(permission));
      }
    });

    return Array.from(resources);
  }

  /**
   * Get user role level
   */
  getUserRoleLevel(user?: User): number {
    const currentUser = user || authService.getCurrentUser();
    if (!currentUser) {
      return 0;
    }

    const roleLevels = {
      [ROLES.STAFF]: 1,
      [ROLES.CASHIER]: 2,
      [ROLES.MANAGER]: 3,
      [ROLES.ADMIN]: 4,
    };

    return roleLevels[currentUser.role] || 0;
  }

  /**
   * Check if user can manage another user
   */
  canManageUser(targetUser: User, currentUser?: User): boolean {
    const user = currentUser || authService.getCurrentUser();
    if (!user) {
      return false;
    }

    // Admin can manage everyone
    if (user.role === ROLES.ADMIN) {
      return true;
    }

    // Manager can manage cashiers and staff
    if (user.role === ROLES.MANAGER) {
      return [ROLES.CASHIER, ROLES.STAFF].includes(targetUser.role);
    }

    // Others cannot manage users
    return false;
  }

  /**
   * Get permission display name
   */
  getPermissionDisplayName(permission: string): string {
    const displayNames: Record<string, string> = {
      [PERMISSIONS.POS_ACCESS]: 'Truy cập POS',
      [PERMISSIONS.POS_SELL]: 'Bán hàng',
      [PERMISSIONS.POS_REFUND]: 'Hoàn trả',
      [PERMISSIONS.POS_DISCOUNT]: 'Giảm giá',
      [PERMISSIONS.POS_VOID]: 'Hủy đơn',
      [PERMISSIONS.PRODUCTS_VIEW]: 'Xem sản phẩm',
      [PERMISSIONS.PRODUCTS_CREATE]: 'Tạo sản phẩm',
      [PERMISSIONS.PRODUCTS_UPDATE]: 'Cập nhật sản phẩm',
      [PERMISSIONS.PRODUCTS_DELETE]: 'Xóa sản phẩm',
      [PERMISSIONS.INVENTORY_VIEW]: 'Xem tồn kho',
      [PERMISSIONS.INVENTORY_UPDATE]: 'Cập nhật tồn kho',
      [PERMISSIONS.CUSTOMERS_VIEW]: 'Xem khách hàng',
      [PERMISSIONS.CUSTOMERS_CREATE]: 'Tạo khách hàng',
      [PERMISSIONS.ANALYTICS_VIEW]: 'Xem báo cáo',
      [PERMISSIONS.SETTINGS_VIEW]: 'Xem cài đặt',
      [PERMISSIONS.ADMIN_ACCESS]: 'Truy cập quản trị',
    };

    return displayNames[permission] || permission;
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: string): string {
    const displayNames: Record<string, string> = {
      [ROLES.ADMIN]: 'Quản trị viên',
      [ROLES.MANAGER]: 'Quản lý',
      [ROLES.CASHIER]: 'Thu ngân',
      [ROLES.STAFF]: 'Nhân viên',
    };

    return displayNames[role] || role;
  }
}

// Create and export singleton instance
export const permissionService = new PermissionService();

// Export class for custom instances
export { PermissionService };
