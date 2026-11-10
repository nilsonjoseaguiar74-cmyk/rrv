import { query, transaction } from "../db.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const READ_ROLES = new Set(["owner", "admin", "editor", "viewer"]);
const WRITE_ROLES = new Set(["owner", "admin", "editor"]);

export class VerifyError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = "VerifyError";
    this.status = status;
    this.code = code;
  }
}

export function requireUuid(value, field) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new VerifyError(400, `${field} inválido.`, "INVALID_ID");
  }
  return value;
}

export function validateProjectInput(input, { partial = false } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VerifyError(400, "Corpo da solicitação inválido.", "INVALID_BODY");
  }
  const allowed = new Set(["name", "description", "referenceUrl"]);
  const fields = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key)) {
      throw new VerifyError(400, `Campo não permitido: ${key}.`, "UNKNOWN_FIELD");
    }
    if (typeof value !== "string") {
      throw new VerifyError(400, `Campo inválido: ${key}.`, "INVALID_FIELD");
    }
    const trimmed = value.trim();
    const maxLength = key === "description" ? 10000 : key === "referenceUrl" ? 2048 : 200;
    if (trimmed.length > maxLength || (key === "name" && !trimmed)) {
      throw new VerifyError(400, `Campo inválido: ${key}.`, "INVALID_FIELD");
    }
    if (key === "referenceUrl" && trimmed) {
      let url;
      try {
        url = new URL(trimmed);
      } catch {
        throw new VerifyError(400, "URL de referência inválida.", "INVALID_URL");
      }
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new VerifyError(400, "URL de referência inválida.", "INVALID_URL");
      }
    }
    fields[key] = trimmed;
  }
  if (!partial && !Object.hasOwn(fields, "name")) {
    throw new VerifyError(400, "Campo obrigatório: name.", "REQUIRED_FIELD");
  }
  if (partial && Object.keys(fields).length === 0) {
    throw new VerifyError(400, "Informe ao menos um campo para atualizar.", "EMPTY_UPDATE");
  }
  return fields;
}

export function validateRequirementInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VerifyError(400, "Corpo da solicitação inválido.", "INVALID_BODY");
  }
  const allowed = new Set([
    "objective",
    "description",
    "acceptanceCriterion",
    "verificationMethod",
    "moduleKey",
    "sortOrder",
  ]);
  const fields = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key)) {
      throw new VerifyError(400, `Campo não permitido: ${key}.`, "UNKNOWN_FIELD");
    }
    if (["objective", "description", "acceptanceCriterion", "verificationMethod", "moduleKey"].includes(key)) {
      if (typeof value !== "string") {
        throw new VerifyError(400, `Campo inválido: ${key}.`, "INVALID_FIELD");
      }
      const trimmed = value.trim();
      const max =
        key === "description" || key === "acceptanceCriterion"
          ? 10000
          : key === "verificationMethod"
            ? 160
            : key === "moduleKey"
              ? 80
              : 500;
      if (trimmed.length > max || (["objective", "description", "acceptanceCriterion"].includes(key) && !trimmed)) {
        throw new VerifyError(400, `Campo inválido: ${key}.`, "INVALID_FIELD");
      }
      fields[key] = trimmed;
    } else {
      if (!Number.isSafeInteger(value) || value < 0) {
        throw new VerifyError(400, "sortOrder deve ser um inteiro não negativo.", "INVALID_FIELD");
      }
      fields[key] = value;
    }
  }
  for (const key of ["objective", "description", "acceptanceCriterion"]) {
    if (!Object.hasOwn(fields, key)) {
      throw new VerifyError(400, `Campo obrigatório: ${key}.`, "REQUIRED_FIELD");
    }
  }
  return fields;
}

