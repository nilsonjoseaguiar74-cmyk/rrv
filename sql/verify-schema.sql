BEGIN;

DO $$ BEGIN
  CREATE TYPE verify_workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS verify_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL CHECK (length(trim(name)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verify_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer varchar(500) NOT NULL,
  subject varchar(500) NOT NULL,
  email varchar(320),
  display_name varchar(160) NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer, subject)
);

CREATE TABLE IF NOT EXISTS verify_workspace_members (
  workspace_id uuid NOT NULL REFERENCES verify_workspaces(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL REFERENCES verify_identities(id) ON DELETE CASCADE,
  role verify_workspace_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, identity_id)
);
CREATE INDEX IF NOT EXISTS verify_workspace_members_identity_idx
  ON verify_workspace_members(identity_id, workspace_id);

CREATE TABLE IF NOT EXISTS verify_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES verify_workspaces(id) ON DELETE CASCADE,
  email varchar(320) NOT NULL,
  role verify_workspace_role NOT NULL DEFAULT 'viewer',
  max_attempts smallint NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 10),
  code_request_count smallint NOT NULL DEFAULT 0 CHECK (code_request_count >= 0),
  code_request_window_started_at timestamptz,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  issued_by_admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (consumed_at IS NULL OR revoked_at IS NULL)
);
CREATE INDEX IF NOT EXISTS verify_invitations_email_workspace_idx
  ON verify_invitations(lower(email), workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS verify_invitations_expiry_idx
  ON verify_invitations(expires_at)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS verify_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES verify_invitations(id) ON DELETE CASCADE,
  code_hash char(64) NOT NULL,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts smallint NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 10),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (consumed_at IS NULL OR revoked_at IS NULL)
);
CREATE INDEX IF NOT EXISTS verify_access_codes_invitation_created_idx
  ON verify_access_codes(invitation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS verify_access_codes_expiry_idx
  ON verify_access_codes(expires_at)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS verify_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL REFERENCES verify_identities(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verify_sessions_identity_expiry_idx
  ON verify_sessions(identity_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS verify_sessions_expiry_idx
  ON verify_sessions(expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS verify_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES verify_workspaces(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL CHECK (length(trim(name)) > 0),
  description text NOT NULL DEFAULT '',
  reference_url text NOT NULL DEFAULT '',
  created_by uuid REFERENCES verify_identities(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES verify_identities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS verify_projects_workspace_updated_idx
  ON verify_projects(workspace_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS verify_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  project_id uuid NOT NULL,
  objective varchar(500) NOT NULL CHECK (length(trim(objective)) > 0),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  acceptance_criterion text NOT NULL CHECK (length(trim(acceptance_criterion)) > 0),
  verification_method varchar(160) NOT NULL DEFAULT '',
  module_key varchar(80) NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_by uuid REFERENCES verify_identities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, project_id, id),
  FOREIGN KEY (workspace_id, project_id)
    REFERENCES verify_projects(workspace_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS verify_requirements_project_order_idx
  ON verify_requirements(workspace_id, project_id, sort_order, created_at);

CREATE TABLE IF NOT EXISTS verify_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  project_id uuid NOT NULL,
  label varchar(80) NOT NULL CHECK (length(trim(label)) > 0),
  summary text NOT NULL DEFAULT '',
  delivered_at date,
  created_by uuid REFERENCES verify_identities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, label),
  UNIQUE (workspace_id, project_id, id),
  FOREIGN KEY (workspace_id, project_id)
    REFERENCES verify_projects(workspace_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS verify_versions_project_created_idx
  ON verify_versions(workspace_id, project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS verify_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  project_id uuid NOT NULL,
  requirement_id uuid NOT NULL,
  version_id uuid,
  status varchar(16) NOT NULL CHECK (status IN ('passed', 'failed', 'blocked')),
  summary text NOT NULL CHECK (length(trim(summary)) > 0),
  created_by uuid REFERENCES verify_identities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, project_id, id),
  FOREIGN KEY (workspace_id, project_id, requirement_id)
    REFERENCES verify_requirements(workspace_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, project_id, version_id)
    REFERENCES verify_versions(workspace_id, project_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS verify_validations_project_created_idx
  ON verify_validations(workspace_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS verify_validations_version_status_idx
  ON verify_validations(workspace_id, project_id, version_id, status);

CREATE TABLE IF NOT EXISTS verify_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  project_id uuid NOT NULL,
  validation_id uuid NOT NULL,
  title varchar(200) NOT NULL CHECK (length(trim(title)) > 0),
  evidence_url text NOT NULL CHECK (length(trim(evidence_url)) > 0),
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES verify_identities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (workspace_id, project_id, validation_id)
    REFERENCES verify_validations(workspace_id, project_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS verify_evidence_validation_created_idx
  ON verify_evidence(workspace_id, project_id, validation_id, created_at);

CREATE TABLE IF NOT EXISTS verify_test_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  project_id uuid NOT NULL,
  requirement_id uuid NOT NULL,
  initiated_by uuid REFERENCES verify_identities(id) ON DELETE SET NULL,
  test_key varchar(80) NOT NULL CHECK (test_key = 'local-page-smoke'),
  status varchar(16) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'passed', 'failed', 'cancelled')),
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message varchar(1000),
  cancel_requested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  UNIQUE (workspace_id, project_id, id),
  FOREIGN KEY (workspace_id, project_id, requirement_id)
    REFERENCES verify_requirements(workspace_id, project_id, id) ON DELETE CASCADE
);
ALTER TABLE verify_test_executions
  DROP CONSTRAINT IF EXISTS verify_test_executions_test_key_check;
ALTER TABLE verify_test_executions
  DROP CONSTRAINT IF EXISTS verify_test_executions_test_key_supported_check;
ALTER TABLE verify_test_executions
  ADD CONSTRAINT verify_test_executions_test_key_supported_check
  CHECK (test_key IN ('local-page-smoke', 'local-lighthouse-audit', 'local-axe-audit'));
CREATE INDEX IF NOT EXISTS verify_test_executions_queue_idx
  ON verify_test_executions(created_at)
  WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS verify_test_executions_project_created_idx
  ON verify_test_executions(workspace_id, project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS verify_execution_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  project_id uuid NOT NULL,
  execution_id uuid NOT NULL,
  media_type varchar(80) NOT NULL CHECK (media_type = 'image/png'),
  byte_length integer NOT NULL CHECK (byte_length > 0),
  sha256 char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (workspace_id, project_id, execution_id)
    REFERENCES verify_test_executions(workspace_id, project_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS verify_execution_evidence_execution_idx
  ON verify_execution_evidence(workspace_id, project_id, execution_id);

CREATE TABLE IF NOT EXISTS verify_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES verify_workspaces(id) ON DELETE CASCADE,
  project_id uuid,
  requirement_id uuid,
  version_id uuid,
  actor_identity_id uuid REFERENCES verify_identities(id) ON DELETE SET NULL,
  action varchar(80) NOT NULL CHECK (length(trim(action)) > 0),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (requirement_id IS NULL OR project_id IS NOT NULL),
  CHECK (version_id IS NULL OR project_id IS NOT NULL),
  FOREIGN KEY (workspace_id, project_id)
    REFERENCES verify_projects(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, project_id, requirement_id)
    REFERENCES verify_requirements(workspace_id, project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, project_id, version_id)
    REFERENCES verify_versions(workspace_id, project_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS verify_change_history_workspace_created_idx
  ON verify_change_history(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS verify_change_history_project_created_idx
  ON verify_change_history(workspace_id, project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS verify_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL CHECK (length(trim(name)) >= 2),
  email varchar(320) NOT NULL,
  company_or_project varchar(160) NOT NULL CHECK (length(trim(company_or_project)) >= 2),
  interest varchar(1200) NOT NULL CHECK (length(trim(interest)) BETWEEN 20 AND 1200),
  status varchar(16) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approving', 'approved', 'rejected')),
  invitation_id uuid REFERENCES verify_invitations(id) ON DELETE SET NULL,
  reviewed_by_admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verify_access_requests_status_created_idx
  ON verify_access_requests(status, created_at ASC);
CREATE INDEX IF NOT EXISTS verify_access_requests_email_created_idx
  ON verify_access_requests(lower(email), created_at DESC);

COMMIT;
