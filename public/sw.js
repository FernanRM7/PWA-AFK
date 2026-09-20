const CACHE_VERSION = "v1";
const PRECACHE_NAME = `afk-precache-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `afk-runtime-${CACHE_VERSION}`;
const PRECACHE_URLS = ["/", "/manifest.webmanifest"];
const SENSITIVE_PATH = /\/(?:api|auth|login|logout|account|profile|users?|private|admin|session|token|oauth)(?:\/|$)/i;

function reportError(scope, error) {
  console.error(`[sw] ${scope}`, error);
}

function isCacheable(request) {
  if (request.method !== "GET") return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || SENSITIVE_PATH.test(url.pathname)) return false;

  const authorization = request.headers.get("authorization");
  const cookie = request.headers.get("cookie");
  const cacheControl = request.headers.get("cache-control");
  return !authorization && !cookie && !/no-store/i.test(cacheControl || "");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((error) => {
        reportError("install", error);
        throw error;
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.has(PRECACHE_NAME)
      .then((hasCurrentCache) => {
        if (!hasCurrentCache) throw new Error("precache actual ausente");
        return caches.keys();
      })
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("afk-") && ![PRECACHE_NAME, RUNTIME_CACHE_NAME].includes(cacheName))
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim())
      .catch((error) => {
        reportError("activate", error);
        throw error;
      }),
  );
});

async function handleRequest(request) {
  if (!isCacheable(request)) return fetch(request);

  let cache;
  try {
    cache = await caches.open(RUNTIME_CACHE_NAME);
  } catch (error) {
    reportError("runtime cache open", error);
    return fetch(request);
  }

  const cachedResponse = await cache.match(request);
  const isNavigation = request.mode === "navigate" || request.destination === "document";
  if (cachedResponse && !isNavigation) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      try {
        await cache.put(request, networkResponse.clone());
      } catch (error) {
        reportError("runtime cache write", error);
      }
    }
    return networkResponse;
  } catch (error) {
    reportError("fetch", error);
    if (cachedResponse) return cachedResponse;

    if (isNavigation) {
      const offlineFallback = await caches.match("/");
      if (offlineFallback) return offlineFallback;
    }

    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});