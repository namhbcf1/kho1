// Enhanced localStorage service with encryption and compression
import { STORAGE_KEYS, CACHE_EXPIRATION } from '../../constants/storage';

export interface StorageItem<T = any> {
  data: T;
  timestamp: number;
  expiration?: number;
  version?: string;
}

export interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  ttl?: number; // Time to live in milliseconds
}

class LocalStorageService {
  private readonly prefix = 'khoaugment_';
  private readonly version = '1.0.0';

  // Simple encryption key (in production, use proper key management)
  private readonly encryptionKey = 'khoaugment-pos-2024';

  /**
   * Set item in localStorage with options
   */
  setItem<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    try {
      const item: StorageItem<T> = {
        data: value,
        timestamp: Date.now(),
        version: this.version,
      };

      if (options.ttl) {
        item.expiration = Date.now() + options.ttl;
      }

      let serialized = JSON.stringify(item);

      // Compress if requested (simple compression)
      if (options.compress) {
        serialized = this.compress(serialized);
      }

      // Encrypt if requested (simple encryption)
      if (options.encrypt) {
        serialized = this.encrypt(serialized);
      }

      localStorage.setItem(this.getKey(key), serialized);
      return true;
    } catch (error) {
      console.error('LocalStorage setItem error:', error);
      return false;
    }
  }

  /**
   * Get item from localStorage with automatic expiration check
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (!stored) {
        return defaultValue || null;
      }

      let serialized = stored;

      // Try to decrypt if it looks encrypted
      if (this.isEncrypted(serialized)) {
        serialized = this.decrypt(serialized);
      }

      // Try to decompress if it looks compressed
      if (this.isCompressed(serialized)) {
        serialized = this.decompress(serialized);
      }

      const item: StorageItem<T> = JSON.parse(serialized);

      // Check expiration
      if (item.expiration && Date.now() > item.expiration) {
        this.removeItem(key);
        return defaultValue || null;
      }

      // Check version compatibility
      if (item.version && item.version !== this.version) {
        console.warn(`Storage version mismatch for ${key}: ${item.version} vs ${this.version}`);
      }

      return item.data;
    } catch (error) {
      console.error('LocalStorage getItem error:', error);
      return defaultValue || null;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('LocalStorage removeItem error:', error);
      return false;
    }
  }

  /**
   * Clear all app-related items from localStorage
   */
  clear(): boolean {
    try {
      const keys = Object.keys(localStorage);
      const appKeys = keys.filter(key => key.startsWith(this.prefix));
      
      appKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      return true;
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      return false;
    }
  }

  /**
   * Get all app-related keys
   */
  getKeys(): string[] {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('LocalStorage getKeys error:', error);
      return [];
    }
  }

  /**
   * Get storage usage information
   */
  getUsage(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        used += localStorage.getItem(key)?.length || 0;
      });

      // Estimate available space (most browsers limit to ~5-10MB)
      const estimated = 5 * 1024 * 1024; // 5MB
      const available = estimated - used;
      const percentage = (used / estimated) * 100;

      return { used, available, percentage };
    } catch (error) {
      console.error('LocalStorage getUsage error:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup expired items
   */
  cleanup(): number {
    let cleaned = 0;
    try {
      const keys = this.getKeys();
      
      keys.forEach(key => {
        const item = this.getItem(key);
        if (item === null) {
          cleaned++;
        }
      });
      
      return cleaned;
    } catch (error) {
      console.error('LocalStorage cleanup error:', error);
      return 0;
    }
  }

  // Private helper methods
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private encrypt(data: string): string {
    // Simple XOR encryption (use proper encryption in production)
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
      );
    }
    return btoa(result);
  }

  private decrypt(data: string): string {
    try {
      const decoded = atob(data);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
        );
      }
      return result;
    } catch {
      return data; // Return original if decryption fails
    }
  }

  private compress(data: string): string {
    // Simple compression placeholder (use proper compression library in production)
    return data;
  }

  private decompress(data: string): string {
    // Simple decompression placeholder
    return data;
  }

  private isEncrypted(data: string): boolean {
    // Simple check for base64 encoding
    try {
      return btoa(atob(data)) === data;
    } catch {
      return false;
    }
  }

  private isCompressed(data: string): boolean {
    // Simple check for compression markers
    return false;
  }
}

// Create and export singleton instance
export const localStorageService = new LocalStorageService();

// Convenience methods for common operations
export const localStorage = {
  // Auth tokens
  setAuthToken: (token: string) => 
    localStorageService.setItem(STORAGE_KEYS.AUTH_TOKEN, token, { encrypt: true }),
  getAuthToken: () => 
    localStorageService.getItem<string>(STORAGE_KEYS.AUTH_TOKEN),
  removeAuthToken: () => 
    localStorageService.removeItem(STORAGE_KEYS.AUTH_TOKEN),

  // User preferences
  setUserPreferences: (prefs: any) => 
    localStorageService.setItem(STORAGE_KEYS.USER_PREFERENCES, prefs),
  getUserPreferences: () => 
    localStorageService.getItem(STORAGE_KEYS.USER_PREFERENCES, {}),

  // POS cart
  setPOSCart: (cart: any[]) => 
    localStorageService.setItem(STORAGE_KEYS.POS_CART, cart, { ttl: CACHE_EXPIRATION.LONG }),
  getPOSCart: () => 
    localStorageService.getItem<any[]>(STORAGE_KEYS.POS_CART, []),
  clearPOSCart: () => 
    localStorageService.removeItem(STORAGE_KEYS.POS_CART),

  // Cache
  setCache: (key: string, data: any, ttl?: number) => 
    localStorageService.setItem(`cache_${key}`, data, { ttl: ttl || CACHE_EXPIRATION.MEDIUM }),
  getCache: <T>(key: string, defaultValue?: T) => 
    localStorageService.getItem<T>(`cache_${key}`, defaultValue),
  clearCache: () => {
    const keys = localStorageService.getKeys();
    keys.filter(key => key.startsWith('cache_')).forEach(key => {
      localStorageService.removeItem(key);
    });
  },
};
