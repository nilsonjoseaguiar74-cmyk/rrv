import test from "node:test";
import assert from "node:assert/strict";
import {
  authorizeProject,
  authorizeWorkspace,
  requireUuid,
  validateProjectInput,
  validateRequirementInput,
  validateVersionInput,
  VerifyError,
} from "../server/services/verify.js";
import { requireVerifyIdentity } from "../server/middleware/verify-identity.js";

const identity = { id: "11111111-1111-4111-8111-111111111111", active: true };
const workspaceId = "22222222-2222-4222-8222-222222222222";
const projectId = "33333333-3333-4333-8333-333333333333";

function responseDouble() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("unauthenticated requests are rejected and admin viewer is not reused", () => {
  const response = responseDouble();
  let continued = false;
  requireVerifyIdentity({ admin: { id: identity.id, role: "viewer" } }, response, () => {
    continued = true;
  });
  assert.equal(response.statusCode, 401);
  assert.equal(response.payload.code, "VERIFY_IDENTITY_REQUIRED");
  assert.equal(continued, false);
});

test("inactive or malformed Verify identities are rejected", () => {
  for (const verifyIdentity of [
    { id: identity.id, active: false },
    { id: identity.id },
    { id: "not-a-uuid", active: true },
  ]) {
    const response = responseDouble();
    requireVerifyIdentity({ verifyIdentity }, response, () => assert.fail("must reject"));
    assert.equal(response.statusCode, 401);
  }
});

test("workspace access is scoped to an explicit membership and role", async () => {
  const calls = [];
  const query = async (sql, values) => {
    calls.push({ sql, values });
    return { rows: [{ role: "editor" }] };
  };
  assert.equal(await authorizeWorkspace(query, identity, workspaceId, "write"), "editor");
  assert.deepEqual(calls[0].values, [workspaceId, identity.id]);
  assert.match(calls[0].sql, /member\.workspace_id = \$1 AND member\.identity_id = \$2/);
});

test("users without a workspace membership are denied", async () => {
  const query = async () => ({ rows: [] });
  await assert.rejects(
    authorizeWorkspace(query, identity, workspaceId, "read"),
    (error) => error instanceof VerifyError && error.status === 403,
  );
});

test("viewer can read but cannot change workspace data", async () => {
  const query = async () => ({ rows: [{ role: "viewer" }] });
  assert.equal(await authorizeWorkspace(query, identity, workspaceId, "read"), "viewer");
  await assert.rejects(
    authorizeWorkspace(query, identity, workspaceId, "write"),
    (error) => error instanceof VerifyError && error.status === 403,
  );
});

test("workspace denial prevents project lookup queries", async () => {
  let callCount = 0;
  const query = async () => {
    callCount += 1;
    return { rows: [] };
  };
  await assert.rejects(
    authorizeProject(query, identity, workspaceId, projectId),
    (error) => error instanceof VerifyError && error.status === 403,
  );
  assert.equal(callCount, 1, "project lookup must not run without workspace membership");
});

test("project lookup includes workspace scope after membership authorization", async () => {
  const calls = [];
  const query = async (sql, values) => {
    calls.push({ sql, values });
    return calls.length === 1 ? { rows: [{ role: "viewer" }] } : { rows: [{ id: projectId }] };
  };
  await authorizeProject(query, identity, workspaceId, projectId);
  assert.equal(calls.length, 2);
  assert.match(calls[1].sql, /id = \$1 AND workspace_id = \$2/);
  assert.deepEqual(calls[1].values, [projectId, workspaceId]);
});

test("project and requirement inputs enforce required fields and lengths", () => {
  assert.deepEqual(validateProjectInput({ name: " Projeto ", description: " Escopo " }), {
    name: "Projeto",
    description: "Escopo",
  });
  assert.throws(() => validateProjectInput({ name: " " }), VerifyError);
  assert.throws(() => validateProjectInput({ name: "x", extra: "unexpected" }), VerifyError);
  assert.throws(() => validateProjectInput({ name: "x", referenceUrl: "javascript:alert(1)" }), VerifyError);
  assert.throws(
    () => validateRequirementInput({ objective: "Objetivo", description: "Desc" }),
    (error) => error instanceof VerifyError && error.code === "REQUIRED_FIELD",
  );
  assert.deepEqual(
    validateRequirementInput({
      objective: " Objetivo ",
      description: " Descrição ",
      acceptanceCriterion: " Critério ",
    }),
    { objective: "Objetivo", description: "Descrição", acceptanceCriterion: "Critério" },
  );
});

test("version input and identifiers are validated", () => {
  assert.deepEqual(validateVersionInput({ label: " v1 ", deliveredAt: "2026-11-10" }), {
    label: "v1",
    deliveredAt: "2026-11-10",
  });
  assert.throws(() => validateVersionInput({ label: "v1", deliveredAt: "today" }), VerifyError);
  assert.equal(requireUuid(workspaceId, "workspaceId"), workspaceId);
  assert.throws(() => requireUuid("unknown", "workspaceId"), VerifyError);
});
