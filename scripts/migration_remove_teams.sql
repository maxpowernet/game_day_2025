-- Migration: Remove Teams and Team_Members tables
-- Date: 2025-11-30
-- Description: Simplify data model from Campaign->Team->Players to Campaign->Players (direct)

-- Step 1: Drop team_members junction table (depends on teams and players)
DROP TABLE IF EXISTS team_members CASCADE;

-- Step 2: Drop teams table (depends on campaigns)
DROP TABLE IF EXISTS teams CASCADE;

-- Step 3: Remove team_id column from players table
ALTER TABLE players DROP COLUMN IF EXISTS team_id;

-- Step 4: Drop RLS policies related to teams (if they exist)
DROP POLICY IF EXISTS admins_full_access_teams ON teams;
DROP POLICY IF EXISTS admins_full_access_team_members ON team_members;

-- Migration complete
-- The relationship Campaign <-> Players is now managed exclusively via campaign_players table
