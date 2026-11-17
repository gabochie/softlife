const SITE_URL = "https://soft.gabochie.com";
const FREE_AUDIO = new Set(["intro", "ch01"]);
const AUDIO_SLUGS = ["intro", ...Array.from({ length: 15 }, (_, i) => "ch" + String(i + 1).padStart(2, "0"))];
const STAFF_ROLES = ["superadmin", "sales", "support", "content"];
const CRM_STAGES = ["lead", "engaged", "checkout_abandoned", "customer", "client", "lost"];
// Which staff roles may use each admin capability. The superadmin password login
// maps to the "superadmin" role; staff logins carry their own role.
const ADMIN_CAPS = {
  overview: new Set(["superadmin", "sales", "support", "content"]),
  users: new Set(["superadmin", "sales", "support"]),
  set_tier: new Set(["superadmin", "sales", "support"]),
  set_role: new Set(["superadmin"]),
  crm: new Set(["superadmin", "sales", "support"]),
  crm_stage: new Set(["superadmin", "sales"]),
  crm_note: new Set(["superadmin", "sales", "support"]),
  analytics: new Set(["superadmin", "sales", "support", "content"]),
  referrals: new Set(["superadmin", "sales"]),
  purchases: new Set(["superadmin", "sales"]),
  onboarding: new Set(["superadmin", "sales", "support"]),
  audio: new Set(["superadmin", "sales", "support", "content"]),
  team: new Set(["superadmin"]),
  webhooks: new Set(["superadmin", "sales"]),
  security: new Set(["superadmin"])
};
// Blog registry mirrors tools/build_blog.py POSTS (slug -> title).
const BLOG_POSTS = [
  ["15-hour-workweek-for-women", "The 15-Hour Workweek for Women Who Are Done Doing Everything"],
  ["hustle-hangover-signs", "The Hustle Hangover: 7 Signs You Built a Job, Not a Business"],
  ["design-a-soft-life-week", "How to Design a Soft Life Week (Free 90-Day Plan)"],
  ["one-offer-premium-price", "One Offer, Premium Price: The Simplest Business Model That Pays"],
  ["ai-agents-soft-life-business", "AI Agents Are Coming for Your Busywork. Build a Business With a Brain, Not More Hustle."]
];
const CONSENT_VERSION = "2026-11-14";
const SESSION_DAYS = 30;
const AUDIO_TOKEN_MINUTES = 120;
const ONBOARDING_CHOICES = {
  business_stage: ["idea", "early", "growing", "established", "other"],
  main_goal: ["simplify", "offer", "systems", "delegate", "time", "freedom", "other"],
  biggest_challenge: ["time", "overwhelm", "pricing", "clients", "systems", "focus", "other"],
  revenue_range: ["pre_revenue", "under_1k", "1k_3k", "3k_10k", "10k_plus", "prefer_not"],
  team_size: ["solo", "contractors", "small_team", "team"]
};
const ACQUISITION_KEYS = ["source", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referrer"];
const EVENT_NAMES = new Set([
  "signup", "signin", "onboarding_saved", "onboarding_completed", "onboarding_skipped",
  "whatsapp_consent_granted", "whatsapp_consent_withdrawn",
  "task_added", "task_completed", "audio_play", "checkout_click"
]);
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
};
const JSON_HEADERS = {
  ...SECURITY_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

const LAUNCH_TASKS = [
  [1, "Complete the Hustle Hangover Checklist", "Chapter 1 — face where your time actually goes."],
  [1, "Complete the Four Audits", "Chapter 3 — Time, Money, Energy, Joy."],
  [1, "Calculate your Soft Life Scorecard", "Chapter 3 — score all eight dimensions."],
  [1, "Write your one-sentence business", "Chapter 4 — I help [audience] achieve [outcome] through [mechanism]."],
  [1, "Choose one audience, one offer, one outcome", "Chapter 4 — focus beats variety."],
  [2, "Redesign your offer using the Premium Offer Formula", "Chapter 5 — package your genius into premium."],
  [2, "Set your premium price", "Chapter 5 — price the transformation, not the hours."],
  [2, "Map your delivery process", "Chapter 6 — Intake, Onboard, Execute, Handoff, Follow-up."],
  [2, "Create three templates", "Chapter 6 — welcome email, proposal, follow-up."],
  [3, "Build your first automation", "Chapter 7 — scheduling and welcome email."],
  [3, "Document one task and delegate it", "Chapter 7 — the first transfer."],
  [3, "Design your Soft Life Week", "Chapter 8 — the sample 15-hour week, adapted to you."],
  [4, "Set your no-work zones", "Chapter 8 — protect rest like revenue."],
  [4, "Write your Boundary Policy", "Chapter 11 — scripts for scope, availability, requests."],
  [5, "Define your enough", "Chapter 12 — income, clients, hours, rest."],
  [8, "Schedule your monthly Soft Life Review", "Chapter 15 — the maintenance ritual."]
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        console.error("softlife api error", err);
        return json({ error: "Something went wrong." }, 500);
      }
    }

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    if (url.pathname.startsWith("/assets/") || /\.(png|jpe?g|webp|svg|ico|mp3|woff2?|ttf)$/i.test(url.pathname)) {
      headers.set("Cache-Control", "public, max-age=604800");
    } else if (/\.(css|js|json|xml|txt)$/i.test(url.pathname)) {
      headers.set("Cache-Control", "public, max-age=3600");
    } else {
      headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    }
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }
};

async function handleApi(request, env, url) {
  const path = url.pathname.replace(/\/+$/, "");

  if (path === "/api/health") {
    return json({ ok: true, service: "softlife", time: new Date().toISOString() });
  }

  if (path === "/api/config" && request.method === "GET") {
    return json({
      siteUrl: env.SITE_URL || SITE_URL,
      checkoutUrl: env.CHECKOUT_URL || "",
      selarUrl: env.SELAR_CHECKOUT_URL || env.CHECKOUT_URL || "",
      payhipUrl: env.PAYHIP_CHECKOUT_URL || "",
      country: (request.cf && request.cf.country) || "",
      supportEmail: env.SUPPORT_EMAIL || "admin@gabochie.com",
      freeAudio: [...FREE_AUDIO],
      allAudio: AUDIO_SLUGS,
      tiers: ["free", "complete"]
    });
  }

  if (path === "/api/admin/login" && request.method === "POST") return adminLogin(request, env);
  if (path === "/api/staff/login" && request.method === "POST") return staffLogin(request, env);
  if (path === "/api/admin/logout" && request.method === "POST") return adminLogout(request, env);
  if (path === "/api/webhooks/purchase" && request.method === "POST") return purchaseWebhook(request, env);

  if (path.startsWith("/api/admin/")) {
    const admin = await currentAdmin(request, env);
    if (!admin) return json({ error: "unauthorized" }, 401);
    if (!roleAllowed(admin.role, path)) return json({ error: "not allowed for your role" }, 403);
    return handleAdmin(request, env, url, path, admin);
  }

  if (path.startsWith("/api/audio/")) {
    return serveAudio(request, env, url, path.slice("/api/audio/".length).replace(/\.mp3$/, ""));
  }

  if (path === "/api/signup" && request.method === "POST") return signup(request, env);
  if (path === "/api/signin" && request.method === "POST") return signin(request, env);
  if (path === "/api/signout" && request.method === "POST") return signout(request, env);
  if (path === "/api/claim/preview" && request.method === "POST") return claimPreview(request, env);
  if (path === "/api/claim/complete" && request.method === "POST") return claimComplete(request, env);

  const user = await currentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, 401);

  if (path === "/api/audio-token" && request.method === "POST") return createAudioToken(env, user);
  if (path === "/api/me" && request.method === "GET") return json(publicUser(user));

  if (path === "/api/onboarding" && request.method === "GET") {
    return json({ onboarding: await loadOnboarding(env, user.id) });
  }

  if (path === "/api/onboarding" && request.method === "POST") {
    return saveOnboarding(request, env, user);
  }

  if (path === "/api/events" && request.method === "POST") {
    return recordEvent(request, env, user);
  }

  if (path === "/api/tasks" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, title, detail, week, kind, done FROM softlife_tasks WHERE user_id = ? ORDER BY week, id"
    ).bind(user.id).all();
    return json({ tasks: rows.results || [] });
  }

  if (path === "/api/tasks" && request.method === "POST") {
    const body = await readJson(request);
    const title = String(body.title || "").trim();
    const week = Number(body.week) || 1;
    if (!title) return json({ error: "Task needs a title." }, 400);
    const result = await env.DB.prepare(
      "INSERT INTO softlife_tasks (user_id, title, detail, week, kind) VALUES (?, ?, ?, ?, 'custom')"
    ).bind(user.id, title, String(body.detail || "").trim(), week).run();
    const row = await env.DB.prepare(
      "SELECT id, title, detail, week, kind, done FROM softlife_tasks WHERE id = ?"
    ).bind(result.meta.last_row_id).first();
    await logEvent(env, user.id, "task_added", "/tasks", { task_id: row.id });
    return json({ task: row }, 201);
  }

  if (path === "/api/tasks/toggle" && request.method === "POST") {
    const body = await readJson(request);
    const id = Number(body.id);
    if (!id) return json({ error: "not found" }, 404);
    const row = await env.DB.prepare(
      "UPDATE softlife_tasks SET done = 1 - done WHERE id = ? AND user_id = ? RETURNING id, title, detail, week, kind, done"
    ).bind(id, user.id).first();
    if (!row) return json({ error: "not found" }, 404);
    if (row.done === 1) await logEvent(env, user.id, "task_completed", "/tasks", { task_id: row.id, kind: row.kind });
    return json({ task: row });
  }

  if (path === "/api/affiliate" && request.method === "GET") {
    const clicks = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM softlife_referrals WHERE ref_code = ?"
    ).bind(user.ref_code).first();
    const signups = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM softlife_referrals WHERE ref_code = ? AND status = 'signed_up'"
    ).bind(user.ref_code).first();
    return json({
      ref_code: user.ref_code,
      clicks: clicks ? clicks.c : 0,
      signups: signups ? signups.c : 0,
      commission_rate: "30%",
      payout_note: "Payouts run monthly via Selar mobile money (MVP: manual review)."
    });
  }

  return json({ error: "not found" }, 404);
}

