-- Add onboarding tracking to users table
-- A user is considered onboarded after they have:
-- 1. Accepted parental consent
-- 2. Created at least one child profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ;
