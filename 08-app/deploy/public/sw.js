const SW_VERSION = 'softlife-v31';
const SHELL = [
  '/', '/index.html', '/products/', '/consultation/', '/contact/', '/legal/cookies/', '/blog/', '/tools/scorecard.html', '/tools/audit.html', '/tools/clarity.html', '/llms.txt', '/css/app.css', '/js/api.js', '/js/store.js', '/js/app.js',
  '/manifest.webmanifest', '/assets/icons/icon-192.png', '/assets/icons/icon-512.png', '/assets/logo-softlife.png', '/assets/logo-softlife-header.png', '/assets/hero-soft-life.jpg', '/assets/hero-soft-life-square.jpg',
  '/assets/audio/retail-sample.mp3', '/assets/blog/og-default.png'
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

  // Network-first for everything, cache as offline fallback. Static assets
  // revalidate from the network so deploys and dev edits show up without a
  // version bump.
  e.respondWith(
    fetch(e.request).then((res) => {
      if (url.origin === self.location.origin && res.ok) {
        const copy = res.clone();
        caches.open(SW_VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() =>
      caches.match(e.request).then((hit) => hit || caches.match('/index.html'))
    )
  );
});
