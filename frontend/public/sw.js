// Optimized Service Worker for KhoAugment POS PWA with dashboard data caching
const CACHE_NAME = 'khoaugment-pos-v2';
const RUNTIME_CACHE = 'runtime-cache-v2';
const DASHBOARD_CACHE = 'dashboard-cache-v2';
const API_CACHE = 'api-cache-v2';
const OFFLINE_URL = '/offline.html';

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  STATIC: 7 * 24 * 60 * 60 * 1000,      // 7 days
  DASHBOARD: 5 * 60 * 1000,              // 5 minutes
  API_DATA: 30 * 60 * 1000,              // 30 minutes
  IMAGES: 24 * 60 * 60 * 1000,           // 24 hours
};

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/static/js/main.js',
  '/static/css/main.css',
];

// Dashboard-specific API endpoints with shorter cache times
const DASHBOARD_API_PATTERNS = [
  { pattern: /\/api\/v1\/analytics\/dashboard/, ttl: CACHE_DURATIONS.DASHBOARD },
  { pattern: /\/api\/v1\/analytics\/kpis/, ttl: CACHE_DURATIONS.DASHBOARD },
  { pattern: /\/api\/v1\/analytics\/top-products/, ttl: CACHE_DURATIONS.DASHBOARD },
  { pattern: /\/api\/v1\/analytics\/low-stock/, ttl: CACHE_DURATIONS.DASHBOARD },
  { pattern: /\/api\/v1\/analytics\/revenue-chart/, ttl: CACHE_DURATIONS.DASHBOARD },
  { pattern: /\/api\/v1\/analytics\/sales-chart/, ttl: CACHE_DURATIONS.DASHBOARD },
];

// Regular API endpoints with longer cache times
const API_CACHE_PATTERNS = [
  { pattern: /\/api\/v1\/products/, ttl: CACHE_DURATIONS.API_DATA },
  { pattern: /\/api\/v1\/categories/, ttl: CACHE_DURATIONS.API_DATA },
  { pattern: /\/api\/v1\/customers/, ttl: CACHE_DURATIONS.API_DATA },
  { pattern: /\/api\/v1\/settings/, ttl: CACHE_DURATIONS.API_DATA },
];

// API endpoints that should work offline (queue for sync)
const OFFLINE_SYNC_PATTERNS = [
  /\/api\/v1\/orders/,
  /\/api\/v1\/inventory/,
  /\/api\/v1\/payments/,
];

// Utility functions
function isExpired(timestamp, ttl) {
  return Date.now() - timestamp > ttl;
}

function addTimestamp(response) {
  const responseInit = {
    status: response.status,
    statusText: response.statusText,
    headers: {},
  };
  
  response.headers.forEach((value, key) => {
    responseInit.headers[key] = value;
  });
  
  responseInit.headers['sw-cache-timestamp'] = Date.now().toString();
  
  return new Response(response.body, responseInit);
}

