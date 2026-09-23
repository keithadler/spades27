/**
 * Service Worker for Spades 27 — enables offline play.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 */

const CACHE_NAME = 'spades27-v9';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './locales.js',
  './card.js',
  './card-art.js',
  './player.js',
  './rules.js',
  './ai.js',
  './audio.js',
  './stats.js',
  './ui-helpers.js',
  './game.js',
  './game-fx.js',
  './manifest.json',
  './portraits/01.webp',
  './portraits/02.webp',
  './portraits/03.webp',
  './portraits/04.webp',
  './portraits/05.webp',
  './portraits/06.webp',
  './portraits/07.webp',
  './portraits/08.webp',
  './portraits/09.webp',
  './portraits/10.webp',
  './portraits/11.webp',
  './portraits/12.webp',
  './portraits/13.webp',
  './portraits/14.webp',
  './portraits/15.webp',
  './portraits/16.webp',
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
