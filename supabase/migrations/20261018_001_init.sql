-- ============================================================================
-- CoreIQ CRM: Initial Supabase Migration
-- File: supabase/migrations/20261018_001_init.sql
-- Description: Core tables, indexes, triggers, RLS policies, and stage seeds
-- ============================================================================

-- Ensure pgcrypto extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Helper function for updated_at timestamps
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. Tables Definition
-- ----------------------------------------------------------------------------

-- settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- profiles (references auth.users in Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
    PRIMARY KEY (user_id, role)
);

-- clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('company', 'individual')),
    industry TEXT,
    website TEXT,
    country TEXT,
    timezone TEXT,
    source TEXT,
    tags TEXT[],
    notes TEXT,
    health_score INT DEFAULT 50,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- contacts
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    role_title TEXT,
    is_primary BOOL DEFAULT FALSE,
    preferred_channel TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pipeline_stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    position INT NOT NULL,
    color TEXT,
    probability_pct INT,
    sla_days INT,
    is_terminal BOOL DEFAULT FALSE,
    outcome TEXT,
    guidance_md TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- engagements
CREATE TABLE IF NOT EXISTS engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_code TEXT UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
    value_estimate NUMERIC,
    currency TEXT DEFAULT 'ZAR',
    expected_close DATE,
    outcome TEXT,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- stage_history
CREATE TABLE IF NOT EXISTS stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    from_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    to_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    actor_type TEXT,
    actor_name TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- requests
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT,
    status TEXT DEFAULT 'requested',
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- activities
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    summary TEXT NOT NULL,
    body TEXT,
    actor_type TEXT,
    actor_name TEXT,
    metadata JSONB,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_at TIMESTAMPTZ,
    priority TEXT,
    status TEXT DEFAULT 'open',
    assignee_actor TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- audit_log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    at TIMESTAMPTZ DEFAULT NOW(),
    actor_type TEXT,
    actor_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    before JSONB,
    after JSONB,
    request_id TEXT
);

-- ----------------------------------------------------------------------------
-- 3. Updated At Triggers
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_engagements_updated_at ON engagements;
CREATE TRIGGER trg_engagements_updated_at
    BEFORE UPDATE ON engagements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_requests_updated_at ON requests;
CREATE TRIGGER trg_requests_updated_at
    BEFORE UPDATE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. Performance & Foreign Key Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_client_code ON clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_health_score ON clients(health_score);
CREATE INDEX IF NOT EXISTS idx_clients_archived_at ON clients(archived_at);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_position ON pipeline_stages(position);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_key ON pipeline_stages(key);

CREATE INDEX IF NOT EXISTS idx_engagements_client_id ON engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_engagements_stage_id ON engagements(stage_id);
CREATE INDEX IF NOT EXISTS idx_engagements_archived_at ON engagements(archived_at);
CREATE INDEX IF NOT EXISTS idx_engagements_code ON engagements(engagement_code);

CREATE INDEX IF NOT EXISTS idx_stage_history_engagement_id ON stage_history(engagement_id);
CREATE INDEX IF NOT EXISTS idx_stage_history_from_stage ON stage_history(from_stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_history_to_stage ON stage_history(to_stage_id);

CREATE INDEX IF NOT EXISTS idx_requests_client_id ON requests(client_id);
CREATE INDEX IF NOT EXISTS idx_requests_engagement_id ON requests(engagement_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

CREATE INDEX IF NOT EXISTS idx_activities_client_id ON activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_engagement_id ON activities(engagement_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_occurred_at ON activities(occurred_at);

CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_engagement_id ON tasks(engagement_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_at ON audit_log(at);

-- ----------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Configuration
-- ----------------------------------------------------------------------------

-- Enable RLS on all 12 tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Read policies: Authenticated users can read all rows
-- (Anon role has no policies granted, hence 0 access for anon)
-- (Service role in Supabase has BYPASSRLS and performs server-side writes)

CREATE POLICY "Allow authenticated read on settings"
    ON settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on profiles"
    ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on user_roles"
    ON user_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on clients"
    ON clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on contacts"
    ON contacts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on pipeline_stages"
    ON pipeline_stages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on engagements"
    ON engagements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on stage_history"
    ON stage_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on requests"
    ON requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on activities"
    ON activities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on tasks"
    ON tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on audit_log"
    ON audit_log FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 6. Seed Pipeline Stages (9 Core Stages + 2 Terminal Stages)
-- ----------------------------------------------------------------------------
INSERT INTO pipeline_stages (
    id, key, name, position, color, probability_pct, sla_days, is_terminal, outcome, guidance_md
) VALUES
    ('00000000-0000-0000-0000-000000000001', 'outreach', 'Outreach', 1, '#64748B', 10, 7, FALSE, NULL, 'Initial contact initiated. Send introductory email and track opens.'),
    ('00000000-0000-0000-0000-000000000002', 'engaged', 'Engaged', 2, '#38BDF8', 20, 5, FALSE, NULL, 'Prospect responded positively. Schedule qualification call and determine budget.'),
    ('00000000-0000-0000-0000-000000000003', 'discovery', 'Discovery', 3, '#818CF8', 35, 5, FALSE, NULL, 'Send Discovery Questionnaire link (/q/:token). Synthesize scope into build brief.'),
    ('00000000-0000-0000-0000-000000000004', 'sampling_building', 'Sampling: Building', 4, '#F59E0B', 50, 7, FALSE, NULL, 'Produce prototype sample or demo workflow from reusable asset library.'),
    ('00000000-0000-0000-0000-000000000005', 'sampling_review', 'Sampling: Review', 5, '#EC4899', 65, 3, FALSE, NULL, 'Client reviews sample. Collect feedback score and verdict via /f/:token.'),
    ('00000000-0000-0000-0000-000000000006', 'proposal', 'Proposal', 6, '#A855F7', 80, 5, FALSE, NULL, 'Generate and send commercial quote via /quote/:token with payment terms.'),
    ('00000000-0000-0000-0000-000000000007', 'won_building', 'Won: Building', 7, '#10B981', 95, 14, FALSE, NULL, 'Quote accepted online. Development in progress. Update weekly milestone notes.'),
    ('00000000-0000-0000-0000-000000000008', 'delivered', 'Delivered', 8, '#06B6D4', 100, 30, FALSE, 'won', 'Solution handed over. Confirm live URL and repository access with client.'),
    ('00000000-0000-0000-0000-000000000009', 'growth', 'Growth', 9, '#6366F1', 100, 60, FALSE, 'expansion', 'Deliverable active for 14+ days. Pitch maintenance retainer or workflow automation add-on.'),
    ('00000000-0000-0000-0000-000000000010', 'lost', 'Lost', 10, '#EF4444', 0, NULL, TRUE, 'lost', 'Engagement marked lost. Mandatory loss reason logged in stage history.'),
    ('00000000-0000-0000-0000-000000000011', 'paused', 'Paused', 11, '#94A3B8', 0, NULL, TRUE, 'paused', 'Client project temporarily on hold. Re-engagement task scheduled.')
ON CONFLICT (id) DO UPDATE SET
    key = EXCLUDED.key,
    name = EXCLUDED.name,
    position = EXCLUDED.position,
    color = EXCLUDED.color,
    probability_pct = EXCLUDED.probability_pct,
    sla_days = EXCLUDED.sla_days,
    is_terminal = EXCLUDED.is_terminal,
    outcome = EXCLUDED.outcome,
    guidance_md = EXCLUDED.guidance_md;