export function validateVersionInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VerifyError(400, "Corpo da solicitação inválido.", "INVALID_BODY");
  }
  const allowed = new Set(["label", "summary", "deliveredAt"]);
  const fields = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key)) {
      throw new VerifyError(400, `Campo não permitido: ${key}.`, "UNKNOWN_FIELD");
    }
    if (typeof value !== "string") {
      throw new VerifyError(400, `Campo inválido: ${key}.`, "INVALID_FIELD");
    }
    const trimmed = value.trim();
    if (trimmed.length > (key === "summary" ? 10000 : 80)) {
      throw new VerifyError(400, `Campo inválido: ${key}.`, "INVALID_FIELD");
    }
    if (key === "deliveredAt" && trimmed) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
      const parsed = match ? new Date(`${trimmed}T00:00:00.000Z`) : null;
      if (
        !match ||
        parsed?.toISOString().slice(0, 10) !== trimmed
      ) {
        throw new VerifyError(400, "deliveredAt deve ser uma data válida no formato YYYY-MM-DD.", "INVALID_DATE");
      }
    }
    fields[key] = trimmed;
  }
  if (!fields.label) {
    throw new VerifyError(400, "Campo obrigatório: label.", "REQUIRED_FIELD");
  }
  return fields;
}

export function validateValidationInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VerifyError(400, "Corpo da solicitação inválido.", "INVALID_BODY");
  }
  const allowed = new Set(["requirementId", "versionId", "status", "summary", "evidence"]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      throw new VerifyError(400, `Campo não permitido: ${key}.`, "UNKNOWN_FIELD");
    }
  }
  const requirementId = requireUuid(input.requirementId, "requirementId");
  const versionId = input.versionId ? requireUuid(input.versionId, "versionId") : null;
  if (!["passed", "failed", "blocked"].includes(input.status)) {
    throw new VerifyError(400, "Status de validação inválido.", "INVALID_STATUS");
  }
  if (typeof input.summary !== "string" || !input.summary.trim() || input.summary.trim().length > 10000) {
    throw new VerifyError(400, "Informe um resumo de até 10.000 caracteres.", "INVALID_SUMMARY");
  }
  let evidence;
  if (input.evidence !== undefined && input.evidence !== null) {
    const value = input.evidence;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new VerifyError(400, "Evidência inválida.", "INVALID_EVIDENCE");
    }
    for (const key of Object.keys(value)) {
      if (!["title", "url", "notes"].includes(key)) {
        throw new VerifyError(400, `Campo de evidência não permitido: ${key}.`, "UNKNOWN_FIELD");
      }
    }
    if (
      typeof value.title !== "string" ||
      !value.title.trim() ||
      value.title.trim().length > 200 ||
      typeof value.url !== "string" ||
      value.url.trim().length > 2048 ||
      typeof value.notes !== "string" ||
      value.notes.trim().length > 10000
    ) {
      throw new VerifyError(400, "Título, URL ou descrição da evidência inválidos.", "INVALID_EVIDENCE");
    }
    let url;
    try {
      url = new URL(value.url.trim());
    } catch {
      throw new VerifyError(400, "A evidência deve apontar para uma URL HTTPS válida.", "INVALID_EVIDENCE_URL");
    }
    if (url.protocol !== "https:") {
      throw new VerifyError(400, "A evidência deve apontar para uma URL HTTPS válida.", "INVALID_EVIDENCE_URL");
    }
    evidence = { title: value.title.trim(), url: url.toString(), notes: value.notes.trim() };
  }
  return {
    requirementId,
    versionId,
    status: input.status,
    summary: input.summary.trim(),
    evidence,
  };
}

export async function authorizeWorkspace(queryFn, identity, workspaceId, action = "read") {
  requireUuid(workspaceId, "workspaceId");
  if (
    !identity ||
    typeof identity.id !== "string" ||
    !UUID_PATTERN.test(identity.id) ||
    identity.active !== true
  ) {
    throw new VerifyError(401, "Autenticação do Verify obrigatória.", "VERIFY_IDENTITY_REQUIRED");
  }
  const result = await queryFn(
    `SELECT member.role
     FROM verify_workspace_members AS member
     JOIN verify_identities AS identity
       ON identity.id = member.identity_id AND identity.is_active = true
     WHERE member.workspace_id = $1 AND member.identity_id = $2`,
    [workspaceId, identity.id],
  );
  const role = result.rows[0]?.role;
  const allowed = action === "read" ? READ_ROLES : WRITE_ROLES;
  if (!allowed.has(role)) {
    throw new VerifyError(403, "Sem permissão para este workspace.", "WORKSPACE_FORBIDDEN");
  }
  return role;
}

