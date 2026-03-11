// Service Worker for Health Workers PWA
// Enables offline functionality, asset caching, and background sync

const CACHE_NAME = "health-workers-v1";
const RUNTIME_CACHE = "health-workers-runtime-v1";
const OFFLINE_URL = "/offline.html";

// Static assets to cache on install (only truly static files)
const PRECACHE_URLS = ["/offline.html", "/manifest.json", "/favicon.ico"];

// Cache strategies
const CACHE_STRATEGIES = {
  NETWORK_FIRST: "network-first",
  CACHE_FIRST: "cache-first",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
};

/**
 * Install event - cache critical resources
 */
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Caching critical assets");
        // Use individual cache.add calls so one failure doesn't block the rest
        return Promise.allSettled(
          PRECACHE_URLS.map((url) => cache.add(url).catch((err) => {
            console.warn("[ServiceWorker] Failed to cache:", url, err);
          }))
        );
      }),
  );

  // Force service worker to become active immediately
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE,
          )
          .map((cacheName) => {
            console.log("[ServiceWorker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }),
      );
    }),
  );

  // Clients.claim allows this ServiceWorker to claim all clients immediately
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage("sw-activated"));
  });
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // API requests - network first with cache fallback
  if (url.pathname.includes("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - cache first with network fallback
  if (
    url.pathname.includes("/public/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".gif") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages - stale while revalidate
  if (url.pathname.endsWith(".html") || !url.pathname.includes(".")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default - network first
  event.respondWith(networkFirst(request));
});

/**
 * Network first strategy - try network, fall back to cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log(
      "[ServiceWorker] Network request failed, using cache",
      request.url,
    );
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match(OFFLINE_URL);
    }

    // Return a 503 response for other requests
    return new Response("Service unavailable", { status: 503 });
  }
}

/**
 * Cache first strategy - try cache, fall back to network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Still try to update cache in background
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const cache = caches.open(RUNTIME_CACHE);
          cache.then((c) => c.put(request, networkResponse.clone()));
        }
      })
      .catch(() => {
        // Network failed, cache served user
      });

    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log(
      "[ServiceWorker] Cache miss and network unavailable",
      request.url,
    );
    return new Response("Resource not found and network unavailable", {
      status: 404,
    });
  }
}

/**
 * Stale while revalidate strategy - return cache immediately, update in background
 */
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(RUNTIME_CACHE);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

/**
 * Background sync for offline queue
 * Triggered when device comes back online
 */
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-queue") {
    event.waitUntil(syncOfflineQueue());
  }
});

/**
 * Sync offline queue by notifying clients
 */
async function syncOfflineQueue() {
  console.log("[ServiceWorker] Syncing offline queue...");

  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: "SYNC_OFFLINE_QUEUE",
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Message event - handle client messages
 */
self.addEventListener("message", (event) => {
  if (!event.data) return;
  const { type, data } = event.data;

  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (type === "CLEAR_CACHE") {
    caches.delete(CACHE_NAME);
    caches.delete(RUNTIME_CACHE);
    console.log("[ServiceWorker] Caches cleared");
  }

  if (type === "REQUEST_PRELOAD") {
    // Preload specific URLs when client requests
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(data.urls || []);
      }),
    );
  }
});

/**
 * Push notification event (for future features)
 */
self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/favicon.ico",
    badge: "/badge-icon.png",
    tag: data.tag || "health-worker-notification",
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Health Workers", options),
  );
});

/**
 * Notification click event
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      // Open app if not open
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    }),
  );
});

console.log("[ServiceWorker] Loaded and ready to serve");
