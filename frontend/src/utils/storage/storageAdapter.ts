// Storage abstraction layer with fallbacks
export interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

class MemoryStorage implements StorageInterface {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

class SafeStorageWrapper implements StorageInterface {
  constructor(private storage: Storage, private fallback: StorageInterface) {}

  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.warn(`Storage.getItem failed for key "${key}":`, error);
      return this.fallback.getItem(key);
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.warn(`Storage.setItem failed for key "${key}":`, error);
      this.fallback.setItem(key, value);
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.warn(`Storage.removeItem failed for key "${key}":`, error);
      this.fallback.removeItem(key);
    }
  }

  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      console.warn('Storage.clear failed:', error);
      this.fallback.clear();
    }
  }
}

// Test if storage is available and working
function isStorageAvailable(storage: Storage): boolean {
  try {
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Create storage adapter with fallback chain
function createStorageAdapter(): StorageInterface {
  const memoryStorage = new MemoryStorage();

  // Try localStorage first
  if (typeof window !== 'undefined' && window.localStorage && isStorageAvailable(window.localStorage)) {
    // Try sessionStorage as fallback
    if (window.sessionStorage && isStorageAvailable(window.sessionStorage)) {
      const sessionStorageWrapper = new SafeStorageWrapper(window.sessionStorage, memoryStorage);
      return new SafeStorageWrapper(window.localStorage, sessionStorageWrapper);
    } else {
      return new SafeStorageWrapper(window.localStorage, memoryStorage);
    }
  }

  // Try sessionStorage if localStorage not available
  if (typeof window !== 'undefined' && window.sessionStorage && isStorageAvailable(window.sessionStorage)) {
    return new SafeStorageWrapper(window.sessionStorage, memoryStorage);
  }

  // Fall back to memory storage
  console.warn('No web storage available, using memory storage');
  return memoryStorage;
}

// Export singleton instance
export const storageAdapter = createStorageAdapter();

// Export for testing
export { MemoryStorage, SafeStorageWrapper, isStorageAvailable, createStorageAdapter };