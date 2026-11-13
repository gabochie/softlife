const App = {
  view: null,

  boot() {
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  go(path) { location.hash = path; },

  refCode() {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref') || sessionStorage.getItem('softlife_ref');
    if (ref) sessionStorage.setItem('softlife_ref', ref);
    return ref || '';
  },

  async route() {
    const hash = location.hash.slice(1) || '/';
    const [path, hashQuery] = hash.split('?');
    const params = new URLSearchParams(hashQuery || location.search.replace(/^\?/, ''));
    this.view = path;
    const $app = document.getElementById('app');

    if (params.get('demo') === '1') return this.demoLogin();

    const session = Store.session();
    const guarded = ['/dashboard', '/tasks', '/listen', '/affiliate', '/account'];

    try {
      if (guarded.includes(path)) {
        if (!session.token) {
          params.set('notice', 'Sign in to continue.');
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
    location.hash = '#' + intended;
    this.route();
  },

  renderError(message) {
    document.getElementById('app').innerHTML =
      `<main class="page"><div class="card center"><h2>Hmm.</h2><p>${esc(message)}</p>
       <a class="btn" href="#/">Back home</a></div></main>`;
  },

  // ---------- layouts ----------

  chrome(content, opts = {}) {
    const s = Store.session();
    const cta = s.token
      ? `<a class="top-cta" href="#/dashboard">Open app</a>`
      : `<a class="top-cta" href="#signup">Start free</a>`;
    const nav = s.token
      ? `<a href="#/dashboard">Dashboard</a><a href="#/tasks">Tasks</a><a href="#/listen">Listen</a><a href="#/affiliate">Affiliate</a><a href="#/account">Account</a>`
      : `<a href="#/">Home</a><a href="#signin">Sign in</a><a class="nav-cta" href="#signup">Get started free</a>`;
    return `
      <header class="topbar">
        <div class="wrap bar">
          <a class="logo" href="#/">🪷 <span>Soft<span class="l-gold">Life</span></span></a>
          ${cta}
          <nav>${nav}</nav>
        </div>
      </header>
      ${content}
      <footer class="foot">
        <div class="wrap">
          <div>
            <b>🪷 SoftLife</b> — the app for The Soft Life System.<br>
            One persona. One problem. One system: a business that works 15 hours a week.
          </div>
          <div class="foot-links">
            <a href="#/privacy">Privacy</a>
            <a href="#/terms">Terms</a>
            <a href="#/refund">Refunds</a>
            <a href="#/affiliate">Affiliates</a>
            <a href="mailto:admin@gabochie.com">Contact</a>
          </div>
          <div class="foot-legal">© 2026 Deon ChristoLove · Gabochie Books. All rights reserved.</div>
        </div>
      </footer>`;
  },

  // ---------- public views ----------

  render(path, params = new URLSearchParams()) {
    const $app = document.getElementById('app');
    if (path === '/' || path === '/home') return this.home($app, params);
    if (path === '/signup') return this.auth($app, 'signup', params);
    if (path === '/signin') return this.auth($app, 'signin', params);
    if (path === '/privacy') return this.legal($app, 'privacy');
    if (path === '/terms') return this.legal($app, 'terms');
    if (path === '/refund') return this.legal($app, 'refund');
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
                <a class="btn gold big" href="#signup${refParam}">Start free — listen &amp; plan</a>
                <a class="btn ghost big" href="#trial">Listen to a sample first</a>
              </div>
              <div class="hero-note">Free forever tier · No credit card · Install it like an app</div>
            </div>
            <div class="hero-card">
              <div class="phone">
                <div class="phone-top"></div>
                <div class="phone-screen">
                  <div class="p-kicker">Today's soft work</div>
                  <div class="p-task done">✓ Complete the Hustle Hangover Checklist</div>
                  <div class="p-task">▸ Choose one audience, one offer, one outcome</div>
                  <div class="p-task">▸ Design your Soft Life Week</div>
                  <div class="p-progress"><span></span></div>
                  <div class="p-label">Week 1 of your 90-day launch</div>
                </div>
              </div>
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
                <div><b>Chapters 1–15 + worksheets &amp; reviews</b><small>3.8 hours · for members</small></div>
              </div>
              <p class="note">Unlock the full read-aloud + your task plan when you create a free account and get the book.</p>
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
              <div class="card"><span class="tag">💸 Affiliate</span><h3>Earn while you implement</h3><p>Share your personal link — earn 50% when friends start their own soft life.</p></div>
            </div>
          </div>
        </section>

        <section class="cta-band">
          <div class="wrap center">
            <h2>Start your soft life today.</h2>
            <p class="lede" style="margin:10px auto 24px;max-width:520px">Create a free account — the introduction plays instantly and your 90-day task plan is waiting.</p>
            <a class="btn gold big" href="#signup${refParam}">Create my free account →</a>
          </div>
        </section>
      </main>`, {});
  },

  auth($app, mode, params) {
    const isSignup = mode === 'signup';
    const ref = params.get('ref') || this.refCode();
    $app.innerHTML = this.chrome(`
      <main class="page">
        <div class="auth-card">
          <h2>${isSignup ? 'Start your free account' : 'Welcome back'}</h2>
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
            ? `Already have an account? <a href="#signin">Sign in</a>`
            : `New here? <a href="#signup">Create a free account</a>`}</p>
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
        }
        const { token, user } = isSignup ? await API.signup(body) : await API.signin(body);
        Store.token(token); Store.user(user);
        location.hash = '#/dashboard';
        this.route();
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

  legal($app, kind) {
    const titles = {
      privacy: ['Privacy Policy', 'LAST UPDATED: NOVEMBER 2026 · PLAIN-ENGLISH SUMMARY + FULL TEXT'],
      terms: ['Terms of Service', 'LAST UPDATED: NOVEMBER 2026 · PLAIN-ENGLISH SUMMARY + FULL TEXT'],
      refund: ['Refund Policy', 'LAST UPDATED: NOVEMBER 2026 · PLAIN-ENGLISH SUMMARY + FULL TEXT']
    };
    const bodies = {
      privacy: `<h3>Plain-english summary</h3><p>We collect only what the app needs to work: your name, email, hashed password, and your task progress. We never sell your data. You can request deletion of your account and data at any time via admin@gabochie.com.</p><h3>Full text</h3><p><b>TODO — production:</b> full privacy policy text to be reviewed for GDPR/Ghana DPA compliance before public launch. Placeholder notice: this app stores account data (name, email, password hash, task content) on our servers and processes it solely to operate the service. Third-party processors (payments: Selar; email: our mailing provider) receive only the data needed for their function.</p>`,
      terms: `<h3>Plain-english summary</h3><p>Use the app for your own business. Don't abuse it, scrape it, or resell access. Content is licensed to you for personal use. We may suspend accounts that harm the service or other members.</p><h3>Full text</h3><p><b>TODO — production:</b> full terms of service covering acceptable use, intellectual property (The Soft Life System content © Deon ChristoLove), affiliate program terms, and limitation of liability. Draft by legal counsel before public launch.</p>`,
      refund: `<h3>Plain-english summary</h3><p>Digital products (ebook, audiobook): refund within 14 days if you tell us it wasn't worth it — we'd rather fix it than keep unhappy money. Live programs (DWY): full refund before the first session, pro-rated after. DFY projects: per the project agreement.</p><h3>Full text</h3><p><b>TODO — production:</b> refund policy aligned with Selar checkout terms and consumer law in your primary markets (Ghana, Nigeria, US, UK, EU). This placeholder states intent, not final policy.</p>`
    };
    const [title, sub] = titles[kind];
    $app.innerHTML = this.chrome(`
      <main class="page">
        <div class="card legal">
          <h2>${title}</h2>
          <p class="note">${sub}</p>
          ${bodies[kind]}
        </div>
      </main>`, {});
  },

  renderNotFound($app) {
    $app.innerHTML = this.chrome(`<main class="page"><div class="card center">
      <h2>Page not found</h2><p>The soft life isn't here — but it's a click away.</p>
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
      <main id="member" class="member"></main>`, {});
    if (path === '/dashboard') this.viewDashboard(me);
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
          <h2 class="hi">Welcome, ${esc(me.name)} 👋</h2>
          <p class="note">Your 90-day launch plan is loaded. Small moves, big life.</p>
        </div>
        <span class="tier">${me.tier === 'free' ? 'FREE' : esc(me.tier.toUpperCase())}</span>
      </div>
      <div id="dash-progress" class="progress-wrap">
        <div class="progress"><span style="width:0%"></span></div>
        <small class="note">Loading your launch plan…</small>
      </div>
      <div class="grid3">
        <a class="card link" href="#/tasks"><span class="tag">📋 Next up</span><h3>Work your tasks</h3><p>Your 90-day launch plan, one checkmark at a time.</p></a>
        <a class="card link" href="#/listen"><span class="tag">🎧 Keep learning</span><h3>Listen to the system</h3><p>Play the introduction free — members unlock all 15 chapters.</p></a>
        <a class="card link" href="#/affiliate"><span class="tag">💸 Earn</span><h3>Share your link</h3><p>50% commission when friends start their soft life.</p></a>
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
  },

  async viewTasks(me) {
    const $m = document.getElementById('member');
    $m.innerHTML = `<div class="wrap">
      <div class="dash-head">
        <div><h2 class="hi">Your 90-Day Launch</h2><p class="note">From the book, preloaded as tasks. Add your own below.</p></div>
        <div class="progress mini"><span id="tprog" style="width:0%"></span></div>
      </div>
      <div id="taskList" class="task-list"><p class="note">Loading…</p></div>
      <form id="addTask" class="add-task">
        <input name="title" placeholder="Add your own task (e.g. Draft premium offer v2)" required>
        <select name="week"><option value="1">Week 1</option><option value="2">Week 2</option><option value="3">Week 3</option><option value="4">Week 4</option><option value="6">Month 2</option><option value="9">Month 3</option></select>
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

  viewListen(me) {
    const $m = document.getElementById('member');
    const full = me.tier !== 'free';
    const chapters = ['Ch 1 · The Hustle Hangover', 'Ch 2 · The Hidden Cost of Doing Everything', 'Ch 3 · The Soft Life Audit',
      'Ch 4 · S — Simplify', 'Ch 5 · O — Offer', 'Ch 6 · F — Fulfill', 'Ch 7 · T — Transfer', 'Ch 8 · The 15-Hour Week Blueprint',
      'Ch 9 · The Automation Stack', 'Ch 10 · The Quiet Growth Engine', 'Ch 11 · Boundaries Are the Business',
      'Ch 12 · The Soft Life Mindset', 'Ch 13 · When Life Happens', 'Ch 14 · The 90-Day Launch Plan', 'Ch 15 · Staying Soft'];
    $m.innerHTML = `<div class="wrap">
      <div class="dash-head"><div><h2 class="hi">Read-aloud library</h2><p class="note">The Soft Life System, narrated by Ava.</p></div></div>
      <div class="audio-card">
        <div class="audio-row"><div class="a-dot">▶</div><div><b>Introduction: The 15-Hour Promise</b><small>15 min · free for everyone</small></div></div>
        <audio controls preload="none" src="assets/audio/retail-sample.mp3"></audio>
      </div>
      ${full ? `
        <div class="audio-card">
          <div class="audio-row"><div class="a-dot">▶</div><div><b>Chapter 1 · The Hustle Hangover</b><small>15 min · member</small></div></div>
          <audio controls preload="none" src="assets/audio/intro.mp3"></audio>
        </div>` : ''}
      <div class="chapter-grid">
        ${chapters.map((c, i) => `
          <div class="ch ${full && i < 1 ? '' : 'locked'}">
            <span>${full && i < 1 ? '▶' : '🔒'}</span><div>${esc(c)}<small>${full && i < 1 ? 'Play now' : 'Included with the book'}</small></div>
          </div>`).join('')}
      </div>
      ${full ? '' : `
      <div class="upsell">
        <b>Unlock the full 3.8-hour read-aloud</b>
        <p class="note">Get the book (eBook + audiobook + worksheets) and every chapter plays here — offline-ready.</p>
        <a class="btn gold" href="#" onclick="alert('PROTOTYPE: Selar checkout for the Complete bundle');return false;">Get the book →</a>
      </div>`}
    </div>`;
  },

  async viewAffiliate(me) {
    const $m = document.getElementById('member');
    $m.innerHTML = `<div class="wrap"><div class="dash-head">
      <div><h2 class="hi">Your affiliate link</h2><p class="note">Share it. Earn <b>50%</b> on everything your referrals buy.</p></div></div>
      <div class="ref-card">
        <code id="reflink">${location.origin}/?ref=${me.ref_code}</code>
        <button class="btn dark" id="copyRef">Copy link</button>
      </div>
      <div id="refStats" class="grid3"><p class="note">Loading stats…</p></div>
      <div class="card how">
        <span class="tag">How it works</span>
        <p>1 · Share your link — on WhatsApp, TikTok, your email list, anywhere.<br>
           2 · Your friend lands on the free trial (intro + Chapter 1).<br>
           3 · They buy the book or a program — you earn 50%, paid monthly via Selar mobile money.</p>
      </div></div>`;
    document.getElementById('copyRef').addEventListener('click', async () => {
      await navigator.clipboard.writeText(document.getElementById('reflink').textContent);
      document.getElementById('copyRef').textContent = 'Copied ✓';
      setTimeout(() => (document.getElementById('copyRef').textContent = 'Copy link'), 1500);
    });
    try {
      const s = await API.affiliate();
      document.getElementById('refStats').innerHTML = `
        <div class="stat"><b>${s.clicks}</b><small>Visits from your link</small></div>
        <div class="stat"><b>${s.signups}</b><small>Free accounts</small></div>
        <div class="stat"><b>${s.commission_rate}</b><small>Your commission</small></div>`;
    } catch (e) { document.getElementById('refStats').innerHTML = `<p class="note">${esc(e.message)}</p>`; }
  },

  viewAccount(me) {
    const $m = document.getElementById('member');
    $m.innerHTML = `<div class="wrap">
      <div class="dash-head"><div><h2 class="hi">Account</h2><p class="note">Your membership at a glance.</p></div></div>
      <div class="card">
        <p><b>Name:</b> ${esc(me.name)}</p>
        <p><b>Email:</b> ${esc(me.email)}</p>
        <p><b>Plan:</b> ${me.tier === 'free' ? 'Free — intro + sample audio + task plan' : esc(me.tier)}</p>
        <p class="note">Upgrade path: get the book to unlock the full read-aloud library. (Checkout wiring: Selar webhook → tier update — production step.)</p>
        <a class="btn gold" href="#" onclick="alert('PROTOTYPE: Selar checkout — Complete bundle');return false;">Get the book →</a>
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
      this.route();
    });
  }
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

App.boot();