async function signup(request, env) {
  const body = await readJson(request);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  const ref = String(body.ref || "").trim().toUpperCase();

  if (!email || !email.includes("@") || password.length < 8) {
    return json({ error: "Valid email and 8+ character password required." }, 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM softlife_users WHERE email = ?"
  ).bind(email).first();
  if (existing) {
    return json({ error: "That email is already registered. Sign in instead." }, 409);
  }

  const salt = randomHex(8);
  const passwordHash = await hashPassword(password, salt);
  const refCode = "SL" + randomHex(3).toUpperCase();
  const purchase = await env.DB.prepare(
    "SELECT tier FROM softlife_purchases WHERE email = ? ORDER BY id DESC LIMIT 1"
  ).bind(email).first();
  const tier = purchase && purchase.tier ? purchase.tier : "free";
  const inserted = await env.DB.prepare(
    "INSERT INTO softlife_users (email, name, password_hash, salt, tier, ref_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(email, name || email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase()), passwordHash, salt, tier, refCode, ref || null).run();

  const userId = inserted.meta.last_row_id;
  // Buyer signed up after paying: close any pending access claim for this email.
  await env.DB.prepare(
    "UPDATE softlife_purchase_claims SET completed_at = datetime('now') WHERE email = ? AND completed_at IS NULL"
  ).bind(email).run();
  const acquisition = cleanAcquisition(body.acquisition, ref ? "referral" : "direct");
  await saveOnboardingRow(env, userId, {}, acquisition);
  await logEvent(env, userId, "signup", "/signup", { ref: ref || null, source: acquisition.source });
  if (ref) {
    await env.DB.prepare(
      "INSERT INTO softlife_referrals (ref_code, email, status) VALUES (?, ?, 'signed_up')"
    ).bind(ref, email).run();
  }

  if (LAUNCH_TASKS.length) {
    await env.DB.batch(
      LAUNCH_TASKS.map(([week, title, detail]) =>
        env.DB.prepare(
          "INSERT INTO softlife_tasks (user_id, title, detail, week, kind) VALUES (?, ?, ?, ?, 'launch')"
        ).bind(userId, title, detail, week)
      )
    );
  }

  const user = await env.DB.prepare("SELECT * FROM softlife_users WHERE id = ?").bind(userId).first();
  const token = await createSession(env, userId);
  return json({ token, user: publicUser(user) }, 201);
}

async function signin(request, env) {
  const body = await readJson(request);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const user = await env.DB.prepare(
    "SELECT * FROM softlife_users WHERE email = ?"
  ).bind(email).first();
  if (!user) {
    const bought = await env.DB.prepare(
      "SELECT id FROM softlife_purchases WHERE email = ? LIMIT 1"
    ).bind(email).first();
    if (bought) {
      await logSecurity(env, "member_login_failed", email, clientIp(request), "purchased but no account yet");
      return json({
        error: "We found your purchase, but this email has no login yet. Use the access link from your receipt, or create your account on the sign-up page — your purchase unlocks automatically."
      }, 401);
    }
    await logSecurity(env, "member_login_failed", email, clientIp(request));
    return json({ error: "Wrong email or password." }, 401);
  }
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.password_hash) {
    await logSecurity(env, "member_login_failed", email, clientIp(request));
    return json({ error: "Wrong email or password." }, 401);
  }
  const token = await createSession(env, user.id);
  await logEvent(env, user.id, "signin", "/signin", {});
  return json({ token, user: publicUser(user) });
}

async function validClaim(env, token) {
  if (!token) return null;
  return env.DB.prepare(
    "SELECT * FROM softlife_purchase_claims WHERE token = ? AND completed_at IS NULL "
    + "AND created_at >= datetime('now', '-30 days')"
  ).bind(token).first();
}

async function claimPreview(request, env) {
  const body = await readJson(request);
  const claim = await validClaim(env, String(body.token || ""));
  if (!claim) return json({ error: "This access link is invalid, already used, or expired." }, 404);
  return json({ email: claim.email, tier: claim.tier });
}

async function claimComplete(request, env) {
  const body = await readJson(request);
  const token = String(body.token || "");
  const name = String(body.name || "").trim();
  const password = String(body.password || "");
  if (password.length < 8) return json({ error: "Password needs at least 8 characters." }, 400);
  const claim = await validClaim(env, token);
  if (!claim) return json({ error: "This access link is invalid, already used, or expired." }, 404);
  const existing = await env.DB.prepare(
    "SELECT * FROM softlife_users WHERE email = ?"
  ).bind(claim.email).first();
  if (existing) {
    await env.DB.batch([
      env.DB.prepare("UPDATE softlife_users SET tier = ? WHERE id = ?").bind(claim.tier, existing.id),
      env.DB.prepare("UPDATE softlife_purchase_claims SET completed_at = datetime('now') WHERE id = ?").bind(claim.id),
    ]);
    return json({ ok: true, upgraded_existing: true });
  }
  const salt = randomHex(8);
  const passwordHash = await hashPassword(password, salt);
  const inserted = await env.DB.prepare(
    "INSERT INTO softlife_users (email, name, password_hash, salt, tier, ref_code) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    claim.email,
    name || claim.email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase()),
    passwordHash,
    salt,
    claim.tier,
    "SL" + randomHex(3).toUpperCase()
  ).run();
  const userId = inserted.meta.last_row_id;
  await saveOnboardingRow(env, userId, {}, cleanAcquisition(null, "purchase"));
  await logEvent(env, userId, "signup", "/claim", { source: "purchase" });
  if (LAUNCH_TASKS.length) {
    await env.DB.batch(
      LAUNCH_TASKS.map(([week, title, detail]) =>
        env.DB.prepare(
          "INSERT INTO softlife_tasks (user_id, title, detail, week, kind) VALUES (?, ?, ?, ?, 'launch')"
        ).bind(userId, title, detail, week)
      )
    );
  }
  await env.DB.prepare(
    "UPDATE softlife_purchase_claims SET completed_at = datetime('now') WHERE id = ?"
  ).bind(claim.id).run();
  const user = await env.DB.prepare("SELECT * FROM softlife_users WHERE id = ?").bind(userId).first();
  const sessionToken = await createSession(env, userId);
  return json({ token: sessionToken, user: publicUser(user) }, 201);
}

async function signout(request, env) {
  const token = bearerToken(request);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM softlife_sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  return json({ ok: true });
}

async function currentUser(request, env) {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  return env.DB.prepare(
    "SELECT u.* FROM softlife_sessions s JOIN softlife_users u ON u.id = s.user_id "
    + "WHERE s.token_hash = ? AND s.expires_at > datetime('now')"
  ).bind(tokenHash).first();
}

async function currentAudioUser(env, url) {
  const token = url.searchParams.get("token") || "";
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  return env.DB.prepare(
    "SELECT u.* FROM softlife_audio_tokens s JOIN softlife_users u ON u.id = s.user_id "
    + "WHERE s.token_hash = ? AND s.expires_at > datetime('now')"
  ).bind(tokenHash).first();
}

