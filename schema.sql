-- ═══════════════════════════════════════════════════════════════
-- EPIC TECH AI CINEMATIC STUDIO — D1 SCHEMA (ULTIMATE)
-- ═══════════════════════════════════════════════════════════════
-- Run this with: wrangler d1 execute epic-cinematic-db --file=schema.sql

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  credits INTEGER NOT NULL DEFAULT 100,
  plan TEXT NOT NULL DEFAULT 'free',
  last_active_at INTEGER
);

-- Creative Projects / Films
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  style_guide TEXT,                    -- JSON: preferred directors, color palettes, etc.
  status TEXT DEFAULT 'active',        -- active | archived | completed
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- All Generations (images today, video tomorrow)
CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,                -- After full Writer + Director pipeline
  image_url TEXT NOT NULL,             -- Final public URL (usually via Images or R2)
  r2_key TEXT NOT NULL,
  model TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  agent_outputs JSON,                  -- Full Writer + Director + Editor trace
  metadata JSON,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Long-term Memory Vault (synced with Vectorize)
CREATE TABLE IF NOT EXISTS memory_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,                  -- character | location | motif | lighting | scene
  content TEXT NOT NULL,
  vectorize_id TEXT,                   -- The ID we used in Vectorize
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Usage & Billing Events
CREATE TABLE IF NOT EXISTS usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,            -- generation | video | embedding | export
  cost_credits INTEGER NOT NULL,
  metadata JSON,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_user ON memory_entries(user_id, type);
CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, status);

-- Useful views
CREATE VIEW IF NOT EXISTS user_stats AS
SELECT 
  u.id,
  u.email,
  u.credits,
  u.plan,
  COUNT(DISTINCT g.id) as total_generations,
  COUNT(DISTINCT p.id) as total_projects,
  SUM(CASE WHEN ue.event_type = 'generation' THEN ue.cost_credits ELSE 0 END) as credits_spent
FROM users u
LEFT JOIN generations g ON g.user_id = u.id
LEFT JOIN projects p ON p.user_id = u.id
LEFT JOIN usage_events ue ON ue.user_id = u.id
GROUP BY u.id;