function getTimestamp(response) {
  const timestamp = response.headers.get('sw-cache-timestamp');
  return timestamp ? parseInt(timestamp, 10) : 0;
}

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      caches.open(DASHBOARD_CACHE),
      caches.open(API_CACHE),
      caches.open(RUNTIME_CACHE),
    ]).then(() => {
      console.log('[SW] Static resources cached successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== DASHBOARD_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle different types of requests
  if (isDashboardAPI(url.pathname)) {
    event.respondWith(handleDashboardAPI(request));
  } else if (isRegularAPI(url.pathname)) {
    event.respondWith(handleRegularAPI(request));
  } else if (isOfflineSyncAPI(url.pathname)) {
    event.respondWith(handleOfflineSyncAPI(request));
  } else if (isStaticResource(url.pathname)) {
    event.respondWith(handleStaticResource(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Check if URL is a dashboard API endpoint
function isDashboardAPI(pathname) {
  return DASHBOARD_API_PATTERNS.some(({ pattern }) => pattern.test(pathname));
}

// Check if URL is a regular API endpoint
function isRegularAPI(pathname) {
  return API_CACHE_PATTERNS.some(({ pattern }) => pattern.test(pathname));
}

// Check if URL is an offline sync API endpoint
function isOfflineSyncAPI(pathname) {
  return OFFLINE_SYNC_PATTERNS.some(pattern => pattern.test(pathname));
}

// Check if URL is a static resource
function isStaticResource(pathname) {
  return pathname.startsWith('/static/') || 
         pathname.endsWith('.js') || 
         pathname.endsWith('.css') || 
         pathname.endsWith('.png') || 
         pathname.endsWith('.jpg') || 
         pathname.endsWith('.svg');
}

// Handle dashboard API requests with short cache TTL
async function handleDashboardAPI(request) {
  const url = new URL(request.url);
  const cacheKey = url.pathname + url.search;
  
  try {
    const cache = await caches.open(DASHBOARD_CACHE);
    const cachedResponse = await cache.match(cacheKey);
    
    // Check if cached response is still valid
    if (cachedResponse) {
      const timestamp = getTimestamp(cachedResponse);
      const ttl = getDashboardTTL(url.pathname);
      
      if (!isExpired(timestamp, ttl)) {
        console.log('[SW] Serving dashboard data from cache:', cacheKey);
        return cachedResponse;
      } else {
        console.log('[SW] Dashboard cache expired for:', cacheKey);
        await cache.delete(cacheKey);
      }
    }

    // Fetch fresh data
    console.log('[SW] Fetching fresh dashboard data:', cacheKey);
    const response = await fetch(request);
    
    if (response.ok) {
      const responseToCache = addTimestamp(response.clone());
      await cache.put(cacheKey, responseToCache);
      console.log('[SW] Dashboard data cached:', cacheKey);
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Dashboard API error:', error);
    
    // Try to serve stale cache as fallback
    const cache = await caches.open(DASHBOARD_CACHE);
    const staleResponse = await cache.match(cacheKey);
    
    if (staleResponse) {
      console.log('[SW] Serving stale dashboard data:', cacheKey);
      return staleResponse;
    }
    
    // Return empty data structure for dashboard
    return new Response(JSON.stringify({
      success: false,
      error: { message: 'Offline - không thể tải dữ liệu dashboard', code: 'OFFLINE_ERROR' },
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
}

// Handle regular API requests with longer cache TTL
async function handleRegularAPI(request) {
  const url = new URL(request.url);
  const cacheKey = url.pathname + url.search;
  
  try {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(cacheKey);
    
    // Check if cached response is still valid
    if (cachedResponse) {
      const timestamp = getTimestamp(cachedResponse);
      const ttl = getAPITTL(url.pathname);
      
      if (!isExpired(timestamp, ttl)) {
        console.log('[SW] Serving API data from cache:', cacheKey);
        
        // Start background refresh for critical data
        if (isCriticalAPI(url.pathname)) {
          event.waitUntil(refreshAPICache(request, cache, cacheKey));
        }
        
        return cachedResponse;
      } else {
        await cache.delete(cacheKey);
      }
    }

    // Fetch fresh data
    const response = await fetch(request);
    
    if (response.ok) {
      const responseToCache = addTimestamp(response.clone());
      await cache.put(cacheKey, responseToCache);
    }
    
    return response;
  } catch (error) {
    console.error('[SW] API error:', error);
    
    // Serve stale cache as fallback
    const cache = await caches.open(API_CACHE);
    const staleResponse = await cache.match(cacheKey);
    
    if (staleResponse) {
      return staleResponse;
    }
    
    throw error;
  }
}

// Handle offline sync API requests
async function handleOfflineSyncAPI(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Offline sync - queueing request:', request.url);
    
    // Store request for background sync
    await storeOfflineRequest(request);
    
    return new Response(JSON.stringify({
      success: false,
      error: { message: 'Request queued for sync', code: 'OFFLINE_QUEUED' },
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 202
    });
  }
}

// Handle static resources
async function handleStaticResource(request) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const timestamp = getTimestamp(cachedResponse);
      if (!isExpired(timestamp, CACHE_DURATIONS.STATIC)) {
        return cachedResponse;
      }
    }

    const response = await fetch(request);
    
    if (response.ok) {
      const responseToCache = addTimestamp(response.clone());
      await cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(RUNTIME_CACHE);
    const staleResponse = await cache.match(request);
    
    if (staleResponse) {
      return staleResponse;
    }
    
    throw error;
  }
}

// Handle page requests
async function handlePageRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Serve offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(OFFLINE_URL);
    }
    throw error;
  }
}

// Utility functions
function getDashboardTTL(pathname) {
  const pattern = DASHBOARD_API_PATTERNS.find(({ pattern }) => pattern.test(pathname));
  return pattern ? pattern.ttl : CACHE_DURATIONS.DASHBOARD;
}

function getAPITTL(pathname) {
  const pattern = API_CACHE_PATTERNS.find(({ pattern }) => pattern.test(pathname));
  return pattern ? pattern.ttl : CACHE_DURATIONS.API_DATA;
}

function isCriticalAPI(pathname) {
  return pathname.includes('/products') || pathname.includes('/categories');
}

async function refreshAPICache(request, cache, cacheKey) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = addTimestamp(response.clone());
      await cache.put(cacheKey, responseToCache);
      console.log('[SW] Background refresh completed:', cacheKey);
    }
  } catch (error) {
    console.error('[SW] Background refresh failed:', error);
  }
}

async function storeOfflineRequest(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: {},
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now(),
    };
    
    for (const [key, value] of request.headers.entries()) {
      requestData.headers[key] = value;
    }

    // Store in IndexedDB for background sync
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline_requests'], 'readwrite');
    const store = transaction.objectStore('offline_requests');
    await store.add(requestData);
    
    console.log('[SW] Request stored for offline sync:', request.url);
  } catch (error) {
    console.error('[SW] Failed to store offline request:', error);
  }
}

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineSync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline_requests')) {
        db.createObjectStore('offline_requests', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncOfflineRequests());
  }
});