async function createSession(env, userId) {
  const token = randomHex(24);
  const tokenHash = await sha256Hex(token);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM softlife_sessions WHERE expires_at <= datetime('now')"),
    env.DB.prepare(
      "INSERT INTO softlife_sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', ?))"
    ).bind(tokenHash, userId, "+" + SESSION_DAYS + " days")
  ]);
  return token;
}

async function createAudioToken(env, user) {
  const token = randomHex(24);
  const tokenHash = await sha256Hex(token);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM softlife_audio_tokens WHERE expires_at <= datetime('now')"),
    env.DB.prepare(
      "INSERT INTO softlife_audio_tokens (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', ?))"
    ).bind(tokenHash, user.id, "+" + AUDIO_TOKEN_MINUTES + " minutes")
  ]);
  return json({
    token,
    expires_in: AUDIO_TOKEN_MINUTES * 60,
    expires_at: new Date(Date.now() + AUDIO_TOKEN_MINUTES * 60000).toISOString()
  });
}

function cleanText(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanChoice(value, allowed) {
  const choice = String(value ?? "").trim();
  return allowed.includes(choice) ? choice : "";
}

function cleanAcquisition(value, fallbackSource = "direct") {
  const source = value && typeof value === "object" ? value : {};
  const out = {};
  for (const key of ACQUISITION_KEYS) {
    out[key] = cleanText(source[key], key === "referrer" ? 300 : 120);
  }
  if (!out.source) out.source = fallbackSource;
  return out;
}

function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? "+" + digits : "";
}

function toBool(value) {
  return value === true || value === 1 || value === "1" || value === "true" || value === "on";
}

async function loadOnboarding(env, userId) {
  return env.DB.prepare("SELECT * FROM softlife_onboarding WHERE user_id = ?").bind(userId).first();
}

async function saveOnboardingRow(env, userId, body, acquisition = null) {
  const existing = await loadOnboarding(env, userId);
  const now = new Date().toISOString();
  const row = {
    business_name: "", business_stage: "", country: "", timezone: "",
    main_goal: "", biggest_challenge: "", revenue_range: "", team_size: "",
    whatsapp_number: "", whatsapp_consent: 0, whatsapp_consent_at: null,
    marketing_consent: 0, marketing_consent_at: null, consent_version: "",
    source: "", utm_source: "", utm_medium: "", utm_campaign: "",
    utm_content: "", utm_term: "", referrer: "", completed_at: null,
    ...(existing || {})
  };
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
  const textFields = { business_name: 120, country: 80, timezone: 64 };
  for (const [key, max] of Object.entries(textFields)) {
    if (has(key)) row[key] = cleanText(body[key], max);
  }
  for (const [key, allowed] of Object.entries(ONBOARDING_CHOICES)) {
    if (has(key)) row[key] = cleanChoice(body[key], allowed);
  }
  if (has("whatsapp_consent")) {
    const next = toBool(body.whatsapp_consent) ? 1 : 0;
    if (next !== Number(row.whatsapp_consent || 0)) row.whatsapp_consent_at = now;
    row.whatsapp_consent = next;
    if (!next) row.whatsapp_number = "";
  }
  if (has("whatsapp_number")) {
    row.whatsapp_number = normalizePhone(body.whatsapp_number);
  }
  if (has("marketing_consent")) {
    const next = toBool(body.marketing_consent) ? 1 : 0;
    if (next !== Number(row.marketing_consent || 0)) row.marketing_consent_at = now;
    row.marketing_consent = next;
  }
  if (has("whatsapp_consent") || has("marketing_consent")) row.consent_version = CONSENT_VERSION;

  if (acquisition) {
    for (const key of ACQUISITION_KEYS) {
      if (!row[key] && acquisition[key]) row[key] = acquisition[key];
    }
  }
  if (!row.source) row.source = "direct";
  if (row.business_stage && row.main_goal && row.biggest_challenge && !row.completed_at) {
    row.completed_at = now;
  }

  await env.DB.prepare(
    `INSERT INTO softlife_onboarding (
      user_id, business_name, business_stage, country, timezone, main_goal,
      biggest_challenge, revenue_range, team_size, whatsapp_number,
      whatsapp_consent, whatsapp_consent_at, marketing_consent, marketing_consent_at,
      consent_version, source, utm_source, utm_medium, utm_campaign, utm_content,
      utm_term, referrer, completed_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      business_name = excluded.business_name,
      business_stage = excluded.business_stage,
      country = excluded.country,
      timezone = excluded.timezone,
      main_goal = excluded.main_goal,
      biggest_challenge = excluded.biggest_challenge,
      revenue_range = excluded.revenue_range,
      team_size = excluded.team_size,
      whatsapp_number = excluded.whatsapp_number,
      whatsapp_consent = excluded.whatsapp_consent,
      whatsapp_consent_at = excluded.whatsapp_consent_at,
      marketing_consent = excluded.marketing_consent,
      marketing_consent_at = excluded.marketing_consent_at,
      consent_version = excluded.consent_version,
      source = excluded.source,
      utm_source = excluded.utm_source,
      utm_medium = excluded.utm_medium,
      utm_campaign = excluded.utm_campaign,
      utm_content = excluded.utm_content,
      utm_term = excluded.utm_term,
      referrer = excluded.referrer,
      completed_at = excluded.completed_at,
      updated_at = excluded.updated_at`
  ).bind(
    userId, row.business_name, row.business_stage, row.country, row.timezone, row.main_goal,
    row.biggest_challenge, row.revenue_range, row.team_size, row.whatsapp_number,
    row.whatsapp_consent, row.whatsapp_consent_at, row.marketing_consent, row.marketing_consent_at,
    row.consent_version, row.source, row.utm_source, row.utm_medium, row.utm_campaign, row.utm_content,
    row.utm_term, row.referrer, row.completed_at, now
  ).run();
  return loadOnboarding(env, userId);
}

async function saveOnboarding(request, env, user) {
  const body = await readJson(request);
  const existing = await loadOnboarding(env, user.id);
  const hasConsent = Object.prototype.hasOwnProperty.call(body, "whatsapp_consent");
  const nextConsent = hasConsent ? toBool(body.whatsapp_consent) : Boolean(existing && existing.whatsapp_consent);
  const nextPhone = normalizePhone(
    Object.prototype.hasOwnProperty.call(body, "whatsapp_number")
      ? body.whatsapp_number
      : existing && existing.whatsapp_number
  );
  if (nextConsent && !nextPhone) {
    return json({ error: "Add a valid WhatsApp number with country code, or uncheck the community box." }, 400);
  }
  if (hasConsent) body.whatsapp_number = nextConsent ? nextPhone : "";

  const acquisition = cleanAcquisition(body.acquisition, existing && existing.source ? existing.source : "direct");
  const before = existing || {};
  const row = await saveOnboardingRow(env, user.id, body, acquisition);
  if (!before.completed_at && row.completed_at) {
    await logEvent(env, user.id, "onboarding_completed", "/onboarding", {});
  } else {
    await logEvent(env, user.id, "onboarding_saved", "/onboarding", {});
  }
  if (Number(before.whatsapp_consent || 0) !== Number(row.whatsapp_consent || 0)) {
    await logEvent(
      env, user.id,
      row.whatsapp_consent ? "whatsapp_consent_granted" : "whatsapp_consent_withdrawn",
      "/onboarding", { consent_version: CONSENT_VERSION }
    );
  }
  return json({ onboarding: row });
}

async function recordEvent(request, env, user) {
  const body = await readJson(request);
  const event = String(body.event || "").trim();
  if (!EVENT_NAMES.has(event)) return json({ error: "unknown event" }, 400);
  const path = cleanText(body.path, 200);
  const meta = body.meta && typeof body.meta === "object" && !Array.isArray(body.meta) ? body.meta : {};
  await logEvent(env, user.id, event, path, meta);
  return json({ ok: true });
}

async function logEvent(env, userId, event, path, meta) {
  if (!userId || !EVENT_NAMES.has(event)) return;
  let payload = JSON.stringify(meta || {});
  if (payload.length > 2000) payload = JSON.stringify({ truncated: true });
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_events (user_id, event, path, meta) VALUES (?, ?, ?, ?)"
    ).bind(userId, event, cleanText(path, 200), payload).run();
  } catch (err) {
    console.warn("softlife event log failed", event, err);
  }
}

