-- Soft Life: marketing email engine (consent, unsub tokens, campaigns).
ALTER TABLE softlife_users ADD COLUMN marketing_consent INTEGER NOT NULL DEFAULT 1;
ALTER TABLE softlife_users ADD COLUMN unsub_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_softlife_users_unsub ON softlife_users(unsub_token);

CREATE TABLE IF NOT EXISTS softlife_email_campaigns (
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

CREATE TABLE IF NOT EXISTS softlife_email_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES softlife_users(id),
  kind TEXT NOT NULL,
  send_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_softlife_emailqueue_due ON softlife_email_queue(status, send_at);