async function syncOfflineRequests() {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline_requests'], 'readonly');
    const store = transaction.objectStore('offline_requests');
    const requests = await store.getAll();
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });
        
        if (response.ok) {
          // Remove successfully synced request
          const deleteTransaction = db.transaction(['offline_requests'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('offline_requests');
          await deleteStore.delete(requestData.id);
          
          console.log('[SW] Offline request synced:', requestData.url);
        }
      } catch (error) {
        console.error('[SW] Failed to sync request:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_DASHBOARD_CACHE':
      event.waitUntil(clearDashboardCache());
      break;
      
    case 'CLEAR_ALL_CACHE':
      event.waitUntil(clearAllCaches());
      break;
      
    case 'PREFETCH_DASHBOARD':
      event.waitUntil(prefetchDashboardData());
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

async function clearDashboardCache() {
  try {
    await caches.delete(DASHBOARD_CACHE);
    console.log('[SW] Dashboard cache cleared');
  } catch (error) {
    console.error('[SW] Failed to clear dashboard cache:', error);
  }
}

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear all caches:', error);
  }
}

async function prefetchDashboardData() {
  try {
    const dashboardUrls = [
      '/api/v1/analytics/dashboard',
      '/api/v1/analytics/top-products?limit=5',
      '/api/v1/analytics/low-stock?limit=5',
      '/api/v1/analytics/revenue-chart?days=7',
    ];
    
    await Promise.all(
      dashboardUrls.map(url => 
        fetch(url).then(response => {
          if (response.ok) {
            console.log('[SW] Prefetched:', url);
          }
        }).catch(error => {
          console.warn('[SW] Prefetch failed:', url, error);
        })
      )
    );
  } catch (error) {
    console.error('[SW] Dashboard prefetch error:', error);
  }
}

console.log('[SW] Service Worker loaded and ready');