async function serveAudio(request, env, url, slug) {
  const user = await currentUser(request, env) || await currentAudioUser(env, url);
  if (!user) return json({ error: "unauthorized" }, 401);
  if (!/^[a-z0-9-]+$/.test(slug || "")) return json({ error: "not found" }, 404);
  if (user.tier === "free" && !FREE_AUDIO.has(slug)) {
    return json({ error: "locked — included with the full book" }, 403);
  }

  const audio = await env.SOFTLIFE_AUDIO.get("audio:" + slug, { type: "arrayBuffer" });
  if (!audio) return json({ error: "not found" }, 404);

  const size = audio.byteLength;
  const headers = {
    ...SECURITY_HEADERS,
    "Content-Type": "audio/mpeg",
    "Content-Length": String(size),
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=0"
  };

  const range = request.headers.get("Range") || "";
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (match) {
    let start = match[1] ? Number(match[1]) : 0;
    let end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { ...SECURITY_HEADERS, "Content-Range": "bytes */" + size }
      });
    }
    end = Math.min(end, size - 1);
    const chunk = audio.slice(start, end + 1);
    return new Response(chunk, {
      status: 206,
      headers: {
        ...headers,
        "Content-Length": String(chunk.byteLength),
        "Content-Range": "bytes " + start + "-" + end + "/" + size
      }
    });
  }

  return new Response(audio, { headers });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
    role: user.role || "member",
    ref_code: user.ref_code
  };
}

function bearerToken(request) {
  const auth = request.headers.get("Authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function clientIp(request) {
  return String(request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "").split(",")[0].trim();
}

async function logWebhook(env, status, data, orderId, email, error = "") {
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_webhook_logs (status, order_id, email, payload, error) VALUES (?, ?, ?, ?, ?)"
    ).bind(status, orderId, email, JSON.stringify(data || {}).slice(0, 4000), String(error || "").slice(0, 500)).run();
  } catch (exc) {
    // Ledger logging must never break the webhook.
  }
}

async function logSecurity(env, kind, email = "", ip = "", detail = "") {
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_security_log (kind, email, ip, detail) VALUES (?, ?, ?, ?)"
    ).bind(kind, String(email || "").slice(0, 120), String(ip || "").slice(0, 64), String(detail || "").slice(0, 500)).run();
  } catch (exc) {
    // Security logging must never break the request path.
  }
}

async function audit(env, actor, action, target, meta = {}) {
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_audit_logs (actor, action, target, meta) VALUES (?, ?, ?, ?)"
    ).bind(actor || "superadmin", action, target || "", JSON.stringify(meta)).run();
  } catch (exc) {
    // Audit logging must never break the request path.
  }
}

function capForRoute(path) {
  if (path.startsWith("/api/admin/analytics/")) return "analytics";
  if (path.startsWith("/api/admin/webhooks")) return "webhooks";
  if (path === "/api/admin/claims") return "webhooks";
  if (path === "/api/admin/security") return "security";
  if (path === "/api/admin/crm/stage") return "crm_stage";
  if (path === "/api/admin/crm/notes") return "crm_note";
  if (path.startsWith("/api/admin/crm")) return "crm";
  if (path.startsWith("/api/admin/team")) return "team";
  if (/^\/api\/admin\/users\/\d+\/tier$/.test(path)) return "set_tier";
  if (/^\/api\/admin\/users\/\d+\/role$/.test(path)) return "set_role";
  if (path === "/api/admin/overview") return "overview";
  if (path === "/api/admin/users") return "users";
  if (path === "/api/admin/referrals") return "referrals";
  if (path === "/api/admin/purchases") return "purchases";
  if (path === "/api/admin/onboarding") return "onboarding";
  if (path === "/api/admin/audio") return "audio";
  return null;
}

function roleAllowed(role, path) {
  const cap = capForRoute(path);
  return Boolean(cap) && ADMIN_CAPS[cap] instanceof Set && ADMIN_CAPS[cap].has(role);
}

async function adminLogin(request, env) {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "Admin login is not configured." }, 503);
  }
  const body = await readJson(request);
  const password = String(body.password || "");
  if (!safeEqual(password, env.ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 400));
    await logSecurity(env, "admin_login_failed", "", clientIp(request));
    return json({ error: "Wrong admin password." }, 401);
  }
  const token = randomHex(32);
  const tokenHash = await sha256Hex(token);
  const hours = Math.min(72, Math.max(1, Number(env.ADMIN_SESSION_HOURS) || 12));
  await env.DB.prepare("DELETE FROM softlife_admin_sessions WHERE expires_at <= datetime('now')").run();
  await env.DB.prepare(
    "INSERT INTO softlife_admin_sessions (token_hash, expires_at) VALUES (?, datetime('now', ?))"
  ).bind(tokenHash, "+" + hours + " hours").run();
  return json({
    token,
    role: "superadmin",
    expires_at: new Date(Date.now() + hours * 3600 * 1000).toISOString()
  });
}

async function staffLogin(request, env) {
  const body = await readJson(request);
  const email = cleanText(body.email, 120).toLowerCase();
  const password = String(body.password || "");
  const row = await env.DB.prepare(
    "SELECT * FROM softlife_staff_users WHERE lower(email) = ? AND active = 1"
  ).bind(email).first();
  if (!row) {
    await new Promise((r) => setTimeout(r, 400));
    await logSecurity(env, "staff_login_failed", email, clientIp(request));
    return json({ error: "Wrong email or password." }, 401);
  }
  const hash = await hashPassword(password, row.salt);
  if (hash !== row.password_hash) {
    await new Promise((r) => setTimeout(r, 400));
    await logSecurity(env, "staff_login_failed", email, clientIp(request));
    return json({ error: "Wrong email or password." }, 401);
  }
  const token = randomHex(32);
  const tokenHash = await sha256Hex(token);
  const hours = Math.min(72, Math.max(1, Number(env.ADMIN_SESSION_HOURS) || 12));
  await env.DB.prepare("DELETE FROM softlife_staff_sessions WHERE expires_at <= datetime('now')").run();
  await env.DB.prepare(
    "INSERT INTO softlife_staff_sessions (token_hash, staff_id, expires_at) VALUES (?, ?, datetime('now', ?))"
  ).bind(tokenHash, row.id, "+" + hours + " hours").run();
  return json({
    token,
    role: row.role,
    name: row.name,
    expires_at: new Date(Date.now() + hours * 3600 * 1000).toISOString()
  });
}

async function adminLogout(request, env) {
  const token = bearerToken(request);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM softlife_admin_sessions WHERE token_hash = ?").bind(tokenHash),
      env.DB.prepare("DELETE FROM softlife_staff_sessions WHERE token_hash = ?").bind(tokenHash),
    ]);
  }
  return json({ ok: true });
}

async function currentAdmin(request, env) {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const legacy = await env.DB.prepare(
    "SELECT token_hash FROM softlife_admin_sessions WHERE token_hash = ? AND expires_at > datetime('now')"
  ).bind(tokenHash).first();
  if (legacy) {
    return { role: "superadmin", name: "Super-admin", actor: "superadmin" };
  }
  const staff = await env.DB.prepare(
    `SELECT s.id, s.email, s.name, s.role FROM softlife_staff_users s
     JOIN softlife_staff_sessions ss ON ss.staff_id = s.id
     WHERE ss.token_hash = ? AND ss.expires_at > datetime('now') AND s.active = 1`
  ).bind(tokenHash).first();
  if (staff) {
    return { role: staff.role, name: staff.name || staff.email, actor: staff.email, staffId: staff.id };
  }
  return null;
}

