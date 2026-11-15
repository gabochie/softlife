const SITE_URL = "https://soft.gabochie.com";
const FREE_AUDIO = new Set(["intro", "ch01"]);
const AUDIO_SLUGS = ["intro", ...Array.from({ length: 15 }, (_, i) => "ch" + String(i + 1).padStart(2, "0"))];
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
      supportEmail: env.SUPPORT_EMAIL || "admin@gabochie.com",
      freeAudio: [...FREE_AUDIO],
      allAudio: AUDIO_SLUGS,
      tiers: ["free", "complete"]
    });
  }

  if (path === "/api/admin/login" && request.method === "POST") return adminLogin(request, env);
  if (path === "/api/admin/logout" && request.method === "POST") return adminLogout(request, env);
  if (path === "/api/webhooks/purchase" && request.method === "POST") return purchaseWebhook(request, env);

  if (path.startsWith("/api/admin/")) {
    const admin = await currentAdmin(request, env);
    if (!admin) return json({ error: "unauthorized" }, 401);
    return handleAdmin(request, env, url, path);
  }

  if (path.startsWith("/api/audio/")) {
    return serveAudio(request, env, url, path.slice("/api/audio/".length).replace(/\.mp3$/, ""));
  }

  if (path === "/api/signup" && request.method === "POST") return signup(request, env);
  if (path === "/api/signin" && request.method === "POST") return signin(request, env);
  if (path === "/api/signout" && request.method === "POST") return signout(request, env);

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
  if (!user) return json({ error: "Wrong email or password." }, 401);
  const hash = await hashPassword(password, user.salt);
  if (hash !== user.password_hash) return json({ error: "Wrong email or password." }, 401);
  const token = await createSession(env, user.id);
  await logEvent(env, user.id, "signin", "/signin", {});
  return json({ token, user: publicUser(user) });
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

async function adminLogin(request, env) {
  if (!env.ADMIN_PASSWORD) {
    return json({ error: "Admin login is not configured." }, 503);
  }
  const body = await readJson(request);
  const password = String(body.password || "");
  if (!safeEqual(password, env.ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 400));
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

async function adminLogout(request, env) {
  const token = bearerToken(request);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM softlife_admin_sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  return json({ ok: true });
}

async function currentAdmin(request, env) {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  return env.DB.prepare(
    "SELECT * FROM softlife_admin_sessions WHERE token_hash = ? AND expires_at > datetime('now')"
  ).bind(tokenHash).first();
}

async function handleAdmin(request, env, url, path) {
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

  return json({ error: "not found" }, 404);
}

async function purchaseWebhook(request, env) {
  const secret = env.PURCHASE_WEBHOOK_SECRET || "";
  if (!secret) return json({ error: "purchase webhook not configured" }, 503);
  const provided = bearerToken(request) || request.headers.get("X-Webhook-Secret") || "";
  if (!safeEqual(provided, secret)) return json({ error: "unauthorized" }, 401);

  const body = await readJson(request);
  const email = String(
    body.email || body.customer_email || body.buyer_email || (body.customer && body.customer.email) || ""
  ).trim().toLowerCase();
  const orderId = String(
    body.order_id || body.orderId || body.reference || body.id || (body.order && body.order.id) || ""
  ).trim() || null;
  const tier = String(body.tier || "complete").toLowerCase() === "free" ? "free" : "complete";
  if (!email || !email.includes("@")) return json({ error: "valid email required" }, 400);

  if (orderId) {
    const duplicate = await env.DB.prepare(
      "SELECT id FROM softlife_purchases WHERE order_id = ?"
    ).bind(orderId).first();
    if (duplicate) return json({ ok: true, duplicate: true });
  }

  const amount = Number(body.amount ?? body.total ?? 0) || null;
  const currency = String(body.currency || "").toUpperCase() || null;
  const provider = String(body.provider || "selar").slice(0, 40);
  await env.DB.prepare(
    "INSERT INTO softlife_purchases (order_id, email, tier, amount, currency, provider, raw) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(orderId, email, tier, amount, currency, provider, JSON.stringify(body).slice(0, 4000)).run();

  const user = await env.DB.prepare("SELECT id FROM softlife_users WHERE email = ?").bind(email).first();
  if (user) {
    await env.DB.prepare("UPDATE softlife_users SET tier = ? WHERE id = ?").bind(tier, user.id).run();
  }
  return json({ ok: true, upgraded: Boolean(user) });
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
