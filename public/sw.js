// Advanced Service Worker for Perfect Performance
// Troy BBQ - Restaurant-Speed Performance Optimization

const CACHE_VERSION = 'troy-bbq-v1.5.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Critical resources for instant loading
const CRITICAL_RESOURCES = [
  '/',
  '/offline.html',
  '/assets/styles-*.css',
  '/chunks/react-core-*.js',
  '/chunks/ui-lib-*.js',
  '/chunks/utils-*.js',
  '/manifest.json'
];

// Resources to cache on first visit
const CACHE_FIRST_RESOURCES = [
  '/menu',
  '/about',
  '/contact',
  '/assets/images/',
  '/favicon.ico'
];

// Network-first resources (always try network first)
const NETWORK_FIRST_RESOURCES = [
  '/api/',
  '/admin/',
  '/catering/',
  '/checkout',
  '/cart'
];

// Background sync for critical actions
const BACKGROUND_SYNC_TAGS = {
  ORDER_SUBMISSION: 'order-submission',
  CATERING_QUOTE: 'catering-quote',
  CONTACT_FORM: 'contact-form'
};

// Performance optimizations
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only'
};

// Install Event - Aggressive pre-caching
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    Promise.all([
      // Cache critical resources immediately
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(CRITICAL_RESOURCES.filter(url => !url.includes('*')));
      }),

      // Initialize other caches
      caches.open(DYNAMIC_CACHE),
      caches.open(IMAGE_CACHE),
      caches.open(API_CACHE),

      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.startsWith(CACHE_VERSION)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch Event - Intelligent caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Determine caching strategy based on URL
  const strategy = determineStrategy(url.pathname, request);

  event.respondWith(handleRequest(request, strategy));
});

// Determine optimal caching strategy
function determineStrategy(pathname, request) {
  // API requests - Network first with aggressive caching
  if (pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }

  // Admin pages - Network only (always fresh)
  if (pathname.startsWith('/admin/')) {
    return CACHE_STRATEGIES.NETWORK_ONLY;
  }

  // Images - Cache first with stale-while-revalidate
  if (request.destination === 'image' || pathname.match(/\.(jpg|jpeg|png|webp|avif|svg)$/)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }

  // CSS/JS assets - Cache first
  if (pathname.match(/\.(css|js)$/) || pathname.startsWith('/assets/') || pathname.startsWith('/chunks/')) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }

  // Critical pages - Stale while revalidate
  if (['/', '/menu', '/catering', '/about', '/contact'].includes(pathname)) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }

  // Dynamic content - Network first
  if (['/cart', '/checkout', '/track-order'].includes(pathname)) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }

  // Default - Stale while revalidate
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
}

// Handle request with specific strategy
async function handleRequest(request, strategy) {
  const url = new URL(request.url);
  const cacheKey = request.url;

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheKey);

    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheKey);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheKey);

    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);

    default:
      return staleWhileRevalidate(request, cacheKey);
  }
}

// Cache First Strategy
async function cacheFirst(request, cacheKey) {
  const cacheName = getCacheName(request);
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(cacheKey);

  if (cachedResponse) {
    // Return cached version immediately
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(cacheKey, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache first failed:', error);
    return getOfflineFallback(request);
  }
}

// Network First Strategy
async function networkFirst(request, cacheKey) {
  const cacheName = getCacheName(request);
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 3000)
      )
    ]);

    if (networkResponse.ok) {
      // Cache successful responses with TTL
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());

      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      cache.put(cacheKey, cachedResponse);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network first fallback to cache:', error);

    // Fallback to cache
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    return getOfflineFallback(request);
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheKey) {
  const cacheName = getCacheName(request);
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(cacheKey);

  // Always try to fetch fresh content in background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(cacheKey, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.log('[SW] Background fetch failed:', error);
  });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // If no cache, wait for network
  try {
    return await fetchPromise;
  } catch (error) {
    return getOfflineFallback(request);
  }
}

// Network Only Strategy
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return getOfflineFallback(request);
  }
}