async function handleAdmin(request, env, url, path, admin = { role: "superadmin", actor: "superadmin" }) {
  if (path === "/api/admin/overview" && request.method === "GET") {
    const [users, week, month, tasks, done, referrals, purchases, revenue, onboarded, whatsapp, events7d] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users WHERE created_at >= datetime('now', '-7 days')"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users WHERE created_at >= datetime('now', '-30 days')"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_tasks"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_tasks WHERE done = 1"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_referrals"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_purchases"),
      env.DB.prepare("SELECT COALESCE(SUM(amount), 0) AS s FROM softlife_purchases"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_onboarding WHERE completed_at IS NOT NULL"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_onboarding WHERE whatsapp_consent = 1"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_events WHERE created_at >= datetime('now', '-7 days')")
    ]);
    const audio = await env.SOFTLIFE_AUDIO.list({ prefix: "audio:", limit: 100 });
    const uploaded = (audio.keys || []).map((k) => k.name.replace(/^audio:/, "")).sort();
    return json({
      users: countValue(users),
      signups7d: countValue(week),
      signups30d: countValue(month),
      tasks: countValue(tasks),
      tasksDone: countValue(done),
      referrals: countValue(referrals),
      purchases: countValue(purchases),
      revenue: revenue && revenue.results && revenue.results[0] ? revenue.results[0].s : 0,
      onboardingCompleted: countValue(onboarded),
      whatsappOptIn: countValue(whatsapp),
      events7d: countValue(events7d),
      audio: { uploaded, count: uploaded.length, expected: AUDIO_SLUGS.length },
      generatedAt: new Date().toISOString()
    });
  }

  if (path === "/api/admin/users" && request.method === "GET") {
    const q = String(url.searchParams.get("q") || "").trim();
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
    const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
    const like = "%" + q + "%";
    const rows = await env.DB.prepare(
      `SELECT u.id, u.email, u.name, u.tier, u.role, u.ref_code, u.created_at,
        (SELECT COUNT(*) FROM softlife_tasks t WHERE t.user_id = u.id) AS tasks,
        (SELECT COUNT(*) FROM softlife_tasks t WHERE t.user_id = u.id AND t.done = 1) AS done
       FROM softlife_users u
       WHERE (? = '' OR u.email LIKE ? OR u.name LIKE ?)
       ORDER BY u.id DESC LIMIT ? OFFSET ?`
    ).bind(q, like, like, limit, offset).all();
    return json({ users: rows.results || [], q, limit, offset });
  }

  const tierMatch = path.match(/^\/api\/admin\/users\/(\d+)\/tier$/);
  if (tierMatch && request.method === "POST") {
    const body = await readJson(request);
    const tier = String(body.tier || "");
    if (!["free", "complete"].includes(tier)) return json({ error: "invalid tier" }, 400);
    const row = await env.DB.prepare(
      "UPDATE softlife_users SET tier = ? WHERE id = ? RETURNING id, email, name, tier, role"
    ).bind(tier, Number(tierMatch[1])).first();
    if (!row) return json({ error: "not found" }, 404);
    await audit(env, admin.actor, "tier", "user:" + tierMatch[1], { value: tier });
    return json({ user: row });
  }

  const roleMatch = path.match(/^\/api\/admin\/users\/(\d+)\/role$/);
  if (roleMatch && request.method === "POST") {
    const body = await readJson(request);
    const role = String(body.role || "");
    if (!["member", "admin", "superadmin"].includes(role)) return json({ error: "invalid role" }, 400);
    const row = await env.DB.prepare(
      "UPDATE softlife_users SET role = ? WHERE id = ? RETURNING id, email, name, tier, role"
    ).bind(role, Number(roleMatch[1])).first();
    if (!row) return json({ error: "not found" }, 404);
    await audit(env, admin.actor, "role", "user:" + roleMatch[1], { value: role });
    return json({ user: row });
  }

  if (path === "/api/admin/referrals" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, ref_code, email, status, created_at FROM softlife_referrals ORDER BY id DESC LIMIT 100"
    ).all();
    return json({ referrals: rows.results || [] });
  }

  if (path === "/api/admin/purchases" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT id, order_id, email, tier, amount, currency, provider, created_at FROM softlife_purchases ORDER BY id DESC LIMIT 100"
    ).all();
    return json({ purchases: rows.results || [] });
  }

  if (path === "/api/admin/onboarding" && request.method === "GET") {
    const rows = await env.DB.prepare(
      `SELECT o.*, u.email, u.name, u.tier
       FROM softlife_onboarding o JOIN softlife_users u ON u.id = o.user_id
       ORDER BY o.updated_at DESC LIMIT 200`
    ).all();
    return json({ onboarding: rows.results || [] });
  }

  if (path === "/api/admin/audio" && request.method === "GET") {
    const audio = await env.SOFTLIFE_AUDIO.list({ prefix: "audio:", limit: 100 });
    const uploaded = (audio.keys || []).map((k) => k.name.replace(/^audio:/, "")).sort();
    return json({
      uploaded,
      missing: AUDIO_SLUGS.filter((s) => !uploaded.includes(s)),
      expected: AUDIO_SLUGS
    });
  }

  // ---------- product analytics ----------

  function dailySeries(rows, days, key) {
    const byDay = {};
    for (const row of rows) byDay[row.d] = Number(row.c || 0);
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      out.push({ day, [key]: byDay[day] || 0 });
    }
    return out;
  }

  if (path === "/api/admin/analytics/overview" && request.method === "GET") {
    const [usersTotal, dau, wau, mau, activated, velocity] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_users"),
      env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS c FROM softlife_events WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-1 day')"),
      env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS c FROM softlife_events WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-7 days')"),
      env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS c FROM softlife_events WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-30 days')"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM (SELECT user_id FROM softlife_events WHERE event = 'task_completed' GROUP BY user_id HAVING COUNT(*) >= 3)"),
      env.DB.prepare("SELECT AVG(julianday(e.first_done) - julianday(u.created_at)) AS v FROM softlife_users u JOIN (SELECT user_id, MIN(created_at) AS first_done FROM softlife_events WHERE event = 'task_completed' GROUP BY user_id) e ON e.user_id = u.id")
    ]);
    const users = countValue(usersTotal);
    const activatedCount = countValue(activated);
    const days = velocity && velocity.results && velocity.results[0] && velocity.results[0].v != null
      ? Math.round(Number(velocity.results[0].v) * 10) / 10 : null;
    const seriesRows = await env.DB.prepare(
      "SELECT date(created_at) AS d, COUNT(DISTINCT user_id) AS c FROM softlife_events WHERE user_id IS NOT NULL AND created_at >= datetime('now', '-29 days') GROUP BY d"
    ).all();
    return json({
      users,
      dau: countValue(dau),
      wau: countValue(wau),
      mau: countValue(mau),
      activationRate: users ? Math.round((100 * activatedCount) / users) : 0,
      activatedUsers: activatedCount,
      daysToFirstTask: days,
      dailyActive: dailySeries(seriesRows.results || [], 30, "active"),
      generatedAt: new Date().toISOString()
    });
  }

  if (path === "/api/admin/analytics/audio" && request.method === "GET") {
    const [playsRows, completionsRows] = await env.DB.batch([
      env.DB.prepare("SELECT json_extract(meta, '$.slug') AS slug, COUNT(*) AS plays, COUNT(DISTINCT user_id) AS listeners FROM softlife_events WHERE event = 'audio_play' AND json_extract(meta, '$.slug') IS NOT NULL GROUP BY slug"),
      env.DB.prepare("SELECT json_extract(meta, '$.slug') AS slug, COUNT(*) AS completions FROM softlife_events WHERE event = 'audio_complete' AND json_extract(meta, '$.slug') IS NOT NULL GROUP BY slug")
    ]);
    const plays = {};
    for (const r of playsRows.results || []) plays[r.slug] = { plays: Number(r.plays || 0), listeners: Number(r.listeners || 0) };
    const completions = {};
    for (const r of completionsRows.results || []) completions[r.slug] = Number(r.completions || 0);
    const chapters = AUDIO_SLUGS.map((slug) => ({
      slug,
      plays: (plays[slug] || { plays: 0 }).plays,
      listeners: (plays[slug] || { listeners: 0 }).listeners,
      completions: completions[slug] || 0
    }));
    return json({ chapters, expected: AUDIO_SLUGS });
  }

  if (path === "/api/admin/analytics/tasks" && request.method === "GET") {
    const [weeks, topTasks, completedEvents, addedEvents] = await env.DB.batch([
      env.DB.prepare("SELECT COALESCE(week, 0) AS week, COUNT(*) AS total, COALESCE(SUM(done), 0) AS done FROM softlife_tasks GROUP BY week ORDER BY week"),
      env.DB.prepare("SELECT title, week, COUNT(*) AS total, COALESCE(SUM(done), 0) AS done FROM softlife_tasks GROUP BY title ORDER BY done DESC, total DESC LIMIT 16"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_events WHERE event = 'task_completed'"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_events WHERE event = 'task_added'")
    ]);
    return json({
      weeks: weeks.results || [],
      topTasks: topTasks.results || [],
      completedEvents: countValue(completedEvents),
      addedEvents: countValue(addedEvents)
    });
  }

  if (path === "/api/admin/analytics/onboarding" && request.method === "GET") {
    const fields = ["business_name", "business_stage", "country", "timezone", "main_goal",
      "biggest_challenge", "revenue_range", "team_size", "whatsapp_number"];
    const startedRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_onboarding").first();
    const started = Number(startedRow && startedRow.c || 0);
    const steps = [];
    for (const field of fields) {
      const filledRow = await env.DB.prepare(
        `SELECT COUNT(*) AS c FROM softlife_onboarding WHERE ${field} != ''`
      ).first();
      const filled = Number(filledRow && filledRow.c || 0);
      steps.push({ field, filled, rate: started ? Math.round((100 * filled) / started) : 0 });
    }
    const [completed, optIn] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_onboarding WHERE completed_at IS NOT NULL"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_onboarding WHERE whatsapp_consent = 1")
    ]);
    return json({
      started,
      completed: countValue(completed),
      whatsappOptIn: countValue(optIn),
      steps
    });
  }

  if (path === "/api/admin/analytics/engagement" && request.method === "GET") {
    const [pages, byEvent, seriesRows] = await env.DB.batch([
      env.DB.prepare("SELECT path, COUNT(*) AS views, COUNT(DISTINCT user_id) AS users FROM softlife_events WHERE event = 'page_view' GROUP BY path ORDER BY views DESC LIMIT 12"),
      env.DB.prepare("SELECT event, COUNT(*) AS c FROM softlife_events GROUP BY event ORDER BY c DESC"),
      env.DB.prepare("SELECT date(created_at) AS d, COUNT(*) AS c FROM softlife_events WHERE created_at >= datetime('now', '-13 days') GROUP BY d")
    ]);
    return json({
      pages: pages.results || [],
      byEvent: byEvent.results || [],
      dailyEvents: dailySeries(seriesRows.results || [], 14, "events")
    });
  }

  if (path === "/api/admin/analytics/content" && request.method === "GET") {
    const [posts, sources, referrers, seriesRows] = await env.DB.batch([
      env.DB.prepare("SELECT path, COUNT(*) AS views, COUNT(DISTINCT user_id) AS members, SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) AS anonymous FROM softlife_events WHERE event = 'page_view' AND path LIKE '/blog/%' GROUP BY path ORDER BY views DESC LIMIT 20"),
      env.DB.prepare("SELECT COALESCE(NULLIF(json_extract(meta, '$.utm_source'), ''), '(none)') AS utm, COUNT(*) AS c FROM softlife_events WHERE event = 'page_view' GROUP BY 1 ORDER BY c DESC LIMIT 8"),
      env.DB.prepare("SELECT COALESCE(NULLIF(json_extract(meta, '$.referrer'), ''), '(direct)') AS referrer, COUNT(*) AS c FROM softlife_events WHERE event = 'page_view' GROUP BY 1 ORDER BY c DESC LIMIT 10"),
      env.DB.prepare("SELECT date(created_at) AS d, COUNT(*) AS c FROM softlife_events WHERE event = 'page_view' AND created_at >= datetime('now', '-13 days') GROUP BY d")
    ]);
    const titles = Object.fromEntries(BLOG_POSTS.map(([slug, title]) => ["/blog/" + slug + "/", title]));
    const postRows = (posts.results || []).map((r) => ({ ...r, title: titles[r.path] || r.path }));
    return json({
      posts: postRows,
      expectedPosts: BLOG_POSTS.map(([slug]) => "/blog/" + slug + "/"),
      sources: sources.results || [],
      referrers: referrers.results || [],
      dailyViews: dailySeries(seriesRows.results || [], 14, "views"),
      generatedAt: new Date().toISOString()
    });
  }

  // ---------- security monitor ----------

  if (path === "/api/admin/security" && request.method === "GET") {
    const [last24, last7, memberSessions, adminSessions, staffSessions, recent, auditRows] = await env.DB.batch([
      env.DB.prepare("SELECT kind, COUNT(*) AS c FROM softlife_security_log WHERE created_at >= datetime('now', '-1 days') GROUP BY kind"),
      env.DB.prepare("SELECT kind, COUNT(*) AS c FROM softlife_security_log WHERE created_at >= datetime('now', '-7 days') GROUP BY kind"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_sessions WHERE expires_at > datetime('now')"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_admin_sessions WHERE expires_at > datetime('now')"),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_staff_sessions WHERE expires_at > datetime('now')"),
      env.DB.prepare("SELECT id, kind, email, ip, detail, created_at FROM softlife_security_log ORDER BY id DESC LIMIT 50"),
      env.DB.prepare("SELECT id, actor, action, target, created_at FROM softlife_audit_logs ORDER BY id DESC LIMIT 25")
    ]);
    const toCounts = (res) => {
      const out = {};
      for (const r of (res.results || [])) out[r.kind] = Number(r.c || 0);
      return out;
    };
    return json({
      last24: toCounts(last24),
      last7: toCounts(last7),
      liveSessions: {
        member: countValue(memberSessions),
        admin: countValue(adminSessions),
        staff: countValue(staffSessions)
      },
      recent: recent.results || [],
      audit: auditRows.results || [],
      generatedAt: new Date().toISOString()
    });
  }

  // ---------- staff team (RBAC) ----------

  if (path === "/api/admin/team" && request.method === "GET") {
    const rows = await env.DB.prepare(
      `SELECT s.id, s.email, s.name, s.role, s.active, s.created_at,
        (SELECT COUNT(*) FROM softlife_staff_sessions ss WHERE ss.staff_id = s.id
         AND ss.expires_at > datetime('now')) AS sessions
       FROM softlife_staff_users s ORDER BY s.id`
    ).all();
    return json({ staff: rows.results || [], roles: STAFF_ROLES });
  }

  if (path === "/api/admin/team" && request.method === "POST") {
    const body = await readJson(request);
    const email = cleanText(body.email, 120).toLowerCase();
    const name = cleanText(body.name, 80);
    const role = String(body.role || "");
    const password = String(body.password || "");
    if (!email || !email.includes("@")) return json({ error: "A valid email is required." }, 400);
    if (!STAFF_ROLES.includes(role) || role === "superadmin") {
      return json({ error: "Pick a staff role: sales, support or content." }, 400);
    }
    if (password.length < 8) return json({ error: "Password needs at least 8 characters." }, 400);
    const exists = await env.DB.prepare(
      "SELECT id FROM softlife_staff_users WHERE lower(email) = ?"
    ).bind(email).first();
    if (exists) return json({ error: "That email already has a staff account." }, 409);
    const salt = randomHex(16);
    const passwordHash = await hashPassword(password, salt);
    const inserted = await env.DB.prepare(
      "INSERT INTO softlife_staff_users (email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)"
    ).bind(email, name, passwordHash, salt, role).run();
    const staffId = inserted.meta.last_row_id;
    await audit(env, admin.actor, "staff_added", "staff:" + staffId, { email, role });
    const row = await env.DB.prepare(
      "SELECT id, email, name, role, active, created_at FROM softlife_staff_users WHERE id = ?"
    ).bind(staffId).first();
    return json({ staff: row });
  }

  const teamActiveMatch = path.match(/^\/api\/admin\/team\/(\d+)\/active$/);
  if (teamActiveMatch && request.method === "POST") {
    const body = await readJson(request);
    const staffId = Number(teamActiveMatch[1]);
    const exists = await env.DB.prepare("SELECT id FROM softlife_staff_users WHERE id = ?").bind(staffId).first();
    if (!exists) return json({ error: "not found" }, 404);
    const active = body.active === true || body.active === 1 || body.active === "1" ? 1 : 0;
    await env.DB.prepare("UPDATE softlife_staff_users SET active = ? WHERE id = ?").bind(active, staffId).run();
    if (!active) {
      await env.DB.prepare(
        "DELETE FROM softlife_staff_sessions WHERE staff_id = ? AND expires_at > datetime('now')"
      ).bind(staffId).run();
    }
    await audit(env, admin.actor, active ? "staff_active" : "staff_deactivated", "staff:" + staffId, {});
    const row = await env.DB.prepare(
      "SELECT id, email, name, role, active, created_at FROM softlife_staff_users WHERE id = ?"
    ).bind(staffId).first();
    return json({ staff: row });
  }

  const teamRoleMatch = path.match(/^\/api\/admin\/team\/(\d+)\/role$/);
  if (teamRoleMatch && request.method === "POST") {
    const body = await readJson(request);
    const staffId = Number(teamRoleMatch[1]);
    const role = String(body.role || "");
    if (!STAFF_ROLES.includes(role) || role === "superadmin") {
      return json({ error: "Pick a staff role: sales, support or content." }, 400);
    }
    const exists = await env.DB.prepare("SELECT id FROM softlife_staff_users WHERE id = ?").bind(staffId).first();
    if (!exists) return json({ error: "not found" }, 404);
    await env.DB.prepare("UPDATE softlife_staff_users SET role = ? WHERE id = ?").bind(role, staffId).run();
    await audit(env, admin.actor, "staff_role", "staff:" + staffId, { role });
    const row = await env.DB.prepare(
      "SELECT id, email, name, role, active, created_at FROM softlife_staff_users WHERE id = ?"
    ).bind(staffId).first();
    return json({ staff: row });
  }

  // ---------- CRM ----------

  if (path === "/api/admin/crm" && request.method === "GET") {
    const uid = Number(url.searchParams.get("user_id")) || 0;
    const member = await env.DB.prepare(
      "SELECT id, email, name, tier, role, ref_code, referred_by, created_at FROM softlife_users WHERE id = ?"
    ).bind(uid).first();
    if (!member) return json({ error: "not found" }, 404);
    const [onb, purchases, timeline, signalsRows, stageRow, notes] = await env.DB.batch([
      env.DB.prepare("SELECT * FROM softlife_onboarding WHERE user_id = ?").bind(uid),
      env.DB.prepare("SELECT id, order_id, tier, amount, currency, provider, created_at FROM softlife_purchases WHERE lower(email) = lower(?) ORDER BY id DESC").bind(member.email),
      env.DB.prepare("SELECT event, path, meta, created_at FROM softlife_events WHERE user_id = ? ORDER BY id DESC LIMIT 25").bind(uid),
      env.DB.prepare(`SELECT
        (SELECT COUNT(*) FROM softlife_tasks WHERE user_id = ?1 AND done = 1) AS tasksDone,
        (SELECT COUNT(*) FROM softlife_tasks WHERE user_id = ?1) AS tasksTotal,
        (SELECT COUNT(*) FROM softlife_events WHERE user_id = ?1 AND event = 'audio_play') AS audioStarted,
        (SELECT COUNT(*) FROM softlife_events WHERE user_id = ?1 AND event = 'audio_complete') AS audioCompleted,
        (SELECT COUNT(*) FROM softlife_events WHERE user_id = ?1 AND event = 'checkout_click') AS checkoutClicks`).bind(uid),
      env.DB.prepare("SELECT stage, updated_at FROM softlife_crm_pipeline WHERE user_id = ?").bind(uid),
      env.DB.prepare("SELECT id, note, author, created_at FROM softlife_crm_notes WHERE user_id = ? ORDER BY id DESC LIMIT 50").bind(uid)
    ]);
    const purchasesRows = purchases.results || [];
    const ltv = purchasesRows.reduce((sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0), 0);
    const signalsRow = signalsRows.results && signalsRows.results[0] ? signalsRows.results[0] : {};
    return json({
      member,
      onboarding: onb.results && onb.results[0] ? onb.results[0] : null,
      purchases: purchasesRows,
      ltv: Math.round(ltv * 100) / 100,
      timeline: timeline.results || [],
      signals: {
        tasksDone: Number(signalsRow.tasksDone || 0),
        tasksTotal: Number(signalsRow.tasksTotal || 0),
        audioStarted: Number(signalsRow.audioStarted || 0),
        audioCompleted: Number(signalsRow.audioCompleted || 0),
        checkoutClicks: Number(signalsRow.checkoutClicks || 0)
      },
      stage: stageRow.results && stageRow.results[0] ? stageRow.results[0].stage : "lead",
      stageUpdatedAt: stageRow.results && stageRow.results[0] ? stageRow.results[0].updated_at : null,
      notes: notes.results || []
    });
  }

  if (path === "/api/admin/crm/stage" && request.method === "POST") {
    const body = await readJson(request);
    const uid = Number(body.user_id) || 0;
    const stage = String(body.stage || "");
    if (!CRM_STAGES.includes(stage)) return json({ error: "invalid stage" }, 400);
    const exists = await env.DB.prepare("SELECT id FROM softlife_users WHERE id = ?").bind(uid).first();
    if (!exists) return json({ error: "not found" }, 404);
    await env.DB.prepare(
      `INSERT INTO softlife_crm_pipeline (user_id, stage, updated_by, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET stage = excluded.stage,
       updated_by = excluded.updated_by, updated_at = excluded.updated_at`
    ).bind(uid, stage, admin.actor).run();
    await audit(env, admin.actor, "crm_stage", "user:" + uid, { stage });
    return json({ ok: true });
  }

  if (path === "/api/admin/crm/notes" && request.method === "POST") {
    const body = await readJson(request);
    const uid = Number(body.user_id) || 0;
    const note = cleanText(body.note, 1000);
    if (!note) return json({ error: "Note is empty." }, 400);
    const exists = await env.DB.prepare("SELECT id FROM softlife_users WHERE id = ?").bind(uid).first();
    if (!exists) return json({ error: "not found" }, 404);
    await env.DB.prepare(
      "INSERT INTO softlife_crm_notes (user_id, note, author) VALUES (?, ?, ?)"
    ).bind(uid, note, admin.actor).run();
    await audit(env, admin.actor, "crm_note", "user:" + uid, { chars: note.length });
    return json({ ok: true });
  }

  // ---------- webhook ledger + replay ----------

  if (path === "/api/admin/webhooks" && request.method === "GET") {
    const [statsRows, last, deliveries] = await env.DB.batch([
      env.DB.prepare("SELECT status, COUNT(*) AS c FROM softlife_webhook_logs GROUP BY status"),
      env.DB.prepare("SELECT created_at FROM softlife_webhook_logs ORDER BY id DESC LIMIT 1"),
      env.DB.prepare("SELECT id, status, order_id, email, error, created_at, length(payload) AS payload_size FROM softlife_webhook_logs ORDER BY id DESC LIMIT 50")
    ]);
    const stats = { applied: 0, duplicate: 0, rejected: 0, invalid: 0, ignored: 0, failed: 0 };
    let total = 0;
    for (const r of (statsRows.results || [])) {
      if (r.status in stats) stats[r.status] = Number(r.c || 0);
      total += Number(r.c || 0);
    }
    return json({
      stats,
      total,
      lastDelivery: last.results && last.results[0] ? last.results[0].created_at : null,
      configured: Boolean(env.PURCHASE_WEBHOOK_SECRET),
      deliveries: deliveries.results || []
    });
  }

  if (path === "/api/admin/webhooks/replay" && request.method === "POST") {
    const body = await readJson(request);
    const wid = Number(body.id) || 0;
    const row = await env.DB.prepare(
      "SELECT id, payload FROM softlife_webhook_logs WHERE id = ?"
    ).bind(wid).first();
    if (!row) return json({ error: "not found" }, 404);
    let payload = {};
    try {
      payload = JSON.parse(row.payload || "{}");
    } catch (err) {
      payload = {};
    }
    const result = await applyPurchase(env, payload, new URL(request.url).origin, "replay");
    if (result.status === "failed") return json({ error: "replay failed" }, 500);
    await audit(env, admin.actor, "webhook_replayed", "webhook:" + wid, { result: result.status });
    return json({ ok: true, status: result.status, ...result.response });
  }

  // ---------- purchase access claims ----------

  if (path === "/api/admin/claims" && request.method === "GET") {
    const [pendingRows, completed, emails] = await env.DB.batch([
      env.DB.prepare(`SELECT id, email, order_id, tier, created_at, token,
        (SELECT status FROM softlife_email_log WHERE to_email = softlife_purchase_claims.email AND kind = 'claim'
         ORDER BY id DESC LIMIT 1) AS email_status
       FROM softlife_purchase_claims
       WHERE completed_at IS NULL AND created_at >= datetime('now', '-30 days') ORDER BY id DESC LIMIT 50`),
      env.DB.prepare("SELECT COUNT(*) AS c FROM softlife_purchase_claims WHERE completed_at IS NOT NULL"),
      env.DB.prepare("SELECT to_email, subject, kind, status, error, created_at FROM softlife_email_log ORDER BY id DESC LIMIT 20")
    ]);
    const origin = new URL(request.url).origin;
    const pending = (pendingRows.results || []).map((r) => {
      const token = r.token;
      delete r.token;
      return { ...r, claimUrl: `${origin}/#/claim?token=${token}` };
    });
    return json({ pending, completed: countValue(completed), emails: emails.results || [] });
  }

  return json({ error: "not found" }, 404);
}

