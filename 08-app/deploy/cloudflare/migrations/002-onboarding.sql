CREATE TABLE IF NOT EXISTS softlife_onboarding (
  user_id INTEGER PRIMARY KEY REFERENCES softlife_users(id),
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

CREATE TABLE IF NOT EXISTS softlife_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES softlife_users(id),
  event TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '',
  meta TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_softlife_onboarding_whatsapp ON softlife_onboarding(whatsapp_consent, created_at);
CREATE INDEX IF NOT EXISTS idx_softlife_onboarding_completed ON softlife_onboarding(completed_at);
CREATE INDEX IF NOT EXISTS idx_softlife_events_user ON softlife_events(user_id, event, created_at);
CREATE INDEX IF NOT EXISTS idx_softlife_events_event ON softlife_events(event, created_at);
