/**
 * Service Worker for Spades 27 — enables offline play.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 */

const CACHE_NAME = 'spades27-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './locales.js',
  './card.js',
  './player.js',
  './ai.js',
  './audio.js',
  './stats.js',
  './ui-helpers.js',
  './game.js',
  './game-fx.js',
  './manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

// Stale-while-revalidate: serve from cache for speed/offline, refresh the
// cache in the background so deployed updates reach returning users.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(resp => {
        if (resp && resp.ok && new URL(e.request.url).origin === self.location.origin) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => cached || caches.match('./index.html'));
      return cached || fresh;
    })
  );
});
