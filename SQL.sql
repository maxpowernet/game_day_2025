-- SQL schema for database `game-day`
-- Target: PostgreSQL
-- Generated from TypeScript models in src/lib/storageApi.ts

-- Enable UUID extension if you want UUIDs (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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
-- Sample constraints & notes
-- - Ensure application-level logic enforces business rules such as: one purchase per player/product, product stock availability
-- - Consider triggers to maintain denormalized totals (team.total_score, campaign summaries)
-- - Consider adding FOREIGN KEY checks and ON UPDATE behaviors depending on your domain rules

-- =====================================================
-- End of schema
