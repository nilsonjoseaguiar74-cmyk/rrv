BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('owner','admin','editor','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE content_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new','contacted','qualified','proposal','won','lost','spam');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email varchar(320) NOT NULL UNIQUE,
  password_hash text NOT NULL, name varchar(160) NOT NULL, role admin_role NOT NULL DEFAULT 'viewer',
  is_active boolean NOT NULL DEFAULT true, last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), last_used_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key varchar(100) NOT NULL UNIQUE, value text NOT NULL DEFAULT '',
  draft_value text, status content_status NOT NULL DEFAULT 'published', updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS home_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug varchar(100) NOT NULL UNIQUE, title varchar(240) NOT NULL,
  description text NOT NULL DEFAULT '', content jsonb NOT NULL DEFAULT '{}'::jsonb, sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order >= 0),
  is_active boolean NOT NULL DEFAULT true, status content_status NOT NULL DEFAULT 'published', updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS home_sections_public_idx ON home_sections(status,is_active,sort_order);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(240) NOT NULL, slug varchar(120) NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '', category varchar(80) NOT NULL, icon text NOT NULL DEFAULT '', cta varchar(240) NOT NULL DEFAULT 'Start a project',
  sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order >= 0), is_active boolean NOT NULL DEFAULT true,
  status content_status NOT NULL DEFAULT 'draft', updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS services_public_idx ON services(status,is_active,category,sort_order);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(240) NOT NULL, slug varchar(120) NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '', image_url text NOT NULL DEFAULT '', external_url text NOT NULL DEFAULT '',
  category varchar(80) NOT NULL, technologies text NOT NULL DEFAULT '', featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order >= 0), status content_status NOT NULL DEFAULT 'draft',
  updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_public_idx ON projects(status,featured,sort_order);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(200) NOT NULL, slug varchar(120) NOT NULL UNIQUE,
  role varchar(200) NOT NULL, bio text NOT NULL DEFAULT '', image_url text NOT NULL DEFAULT '', linkedin_url text NOT NULL DEFAULT '',
  discipline varchar(80) NOT NULL DEFAULT 'engineering', sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order >= 0),
  is_active boolean NOT NULL DEFAULT true, status content_status NOT NULL DEFAULT 'published', updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS team_public_idx ON team_members(status,is_active,sort_order);

CREATE TABLE IF NOT EXISTS cta_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug varchar(120) NOT NULL UNIQUE, title varchar(300) NOT NULL,
  label varchar(200) NOT NULL, url text NOT NULL, context varchar(80) NOT NULL DEFAULT 'neutral', sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true, status content_status NOT NULL DEFAULT 'published', updated_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(160) NOT NULL, whatsapp varchar(50) NOT NULL,
  email varchar(320) NOT NULL, company varchar(240) NOT NULL DEFAULT '', project_type varchar(120) NOT NULL,
  description text NOT NULL, problem text NOT NULL DEFAULT '', budget varchar(120) NOT NULL DEFAULT '', ref text NOT NULL DEFAULT '',
  utm_source varchar(240) NOT NULL DEFAULT '', utm_medium varchar(240) NOT NULL DEFAULT '', utm_campaign varchar(240) NOT NULL DEFAULT '',
  utm_content varchar(240) NOT NULL DEFAULT '', utm_term varchar(240) NOT NULL DEFAULT '', status lead_status NOT NULL DEFAULT 'new',
  notes text NOT NULL DEFAULT '', consent_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_status_created_idx ON leads(status,created_at DESC);
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(lower(email));

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), admin_user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action varchar(100) NOT NULL, entity_type varchar(100) NOT NULL, entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type,entity_id);

DROP TRIGGER IF EXISTS admin_users_updated_at ON admin_users;
CREATE TRIGGER admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS home_sections_updated_at ON home_sections;
CREATE TRIGGER home_sections_updated_at BEFORE UPDATE ON home_sections FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS services_updated_at ON services;
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS team_members_updated_at ON team_members;
CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS cta_blocks_updated_at ON cta_blocks;
CREATE TRIGGER cta_blocks_updated_at BEFORE UPDATE ON cta_blocks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
COMMIT;
