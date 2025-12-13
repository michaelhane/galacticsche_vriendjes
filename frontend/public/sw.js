/**
 * Galactische Vrienden - Service Worker
 * Biedt offline support voor de educatieve app
 */

const CACHE_NAME = 'galactische-vrienden-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Bestanden die altijd gecached moeten worden
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/rocket.svg'
];

// API routes die we proberen te cachen
const API_CACHE_PATTERNS = [
  '/api/generate-story'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Removing old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (externe APIs, fonts, etc.)
  if (url.origin !== location.origin) {
    return;
  }

  // Skip Supabase requests - altijd live data
  if (url.hostname.includes('supabase')) {
    return;
  }

  // API requests: Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets: Cache first, network fallback
  event.respondWith(cacheFirstStrategy(request));
});

// Cache-first strategie voor statische bestanden
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Refresh cache in background
    fetchAndCache(request);
    return cachedResponse;
  }

  return fetchAndCache(request);
}

// Network-first strategie voor API requests
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);

    // Cache successful GET responses
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }

    throw error;
  }
}

// Helper: fetch and cache
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Return offline page for navigation
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    throw error;
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
