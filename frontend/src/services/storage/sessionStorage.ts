// Enhanced sessionStorage service for temporary data
import { SESSION_KEYS } from '../../constants/storage';

export interface SessionItem<T = any> {
  data: T;
  timestamp: number;
  tabId?: string;
}

class SessionStorageService {
  private readonly prefix = 'khoaugment_session_';
  private readonly tabId: string;

  constructor() {
    // Generate unique tab ID for this session
    this.tabId = this.generateTabId();
  }

  /**
   * Set item in sessionStorage
   */
  setItem<T>(key: string, value: T, tabSpecific = false): boolean {
    try {
      const item: SessionItem<T> = {
        data: value,
        timestamp: Date.now(),
        tabId: tabSpecific ? this.tabId : undefined,
      };

      const serialized = JSON.stringify(item);
      sessionStorage.setItem(this.getKey(key), serialized);
      return true;
    } catch (error) {
      console.error('SessionStorage setItem error:', error);
      return false;
    }
  }

  /**
   * Get item from sessionStorage
   */
  getItem<T>(key: string, defaultValue?: T, tabSpecific = false): T | null {
    try {
      const stored = sessionStorage.getItem(this.getKey(key));
      if (!stored) {
        return defaultValue || null;
      }

      const item: SessionItem<T> = JSON.parse(stored);

      // Check if item is tab-specific and matches current tab
      if (tabSpecific && item.tabId && item.tabId !== this.tabId) {
        return defaultValue || null;
      }

      return item.data;
    } catch (error) {
      console.error('SessionStorage getItem error:', error);
      return defaultValue || null;
    }
  }

  /**
   * Remove item from sessionStorage
   */
  removeItem(key: string): boolean {
    try {
      sessionStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('SessionStorage removeItem error:', error);
      return false;
    }
  }

  /**
   * Clear all app-related items from sessionStorage
   */
  clear(): boolean {
    try {
      const keys = Object.keys(sessionStorage);
      const appKeys = keys.filter(key => key.startsWith(this.prefix));
      
      appKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      return true;
    } catch (error) {
      console.error('SessionStorage clear error:', error);
      return false;
    }
  }

  /**
   * Get all app-related keys
   */
  getKeys(): string[] {
    try {
      const keys = Object.keys(sessionStorage);
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('SessionStorage getKeys error:', error);
      return [];
    }
  }

  /**
   * Check if sessionStorage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, 'test');
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current tab ID
   */
  getTabId(): string {
    return this.tabId;
  }

  /**
   * Clean up items from other tabs
   */
  cleanupOtherTabs(): number {
    let cleaned = 0;
    try {
      const keys = this.getKeys();
      
      keys.forEach(key => {
        const stored = sessionStorage.getItem(this.getKey(key));
        if (stored) {
          try {
            const item: SessionItem = JSON.parse(stored);
            if (item.tabId && item.tabId !== this.tabId) {
              this.removeItem(key);
              cleaned++;
            }
          } catch {
            // Invalid item, remove it
            this.removeItem(key);
            cleaned++;
          }
        }
      });
      
      return cleaned;
    } catch (error) {
      console.error('SessionStorage cleanupOtherTabs error:', error);
      return 0;
    }
  }

  // Private helper methods
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create and export singleton instance
export const sessionStorageService = new SessionStorageService();

// Convenience methods for common operations
export const sessionStorage = {
  // Current session data
  setCurrentSession: (session: any) => 
    sessionStorageService.setItem(SESSION_KEYS.CURRENT_SESSION, session, true),
  getCurrentSession: () => 
    sessionStorageService.getItem(SESSION_KEYS.CURRENT_SESSION, null, true),
  clearCurrentSession: () => 
    sessionStorageService.removeItem(SESSION_KEYS.CURRENT_SESSION),

  // Temporary data
  setTempData: (key: string, data: any) => 
    sessionStorageService.setItem(`${SESSION_KEYS.TEMP_DATA}_${key}`, data),
  getTempData: <T>(key: string, defaultValue?: T) => 
    sessionStorageService.getItem<T>(`${SESSION_KEYS.TEMP_DATA}_${key}`, defaultValue),
  removeTempData: (key: string) => 
    sessionStorageService.removeItem(`${SESSION_KEYS.TEMP_DATA}_${key}`),

  // Form drafts
  setFormDraft: (formId: string, draft: any) => 
    sessionStorageService.setItem(`${SESSION_KEYS.FORM_DRAFT}_${formId}`, draft),
  getFormDraft: <T>(formId: string, defaultValue?: T) => 
    sessionStorageService.getItem<T>(`${SESSION_KEYS.FORM_DRAFT}_${formId}`, defaultValue),
  removeFormDraft: (formId: string) => 
    sessionStorageService.removeItem(`${SESSION_KEYS.FORM_DRAFT}_${formId}`),
  clearAllFormDrafts: () => {
    const keys = sessionStorageService.getKeys();
    keys.filter(key => key.startsWith(SESSION_KEYS.FORM_DRAFT)).forEach(key => {
      sessionStorageService.removeItem(key);
    });
  },

  // Navigation state
  setNavigationState: (state: any) => 
    sessionStorageService.setItem('navigation_state', state, true),
  getNavigationState: () => 
    sessionStorageService.getItem('navigation_state', null, true),

  // Search history
  addSearchHistory: (query: string, type = 'general') => {
    const key = `search_history_${type}`;
    const history = sessionStorageService.getItem<string[]>(key, []);
    
    // Remove if already exists
    const filtered = history.filter(item => item !== query);
    
    // Add to beginning and limit to 10 items
    const updated = [query, ...filtered].slice(0, 10);
    
    sessionStorageService.setItem(key, updated);
  },
  getSearchHistory: (type = 'general') => 
    sessionStorageService.getItem<string[]>(`search_history_${type}`, []),
  clearSearchHistory: (type = 'general') => 
    sessionStorageService.removeItem(`search_history_${type}`),

  // Tab management
  getTabId: () => sessionStorageService.getTabId(),
  cleanupOtherTabs: () => sessionStorageService.cleanupOtherTabs(),
};
