const CACHE_NAME = 'shadow-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap',
  'https://fonts.gstatic.com/s/spacesgrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPb54C_k3HqUtEw.woff2',
  'https://fonts.gstatic.com/s/dmsans/v14/rP2Hp2ywxg089UriCZ2IHSeH.woff2',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

/* Install */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

/* Activate - hapus cache lama */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

/* Fetch */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Skip request chrome-extension dan non-GET */
  if (url.protocol === 'chrome-extension:' || e.request.method !== 'GET') return;

  /* Font & Library: cache first */
  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'unpkg.com') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  /* Google Fonts CSS: network first, fallback cache */
  if (url.hostname === 'fonts.googleapis.com') {
    e.respondWith(
      fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  /* Halaman sendiri: network first, fallback cache */
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  /* Lainnya: coba fetch, fallback cache */
  e.respondWith(
    fetch(e.request).then(response => {
      return response;
    }).catch(() => caches.match(e.request))
  );
});