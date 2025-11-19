-- =====================================================
-- SQL schema for database `game-day`
-- Target: PostgreSQL
-- Generated from TypeScript models in src/lib/storageApi.ts
-- =====================================================

-- =====================================================
-- CREATE DATABASE
-- =====================================================
-- Note: Run this command separately as a superuser if creating the database for the first time
-- CREATE DATABASE "game-day" WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8' TEMPLATE=template0;

-- Connect to the database before running the rest of the script
-- \c game-day

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- If you want a clean rebuild, drop existing tables in dependency order
-- WARNING: This will DELETE ALL DATA. Run only if you are sure.
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS player_campaign_scores CASCADE;
DROP TABLE IF EXISTS campaign_players CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS messages CASCADE;


-- =====================================================
-- Table: campaigns
-- =====================================================
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('planned','in-progress','completed')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);

-- =====================================================
-- Table: players
-- =====================================================
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    task TEXT,
    status TEXT,
  score BIGINT NOT NULL DEFAULT 0,
  game_coins BIGINT NOT NULL DEFAULT 0,
  auth_uid TEXT -- stores the Supabase auth uid (string)
);

-- Note: teams referenced above; to avoid forward-reference issues we create teams table next and alter players afterwards.

-- =====================================================
-- Table: teams
-- =====================================================
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_score BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Now alter players to add FK properly (if not created earlier)
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX idx_teams_campaign_id ON teams(campaign_id);

-- =====================================================
-- Table: campaign_players (many-to-many)
-- =====================================================
CREATE TABLE campaign_players (
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (campaign_id, player_id)
);

CREATE INDEX idx_campaign_players_player ON campaign_players(player_id);

-- =====================================================
-- Table: questions
-- =====================================================
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL DEFAULT 0,
    text TEXT NOT NULL,
    choices JSONB NOT NULL, -- store array of choices
    answer INTEGER NOT NULL, -- index of correct choice (0-based)
    status TEXT NOT NULL CHECK (status IN ('todo','in-progress','completed')),
    priority TEXT CHECK (priority IN ('low','medium','high')),
    points_on_time INTEGER NOT NULL DEFAULT 0,
    points_late INTEGER NOT NULL DEFAULT 0,
    schedule_time TIME, -- e.g. '08:00'
    deadline_time TIME, -- e.g. '18:00'
    is_special BOOLEAN DEFAULT FALSE,
    special_start_at TIMESTAMP WITH TIME ZONE,
    special_window_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_campaign ON questions(campaign_id);
CREATE INDEX idx_questions_day_index ON questions(campaign_id, day_index);
CREATE INDEX idx_questions_special_start ON questions(is_special, special_start_at);

-- =====================================================
-- Table: answers
-- =====================================================
CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    selected_answer INTEGER NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    is_on_time BOOLEAN NOT NULL DEFAULT false,
    is_correct BOOLEAN,
    CONSTRAINT uq_player_question UNIQUE (player_id, question_id)
);

CREATE INDEX idx_answers_player ON answers(player_id);
CREATE INDEX idx_answers_question ON answers(question_id);

-- =====================================================
-- Table: products
-- =====================================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    price_in_game_coins BIGINT NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    available_from DATE,
    available_until DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_campaign ON products(campaign_id);

-- =====================================================
-- Table: purchases
-- =====================================================
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    price_in_game_coins BIGINT NOT NULL,
    CONSTRAINT uq_purchase_player_product UNIQUE (player_id, product_id)
);

CREATE INDEX idx_purchases_player ON purchases(player_id);
CREATE INDEX idx_purchases_product ON purchases(product_id);

-- =====================================================
-- Table: admins
-- =====================================================
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
  invited BOOLEAN DEFAULT FALSE,
  invite_token TEXT,
  auth_uid TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_players_auth_uid ON players(auth_uid);
CREATE INDEX IF NOT EXISTS idx_admins_auth_uid ON admins(auth_uid);

