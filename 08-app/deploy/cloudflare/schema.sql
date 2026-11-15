CREATE TABLE IF NOT EXISTS softlife_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  role TEXT NOT NULL DEFAULT 'member',
  ref_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS softlife_admin_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS softlife_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE,
  email TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'complete',
  amount REAL,
  currency TEXT,
  provider TEXT NOT NULL DEFAULT 'selar',
  raw TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS softlife_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES softlife_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS softlife_audio_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES softlife_users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS softlife_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES softlife_users(id),
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  week INTEGER,
  kind TEXT NOT NULL DEFAULT 'launch',
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS softlife_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES softlife_users(id),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS softlife_referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_code TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'clicked',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_softlife_tasks_user ON softlife_tasks(user_id, week, id);
CREATE INDEX IF NOT EXISTS idx_softlife_sessions_user ON softlife_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_softlife_sessions_expiry ON softlife_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_softlife_audio_tokens_user ON softlife_audio_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_softlife_audio_tokens_expiry ON softlife_audio_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_softlife_referrals_code ON softlife_referrals(ref_code);
CREATE INDEX IF NOT EXISTS idx_softlife_purchases_email ON softlife_purchases(email);
CREATE INDEX IF NOT EXISTS idx_softlife_admin_sessions_expiry ON softlife_admin_sessions(expires_at);

INSERT OR IGNORE INTO softlife_users (email, name, password_hash, salt, tier, ref_code)
VALUES (
  'demo@softlife.app',
  'Demo Member',
  '435b4d9fbd8d035f78d97df7dea1710611287d2df2fa9aa0e8ee88664aa4645b',
  'a1b2c3d4e5f60708',
  'free',
  'DEMO01'
);

WITH seed(week, title, detail) AS (
  VALUES
    (1, 'Complete the Hustle Hangover Checklist', 'Chapter 1 — face where your time actually goes.'),
    (1, 'Complete the Four Audits', 'Chapter 3 — Time, Money, Energy, Joy.'),
    (1, 'Calculate your Soft Life Scorecard', 'Chapter 3 — score all eight dimensions.'),
    (1, 'Write your one-sentence business', 'Chapter 4 — I help [audience] achieve [outcome] through [mechanism].'),
    (1, 'Choose one audience, one offer, one outcome', 'Chapter 4 — focus beats variety.'),
    (2, 'Redesign your offer using the Premium Offer Formula', 'Chapter 5 — package your genius into premium.'),
    (2, 'Set your premium price', 'Chapter 5 — price the transformation, not the hours.'),
    (2, 'Map your delivery process', 'Chapter 6 — Intake, Onboard, Execute, Handoff, Follow-up.'),
    (2, 'Create three templates', 'Chapter 6 — welcome email, proposal, follow-up.'),
    (3, 'Build your first automation', 'Chapter 7 — scheduling and welcome email.'),
    (3, 'Document one task and delegate it', 'Chapter 7 — the first transfer.'),
    (3, 'Design your Soft Life Week', 'Chapter 8 — the sample 15-hour week, adapted to you.'),
    (4, 'Set your no-work zones', 'Chapter 8 — protect rest like revenue.'),
    (4, 'Write your Boundary Policy', 'Chapter 11 — scripts for scope, availability, requests.'),
    (5, 'Define your enough', 'Chapter 12 — income, clients, hours, rest.'),
    (8, 'Schedule your monthly Soft Life Review', 'Chapter 15 — the maintenance ritual.')
)
INSERT INTO softlife_tasks (user_id, title, detail, week, kind)
SELECT u.id, seed.title, seed.detail, seed.week, 'launch'
FROM softlife_users u, seed
WHERE u.email = 'demo@softlife.app'
  AND NOT EXISTS (SELECT 1 FROM softlife_tasks WHERE user_id = u.id);

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
