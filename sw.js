const CACHE_NAME = 'epresensi-cache-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700;1,800&display=swap',
  'https://unpkg.com/html5-qrcode'
];

// 1. Install & Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// 2. Aktivasi & Hapus Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Intercept Fetch (Offline Support)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Hanya intercept GET request (Abaikan Firebase Database requests)
  if (
    event.request.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    event.request.url.includes('firebasedatabase')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then(fetchResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    }).catch(() => caches.match('./index.html'))
  );
});

// 4. Background Sync API
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-absen') {
    event.waitUntil(
      // Memicu sinkronisasi ke client yang terbuka
      self.clients.matchAll().then((clients) => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_OFFLINE_DATA' }));
      })
    );
  }
});
