-- Soft Life: affiliate payout tracking (Phase 2).
-- Adds a paid_at timestamp to earnings so admins can mark pending earnings as paid.
ALTER TABLE softlife_affiliate_earnings ADD COLUMN paid_at TEXT;
CREATE INDEX IF NOT EXISTS idx_softlife_affearn_status ON softlife_affiliate_earnings(status);
