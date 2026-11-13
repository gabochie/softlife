const SW_VERSION = 'softlife-v3';
const SHELL = [
  '/', '/index.html', '/css/app.css', '/js/api.js', '/js/store.js', '/js/app.js',
  '/manifest.webmanifest', '/assets/icons/icon-192.png', '/assets/icons/icon-512.png',
  '/assets/audio/retail-sample.mp3'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SW_VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SW_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit ||
      fetch(e.request).then((res) => {
        if (url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(SW_VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match('/index.html'))
    )
  );
});