function purchaseBodyEmail(body) {
  return String(
    body.email || body.customer_email || body.buyer_email || (body.customer && body.customer.email) || ""
  ).trim().toLowerCase();
}

function purchaseBodyOrderId(body) {
  return String(
    body.order_id || body.orderId || body.reference || body.id || (body.order && body.order.id) || ""
  ).trim() || null;
}

async function purchaseWebhook(request, env) {
  const secret = env.PURCHASE_WEBHOOK_SECRET || "";
  if (!secret && !env.PAYHIP_API_KEY) return json({ error: "purchase webhook not configured" }, 503);
  const provided = bearerToken(request) || request.headers.get("X-Webhook-Secret") || "";
  const body = await readJson(request);
  const orderId = purchaseBodyOrderId(body);
  const email = purchaseBodyEmail(body);
  if (provided) {
    if (!secret || !safeEqual(provided, secret)) {
      await logWebhook(env, "rejected", body, orderId, email);
      await logSecurity(env, "webhook_rejected", email, clientIp(request), `order_id=${orderId || ""}`);
      return json({ error: "unauthorized" }, 401);
    }
  } else {
    // Payhip posts with no auth header; it signs the payload with sha256(apiKey).
    const payhipKey = env.PAYHIP_API_KEY || "";
    const isPayhipShape = Boolean(body.type && body.signature);
    if (!isPayhipShape || !payhipKey || !safeEqual(String(body.signature), await sha256Hex(payhipKey))) {
      await logWebhook(env, "rejected", body, orderId, email);
      await logSecurity(env, "webhook_rejected", email, clientIp(request), `order_id=${orderId || ""}`);
      return json({ error: "unauthorized" }, 401);
    }
  }
  const result = await applyPurchase(env, body, new URL(request.url).origin);
  if (result.status === "failed") return json({ error: "webhook processing failed" }, 500);
  return json(result.response, result.status === "invalid" ? 400 : 200);
}

