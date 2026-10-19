-- ============================================================================
-- CoreIQ CRM: Additive Extensions Migration
-- File: supabase/migrations/20261019_002_coreiq_extensions.sql
-- Description: Business settings, invoices, items, payments, retainers, milestones,
--              push subscriptions, idempotency, and additive stage playbooks.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Additive Columns on Existing Tables
-- ----------------------------------------------------------------------------

-- pipeline_stages: goal, exit_criteria, next_action_hint, stale_after_days
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS exit_criteria TEXT[];
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS next_action_hint TEXT;
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS stale_after_days INT DEFAULT 3;

-- engagements: human_code (CIQ-P-XXXX format)
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS human_code TEXT;

-- quotes: accepted_at, accepted_via, accepted_by_name, acceptance_note
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN
        CREATE TABLE quotes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            quote_code TEXT UNIQUE NOT NULL,
            client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
            title TEXT,
            status TEXT DEFAULT 'draft',
            total NUMERIC DEFAULT 0,
            currency TEXT DEFAULT 'ZAR',
            valid_until DATE,
            notes TEXT,
            token TEXT,
            accepted_at TIMESTAMPTZ,
            accepted_via TEXT,
            accepted_by_name TEXT,
            acceptance_note TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow authenticated read on quotes" ON quotes FOR SELECT TO authenticated USING (true);
    ELSE
        ALTER TABLE quotes ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
        ALTER TABLE quotes ADD COLUMN IF NOT EXISTS accepted_via TEXT;
        ALTER TABLE quotes ADD COLUMN IF NOT EXISTS accepted_by_name TEXT;
        ALTER TABLE quotes ADD COLUMN IF NOT EXISTS acceptance_note TEXT;
    END IF;
END $$;

-- clients: last_followup_at, followup_count
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_followup_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS followup_count INT DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 2. Business Settings Table (Single row for CoreIQ Create)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_name TEXT NOT NULL DEFAULT 'CoreIQ Create',
    tagline TEXT NOT NULL DEFAULT 'Ideas | Intelligence | Action',
    email TEXT NOT NULL DEFAULT 'operator@coreiq.com',
    website TEXT NOT NULL DEFAULT 'https://coreiq.com',
    address TEXT DEFAULT 'Johannesburg, South Africa',
    registration_number TEXT,
    vat_number TEXT,
    vat_enabled BOOLEAN DEFAULT FALSE,
    vat_rate NUMERIC DEFAULT 0.15,
    logo_url TEXT,
    currency TEXT DEFAULT 'ZAR',
    currency_symbol TEXT DEFAULT 'R',
    payment_due_days INT DEFAULT 7,
    quote_validity_days INT DEFAULT 14,
    deposit_pct INT DEFAULT 50,
    invoice_prefix TEXT DEFAULT 'CIQ-',
    quote_prefix TEXT DEFAULT 'CIQ-Q-',
    project_prefix TEXT DEFAULT 'CIQ-P-',
    timezone TEXT DEFAULT 'Africa/Johannesburg',
    next_invoice_number INT DEFAULT 2, -- starts at 2 because CIQ-0001 was historical
    next_quote_number INT DEFAULT 1,
    payment_methods JSONB DEFAULT '[{"id":"eft","type":"eft","label":"Electronic Funds Transfer (EFT)","enabled":true,"rows":[{"label":"Bank","value":""},{"label":"Account Holder","value":""},{"label":"Account Type","value":""},{"label":"Account Number","value":""},{"label":"Branch Code","value":""}],"instructions":"Please use invoice number as payment reference and send POP to operator@coreiq.com"}]'::jsonb,
    terms_blocks JSONB DEFAULT '{"payment_terms":"Payment is due within 7 days of invoice date.","deposit_cancellation":"A 50% deposit is required before build initiation. Work is non-refundable once started.","scope_revisions":"Specifications detailed in the Build Brief govern scope. Extra revisions billed at standard catalog rates.","delivery_maintenance":"Handover includes repository access. Maintenance retainers available separately.","late_payment":"Overdue invoices incur 2% per month penalty.","general":"South African commercial law applies."}'::jsonb,
    agents_paused BOOLEAN DEFAULT FALSE,
    send_mode TEXT DEFAULT 'draft',
    followup_min_hours INT DEFAULT 24,
    followup_max_per_stage INT DEFAULT 3,
    invoice_reminder_days JSONB DEFAULT '[2, -1, -7, -14]'::jsonb,
    quote_followup_days INT DEFAULT 3,
    push_events JSONB DEFAULT '{"new_lead":true,"money_in":true,"build_needed":true,"retainer_due":true}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on business_settings" ON business_settings FOR SELECT TO authenticated USING (true);

