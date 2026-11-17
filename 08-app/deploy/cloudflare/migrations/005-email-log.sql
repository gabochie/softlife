-- Soft Life: transactional email log.
-- Every purchase email attempt (claim access link, purchase confirmation) is
-- recorded whether or not the Resend API key is configured, so the admin can
-- see exactly what was delivered in the claims card.
CREATE TABLE IF NOT EXISTS softlife_email_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_softlife_email_to ON softlife_email_log(to_email);
