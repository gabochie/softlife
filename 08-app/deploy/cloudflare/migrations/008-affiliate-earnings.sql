-- Soft Life: affiliate attribution + earnings (Phase 1).
-- A referred purchase must credit the affiliate that brought the buyer.
ALTER TABLE softlife_purchases ADD COLUMN ref_code TEXT;
CREATE INDEX IF NOT EXISTS idx_softlife_purchases_refcode ON softlife_purchases(ref_code);

CREATE TABLE IF NOT EXISTS softlife_affiliate_earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_code TEXT NOT NULL,
  purchase_id INTEGER NOT NULL REFERENCES softlife_purchases(id),
  email TEXT,
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT,
  rate REAL NOT NULL DEFAULT 0.30,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_softlife_affearn_code ON softlife_affiliate_earnings(ref_code);
CREATE INDEX IF NOT EXISTS idx_softlife_affearn_purchase ON softlife_affiliate_earnings(purchase_id);
