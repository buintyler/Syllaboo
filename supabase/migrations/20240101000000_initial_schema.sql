-- Initial schema migration
-- AI Reading Companion

-- Parent accounts (managed by Clerk, mirrored here)
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    TEXT UNIQUE NOT NULL,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Child profiles (no PII — COPPA compliant)
CREATE TABLE IF NOT EXISTS child_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  reading_level INT DEFAULT 1 CHECK (reading_level BETWEEN 1 AND 5),
  avatar_id     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Stories content
CREATE TABLE IF NOT EXISTS stories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  level       INT NOT NULL CHECK (level BETWEEN 1 AND 5),
  word_count  INT NOT NULL,
  content     JSONB NOT NULL,
  is_free     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Reading sessions
CREATE TABLE IF NOT EXISTS reading_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  story_id          UUID NOT NULL REFERENCES stories(id),
  started_at        TIMESTAMPTZ NOT NULL,
  ended_at          TIMESTAMPTZ,
  accuracy_percent  NUMERIC(5,2),
  duration_ms       INT,
  words_read        INT,
  words_correct     INT
);

-- Per-session word results
CREATE TABLE IF NOT EXISTS session_words (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES reading_sessions(id) ON DELETE CASCADE,
  word          TEXT NOT NULL,
  expected_word TEXT NOT NULL,
  confidence    NUMERIC(4,3),
  was_correct   BOOLEAN,
  start_time_ms INT,
  end_time_ms   INT
);

-- Subscriptions (mirrors Apple IAP status)
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan            TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  expires_at      TIMESTAMPTZ,
  revenuecat_id   TEXT,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_child_profiles_parent_id ON child_profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_child_id ON reading_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_story_id ON reading_sessions(story_id);
CREATE INDEX IF NOT EXISTS idx_session_words_session_id ON session_words(session_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
