-- Soft Life: remote team applications submitted from /careers/.
CREATE TABLE IF NOT EXISTS softlife_job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  portfolio TEXT,
  availability TEXT,
  message TEXT NOT NULL,
  consent INTEGER NOT NULL DEFAULT 1,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_softlife_jobs_email ON softlife_job_applications(email);
CREATE INDEX IF NOT EXISTS idx_softlife_jobs_created ON softlife_job_applications(created_at);
