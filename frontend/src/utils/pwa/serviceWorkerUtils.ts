// Service Worker utilities for PWA functionality
export interface ServiceWorkerUpdate {
  waiting: ServiceWorker | null;
  skipWaiting: () => void;
}

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCallbacks: ((update: ServiceWorkerUpdate) => void)[] = [];

  public async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });

      // Check for existing waiting service worker
      if (this.registration.waiting) {
        this.notifyUpdateAvailable(this.registration.waiting);
      }

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  public async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered successfully');
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  public async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
      throw error;
    }
  }

  public onUpdateAvailable(callback: (update: ServiceWorkerUpdate) => void): void {
    this.updateCallbacks.push(callback);
  }

  public removeUpdateCallback(callback: (update: ServiceWorkerUpdate) => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  private handleUpdateFound(): void {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        this.notifyUpdateAvailable(newWorker);
      }
    });
  }

  private notifyUpdateAvailable(worker: ServiceWorker): void {
    const update: ServiceWorkerUpdate = {
      waiting: worker,
      skipWaiting: () => {
        worker.postMessage({ type: 'SKIP_WAITING' });
      },
    };

    this.updateCallbacks.forEach(callback => callback(update));
  }

  public async getVersion(): Promise<string | null> {
    if (!navigator.serviceWorker.controller) {
      return null;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version || null);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }

  public async clearCaches(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
      throw error;
    }
  }

  public async getCacheSize(): Promise<number> {
    if (!('caches' in window)) {
      return 0;
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }

  public isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  public isControlled(): boolean {
    return !!navigator.serviceWorker.controller;
  }

  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Convenience functions
export const registerServiceWorker = (): Promise<ServiceWorkerRegistration | null> => {
  return serviceWorkerManager.register();
};

export const unregisterServiceWorker = (): Promise<boolean> => {
  return serviceWorkerManager.unregister();
};

export const updateServiceWorker = (): Promise<void> => {
  return serviceWorkerManager.update();
};

export const onServiceWorkerUpdate = (callback: (update: ServiceWorkerUpdate) => void): void => {
  serviceWorkerManager.onUpdateAvailable(callback);
};

export const clearServiceWorkerCaches = (): Promise<void> => {
  return serviceWorkerManager.clearCaches();
};

export const getServiceWorkerCacheSize = (): Promise<number> => {
  return serviceWorkerManager.getCacheSize();
};

export const isServiceWorkerSupported = (): boolean => {
  return serviceWorkerManager.isSupported();
};

export const isServiceWorkerControlled = (): boolean => {
  return serviceWorkerManager.isControlled();
};

// Background sync utilities
export const requestBackgroundSync = (tag: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      reject(new Error('Background sync not supported'));
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register(tag);
    }).then(() => {
      resolve();
    }).catch((error) => {
      reject(error);
    });
  });
};

// Push notification utilities
export const subscribeToPushNotifications = async (vapidPublicKey: string): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey,
    });

    console.log('Push notification subscription successful');
    return subscription;
  } catch (error) {
    console.error('Push notification subscription failed:', error);
    return null;
  }
};

export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const result = await subscription.unsubscribe();
      console.log('Push notification unsubscription successful');
      return result;
    }
    
    return true;
  } catch (error) {
    console.error('Push notification unsubscription failed:', error);
    return false;
  }
};

export const getPushSubscription = async (): Promise<PushSubscription | null> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Failed to get push subscription:', error);
    return null;
  }
};
