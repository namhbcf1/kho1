// KhoAugment POS Service Worker for PWA Offline Functionality
const CACHE_NAME = 'khoaugment-pos-v1';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Core CSS and JS will be cached automatically by build process
];

const API_CACHE = 'khoaugment-api-v1';
const OFFLINE_URL = '/offline.html';

// Install event - cache app shell
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - network first with cache fallback for API, cache first for assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/') || url.host.includes('workers.dev')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return fetch(request)
          .then(response => {
            // Cache successful GET requests
            if (request.method === 'GET' && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached version if available
            return cache.match(request).then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page for navigation requests
              if (request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              throw new Error('Network error and no cache available');
            });
          });
      })
    );
    return;
  }
  
  // Handle navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // Handle static assets - cache first
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then(response => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }
  
  // Default: network first
  event.respondWith(fetch(request));
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'offline-orders') {
    event.waitUntil(syncOfflineOrders());
  }
  if (event.tag === 'offline-products') {
    event.waitUntil(syncOfflineProducts());
  }
});

// Push notifications for order updates
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Có cập nhật mới từ KhoAugment POS',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      {
        action: 'view',
        title: 'Xem chi tiết',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Đóng',
        icon: '/icons/action-dismiss.png'
      }
    ],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'KhoAugment POS', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'view' && data.url) {
    event.waitUntil(
      clients.openWindow(data.url)
    );
  } else if (action !== 'dismiss') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync offline orders when back online
async function syncOfflineOrders() {
  try {
    const offlineOrders = await getOfflineOrders();
    for (const order of offlineOrders) {
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        await removeOfflineOrder(order.id);
      } catch (error) {
        console.error('Failed to sync order:', order.id, error);
      }
    }
  } catch (error) {
    console.error('Sync offline orders failed:', error);
  }
}

// Sync offline product updates when back online
async function syncOfflineProducts() {
  try {
    const offlineProducts = await getOfflineProducts();
    for (const product of offlineProducts) {
      try {
        await fetch(`/api/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
        await removeOfflineProduct(product.id);
      } catch (error) {
        console.error('Failed to sync product:', product.id, error);
      }
    }
  } catch (error) {
    console.error('Sync offline products failed:', error);
  }
}

// IndexedDB operations for offline storage
async function getOfflineOrders() {
  // Implementation would use IndexedDB to retrieve offline orders
  return [];
}

async function removeOfflineOrder(orderId) {
  // Implementation would remove synced order from IndexedDB
}

async function getOfflineProducts() {
  // Implementation would use IndexedDB to retrieve offline product updates
  return [];
}

async function removeOfflineProduct(productId) {
  // Implementation would remove synced product from IndexedDB
}