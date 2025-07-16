/**
 * Fixed Service Worker for POS System
 * Fixes: Cache hell, stale data, inventory conflicts
 */

const CACHE_NAME = 'kho-pos-v1';
const DYNAMIC_CACHE = 'kho-pos-dynamic-v1';
const CRITICAL_CACHE = 'kho-pos-critical-v1';

// Critical resources that must be cached
const CRITICAL_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png'
];

// Resources that should never be cached (real-time data)
const NEVER_CACHE = [
  '/api/products/inventory',
  '/api/orders/current',
  '/api/payments/status',
  '/api/pos/sync'
];

// Dynamic resources with short TTL
const DYNAMIC_RESOURCES = [
  '/api/products',
  '/api/customers',
  '/api/settings'
];

class InventoryConflictResolver {
  constructor() {
    this.pendingUpdates = new Map();
    this.conflictQueue = [];
  }

  async handleInventoryUpdate(request) {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    
    if (!productId) return null;

    // Check for pending updates to same product
    if (this.pendingUpdates.has(productId)) {
      // Queue this update
      return new Promise((resolve) => {
        this.conflictQueue.push({ productId, request, resolve });
      });
    }

    this.pendingUpdates.set(productId, true);
    
    try {
      const response = await fetch(request);
      
      // Process queued updates for this product
      this.processQueuedUpdates(productId);
      
      return response;
    } finally {
      this.pendingUpdates.delete(productId);
    }
  }

  processQueuedUpdates(productId) {
    const queued = this.conflictQueue.filter(item => item.productId === productId);
    this.conflictQueue = this.conflictQueue.filter(item => item.productId !== productId);
    
    // Process queued updates sequentially
    queued.forEach(async ({ request, resolve }) => {
      const response = await fetch(request);
      resolve(response);
    });
  }
}

class SmartCacheManager {
  constructor() {
    this.inventoryResolver = new InventoryConflictResolver();
  }

  async shouldCache(request) {
    const url = new URL(request.url);
    
    // Never cache real-time endpoints
    if (NEVER_CACHE.some(path => url.pathname.includes(path))) {
      return false;
    }
    
    // Always cache critical resources
    if (CRITICAL_RESOURCES.some(path => url.pathname === path)) {
      return true;
    }
    
    // Cache dynamic resources with TTL
    if (DYNAMIC_RESOURCES.some(path => url.pathname.includes(path))) {
      return true;
    }
    
    return false;
  }

  async getCacheStrategy(request) {
    const url = new URL(request.url);
    
    // Critical resources: cache first
    if (CRITICAL_RESOURCES.some(path => url.pathname === path)) {
      return 'cache-first';
    }
    
    // Dynamic resources: network first with fallback
    if (DYNAMIC_RESOURCES.some(path => url.pathname.includes(path))) {
      return 'network-first';
    }
    
    // Real-time data: network only
    if (NEVER_CACHE.some(path => url.pathname.includes(path))) {
      return 'network-only';
    }
    
    return 'network-first';
  }

  async handleRequest(request) {
    const strategy = await this.getCacheStrategy(request);
    
    switch (strategy) {
      case 'cache-first':
        return this.cacheFirst(request);
      case 'network-first':
        return this.networkFirst(request);
      case 'network-only':
        return this.networkOnly(request);
      default:
        return this.networkFirst(request);
    }
  }

  async cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    await this.updateCache(request, networkResponse.clone());
    return networkResponse;
  }

  async networkFirst(request) {
    try {
      // Handle inventory conflicts
      if (request.url.includes('/api/products/inventory')) {
        return await this.inventoryResolver.handleInventoryUpdate(request);
      }
      
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok && await this.shouldCache(request)) {
        await this.updateCache(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      // Fallback to cache if network fails
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline page for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
      
      throw error;
    }
  }

  async networkOnly(request) {
    return fetch(request);
  }

  async updateCache(request, response) {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.put(request, response);
  }

  async clearStaleCache() {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const request of requests) {
      const response = await cache.match(request);
      const dateHeader = response?.headers.get('date');
      
      if (dateHeader) {
        const cacheTime = new Date(dateHeader).getTime();
        if (now - cacheTime > maxAge) {
          await cache.delete(request);
        }
      }
    }
  }
}

const cacheManager = new SmartCacheManager();

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CRITICAL_CACHE)
      .then(cache => cache.addAll(CRITICAL_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![CACHE_NAME, DYNAMIC_CACHE, CRITICAL_CACHE].includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(cacheManager.handleRequest(event.request));
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'pos-transaction-sync') {
    event.waitUntil(syncOfflineTransactions());
  }
});

async function syncOfflineTransactions() {
  try {
    // Get offline transactions from IndexedDB
    const transactions = await getOfflineTransactions();
    
    for (const transaction of transactions) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${transaction.token}`
          },
          body: JSON.stringify(transaction.data)
        });
        
        if (response.ok) {
          await removeOfflineTransaction(transaction.id);
        }
      } catch (error) {
        console.error('Failed to sync transaction:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Clean stale cache periodically
setInterval(() => {
  cacheManager.clearStaleCache();
}, 10 * 60 * 1000); // Every 10 minutes

// IndexedDB helpers (simplified)
async function getOfflineTransactions() {
  // Implementation would use IndexedDB
  return [];
}

async function removeOfflineTransaction(id) {
  // Implementation would use IndexedDB
}