-- Soft Life: admin operations suite tables (parity with the local dev server).
-- Webhook delivery ledger, security monitor, CRM pipeline, audit trail, and
-- staff accounts with role-scoped access.

CREATE TABLE IF NOT EXISTS softlife_webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL,
  order_id TEXT,
  email TEXT,
  payload TEXT NOT NULL DEFAULT '{}',
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_softlife_webhooks_time ON softlife_webhook_logs(created_at);

CREATE TABLE IF NOT EXISTS softlife_security_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_softlife_security_time ON softlife_security_log(created_at);

CREATE TABLE IF NOT EXISTS softlife_crm_pipeline (
  user_id INTEGER PRIMARY KEY REFERENCES softlife_users(id),
  stage TEXT NOT NULL DEFAULT 'lead',
  updated_by TEXT NOT NULL DEFAULT 'superadmin',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS softlife_crm_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES softlife_users(id),
  note TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'superadmin',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS softlife_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL DEFAULT 'superadmin',
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  meta TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS softlife_staff_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS softlife_staff_sessions (
  token_hash TEXT PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES softlife_staff_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
