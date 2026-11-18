-- Soft Life app — local dev schema (SQLite). Production target: Supabase (Postgres).
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  role TEXT NOT NULL DEFAULT 'member',
  ref_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  marketing_consent INTEGER NOT NULL DEFAULT 1,
  unsub_token TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unsub ON users(unsub_token);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  segment TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  recipients INTEGER NOT NULL DEFAULT 0,
  sent INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  send_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_emailqueue_due ON email_queue(status, send_at);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audio_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  week INTEGER,
  kind TEXT NOT NULL DEFAULT 'launch',
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_code TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'clicked',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS onboarding (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  business_name TEXT NOT NULL DEFAULT '',
  business_stage TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT '',
  main_goal TEXT NOT NULL DEFAULT '',
  biggest_challenge TEXT NOT NULL DEFAULT '',
  revenue_range TEXT NOT NULL DEFAULT '',
  team_size TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  whatsapp_consent INTEGER NOT NULL DEFAULT 0,
  whatsapp_consent_at TEXT,
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  marketing_consent_at TEXT,
  consent_version TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  utm_content TEXT NOT NULL DEFAULT '',
  utm_term TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  event TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '',
  meta TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Analytics aggregation indexes (idempotent; runs on every boot via init_db).
CREATE INDEX IF NOT EXISTS idx_events_user_time ON events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_time ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_name_time ON events(event, created_at);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE,
  email TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'complete',
  amount REAL,
  currency TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT '',
  ref_code TEXT,
  raw TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Affiliate earnings ledger (parity with deploy softlife_affiliate_earnings).
CREATE TABLE IF NOT EXISTS affiliate_earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_code TEXT NOT NULL,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id),
  email TEXT,
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT,
  rate REAL NOT NULL DEFAULT 0.30,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_affearn_code ON affiliate_earnings(ref_code);

-- Purchase webhook deliveries: full reconciliation ledger (successes, duplicates, rejects).
CREATE TABLE IF NOT EXISTS webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL,            -- applied | duplicate | rejected | invalid | failed
  order_id TEXT,
  email TEXT,
  payload TEXT NOT NULL DEFAULT '{}',
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Purchase access claims: minted when a webhook applies a purchase for an email
-- that has no account yet. The buyer sets their password via a one-time link.
CREATE TABLE IF NOT EXISTS purchase_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  order_id TEXT,
  tier TEXT NOT NULL DEFAULT 'complete',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_claims_email ON purchase_claims(lower(email));

-- Transactional email log (production sends via the Cloudflare Email Service
-- binding; local dev queues here and the admin copies links manually).
CREATE TABLE IF NOT EXISTS email_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  kind TEXT NOT NULL,              -- claim | purchase_confirmation
  status TEXT NOT NULL,            -- sent | failed | queued_local
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Security monitoring: failed logins, rejected webhooks, rate-limit hits.
CREATE TABLE IF NOT EXISTS security_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,              -- member_login_failed | admin_login_failed | staff_login_failed | webhook_rejected | track_rate_limited
  email TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_security_time ON security_log(created_at);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

-- Sales CRM: pipeline stage per member, staff notes, and an audit trail.
CREATE TABLE IF NOT EXISTS crm_pipeline (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  stage TEXT NOT NULL DEFAULT 'lead',
  updated_by TEXT NOT NULL DEFAULT 'superadmin',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crm_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  note TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'superadmin',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL DEFAULT 'superadmin',
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  meta TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Staff accounts: individual logins with role-scoped access (RBAC).
CREATE TABLE IF NOT EXISTS staff_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff_sessions (
  token_hash TEXT PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pwresets_user ON password_resets(user_id);

-- Interactive lead magnet submissions (parity with deploy migration 010).
CREATE TABLE IF NOT EXISTS lead_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  magnet TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  answers TEXT NOT NULL,
  result TEXT NOT NULL,
  consent INTEGER NOT NULL DEFAULT 1,
  consent_version TEXT,
  unsub_token TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lead_token ON lead_submissions(token);
CREATE INDEX IF NOT EXISTS idx_lead_email_time ON lead_submissions(email, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_unsub ON lead_submissions(unsub_token);
