/**
 * Service Worker for Eras App
 * Handles asset caching and push notifications
 */

const CACHE_NAME = 'eras-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', event);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      // Cache assets individually, ignoring failures for missing files
      return Promise.allSettled(
        STATIC_ASSETS.map(url => 
          cache.add(url).catch(err => {
            console.log('[Service Worker] Failed to cache', url, '(non-critical)');
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate event - Cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', event);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - Network first, falling back to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For API requests, we generally want network first, but let the app handle offline data via IndexedDB
  // For static assets (JS, CSS, Images), we want to cache them
  
  const isApiRequest = event.request.url.includes('/functions/v1/');
  const isSupabaseRequest = event.request.url.includes('supabase.co');
  
  if (isApiRequest || isSupabaseRequest) {
    // API/Data requests: Let the browser/app handle it (we use useOfflineSync and IndexedDB in app)
    return;
  }

  // Static assets strategy: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache the new response
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });

      // Return cached response immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});

// Push Notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Eras Notification';
    const options = {
      body: data.body || 'You have a new update.',
      icon: '/icon-192x192.png', // Assuming these exist or will exist
      badge: '/badge-72x72.png',
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (e) {
    console.error('Error handling push event:', e);
  }
});

// Notification Click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
