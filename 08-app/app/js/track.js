// Soft Life public page tracker — fires one anonymous page_view per page load.
// Loaded by static marketing/blog pages; posts to /api/track (no account needed).
// The member SPA tracks its own routes inside app.js.
(function () {
  'use strict';
  var path = location.pathname;
  if (path === '/admin' || path.indexOf('/admin') === 0) return; // never track the operations suite
  var params = new URLSearchParams(location.search);
  var meta = { referrer: document.referrer || '' };
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) {
    var value = params.get(key);
    if (value) meta[key] = value;
  });
  try {
    var key = 'sl_view_' + path;
    var last = sessionStorage.getItem(key);
    var now = Date.now();
    if (last && now - Number(last) < 60 * 60 * 1000) return; // dedupe quick back-and-forth within an hour
    sessionStorage.setItem(key, String(now));
  } catch (e) { /* storage unavailable — send anyway */ }
  var body = JSON.stringify({ event: 'page_view', path: path, meta: meta });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
  } else {
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
  }
})();
