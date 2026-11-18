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
          { label: 'Home',       href: '/' },
          { label: 'Products',   href: '/products/' },
          { label: 'Free tools', href: '/tools/' },
          { label: 'Start free', href: '/#/signup' }
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
