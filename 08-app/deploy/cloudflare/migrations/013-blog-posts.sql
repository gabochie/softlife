-- Soft Life: blog posts stored in D1 for CMS management
-- Static HTML posts under app/blog/ continue to work via assets;
-- new posts created via the CMS live here and are served dynamically.

CREATE TABLE IF NOT EXISTS softlife_blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT DEFAULT 'Deon ChristoLove',
  category TEXT,
  tags TEXT,                          -- comma-separated
  canonical TEXT,
  body_html TEXT NOT NULL,
  faq_json TEXT,                      -- JSON array of {question, answer}
  og_image TEXT,
  published INTEGER DEFAULT 0,        -- 0 = draft, 1 = published
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_softlife_blog_posts_slug ON softlife_blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_softlife_blog_posts_published ON softlife_blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_softlife_blog_posts_category ON softlife_blog_posts(category);
