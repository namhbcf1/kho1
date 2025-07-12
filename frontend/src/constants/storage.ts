// Local storage keys
export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  REMEMBER_LOGIN: 'remember_login',
  USER_PREFERENCES: 'user_preferences',
  
  // POS
  POS_CART: 'pos_cart',
  POS_SELECTED_CUSTOMER: 'pos_selected_customer',
  POS_SETTINGS: 'pos_settings',
  
  // UI State
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
  
  // Cache
  PRODUCTS_CACHE: 'products_cache',
  CUSTOMERS_CACHE: 'customers_cache',
  CATEGORIES_CACHE: 'categories_cache',
  
  // Offline
  OFFLINE_ORDERS: 'offline_orders',
  OFFLINE_SYNC_QUEUE: 'offline_sync_queue',
  LAST_SYNC_TIME: 'last_sync_time',
  
  // Settings
  BUSINESS_SETTINGS: 'business_settings',
  RECEIPT_TEMPLATE: 'receipt_template',
  PAYMENT_SETTINGS: 'payment_settings',
} as const;

// Session storage keys
export const SESSION_KEYS = {
  CURRENT_SESSION: 'current_session',
  TEMP_DATA: 'temp_data',
  FORM_DRAFT: 'form_draft',
} as const;

// Cache expiration times (in milliseconds)
export const CACHE_EXPIRATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 2 * 60 * 60 * 1000, // 2 hours
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Storage utilities
export const storage = {
  // Local storage
  local: {
    get: <T>(key: string, defaultValue?: T): T | null => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue || null;
      } catch {
        return defaultValue || null;
      }
    },
    
    set: (key: string, value: any): void => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },
    
    remove: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to remove from localStorage:', error);
      }
    },
    
    clear: (): void => {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }
    },
  },
  
  // Session storage
  session: {
    get: <T>(key: string, defaultValue?: T): T | null => {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue || null;
      } catch {
        return defaultValue || null;
      }
    },
    
    set: (key: string, value: any): void => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Failed to save to sessionStorage:', error);
      }
    },
    
    remove: (key: string): void => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to remove from sessionStorage:', error);
      }
    },
    
    clear: (): void => {
      try {
        sessionStorage.clear();
      } catch (error) {
        console.error('Failed to clear sessionStorage:', error);
      }
    },
  },
  
  // Cache with expiration
  cache: {
    get: <T>(key: string, defaultValue?: T): T | null => {
      try {
        const item = localStorage.getItem(`cache_${key}`);
        if (!item) return defaultValue || null;
        
        const { data, expiration } = JSON.parse(item);
        
        if (Date.now() > expiration) {
          localStorage.removeItem(`cache_${key}`);
          return defaultValue || null;
        }
        
        return data;
      } catch {
        return defaultValue || null;
      }
    },
    
    set: (key: string, value: any, ttl: number = CACHE_EXPIRATION.MEDIUM): void => {
      try {
        const item = {
          data: value,
          expiration: Date.now() + ttl,
        };
        localStorage.setItem(`cache_${key}`, JSON.stringify(item));
      } catch (error) {
        console.error('Failed to save to cache:', error);
      }
    },
    
    remove: (key: string): void => {
      try {
        localStorage.removeItem(`cache_${key}`);
      } catch (error) {
        console.error('Failed to remove from cache:', error);
      }
    },
    
    clear: (): void => {
      try {
        Object.keys(localStorage)
          .filter(key => key.startsWith('cache_'))
          .forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    },
  },
};
