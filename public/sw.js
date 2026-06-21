/* Beatfinder Portugal — Service Worker
   Estratégia:
   - App shell em cache (precache)
   - Navegações: network-first com fallback offline
   - Estáticos: stale-while-revalidate
*/
const VERSION = 'bf-v1';
const APP_SHELL = `app-shell-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;

const PRECACHE = ['/', '/offline', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Não interceptar chamadas à API / Supabase
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) return;

  // Navegações → network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/offline')))
    );
    return;
  }

  // Estáticos → stale-while-revalidate
  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
