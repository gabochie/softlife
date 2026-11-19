const App = {
  view: null,
  conf: { checkoutUrl: '', selarUrl: '', payhipUrl: '', country: '', supportEmail: 'admin@gabochie.com', siteUrl: 'https://soft.gabochie.com' },

  async boot() {
    this.captureAcquisition();
    this.recordRefVisit();
    window.addEventListener('hashchange', () => this.route());
    try { this.conf = { ...this.conf, ...(await API.config()) }; } catch (e) { /* defaults are safe */ }
    this.route();
    this.cookieBanner();
  },

  // Real affiliate click tracking: one visit per ref code per browser session.
  recordRefVisit() {
    const ref = this.refCode();
    if (!ref) return;
    try {
      const key = 'sl_ref_visit_' + ref;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch (e) { return; }
    API.refVisit(ref);
  },

  // Lightweight cookie notice: essential session cookie + first-party analytics only.
  // A one-time "OK" is enough for our audience (NDPA/Ghana DPA) — not a GDPR consent manager.
  cookieBanner() {
    try {
      if (localStorage.getItem('sl_cookie_choice')) return;
    } catch (e) { return; }
    const bar = document.createElement('div');
    bar.className = 'cookie-bar';
    bar.innerHTML = `
      <span>We use essential cookies to keep you signed in, and Google Analytics to see what's working. <a href="/legal/cookies/" target="_blank" rel="noopener">Details</a></span>
      <button class="btn gold" type="button">OK</button>`;
    document.body.appendChild(bar);
    bar.querySelector('button').addEventListener('click', () => {
      try { localStorage.setItem('sl_cookie_choice', String(Date.now())); } catch (e) { /* ignore */ }
      bar.classList.add('gone');
      setTimeout(() => bar.remove(), 350);
    });
  },

  go(path) { location.hash = path; },

  // 30-day attribution (Phase 2): a visitor who arrives with ?ref=CODE is
  // attributed to that affiliate for 30 days, even if they sign up later.
  refCode() {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get('ref');
    let stored = null;
    try {
      const raw = localStorage.getItem('softlife_ref_30d');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.code && parsed.expires && Date.now() < parsed.expires) stored = parsed.code;
        else localStorage.removeItem('softlife_ref_30d');
      }
    } catch (e) { /* ignore */ }
    const ref = fromUrl || stored || sessionStorage.getItem('softlife_ref') || '';
    if (ref) {
      sessionStorage.setItem('softlife_ref', ref);
      if (fromUrl) {
        try { localStorage.setItem('softlife_ref_30d', JSON.stringify({ code: ref, expires: Date.now() + 30 * 24 * 60 * 60 * 1000 })); } catch (e) { /* ignore */ }
      }
    }
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
    // Passive product analytics: one page_view per route (admin screens excluded).
    // Signed-in members are tracked with their account; everyone else anonymously.
    if (path !== '/admin') {
      if (Store.token()) API.event('page_view').catch(() => {});
      else API.track({ event: 'page_view', path }).catch(() => {});
    }

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
                <a href="https://www.youtube.com/@softlifesys" target="_blank" rel="me noopener" aria-label="Soft Life on YouTube">YouTube</a>
                <a href="https://x.com/softlifesys" target="_blank" rel="me noopener" aria-label="Soft Life on X">X</a>
                <a href="https://www.tiktok.com/@softlifesys" target="_blank" rel="me noopener" aria-label="Soft Life on TikTok">TikTok</a>
              </div>
            </div>
            <nav aria-label="Explore" data-sl-surface="footer_explore">
              <b>Explore</b>
              <a href="/products/">Products</a>
              <a href="/consultation/">Business Audit</a>
              <a href="/tools/">Free tools</a>
              <a href="/about/">About</a>
              <a href="/careers/">Careers</a>
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
    const def = window.SL_NAV && window.SL_NAV.surfaces && window.SL_NAV.surfaces.public_bottom;
    const items = def ? def.items : [];
    const isActive = (href) => {
      if (href === '/') return view === '/' || view === '/home';
      if (href === '/#/signup') return ['/signup', '/signin', '/checkout', '/onboarding'].includes(view);
      return view === href.replace(/\/$/, '') || view === href;
    };
    return `<nav class="tabbar public-tabbar" aria-label="Quick navigation" data-sl-surface="public_bottom">
      <div class="wrap tabs">
        ${items.map(({ label, href, icon, cta }) => {
          const active = isActive(href);
          const cls = [cta ? 'tab-cta' : '', active ? 'active' : ''].filter(Boolean).join(' ');
          const svg = (window.SL_NAV && window.SL_NAV.icons && window.SL_NAV.icons[icon]) || '';
          return `<a href="${href}"${cls ? ` class="${cls}"` : ''} data-sl-item="${label}"${active ? ' aria-current="page"' : ''}>${svg ? `<span class="t-ic">${svg}</span>` : ''}<span>${label}</span></a>`;
        }).join('')}
      </div>
    </nav>`;
  },

  chrome(content, opts = {}) {
    const s = Store.session();
    const authed = !!s.token;
    const def = window.SL_NAV && window.SL_NAV.surfaces && window.SL_NAV.surfaces.web_header;
    const visible = (i) => !i.when || (i.when === 'guest' ? !authed : authed);
    const items = ((def && def.items) || []).filter(visible);
    const ctaDef = (authed && def && def.ctaAuth) ? def.ctaAuth : (def && def.cta);
    const nav = items.map((i) => `<a href="${i.href}" data-sl-item="${i.label}">${i.label}</a>`).join('');
    const cta = ctaDef ? `<a class="top-cta" href="${ctaDef.href}" data-sl-item="${ctaDef.label}">${ctaDef.label}</a>` : '';
    return `
      <header class="topbar">
        <div class="wrap bar">
          <a class="logo" href="#/" aria-label="Soft Life by Gabochie home"><img src="/assets/logo-softlife-header.png" alt="Soft Life by Gabochie" width="316" height="150"></a>
          <div class="bar-actions"><nav data-sl-surface="web_header">${nav}${cta}</nav></div>
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
    if (path === '/forgot') return this.forgot($app);
    if (path === '/reset') return this.reset($app, params);
    if (path === '/claim') return this.claim($app, params);
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
            : `New here? <a href="#/signup">Create a free account</a>`}${isSignup ? '' : ' · <a href="#/forgot">Forgot password?</a>'}</p>
          ${(location.hostname === 'localhost' || location.hostname === '127.0.0.1')
            ? '<p class="note center">Local dev: try <b>demo@softlife.app / demo1234</b> · or <a href="/?demo=1#/dashboard">enter the demo</a></p>'
            : ''}
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
        if (isSignup && window.slTrack) window.slTrack('sign_up', { method: 'email' });
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

  forgot($app) {
    $app.innerHTML = this.chrome(`
      <main class="page">
        <div class="auth-card">
          <h1>Forgot your password?</h1>
          <p class="note">Enter the email on your account and we'll send you a reset link. It expires in 60 minutes.</p>
          <form id="forgotForm">
            <label>Email<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>
            <button class="btn gold wide" type="submit">Send reset link →</button>
          </form>
          <p class="note center"><a href="#/signin">← Back to sign in</a></p>
        </div>
      </main>`, {});
    document.getElementById('forgotForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const btn = f.querySelector('button');
      btn.disabled = true; btn.textContent = 'One moment…';
      try {
        await API.forgotPassword({ email: f.email.value });
        f.innerHTML = '<div class="notice">Check your inbox — the reset link is on its way. It expires in 60 minutes.<br><small>If it doesn\'t arrive within a few minutes, check spam, then try again.</small></div>';
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Send reset link →';
        const box = document.createElement('div');
        box.className = 'form-error';
        box.textContent = err.message;
        f.prepend(box);
      }
    });
  },

  reset($app, params = new URLSearchParams()) {
    const token = params.get('token') || '';
    $app.innerHTML = this.chrome(`
      <main class="page">
        <div class="auth-card">
          <h1>Choose a new password</h1>
          ${!token ? '<div class="notice">This link is missing its token. Request a fresh one below.</div><p class="note center"><a href="#/forgot">Request a new reset link</a></p>'
          : `<form id="resetForm">
              <label>New password<input name="password" type="password" autocomplete="new-password" placeholder="At least 8 characters" required minlength="8"></label>
              <button class="btn gold wide" type="submit">Save password →</button>
            </form>`}
          <p class="note center"><a href="#/signin">← Back to sign in</a></p>
        </div>
      </main>`, {});
    const form = document.getElementById('resetForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true; btn.textContent = 'One moment…';
      try {
        await API.resetPassword({ token, password: form.password.value });
        this.go('#/signin?notice=' + encodeURIComponent('Password updated — sign in with your new password.'));
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Save password →';
        const box = form.querySelector('.form-error') || document.createElement('div');
        box.className = 'form-error';
        box.textContent = err.message;
        if (!box.isConnected) form.prepend(box);
      }
    });
  },

  async claim($app, params = new URLSearchParams()) {
    const claimToken = params.get('token') || '';
    let preview = null;
    try {
      preview = await API.claimPreview(claimToken ? { token: claimToken } : {});
    } catch (err) {
      // No token or bad token: offer the manual verify form (email + order ID
      // from the payment receipt) instead of a dead end.
      $app.innerHTML = this.chrome(`
        <main class="page">
          <div class="auth-card">
            <h1>${claimToken ? 'Access link problem' : 'Unlock your purchase'}</h1>
            <p class="note">${esc(err.message)}</p>
            <form id="verifyForm">
              <label>Email you paid with<input name="email" type="email" autocomplete="email" required></label>
              <label>Order ID from your receipt<input name="orderId" type="text" required placeholder="e.g. SL-8241"></label>
              <button class="btn gold wide" type="submit">Verify my purchase</button>
            </form>
            <p class="note">Already have an account? <a href="#/signin">Sign in</a> — your purchase unlocks automatically.</p>
            <p class="note center">Need help? <a href="mailto:${esc(this.conf.supportEmail || 'admin@gabochie.com')}">Contact support</a>.</p>
          </div>
        </main>`, {});
      const vf = document.getElementById('verifyForm');
      vf.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = vf.querySelector('button');
        btn.disabled = true; btn.textContent = 'Verifying…';
        try {
          preview = await API.claimPreview({ email: vf.email.value.trim(), order_id: vf.orderId.value.trim() });
          this.claimSetup($app, preview);
        } catch (err2) {
          btn.disabled = false; btn.textContent = 'Verify my purchase';
          let box = vf.querySelector('.form-error');
          if (!box) { box = document.createElement('div'); box.className = 'form-error'; vf.prepend(box); }
          box.textContent = err2.message;
        }
      });
      return;
    }
    this.claimSetup($app, preview, claimToken);
  },

  claimSetup($app, preview, linkToken = '') {
    const token = preview.token || linkToken;
    $app.innerHTML = this.chrome(`
      <main class="page">
        <div class="auth-card">
          <span class="tag">Purchase verified</span>
          <h1>Finish setting up your access</h1>
          <p class="note">Your <b>${esc(preview.tier)}</b> purchase for <b>${esc(preview.email)}</b> is confirmed. Choose a password to open your account — the full system unlocks instantly.</p>
          <form id="claimForm">
            <label>Your name<input name="name" type="text" autocomplete="name" placeholder="Amara"></label>
            <label>Choose a password<input name="password" type="password" autocomplete="new-password" placeholder="At least 8 characters" required minlength="8"></label>
            <button class="btn gold wide" type="submit">Unlock my system →</button>
          </form>
          <p class="note center">Wrong email? <a href="mailto:${esc(this.conf.supportEmail || 'admin@gabochie.com')}">Contact support</a>.</p>
        </div>
      </main>`, {});
    document.getElementById('claimForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const btn = f.querySelector('button');
      btn.disabled = true; btn.textContent = 'Unlocking…';
      try {
        const res = await API.claimComplete({ token: token, name: f.name.value, password: f.password.value });
        if (res.upgraded_existing) {
          location.hash = '#/signin?notice=' + encodeURIComponent('Your purchase is unlocked. Sign in to start.');
          return;
        }
        Store.token(res.token); Store.user(res.user);
        if (window.slTrack) {
          window.slTrack('purchase', {
            currency: preview.currency || 'USD',
            value: preview.amount || 19.99,
            transaction_id: preview.order_id || ''
          });
          window.slTrack('claim_redeemed', { tier: preview.tier || 'complete' });
        }
        location.hash = '#/onboarding';
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Unlock my system →';
        let box = f.querySelector('.form-error');
        if (!box) { box = document.createElement('div'); box.className = 'form-error'; f.prepend(box); }
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
    const mainstack = this.conf.mainstackUrl || '';
    const paystack = this.conf.paystackUrl || '';
    const ref = me && me.ref_code ? me.ref_code : '';
    const withRef = (url) => url + (ref ? (url.includes('?') ? '&' : '?') + 'ref=' + encodeURIComponent(ref) : '');
    const providers = [
      { id: 'selar', label: 'Selar', region: 'Africa', url: selar, note: 'Mobile money, bank transfer and cards where supported.' },
      { id: 'paystack', label: 'Paystack', region: 'Africa — global cards too', url: paystack, note: 'Cards, mobile money and bank transfer.' },
      { id: 'mainstack', label: 'Mainstack', region: 'Africa — global cards too', url: mainstack, note: 'Cards, USSD and bank transfer.' },
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
              <li>The complete book as a read-aloud library — all 15 chapters in the app</li>
              <li>The full 3.8-hour listen — narrated, playable in the app</li>
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
          <div class="auth-divider"><span>or</span></div>
          <form id="staffForm">
            <label>Staff email<input name="email" type="email" autocomplete="username" placeholder="you@softlife.app"></label>
            <label>Staff password<input name="password" type="password" autocomplete="current-password"></label>
            <button class="btn dark wide" type="submit">Staff sign-in →</button>
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
        Store.adminRole(data.role || 'superadmin');
        this.viewAdmin($app);
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Unlock dashboard →';
        let box = form.querySelector('.form-error');
        if (!box) { box = document.createElement('div'); box.className = 'form-error'; form.prepend(box); }
        box.textContent = err.message;
      }
    });
    const staffForm = document.getElementById('staffForm');
    staffForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = staffForm.querySelector('button');
      btn.disabled = true; btn.textContent = 'Checking…';
      try {
        const data = await API.staffLogin({ email: staffForm.email.value, password: staffForm.password.value });
        Store.adminToken(data.token);
        Store.adminRole(data.role || 'sales');
        this.viewAdmin($app);
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Staff sign-in →';
        let box = staffForm.querySelector('.form-error');
        if (!box) { box = document.createElement('div'); box.className = 'form-error'; staffForm.prepend(box); }
        box.textContent = err.message;
      }
    });
  },

  async viewAdmin($app) {
    const ic = this.icons;
    const role = Store.adminRole() || 'superadmin';
    const adminDef = window.SL_NAV && window.SL_NAV.surfaces && window.SL_NAV.surfaces.admin_bottom;
    const sections = (adminDef ? adminDef.items : [])
      .filter((i) => !i.roles || i.roles.includes(role))
      .map((i) => [i.id, i.label, ic[i.icon]]);
    const navButtons = sections.map(([id, label, icon], i) =>
      `<button type="button" class="side-link${i === 0 ? ' active' : ''}" data-target="${id}" data-sl-item="${label}">${icon}<span>${label}</span></button>`).join('');
    const roleLabel = { superadmin: 'Super-admin', sales: 'Sales', support: 'Support', content: 'Content' }[role] || role;
    const initials = role === 'superadmin' ? 'SA' : role.slice(0, 2).toUpperCase();
    $app.innerHTML = `
      <div class="shell">
        <aside class="sidebar">
          <a class="side-logo" href="#/" aria-label="Soft Life by Gabochie home"><img src="/assets/logo-softlife-header.png" alt="Soft Life by Gabochie" width="316" height="150"></a>
          <nav class="side-nav" aria-label="Admin sections" data-sl-surface="admin_side">${navButtons}</nav>
          <a class="side-user ${role === 'superadmin' ? 'admin-user' : ''}" href="#/dashboard" aria-label="Back to the member app">
            <span class="dash-avatar sm sa">${initials}</span>
            <span class="side-user-meta"><b>${roleLabel}</b><small>Back to member app →</small></span>
          </a>
        </aside>
        <nav class="m-tabbar" aria-label="Admin sections" data-sl-surface="admin_bottom">${navButtons}</nav>
        <main class="member shell-main admin-main">
          <header class="admin-head">
            <div>
              <h1 class="hi">${roleLabel}</h1>
              <p class="note">Live business operations for The Soft Life System.</p>
            </div>
            <div class="admin-actions">
              <button class="btn ghost" id="adminRefresh" type="button">Refresh</button>
              <button class="btn dark" id="adminLogout" type="button">Log out</button>
            </div>
          </header>
          <div id="adminBody"><p class="note">Loading live data…</p></div>
        </main>
      </div>
      <div class="crm-drawer" id="crmDrawer" hidden></div>`;
    this.bindAdminNav();
    document.getElementById('adminRefresh').addEventListener('click', () => this.loadAdmin());
    document.getElementById('adminLogout').addEventListener('click', async () => {
      try { await API.adminLogout(); } catch (e) { /* token may be stale */ }
      Store.clearAdmin();
      Store.adminRole(null);
      this.admin($app);
    });
    await this.loadAdmin();
  },

  bindAdminNav() {
    const setActive = (id) => document.querySelectorAll('[data-target]')
      .forEach((b) => b.classList.toggle('active', b.dataset.target === id));
    document.querySelectorAll('[data-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const el = document.getElementById('sec-' + btn.dataset.target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActive(btn.dataset.target);
      });
    });
    this.refreshAdminSpy();
  },

  refreshAdminSpy() {
    const sections = [...new Set([...document.querySelectorAll('[data-target]')].map((b) => b.dataset.target))]
      .map((t) => document.getElementById('sec-' + t)).filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;
    if (this._adminSpy) this._adminSpy.disconnect();
    const spy = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (hit) {
        const id = hit.target.id.replace(/^sec-/, '');
        document.querySelectorAll('[data-target]')
          .forEach((b) => b.classList.toggle('active', b.dataset.target === id));
      }
    }, { rootMargin: '-10% 0px -55% 0px', threshold: [0, 0.25, 0.6] });
    sections.forEach((s) => spy.observe(s));
    this._adminSpy = spy;
  },

  closeCrm() {
    const drawer = document.getElementById('crmDrawer');
    if (drawer) { drawer.classList.remove('open'); setTimeout(() => { drawer.hidden = true; }, 250); }
  },

  async openCrm(id) {
    const drawer = document.getElementById('crmDrawer');
    if (!drawer) return;
    drawer.hidden = false;
    drawer.innerHTML = '<div class="crm-panel"><p class="note">Loading member…</p></div>';
    requestAnimationFrame(() => drawer.classList.add('open'));
    let c;
    try { c = await API.crmProfile(id); }
    catch (err) {
      drawer.innerHTML = `<div class="crm-panel"><p class="note">Could not load member: ${esc(err.message)}</p><button class="btn dark" data-close-crm type="button">Close</button></div>`;
      return;
    }
    drawer.innerHTML = this.crmDrawer(c);
    const stageSel = document.getElementById('crmStage');
    stageSel.addEventListener('change', async () => {
      stageSel.disabled = true;
      try { await API.crmSetStage(id, stageSel.value); this._auditFlash('Stage updated → ' + stageSel.value); }
      catch (err) { alert(err.message); }
      stageSel.disabled = false;
    });
    const noteForm = document.getElementById('crmNoteForm');
    noteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = noteForm.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      const btn = noteForm.querySelector('button');
      btn.disabled = true;
      try {
        await API.crmAddNote(id, text);
        input.value = '';
        await this.openCrm(id);
      } catch (err) { alert(err.message); btn.disabled = false; }
    });
  },

  _auditFlash(message) {
    let el = document.getElementById('crmFlash');
    if (!el) {
      el = document.createElement('div');
      el.id = 'crmFlash';
      el.className = 'crm-flash';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => el.classList.remove('show'), 2200);
  },

  crmDrawer(c) {
    const m = c.member;
    const onb = c.onboarding || {};
    const s = c.signals;
    const stageLabel = (stage) => ({ lead: 'Lead', engaged: 'Engaged', checkout_abandoned: 'Checkout abandoned', customer: 'Customer', client: 'Client', lost: 'Lost' }[stage] || stage);
    const field = (label, value) => `<div class="crm-field"><small>${label}</small><b>${value ? esc(String(value)) : '—'}</b></div>`;
    const timeline = (c.timeline || []).map((t) =>
      `<li><small>${esc(String(t.created_at).slice(0, 16).replace('T', ' '))}</small> <span>${esc(t.event)}</span><code>${esc(String(t.path || '').replace('/#', '#'))}</code></li>`).join('');
    const orders = (c.purchases || []).map((p) =>
      `<li><span>${esc(p.tier)}</span> <b>${p.currency ? esc(p.currency) + ' ' : ''}${esc(p.amount ?? '—')}</b><small>${esc(String(p.created_at).slice(0, 10))}</small></li>`).join('');
    const notes = (c.notes || []).map((n) =>
      `<li><p>${esc(n.note)}</p><small>${esc(n.author)} · ${esc(String(n.created_at).slice(0, 16).replace('T', ' '))}</small></li>`).join('');
    const wa = (onb.whatsapp_number || '').replace(/[^\d+]/g, '');
    return `
      <div class="crm-panel">
        <header class="crm-head">
          <div>
            <span class="tag">Customer 360</span>
            <h3>${esc(m.name)}</h3>
            <p class="note">${esc(m.email)} · Member since ${esc(String(m.created_at).slice(0, 10))} · Ref <b>${esc(m.ref_code)}</b>${m.referred_by ? ' · referred by ' + esc(m.referred_by) : ''}</p>
          </div>
          <button class="btn ghost" data-close-crm type="button" aria-label="Close">✕</button>
        </header>
        <div class="crm-stage-row">
          <label>Pipeline stage
            <select id="crmStage" aria-label="Pipeline stage">
              ${['lead', 'engaged', 'checkout_abandoned', 'customer', 'client', 'lost'].map((st) => this.adminOption(st, c.stage, stageLabel(st))).join('')}
            </select>
          </label>
          ${wa ? `<a class="btn dark" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">WhatsApp ${esc(onb.whatsapp_number)} →</a>` : ''}
        </div>
        <div class="crm-grid">
          <section class="crm-card">
            <span class="tag">Signals</span>
            <div class="crm-sig">
              <div><b>${s.tasksDone}/${s.tasksTotal}</b><small>Tasks done</small></div>
              <div><b>${s.audioStarted}</b><small>Chapter plays</small></div>
              <div><b>${s.audioCompleted}</b><small>Chapters finished</small></div>
              <div><b>${s.checkoutClicks}</b><small>Checkout clicks</small></div>
              <div><b>${c.ltv ? '$' + esc(c.ltv) : '—'}</b><small>Lifetime value</small></div>
            </div>
          </section>
          <section class="crm-card">
            <span class="tag">Acquisition</span>
            <div class="crm-fields">
              ${field('Source', onb.source)}${field('UTM source', onb.utm_source)}${field('Campaign', onb.utm_campaign)}
              ${field('Business', onb.business_name)}${field('Stage', onb.business_stage)}${field('Country', onb.country)}
              ${field('Main goal', onb.main_goal)}${field('Biggest challenge', onb.biggest_challenge)}${field('Revenue range', onb.revenue_range)}
            </div>
          </section>
          <section class="crm-card">
            <span class="tag">Purchases</span>
            ${orders ? `<ul class="crm-list">${orders}</ul>` : '<p class="note">No orders recorded yet.</p>'}
          </section>
          <section class="crm-card">
            <span class="tag">Recent activity</span>
            ${timeline ? `<ul class="crm-timeline">${timeline}</ul>` : '<p class="note">No events yet.</p>'}
          </section>
          <section class="crm-card wide">
            <span class="tag">Staff notes</span>
            ${notes ? `<ul class="crm-notes">${notes}</ul>` : '<p class="note">No notes yet — add the first one below.</p>'}
            <form id="crmNoteForm" class="crm-note-form">
              <input type="text" placeholder="Add a note — follow-ups, context, next step…" aria-label="New note" maxlength="1000">
              <button class="btn dark" type="submit">Add note</button>
            </form>
          </section>
        </div>
      </div>`;
  },

  async loadAdmin(q = '') {
    const box = document.getElementById('adminBody');
    if (!box) return;
    // Analytics endpoints are fault-isolated: if any fails the core dashboard still renders.
    const safe = (p) => p.catch(() => null);
    const isSuper = (Store.adminRole() || 'superadmin') === 'superadmin';
    try {
      const [overview, users, audio, purchases, referrals, onboarding, anOv, anAu, anTasks, anOnb, anEn, team, hooks, anCt, sec, claims, email, careers, geo, goals, blogPosts] = await Promise.all([
        safe(API.adminOverview()),
        safe(API.adminUsers(q)),
        safe(API.adminAudio()),
        safe(API.adminPurchases()),
        safe(API.adminReferrals()),
        safe(API.adminOnboarding()),
        safe(API.analyticsOverview()),
        safe(API.analyticsAudio()),
        safe(API.analyticsTasks()),
        safe(API.analyticsOnboarding()),
        safe(API.analyticsEngagement()),
        isSuper ? safe(API.teamList()) : Promise.resolve(null),
        (isSuper || Store.adminRole() === 'sales') ? safe(API.webhookLog()) : Promise.resolve(null),
        safe(API.analyticsContent()),
        isSuper ? safe(API.securityOverview()) : Promise.resolve(null),
        (isSuper || Store.adminRole() === 'sales') ? safe(API.adminClaims()) : Promise.resolve(null),
        (isSuper || Store.adminRole() === 'sales') ? safe(API.adminEmail()) : Promise.resolve(null),
        isSuper ? safe(API.adminCareers()) : Promise.resolve(null),
        isSuper ? safe(API.adminGeo()) : Promise.resolve(null),
        isSuper ? safe(API.adminGoals()) : Promise.resolve(null),
        safe(API.adminBlogPosts())
      ]);
      const analytics = { overview: anOv, audio: anAu, tasks: anTasks, onboarding: anOnb, engagement: anEn, content: anCt };
      const coreDead = [overview, users, audio, purchases, referrals, onboarding].every((x) => x === null);
      if (coreDead) {
        // All core data calls failed — almost certainly a stale admin token.
        // Send the user back to the admin login rather than a broken dashboard.
        Store.clearAdmin();
        Store.adminRole(null);
        return this.admin(document.getElementById('app'));
      }
      box.innerHTML = this.adminDashboard(overview, users, audio, purchases, referrals, onboarding, analytics, team, hooks, sec, claims, email, careers, geo, goals, blogPosts);
      this.bindAdmin();
      this.refreshAdminSpy();
      this.renderAdminCharts(analytics);
    } catch (err) {
      if (err.status === 401) {
        Store.clearAdmin();
        return this.admin(document.getElementById('app'));
      }
      box.innerHTML = `<div class="card"><h3>Could not load dashboard</h3><p class="note">${esc(err.message)}</p></div>`;
    }
  },

  ensureChart() {
    if (window.Chart) return Promise.resolve(window.Chart);
    if (this._chartPromise) return this._chartPromise;
    this._chartPromise = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
      s.onload = () => resolve(window.Chart || null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
      setTimeout(() => resolve(window.Chart || null), 8000);
    });
    return this._chartPromise;
  },

  chartColors: { pink: '#f078a8', gold: '#e8b93b', purple: '#7b3fa0', deep: '#5d2189', slate: '#6d5f7a' },

  async renderAdminCharts(an) {
    const canvasIds = ['chDau', 'chAudio', 'chTasks', 'chOnb', 'chEvents', 'chViews'];
    const Chart = await this.ensureChart();
    if (!Chart) {
      canvasIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.replaceWith(Object.assign(document.createElement('p'), { className: 'note', textContent: 'Charts need an internet connection (CDN). The numbers above are live.' }));
      });
      return;
    }
    if (this._charts) Object.values(this._charts).forEach((c) => c.destroy());
    this._charts = {};
    // Chart.js with maintainAspectRatio:false needs a sized parent, or canvases grow unbounded.
    canvasIds.forEach((id) => {
      const c = document.getElementById(id);
      if (c && !c.parentElement.classList.contains('chart-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'chart-wrap';
        c.replaceWith(wrap);
        wrap.appendChild(c);
        c.removeAttribute('height');
      }
    });
    const FONT = { family: "'Inter', system-ui, sans-serif", size: 11 };
    const baseOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { font: FONT, boxWidth: 12 } } },
      scales: {
        x: { ticks: { font: FONT }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { font: FONT, precision: 0 }, grid: { color: 'rgba(93,33,137,.08)' } }
      }
    };
    const axisTime = { ...baseOpts, scales: { ...baseOpts.scales, x: { ticks: { font: FONT, maxTicksLimit: 8 }, grid: { display: false } } } };

    // 1 · Daily active members (30d line)
    const dau = an.overview && an.overview.dailyActive ? an.overview.dailyActive : [];
    if (dau.length) this._charts.dau = new Chart(document.getElementById('chDau'), {
      type: 'line',
      data: {
        labels: dau.map((d) => d.day.slice(5)),
        datasets: [{
          label: 'Active members',
          data: dau.map((d) => d.active),
          borderColor: this.chartColors.deep,
          backgroundColor: 'rgba(240,120,168,.18)',
          fill: true, tension: 0.35, pointRadius: 2, borderWidth: 2
        }]
      },
      options: axisTime
    });

    // 1b · Page views (14d line, includes anonymous public traffic)
    const views = an.content && an.content.dailyViews ? an.content.dailyViews : [];
    if (views.length && document.getElementById('chViews')) this._charts.views = new Chart(document.getElementById('chViews'), {
      type: 'line',
      data: {
        labels: views.map((d) => d.day.slice(5)),
        datasets: [{
          label: 'Page views',
          data: views.map((d) => d.views),
          borderColor: this.chartColors.pink,
          backgroundColor: 'rgba(123,63,160,.14)',
          fill: true, tension: 0.35, pointRadius: 2, borderWidth: 2
        }]
      },
      options: axisTime
    });

    // 2 · Audio reach & drop-off (plays vs completions per chapter)
    const chapters = an.audio && an.audio.chapters ? an.audio.chapters : [];
    if (chapters.length) this._charts.audio = new Chart(document.getElementById('chAudio'), {
      type: 'bar',
      data: {
        labels: chapters.map((c) => c.slug),
        datasets: [
          { label: 'Plays', data: chapters.map((c) => c.plays), backgroundColor: this.chartColors.purple, borderRadius: 4 },
          { label: 'Completions', data: chapters.map((c) => c.completions), backgroundColor: this.chartColors.gold, borderRadius: 4 }
        ]
      },
      options: baseOpts
    });

    // 3 · Task completion by week (assigned vs done)
    const weeks = an.tasks && an.tasks.weeks ? an.tasks.weeks : [];
    if (weeks.length) this._charts.tasks = new Chart(document.getElementById('chTasks'), {
      type: 'bar',
      data: {
        labels: weeks.map((w) => 'W' + w.week),
        datasets: [
          { label: 'Assigned', data: weeks.map((w) => w.total), backgroundColor: 'rgba(123,63,160,.35)', borderRadius: 4 },
          { label: 'Done', data: weeks.map((w) => w.done), backgroundColor: this.chartColors.deep, borderRadius: 4 }
        ]
      },
      options: baseOpts
    });

    // 4 · Onboarding field completion (horizontal bars)
    const steps = an.onboarding && an.onboarding.steps ? an.onboarding.steps : [];
    if (steps.length) this._charts.onb = new Chart(document.getElementById('chOnb'), {
      type: 'bar',
      data: {
        labels: steps.map((s) => s.field.replace(/_/g, ' ')),
        datasets: [{ label: '% filled', data: steps.map((s) => s.rate), backgroundColor: this.chartColors.pink, borderRadius: 4 }]
      },
      options: { ...baseOpts, indexAxis: 'y', scales: { x: { max: 100, ticks: { font: FONT, precision: 0 }, grid: { color: 'rgba(93,33,137,.08)' } }, y: { ticks: { font: FONT }, grid: { display: false } } } }
    });

    // 5 · Events by type (doughnut, top 6 + other)
    const byEvent = an.engagement && an.engagement.byEvent ? an.engagement.byEvent : [];
    if (byEvent.length) {
      const top = byEvent.slice(0, 6);
      const other = byEvent.slice(6).reduce((sum, e) => sum + e.c, 0);
      if (other) top.push({ event: 'other', c: other });
      this._charts.events = new Chart(document.getElementById('chEvents'), {
        type: 'doughnut',
        data: {
          labels: top.map((e) => e.event),
          datasets: [{
            data: top.map((e) => e.c),
            backgroundColor: [this.chartColors.pink, this.chartColors.gold, this.chartColors.purple, this.chartColors.deep, '#b48ec7', '#e3cfe8', '#3c2a4d'],
            borderWidth: 0
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '58%', plugins: { legend: { position: 'right', labels: { font: FONT, boxWidth: 12 } } } }
      });
    }
  },

  adminOption(value, current, label) {
    return `<option value="${value}"${value === current ? ' selected' : ''}>${label}</option>`;
  },

  adminDashboard(o, u, a, p, r, ob, an = {}, team = null, hooks = null, sec = null, claims = null, email = null, careers = null, geo = null, goals = null, blogPosts = null) {
    this._blogPosts = blogPosts;
    const missing = a?.missing || [];
    const profiles = ob?.onboarding || [];
    const optedIn = profiles.filter((row) => row.whatsapp_consent);
    const denied = '<p class="note">This section is not available for your role.</p>';
    const money = (row) => row.amount == null ? '—' : `${row.currency ? esc(row.currency) + ' ' : ''}${esc(row.amount)}`;
    const goalProgress = (g, rev) => {
      if (!g || !rev) return 0;
      const t = Number(g.target_amount) || 0;
      return t > 0 ? Math.min(100, Math.round((Number(rev) / t) * 100)) : 0;
    };
    return `
      <div class="admin-stats" id="sec-overview">
        <div class="stat"><b>${o ? o.users : '—'}</b><small>Members</small></div>
        <div class="stat"><b>${o ? o.signups7d : '—'}</b><small>New · 7 days</small></div>
        <div class="stat"><b>${o ? o.signups30d : '—'}</b><small>New · 30 days</small></div>
        <div class="stat"><b>${o ? o.tasksDone + '/' + o.tasks : '—'}</b><small>Tasks done</small></div>
        <div class="stat"><b>${o ? o.referrals : '—'}</b><small>Referral events</small></div>
        <div class="stat"><b>${o ? o.purchases : '—'}</b><small>Purchases</small></div>
        <div class="stat"><b>${o ? esc(o.revenue) : '—'}</b><small>Recorded revenue</small></div>
        <div class="stat"><b>${o ? (o.onboardingCompleted || 0) : '—'}</b><small>Profiles completed</small></div>
        <div class="stat"><b>${o ? (o.whatsappOptIn || 0) : '—'}</b><small>WhatsApp opt-ins</small></div>
        <div class="stat"><b>${a ? a.uploaded.length + '/' + a.expected.length : '—'}</b><small>Audio in KV</small></div>
      </div>

      <div class="card" id="sec-analytics">
        <div class="admin-toolbar">
          <div><span class="tag">Analytics</span><h3>Product engagement</h3></div>
          <small class="note">${an.overview ? 'Generated ' + esc(String(an.overview.generatedAt || '').slice(0, 16).replace('T', ' ')) + ' UTC' : ''}</small>
        </div>
        ${an.overview ? `
        <div class="an-stats">
          <div class="stat"><b>${an.overview.dau}</b><small>DAU</small></div>
          <div class="stat"><b>${an.overview.wau}</b><small>WAU</small></div>
          <div class="stat"><b>${an.overview.mau}</b><small>MAU</small></div>
          <div class="stat"><b>${an.overview.activationRate}%</b><small>Activation · 3+ tasks</small></div>
          <div class="stat"><b>${an.overview.daysToFirstTask == null ? '—' : an.overview.daysToFirstTask}</b><small>Days to 1st task</small></div>
        </div>
        <div class="chart-grid">
          <div class="chart-box wide"><span class="tag">Active members · last 30 days</span><canvas id="chDau" height="110"></canvas></div>
          <div class="chart-box"><span class="tag">Audio reach &amp; drop-off</span><canvas id="chAudio" height="170"></canvas></div>
          <div class="chart-box"><span class="tag">Task completion by week</span><canvas id="chTasks" height="170"></canvas></div>
          <div class="chart-box"><span class="tag">Onboarding fields filled</span><canvas id="chOnb" height="170"></canvas></div>
          <div class="chart-box"><span class="tag">Events by type</span><canvas id="chEvents" height="170"></canvas></div>
        </div>` : '<p class="note">Analytics are unavailable right now.</p>'}
      </div>

      ${an.content ? `
      <div class="card" id="sec-content">
        <div class="admin-toolbar">
          <div><span class="tag">Content</span><h3>Blog &amp; site traffic</h3></div>
          <small class="note">Generated ${esc(String(an.content.generatedAt || '').slice(0, 16).replace('T', ' '))} UTC</small>
        </div>
        <div class="an-stats">
          <div class="stat"><b>${an.content.posts.reduce((s, row) => s + row.views, 0)}</b><small>Blog views</small></div>
          <div class="stat"><b>${an.content.posts.length}</b><small>Posts with traffic</small></div>
          <div class="stat"><b>${an.content.referrers.length ? an.content.referrers[0].c : 0}</b><small>Top referrer hits</small></div>
        </div>
        <div class="chart-grid">
          <div class="chart-box wide"><span class="tag">Page views · last 14 days</span><canvas id="chViews" height="110"></canvas></div>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Post</th><th>Views</th><th>Members</th><th>Anonymous</th></tr></thead>
            <tbody>${an.content.posts.length ? an.content.posts.map((row) => `
              <tr>
                <td><b>${esc(row.title)}</b><br><small>${esc(row.path)}</small></td>
                <td>${row.views}</td><td>${row.members}</td><td>${row.anonymous}</td>
              </tr>`).join('') : '<tr><td colspan="4" class="note">No blog traffic recorded yet. Views start flowing once the tracker ships to the live site.</td></tr>'}</tbody>
          </table>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Traffic source</th><th>Views</th></tr></thead>
            <tbody>${an.content.referrers.length ? an.content.referrers.map((row) => `
              <tr><td><small>${esc(row.referrer)}</small></td><td>${row.c}</td></tr>`).join('') : '<tr><td colspan="2" class="note">No referrer data yet.</td></tr>'}</tbody>
          </table>
        </div>
      </div>` : ''}

      <div class="admin-grid2">
        ${a === null ? `<div class="card">${denied}</div>` : `
        <div class="card">
          <span class="tag">Audio library</span>
          <h3>${missing.length ? 'Some chapters are missing' : 'All chapters uploaded'}</h3>
          <p class="note">${missing.length ? 'Missing: ' + missing.map(esc).join(', ') : 'The full read-aloud library is available in KV.'}</p>
          <p class="note">Upload missing files from <code>deploy/cloudflare</code> with <code>npx wrangler kv key put --binding SOFTLIFE_AUDIO "audio:chXX" --path ../../server/audio/chXX.mp3 --remote</code>.</p>
        </div>`}
        <div class="card">
          <span class="tag">Purchase webhook</span>
          <h3>Checkout → app upgrade</h3>
          <code class="webhook-url">${location.origin}/api/webhooks/purchase</code>
          <p class="note">Send <code>Authorization: Bearer &lt;webhook secret&gt;</code> with JSON containing <code>email</code>, <code>order_id</code>, <code>amount</code> and <code>currency</code>. Never share the secret.</p>
          <p class="note">${(this.conf.selarUrl || this.conf.payhipUrl || this.conf.checkoutUrl) ? 'Checkout is configured.' : 'Checkout is not configured yet. Set SELAR_CHECKOUT_URL and PAYHIP_CHECKOUT_URL in wrangler.toml.'}</p>
        </div>
      </div>

      ${u === null ? `<div class="card" id="sec-members">${denied}</div>` : `
      <div class="card" id="sec-members">
        <div class="admin-toolbar">
          <div><span class="tag">Members</span><h3>People in the system</h3></div>
          <form id="adminSearch" class="admin-search">
            <input name="q" value="${esc(u.q || '')}" placeholder="Search email or name" aria-label="Search members">
            <button class="btn dark" type="submit">Search</button>
          </form>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>ID</th><th>Member</th><th>Tier</th><th>Role</th><th>Tasks</th><th>Joined</th><th>CRM</th></tr></thead>
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
                <td><button class="btn ghost sm" data-crm="${row.id}" type="button" aria-label="Open CRM for ${esc(row.email)}">Open CRM</button></td>
              </tr>`).join('') : '<tr><td colspan="7" class="note">No members match that search.</td></tr>'}</tbody>
          </table>
        </div>
      </div>`}

      ${ob === null ? `<div class="card" id="sec-audience">${denied}</div>` : `
      <div class="card" id="sec-audience">
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
      </div>`}

      <div class="admin-grid2">
        ${p === null ? `<div class="card" id="sec-purchases">${denied}</div>` : `
        <div class="card" id="sec-purchases">
          <span class="tag">Purchases</span><h3>Recent orders</h3>
          ${p.purchases.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Email</th><th>Tier</th><th>Amount</th><th>Date</th></tr></thead><tbody>
            ${p.purchases.map((row) => `<tr><td><small>${esc(row.order_id || '—')}</small></td><td><small>${esc(row.email)}</small></td><td>${esc(row.tier)}</td><td>${money(row)}</td><td><small>${esc(row.created_at)}</small></td></tr>`).join('')}
          </tbody></table></div>` : '<p class="note">No purchases recorded yet. The webhook will populate this table automatically.</p>'}
        </div>`}
        ${r === null ? `<div class="card" id="sec-referrals">${denied}</div>` : `
        <div class="card" id="sec-referrals">
          <span class="tag">Referrals</span><h3>Affiliate performance</h3>
          ${(r.stats || []).length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Code</th><th>Affiliate</th><th>Clicks</th><th>Signups</th><th>Sales</th><th>Earnings</th><th>Pending</th><th>Payout</th></tr></thead><tbody>
            ${r.stats.map((row) => `<tr><td><b>${esc(row.ref_code)}</b></td><td><small>${esc(row.affiliate_name || row.affiliate_email || '—')}</small></td><td>${row.clicks}</td><td>${row.signups}</td><td>${row.purchases}</td><td><b>${row.earnings}</b></td><td>${row.pending_earnings || 0}</td><td>${Number(row.pending_earnings || 0) > 0 ? `<button class="btn ghost sm" data-payout="${esc(row.ref_code)}" type="button">Mark paid</button>` : '—'}</td></tr>`).join('')}
          </tbody></table></div>` : '<p class="note">No affiliate activity yet.</p>'}
          <p class="note" style="margin-top:10px"><small>Recent referral events</small></p>
          ${r.referrals.length ? `<div class="table-wrap"><table class="admin-table"><thead><tr><th>Code</th><th>Email</th><th>Status</th><th>Date</th></tr></thead><tbody>
            ${r.referrals.map((row) => `<tr><td><b>${esc(row.ref_code)}</b></td><td><small>${esc(row.email || '—')}</small></td><td>${esc(row.status)}</td><td><small>${esc(row.created_at)}</small></td></tr>`).join('')}
          </tbody></table></div>` : '<p class="note">No referral events yet. Share links will appear here.</p>'}
        </div>`}
      </div>

        ${email === null ? '' : `
        <div class="card" id="sec-email">
          <div class="admin-toolbar">
            <div><span class="tag">Email</span><h3>Campaigns</h3>
            <p class="note">Write once, send to a segment via Brevo. Every marketing email carries an unsubscribe link; members who opt out are excluded automatically.</p></div>
          </div>
          <div class="grid3" style="margin-bottom:14px">
            <div class="stat"><b>${email.segments.all}</b><small>Subscribed (all)</small></div>
            <div class="stat"><b>${email.segments.free}</b><small>Free members</small></div>
            <div class="stat"><b>${email.segments.paid}</b><small>Paid members</small></div>
            <div class="stat"><b>${email.segments.inactive}</b><small>Inactive 14+ days</small></div>
            <div class="stat"><b>${(email.campaigns || []).length}</b><small>Campaigns sent</small></div>
          </div>
          <form id="campaignForm" style="display:grid;gap:10px;max-width:640px">
            <input name="subject" type="text" placeholder="Subject line" required aria-label="Campaign subject" style="padding:10px;border:1px solid #c9b8e8;border-radius:8px;font-family:inherit">
            <div class="btns" style="gap:8px">
              ${['all', 'free', 'paid', 'inactive'].map((sgm, idx) => `
                <label style="font-size:.85rem"><input type="radio" name="segment" value="${sgm}" ${idx === 0 ? 'checked' : ''}> ${sgm}</label>`).join('')}
            </div>
            <textarea name="body" rows="7" placeholder="Your message. Blank line = new paragraph. Plain text is fine." required aria-label="Campaign body" style="padding:10px;border:1px solid #c9b8e8;border-radius:8px;font-family:inherit;resize:vertical"></textarea>
            <div class="btns">
              <button class="btn dark" type="submit">Send campaign</button>
              <button class="btn" type="button" id="runSequences">Run automated sequences now</button>
            </div>
            <p class="note" id="campaignMsg"></p>
          </form>
          ${(email.campaigns || []).length ? `<p class="note" style="margin-top:14px"><small>Recent campaigns</small></p>
          <div class="table-wrap"><table class="admin-table"><thead><tr><th>Date</th><th>Subject</th><th>Segment</th><th>Sent</th><th>Failed</th></tr></thead><tbody>
            ${email.campaigns.map((c) => `<tr><td><small>${esc(c.created_at)}</small></td><td>${esc(c.subject)}</td><td>${esc(c.segment)}</td><td>${c.sent}</td><td>${c.failed}</td></tr>`).join('')}
          </tbody></table></div>` : ''}
          ${(email.log || []).length ? `<p class="note" style="margin-top:14px"><small>Recent email log</small></p>
          <div class="table-wrap"><table class="admin-table"><thead><tr><th>Date</th><th>To</th><th>Subject</th><th>Kind</th><th>Status</th></tr></thead><tbody>
            ${email.log.map((l) => `<tr><td><small>${esc(l.created_at)}</small></td><td><small>${esc(l.to_email)}</small></td><td><small>${esc(l.subject)}</small></td><td><small>${esc(l.kind)}</small></td><td>${esc(l.status)}</td></tr>`).join('')}
          </tbody></table></div>` : ''}
        </div>`}

      ${blogPosts === null ? '' : `
      <div class="card" id="sec-blog">
        <div class="admin-toolbar">
          <div><span class="tag">Blog CMS</span><h3>Journal posts</h3>
          <p class="note">Create, edit and publish posts. Published posts appear at <code>/blog/&lt;slug&gt;/</code> with full SEO schema and OG tags — no redeploy needed.</p></div>
          <button class="btn dark" id="blogNew" type="button">+ New post</button>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Title</th><th>Slug</th><th>Category</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
            <tbody>
              ${blogPosts.posts.length ? blogPosts.posts.map((post) => `
              <tr>
                <td><b>${esc(post.title)}</b></td>
                <td><small>/blog/${esc(post.slug)}/</small></td>
                <td><small>${esc(post.category || '—')}</small></td>
                <td>${post.published ? '<span class="pill ok">Published</span>' : '<span class="pill warn">Draft</span>'}</td>
                <td><small>${esc(String(post.updated_at).slice(0, 10))}</small></td>
                <td>
                  ${post.published ? `<a class="btn ghost sm" href="/blog/${esc(post.slug)}/" target="_blank" rel="noopener">View</a>` : ''}
                  <button class="btn ghost sm" data-blog-edit="${post.id}" type="button">Edit</button>
                  <button class="btn ghost sm" data-blog-del="${post.id}" type="button">Delete</button>
                </td>
              </tr>`).join('') : '<tr><td colspan="6" class="note">No posts yet. Click "+ New post" to write your first one.</td></tr>'}
            </tbody>
          </table>
        </div>
        <form id="blogForm" hidden style="display:grid;gap:10px;max-width:820px;margin-top:18px;padding-top:18px;border-top:1px solid var(--line)">
          <input type="hidden" name="id" value="">
          <div class="form-grid">
            <label style="font-size:.8rem;font-weight:700">Title<input name="title" required maxlength="160" style="width:100%;padding:10px;border:1px solid #e8ddef;border-radius:10px;font-family:inherit"></label>
            <label style="font-size:.8rem;font-weight:700">Slug<input name="slug" required maxlength="80" placeholder="my-post-slug" style="width:100%;padding:10px;border:1px solid #e8ddef;border-radius:10px;font-family:inherit"></label>
          </div>
          <div class="form-grid">
            <label style="font-size:.8rem;font-weight:700">Category<input name="category" maxlength="60" style="width:100%;padding:10px;border:1px solid #e8ddef;border-radius:10px;font-family:inherit"></label>
            <label style="font-size:.8rem;font-weight:700">Tags (comma-separated)<input name="tags" maxlength="200" style="width:100%;padding:10px;border:1px solid #e8ddef;border-radius:10px;font-family:inherit"></label>
          </div>
          <label style="font-size:.8rem;font-weight:700">Description / dek<textarea name="description" rows="2" maxlength="300" style="width:100%;padding:10px;border:1px solid #e8ddef;border-radius:10px;font-family:inherit"></textarea></label>
          <label style="font-size:.8rem;font-weight:700">Body (HTML — p, h2, h3, ul, ol, strong, blockquote, a)<textarea name="body_html" rows="14" required style="width:100%;padding:10px;border:1px solid #e8ddef;border-radius:10px;font-family:ui-monospace,monospace;font-size:.85rem"></textarea></label>
          <label style="font-size:.8rem;font-weight:700">FAQ — one question + answer per line, separated by | (optional)<textarea name="faq" rows="4" placeholder="What is X?|The answer to X." style="width:100%;padding:10px;border:1px solid #e8ddef;border-radius:10px;font-family:inherit"></textarea></label>
          <label style="display:flex;align-items:center;gap:8px;font-size:.85rem"><input type="checkbox" name="published" value="1"> Publish now</label>
          <div><button class="btn dark" type="submit">Save post</button> <button class="btn ghost" type="button" id="blogCancel">Cancel</button></div>
          <p class="note" id="blogMsg"></p>
        </form>
      </div>`}

      ${careers === null ? '' : `
      <div class="card" id="sec-careers">
        <div class="admin-toolbar">
          <div><span class="tag">Careers</span><h3>Job Applications</h3></div>
          <p class="note">${careers.applications.length} application${careers.applications.length !== 1 ? 's' : ''} received via /careers/</p>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Availability</th><th>Applied</th><th>Message</th></tr></thead>
            <tbody>
              ${careers.applications.length ? careers.applications.map((row) => `
              <tr>
                <td><b>${esc(row.name)}</b></td>
                <td><small>${esc(row.email)}</small></td>
                <td>${esc(row.role)}</td>
                <td><small>${esc(row.availability || '—')}</small></td>
                <td><small>${esc(String(row.created_at).slice(0, 10))}</small></td>
                <td><small>${esc(row.message || '').slice(0, 80)}${esc(row.message || '').length > 80 ? '…' : ''}</small></td>
              </tr>`).join('') : '<tr><td colspan="6" class="note">No applications yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`}

      ${geo === null ? '' : `
      <div class="card" id="sec-geo">
        <div class="admin-toolbar">
          <div><span class="tag">Geo</span><h3>Where visitors come from (30 days, via Cloudflare)</h3></div>
          <p class="note">${geo.visits.length} countries recorded · privacy-safe (ISO code, no IP storage)</p>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Country</th><th>Page views</th><th>Signed-in members</th></tr></thead>
            <tbody>
              ${geo.visits.length ? geo.visits.map((row) => `
              <tr>
                <td><b>${esc(row.country)}</b></td>
                <td>${row.count}</td>
                <td>${row.members}</td>
              </tr>`).join('') : '<tr><td colspan="3" class="note">No geo data yet — page views will appear here once tracking ships.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`}

      ${goals === null ? '' : `
      <div class="card" id="sec-goals">
        <div class="admin-toolbar">
          <div><span class="tag">Goals</span><h3>Revenue Targets</h3></div>
          <p class="note">Set monthly revenue targets to reverse-engineer the sales you need.</p>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Period</th><th>Target</th><th>Recorded</th><th>Progress</th><th>Gap</th><th>Set</th></tr></thead>
            <tbody>
              ${goals.goals.length ? goals.goals.map((g) => {
                const recorded = Number(o?.revenue || 0);
                const pct = goalProgress(g, recorded);
                const gap = Math.max(0, Number(g.target_amount) - recorded);
                return `<tr>
                  <td><b>${esc(g.period)}</b></td>
                  <td>${esc(g.currency)} ${Number(g.target_amount).toFixed(2)}</td>
                  <td>${esc(g.currency)} ${recorded.toFixed(2)}</td>
                  <td>${pct}%</td>
                  <td>${esc(g.currency)} ${gap.toFixed(2)}</td>
                  <td><small>${esc(String(g.updated_at || g.created_at).slice(0, 10))}</small></td>
                </tr>`;
              }).join('') : '<tr><td colspan="6" class="note">No goals set yet.</td></tr>'}
            </tbody>
          </table>
          <form id="goalForm" style="display:grid;grid-template-columns:1fr 1fr auto auto;gap:8px;max-width:640px;margin-top:12px">
            <input name="period" type="text" placeholder="YYYY-MM" maxlength="7" aria-label="Period (YYYY-MM)" style="padding:10px;border:1px solid #e8ddef;border-radius:10px;font-family:inherit">
            <input name="target_amount" type="number" placeholder="Target amount" aria-label="Target amount" style="padding:10px;border:1px solid #e8ddef;border-radius:10px;font-family:inherit">
            <select name="target_currency" aria-label="Currency" style="padding:10px;border:1px solid #e8ddef;border-radius:10px;font-family:inherit">
              <option value="USD">USD</option><option value="GHS">GHS</option>
            </select>
            <button class="btn dark" type="submit">Set goal</button>
          </form>
          <p class="note" id="goalMsg"></p>
        </div>
      </div>`}

      ${Array.isArray(team && team.staff) ? `
      <div class="card" id="sec-team">
        <div class="admin-toolbar">
          <div><span class="tag">Team</span><h3>Staff accounts &amp; access</h3>
          <p class="note">Sales, support and content staff sign in at <code>#/admin</code> with their own email. Their access is limited to their role — you see everything.</p></div>
        </div>
        <form id="teamAddForm" class="team-add">
          <input name="name" type="text" placeholder="Name" aria-label="Staff name" required>
          <input name="email" type="email" placeholder="work email" aria-label="Staff email" required>
          <select name="role" aria-label="Staff role">
            <option value="sales">Sales</option>
            <option value="support">Support</option>
            <option value="content">Content</option>
          </select>
          <input name="password" type="text" placeholder="Starter password (8+)" aria-label="Starter password" minlength="8" required autocomplete="off">
          <button class="btn dark" type="submit">Add staff</button>
        </form>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Staff</th><th>Role</th><th>Status</th><th>Live sessions</th><th>Added</th><th></th></tr></thead>
            <tbody>${team.staff.length ? team.staff.map((row) => `
              <tr>
                <td><b>${esc(row.name || '—')}</b><br><small>${esc(row.email)}</small></td>
                <td><select data-staff-role="${row.id}" aria-label="Role for ${esc(row.email)}"${row.role === 'superadmin' ? ' disabled' : ''}>
                  ${['sales', 'support', 'content'].map((rl) => this.adminOption(rl, row.role, rl.charAt(0).toUpperCase() + rl.slice(1))).join('')}
                </select></td>
                <td>${row.active ? '<span class="pill ok">Active</span>' : '<span class="pill off">Disabled</span>'}</td>
                <td>${row.sessions}</td>
                <td><small>${esc(String(row.created_at).slice(0, 10))}</small></td>
                <td>${row.role === 'superadmin' ? '' : `<button class="btn ghost sm" data-staff-active="${row.id}" data-next="${row.active ? 0 : 1}" type="button">${row.active ? 'Disable' : 'Enable'}</button>`}</td>
              </tr>`).join('') : '<tr><td colspan="6" class="note">No staff yet — add your first team member above.</td></tr>'}</tbody>
          </table>
        </div>
      </div>` : ''}
      ${hooks ? `
      <div class="card" id="sec-webhooks">
        <div class="admin-toolbar">
          <div><span class="tag">Webhook ledger</span><h3>Purchase deliveries</h3></div>
          <code class="webhook-url">${location.origin}/api/webhooks/purchase</code>
        </div>
        <div class="admin-stats wh-tiles">
          <div class="stat"><b>${hooks.stats.applied}</b><small>Applied</small></div>
          <div class="stat"><b>${hooks.stats.duplicate}</b><small>Duplicates</small></div>
          <div class="stat"><b>${hooks.stats.rejected}</b><small>Rejected</small></div>
          <div class="stat"><b>${hooks.stats.invalid}</b><small>Invalid</small></div>
          <div class="stat"><b>${hooks.stats.failed}</b><small>Failed</small></div>
          <div class="stat"><b>${hooks.total}</b><small>Total deliveries</small></div>
        </div>
        <p class="note">Last delivery: ${hooks.lastDelivery ? esc(String(hooks.lastDelivery).slice(0, 19)) : 'never yet'} · secret ${hooks.configured ? 'configured' : 'missing'}. Rejected = wrong secret, invalid = missing email, failed = processing error.</p>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Status</th><th>Order</th><th>Email</th><th>Received</th><th>Error</th><th></th></tr></thead>
            <tbody>${hooks.deliveries.length ? hooks.deliveries.map((d) => `
              <tr>
                <td><span class="pill ${{ applied: 'ok', duplicate: 'ok', rejected: 'warn', invalid: 'warn', failed: 'off' }[d.status] || 'off'}">${esc(d.status)}</span></td>
                <td><small>${esc(d.order_id || '—')}</small></td>
                <td><small>${esc(d.email || '—')}</small></td>
                <td><small>${esc(String(d.created_at).slice(0, 19))}</small></td>
                <td><small>${esc(d.error || '')}</small></td>
                <td>${['failed', 'rejected', 'invalid'].includes(d.status) ? `<button class="btn ghost sm" data-webhook-replay="${d.id}" type="button">Replay</button>` : ''}</td>
              </tr>`).join('') : '<tr><td colspan="6" class="note">No webhook deliveries yet. Purchases posted to the webhook URL appear here.</td></tr>'}</tbody>
          </table>
        </div>
      </div>` : ''}
      ${claims ? `
      <div class="card" id="sec-claims">
        <div class="admin-toolbar">
          <div><span class="tag">Access claims</span><h3>Paid buyers without a login</h3></div>
          <small class="note">${claims.completed} claimed so far</small>
        </div>
        <p class="note">These customers paid but had no account at checkout. Send each one their personal access link (or paste it into your welcome email). The link opens a one-time password page and unlocks their purchase.</p>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Buyer</th><th>Order</th><th>Email</th><th>Waiting since</th><th></th></tr></thead>
            <tbody>${claims.pending.length ? claims.pending.map((row) => `
              <tr>
                <td><b>${esc(row.email)}</b></td>
                <td><small>${esc(row.order_id || '—')}</small></td>
                <td><span class="pill ${row.email_status === 'sent' ? 'ok' : row.email_status === 'failed' ? 'off' : 'warn'}">${esc(row.email_status || 'queued_local')}</span></td>
                <td><small>${esc(String(row.created_at).slice(0, 19))}</small></td>
                <td><button class="btn ghost sm" data-claim-copy="${esc(row.claimUrl)}" type="button">Copy access link</button></td>
              </tr>`).join('') : '<tr><td colspan="5" class="note">No pending claims — every buyer has an account. 🎉</td></tr>'}</tbody>
          </table>
        </div>
        ${claims.emails && claims.emails.length ? `
        <details>
          <summary class="note">Purchase emails — last ${claims.emails.length}</summary>
          <div class="table-wrap">
            <table class="admin-table">
              <thead><tr><th>To</th><th>Kind</th><th>Status</th><th>Sent at</th></tr></thead>
              <tbody>${claims.emails.map((row) => `
                <tr>
                  <td><b>${esc(row.to_email)}</b></td>
                  <td><small>${esc(row.kind)}</small></td>
                  <td><span class="pill ${row.status === 'sent' ? 'ok' : row.status === 'failed' ? 'off' : 'warn'}">${esc(row.status)}</span>${row.error ? `<small class="note"> ${esc(row.error)}</small>` : ''}</td>
                  <td><small>${esc(String(row.created_at).slice(0, 19))}</small></td>
                </tr>`).join('')}</tbody>
            </table>
          </div>
        </details>` : ''}
      </div>` : ''}
      ${sec ? `
      <div class="card" id="sec-security">
        <div class="admin-toolbar">
          <div><span class="tag">Security</span><h3>Access &amp; threat monitor</h3></div>
          <small class="note">Generated ${esc(String(sec.generatedAt || '').slice(0, 16).replace('T', ' '))} UTC</small>
        </div>
        <div class="an-stats">
          <div class="stat"><b>${(sec.last24.member_login_failed || 0) + (sec.last24.admin_login_failed || 0) + (sec.last24.staff_login_failed || 0)}</b><small>Failed logins · 24h</small></div>
          <div class="stat"><b>${sec.last24.webhook_rejected || 0}</b><small>Rejected webhooks · 24h</small></div>
          <div class="stat"><b>${sec.last24.track_rate_limited || 0}</b><small>Rate-limited · 24h</small></div>
          <div class="stat"><b>${sec.liveSessions.member + sec.liveSessions.admin + sec.liveSessions.staff}</b><small>Live sessions</small></div>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>When</th><th>Event</th><th>Email</th><th>IP</th><th>Detail</th></tr></thead>
            <tbody>${sec.recent.length ? sec.recent.map((row) => `
              <tr>
                <td><small>${esc(String(row.created_at).slice(0, 19))}</small></td>
                <td><span class="pill ${/failed|rejected|limited/.test(row.kind) ? 'warn' : 'off'}">${esc(row.kind)}</span></td>
                <td><small>${esc(row.email || '—')}</small></td>
                <td><small>${esc(row.ip || '—')}</small></td>
                <td><small>${esc(row.detail || '')}</small></td>
              </tr>`).join('') : '<tr><td colspan="5" class="note">Nothing suspicious logged yet.</td></tr>'}</tbody>
          </table>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Actor</th><th>Action</th><th>Target</th><th>When</th></tr></thead>
            <tbody>${sec.audit.length ? sec.audit.map((row) => `
              <tr>
                <td><b>${esc(row.actor)}</b></td>
                <td><small>${esc(row.action)}</small></td>
                <td><small>${esc(row.target)}</small></td>
                <td><small>${esc(String(row.created_at).slice(0, 19))}</small></td>
              </tr>`).join('') : '<tr><td colspan="4" class="note">No admin actions recorded yet.</td></tr>'}</tbody>
          </table>
        </div>
      </div>` : ''}
      <p class="note">Generated ${o ? esc(o.generatedAt) : '—'}. Role is for future staff access; the admin login remains a separate super-admin session.</p>`;
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
    document.querySelectorAll('[data-crm]').forEach((btn) => {
      btn.addEventListener('click', () => this.openCrm(btn.dataset.crm));
    });
    document.querySelectorAll('[data-payout]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const code = btn.dataset.payout;
        if (!confirm('Mark all pending earnings for ' + code + ' as paid?')) return;
        const paymentMethod = prompt('Payment method (bank / MoMo / other):', '');
        const payoutReference = prompt('Payout reference (optional):', '');
        btn.disabled = true; btn.textContent = 'Paying…';
        try { const r = await API.adminAffiliatePayout(code, paymentMethod || null, payoutReference || null); await this.loadAdmin(); alert('Marked ' + r.paid + ' earning(s) as paid (' + r.total + ').'); }
        catch (err) { alert(err.message); btn.disabled = false; btn.textContent = 'Mark paid'; }
      });
    });
    const campaignForm = document.getElementById('campaignForm');
    if (campaignForm) campaignForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = campaignForm.querySelector('button[type="submit"]');
      const msg = document.getElementById('campaignMsg');
      const fd = new FormData(campaignForm);
      btn.disabled = true;
      if (msg) msg.textContent = 'Sending…';
      try {
        const out = await API.adminSendCampaign({ subject: fd.get('subject'), segment: fd.get('segment'), body: fd.get('body') });
        if (msg) msg.textContent = `Sent to ${out.sent}/${out.recipients} members${out.failed ? ' (' + out.failed + ' failed)' : ''}.`;
        await this.loadAdmin();
      } catch (err) {
        if (msg) msg.textContent = err.message;
        btn.disabled = false;
      }
    });
    const runSeq = document.getElementById('runSequences');
    if (runSeq) runSeq.addEventListener('click', async () => {
      runSeq.disabled = true;
      const msg = document.getElementById('campaignMsg');
      if (msg) msg.textContent = 'Running sequences…';
      try {
        const out = await API.adminRunSequences();
        const s = out.summary || {};
        const parts = Object.keys(s).map((k) => `${k}: ${s[k].sent}/${s[k].candidates}`);
        if (msg) msg.textContent = 'Sequences done — ' + parts.join(' · ');
      } catch (err) {
        if (msg) msg.textContent = err.message;
      }
      runSeq.disabled = false;
    });
    const teamAdd = document.getElementById('teamAddForm');
    if (teamAdd) teamAdd.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = teamAdd.querySelector('button');
      btn.disabled = true;
      const fd = new FormData(teamAdd);
      try {
        await API.teamAdd({ name: fd.get('name'), email: fd.get('email'), role: fd.get('role'), password: fd.get('password') });
        this._auditFlash('Staff account created — share the starter password securely.');
        await this.loadAdmin();
      } catch (err) { alert(err.message); btn.disabled = false; }
    });
    document.querySelectorAll('[data-staff-role]').forEach((select) => {
      select.addEventListener('change', async () => {
        const id = select.dataset.staffRole;
        select.disabled = true;
        try { await API.teamSetRole(id, select.value); this._auditFlash('Role updated → ' + select.value); await this.loadAdmin(); }
        catch (err) { alert(err.message); select.disabled = false; }
      });
    });
    document.querySelectorAll('[data-staff-active]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await API.teamSetActive(btn.dataset.staffActive, btn.dataset.next === '1');
          this._auditFlash(btn.dataset.next === '1' ? 'Staff access enabled.' : 'Staff access disabled — sessions revoked.');
          await this.loadAdmin();
        } catch (err) { alert(err.message); btn.disabled = false; }
      });
    });
    const blogForm = document.getElementById('blogForm');
    const blogNew = document.getElementById('blogNew');
    const blogCancel = document.getElementById('blogCancel');
    if (blogNew && blogForm) blogNew.addEventListener('click', () => {
      blogForm.reset();
      blogForm.querySelector('[name=id]').value = '';
      blogForm.hidden = false;
      blogForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      blogForm.querySelector('[name=title]').focus();
    });
    if (blogCancel && blogForm) blogCancel.addEventListener('click', () => { blogForm.hidden = true; });
    document.querySelectorAll('[data-blog-edit]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.blogEdit;
        const post = (this._blogPosts && this._blogPosts.posts || []).find((p) => String(p.id) === String(id));
        if (!post) return;
        blogForm.reset();
        blogForm.querySelector('[name=id]').value = post.id;
        blogForm.querySelector('[name=title]').value = post.title || '';
        blogForm.querySelector('[name=slug]').value = post.slug || '';
        blogForm.querySelector('[name=category]').value = post.category || '';
        blogForm.querySelector('[name=tags]').value = post.tags || '';
        blogForm.querySelector('[name=description]').value = post.description || '';
        blogForm.querySelector('[name=body_html]').value = post.body_html || '';
        if (post.published) blogForm.querySelector('[name=published]').checked = true;
        blogForm.hidden = false;
        blogForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    document.querySelectorAll('[data-blog-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this post permanently?')) return;
        try { await API.adminBlogDelete(btn.dataset.blogDel); await this.loadAdmin(); }
        catch (err) { alert(err.message); }
      });
    });
    if (blogForm) blogForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = blogForm.querySelector('button[type=submit]');
      const msg = document.getElementById('blogMsg');
      const fd = new FormData(blogForm);
      const id = fd.get('id');
      const faqLines = String(fd.get('faq') || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const i = l.indexOf('|');
        return i > -1 ? { question: l.slice(0, i).trim(), answer: l.slice(i + 1).trim() } : null;
      }).filter(Boolean);
      const payload = {
        title: fd.get('title'), slug: fd.get('slug'), category: fd.get('category'),
        tags: fd.get('tags'), description: fd.get('description'), body_html: fd.get('body_html'),
        published: fd.get('published') ? 1 : 0, faq: faqLines
      };
      btn.disabled = true; btn.textContent = 'Saving…';
      if (msg) msg.textContent = '';
      try {
        if (id) await API.adminBlogUpdate(id, payload);
        else await API.adminBlogCreate(payload);
        blogForm.hidden = true;
        await this.loadAdmin();
        this._auditFlash(id ? 'Post updated.' : 'Post created.');
      } catch (err) {
        if (msg) msg.textContent = err.message;
        btn.disabled = false; btn.textContent = 'Save post';
      }
    });

    const goalForm = document.getElementById('goalForm');
    if (goalForm) goalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = goalForm.querySelector('button');
      const msg = document.getElementById('goalMsg');
      btn.disabled = true;
      btn.textContent = 'Setting…';
      try {
        await API.adminSetGoal({ period: goalForm.period.value, target_amount: Number(goalForm.target_amount.value), target_currency: goalForm.target_currency.value });
        msg.textContent = 'Goal saved.';
        msg.style.color = '#0a7a4a';
        goalForm.reset();
        await this.loadAdmin();
      } catch (err) {
        msg.textContent = err.message;
        msg.style.color = '#b42318';
        btn.disabled = false;
        btn.textContent = 'Set goal';
      }
    });
    document.querySelectorAll('[data-webhook-replay]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const res = await API.webhookReplay(btn.dataset.webhookReplay);
          this._auditFlash('Replayed → ' + (res.status || 'unknown') + '.');
          await this.loadAdmin();
        } catch (err) { alert(err.message); btn.disabled = false; }
      });
    });
    document.querySelectorAll('[data-claim-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.claimCopy);
          this._auditFlash('Access link copied — send it to the buyer.');
        } catch (err) {
          prompt('Copy this access link:', btn.dataset.claimCopy);
        }
      });
    });
    const drawer = document.getElementById('crmDrawer');
    if (drawer && !drawer.dataset.bound) {
      drawer.dataset.bound = '1';
      drawer.addEventListener('click', (e) => {
        if (e.target === drawer || e.target.closest('[data-close-crm]')) this.closeCrm();
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) this.closeCrm(); });
    }
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

  icons: (window.SL_NAV && window.SL_NAV.icons) || {},

  renderShell(path, me, params) {
    const ic = this.icons;
    const memberDef = window.SL_NAV && window.SL_NAV.surfaces && window.SL_NAV.surfaces.member_bottom;
    const nav = (memberDef ? memberDef.items : []).map((i) => [i.href, i.label, ic[i.icon]]);
    const active = (p) => (path === p.slice(1)) ? 'active' : '';
    const links = nav.map(([href, label, icon]) =>
      `<a class="${active(href)}" href="${href}" data-sl-item="${label}"${active(href) ? ' aria-current="page"' : ''}>${icon}<span>${label}</span></a>`).join('');
    const initials = esc((me.name || '?').trim().split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase() || '?');
    const tier = me.tier === 'free' ? 'Free plan' : `${esc(String(me.tier).toUpperCase())} plan`;
    const $app = document.getElementById('app');
    $app.innerHTML = `
      <div class="shell">
        <aside class="sidebar">
          <a class="side-logo" href="#/" aria-label="Soft Life by Gabochie home"><img src="/assets/logo-softlife-header.png" alt="Soft Life by Gabochie" width="316" height="150"></a>
          <nav class="side-nav" aria-label="Member navigation" data-sl-surface="member_side">${links}</nav>
          <a class="side-user" href="#/account" aria-label="Your account">
            <span class="dash-avatar sm">${initials}</span>
            <span class="side-user-meta"><b>${esc(me.name)}</b><small>${tier}</small></span>
          </a>
        </aside>
        <nav class="m-tabbar" aria-label="Member navigation" data-sl-surface="member_bottom">${links}</nav>
        <main id="member" class="member shell-main"></main>
      </div>`;
    if (path === '/dashboard') this.viewDashboard(me);
    if (path === '/onboarding') this.viewOnboarding(me, params);
    if (path === '/tasks') this.viewTasks(me);
    if (path === '/listen') this.viewListen(me);
    if (path === '/affiliate') this.viewAffiliate(me);
    if (path === '/account') this.viewAccount(me);
  },

  async viewDashboard(me) {
    const $m = document.getElementById('member');
    const first = esc((me.name || '').trim().split(/\s+/)[0] || me.name || 'there');
    const tier = me.tier === 'free' ? 'FREE' : esc(String(me.tier).toUpperCase());
    $m.innerHTML = `
      <header class="dash-head">
        <div class="dash-who">
          <span class="dash-avatar">${esc((me.name || '?').trim().split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase() || '?')}</span>
          <div>
            <h1 class="hi">Welcome back, ${first} 👋</h1>
            <p class="note">Your 90-day launch plan is loaded. Small moves, big life.</p>
          </div>
        </div>
        <span class="tier">${tier}</span>
      </header>
      <div class="dash-grid">
        <section class="dash-focus">
          <div class="ring-wrap">
            <svg class="ring" viewBox="0 0 120 120" role="img" aria-label="Launch plan progress">
              <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#f078a8"/><stop offset="100%" stop-color="#e8b93b"/>
              </linearGradient></defs>
              <circle class="ring-bg" cx="60" cy="60" r="52"/>
              <circle class="ring-fill" id="ringFill" cx="60" cy="60" r="52"/>
            </svg>
            <div class="ring-label"><b id="ringPct">–</b><small>complete</small></div>
          </div>
          <div class="dash-focus-body">
            <span class="tag">Next up</span>
            <h3 id="ringNext">Loading your launch plan…</h3>
            <p class="note" id="ringNote">One checkmark at a time.</p>
            <a class="btn gold" href="#/tasks">Work your tasks →</a>
          </div>
        </section>
        <aside class="dash-stats">
          <div class="stat-tile"><small>Steps done</small><b id="statDone">–</b></div>
          <div class="stat-tile"><small>Steps left</small><b id="statLeft">–</b></div>
          <div class="stat-tile"><small>Total steps</small><b id="statTotal">–</b></div>
        </aside>
      </div>
      <div id="profile-prompt"></div>
      <h2 class="dash-sub">Keep moving</h2>
      <div class="grid3">
        <a class="card link" href="#/tasks"><span class="tag">📋 Next up</span><h3>Work your tasks</h3><p>Your 90-day launch plan, one checkmark at a time.</p></a>
        <a class="card link" href="#/listen"><span class="tag">🎧 Keep learning</span><h3>Listen to the system</h3><p>Play the introduction free — members unlock all 15 chapters.</p></a>
        <a class="card link" href="/tools/scorecard.html"><span class="tag">🧭 Free tool</span><h3>Score your life</h3><p>8 dimensions, 5 minutes — find the two quietly running everything.</p></a>
      </div>
      <div class="grid3" style="margin-top:12px">
        <a class="card link" href="/tools/audit.html"><span class="tag">⏱ Free tool</span><h3>Audit your week</h3><p>Find the 12 hours you're wasting and the 3 tasks to kill.</p></a>
        <a class="card link" href="/tools/clarity.html"><span class="tag">🎯 Free tool</span><h3>Find your one offer</h3><p>Replace the ten you're juggling with one premium offer.</p></a>
        <a class="card link" href="#/affiliate"><span class="tag">💸 Earn</span><h3>Share your link</h3><p>30% commission on referred Complete bundle sales.</p></a>
      </div>`;
    try {
      const { tasks } = await API.tasks();
      const done = tasks.filter((t) => t.done).length;
      const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
      const next = tasks.find((t) => !t.done);
      const C = 2 * Math.PI * 52;
      const fill = document.getElementById('ringFill');
      fill.style.strokeDasharray = `${C}`;
      fill.style.strokeDashoffset = `${C * (1 - pct / 100)}`;
      document.getElementById('ringPct').textContent = `${pct}%`;
      document.getElementById('statDone').textContent = done;
      document.getElementById('statLeft').textContent = tasks.length - done;
      document.getElementById('statTotal').textContent = tasks.length;
      if (next) {
        document.getElementById('ringNext').textContent = next.title;
        document.getElementById('ringNote').textContent = `Week ${next.week} of your 90-day plan`;
      } else {
        document.getElementById('ringNext').textContent = '🎉 Launch complete!';
        document.getElementById('ringNote').textContent = 'Every step checked — time to scale.';
      }
    } catch (e) {
      const note = document.getElementById('ringNote');
      if (note) note.textContent = 'Couldn\u2019t load your plan — open Tasks.';
    }
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
      <div id="streakBar" class="streak-bar"><p class="note">Loading streak…</p></div>
      <div id="badgeGrid" class="badge-grid"><p class="note">Loading badges…</p></div>
      <div id="weekProgress" class="week-progress"></div>
      <div id="taskList" class="task-list"><p class="note">Loading…</p></div>
      <form id="addTask" class="add-task">
        <input name="title" placeholder="Add your own task (e.g. Draft premium offer v2)" required>
        <select name="week" aria-label="Week"><option value="1">Week 1</option><option value="2">Week 2</option><option value="3">Week 3</option><option value="4">Week 4</option><option value="6">Month 2</option><option value="9">Month 3</option></select>
        <button class="btn dark">Add</button>
      </form>
      <div id="celebration" class="celebration" hidden></div>
    </div>`;
    const draw = (tasks, streak, badges) => {
      const groups = {};
      tasks.forEach((t) => { (groups[t.week] = groups[t.week] || []).push(t); });
      const done = tasks.filter((t) => t.done).length;
      const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
      document.getElementById('tprog').style.width = pct + '%';

      // Streak bar
      const streakEl = document.getElementById('streakBar');
      const cur = streak?.current || 0;
      const longest = streak?.longest || 0;
      streakEl.innerHTML = `<div class="streak-info">
        <span class="streak-fire">${cur >= 7 ? '⚡' : cur >= 3 ? '🔥' : '✨'}</span>
        <b>${cur}-day streak</b>
        <small>Longest: ${longest} days · ${tasks.length - done} tasks left</small>
      </div>`;

      // Badge grid
      const earnedKeys = new Set((badges || []).map((b) => b.badge_key));
      const badgeDefs = (badges && badges.length && badges[0]?.label) ? badges : null;
      // Use client-side badge defs (mirrors server)
      const defs = [
        { key: 'first_step', label: 'First Step', icon: '🌱', desc: 'Complete your first task' },
        { key: 'week1_done', label: 'Week 1 Clear', icon: '✅', desc: 'Complete all Week 1 tasks' },
        { key: 'halfway', label: 'Halfway There', icon: '🏁', desc: 'Complete 50% of the plan' },
        { key: 'launch_complete', label: 'Launch Complete', icon: '🎉', desc: 'Complete every task' },
        { key: 'custom_creator', label: 'Own It', icon: '✏️', desc: 'Add your first custom task' },
        { key: 'streak_3', label: '3-Day Streak', icon: '🔥', desc: '3 days in a row' },
        { key: 'streak_7', label: 'Week Warrior', icon: '⚡', desc: '7 days in a row' },
      ];
      document.getElementById('badgeGrid').innerHTML = `<div class="badges">
        ${defs.map((d) => {
          const earned = earnedKeys.has(d.key);
          return `<div class="badge ${earned ? 'earned' : 'locked'}" title="${esc(d.desc)}">
            <span class="badge-icon">${d.icon}</span>
            <span class="badge-label">${esc(d.label)}</span>
          </div>`;
        }).join('')}
      </div>`;

      // Per-week progress
      const weeks = Object.keys(groups).sort((a, b) => a - b);
      document.getElementById('weekProgress').innerHTML = weeks.map((w) => {
        const wt = groups[w];
        const wd = wt.filter((t) => t.done).length;
        const wp = wt.length ? Math.round(wd / wt.length * 100) : 0;
        return `<div class="week-prog">
          <div class="week-prog-head"><span>Week ${w}</span><span>${wd}/${wt.length}</span></div>
          <div class="progress mini"><span style="width:${wp}%"></span></div>
        </div>`;
      }).join('');

      // Task list
      document.getElementById('taskList').innerHTML = weeks.map((w) => `
        <div class="week-block">
          <div class="week-label">Week ${w}</div>
          ${groups[w].map((t) => `
            <div class="task ${t.done ? 'done' : ''} ${t.kind === 'custom' ? 'custom' : ''}" data-id="${t.id}">
              <button class="chk" aria-label="toggle">${t.done ? '✓' : ''}</button>
              <div><b>${esc(t.title)}</b>${t.detail ? `<small>${esc(t.detail).replace(/(\/tools\/[a-z-]+\.html)/g, '<a href="$1" style="color:#5d2189;text-decoration:underline">Open tool →</a>')}</small>` : ''}</div>
              ${t.kind === 'custom' ? '<span class="c-tag">yours</span>' : ''}
            </div>`).join('')}
        </div>`).join('');
      document.getElementById('taskList').querySelectorAll('.chk').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.closest('.task').dataset.id;
          try { await API.toggleTask(id); this.route(); } catch (e) { alert(e.message); }
        });
      });

      // Celebration when all done
      const cel = document.getElementById('celebration');
      if (pct === 100) {
        cel.hidden = false;
        cel.innerHTML = `<div class="celebration-inner">
          <div class="celebration-confetti">🎉</div>
          <h2>Launch complete!</h2>
          <p>Every step checked — your business architecture is rebuilt. Time to scale, softly.</p>
        </div>`;
        // Fire confetti if available
        if (window.confetti) {
          try { window.confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } }); } catch (e) { /* ignore */ }
        }
      } else {
        cel.hidden = true;
        cel.innerHTML = '';
      }
    };
    try {
      const [taskRes, streakRes, badgeRes] = await Promise.all([
        API.tasks(), API.streak().catch(() => ({ current: 0, longest: 0 })), API.badges().catch(() => ({ badges: [] }))
      ]);
      draw(taskRes.tasks || [], streakRes, badgeRes);
    } catch (e) { document.getElementById('taskList').innerHTML = `<p class="note">${esc(e.message)}</p>`; }
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
        <p class="note">Get the Complete bundle — the full book and all 15 chapters in your in-app library, worksheets and the monthly review ritual — every chapter plays here, offline-ready. <b>$19.99 founding</b> (regular $29.99).</p>
        <a class="btn gold" href="#/checkout">Get the Complete bundle — $19.99 →</a>
      </div>` : ''}
    </div>`;
    $m.querySelectorAll('audio[data-slug]').forEach((audio) => {
      audio.addEventListener('play', () => {
        API.event('audio_play', { slug: audio.dataset.slug }).catch(() => {});
      }, { once: true });
      audio.addEventListener('ended', () => {
        API.event('audio_complete', { slug: audio.dataset.slug }).catch(() => {});
      }, { once: true });
    });
  },

  async viewAffiliate(me) {
    const $m = document.getElementById('member');
    $m.innerHTML = `<div class="wrap"><div class="dash-head">
      <div><h1 class="hi">Your affiliate link</h1><p class="note">Share it. Earn <b>30%</b> of every referred Complete bundle sale.</p></div></div>
      <div class="ref-card">
        <code id="reflink">${location.origin}/?ref=${me.ref_code}</code>
        <button class="btn dark" id="copyRef">Copy link</button>
      </div>
      <div id="refStats" class="grid3"><p class="note">Loading stats…</p></div>
      <div class="card how">
        <span class="tag">How it works</span>
        <p>1 · Share your link — on WhatsApp, TikTok, your email list, anywhere.<br>
           2 · Your friend lands on the free trial (intro + Chapter 1). The visit is counted the moment they open the page.<br>
           3 · If they sign up, you see it here. If they buy the Complete bundle, <b>30% is credited to your balance automatically</b> — paid out monthly.</p>
      </div>
      <div class="card share-kit">
        <span class="tag">Share kit</span>
        <p class="note">Copy a message, paste it where your people are. The link is already in your clipboard after you tap Copy.</p>
        <div class="share-msgs">
          <div class="share-msg" data-msg="I just found a system that helps founders build a business that works 15 hours a week. Free trial here: ${location.origin}/?ref=${me.ref_code}">
            <p>WhatsApp / DM</p>
            <button class="btn ghost sm" data-copy="msg">Copy message</button>
          </div>
          <div class="share-msg" data-msg="Tired of a business that never closes? The Soft Life System is a 90-day plan for founders who want their life back. Free trial: ${location.origin}/?ref=${me.ref_code}">
            <p>Social post</p>
            <button class="btn ghost sm" data-copy="msg">Copy message</button>
          </div>
          <div class="share-msg" data-msg="Subject: A calmer way to grow your business\\n\\nHey — I've been using The Soft Life System and it's genuinely changed how I work. 15-hour weeks, one premium offer, real structure. Free trial (no card): ${location.origin}/?ref=${me.ref_code}">
            <p>Email</p>
            <button class="btn ghost sm" data-copy="msg">Copy message</button>
          </div>
        </div>
        <div class="share-links">
          <a class="btn ghost sm" href="https://wa.me/?text=${encodeURIComponent('I just found a system that helps founders build a business that works 15 hours a week. Free trial: ' + location.origin + '/?ref=' + me.ref_code)}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="btn ghost sm" href="https://twitter.com/intent/tweet?text=${encodeURIComponent('Tired of a business that never closes? The Soft Life System is a 90-day plan for founders who want their life back. Free trial: ' + location.origin + '/?ref=' + me.ref_code)}" target="_blank" rel="noopener">X / Twitter</a>
          <a class="btn ghost sm" href="mailto:?subject=${encodeURIComponent('A calmer way to grow your business')}&body=${encodeURIComponent('Hey — I have been using The Soft Life System and it genuinely changed how I work. Free trial (no card): ' + location.origin + '/?ref=' + me.ref_code)}">Email</a>
        </div>
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
    // Share kit: copy the pre-written message (with link) to clipboard.
    document.querySelectorAll('.share-msg [data-copy="msg"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const msg = btn.closest('.share-msg')?.getAttribute('data-msg') || '';
        try {
          await navigator.clipboard.writeText(msg);
        } catch (e) {
          const t = document.createElement('textarea');
          t.value = msg; t.style.position = 'fixed'; t.style.opacity = '0';
          document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
        }
        btn.textContent = 'Copied ✓';
        setTimeout(() => { btn.textContent = 'Copy message'; }, 1500);
      });
    });
    try {
      const s = await API.affiliate();
      document.getElementById('refStats').innerHTML = `
        <div class="stat"><b>${s.clicks}</b><small>Link visits</small></div>
        <div class="stat"><b>${s.signups}</b><small>Free accounts</small></div>
        <div class="stat"><b>${s.purchases}</b><small>Sales</small></div>
        <div class="stat"><b>${s.conversion_rate}%</b><small>Visit → sale</small></div>
        <div class="stat"><b>$${s.pending_earnings}</b><small>Pending earnings</small></div>
        <div class="stat"><b>$${s.lifetime_earnings}</b><small>Lifetime earnings</small></div>`;
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
        <span class="tag">Settings</span>
        <h3>Change password</h3>
        <form id="pwForm">
          <label>Current password<input name="current" type="password" autocomplete="current-password" required></label>
          <label>New password<input name="next" type="password" autocomplete="new-password" placeholder="At least 8 characters" required minlength="8"></label>
          <button class="btn ghost" type="submit">Update password</button>
        </form>
        <p class="note">Forgotten it instead? <a href="/#/forgot">Use the reset flow</a> — you get an email link.</p>
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
    document.getElementById('pwForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const btn = f.querySelector('button');
      btn.disabled = true; btn.textContent = 'One moment…';
      try {
        await API.changePassword({ current_password: f.current.value, new_password: f.next.value });
        f.reset();
        const ok = document.createElement('div');
        ok.className = 'notice';
        ok.textContent = 'Password updated.';
        f.prepend(ok);
        setTimeout(() => ok.remove(), 4000);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Update password';
        const box = document.createElement('div');
        box.className = 'form-error';
        box.textContent = err.message;
        f.prepend(box);
      }
    });
  }
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

App.boot();
