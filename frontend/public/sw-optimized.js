// Production-ready service worker for KhoAugment POS (ONLINE ONLY)
// This service worker does NOT implement offline functionality per project requirements
// It only provides basic caching for static assets and security features

const CACHE_NAME = 'khoaugment-pos-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Security headers added by SW
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://kho1-api.bangachieu2.workers.dev",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Install event - cache only minimal static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Only cache minimal static resources
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching minimal static resources');
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - ONLINE ONLY implementation
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and non-HTTP/HTTPS URLs
  if (request.method !== 'GET' || 
      !['http:', 'https:'].includes(url.protocol)) {
    return;
  }
  
  // Handle static asset requests (with cache)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // For API requests - ALWAYS go to network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // For navigation requests - add security headers
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Default - network only with timeout fallback
  event.respondWith(
    fetch(request)
      .catch(error => {
        console.error('[SW] Fetch failed:', error);
        // No offline fallback - just show the error
        return new Response('Network error', { 
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Check if URL is a static asset
function isStaticAsset(pathname) {
  return pathname.startsWith('/static/') || 
         pathname.startsWith('/assets/') ||
         pathname.startsWith('/icons/') ||
         pathname.endsWith('.js') || 
         pathname.endsWith('.css') || 
         pathname.endsWith('.png') || 
         pathname.endsWith('.jpg') || 
         pathname.endsWith('.svg');
}

// Handle static asset requests
async function handleStaticAsset(request) {
  // Try network first
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone the response before putting in cache
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, responseClone);
      });
      return response;
    }
  } catch (error) {
    console.log('[SW] Network fetch failed for static asset, trying cache');
  }
  
  // Try cache if network fails
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, go to network as fallback
  return fetch(request);
}

// Handle API requests - always online
async function handleApiRequest(request) {
  try {
    // Always go to network for API requests
    return await fetch(request);
  } catch (error) {
    console.error('[SW] API request failed:', error);
    // Return a useful error response
    return new Response(JSON.stringify({
      success: false,
      error: 'Network connection failed. Please check your internet connection.',
      code: 'NETWORK_ERROR'
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle navigation requests - add security headers
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone the response to add security headers
      const headers = new Headers(response.headers);
      Object.keys(SECURITY_HEADERS).forEach(key => {
        headers.set(key, SECURITY_HEADERS[key]);
      });
      
      // Create new response with security headers
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }
    return response;
  } catch (error) {
    console.error('[SW] Navigation request failed:', error);
    
    // For navigation requests, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cached version, fall back to index.html
    return caches.match('/index.html');
  }
}