-- Soft Life: hash session/audio tokens at rest and expire them.
-- Existing member sessions are dropped so every device signs in again.

DROP TABLE IF EXISTS softlife_sessions;
CREATE TABLE softlife_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES softlife_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_softlife_sessions_user ON softlife_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_softlife_sessions_expiry ON softlife_sessions(expires_at);

CREATE TABLE IF NOT EXISTS softlife_audio_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES softlife_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_softlife_audio_tokens_user ON softlife_audio_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_softlife_audio_tokens_expiry ON softlife_audio_tokens(expires_at);
