const App = {
  view: null,
  conf: { checkoutUrl: '', selarUrl: '', payhipUrl: '', country: '', supportEmail: 'admin@gabochie.com', siteUrl: 'https://soft.gabochie.com' },

  async boot() {
    this.captureAcquisition();
    window.addEventListener('hashchange', () => this.route());
    try { this.conf = { ...this.conf, ...(await API.config()) }; } catch (e) { /* defaults are safe */ }
    this.route();
  },

  go(path) { location.hash = path; },

  refCode() {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref') || sessionStorage.getItem('softlife_ref');
    if (ref) sessionStorage.setItem('softlife_ref', ref);
    return ref || '';
  },

  captureAcquisition() {
    try {
      if (localStorage.getItem('softlife_acquisition')) return;
      const params = new URLSearchParams(location.search);
      const utm = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
        const value = params.get(key);
        if (value) utm[key] = value;
      });
      const ref = params.get('ref') || sessionStorage.getItem('softlife_ref') || '';
      const externalRef = document.referrer && !document.referrer.startsWith(location.origin);
      const source = ref ? 'referral' : (Object.keys(utm).length ? 'utm' : (externalRef ? 'referral' : 'direct'));
      localStorage.setItem('softlife_acquisition', JSON.stringify({
        ...utm,
        source,
        referrer: externalRef ? document.referrer.slice(0, 300) : '',
        landing_path: location.pathname + location.search
      }));
    } catch (e) { /* storage can be unavailable; acquisition is optional */ }
  },

  acquisition() {
    try { return JSON.parse(localStorage.getItem('softlife_acquisition') || '{}'); }
    catch (e) { return {}; }
  },

  async route() {
    const hash = location.hash.slice(1) || '/';
    const [path, hashQuery] = hash.split('?');
    const params = new URLSearchParams(hashQuery || location.search.replace(/^\?/, ''));
    this.view = path;
    const $app = document.getElementById('app');

    if (params.get('demo') === '1') return this.demoLogin();

    const session = Store.session();
    const guarded = ['/dashboard', '/onboarding', '/tasks', '/listen', '/affiliate', '/account'];

    try {
      if (guarded.includes(path)) {
        if (!session.token) {
          params.set('notice', 'Sign in to continue.');
          history.replaceState(null, '', location.pathname + location.search + '#/signin');
          return this.render('/signin', params);
        }
        const me = await API.me();
        Store.user(me);
        return this.renderShell(path, me, params);
      }
      this.render(path, params);
    } catch (err) {
      if (err.status === 401) {
        Store.clear();
        params.set('notice', 'Your session expired. Sign in again.');
        history.replaceState(null, '', location.pathname + location.search + '#/signin');
        return this.render('/signin', params);
      }
      this.renderError(err.message);
    }
  },

  async demoLogin() {
    const intended = this.view || '/dashboard';
    try {
      const { token, user } = await API.signin({ email: 'demo@softlife.app', password: 'demo1234' });
      Store.token(token); Store.user(user);
    } catch (e) { /* demo account missing — fall through to signin */ }
    history.replaceState(null, '', location.pathname + location.hash);
    if (location.hash === '#' + intended) this.route();
    else location.hash = '#' + intended;
  },

  renderError(message) {
    document.getElementById('app').innerHTML =
      `<main class="page"><div class="card center"><h2>Hmm.</h2><p>${esc(message)}</p>
       <a class="btn" href="#/">Back home</a></div></main>`;
  },

  // ---------- layouts ----------

  siteFooter(s) {
    const actions = s.token
      ? `<a class="btn gold big" href="#/dashboard">Open your dashboard</a>
         <a class="btn ghost big" href="/products/">Browse products</a>`
      : `<a class="btn gold big" href="#/signup">Start free — no card</a>
         <a class="btn ghost big" href="/products/">Compare the options</a>`;
    return `
      <footer class="site-footer">
        <div class="wrap">
          <div class="footer-cta">
            <div>
              <div class="footer-kicker">The 15-hour promise</div>
              <h2>Build a business that buys your freedom.</h2>
              <p>Start free. Listen to the introduction, open your 90-day plan, and upgrade only when the system proves itself.</p>
            </div>
            <div class="footer-actions">${actions}</div>
          </div>
          <div class="footer-grid">
            <div class="footer-brand">
              <a class="footer-logo" href="#/" aria-label="Soft Life by Gabochie home"><img src="/assets/logo-softlife.png" alt="" width="632" height="300" loading="lazy" decoding="async"></a>
              <p>One persona. One problem. One system: a business that works 15 hours a week.</p>
              <p class="footer-trust">Free to start · No credit card · 14-day refund on the Complete bundle</p>
              <div class="footer-social" aria-label="Follow Soft Life">
                <a href="https://www.instagram.com/softlifesys" target="_blank" rel="me noopener" aria-label="Soft Life on Instagram">Instagram</a>
                <a href="https://www.tiktok.com/@softlifesys" target="_blank" rel="me noopener" aria-label="Soft Life on TikTok">TikTok</a>
                <a href="https://www.facebook.com/softlifesys" target="_blank" rel="me noopener" aria-label="Soft Life on Facebook">Facebook</a>
              </div>
            </div>
            <nav aria-label="Explore">
              <b>Explore</b>
              <a href="/products/">Products</a>
              <a href="/consultation/">Business Audit</a>
              <a href="/blog/">The Journal</a>
              <a href="/blog/feed.xml">RSS feed</a>
              <a href="#/signup">Free app</a>
            </nav>
            <nav aria-label="Support">
              <b>Support</b>
              <a href="#/affiliate">Affiliates</a>
              <a href="#/signin">Sign in</a>
              <a href="/contact/">Contact</a>
            </nav>
            <nav aria-label="Legal">
              <b>Legal</b>
              <a href="/legal/privacy/">Privacy</a>
              <a href="/legal/terms/">Terms</a>
              <a href="/legal/refund/">Refunds</a>
              <a href="/legal/cookies/">Cookies</a>
            </nav>
          </div>
          <div class="footer-legal">© 2026 Deon ChristoLove · Gabochie Books. All rights reserved.</div>
        </div>
      </footer>`;
  },

  publicTabbar() {
    const view = this.view || '/';
    const links = [
      ['/', 'Home', view === '/' || view === '/home'],
      ['/products/', 'Products', view === '/products'],
      ['/blog/', 'Blog', view === '/blog'],
      ['/contact/', 'Contact', view === '/contact'],
      ['/#/signup', 'Start', ['/signup', '/signin', '/checkout', '/onboarding'].includes(view)]
    ];
    return `<nav class="tabbar public-tabbar" aria-label="Quick navigation">
      <div class="wrap tabs">
        ${links.map(([href, label, active]) =>
          `<a href="${href}"${active ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('')}
      </div>
    </nav>`;
  },

  chrome(content, opts = {}) {
    const s = Store.session();
    const cta = s.token
      ? `<a class="top-cta" href="#/dashboard">Open app</a>`
      : `<a class="top-cta" href="#/signup">Start free</a>`;
    const nav = s.token
      ? `<a href="#/dashboard">Dashboard</a><a href="#/tasks">Tasks</a><a href="#/listen">Listen</a><a href="#/affiliate">Affiliate</a><a href="/products/">Products</a><a href="/blog/">Blog</a><a href="#/account">Account</a>`
      : `<a href="#/">Home</a><a href="/products/">Products</a><a href="/consultation/">Consultation</a><a href="/blog/">Blog</a><a href="/contact/">Contact</a><a href="#/signin">Sign in</a>`;
    return `
      <header class="topbar">
        <div class="wrap bar">
          <a class="logo" href="#/" aria-label="Soft Life by Gabochie home"><img src="/assets/logo-softlife-header.png" alt="Soft Life by Gabochie" width="316" height="150"></a>
          <div class="bar-actions"><nav>${nav}</nav>${cta}</div>
        </div>
      </header>
      ${opts.member ? '' : this.publicTabbar()}
      ${content}
      ${this.siteFooter(s)}`;
  },

  // ---------- public views ----------

  render(path, params = new URLSearchParams()) {
    const $app = document.getElementById('app');
    if (path === '/' || path === '/home') return this.home($app, params);
    if (path === '/signup') return this.auth($app, 'signup', params);
    if (path === '/signin') return this.auth($app, 'signin', params);
    if (path === '/checkout') return this.checkout($app, params);
    if (path === '/admin') return this.admin($app);
    this.renderNotFound($app);
  },

  home($app, params) {
    const refParam = params.get('ref') ? `?ref=${params.get('ref')}` : '';
    $app.innerHTML = this.chrome(`
      <main>
        <section class="hero">
          <div class="wrap hero-grid">
            <div>
              <div class="kicker">The Soft Life System · Official App</div>
              <h1>Your business should buy your freedom — not eat your life.</h1>
              <p class="lede">The Soft Life System shows you how to simplify your offer, build the machine, and hand the routine work to systems — until your business runs in <b>15 hours a week</b>.</p>
              <p class="lede sub-lede">Start free: listen to the introduction and Chapter 1 right here. Then work the system with your own 90-day task plan inside the app.</p>
              <div class="hero-cta">
                <a class="btn gold big" href="#/signup${refParam}">Start free — listen &amp; plan</a>
                <button class="btn ghost big" id="listenSample" type="button">Listen to a sample first</button>
              </div>
              <div class="hero-note">Free tier · No credit card · Install it like an app</div>
            </div>
            <div class="hero-card">
              <picture class="hero-media">
                <source media="(max-width:860px)" srcset="/assets/hero-soft-life-square.jpg">
                <img src="/assets/hero-soft-life.jpg" alt="A professional woman building a calmer, more flexible working life" width="1536" height="1024" fetchpriority="high" decoding="async">
              </picture>
            </div>
          </div>
        </section>

        <section class="pale" id="trial">
          <div class="wrap">
            <h2>Try the book — with your ears</h2>
            <p class="sub">The full introduction, read aloud by our mentor voice Ava. Press play. If it sounds like your life, the system is for you.</p>
            <div class="audio-card">
              <div class="audio-row">
                <div class="a-dot">▶</div>
                <div><b>Introduction: The 15-Hour Promise</b><small>15 min · free</small></div>
              </div>
              <audio controls preload="none" src="assets/audio/retail-sample.mp3"></audio>
            </div>
            <div class="audio-card locked">
              <div class="audio-row">
                <div class="a-dot lock">🔒</div>
                <div><b>Chapters 1–15 + worksheets + monthly review ritual</b><small>3.8 hours · Complete bundle</small></div>
              </div>
              <p class="note">Create a free account to start your 90-day task plan. The Complete bundle — <b>$19.99 founding</b> (regular $29.99) — unlocks all 15 chapters, the eBook and worksheets.</p>
            </div>
          </div>
        </section>

        <section>
          <div class="wrap">
            <h2>One persona. One problem. One system.</h2>
            <p class="sub">You built a business to buy freedom and got a job that never closes. The Soft Life System is the counter-move — in four moves and 90 days.</p>
            <div class="grid3">
              <div class="card"><span class="tag">1 · Simplify</span><h3>One offer, priced premium</h3><p>Stop selling everything to everyone. Package your genius into one premium offer.</p></div>
              <div class="card"><span class="tag">2 · Build</span><h3>The machine that delivers</h3><p>Intake → onboard → execute → handoff → follow-up. Templates and automations carry the routine.</p></div>
              <div class="card"><span class="tag">3 · Transfer</span><h3>Systems &amp; people take the grunt</h3><p>Delegate, automate, eliminate — until Genius + Growth work is 80% of your week.</p></div>
            </div>
          </div>
        </section>

        <section class="pale">
          <div class="wrap">
            <h2>Inside the app</h2>
            <div class="grid3">
              <div class="card"><span class="tag">📋 Task engine</span><h3>Your 90-day launch, preloaded</h3><p>The book's launch plan becomes trackable tasks — check them off, add your own, watch the progress bar fill.</p></div>
              <div class="card"><span class="tag">🎧 Read-aloud</span><h3>The whole book, playable</h3><p>Listen chapter by chapter. Offline-ready. The mentor voice keeps you moving.</p></div>
              <div class="card"><span class="tag">💸 Affiliate</span><h3>Earn while you implement</h3><p>Share your personal link — earn 30% on referred Complete bundle sales.</p></div>
            </div>
          </div>
        </section>

        <section>
          <div class="wrap">
            <div class="section-head"><h2>Choose your next step</h2><a href="/products/">Compare the options →</a></div>
            <div class="grid3">
              <a class="card link" href="/products/"><span class="tag">Products</span><h3>The Complete bundle</h3><p>All 15 audio chapters, the eBook, worksheets and the monthly review ritual — $19.99 founding.</p></a>
              <a class="card link" href="/consultation/"><span class="tag">Guided</span><h3>The Business Audit</h3><p>A 90-minute audit and a written 90-day plan for your own business — $99 founding for the first five.</p></a>
              <a class="card link" href="#/signup${refParam}"><span class="tag">Free</span><h3>Start free</h3><p>Listen to the introduction and Chapter 1, then work the 90-day plan in the app.</p></a>
            </div>
          </div>
        </section>

        <section class="cta-band">
          <div class="wrap center">
            <h2>Start your soft life today.</h2>
            <p class="lede" style="margin:10px auto 24px;max-width:520px">Create a free account — the introduction plays instantly and your 90-day task plan is waiting.</p>
            <a class="btn gold big" href="#/signup${refParam}">Create my free account →</a>
          </div>
        </section>
      </main>`, {});
    const sample = document.getElementById('listenSample');
    if (sample) sample.addEventListener('click', () => {
      document.getElementById('trial').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  },

  auth($app, mode, params) {
    const isSignup = mode === 'signup';
    const ref = params.get('ref') || this.refCode();
    $app.innerHTML = this.chrome(`
      <main class="page">
        <div class="auth-card">
          <h1>${isSignup ? 'Start your free account' : 'Welcome back'}</h1>
          <p class="note">${isSignup
            ? 'The introduction plays instantly. Your 90-day task plan is preloaded. No credit card.'
            : 'Sign in to your tasks, your read-aloud library, and your progress.'}</p>
          ${params.get('notice') ? `<div class="notice">${esc(params.get('notice'))}</div>` : ''}
          ${ref && isSignup ? `<div class="notice">You were invited — referral <b>${esc(ref)}</b> is noted. 🎉</div>` : ''}
          <form id="authForm">
            ${isSignup ? `<label>Your name<input name="name" type="text" autocomplete="name" placeholder="Amara"></label>` : ''}
            <label>Email<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>
            <label>Password<input name="password" type="password" autocomplete="${isSignup ? 'new-password' : 'current-password'}" placeholder="${isSignup ? 'At least 8 characters' : ''}" required minlength="${isSignup ? 8 : 4}"></label>
            <button class="btn gold wide" type="submit">${isSignup ? 'Create free account →' : 'Sign in →'}</button>
          </form>
          <p class="note center">${isSignup
            ? `Already have an account? <a href="#/signin">Sign in</a>`
            : `New here? <a href="#/signup">Create a free account</a>`}</p>
          <p class="note center">Local dev: try <b>demo@softlife.app / demo1234</b> · or <a href="/?demo=1#/dashboard">enter the demo</a></p>
        </div>
      </main>`, {});

    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const btn = f.querySelector('button');
      btn.disabled = true; btn.textContent = 'One moment…';
      try {
        const body = { email: f.email.value, password: f.password.value };
        if (isSignup) {
          body.name = f.name ? f.name.value : '';
          body.ref = ref;
          body.acquisition = this.acquisition();
        }
        const { token, user } = isSignup ? await API.signup(body) : await API.signin(body);
        Store.token(token); Store.user(user);
        location.hash = isSignup ? '#/onboarding' : '#/dashboard';
      } catch (err) {
        btn.disabled = false;
        btn.textContent = isSignup ? 'Create free account →' : 'Sign in →';
        const form = f;
        let box = form.querySelector('.form-error');
        if (!box) { box = document.createElement('div'); box.className = 'form-error'; form.prepend(box); }
        box.textContent = err.message;
      }
    });
  },

  checkout($app, params = new URLSearchParams()) {
    const me = Store.user();
    const complete = me && me.tier === 'complete';
    const support = this.conf.supportEmail || 'admin@gabochie.com';
    const selar = this.conf.selarUrl || this.conf.checkoutUrl || '';
    const payhip = this.conf.payhipUrl || '';
    const ref = me && me.ref_code ? me.ref_code : '';
    const withRef = (url) => url + (ref ? (url.includes('?') ? '&' : '?') + 'ref=' + encodeURIComponent(ref) : '');
    const providers = [
      { id: 'selar', label: 'Selar', region: 'Africa', url: selar, note: 'Mobile money, bank transfer and cards where supported.' },
      { id: 'payhip', label: 'Payhip', region: 'North America & rest of world', url: payhip, note: 'Cards and PayPal.' }
    ].filter((p) => p.url);
    const africa = new Set(['DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW']);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const country = (this.conf.country || '').toUpperCase();
    const recommended = africa.has(country) || (!country && tz.startsWith('Africa/')) ? 'selar' : 'payhip';
    const primary = providers.find((p) => p.id === recommended) || providers[0];
    const secondary = providers.find((p) => p.id !== (primary && primary.id));
    const back = me ? '#/dashboard' : '#/signup';
    $app.innerHTML = this.chrome(`
      <main class="page">
        <div class="wrap checkout-grid">
          <div class="card">
            <span class="tag">Complete bundle</span>
            <h1>Everything you need to run the system</h1>
            <p class="lede"><b>$19.99</b> founding price · <s>$29.99</s> regular</p>
            <p class="note">One payment. Access to your app library while we operate the service, including updates we release.</p>
            <ul class="check-list">
              <li>The Soft Life System eBook (PDF + EPUB)</li>
              <li>The full 3.8-hour read-aloud — all 15 chapters</li>
              <li>The 90-day launch plan, worksheets and monthly review ritual</li>
              <li>Updates we release to the app library</li>
            </ul>
            <p class="note">Your free account stays free. The Complete bundle simply unlocks the full library inside it.</p>
          </div>
          <div class="card checkout-buy">
            ${complete ? `
              <div class="notice ok-note">You already own the Complete bundle. Every chapter is unlocked.</div>
              <a class="btn gold wide" href="#/listen">Go to your library →</a>
            ` : `
              <span class="tag">Secure checkout</span>
              <h3>Unlock the Complete bundle</h3>
              ${providers.length ? `
                <p class="note">Choose the checkout that matches your region. Both options unlock the same Complete bundle.</p>
                ${primary ? `<a class="btn gold wide" data-checkout data-provider="${primary.id}" href="${withRef(primary.url)}" target="_blank" rel="noopener">Pay with ${primary.label} — ${primary.region} →</a>` : ''}
                ${secondary ? `<a class="btn ghost wide" data-checkout data-provider="${secondary.id}" href="${withRef(secondary.url)}" target="_blank" rel="noopener">Pay with ${secondary.label} — ${secondary.region} →</a>` : ''}
                <p class="note center">Recommended for your region: <b>${primary.label}</b>. ${primary.note}</p>
              ` : `
                <p class="note">Checkout is being finalized. Email us and we will send you a secure payment link.</p>
                <a class="btn gold wide" data-checkout data-provider="email" href="mailto:${support}?subject=${encodeURIComponent('Complete bundle — The Soft Life System')}">Email us to complete your order →</a>
              `}
              <p class="note">Already paid but still locked? Email <a href="mailto:${support}">${support}</a> with your receipt and we will unlock it manually.</p>
            `}
            <a class="btn ghost wide" href="${back}">${me ? 'Back to dashboard' : 'Create a free account first'}</a>
            <p class="note center"><a href="/consultation/">Need a plan for your own business? Apply for the Business Audit →</a></p>
            <p class="note center"><a href="/legal/refund/">14-day refund policy</a> · <a href="/legal/terms/">Terms</a> · <a href="/legal/cookies/">Cookies</a></p>
          </div>
        </div>
      </main>`, {});
    document.querySelectorAll('[data-checkout]').forEach((link) => {
      link.addEventListener('click', () => {
        API.event('checkout_click', { tier: 'complete', provider: link.dataset.provider || 'unknown' }).catch(() => {});
      });
    });
  },

  admin($app) {
    if (!Store.adminToken()) return this.adminLogin($app);
    this.viewAdmin($app);
  },

  adminLogin($app) {
    $app.innerHTML = this.chrome(`
      <main class="page">
        <div class="auth-card">
          <span class="tag">Super-admin</span>
          <h1>Operations dashboard</h1>
          <p class="note">Members, purchases, referrals and audio status. This is separate from member sign-in.</p>
          <form id="adminForm">
            <label>Admin password<input name="password" type="password" autocomplete="current-password" required autofocus></label>
            <button class="btn gold wide" type="submit">Unlock dashboard →</button>
          </form>
          <p class="note center"><a href="#/">Back to the site</a></p>
        </div>
      </main>`, {});
    const form = document.getElementById('adminForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true; btn.textContent = 'Checking…';
      try {
        const data = await API.adminLogin({ password: form.password.value });
        Store.adminToken(data.token);
        this.viewAdmin($app);
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Unlock dashboard →';
        let box = form.querySelector('.form-error');
        if (!box) { box = document.createElement('div'); box.className = 'form-error'; form.prepend(box); }
        box.textContent = err.message;
      }
    });
  },

  async viewAdmin($app) {
    $app.innerHTML = this.chrome(`
      <main class="page">
        <div class="wrap admin-shell">
          <div class="dash-head">
            <div><h1 class="hi">Super-admin</h1><p class="note">Live business operations for The Soft Life System.</p></div>
            <div class="admin-actions">
              <button class="btn ghost" id="adminRefresh" type="button">Refresh</button>
              <button class="btn dark" id="adminLogout" type="button">Log out</button>
            </div>
          </div>
          <div id="adminBody"><p class="note">Loading live data…</p></div>
        </div>
      </main>`, {});
    document.getElementById('adminRefresh').addEventListener('click', () => this.loadAdmin());
    document.getElementById('adminLogout').addEventListener('click', async () => {
      try { await API.adminLogout(); } catch (e) { /* token may be stale */ }
      Store.clearAdmin();
      this.admin($app);
    });
    await this.loadAdmin();
  },

  async loadAdmin(q = '') {
    const box = document.getElementById('adminBody');
    if (!box) return;
    try {
      const [overview, users, audio, purchases, referrals, onboarding] = await Promise.all([
        API.adminOverview(),
        API.adminUsers(q),
        API.adminAudio(),
        API.adminPurchases(),
        API.adminReferrals(),
        API.adminOnboarding()
      ]);
      box.innerHTML = this.adminDashboard(overview, users, audio, purchases, referrals, onboarding);
      this.bindAdmin();
    } catch (err) {
      if (err.status === 401) {
        Store.clearAdmin();
        return this.admin(document.getElementById('app'));
      }
      box.innerHTML = `<div class="card"><h3>Could not load dashboard</h3><p class="note">${esc(err.message)}</p></div>`;
    }
  },

  adminOption(value, current, label) {
    return `<option value="${value}"${value === current ? ' selected' : ''}>${label}</option>`;
  },

  adminDashboard(o, u, a, p, r, ob) {
    const missing = a.missing || [];
    const profiles = ob.onboarding || [];
    const optedIn = profiles.filter((row) => row.whatsapp_consent);
    const money = (row) => row.amount == null ? '—' : `${row.currency ? esc(row.currency) + ' ' : ''}${esc(row.amount)}`;
    return `
      <div class="admin-stats">
        <div class="stat"><b>${o.users}</b><small>Members</small></div>
        <div class="stat"><b>${o.signups7d}</b><small>New · 7 days</small></div>
        <div class="stat"><b>${o.signups30d}</b><small>New · 30 days</small></div>
        <div class="stat"><b>${o.tasksDone}/${o.tasks}</b><small>Tasks done</small></div>
        <div class="stat"><b>${o.referrals}</b><small>Referral events</small></div>
        <div class="stat"><b>${o.purchases}</b><small>Purchases</small></div>
        <div class="stat"><b>${esc(o.revenue)}</b><small>Recorded revenue</small></div>
        <div class="stat"><b>${o.onboardingCompleted || 0}</b><small>Profiles completed</small></div>
        <div class="stat"><b>${o.whatsappOptIn || 0}</b><small>WhatsApp opt-ins</small></div>
        <div class="stat"><b>${a.uploaded.length}/${a.expected.length}</b><small>Audio in KV</small></div>
      </div>

      <div class="admin-grid2">
        <div class="card">
          <span class="tag">Audio library</span>
          <h3>${missing.length ? 'Some chapters are missing' : 'All chapters uploaded'}</h3>
          <p class="note">${missing.length ? 'Missing: ' + missing.map(esc).join(', ') : 'The full read-aloud library is available in KV.'}</p>
          <p class="note">Upload missing files from <code>deploy/cloudflare</code> with <code>npx wrangler kv key put --binding SOFTLIFE_AUDIO "audio:chXX" --path ../../server/audio/chXX.mp3 --remote</code>.</p>
        </div>
        <div class="card">
          <span class="tag">Purchase webhook</span>
          <h3>Checkout → app upgrade</h3>
          <code class="webhook-url">${location.origin}/api/webhooks/purchase</code>
          <p class="note">Send <code>Authorization: Bearer &lt;webhook secret&gt;</code> with JSON containing <code>email</code>, <code>order_id</code>, <code>amount</code> and <code>currency</code>. Never share the secret.</p>
          <p class="note">${(this.conf.selarUrl || this.conf.payhipUrl || this.conf.checkoutUrl) ? 'Checkout is configured.' : 'Checkout is not configured yet. Set SELAR_CHECKOUT_URL and PAYHIP_CHECKOUT_URL in wrangler.toml.'}</p>
        </div>
      </div>

      <div class="card">
        <div class="admin-toolbar">
          <div><span class="tag">Members</span><h3>People in the system</h3></div>
          <form id="adminSearch" class="admin-search">
            <input name="q" value="${esc(u.q || '')}" placeholder="Search email or name" aria-label="Search members">
            <button class="btn dark" type="submit">Search</button>
          </form>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>ID</th><th>Member</th><th>Tier</th><th>Role</th><th>Tasks</th><th>Joined</th></tr></thead>
            <tbody>${u.users.length ? u.users.map((row) => `
              <tr>
                <td>${row.id}</td>
                <td><b>${esc(row.name)}</b><br><small>${esc(row.email)}</small></td>
                <td><select data-tier="${row.id}" aria-label="Tier for ${esc(row.email)}">
                  ${this.adminOption('free', row.tier, 'Free')}${this.adminOption('complete', row.tier, 'Complete')}
                </select></td>
                <td><select data-role="${row.id}" aria-label="Role for ${esc(row.email)}">
                  ${this.adminOption('member', row.role || 'member', 'Member')}${this.adminOption('admin', row.role, 'Admin')}${this.adminOption('superadmin', row.role, 'Super-admin')}
                </select></td>
                <td>${row.done}/${row.tasks}</td>
                <td><small>${esc(row.created_at)}</small></td>
              </tr>`).join('') : '<tr><td colspan="6" class="note">No members match that search.</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="admin-toolbar">
          <div><span class="tag">Audience</span><h3>Profiles and WhatsApp consent</h3>
          <p class="note">Only people who explicitly opted in are in the contact export. Withdrawing consent clears the number.</p></div>
          <button class="btn dark" id="downloadConsent" type="button"${optedIn.length ? '' : ' disabled'}>Export consenting contacts (${optedIn.length})</button>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Member</th><th>Stage</th><th>Goal</th><th>Country</th><th>WhatsApp</th><th>Updated</th></tr></thead>
            <tbody>${profiles.length ? profiles.map((row) => `
              <tr>
                <td><b>${esc(row.name)}</b><br><small>${esc(row.email)}</small></td>
                <td><small>${esc(row.business_stage || '—')}</small></td>
                <td><small>${esc(row.main_goal || '—')}</small></td>
                <td><small>${esc(row.country || '—')}</small></td>
                <td>${row.whatsapp_consent ? 'Yes' : '<small>No</small>'}</td>
                <td><small>${esc(row.updated_at || '')}</small></td>
              </tr>`).join('') : '<tr><td colspan="6" class="note">No profiles yet. New members are invited to complete one after signup.</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      <div class="admin-grid2">
        <div class="card">
          <span class="tag">Purchases</span><h3>Recent orders</h3>
          ${p.purchases.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Email</th><th>Tier</th><th>Amount</th><th>Date</th></tr></thead><tbody>
            ${p.purchases.map((row) => `<tr><td><small>${esc(row.order_id || '—')}</small></td><td><small>${esc(row.email)}</small></td><td>${esc(row.tier)}</td><td>${money(row)}</td><td><small>${esc(row.created_at)}</small></td></tr>`).join('')}
          </tbody></table></div>` : '<p class="note">No purchases recorded yet. The webhook will populate this table automatically.</p>'}
        </div>
        <div class="card">
          <span class="tag">Referrals</span><h3>Recent referral events</h3>
          ${r.referrals.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Code</th><th>Email</th><th>Status</th><th>Date</th></tr></thead><tbody>
            ${r.referrals.map((row) => `<tr><td><b>${esc(row.ref_code)}</b></td><td><small>${esc(row.email || '—')}</small></td><td>${esc(row.status)}</td><td><small>${esc(row.created_at)}</small></td></tr>`).join('')}
          </tbody></table></div>` : '<p class="note">No referral events yet. Share links will appear here.</p>'}
        </div>
      </div>
      <p class="note">Generated ${esc(o.generatedAt)}. Role is for future staff access; the admin login remains a separate super-admin session.</p>`;
  },

  bindAdmin() {
    const search = document.getElementById('adminSearch');
    if (search) search.addEventListener('submit', (e) => {
      e.preventDefault();
      this.loadAdmin((new FormData(search).get('q') || '').trim());
    });
    document.querySelectorAll('[data-tier]').forEach((select) => {
      select.addEventListener('change', async () => {
        const id = select.dataset.tier;
        select.disabled = true;
        try { await API.adminSetTier(id, select.value); await this.loadAdmin(); }
        catch (err) { alert(err.message); select.disabled = false; }
      });
    });
    document.querySelectorAll('[data-role]').forEach((select) => {
      select.addEventListener('change', async () => {
        const id = select.dataset.role;
        select.disabled = true;
        try { await API.adminSetRole(id, select.value); await this.loadAdmin(); }
        catch (err) { alert(err.message); select.disabled = false; }
      });
    });
    const download = document.getElementById('downloadConsent');
    if (download) download.addEventListener('click', async () => {
      try {
        const { onboarding } = await API.adminOnboarding();
        this.downloadConsentCsv((onboarding || []).filter((row) => row.whatsapp_consent));
      } catch (err) { alert(err.message); }
    });
  },

  downloadConsentCsv(rows) {
    const cols = ['email', 'name', 'whatsapp_number', 'whatsapp_consent_at', 'consent_version', 'business_name', 'business_stage', 'country', 'main_goal', 'biggest_challenge', 'revenue_range', 'team_size', 'source', 'utm_source', 'utm_campaign', 'created_at'];
    const cell = (value) => {
      let text = String(value ?? '');
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const csv = [cols.join(',')].concat(rows.map((row) => cols.map((key) => cell(row[key])).join(','))).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'softlife-whatsapp-consents-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  },

  renderNotFound($app) {
    $app.innerHTML = this.chrome(`<main class="page"><div class="card center">
      <h1 class="hi">Page not found</h1><p>The soft life isn't here — but it's a click away.</p>
      <a class="btn" href="#/">Back home</a></div></main>`, {});
  },

  // ---------- member shell ----------

  renderShell(path, me, params) {
    const tabs = [
      ['#/dashboard', 'Dashboard', '⌂'],
      ['#/tasks', 'Tasks', '📋'],
      ['#/listen', 'Listen', '🎧'],
      ['#/affiliate', 'Affiliate', '💸'],
      ['#/account', 'Account', '⚙']
    ];
    const active = (p) => (path === p || (p === '#/tasks' && path === '/tasks')) ? 'active' : '';
    const $app = document.getElementById('app');
    $app.innerHTML = this.chrome(`
      <nav class="tabbar">
        <div class="wrap tabs">
          ${tabs.map(([href, label, icon]) =>
            `<a class="${active(href)}" href="${href}"><span class="t-ic">${icon}</span>${label}</a>`).join('')}
        </div>
      </nav>
      <main id="member" class="member"></main>`, { member: true });
    if (path === '/dashboard') this.viewDashboard(me);
    if (path === '/onboarding') this.viewOnboarding(me, params);
    if (path === '/tasks') this.viewTasks(me);
    if (path === '/listen') this.viewListen(me);
    if (path === '/affiliate') this.viewAffiliate(me);
    if (path === '/account') this.viewAccount(me);
  },

  async viewDashboard(me) {
    const $m = document.getElementById('member');
    $m.innerHTML = `<div class="wrap">
      <div class="dash-head">
        <div>
          <h1 class="hi">Welcome, ${esc(me.name)} 👋</h1>
          <p class="note">Your 90-day launch plan is loaded. Small moves, big life.</p>
        </div>
        <span class="tier">${me.tier === 'free' ? 'FREE' : esc(me.tier.toUpperCase())}</span>
      </div>
      <div id="dash-progress" class="progress-wrap">
        <div class="progress"><span style="width:0%"></span></div>
        <small class="note">Loading your launch plan…</small>
      </div>
      <div id="profile-prompt"></div>
      <div class="grid3">
        <a class="card link" href="#/tasks"><span class="tag">📋 Next up</span><h3>Work your tasks</h3><p>Your 90-day launch plan, one checkmark at a time.</p></a>
        <a class="card link" href="#/listen"><span class="tag">🎧 Keep learning</span><h3>Listen to the system</h3><p>Play the introduction free — members unlock all 15 chapters.</p></a>
        <a class="card link" href="#/affiliate"><span class="tag">💸 Earn</span><h3>Share your link</h3><p>30% commission on referred Complete bundle sales.</p></a>
      </div>
    </div>`;
    try {
      const { tasks } = await API.tasks();
      const done = tasks.filter((t) => t.done).length;
      const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
      const next = tasks.find((t) => !t.done);
      document.getElementById('dash-progress').innerHTML = `
        <div class="progress"><span style="width:${pct}%"></span></div>
        <small class="note">${done} of ${tasks.length} launch steps done (${pct}%)
        ${next ? ` · Next: <b>${esc(next.title)}</b> (week ${next.week})` : ' · 🎉 Launch complete!'}</small>`;
    } catch (e) { /* keep placeholder */ }
    try {
      const { onboarding } = await API.onboarding();
      if (!onboarding || !onboarding.completed_at) {
        document.getElementById('profile-prompt').innerHTML = `
          <div class="profile-prompt">
            <div><span class="tag">Make it yours</span><b>Tell us about your business</b>
            <p class="note">Two minutes helps us shape the next resources — and you can join the private WhatsApp community if you want.</p></div>
            <a class="btn gold" href="#/onboarding">Complete profile →</a>
          </div>`;
      }
    } catch (e) { /* older sessions can ignore */ }
  },

  async viewOnboarding(me, params = new URLSearchParams()) {
    const $m = document.getElementById('member');
    $m.innerHTML = `<div class="wrap"><p class="note">Loading your profile…</p></div>`;
    let onboarding = null;
    try { onboarding = (await API.onboarding()).onboarding; }
    catch (e) { $m.innerHTML = `<div class="wrap"><div class="card"><p class="note">${esc(e.message)}</p></div></div>`; return; }
    const o = onboarding || {};
    const opt = (value, current, label) => `<option value="${value}"${value === current ? ' selected' : ''}>${label}</option>`;
    const checked = (value) => value ? ' checked' : '';
    $m.innerHTML = `<div class="wrap">
      <div class="dash-head">
        <div><h1 class="hi">${o.completed_at ? 'Your profile' : `A little about you, ${esc(me.name)}`}</h1>
        <p class="note">Optional context that helps us improve the app and point you to the right resources.</p></div>
      </div>
      ${params.get('notice') ? `<div class="notice">${esc(params.get('notice'))}</div>` : ''}
      <form id="onboardingForm" class="profile-form">
        <div class="card">
          <span class="tag">Your business</span>
          <div class="form-grid">
            <label>Business or brand name<input name="business_name" maxlength="120" value="${esc(o.business_name || '')}" placeholder="Optional"></label>
            <label>Country<input name="country" maxlength="80" value="${esc(o.country || '')}" placeholder="Ghana"></label>
            <label>Stage
              <select name="business_stage">
                ${opt('', o.business_stage || '', 'Choose one')}
                ${opt('idea', o.business_stage, 'Idea')}
                ${opt('early', o.business_stage, 'Early — first clients')}
                ${opt('growing', o.business_stage, 'Growing')}
                ${opt('established', o.business_stage, 'Established')}
                ${opt('other', o.business_stage, 'Something else')}
              </select>
            </label>
            <label>Main goal
              <select name="main_goal">
                ${opt('', o.main_goal || '', 'Choose one')}
                ${opt('simplify', o.main_goal, 'Simplify my offer')}
                ${opt('offer', o.main_goal, 'Build a premium offer')}
                ${opt('systems', o.main_goal, 'Build systems')}
                ${opt('delegate', o.main_goal, 'Delegate or hire')}
                ${opt('time', o.main_goal, 'Work fewer hours')}
                ${opt('freedom', o.main_goal, 'More freedom and rest')}
                ${opt('other', o.main_goal, 'Something else')}
              </select>
            </label>
            <label>Biggest challenge
              <select name="biggest_challenge">
                ${opt('', o.biggest_challenge || '', 'Choose one')}
                ${opt('time', o.biggest_challenge, 'Not enough time')}
                ${opt('overwhelm', o.biggest_challenge, 'Overwhelm')}
                ${opt('pricing', o.biggest_challenge, 'Pricing')}
                ${opt('clients', o.biggest_challenge, 'Finding clients')}
                ${opt('systems', o.biggest_challenge, 'Systems and follow-through')}
                ${opt('focus', o.biggest_challenge, 'Focus')}
                ${opt('other', o.biggest_challenge, 'Something else')}
              </select>
            </label>
            <label>Revenue range
              <select name="revenue_range">
                ${opt('', o.revenue_range || '', 'Prefer not to say')}
                ${opt('pre_revenue', o.revenue_range, 'Pre-revenue')}
                ${opt('under_1k', o.revenue_range, 'Under $1k / month')}
                ${opt('1k_3k', o.revenue_range, '$1k–$3k / month')}
                ${opt('3k_10k', o.revenue_range, '$3k–$10k / month')}
                ${opt('10k_plus', o.revenue_range, '$10k+ / month')}
                ${opt('prefer_not', o.revenue_range, 'Prefer not to say')}
              </select>
            </label>
            <label>Team
              <select name="team_size">
                ${opt('', o.team_size || '', 'Choose one')}
                ${opt('solo', o.team_size, 'Solo')}
                ${opt('contractors', o.team_size, 'Me + contractors')}
                ${opt('small_team', o.team_size, 'Small team')}
                ${opt('team', o.team_size, 'Larger team')}
              </select>
            </label>
          </div>
          <input type="hidden" name="timezone" value="${esc(o.timezone || '')}">
        </div>

        <div class="card consent-card">
          <span class="tag">WhatsApp community</span>
          <h3>Want an invite?</h3>
          <p class="note">Optional. We will only use your number to send community details and occasional Soft Life updates. We will not add you to a group or share your number without your permission. You can withdraw anytime by editing this page.</p>
          <label class="check"><input type="checkbox" name="whatsapp_consent"${checked(o.whatsapp_consent)}> Yes, I consent to The Soft Life System contacting me on WhatsApp about the community.</label>
          <label>WhatsApp number (include country code)<input name="whatsapp_number" type="tel" inputmode="tel" autocomplete="tel" maxlength="24" value="${esc(o.whatsapp_number || '')}" placeholder="+233 24 000 0000"></label>
          <p class="note">Consent version ${esc(o.consent_version || '2026-11-14')} · Read our <a href="/legal/privacy/">Privacy Policy</a>.</p>
        </div>

        <div class="card consent-card">
          <span class="tag">Email</span>
          <label class="check"><input type="checkbox" name="marketing_consent"${checked(o.marketing_consent)}> Send me occasional Soft Life notes by email. Unsubscribe anytime.</label>
          <p class="note">Service messages about your account and purchases are separate.</p>
        </div>

        <div class="profile-actions">
          <button class="btn gold" type="submit">Save profile →</button>
          <a class="btn ghost" href="#/dashboard">Skip for now</a>
        </div>
        <p class="note form-error" id="onboardingError" hidden></p>
      </form>
    </div>`;

    const form = document.getElementById('onboardingForm');
    if (!o.timezone) form.timezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    form.whatsapp_consent.addEventListener('change', () => {
      form.whatsapp_number.required = form.whatsapp_consent.checked;
    });
    form.whatsapp_number.required = Boolean(o.whatsapp_consent);
    document.querySelectorAll('#onboardingForm .btn.ghost').forEach((link) => {
      link.addEventListener('click', () => { API.event('onboarding_skipped').catch(() => {}); });
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const error = document.getElementById('onboardingError');
      error.hidden = true;
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        await API.saveOnboarding({
          business_name: form.business_name.value,
          country: form.country.value,
          business_stage: form.business_stage.value,
          main_goal: form.main_goal.value,
          biggest_challenge: form.biggest_challenge.value,
          revenue_range: form.revenue_range.value,
          team_size: form.team_size.value,
          timezone: form.timezone.value || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
          whatsapp_consent: form.whatsapp_consent.checked,
          whatsapp_number: form.whatsapp_number.value,
          marketing_consent: form.marketing_consent.checked,
          acquisition: this.acquisition()
        });
        location.hash = '#/dashboard';
      } catch (err) {
        error.hidden = false;
        error.textContent = err.message;
        btn.disabled = false; btn.textContent = 'Save profile →';
      }
    });
  },

  async viewTasks(me) {
    const $m = document.getElementById('member');
    $m.innerHTML = `<div class="wrap">
      <div class="dash-head">
        <div><h1 class="hi">Your 90-Day Launch</h1><p class="note">From the book, preloaded as tasks. Add your own below.</p></div>
        <div class="progress mini"><span id="tprog" style="width:0%"></span></div>
      </div>
      <div id="taskList" class="task-list"><p class="note">Loading…</p></div>
      <form id="addTask" class="add-task">
        <input name="title" placeholder="Add your own task (e.g. Draft premium offer v2)" required>
        <select name="week" aria-label="Week"><option value="1">Week 1</option><option value="2">Week 2</option><option value="3">Week 3</option><option value="4">Week 4</option><option value="6">Month 2</option><option value="9">Month 3</option></select>
        <button class="btn dark">Add</button>
      </form>
    </div>`;
    const draw = (tasks) => {
      const groups = {};
      tasks.forEach((t) => { (groups[t.week] = groups[t.week] || []).push(t); });
      const done = tasks.filter((t) => t.done).length;
      const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
      document.getElementById('tprog').style.width = pct + '%';
      document.getElementById('taskList').innerHTML = Object.keys(groups).sort((a, b) => a - b).map((w) => `
        <div class="week-block">
          <div class="week-label">Week ${w}</div>
          ${groups[w].map((t) => `
            <div class="task ${t.done ? 'done' : ''} ${t.kind === 'custom' ? 'custom' : ''}" data-id="${t.id}">
              <button class="chk" aria-label="toggle">${t.done ? '✓' : ''}</button>
              <div><b>${esc(t.title)}</b>${t.detail ? `<small>${esc(t.detail)}</small>` : ''}</div>
              ${t.kind === 'custom' ? '<span class="c-tag">yours</span>' : ''}
            </div>`).join('')}
        </div>`).join('');
      document.getElementById('taskList').querySelectorAll('.chk').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.closest('.task').dataset.id;
          try { await API.toggleTask(id); this.route(); } catch (e) { alert(e.message); }
        });
      });
    };
    try { draw((await API.tasks()).tasks); } catch (e) { document.getElementById('taskList').innerHTML = `<p class="note">${esc(e.message)}</p>`; }
    document.getElementById('addTask').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        await API.addTask({ title: f.title.value, week: f.week.value });
        f.reset();
        this.route();
      } catch (err) { alert(err.message); }
    });
  },

  async viewListen(me) {
    const $m = document.getElementById('member');
    const full = me.tier !== 'free';
    let audioToken;
    try { audioToken = (await API.audioToken()).token; }
    catch (err) {
      $m.innerHTML = `<div class="wrap"><div class="card"><p class="note">${esc(err.message)}</p></div></div>`;
      return;
    }
    const src = s => `/api/audio/${s}.mp3?token=${encodeURIComponent(audioToken)}`;
    const chapters = [
      { slug: 'ch01', name: 'Chapter 1 · The Hustle Hangover', min: 15 },
      { slug: 'ch02', name: 'Chapter 2 · The Hidden Cost of Doing Everything', min: 14 },
      { slug: 'ch03', name: 'Chapter 3 · The Soft Life Audit', min: 17 },
      { slug: 'ch04', name: 'Chapter 4 · S — Simplify: The One-Offer Business', min: 17 },
      { slug: 'ch05', name: 'Chapter 5 · O — Offer: Package Your Genius into Premium', min: 15 },
      { slug: 'ch06', name: 'Chapter 6 · F — Fulfill: Build the Machine That Delivers', min: 16 },
      { slug: 'ch07', name: 'Chapter 7 · T — Transfer: Hire Your Invisible Team', min: 16 },
      { slug: 'ch08', name: 'Chapter 8 · The 15-Hour Week Blueprint', min: 15 },
      { slug: 'ch09', name: 'Chapter 9 · The Automation Stack', min: 17 },
      { slug: 'ch10', name: 'Chapter 10 · The Quiet Growth Engine', min: 16 },
      { slug: 'ch11', name: 'Chapter 11 · Boundaries Are the Business', min: 15 },
      { slug: 'ch12', name: 'Chapter 12 · The Soft Life Mindset', min: 14 },
      { slug: 'ch13', name: 'Chapter 13 · When Life Happens', min: 13 },
      { slug: 'ch14', name: 'Chapter 14 · The 90-Day Launch Plan', min: 16 },
      { slug: 'ch15', name: 'Chapter 15 · Staying Soft', min: 16 }
    ];
    const playable = full ? chapters : chapters.filter(c => c.slug === 'ch01');
    const locked = full ? [] : chapters.filter(c => c.slug !== 'ch01');
    $m.innerHTML = `<div class="wrap">
      <div class="dash-head"><div><h1 class="hi">Read-aloud library</h1><p class="note">The Soft Life System, narrated by Ava.</p></div></div>
      <div class="audio-card">
        <div class="audio-row"><div class="a-dot">▶</div><div><b>Introduction: The 15-Hour Promise</b><small>15 min · free for everyone</small></div></div>
        <audio controls preload="none" data-slug="intro" src="${src('intro')}"></audio>
      </div>
      ${playable.map(c => `
      <div class="audio-card">
        <div class="audio-row"><div class="a-dot">▶</div><div><b>${esc(c.name)}</b><small>${c.min} min · ${full ? 'member' : 'free trial'}</small></div></div>
        <audio controls preload="none" data-slug="${c.slug}" src="${src(c.slug)}"></audio>
      </div>`).join('')}
      ${locked.length ? `
      <div class="chapter-grid">
        ${locked.map(c => `
          <div class="ch locked">
            <span>🔒</span><div>${esc(c.name)}<small>Included with the book</small></div>
          </div>`).join('')}
      </div>
      <div class="upsell">
        <b>Unlock the full 3.8-hour read-aloud</b>
        <p class="note">Get the Complete bundle — eBook (PDF + EPUB), all 15 chapters, worksheets and the monthly review ritual — and every chapter plays here, offline-ready. <b>$19.99 founding</b> (regular $29.99).</p>
        <a class="btn gold" href="#/checkout">Get the Complete bundle — $19.99 →</a>
      </div>` : ''}
    </div>`;
    $m.querySelectorAll('audio[data-slug]').forEach((audio) => {
      audio.addEventListener('play', () => {
        API.event('audio_play', { slug: audio.dataset.slug }).catch(() => {});
      }, { once: true });
    });
  },

  async viewAffiliate(me) {
    const $m = document.getElementById('member');
    $m.innerHTML = `<div class="wrap"><div class="dash-head">
      <div><h1 class="hi">Your affiliate link</h1><p class="note">Share it. Earn <b>30%</b> on referred Complete bundle sales.</p></div></div>
      <div class="ref-card">
        <code id="reflink">${location.origin}/?ref=${me.ref_code}</code>
        <button class="btn dark" id="copyRef">Copy link</button>
      </div>
      <div id="refStats" class="grid3"><p class="note">Loading stats…</p></div>
      <div class="card how">
        <span class="tag">How it works</span>
        <p>1 · Share your link — on WhatsApp, TikTok, your email list, anywhere.<br>
           2 · Your friend lands on the free trial (intro + Chapter 1).<br>
           3 · They buy the Complete bundle — you earn 30%, paid through the checkout provider on its payout schedule.</p>
      </div></div>`;
    document.getElementById('copyRef').addEventListener('click', async () => {
      const linkEl = document.getElementById('reflink');
      const copyEl = document.getElementById('copyRef');
      if (!linkEl || !copyEl) return;
      try {
        await navigator.clipboard.writeText(linkEl.textContent);
      } catch (error) {
        const input = document.createElement('textarea');
        input.value = linkEl.textContent;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      copyEl.textContent = 'Copied ✓';
      setTimeout(() => {
        const el = document.getElementById('copyRef');
        if (el) el.textContent = 'Copy link';
      }, 1500);
    });
    try {
      const s = await API.affiliate();
      document.getElementById('refStats').innerHTML = `
        <div class="stat"><b>${s.clicks}</b><small>Visits from your link</small></div>
        <div class="stat"><b>${s.signups}</b><small>Free accounts</small></div>
        <div class="stat"><b>${s.commission_rate}</b><small>Your commission</small></div>`;
    } catch (e) { document.getElementById('refStats').innerHTML = `<p class="note">${esc(e.message)}</p>`; }
  },

  async viewAccount(me) {
    const $m = document.getElementById('member');
    let o = null;
    try { o = (await API.onboarding()).onboarding; } catch (e) { /* profile is optional */ }
    const consent = o && o.whatsapp_consent ? `Yes — ${esc(o.whatsapp_number)}` : 'Not joined';
    $m.innerHTML = `<div class="wrap">
      <div class="dash-head"><div><h1 class="hi">Account</h1><p class="note">Your membership at a glance.</p></div></div>
      <div class="card">
        <p><b>Name:</b> ${esc(me.name)}</p>
        <p><b>Email:</b> ${esc(me.email)}</p>
        <p><b>Plan:</b> ${me.tier === 'free' ? 'Free — intro + Chapter 1 + task plan' : me.tier === 'complete' ? 'Complete bundle — all 15 chapters + worksheets' : esc(me.tier)}</p>
        <p class="note">${me.tier === 'complete' ? 'Every chapter is unlocked. Your library is ready.' : 'Unlock all 15 chapters, the eBook, worksheets and the monthly review ritual with the Complete bundle — $19.99 founding (regular $29.99).'}</p>
        <a class="btn gold" href="${me.tier === 'complete' ? '#/listen' : '#/checkout'}">${me.tier === 'complete' ? 'Open my library →' : 'Get the Complete bundle — $19.99 →'}</a>
      </div>
      <div class="card">
        <span class="tag">Profile &amp; community</span>
        <p><b>WhatsApp community:</b> ${consent}</p>
        <p class="note">Update your business details or withdraw WhatsApp consent at any time.</p>
        <a class="btn ghost" href="#/onboarding">${o && o.completed_at ? 'Edit profile' : 'Complete profile'} →</a>
      </div>
      <div class="card">
        <h3>Session</h3>
        <button class="btn dark" id="logout">Log out</button>
        <p class="note">This device only. Signing out clears your token.</p>
      </div>
    </div>`;
    document.getElementById('logout').addEventListener('click', async () => {
      try { await API.signout(); } catch (e) { /* token may be stale */ }
      Store.clear();
      location.hash = '#/';
    });
  }
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

App.boot();