async function applyPurchase(env, body, origin, source = "webhook") {
  // Validate + record a purchase payload and upgrade the buyer's tier.
  // Mirrors _process_purchase in the local server. Returns {status, response}
  // where status is applied | duplicate | invalid | failed.
  const email = purchaseBodyEmail(body);
  const orderId = purchaseBodyOrderId(body);
  const tier = String(body.tier || "complete").toLowerCase() === "free" ? "free" : "complete";
  try {
    // Payhip also fires "refunded"; it is not a sale, so accept and ignore it
    // (returning 200 stops Payhip's retry loop without recording a purchase).
    if (String(body.type || "") === "refunded") {
      await logWebhook(env, "ignored", body, orderId, email, "refund event - not a sale");
      return { status: "ignored", response: { ok: true, ignored: true } };
    }
    if (!email || !email.includes("@")) {
      await logWebhook(env, "invalid", body, orderId, email);
      return { status: "invalid", response: { error: "valid email required" } };
    }
    if (orderId) {
      const duplicate = await env.DB.prepare(
        "SELECT id FROM softlife_purchases WHERE order_id = ?"
      ).bind(orderId).first();
      if (duplicate) {
        await logWebhook(env, "duplicate", body, orderId, email);
        return { status: "duplicate", response: { ok: true, duplicate: true } };
      }
    }

    // Payhip sends prices in cents ("price": 900 = $9.00) and marks its events
    // with type/items; Selar-style payloads carry amount/total in major units.
    const payhip = String(body.type || "").startsWith("paid") || Array.isArray(body.items);
    let amount = Number(body.amount ?? body.total ?? 0);
    if (!amount && body.price != null) amount = payhip ? Number(body.price) / 100 : Number(body.price);
    const currency = String(body.currency || "").toUpperCase() || null;
    const provider = String(body.provider || (payhip ? "payhip" : "selar")).slice(0, 40);
    await env.DB.prepare(
      "INSERT INTO softlife_purchases (order_id, email, tier, amount, currency, provider, raw) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(orderId, email, tier, amount, currency, provider, JSON.stringify(body).slice(0, 4000)).run();

    const user = await env.DB.prepare("SELECT id FROM softlife_users WHERE email = ?").bind(email).first();
    if (user) {
      await env.DB.prepare("UPDATE softlife_users SET tier = ? WHERE id = ?").bind(tier, user.id).run();
      await env.DB.prepare(
        "UPDATE softlife_purchase_claims SET completed_at = datetime('now') WHERE email = ? AND completed_at IS NULL"
      ).bind(email).run();
      await sendPurchaseEmail(env, email, "Your Soft Life System purchase is confirmed ✅",
                              purchaseConfirmationHtml(), purchaseConfirmationText(), "purchase_confirmation");
      await logWebhook(env, "applied", body, orderId, email);
      return { status: "applied", response: { ok: true, upgraded: true } };
    }
    // Stranger-buy flow: no account yet, mint a one-time claim link.
    const claimToken = randomHex(16);
    await env.DB.prepare(
      "INSERT INTO softlife_purchase_claims (email, token, order_id, tier) VALUES (?, ?, ?, ?)"
    ).bind(email, claimToken, orderId, tier).run();
    const claimLink = `${origin}/#/claim?token=${claimToken}`;
    await sendPurchaseEmail(env, email, "Your Soft Life System access is ready 🎉",
                            claimEmailHtml(claimLink), claimEmailText(claimLink), "claim");
    await logWebhook(env, "applied", body, orderId, email);
    return { status: "applied", response: { ok: true, upgraded: false, claim: true } };
  } catch (exc) {
    await logWebhook(env, "failed", body, orderId, email,
      source === "replay" ? `replay: ${String(exc).slice(0, 400)}` : String(exc).slice(0, 500));
    return { status: "failed", response: { error: "webhook processing failed" } };
  }
}

function emailShell(title, bodyHtml) {
  return (
    '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px;color:#2a0f4a;">'
    + `<h2 style="color:#5d2189;margin:0 0 12px;">${title}</h2>`
    + `<div style="font-size:15px;line-height:1.6;">${bodyHtml}</div>`
    + '<p style="font-size:12px;color:#6d5f7a;margin-top:28px;">The Soft Life System · Gabochie Books<br>'
    + "Questions? Just reply to this email.</p>"
    + "</div>"
  );
}

function claimEmailHtml(link) {
  return emailShell(
    "Your access is ready 🎉",
    "<p>Your payment went through — welcome to The Soft Life System.</p>"
    + "<p>One last step: choose a password and open your system. Your purchase is already "
    + "attached to this email, so everything unlocks the moment you land inside.</p>"
    + `<p><a href="${link}" style="display:inline-block;background:#5d2189;color:#fff;padding:12px 22px;`
    + 'border-radius:10px;text-decoration:none;font-weight:600;">Set my password &amp; start →</a></p>'
    + `<p style="font-size:13px;">Or paste this link into your browser:<br><code>${link}</code></p>`
    + '<p style="font-size:13px;color:#6d5f7a;">This link works once and stays valid for 30 days.</p>'
  );
}

function purchaseConfirmationHtml() {
  return emailShell(
    "Purchase confirmed ✅",
    "<p>Your purchase of the complete system is confirmed and your account has been upgraded.</p>"
    + "<p>Sign in and start with the introduction, then work the 90-day plan at your pace.</p>"
  );
}

function claimEmailText(link) {
  return [
    "Your payment went through — welcome to The Soft Life System.",
    "",
    "One last step: choose a password and open your system. Your purchase is",
    "already attached to this email, so everything unlocks the moment you land inside.",
    "",
    "Set your password here:",
    link,
    "",
    "This link works once and stays valid for 30 days.",
    "",
    "The Soft Life System · Gabochie Books",
    "Questions? Just reply to this email.",
  ].join("\n");
}

function purchaseConfirmationText() {
  return [
    "Your purchase of the complete system is confirmed and your account has been upgraded.",
    "",
    "Sign in and start with the introduction, then work the 90-day plan at your pace.",
    "",
    "The Soft Life System · Gabochie Books",
    "Questions? Just reply to this email.",
  ].join("\n");
}

async function sendPurchaseEmail(env, toEmail, subject, html, text, kind) {
  // Best-effort transactional email via Brevo (ex-Sendinblue). Never throws:
  // the webhook must not fail because the mail provider hiccuped. Every
  // attempt is logged to softlife_email_log for the admin claims card.
  let status = "skipped";
  let error = "";
  const apiKey = env.BREVO_API_KEY || "";
  if (apiKey) {
    const senderEmail = env.BREVO_SENDER || env.SUPPORT_EMAIL || "admin@gabochie.com";
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          sender: { email: senderEmail, name: env.EMAIL_FROM_NAME || "The Soft Life System" },
          to: [{ email: toEmail }],
          replyTo: { email: env.SUPPORT_EMAIL || senderEmail },
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });
      if (res.ok || res.status === 201) {
        status = "sent";
      } else {
        status = "failed";
        error = `brevo ${res.status}: ${(await res.text()).slice(0, 250)}`;
      }
    } catch (exc) {
      status = "failed";
      error = String(exc).slice(0, 250);
    }
  } else {
    error = "BREVO_API_KEY not set";
  }
  try {
    await env.DB.prepare(
      "INSERT INTO softlife_email_log (to_email, subject, kind, status, error) VALUES (?, ?, ?, ?, ?)"
    ).bind(toEmail, subject.slice(0, 200), kind, status, error).run();
  } catch (exc) {
    // Logging must never break the webhook either.
  }
}

function countValue(result) {
  return result && result.results && result.results[0] ? Number(result.results[0].c || 0) : 0;
}

async function sha256Hex(value) {
  const bits = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(bits));
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(saltHex),
      iterations: 100000,
      hash: "SHA-256"
    },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}
