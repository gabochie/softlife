-- Soft Life: interactive lead magnets (free tools).
-- Each submission stores the prospect's answers and the personalised report so
-- the emailed private link can re-render it without exposing anyone else's data.
CREATE TABLE IF NOT EXISTS softlife_lead_submissions (
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
CREATE INDEX IF NOT EXISTS idx_softlife_lead_token ON softlife_lead_submissions(token);
CREATE INDEX IF NOT EXISTS idx_softlife_lead_email_time ON softlife_lead_submissions(email, created_at);
CREATE INDEX IF NOT EXISTS idx_softlife_lead_ip_time ON softlife_lead_submissions(ip, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_softlife_lead_unsub ON softlife_lead_submissions(unsub_token);