-- Seed initial business_settings row if not exists
INSERT INTO business_settings (id, trading_name, tagline, next_invoice_number)
VALUES ('00000000-0000-0000-0000-000000000001', 'CoreIQ Create', 'Ideas | Intelligence | Action', 2)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Document Counters Table (Atomic Numbering)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_counters (
    id TEXT PRIMARY KEY,
    last_value INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE document_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on document_counters" ON document_counters FOR SELECT TO authenticated USING (true);

INSERT INTO document_counters (id, last_value)
VALUES ('invoice', 1), ('quote', 0), ('project', 0)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Invoices and Items Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    retainer_id UUID,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    sent_at TIMESTAMPTZ,
    sent_channel TEXT,
    sent_recipient TEXT,
    bill_to_snapshot JSONB NOT NULL,
    from_business_snapshot JSONB NOT NULL,
    terms_snapshot JSONB NOT NULL,
    selected_payment_methods JSONB NOT NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    vat_amount NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    amount_due NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'ZAR',
    notes TEXT,
    is_historical BOOLEAN DEFAULT FALSE,
    duplicate_of TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on invoices" ON invoices FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID,
    description TEXT NOT NULL,
    sub_description TEXT,
    qty NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    discount_pct NUMERIC NOT NULL DEFAULT 0,
    amount NUMERIC NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on invoice_items" ON invoice_items FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ----------------------------------------------------------------------------
-- 5. Payments Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'ZAR',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL,
    reference TEXT,
    notes TEXT,
    recorded_by_actor TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on payments" ON payments FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);

-- ----------------------------------------------------------------------------
-- 6. Retainers Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'ZAR',
    cycle TEXT NOT NULL CHECK (cycle IN ('monthly', 'quarterly', 'annual')),
    next_invoice_date DATE NOT NULL,
    last_invoiced_date DATE,
    status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'ended')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE retainers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on retainers" ON retainers FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_retainers_client_id ON retainers(client_id);
CREATE INDEX IF NOT EXISTS idx_retainers_next_date ON retainers(next_invoice_date);

-- ----------------------------------------------------------------------------
-- 7. Milestones Table (Engagement Delivery Checklists)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    deliverable_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
    sort_order INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on milestones" ON milestones FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_milestones_engagement_id ON milestones(engagement_id);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON milestones(due_date);

-- ----------------------------------------------------------------------------
-- 8. Web Push Subscriptions Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT UNIQUE NOT NULL,
    keys JSONB NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on push_subscriptions" ON push_subscriptions FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 9. Idempotency Keys Table (24-Hour Expiry)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on idempotency_keys" ON idempotency_keys FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);

-- ----------------------------------------------------------------------------
-- 10. Products & Price Book Tables (for full Postgres persistence)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    base_price NUMERIC,
    currency TEXT DEFAULT 'ZAR',
    pricing_model TEXT DEFAULT 'fixed',
    needs_price BOOLEAN DEFAULT FALSE,
    is_addon BOOLEAN DEFAULT FALSE,
    estimated_hours INT DEFAULT 0,
    tags TEXT[],
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on products" ON products FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_delta NUMERIC DEFAULT 0,
    hours_delta INT DEFAULT 0
);

ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on product_options" ON product_options FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS price_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    tier_name TEXT NOT NULL,
    min_units INT DEFAULT 1,
    max_units INT,
    unit_price NUMERIC NOT NULL
);

ALTER TABLE price_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on price_tiers" ON price_tiers FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS build_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    summary TEXT,
    architecture_overview TEXT,
    data_schema_summary TEXT,
    external_integrations TEXT[],
    deliverables_checklist JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE build_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on build_briefs" ON build_briefs FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    hours_saved INT DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on assets" ON assets FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
    deliverable_code TEXT,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'building',
    live_url TEXT,
    repo_url TEXT,
    handover_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on deliverables" ON deliverables FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 11. Backfill Human Codes for Engagements (CIQ-P-XXXX format)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
    counter INT := 1;
BEGIN
    FOR r IN SELECT id FROM engagements WHERE human_code IS NULL ORDER BY created_at ASC LOOP
        UPDATE engagements
        SET human_code = 'CIQ-P-' || LPAD(counter::TEXT, 4, '0')
        WHERE id = r.id;
        counter := counter + 1;
    END LOOP;
END $$;