export async function authorizeProject(queryFn, identity, workspaceId, projectId, action = "read") {
  await authorizeWorkspace(queryFn, identity, workspaceId, action);
  requireUuid(projectId, "projectId");
  const result = await queryFn(
    `SELECT id FROM verify_projects WHERE id = $1 AND workspace_id = $2`,
    [projectId, workspaceId],
  );
  if (!result.rows[0]) {
    throw new VerifyError(404, "Projeto não encontrado.", "PROJECT_NOT_FOUND");
  }
}

function assertWorkspaceAccess(identity, workspaceId, action) {
  return authorizeWorkspace(query, identity, workspaceId, action);
}

function assertProjectAccess(identity, workspaceId, projectId, action) {
  return authorizeProject(query, identity, workspaceId, projectId, action);
}

async function writeHistory(client, identity, workspaceId, projectId, action, details = {}) {
  await client.query(
    `INSERT INTO verify_change_history
       (workspace_id, project_id, actor_identity_id, action, details)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [workspaceId, projectId, identity.id, action, JSON.stringify(details)],
  );
}

export async function listProjects(identity, workspaceId) {
  await assertWorkspaceAccess(identity, workspaceId, "read");
  const result = await query(
    `SELECT id, workspace_id AS "workspaceId", name, description,
            reference_url AS "referenceUrl", created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM verify_projects WHERE workspace_id = $1 ORDER BY updated_at DESC`,
    [workspaceId],
  );
  return result.rows;
}

export async function createProject(identity, workspaceId, input) {
  await assertWorkspaceAccess(identity, workspaceId, "write");
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VerifyError(400, "Corpo da solicitação inválido.", "INVALID_BODY");
  }
  const { requirements = [], ...projectInput } = input;
  if (!Array.isArray(requirements) || requirements.length > 100) {
    throw new VerifyError(400, "A lista de requisitos é inválida.", "INVALID_REQUIREMENTS");
  }
  const fields = validateProjectInput(projectInput);
  const requirementFields = requirements.map(validateRequirementInput);
  return transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO verify_projects
         (workspace_id, name, description, reference_url, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $5)
       RETURNING id, workspace_id AS "workspaceId", name, description,
                 reference_url AS "referenceUrl", created_at AS "createdAt",
                 updated_at AS "updatedAt"`,
      [workspaceId, fields.name, fields.description || "", fields.referenceUrl || "", identity.id],
    );
    const project = result.rows[0];
    await writeHistory(client, identity, workspaceId, project.id, "project.created", { name: project.name });
    for (const [index, requirement] of requirementFields.entries()) {
      await insertRequirement(client, identity, workspaceId, project.id, {
        ...requirement,
        sortOrder: requirement.sortOrder ?? index,
      });
    }
    return project;
  });
}

export async function getProject(identity, workspaceId, projectId) {
  await assertProjectAccess(identity, workspaceId, projectId, "read");
  const result = await query(
    `SELECT id, workspace_id AS "workspaceId", name, description,
            reference_url AS "referenceUrl", created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM verify_projects WHERE id = $1 AND workspace_id = $2`,
    [projectId, workspaceId],
  );
  return result.rows[0] || null;
}

export async function updateProject(identity, workspaceId, projectId, input) {
  await assertProjectAccess(identity, workspaceId, projectId, "write");
  const fields = validateProjectInput(input, { partial: true });
  const columns = { name: "name", description: "description", referenceUrl: "reference_url" };
  const entries = Object.entries(fields);
  return transaction(async (client) => {
    const values = entries.map(([, value]) => value);
    values.push(identity.id, projectId, workspaceId);
    const result = await client.query(
      `UPDATE verify_projects
       SET ${entries.map(([key], index) => `${columns[key]} = $${index + 1}`).join(", ")},
           updated_by = $${entries.length + 1}, updated_at = now()
       WHERE id = $${entries.length + 2} AND workspace_id = $${entries.length + 3}
       RETURNING id, workspace_id AS "workspaceId", name, description,
                 reference_url AS "referenceUrl", created_at AS "createdAt",
                 updated_at AS "updatedAt"`,
      values,
    );
    const project = result.rows[0];
    if (!project) throw new VerifyError(404, "Projeto não encontrado.", "PROJECT_NOT_FOUND");
    await writeHistory(client, identity, workspaceId, projectId, "project.updated", { fields: entries.map(([key]) => key) });
    return project;
  });
}

