const CACHE_NAME = 'jywanonton-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/about.html',
  '/css/style.css',
  '/js/app.js',
  '/img/logo-dark.png',
  '/img/logo-light.png',
  '/site.webmanifest',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

// Install Event - Caching static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Cleaning up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Cache first, then network for static assets
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Skip caching for API calls to ensure fresh data
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache new static resources on the fly
        if (
          event.request.url.includes('.css') ||
          event.request.url.includes('.js') ||
          event.request.url.includes('.png') ||
          event.request.url.includes('.jpg') ||
          event.request.url.includes('.webp') ||
          event.request.url.includes('.html')
        ) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      });
    })
  );
});