-- =====================================================
-- Table: messages
-- =====================================================
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    "from" TEXT,
    subject TEXT,
    body TEXT,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    handled BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- Table: team_members (many-to-many between teams and players)
-- =====================================================
CREATE TABLE team_members (
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (team_id, player_id)
);

CREATE INDEX idx_team_members_player ON team_members(player_id);

-- =====================================================
-- Table: player_campaign_scores (store campaignScores map)
-- =====================================================
CREATE TABLE player_campaign_scores (
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    score BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, campaign_id)
);

-- =====================================================
-- Additional helper views / functions (optional)
-- =====================================================

-- View: campaign_progress (example)
CREATE VIEW campaign_progress AS
SELECT c.id AS campaign_id, c.name AS campaign_name,
       COUNT(DISTINCT q.id) AS total_questions,
       COUNT(DISTINCT a.id) FILTER (WHERE a.answered_at IS NOT NULL) AS total_answers
FROM campaigns c
LEFT JOIN questions q ON q.campaign_id = c.id
LEFT JOIN answers a ON a.campaign_id = c.id
GROUP BY c.id, c.name;

-- =====================================================
-- RPC Functions for Game Logic
-- =====================================================

-- Function: submit_answer
-- Handles answer submission with automatic scoring, duplicate prevention, and player score updates
CREATE OR REPLACE FUNCTION submit_answer(
    p_player_id INTEGER,
    p_question_id INTEGER,
    p_campaign_id INTEGER,
    p_selected_answer INTEGER
) RETURNS TABLE (
    id INTEGER,
    player_id INTEGER,
    question_id INTEGER,
    campaign_id INTEGER,
    answered_at TIMESTAMP WITH TIME ZONE,
    selected_answer INTEGER,
    points_earned INTEGER,
    is_on_time BOOLEAN,
    is_correct BOOLEAN
) LANGUAGE plpgsql AS $$
DECLARE
    v_question_record RECORD;
    v_points INTEGER := 0;
    v_is_correct BOOLEAN := FALSE;
    v_is_on_time BOOLEAN := FALSE;
    v_now TIMESTAMP WITH TIME ZONE := now();
    v_answer_id INTEGER;
BEGIN
    -- Check if answer already exists (prevent duplicate)
    IF EXISTS (SELECT 1 FROM answers WHERE answers.player_id = p_player_id AND answers.question_id = p_question_id) THEN
        RAISE EXCEPTION 'Answer already submitted for this question';
    END IF;

    -- Get question details
    SELECT * INTO v_question_record FROM questions WHERE questions.id = p_question_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Question not found';
    END IF;

    -- Check if answer is correct
    v_is_correct := (p_selected_answer = v_question_record.answer);

    -- Determine if answer is on time (simplified logic - can be enhanced with schedule_time/deadline_time)
    v_is_on_time := TRUE; -- Default to true; implement time window logic as needed

    -- Calculate points
    IF v_question_record.is_special THEN
        -- Special question logic
        IF v_is_correct THEN
            IF v_is_on_time THEN
                v_points := v_question_record.points_on_time;
            ELSE
                v_points := v_question_record.points_late;
            END IF;
        ELSE
            -- Incorrect answer in special question gets partial points
            IF v_is_on_time THEN
                v_points := v_question_record.points_on_time / 3; -- 1/3 of on-time points
            ELSE
                v_points := v_question_record.points_late / 3;
            END IF;
        END IF;
    ELSE
        -- Regular question logic
        IF v_is_correct THEN
            IF v_is_on_time THEN
                v_points := v_question_record.points_on_time;
            ELSE
                v_points := v_question_record.points_late;
            END IF;
        ELSE
            -- Incorrect answer gets partial points
            IF v_is_on_time THEN
                v_points := 300; -- Default partial points for incorrect on-time
            ELSE
                v_points := 150; -- Default partial points for incorrect late
            END IF;
        END IF;
    END IF;

    -- Insert answer
    INSERT INTO answers (player_id, question_id, campaign_id, selected_answer, points_earned, is_on_time, is_correct, answered_at)
    VALUES (p_player_id, p_question_id, p_campaign_id, p_selected_answer, v_points, v_is_on_time, v_is_correct, v_now)
    RETURNING answers.id INTO v_answer_id;

    -- Update player total score and game_coins
    UPDATE players
    SET score = score + v_points,
        game_coins = game_coins + v_points
    WHERE id = p_player_id;

    -- Update player_campaign_scores
    INSERT INTO player_campaign_scores (player_id, campaign_id, score)
    VALUES (p_player_id, p_campaign_id, v_points)
    ON CONFLICT (player_id, campaign_id)
    DO UPDATE SET score = player_campaign_scores.score + v_points;

    -- Return the created answer
    RETURN QUERY
    SELECT a.id, a.player_id, a.question_id, a.campaign_id, a.answered_at, a.selected_answer, a.points_earned, a.is_on_time, a.is_correct
    FROM answers a
    WHERE a.id = v_answer_id;
