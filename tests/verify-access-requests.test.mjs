import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { setQueryImplementation } from "../server/db.js";
import { createVerifyAccessRequestsRouter } from "../server/routes/verify-access-requests.js";
import { createVerifyAdminRouter } from "../server/routes/verify-admin.js";
import { createVerifyAuthRouter } from "../server/routes/verify-auth.js";
import {
  createVerifyAccessRequest,
  listVerifyAccessRequests,
  reviewVerifyAccessRequest,
} from "../server/services/verify-access-requests.js";
import { requestVerifyAccessCode } from "../server/services/verify-auth.js";

const requestId = "11111111-1111-4111-8111-111111111111";
const invitationId = "22222222-2222-4222-8222-222222222222";
const admin = { id: "33333333-3333-4333-8333-333333333333", role: "admin" };

function makeStore() {
  const state = { request: null, queries: [], audits: [], otpSent: false };
  const execute = async (sql, values = []) => {
    state.queries.push({ sql, values });
    if (sql.includes("INSERT INTO verify_access_requests")) {
      state.request = {
        id: requestId,
        name: values[0],
        email: values[1],
        companyOrProject: values[2],
        interest: values[3],
        status: "pending",
        invitationId: null,
        createdAt: new Date().toISOString(),
      };
      return { rows: [] };
    }
    if (sql.includes("SELECT id, name, email, company_or_project")) {
      const request = state.request;
      return {
        rows: request && (!values[0] || request.status === values[0])
          ? [{
            id: request.id,
            name: request.name,
            email: request.email,
            companyOrProject: request.companyOrProject,
            interest: request.interest,
            status: request.status,
            invitationId: request.invitationId,
            createdAt: request.createdAt,
          }]
          : [],
      };
    }
    if (sql.includes("UPDATE verify_access_requests") && sql.includes("SET status = 'rejected'")) {
      if (state.request?.id !== values[0] || state.request.status !== "pending") return { rows: [] };
      state.request.status = "rejected";
      return { rows: [{ id: requestId }] };
    }
    if (sql.includes("UPDATE verify_access_requests") && sql.includes("SET status = 'approving'")) {
      if (state.request?.id !== values[0] || state.request.status !== "pending") return { rows: [] };
      state.request.status = "approving";
      return {
        rows: [{
          id: requestId,
          name: state.request.name,
          email: state.request.email,
          companyOrProject: state.request.companyOrProject,
          status: "approving",
        }],
      };
    }
    if (sql.includes("UPDATE verify_access_requests") && sql.includes("SET status = 'approved'")) {
      state.request.status = "approved";
      state.request.invitationId = values[1];
      return { rows: [] };
    }
    if (sql.includes("UPDATE verify_access_requests") && sql.includes("SET status = 'pending'")) {
      state.request.status = "pending";
      return { rows: [] };
    }
    if (sql.includes("SELECT id FROM verify_access_requests")) {
      return state.request?.id === values[0] ? { rows: [{ id: requestId }] } : { rows: [] };
    }
    if (sql.includes("INSERT INTO audit_logs")) {
      state.audits.push(values);
      return { rows: [] };
    }
    if (sql.includes("SELECT id, email, max_attempts, code_request_count")) {
      return { rows: [] };
    }
    throw new Error(`Unexpected query: ${sql}`);
  };
  setQueryImplementation(execute);
  return state;
}

function validRequest(overrides = {}) {
  return {
    name: "Pessoa de Teste",
    email: "INTERESSADO@example.test",
    companyOrProject: "Projeto Alpha",
    interest: "Quero organizar requisitos e acompanhar entregas do projeto.",
    ...overrides,
  };
}

async function withServer(app, run) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function makeApp({ authorizeAdmin, issueInvitation } = {}) {
  const app = express();
  app.use(express.json());
  app.use("/api/verify/access-requests", createVerifyAccessRequestsRouter());
  app.use(
    "/api/admin/verify",
    createVerifyAdminRouter({
      authorizeAdmin: authorizeAdmin || ((request, _response, next) => {
        request.admin = admin;
        next();
      }),
      issueInvitation,
    }),
  );
  app.use("/api/verify/auth", createVerifyAuthRouter({
    requestVerifyAccessCode: async (input) => requestVerifyAccessCode(input, {
      emailDeliveryAvailable: () => true,
      sendCode: async () => {},
    }),
    resolveVerifySession: async () => null,
    revokeVerifySession: async () => {},
    verifyVerifyAccessCode: async () => assert.fail("No OTP was submitted."),
  }));
  app.use((error, _request, response, _next) => {
    response.status(500).json({ error: error.message });
  });
  return app;
}

afterEach(() => setQueryImplementation(undefined));

