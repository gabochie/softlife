/* ============================================================================
   NAV RENDERER + CLICK INSTRUMENTATION
   Renders marketing nav on static pages from nav-config.js and records every
   nav interaction as a GA4 `nav_click` event. Product nav (member/admin) is
   rendered by app.js from the same config.
   ========================================================================== */
(function () {
  'use strict';

  var NAV = window.SL_NAV && window.SL_NAV.surfaces;
  if (!NAV) {
    console.error('[nav] SL_NAV missing — /js/nav-config.js must load before /js/nav.js');
    return;
  }

  var path = location.pathname;
  var authed = false;
  try { authed = !!localStorage.getItem('softlife_token'); } catch (e) {}

  function visible(item) {
    if (!item.when) return true;
    return item.when === 'guest' ? !authed : authed;
  }

  function isActive(href) {
    if (href === '/') return path === '/' || path === '/index.html';
    return path === href;
  }

  function link(item) {
    var html = '<a href="' + item.href + '" data-sl-item="' + item.label + '"';
    if (isActive(item.href)) html += ' aria-current="page"';
    return html + '>' + item.label + '</a>';
  }

  function links(items) {
    return items.filter(visible).map(link).join('');
  }

  function cta(def) {
    var c = (authed && def.ctaAuth) ? def.ctaAuth : def.cta;
    return c ? '<a class="top-cta" href="' + c.href + '" data-sl-item="' + c.label + '">' + c.label + '</a>' : '';
  }

  function renderSurface(surface, def) {
    var nodes = document.querySelectorAll('[data-sl-surface="' + surface + '"]');
    if (!nodes.length) return;
    nodes.forEach(function (node) {
      if (surface === 'web_header') {
        node.innerHTML = links(def.items) + cta(def);
      } else if (surface === 'public_bottom') {
        node.innerHTML = '<div class="wrap tabs">' + links(def.items) + '</div>';
      } else if (surface === 'footer_explore') {
        node.innerHTML = '<b>Explore</b>' + links(def.items);
      }
      // member_bottom and admin_bottom are rendered by app.js from the same config.
    });
  }

  Object.keys(NAV).forEach(function (surface) {
    renderSurface(surface, NAV[surface]);
  });

  /* Delegated so it also catches nav rendered later by the SPA. */
  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || !target.closest) return;
    var el = target.closest('a, button[data-target]');
    if (!el) return;
    var host = el.closest('[data-sl-surface]');
    if (!host) return;

    var surface = host.getAttribute('data-sl-surface');
    var item = el.getAttribute('data-sl-item') || (el.textContent || '').trim();
    var destination = el.getAttribute('href') || el.getAttribute('data-target') || '';

    if (window.slTrack) {
      window.slTrack('nav_click', {
        surface: surface,
        item: item,
        destination: destination
      });
    }
  });
})();
