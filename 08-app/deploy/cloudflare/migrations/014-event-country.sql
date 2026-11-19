-- Soft Life: visitor country for global geo analytics (privacy-safe: ISO country code only, never raw IPs)
ALTER TABLE softlife_events ADD COLUMN country TEXT;
CREATE INDEX IF NOT EXISTS idx_softlife_events_country ON softlife_events(country);