export async function listRequirements(identity, workspaceId, projectId) {
  await assertProjectAccess(identity, workspaceId, projectId, "read");
  const result = await query(
    `SELECT id, workspace_id AS "workspaceId", project_id AS "projectId",
            objective, description, acceptance_criterion AS "acceptanceCriterion",
            verification_method AS "verificationMethod", module_key AS "moduleKey",
            sort_order AS "sortOrder", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM verify_requirements
     WHERE workspace_id = $1 AND project_id = $2
     ORDER BY sort_order, created_at`,
    [workspaceId, projectId],
  );
  return result.rows;
}

export async function createRequirement(identity, workspaceId, projectId, input) {
  await assertProjectAccess(identity, workspaceId, projectId, "write");
  const fields = validateRequirementInput(input);
  return transaction(async (client) => {
    return insertRequirement(client, identity, workspaceId, projectId, fields);
  });
}

async function insertRequirement(client, identity, workspaceId, projectId, fields) {
  const result = await client.query(
    `INSERT INTO verify_requirements
       (workspace_id, project_id, objective, description, acceptance_criterion,
        verification_method, module_key, sort_order, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, workspace_id AS "workspaceId", project_id AS "projectId",
               objective, description, acceptance_criterion AS "acceptanceCriterion",
               verification_method AS "verificationMethod", module_key AS "moduleKey",
               sort_order AS "sortOrder", created_at AS "createdAt", updated_at AS "updatedAt"`,
    [
      workspaceId, projectId, fields.objective, fields.description,
      fields.acceptanceCriterion, fields.verificationMethod || "",
      fields.moduleKey || "", fields.sortOrder || 0, identity.id,
    ],
  );
  const requirement = result.rows[0];
  await writeHistory(client, identity, workspaceId, projectId, "requirement.created", {
    requirementId: requirement.id,
  });
  return requirement;
}

export async function listVersions(identity, workspaceId, projectId) {
  await assertProjectAccess(identity, workspaceId, projectId, "read");
  const result = await query(
    `SELECT id, workspace_id AS "workspaceId", project_id AS "projectId",
            label, summary, delivered_at AS "deliveredAt", created_at AS "createdAt"
     FROM verify_versions
     WHERE workspace_id = $1 AND project_id = $2
     ORDER BY created_at DESC`,
    [workspaceId, projectId],
  );
  return result.rows;
}

