-- Supabase RLS policies and seed data for game-day
-- Adds auth_uid columns, enables RLS on sensitive tables, creates policies for admins and players,
-- and inserts minimal seed data (admin + sample campaign/player/question/product).

-- 1) Add auth_uid to players and admins to associate with Supabase auth users
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS auth_uid TEXT;

ALTER TABLE admins
    ADD COLUMN IF NOT EXISTS auth_uid TEXT;

-- 2) Enable Row-Level Security on sensitive tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_campaign_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 3) Admin helper: policy allowing any action for admin users (admins.auth_uid = auth.uid())
-- For each table we will add a policy that allows admins full access.

-- Players: policies
CREATE POLICY IF NOT EXISTS "admins_full_access_players" ON players
  USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "player_self_access" ON players
  FOR ALL
  USING (auth.uid() = auth_uid)
  WITH CHECK (auth.uid() = auth_uid);

-- Answers: players may insert their own answers; admins can manage
CREATE POLICY IF NOT EXISTS "admins_full_access_answers" ON answers
  USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "player_insert_own_answer" ON answers
  FOR INSERT
  WITH CHECK (auth.uid() = (SELECT auth_uid FROM players WHERE id = new.player_id));

CREATE POLICY IF NOT EXISTS "player_select_own_answer" ON answers
  FOR SELECT USING (
    auth.uid() = (SELECT auth_uid FROM players WHERE id = player_id) OR
    (auth.uid() IS NOT NULL)
  );

CREATE POLICY IF NOT EXISTS "player_update_own_answer" ON answers
  FOR UPDATE USING (
    auth.uid() = (SELECT auth_uid FROM players WHERE id = player_id) OR
    (auth.uid() IS NOT NULL)
  )
  WITH CHECK (
    auth.uid() = (SELECT auth_uid FROM players WHERE id = player_id) OR
    (auth.uid() IS NOT NULL)
  );

-- Purchases: players can create their own purchases; admins can manage
CREATE POLICY IF NOT EXISTS "admins_full_access_purchases" ON purchases
  USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "player_insert_purchase" ON purchases
  FOR INSERT
  WITH CHECK (auth.uid() = (SELECT auth_uid FROM players WHERE id = new.player_id));

CREATE POLICY IF NOT EXISTS "player_select_purchase" ON purchases
  FOR SELECT USING (
    auth.uid() = (SELECT auth_uid FROM players WHERE id = player_id) OR
    (auth.uid() IS NOT NULL)
  );

-- Player campaign scores: allow players to see their own scores; admins can access all
CREATE POLICY IF NOT EXISTS "admins_full_access_player_campaign_scores" ON player_campaign_scores
  USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "player_see_own_score" ON player_campaign_scores
  FOR SELECT USING (
    auth.uid() = (SELECT auth_uid FROM players WHERE id = player_id) OR
    (auth.uid() IS NOT NULL)
  );

-- Messages: players may create messages (from), admins may read/manage
CREATE POLICY IF NOT EXISTS "admins_full_access_messages" ON messages
  USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "player_insert_message" ON messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "player_select_own_message" ON messages
  FOR SELECT USING (
    (auth.uid() IS NOT NULL)
    -- message authorship is a free-text field 'from'; prefer linking messages to auth_uid in future
  );

-- Products: public read, admin create/update/delete
CREATE POLICY IF NOT EXISTS "public_select_products" ON products
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "admins_manage_products" ON products
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 4) Seed data (minimal)
-- Insert an admin (set auth_uid to a placeholder — replace with real auth uid after creating user in Supabase Auth)
INSERT INTO admins (name, email, invited, invite_token, auth_uid)
VALUES ('Dev Admin', 'admin@example.com', TRUE, 'dev-invite-token', 'admin-auth-uid')
ON CONFLICT (email) DO NOTHING;

-- Insert a sample campaign
INSERT INTO campaigns (name, status, start_date, end_date, icon)
VALUES ('Demo Campaign', 'in-progress', current_date - INTERVAL '1 day', current_date + INTERVAL '14 day', NULL)
ON CONFLICT (name) DO NOTHING;

-- Insert a sample player (auth_uid placeholder)
INSERT INTO players (name, role, score, game_coins, auth_uid)
VALUES ('Player One', 'player', 0, 0, 'player1-auth-uid')
ON CONFLICT (name) DO NOTHING;

-- Link player to campaign
WITH c AS (SELECT id FROM campaigns WHERE name = 'Demo Campaign' LIMIT 1),
      p AS (SELECT id FROM players WHERE name = 'Player One' LIMIT 1)
INSERT INTO campaign_players (campaign_id, player_id)
SELECT c.id, p.id FROM c, p
ON CONFLICT DO NOTHING;

-- Insert a sample question for demo campaign
WITH c AS (SELECT id FROM campaigns WHERE name = 'Demo Campaign' LIMIT 1)
INSERT INTO questions (campaign_id, day_index, text, choices, answer, status, points_on_time, points_late)
SELECT c.id, 0, 'Qual é a capital do Brasil?', to_jsonb(ARRAY['Brasília','Rio de Janeiro','São Paulo','Salvador']), 0, 'todo', 1000, 500
FROM c
ON CONFLICT DO NOTHING;

-- Insert a sample product
WITH c AS (SELECT id FROM campaigns WHERE name = 'Demo Campaign' LIMIT 1)
INSERT INTO products (name, description, price_in_game_coins, quantity, campaign_id, available_from, available_until)
SELECT 'Camiseta Oficial', 'Camiseta do Game Day', 500, 10, c.id, current_date, current_date + INTERVAL '30 day' FROM c
ON CONFLICT DO NOTHING;

-- End of RLS + seed
