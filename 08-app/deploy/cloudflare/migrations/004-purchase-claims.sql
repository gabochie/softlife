-- Soft Life: purchase access claims.
-- When the purchase webhook applies an order for an email that has no account
-- yet, we mint a one-time claim token. The buyer opens the claim link, sets a
-- password, and lands on a paid-tier account.
CREATE TABLE IF NOT EXISTS softlife_purchase_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  order_id TEXT,
  tier TEXT NOT NULL DEFAULT 'complete',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_softlife_claims_email ON softlife_purchase_claims(email);
CREATE INDEX IF NOT EXISTS idx_softlife_claims_token ON softlife_purchase_claims(token);