// Get appropriate cache name
function getCacheName(request) {
  const url = new URL(request.url);

  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|webp|avif|svg)$/)) {
    return IMAGE_CACHE;
  }

  if (url.pathname.startsWith('/api/')) {
    return API_CACHE;
  }

  if (url.pathname.match(/\.(css|js)$/) || url.pathname.startsWith('/assets/') || url.pathname.startsWith('/chunks/')) {
    return STATIC_CACHE;
  }

  return DYNAMIC_CACHE;
}

// Offline fallback responses
async function getOfflineFallback(request) {
  const url = new URL(request.url);

  // HTML pages
  if (request.destination === 'document') {
    const offlineCache = await caches.open(STATIC_CACHE);
    const offlinePage = await offlineCache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }

  // Images
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" fill="#ddd"><rect width="100%" height="100%" fill="#f5f5f5"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" text-anchor="middle" dy=".3em" fill="#999">Image Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }

  // Default offline response
  return new Response('Offline - Please check your connection', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Background Sync for critical actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);

  switch (event.tag) {
    case BACKGROUND_SYNC_TAGS.ORDER_SUBMISSION:
      event.waitUntil(syncOrders());
      break;

    case BACKGROUND_SYNC_TAGS.CATERING_QUOTE:
      event.waitUntil(syncCateringQuotes());
      break;

    case BACKGROUND_SYNC_TAGS.CONTACT_FORM:
      event.waitUntil(syncContactForms());
      break;
  }
});

// Sync offline orders
async function syncOrders() {
  try {
    const db = await openDB('troy-bbq-offline', 1);
    const tx = db.transaction('orders', 'readonly');
    const orders = await tx.objectStore('orders').getAll();

    for (const order of orders) {
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });

        // Remove from offline storage on success
        const deleteTx = db.transaction('orders', 'readwrite');
        await deleteTx.objectStore('orders').delete(order.id);
      } catch (error) {
        console.log('[SW] Failed to sync order:', order.id, error);
      }
    }
  } catch (error) {
    console.log('[SW] Sync orders failed:', error);
  }
}

// Sync catering quotes
async function syncCateringQuotes() {
  try {
    const db = await openDB('troy-bbq-offline', 1);
    const tx = db.transaction('quotes', 'readonly');
    const quotes = await tx.objectStore('quotes').getAll();

    for (const quote of quotes) {
      try {
        await fetch('/api/catering/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quote)
        });

        const deleteTx = db.transaction('quotes', 'readwrite');
        await deleteTx.objectStore('quotes').delete(quote.id);
      } catch (error) {
        console.log('[SW] Failed to sync quote:', quote.id, error);
      }
    }
  } catch (error) {
    console.log('[SW] Sync quotes failed:', error);
  }
}

// Sync contact forms
async function syncContactForms() {
  try {
    const db = await openDB('troy-bbq-offline', 1);
    const tx = db.transaction('contacts', 'readonly');
    const contacts = await tx.objectStore('contacts').getAll();

    for (const contact of contacts) {
      try {
        await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contact)
        });

        const deleteTx = db.transaction('contacts', 'readwrite');
        await deleteTx.objectStore('contacts').delete(contact.id);
      } catch (error) {
        console.log('[SW] Failed to sync contact:', contact.id, error);
      }
    }
  } catch (error) {
    console.log('[SW] Sync contacts failed:', error);
  }
}

// IndexedDB helper
function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);

    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('quotes')) {
        db.createObjectStore('quotes', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { keyPath: 'id' });
      }
    };
  });
}

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PERFORMANCE_MEASURE') {
    const { name, value } = event.data;
    console.log(`[SW] Performance ${name}:`, value);

    // Report critical performance metrics
    if (name === 'LCP' && value > 1200) {
      console.warn('[SW] LCP above target:', value);
    }

    if (name === 'FID' && value > 50) {
      console.warn('[SW] FID above target:', value);
    }

    if (name === 'CLS' && value > 0.05) {
      console.warn('[SW] CLS above target:', value);
    }
  }
});

// Prefetch critical resources on idle
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PREFETCH_RESOURCES') {
    event.waitUntil(prefetchResources(event.data.urls));
  }
});

// Prefetch resources during idle time
async function prefetchResources(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);

  for (const url of urls) {
    try {
      const response = await fetch(url, { priority: 'low' });
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.log('[SW] Prefetch failed for:', url, error);
    }
  }
}

console.log('[SW] Troy BBQ Service Worker loaded - Restaurant Performance Mode');