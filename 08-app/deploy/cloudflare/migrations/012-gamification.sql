-- Soft Life: gamification (badges + streaks) for the 90-day launch plan.
CREATE TABLE IF NOT EXISTS softlife_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES softlife_users(id),
  badge_key TEXT NOT NULL,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, badge_key)
);
CREATE INDEX IF NOT EXISTS idx_softlife_badges_user ON softlife_badges(user_id);
