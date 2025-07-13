// Local storage hook with TypeScript support and robust error handling
import { useState, useEffect, useCallback } from 'react';
import { storageAdapter } from '../utils/storage/storageAdapter';

type SetValue<T> = T | ((val: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!key) {
      console.warn('useLocalStorage: key is required');
      return initialValue;
    }

    try {
      // Get from storage adapter (with fallbacks)
      const item = storageAdapter.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading storage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to storage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      if (!key) {
        console.warn('useLocalStorage: key is required');
        return;
      }

      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to storage adapter (with fallbacks)
        storageAdapter.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting storage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove from storage
  const removeValue = useCallback(() => {
    if (!key) {
      console.warn('useLocalStorage: key is required');
      return;
    }

    try {
      storageAdapter.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing storage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to this key from other tabs/windows (only works for localStorage)
  useEffect(() => {
    if (!key || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing storage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

// Specialized hooks for common use cases
export const useLocalStorageString = (key: string, initialValue = '') => {
  return useLocalStorage<string>(key, initialValue);
};

export const useLocalStorageNumber = (key: string, initialValue = 0) => {
  return useLocalStorage<number>(key, initialValue);
};

export const useLocalStorageBoolean = (key: string, initialValue = false) => {
  return useLocalStorage<boolean>(key, initialValue);
};

export const useLocalStorageObject = <T extends object>(key: string, initialValue: T) => {
  return useLocalStorage<T>(key, initialValue);
};

export const useLocalStorageArray = <T>(key: string, initialValue: T[] = []) => {
  return useLocalStorage<T[]>(key, initialValue);
};
