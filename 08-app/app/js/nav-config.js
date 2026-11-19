/* ============================================================================
   SINGLE SOURCE OF TRUTH — NAVIGATION
   ----------------------------------------------------------------------------
   Edit this file ONLY. Every surface (website header, public bottom bar,
   footer, member PWA bottom bar, admin bottom bar) is rendered from here.
   Static pages load nav-config.js + nav.js; the SPA loads nav-config.js
   before app.js. Do not hardcode nav items in HTML or app.js.
   ========================================================================== */
(function (root) {
  'use strict';

  root.SL_NAV = {
    version: 1,
  icons: {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/></svg>',
    tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16.5" rx="4"/><path d="M8 12.2l2.6 2.6 5.2-5.3"/></svg>',
    listen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 17.5v-5a7.5 7.5 0 0 1 15 0v5"/><rect x="3.5" y="14" width="4.2" height="6.5" rx="2.1"/><rect x="16.3" y="14" width="4.2" height="6.5" rx="2.1"/></svg>',
    affiliate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 17.5l5.4-5.4 3.4 3.4 7-7.5"/><path d="M14.5 7.5h5v5"/></svg>',
    account: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.2" r="3.9"/><path d="M4.5 20.5c1.4-3.6 4.2-5.3 7.5-5.3s6.1 1.7 7.5 5.3"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/></svg>',
    members: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8.5" r="3.4"/><path d="M2.8 20c1.2-3.2 3.6-4.8 6.2-4.8s5 1.6 6.2 4.8"/><circle cx="17.2" cy="9.5" r="2.7"/><path d="M16.4 15.3c2.5.3 4.2 1.7 5.1 4.2"/></svg>',
    audience: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.6a8.2 8.2 0 0 1-12 7.3L4 20.3l1.3-4.1A8.2 8.2 0 1 1 21 11.6z"/></svg>',
    purchases: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a1.9 1.9 0 0 1-2.7 0L3.6 13.5V4h9.5l7.5 7.5a1.9 1.9 0 0 1 0 1.9z"/><circle cx="8" cy="8" r="1.4"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5h17"/><path d="M6.5 16.5v-4"/><path d="M11 16.5V7.5"/><path d="M15.5 16.5v-6.5"/><path d="M20 16.5V4.5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5 5 6.2v5.1c0 4.3 2.9 7.6 7 9.2 4.1-1.6 7-4.9 7-9.2V6.2L12 3.5z"/><path d="m9.2 11.8 2 2 3.6-3.9"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z"/><path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/></svg>',
  },

    surfaces: {
      /* Marketing: website header (desktop). CTA is the primary conversion. */
      web_header: {
        items: [
          { label: 'Products',   href: '/products/' },
          { label: 'Free tools', href: '/tools/' },
          { label: 'About',      href: '/about/' },
          { label: 'Sign in',    href: '/#/signin', when: 'guest' }
        ],
        cta: { label: 'Start free', href: '/#/signup' },
        ctaAuth: { label: 'Open app', href: '#/dashboard' }
      },

      /* Marketing: public bottom bar (mobile + SPA public views). */
      public_bottom: {
        items: [
          { label: 'Home',       href: '/',          icon: 'home' },
          { label: 'Products',   href: '/products/', icon: 'grid' },
          { label: 'Free tools', href: '/tools/',    icon: 'spark' },
          { label: 'Start free', href: '/#/signup',  icon: 'arrow', cta: true }
        ]
      },

      /* Marketing: footer explore column. */
      footer_explore: {
        items: [
          { label: 'Products',      href: '/products/' },
          { label: 'Business Audit', href: '/consultation/' },
          { label: 'Free tools',    href: '/tools/' },
          { label: 'About',         href: '/about/' },
          { label: 'The Journal',   href: '/blog/' },
          { label: 'RSS feed',      href: '/blog/feed.xml' },
          { label: 'Free app',      href: '/#/signup' }
        ]
      },

      /* Product: member PWA bottom bar + sidebar. Icon keys map to app.js icons.
         This surface is deliberately separate from marketing nav and does not
         change when marketing nav changes. */
      member_bottom: {
        items: [
          { label: 'Dashboard', href: '#/dashboard', icon: 'home' },
          { label: 'Tasks',     href: '#/tasks',     icon: 'tasks' },
          { label: 'Listen',    href: '#/listen',    icon: 'listen' },
          { label: 'Affiliate', href: '#/affiliate', icon: 'affiliate' },
          { label: 'Account',   href: '#/account',   icon: 'account' }
        ]
      },

      /* Product: admin bottom bar. Roles gate the last three items. */
      admin_bottom: {
        items: [
          { id: 'overview',  label: 'Overview',  icon: 'grid',      roles: ['superadmin', 'sales', 'support', 'content'] },
          { id: 'analytics', label: 'Analytics', icon: 'chart',     roles: ['superadmin', 'sales', 'support', 'content'] },
          { id: 'members',   label: 'Members',   icon: 'members',   roles: ['superadmin', 'sales', 'support', 'content'] },
          { id: 'audience',  label: 'Audience',  icon: 'audience',  roles: ['superadmin', 'sales', 'support', 'content'] },
          { id: 'purchases', label: 'Purchases', icon: 'purchases', roles: ['superadmin', 'sales', 'support', 'content'] },
          { id: 'referrals', label: 'Referrals', icon: 'share',     roles: ['superadmin', 'sales', 'support', 'content'] },
          { id: 'team',      label: 'Team',      icon: 'members',   roles: ['superadmin'] },
          { id: 'webhooks',  label: 'Webhooks',  icon: 'purchases', roles: ['superadmin', 'sales'] },
          { id: 'security',  label: 'Security',  icon: 'shield',    roles: ['superadmin'] }
        ]
      }
    }
  };
})(window);
