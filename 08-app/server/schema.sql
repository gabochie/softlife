-- Soft Life app — local dev schema (SQLite). Production target: Supabase (Postgres).
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  ref_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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
