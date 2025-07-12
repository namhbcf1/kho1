// Authentication hooks
import { useCallback } from 'react';
import { useAuthStore, usePermissions as usePermissionsStore } from '../stores';
import { authService } from '../services/auth';
import type { LoginCredentials, RegisterData, ChangePasswordData } from '../services/auth/authService';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: loginAction,
    register: registerAction,
    logout: logoutAction,
    updateProfile: updateProfileAction,
    changePassword: changePasswordAction,
    forgotPassword: forgotPasswordAction,
    resetPassword: resetPasswordAction,
    initialize: initializeAction,
    clearError,
  } = useAuthStore();

  const login = useCallback(async (credentials: LoginCredentials) => {
    return await loginAction(credentials.email, credentials.password, credentials.remember);
  }, [loginAction]);

  const register = useCallback(async (data: RegisterData) => {
    return await registerAction(data);
  }, [registerAction]);

  const logout = useCallback(async () => {
    return await logoutAction();
  }, [logoutAction]);

  const updateProfile = useCallback(async (data: any) => {
    return await updateProfileAction(data);
  }, [updateProfileAction]);

  const changePassword = useCallback(async (data: ChangePasswordData) => {
    return await changePasswordAction(data);
  }, [changePasswordAction]);

  const forgotPassword = useCallback(async (email: string) => {
    return await forgotPasswordAction(email);
  }, [forgotPasswordAction]);

  const resetPassword = useCallback(async (data: any) => {
    return await resetPasswordAction(data);
  }, [resetPasswordAction]);

  const initialize = useCallback(async () => {
    return await initializeAction();
  }, [initializeAction]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    initialize,
    clearError,
  };
};

export const usePermissions = () => {
  const {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    canAccessResource,
  } = usePermissionsStore();

  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    canAccessResource,
  };
};

export const useAuthGuard = (requiredPermission?: string, requiredRole?: string) => {
  const { isAuthenticated, user } = useAuth();
  const { hasPermission, hasRole } = usePermissions();

  const canAccess = useCallback(() => {
    if (!isAuthenticated || !user) {
      return false;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return false;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return false;
    }

    return true;
  }, [isAuthenticated, user, requiredPermission, requiredRole, hasPermission, hasRole]);

  return {
    canAccess: canAccess(),
    isAuthenticated,
    user,
  };
};
