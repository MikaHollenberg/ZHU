// Minimale service worker: cachet de app-shell zodat Chrome de installatie-
// prompt aanbiedt en de app na installatie ook bij een wisselvallige
// verbinding snel opstart. Supabase-verkeer (ander domein) raakt dit
// sowieso nooit, want same-origin-check hieronder sluit dat vanzelf uit.
const CACHE_VERSION = 'zhu-v1'
const CORE_ASSETS = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {
        // Een enkel ontbrekend asset mag de install niet laten falen.
      }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  // Navigatie (React Router-routes): probeer eerst het net, val bij een
  // mislukte fetch (offline) terug op de gecachte app-shell.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }

  // Overige same-origin assets: stale-while-revalidate — toon direct wat er
  // in de cache staat (snel, werkt offline), ververs de cache op de
  // achtergrond zodat een volgend bezoek de nieuwste versie heeft.
  event.respondWith(
    caches.match(request).then((cached) => {
      const netwerkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const kopie = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, kopie))
          }
          return response
        })
        .catch(() => cached)
      return cached || netwerkFetch
    }),
  )
})
