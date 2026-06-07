-- ============================================================================
-- CRM Seed Data for full-stack-fastapi-template
-- ============================================================================
-- Prerequisites:
--   1. Run `alembic upgrade head` first (creates all tables)
--   2. Have at least one user registered (the superuser from initial_data)
-- ============================================================================
-- Usage:
--   PGPASSWORD=taskapp_secret psql -h 127.0.0.1 -U taskapp -d fastapi_template -f crm_seed.sql
-- ============================================================================

BEGIN;

-- 1. Find the existing superuser (created by init_db)
DO $$
DECLARE
    admin_user_id  uuid;
    tenant_id      uuid;
    acme_id        uuid;
    globex_id      uuid;
    initech_id     uuid;
    wayne_id       uuid;
    stark_id       uuid;
    wayne_contact  uuid;
    potts_contact  uuid;
    lang_contact   uuid;
    wong_contact   uuid;
    mysterio_contact uuid;
    stark_deal     uuid;
    stark_deal2    uuid;
    globex_deal    uuid;
    initech_deal   uuid;
BEGIN
    -- Get the first superuser as admin
    SELECT id INTO admin_user_id FROM "user" WHERE is_superuser = true LIMIT 1;
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'No superuser found. Register a user first.';
    END IF;

    -- ========================================================================
    -- TENANT
    -- ========================================================================
    INSERT INTO tenant (id, name, domain, created_at)
    VALUES (gen_random_uuid(), 'Acme Corp', 'acme.com', now())
    RETURNING id INTO tenant_id;

    -- Admin membership
    INSERT INTO tenant_membership (id, user_id, tenant_id, role)
    VALUES (gen_random_uuid(), admin_user_id, tenant_id, 'admin');

    -- ========================================================================
    -- CRM COMPANIES
    -- ========================================================================
    INSERT INTO crm_company (id, tenant_id, name, website, industry, employee_count, annual_revenue, address, city, state, country, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), tenant_id, 'Stark Industries', 'https://stark.com', 'Technology', 12000, 9800000000.00, '200 Industrial Ave', 'Los Angeles', 'CA', 'USA', 'Fortune 500 defense and clean energy contractor.', now(), now())
    RETURNING id INTO stark_id;

    INSERT INTO crm_company (id, tenant_id, name, website, industry, employee_count, annual_revenue, address, city, state, country, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), tenant_id, 'Globex Corporation', 'https://globex.co', 'Manufacturing', 3400, 1200000000.00, '1 Research Pkwy', 'Austin', 'TX', 'USA', 'Industrial automation and robotics supplier.', now(), now())
    RETURNING id INTO globex_id;

    INSERT INTO crm_company (id, tenant_id, name, website, industry, employee_count, annual_revenue, address, city, state, country, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), tenant_id, 'Initech', 'https://initech.example.com', 'Technology', 850, 245000000.00, '4120 Main St', 'Dallas', 'TX', 'USA', 'Mid-market SaaS — TPS reports & compliance software.', now(), now())
    RETURNING id INTO initech_id;

    INSERT INTO crm_company (id, tenant_id, name, website, industry, employee_count, annual_revenue, address, city, state, country, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), tenant_id, 'Wayne Enterprises', 'https://wayne.com', 'Finance', 22000, 15000000000.00, '1007 Mountain Dr', 'Gotham', 'NY', 'USA', 'Conglomerate: defense, tech, and philanthropic arms.', now(), now())
    RETURNING id INTO wayne_id;

    -- ========================================================================
    -- CONTACTS
    -- ========================================================================
    INSERT INTO contact (id, company_id, tenant_id, first_name, last_name, title, email, phone, linkedin_url, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), wayne_id, tenant_id, 'Bruce', 'Wayne', 'CEO', 'bruce@wayne.com', '+1-555-0100', 'https://linkedin.com/in/brucewayne', 'Primary decision-maker. Prefers evening calls.', now(), now())
    RETURNING id INTO wayne_contact;

    INSERT INTO contact (id, company_id, tenant_id, first_name, last_name, title, email, phone, linkedin_url, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), stark_id, tenant_id, 'Pepper', 'Potts', 'COO', 'pepper@stark.com', '+1-555-0200', 'https://linkedin.com/in/pepperpotts', 'Day-to-day operations. Very responsive.', now(), now())
    RETURNING id INTO potts_contact;

    INSERT INTO contact (id, company_id, tenant_id, first_name, last_name, title, email, phone, linkedin_url, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), initech_id, tenant_id, 'Peter', 'Gibbons', 'VP Engineering', 'peter@initech.example.com', '+1-555-0300', 'https://linkedin.com/in/petergibbons', 'Technical buyer. Wants API docs and a POC.', now(), now())
    RETURNING id INTO lang_contact;

    INSERT INTO contact (id, company_id, tenant_id, first_name, last_name, title, email, phone, linkedin_url, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), initech_id, tenant_id, 'Joanna', 'Wong', 'Procurement Manager', 'joanna@initech.example.com', '+1-555-0301', NULL, 'Handles vendor onboarding. Needs security questionnaire.', now(), now())
    RETURNING id INTO wong_contact;

    INSERT INTO contact (id, company_id, tenant_id, first_name, last_name, title, email, phone, linkedin_url, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), globex_id, tenant_id, 'Quentin', 'Beck', 'Head of Innovation', 'quentin@globex.co', '+1-555-0400', 'https://linkedin.com/in/quentinbeck', 'Interested in AI/ML capabilities. Inflates requirements.', now(), now())
    RETURNING id INTO mysterio_contact;

    -- ========================================================================
    -- DEALS
    -- ========================================================================
    INSERT INTO deal (id, company_id, contact_id, owner_id, tenant_id, name, amount, stage, probability, expected_close_date, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), stark_id, potts_contact, admin_user_id, tenant_id, 'Arc Reactor Gen 3 Supply', 4500000.00, 'proposal', 60, '2026-09-15', 'Proposal sent June 1. Awaiting technical review feedback.', now(), now())
    RETURNING id INTO stark_deal;

    INSERT INTO deal (id, company_id, contact_id, owner_id, tenant_id, name, amount, stage, probability, expected_close_date, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), stark_id, potts_contact, admin_user_id, tenant_id, 'Stark Tower Solar Grid', 22000000.00, 'qualified', 30, '2026-12-01', 'Early stage. Need to align on spec before budget discussion.', now(), now())
    RETURNING id INTO stark_deal2;

    INSERT INTO deal (id, company_id, contact_id, owner_id, tenant_id, name, amount, stage, probability, expected_close_date, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), globex_id, mysterio_contact, admin_user_id, tenant_id, 'Robotics Fleet Overhaul', 8900000.00, 'negotiation', 75, '2026-08-01', 'Final contract terms under legal review. Close likely.', now(), now())
    RETURNING id INTO globex_deal;

    INSERT INTO deal (id, company_id, contact_id, owner_id, tenant_id, name, amount, stage, probability, expected_close_date, notes, created_at, updated_at)
    VALUES
    (gen_random_uuid(), initech_id, lang_contact, admin_user_id, tenant_id, 'TPS Report Automation', 180000.00, 'lead', 15, '2026-10-01', 'Initial discovery call completed. Needs follow-up demo.', now(), now())
    RETURNING id INTO initech_deal;

    -- ========================================================================
    -- ACTIVITIES
    -- ========================================================================
    INSERT INTO activity (id, company_id, contact_id, deal_id, owner_id, tenant_id, type, subject, description, due_date, completed, created_at)
    VALUES
    (gen_random_uuid(), stark_id, potts_contact, stark_deal, admin_user_id, tenant_id, 'call', 'Follow up on proposal Q&A', 'Pepper had questions about SLA section 4.2.', '2026-06-10 10:00:00', false, now());

    INSERT INTO activity (id, company_id, contact_id, deal_id, owner_id, tenant_id, type, subject, description, due_date, completed, created_at)
    VALUES
    (gen_random_uuid(), stark_id, potts_contact, stark_deal, admin_user_id, tenant_id, 'email', 'Send revised pricing sheet', 'Updated with volume discount tier.', '2026-06-07 17:00:00', true, now());

    INSERT INTO activity (id, company_id, contact_id, deal_id, owner_id, tenant_id, type, subject, description, due_date, completed, created_at)
    VALUES
    (gen_random_uuid(), globex_id, mysterio_contact, globex_deal, admin_user_id, tenant_id, 'meeting', 'Contract review with legal', 'Final redlines from both sides. 1 hr, conference room B.', '2026-06-12 14:00:00', false, now());

    INSERT INTO activity (id, company_id, contact_id, deal_id, owner_id, tenant_id, type, subject, description, due_date, completed, created_at)
    VALUES
    (gen_random_uuid(), initech_id, lang_contact, initech_deal, admin_user_id, tenant_id, 'task', 'Prepare POC environment', 'Spin up sandbox with sample TPS data for demo.', '2026-06-14 09:00:00', false, now());

    INSERT INTO activity (id, company_id, contact_id, deal_id, owner_id, tenant_id, type, subject, description, due_date, completed, created_at)
    VALUES
    (gen_random_uuid(), wayne_id, wayne_contact, NULL, admin_user_id, tenant_id, 'call', 'Intro call with Bruce Wayne', 'Initial reach-out. 30 min. Emphasize ROI and social impact angle.', '2026-06-20 16:00:00', false, now());

    INSERT INTO activity (id, company_id, contact_id, deal_id, owner_id, tenant_id, type, subject, description, due_date, completed, created_at)
    VALUES
    (gen_random_uuid(), globex_id, mysterio_contact, globex_deal, admin_user_id, tenant_id, 'task', 'Send security compliance docs', 'SOC 2 and ISO 27001 certs requested by their IT team.', '2026-06-08 12:00:00', true, now());

    -- ========================================================================
    -- NOTES
    -- ========================================================================
    INSERT INTO note (id, company_id, contact_id, deal_id, created_by, tenant_id, content, created_at)
    VALUES
    (gen_random_uuid(), stark_id, NULL, NULL, admin_user_id, tenant_id, 'Stark Industries is our highest-value account. Quarterly business review scheduled for July. Key stakeholders: Pepper (COO) and Tony (CEO, harder to reach).', now());

    INSERT INTO note (id, company_id, contact_id, deal_id, created_by, tenant_id, content, created_at)
    VALUES
    (gen_random_uuid(), NULL, potts_contact, NULL, admin_user_id, tenant_id, 'Pepper prefers email over phone. Very detail-oriented. Always ask about timelines upfront.', now());

    INSERT INTO note (id, company_id, contact_id, deal_id, created_by, tenant_id, content, created_at)
    VALUES
    (gen_random_uuid(), NULL, NULL, globex_deal, admin_user_id, tenant_id, 'Legal flagged clause 7.3 (indemnification). Need to discuss risk appetite with our counsel before responding.', now());

    INSERT INTO note (id, company_id, contact_id, deal_id, created_by, tenant_id, content, created_at)
    VALUES
    (gen_random_uuid(), globex_id, NULL, NULL, admin_user_id, tenant_id, 'Globex is expanding their robotics division — potential upsell for our monitoring suite. Talk to Quentin about their 2027 roadmap.', now());

    INSERT INTO note (id, company_id, contact_id, deal_id, created_by, tenant_id, content, created_at)
    VALUES
    (gen_random_uuid(), initech_id, NULL, NULL, admin_user_id, tenant_id, 'Small deal but strategic — Initech is well-connected in the Austin SaaS scene. Could be a reference customer.', now());

    INSERT INTO note (id, company_id, contact_id, deal_id, created_by, tenant_id, content, created_at)
    VALUES
    (gen_random_uuid(), wayne_id, wayne_contact, NULL, admin_user_id, tenant_id, 'Wayne Enterprises has a massive procurement process (6-9 months). Need to get into their vendor portal early. Bruce mentioned interest in our analytics platform.', now());

    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Tenant ID: %', tenant_id;
    RAISE NOTICE 'Set in browser: localStorage.setItem("tenant_id", "%")', tenant_id;
END $$;

COMMIT;
