// Export all stores (Production - No offline functionality)
export * from './authStore';
export * from './posStore';
export * from './productStore';
export * from './customerStore';
export * from './orderStore';
export * from './inventoryStore';
export * from './analyticsStore.enhanced';
export * from './settingsStore';
export * from './uiStore';

// Re-export commonly used stores and hooks
export { useAuthStore, useAuth, useAuthActions, usePermissions } from './authStore';
export { usePOSStore, usePOSCart, usePOSActions, usePOSData } from './posStore';
export { useProductStore, useProducts, useProductActions, useProductFilters } from './productStore';
export { 
  useUIStore, 
  useLayout, 
  useLoading, 
  useModals, 
  useNotifications, 
  useDrawers, 
  usePage, 
  useGlobalSearch 
} from './uiStore';
