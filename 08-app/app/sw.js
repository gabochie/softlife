const SW_VERSION = 'softlife-v31';
const SHELL = [
  '/', '/index.html', '/products/', '/consultation/', '/contact/', '/legal/cookies/', '/blog/', '/tools/scorecard.html', '/tools/audit.html', '/tools/clarity.html', '/llms.txt', '/css/app.css', '/js/api.js', '/js/store.js', '/js/app.js',
  '/manifest.webmanifest', '/assets/icons/icon-192.png', '/assets/icons/icon-512.png', '/assets/logo-softlife.webp', '/assets/logo-softlife-header.webp', '/assets/hero-soft-life.webp', '/assets/hero-soft-life-square.webp',
  '/assets/audio/retail-sample.mp3', '/assets/blog/og-default.png'
];

// Static assets have version-stamped URLs (stamp.py) or immutable filenames,
// so a cache-first strategy is safe and makes repeat visits instant.
const STATIC_ASSET = /\.(?:js|css|webp|png|jpe?g|gif|svg|ico|woff2?|mp3|webmanifest)$/i;

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

async function cacheFirst(req) {
  const cache = await caches.open(SW_VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  const cache = await caches.open(SW_VERSION);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req)) || (await cache.match('/index.html')) || Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // APIs must always hit the network — never serve stale purchases/claims/leads.
  if (url.pathname.startsWith('/api/')) return;

  if (STATIC_ASSET.test(url.pathname)) {
    e.respondWith(cacheFirst(e.request));
  } else {
    // Navigations, HTML pages and data endpoints: fresh first, cached offline.
    e.respondWith(networkFirst(e.request));
  }
});