export async function createVersion(identity, workspaceId, projectId, input) {
  await assertProjectAccess(identity, workspaceId, projectId, "write");
  const fields = validateVersionInput(input);
  return transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO verify_versions
         (workspace_id, project_id, label, summary, delivered_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, workspace_id AS "workspaceId", project_id AS "projectId",
                 label, summary, delivered_at AS "deliveredAt", created_at AS "createdAt"`,
      [workspaceId, projectId, fields.label, fields.summary || "", fields.deliveredAt || null, identity.id],
    );
    const version = result.rows[0];
    await writeHistory(client, identity, workspaceId, projectId, "version.created", { versionId: version.id, label: version.label });
    return version;
  });
}

export async function listValidations(identity, workspaceId, projectId) {
  await assertProjectAccess(identity, workspaceId, projectId, "read");
  const result = await query(
    `SELECT validation.id, validation.workspace_id AS "workspaceId",
            validation.project_id AS "projectId", validation.requirement_id AS "requirementId",
            requirement.objective, requirement.description AS "requirementDescription",
            requirement.acceptance_criterion AS "acceptanceCriterion",
            validation.version_id AS "versionId", version.label AS "versionLabel",
            validation.status, validation.summary, validation.created_at AS "createdAt",
            COALESCE(evidence.items, '[]'::jsonb) AS evidence
     FROM verify_validations AS validation
     JOIN verify_requirements AS requirement
       ON requirement.workspace_id = validation.workspace_id
      AND requirement.project_id = validation.project_id
      AND requirement.id = validation.requirement_id
     LEFT JOIN verify_versions AS version
       ON version.workspace_id = validation.workspace_id
      AND version.project_id = validation.project_id
      AND version.id = validation.version_id
     LEFT JOIN LATERAL (
       SELECT jsonb_agg(jsonb_build_object(
         'id', item.id, 'title', item.title, 'url', item.evidence_url,
         'notes', item.notes, 'createdAt', item.created_at
       ) ORDER BY item.created_at) AS items
       FROM verify_evidence AS item
       WHERE item.workspace_id = validation.workspace_id
         AND item.project_id = validation.project_id
         AND item.validation_id = validation.id
     ) AS evidence ON true
     WHERE validation.workspace_id = $1 AND validation.project_id = $2
     ORDER BY validation.created_at DESC`,
    [workspaceId, projectId],
  );
  return result.rows;
}

export async function createValidation(identity, workspaceId, projectId, input) {
  await assertProjectAccess(identity, workspaceId, projectId, "write");
  const fields = validateValidationInput(input);
  return transaction(async (client) => {
    const requirement = await client.query(
      `SELECT id FROM verify_requirements
       WHERE id = $1 AND workspace_id = $2 AND project_id = $3`,
      [fields.requirementId, workspaceId, projectId],
    );
    if (!requirement.rows[0]) {
      throw new VerifyError(404, "Requisito não encontrado neste projeto.", "REQUIREMENT_NOT_FOUND");
    }
    if (fields.versionId) {
      const version = await client.query(
        `SELECT id FROM verify_versions
         WHERE id = $1 AND workspace_id = $2 AND project_id = $3`,
        [fields.versionId, workspaceId, projectId],
      );
      if (!version.rows[0]) {
        throw new VerifyError(404, "Versão não encontrada neste projeto.", "VERSION_NOT_FOUND");
      }
    }
    const inserted = await client.query(
      `INSERT INTO verify_validations
         (workspace_id, project_id, requirement_id, version_id, status, summary, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, workspace_id AS "workspaceId", project_id AS "projectId",
                 requirement_id AS "requirementId", version_id AS "versionId",
                 status, summary, created_at AS "createdAt"`,
      [
        workspaceId, projectId, fields.requirementId, fields.versionId,
        fields.status, fields.summary, identity.id,
      ],
    );
    const validation = inserted.rows[0];
    let evidence;
    if (fields.evidence) {
      const saved = await client.query(
        `INSERT INTO verify_evidence
           (workspace_id, project_id, validation_id, title, evidence_url, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title, evidence_url AS url, notes, created_at AS "createdAt"`,
        [
          workspaceId, projectId, validation.id, fields.evidence.title,
          fields.evidence.url, fields.evidence.notes, identity.id,
        ],
      );
      evidence = saved.rows[0];
    }
    await writeHistory(client, identity, workspaceId, projectId, "validation.created", {
      validationId: validation.id,
      requirementId: validation.requirementId,
      versionId: validation.versionId,
      status: validation.status,
    });
    if (evidence) {
      await writeHistory(client, identity, workspaceId, projectId, "evidence.created", {
        validationId: validation.id,
        evidenceId: evidence.id,
      });
    }
    return { ...validation, evidence: evidence ? [evidence] : [] };
  });
}

export async function listProjectHistory(identity, workspaceId, projectId) {
  await assertProjectAccess(identity, workspaceId, projectId, "read");
  const result = await query(
    `SELECT history.id, history.action, history.details,
            history.created_at AS "createdAt",
           identity.display_name AS "actorName"
     FROM verify_change_history AS history
     LEFT JOIN verify_identities AS identity ON identity.id = history.actor_identity_id
     WHERE history.workspace_id = $1 AND history.project_id = $2
     ORDER BY history.created_at DESC
     LIMIT 200`,
    [workspaceId, projectId],
  );
  return result.rows;
}