END;
$$;

-- Function: purchase_product
-- Handles product purchase with automatic validation, stock management, and coin deduction
CREATE OR REPLACE FUNCTION purchase_product(
    p_player_id INTEGER,
    p_product_id INTEGER,
    p_campaign_id INTEGER
) RETURNS TABLE (
    id INTEGER,
    player_id INTEGER,
    product_id INTEGER,
    campaign_id INTEGER,
    purchased_at TIMESTAMP WITH TIME ZONE,
    price_in_game_coins BIGINT
) LANGUAGE plpgsql AS $$
DECLARE
    v_product_record RECORD;
    v_player_coins BIGINT;
    v_purchase_id INTEGER;
    v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
    -- Check if purchase already exists (one per player/product)
    IF EXISTS (SELECT 1 FROM purchases WHERE purchases.player_id = p_player_id AND purchases.product_id = p_product_id) THEN
        RAISE EXCEPTION 'Product already purchased by this player';
    END IF;

    -- Get product details
    SELECT * INTO v_product_record FROM products WHERE products.id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    -- Check stock
    IF v_product_record.quantity <= 0 THEN
        RAISE EXCEPTION 'Product out of stock';
    END IF;

    -- Get player game_coins
    SELECT game_coins INTO v_player_coins FROM players WHERE id = p_player_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Player not found';
    END IF;

    -- Check if player has enough coins
    IF v_player_coins < v_product_record.price_in_game_coins THEN
        RAISE EXCEPTION 'Insufficient game coins';
    END IF;

    -- Deduct coins from player
    UPDATE players
    SET game_coins = game_coins - v_product_record.price_in_game_coins
    WHERE id = p_player_id;

    -- Reduce product quantity
    UPDATE products
    SET quantity = quantity - 1
    WHERE id = p_product_id;

    -- Insert purchase
    INSERT INTO purchases (player_id, product_id, campaign_id, price_in_game_coins, purchased_at)
    VALUES (p_player_id, p_product_id, p_campaign_id, v_product_record.price_in_game_coins, v_now)
    RETURNING purchases.id INTO v_purchase_id;

    -- Return the created purchase
    RETURN QUERY
    SELECT p.id, p.player_id, p.product_id, p.campaign_id, p.purchased_at, p.price_in_game_coins
    FROM purchases p
    WHERE p.id = v_purchase_id;
END;
$$;

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_campaign_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- PLAYERS policies
DROP POLICY IF EXISTS admins_full_access_players ON players;
CREATE POLICY admins_full_access_players ON players
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS player_self_access ON players;
CREATE POLICY player_self_access ON players
  FOR ALL
  USING (auth.uid()::text = auth_uid)
  WITH CHECK (auth.uid()::text = auth_uid);