test("public request endpoint validates, persists pending interest, and returns a generic acknowledgement", async () => {
  const state = makeStore();
  const app = makeApp();
  await withServer(app, async (origin) => {
    const response = await fetch(`${origin}/api/verify/access-requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validRequest()),
    });
    assert.equal(response.status, 202);
    assert.match((await response.json()).message, /depende de aprovação/);
  });
  assert.deepEqual(state.request, {
    id: requestId,
    name: "Pessoa de Teste",
    email: "interessado@example.test",
    companyOrProject: "Projeto Alpha",
    interest: "Quero organizar requisitos e acompanhar entregas do projeto.",
    status: "pending",
    invitationId: null,
    createdAt: state.request.createdAt,
  });
});

test("invalid public requests are rejected and honeypot submissions are not persisted", async () => {
  const state = makeStore();
  const app = makeApp();
  await withServer(app, async (origin) => {
    const invalid = await fetch(`${origin}/api/verify/access-requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validRequest({ interest: "curto" })),
    });
    assert.equal(invalid.status, 400);
    const honeypot = await fetch(`${origin}/api/verify/access-requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validRequest({ website: "spam" })),
    });
    assert.equal(honeypot.status, 202);
  });
  assert.equal(state.request, null);
});

test("administrative access-request listing is protected and returns persisted records", async () => {
  const state = makeStore();
  await createVerifyAccessRequest(validRequest());
  let authorized = false;
  const app = makeApp({
    authorizeAdmin: (request, response, next) => {
      if (request.headers.authorization !== "Bearer test-admin") {
        return response.status(401).json({ error: "Sessão administrativa obrigatória." });
      }
      authorized = true;
      request.admin = admin;
      next();
    },
  });
  await withServer(app, async (origin) => {
    const denied = await fetch(`${origin}/api/admin/verify/access-requests`);
    assert.equal(denied.status, 401);
    const allowed = await fetch(`${origin}/api/admin/verify/access-requests`, {
      headers: { authorization: "Bearer test-admin" },
    });
    assert.equal(allowed.status, 200);
    const payload = await allowed.json();
    assert.equal(payload.items[0].status, "pending");
    assert.equal(payload.items[0].email, "interessado@example.test");
  });
  assert.equal(authorized, true);
  assert.equal(state.request.status, "pending");
});

test("admin approval invokes the invitation service and records approved status only after it succeeds", async () => {
  const state = makeStore();
  await createVerifyAccessRequest(validRequest());
  let invite;
  const result = await reviewVerifyAccessRequest(
    requestId,
    "approved",
    admin,
    {
      sendInvitation: async (input, invitedBy) => {
        invite = { input, invitedBy };
        return { id: invitationId };
      },
    },
  );
  assert.deepEqual(invite, {
    input: {
      email: "interessado@example.test",
      workspaceName: "Projeto Alpha",
      role: "owner",
    },
    invitedBy: admin,
  });
  assert.deepEqual(result, { id: requestId, status: "approved", invitationId });
  assert.equal(state.request.status, "approved");
  assert.equal(state.request.invitationId, invitationId);
  assert.equal(state.audits[0][1], "APPROVE_VERIFY_ACCESS_REQUEST");
});

test("rejection is audited and cannot be changed through an invalid decision", async () => {
  const state = makeStore();
  await createVerifyAccessRequest(validRequest());
  await assert.rejects(
    reviewVerifyAccessRequest(requestId, "pending", admin),
    (error) => error.code === "INVALID_ACCESS_REQUEST_DECISION",
  );
  const result = await reviewVerifyAccessRequest(requestId, "rejected", admin);
  assert.deepEqual(result, { id: requestId, status: "rejected" });
  assert.equal(state.request.status, "rejected");
  assert.equal(state.audits[0][1], "REJECT_VERIFY_ACCESS_REQUEST");
});

test("failed invitation delivery leaves the request pending and retryable", async () => {
  const state = makeStore();
  await createVerifyAccessRequest(validRequest());
  await assert.rejects(
    reviewVerifyAccessRequest(requestId, "approved", admin, {
      sendInvitation: async () => {
        throw new Error("Invitation delivery unavailable.");
      },
    }),
    /Invitation delivery unavailable/,
  );
  assert.equal(state.request.status, "pending");
  assert.equal(state.request.invitationId, null);
});

test("requesting Beta access creates neither OTP challenge nor private session", async () => {
  const state = makeStore();
  await createVerifyAccessRequest(validRequest());
  const result = await requestVerifyAccessCode({ email: validRequest().email }, {
    emailDeliveryAvailable: () => true,
    sendCode: async () => {
      state.otpSent = true;
    },
  });
  assert.match(result.message, /Se o e-mail estiver cadastrado/);
  assert.equal(state.otpSent, false);
  assert.equal(state.queries.some(({ sql }) => sql.includes("INSERT INTO verify_access_codes")), false);
  assert.equal(state.queries.some(({ sql }) => sql.includes("INSERT INTO verify_sessions")), false);

  const app = makeApp();
  await withServer(app, async (origin) => {
    const response = await fetch(`${origin}/api/verify/auth/session`);
    assert.equal(response.status, 401);
  });
});
