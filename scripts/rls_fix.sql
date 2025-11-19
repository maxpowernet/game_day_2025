-- rls_fix.sql
-- Fixes for RLS recursion and minimal developer-friendly policies
-- 1) Adds auth_uid columns if missing
-- 2) Creates a SECURITY DEFINER helper function is_admin()
-- 3) Replaces admin subquery policies with is_admin()
-- 4) Adds a minimal development-safe policy allowing authenticated users
--    to INSERT their own player row when auth_uid matches (and admins via is_admin())

-- IMPORTANT: Run this as a privileged user (SERVICE_ROLE or DB superuser).

BEGIN;

-- 1) Ensure auth_uid columns exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS auth_uid TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS auth_uid TEXT;

-- 2) Create helper function to check admin membership (runs with definer privileges)
-- This avoids RLS recursion when policies need to check the admins table.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE auth_uid = auth.uid()::text);
$$;

-- 3) Add indexes to speed up auth lookups
CREATE INDEX IF NOT EXISTS idx_players_auth_uid ON players(auth_uid);
CREATE INDEX IF NOT EXISTS idx_admins_auth_uid ON admins(auth_uid);

-- 4) Replace problematic policies with secure variants using is_admin()

-- PLAYERS (allow admins full access via is_admin(), and allow players to manage their own row)
DROP POLICY IF EXISTS admins_full_access_players ON players;
CREATE POLICY admins_full_access_players ON players
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS player_self_access ON players;
CREATE POLICY player_self_access ON players
  FOR ALL
  USING (auth.uid()::text = auth_uid)
  WITH CHECK (auth.uid()::text = auth_uid);

-- ANSWERS (admins via is_admin(); players may insert/select their own answers)
DROP POLICY IF EXISTS admins_full_access_answers ON answers;
CREATE POLICY admins_full_access_answers ON answers
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS player_insert_own_answer ON answers;
CREATE POLICY player_insert_own_answer ON answers
  FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT auth_uid FROM players WHERE id = new.player_id));

DROP POLICY IF EXISTS player_select_own_answer ON answers;
CREATE POLICY player_select_own_answer ON answers
  FOR SELECT
  USING (
    auth.uid()::text = (SELECT auth_uid FROM players WHERE id = player_id) OR is_admin()
  );

-- PURCHASES (admins via is_admin(); players may create/select their own purchases)
DROP POLICY IF EXISTS admins_full_access_purchases ON purchases;
CREATE POLICY admins_full_access_purchases ON purchases
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS player_insert_purchase ON purchases;
CREATE POLICY player_insert_purchase ON purchases
  FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT auth_uid FROM players WHERE id = new.player_id));

DROP POLICY IF EXISTS player_select_purchase ON purchases;
CREATE POLICY player_select_purchase ON purchases
  FOR SELECT
  USING (
    auth.uid()::text = (SELECT auth_uid FROM players WHERE id = player_id) OR is_admin()
  );

-- PLAYER_CAMPAIGN_SCORES (admins via is_admin(); players can select their own scores)
DROP POLICY IF EXISTS admins_read_player_campaign_scores ON player_campaign_scores;
CREATE POLICY admins_read_player_campaign_scores ON player_campaign_scores
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS player_see_own_score ON player_campaign_scores;
CREATE POLICY player_see_own_score ON player_campaign_scores
  FOR SELECT
  USING (
    auth.uid()::text = (SELECT auth_uid FROM players WHERE id = player_id) OR is_admin()
  );

-- MESSAGES (admins via is_admin(); players can insert messages)
DROP POLICY IF EXISTS admins_full_access_messages ON messages;
CREATE POLICY admins_full_access_messages ON messages
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS player_insert_message ON messages;
CREATE POLICY player_insert_message ON messages
  FOR INSERT
  WITH CHECK (true);

-- PRODUCTS (public select; admins manage via is_admin())
DROP POLICY IF EXISTS admins_full_access_products ON products;
CREATE POLICY admins_full_access_products ON products
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS public_select_products ON products;
CREATE POLICY public_select_products ON products
  FOR SELECT USING (true);

COMMIT;

-- Minimal development note:
-- After running this script, ensure at least one row in `admins` has a real `auth_uid`
-- (the Supabase auth user id of an admin user). You can set this via:
-- UPDATE admins SET auth_uid = '<auth-uid>' WHERE email = 'admin@example.com';

-- If you want a very permissive development policy (not recommended for production):
-- you can additionally allow authenticated users to INSERT into players without
-- requiring auth_uid to match by running:
--
-- DROP POLICY IF EXISTS dev_allow_insert_players ON players;
-- CREATE POLICY dev_allow_insert_players ON players
--   FOR INSERT
--   WITH CHECK (auth.uid() IS NOT NULL);

-- End of rls_fix.sql