-- CAMPAIGNS policies
DROP POLICY IF EXISTS admins_full_access_campaigns ON campaigns;
CREATE POLICY admins_full_access_campaigns ON campaigns
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- QUESTIONS policies
DROP POLICY IF EXISTS admins_full_access_questions ON questions;
CREATE POLICY admins_full_access_questions ON questions
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- TEAMS policies
DROP POLICY IF EXISTS admins_full_access_teams ON teams;
CREATE POLICY admins_full_access_teams ON teams
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- PRODUCTS policies
DROP POLICY IF EXISTS admins_full_access_products ON products;
CREATE POLICY admins_full_access_products ON products
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS public_select_products ON products;
CREATE POLICY public_select_products ON products
  FOR SELECT USING (true);

-- PURCHASES policies
DROP POLICY IF EXISTS admins_read_purchases ON purchases;
CREATE POLICY admins_read_purchases ON purchases
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS player_insert_purchase ON purchases;
CREATE POLICY player_insert_purchase ON purchases
  FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT auth_uid FROM players WHERE id = player_id));

DROP POLICY IF EXISTS player_select_purchase ON purchases;
CREATE POLICY player_select_purchase ON purchases
  FOR SELECT USING (
    auth.uid()::text = (SELECT auth_uid FROM players WHERE id = player_id) OR
    (auth.uid() IS NOT NULL)
  );

-- ANSWERS policies
DROP POLICY IF EXISTS admins_read_answers ON answers;
CREATE POLICY admins_read_answers ON answers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS player_insert_own_answer ON answers;
CREATE POLICY player_insert_own_answer ON answers
  FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT auth_uid FROM players WHERE id = player_id));

DROP POLICY IF EXISTS player_select_own_answer ON answers;
CREATE POLICY player_select_own_answer ON answers
  FOR SELECT USING (
    auth.uid()::text = (SELECT auth_uid FROM players WHERE id = player_id) OR
    (auth.uid() IS NOT NULL)
  );

-- PLAYER_CAMPAIGN_SCORES policies
DROP POLICY IF EXISTS admins_read_player_campaign_scores ON player_campaign_scores;
CREATE POLICY admins_read_player_campaign_scores ON player_campaign_scores
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS player_see_own_score ON player_campaign_scores;
CREATE POLICY player_see_own_score ON player_campaign_scores
  FOR SELECT USING (
    auth.uid()::text = (SELECT auth_uid FROM players WHERE id = player_id) OR
    (auth.uid() IS NOT NULL)
  );

-- CAMPAIGN_PLAYERS policies
DROP POLICY IF EXISTS admins_full_access_campaign_players ON campaign_players;
CREATE POLICY admins_full_access_campaign_players ON campaign_players
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- TEAM_MEMBERS policies
DROP POLICY IF EXISTS admins_full_access_team_members ON team_members;
CREATE POLICY admins_full_access_team_members ON team_members
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- MESSAGES policies
DROP POLICY IF EXISTS admins_full_access_messages ON messages;
CREATE POLICY admins_full_access_messages ON messages
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS player_insert_message ON messages;
CREATE POLICY player_insert_message ON messages
  FOR INSERT
  WITH CHECK (true);

-- ADMINS policies
DROP POLICY IF EXISTS admins_read_all_admins ON admins;
CREATE POLICY admins_read_all_admins ON admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.auth_uid::uuid = auth.uid()
    )
  );

DROP POLICY IF EXISTS admins_update_self ON admins;
CREATE POLICY admins_update_self ON admins
  FOR UPDATE
  USING (auth_uid::uuid = auth.uid())
  WITH CHECK (auth_uid::uuid = auth.uid());

-- =====================================================
-- Sample constraints & notes
-- - Ensure application-level logic enforces business rules such as: one purchase per player/product, product stock availability
-- - Consider triggers to maintain denormalized totals (team.total_score, campaign summaries)
-- - Consider adding FOREIGN KEY checks and ON UPDATE behaviors depending on your domain rules

-- =====================================================
-- End of schema

