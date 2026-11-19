-- Soft Life: affiliate payout completion + financial goals
-- Extends affiliate earnings with payment method + payout tracking
-- Adds financial_goals table for revenue targeting / reverse-engineering scale

-- Add payout fields to affiliate earnings
ALTER TABLE softlife_affiliate_earnings ADD COLUMN payment_method TEXT;
ALTER TABLE softlife_affiliate_earnings ADD COLUMN payout_date TEXT;
ALTER TABLE softlife_affiliate_earnings ADD COLUMN payout_reference TEXT;

-- Payout history audit trail
CREATE TABLE IF NOT EXISTS softlife_affiliate_payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_code TEXT NOT NULL,
  affiliate_name TEXT,
  affiliate_email TEXT,
  amount_cents INTEGER NOT NULL,
  payment_method TEXT,
  payout_reference TEXT,
  paid_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_softlife_affiliate_payouts_ref ON softlife_affiliate_payouts(ref_code);
CREATE INDEX IF NOT EXISTS idx_softlife_affiliate_payouts_date ON softlife_affiliate_payouts(paid_at);

-- Financial goals table (revenue targets for reverse-engineering scale)
CREATE TABLE IF NOT EXISTS softlife_financial_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,           -- e.g. '2026-12' for monthly
  target_amount_cents INTEGER NOT NULL,
  target_currency TEXT DEFAULT 'USD',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_softlife_financial_goals_period ON softlife_financial_goals(period);
