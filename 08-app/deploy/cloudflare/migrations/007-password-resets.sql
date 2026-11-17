-- Soft Life: one-time password reset tokens.
CREATE TABLE IF NOT EXISTS softlife_password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES softlife_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_softlife_pwresets_user ON softlife_password_resets(user_id);
