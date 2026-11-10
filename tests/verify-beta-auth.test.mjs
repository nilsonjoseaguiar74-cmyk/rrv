import test from "node:test";
import assert from "node:assert/strict";
import { config } from "../server/config.js";
import { setQueryImplementation } from "../server/db.js";
import {
  clearVerifySessionCookie,
  hashVerifyToken,
  issueVerifyInvitation,
  requestVerifyAccessCode,
  resolveVerifySession,
  revokeVerifySession,
  verifySessionCookie,
  verifyVerifyAccessCode,
} from "../server/services/verify-auth.js";
import { VerifyAuthError } from "../server/services/verify-auth-error.js";
import {
  requireVerifyIdentity,
  resolveVerifyIdentity,
} from "../server/middleware/verify-identity.js";
import {
  verifyAccessRequestLimiter,
  verifyInviteAdminLimiter,
  verifyInviteLimiter,
} from "../server/api-security.js";
import { isAllowedVerifyInvitationUrl } from "../server/services/verify-mailer.js";

const sessionToken = "B".repeat(43);
const identityId = "11111111-1111-4111-8111-111111111111";
const workspaceId = "22222222-2222-4222-8222-222222222222";
const invitationId = "33333333-3333-4333-8333-333333333333";
const sessionId = "44444444-4444-4444-8444-444444444444";
const previousSessionSecret = config.sessionSecret;
const previousProduction = config.production;
const previousAllowedOrigin = config.allowedOrigin;
config.sessionSecret = "verify-beta-test-secret-with-at-least-32-bytes";

function makeStore({
  invitation = null,
  session = null,
  memberships = [{ workspaceId, workspaceName: "Workspace privado", role: "owner" }],
} = {}) {
  const state = {
    invitation: invitation && { ...invitation },
    accessCode: null,
    session: session && { ...session },
    memberships,
    identity: { id: identityId, email: "person@example.com", name: "Pessoa" },
    member: null,
    histories: [],
    queries: [],
  };
  const query = async (sql, values = []) => {
    state.queries.push({ sql, values });
    if (sql.includes("SELECT id, email, max_attempts, code_request_count")) {
      const current = state.invitation;
      if (
        !current ||
        current.email.toLowerCase() !== values[0] ||
        current.consumedAt ||
        current.revokedAt ||
        new Date(current.expiresAt).getTime() <= Date.now()
      ) {
        return { rows: [] };
      }
      return {
        rows: [{
          id: current.id,
          email: current.email,
          max_attempts: current.maxAttempts,
          code_request_count: current.codeRequestCount,
          code_request_window_started_at: current.codeRequestWindowStartedAt,
        }],
      };
    }
    if (sql.includes("UPDATE verify_access_codes") && sql.includes("SET revoked_at = now()")) {
      if (state.accessCode && !state.accessCode.consumedAt) {
        state.accessCode.revokedAt = new Date();
      }
      return { rows: [] };
    }
    if (sql.includes("INSERT INTO verify_access_codes")) {
      state.accessCode = {
        id: values[0],
        invitationId: values[1],
        codeHash: values[2],
        maxAttempts: values[3],
        expiresAt: values[4],
        attempts: 0,
        consumedAt: null,
        revokedAt: null,
      };
      return { rows: [] };
    }
    if (sql.includes("UPDATE verify_invitations") && sql.includes("code_request_count = $2")) {
      state.invitation.codeRequestCount = values[1];
      state.invitation.codeRequestWindowStartedAt = values[2];
      return { rows: [] };
    }
    if (sql.includes("FROM verify_access_codes AS access_code")) {
      const codeChallenge = state.accessCode;
      const invite = state.invitation;
      if (!codeChallenge || !invite || invite.email.toLowerCase() !== values[0]) {
        return { rows: [] };
      }
      return {
        rows: [{
          challenge_id: codeChallenge.id,
          code_hash: codeChallenge.codeHash,
          attempts: codeChallenge.attempts,
          max_attempts: codeChallenge.maxAttempts,
          code_expires_at: codeChallenge.expiresAt,
          code_consumed_at: codeChallenge.consumedAt,
          code_revoked_at: codeChallenge.revokedAt,
          invitation_id: invite.id,
          workspace_id: invite.workspaceId,
          email: invite.email,
          role: invite.role,
          expires_at: invite.expiresAt,
          consumed_at: invite.consumedAt,
          revoked_at: invite.revokedAt,
        }],
      };
    }
    if (sql.includes("SET attempts = attempts + 1")) {
      state.accessCode.attempts += 1;
      if (state.accessCode.attempts >= state.accessCode.maxAttempts) {
        state.accessCode.revokedAt = new Date();
      }
      return { rows: [] };
    }
    if (sql.includes("INSERT INTO verify_identities")) {
      state.identity = {
        id: identityId,
        email: values[2],
        name: values[3],
      };
      return { rows: [state.identity] };
    }
    if (sql.includes("INSERT INTO verify_workspace_members")) {
      state.member = { workspaceId: values[0], identityId: values[1], role: values[2] };
      return { rows: [] };
    }
    if (sql.includes("UPDATE verify_access_codes SET consumed_at = now()")) {
      state.accessCode.consumedAt = new Date();
      return { rows: [] };
    }
    if (sql.includes("UPDATE verify_invitations SET consumed_at = now()")) {
      state.invitation.consumedAt = new Date();
      return { rows: [] };
    }
    if (sql.includes("INSERT INTO verify_sessions")) {
      state.session = {
        id: sessionId,
        identityId: values[0],
        tokenHash: values[1],
        expiresAt: values[2],
        revokedAt: null,
      };
      return { rows: [] };
    }
    if (sql.includes("INSERT INTO verify_change_history")) {
      state.histories.push({ sql, values });
      return { rows: [] };
    }
    if (sql.includes("UPDATE verify_access_codes SET revoked_at = now()")) {
      if (state.accessCode?.id === values[0]) state.accessCode.revokedAt = new Date();
      return { rows: [] };
    }
    if (sql.includes("FROM verify_sessions AS session")) {
      const current = state.session;
      if (
        !current ||
        current.tokenHash !== values[0] ||
        current.revokedAt ||
        new Date(current.expiresAt).getTime() <= Date.now()
      ) {
        return { rows: [] };
      }
      return {
        rows: [{
          id: identityId,
          email: state.identity.email,
          name: state.identity.name,
          session_id: current.id,
        }],
      };
    }
    if (sql.includes("UPDATE verify_sessions SET last_used_at = now()")) {
      return { rows: [] };
    }
    if (sql.includes("FROM verify_workspace_members AS member")) {
      return { rows: state.memberships };
    }
    if (sql.includes("UPDATE verify_sessions SET revoked_at = now()")) {
      if (state.session?.tokenHash === values[0]) state.session.revokedAt = new Date();
      return { rows: [] };
    }
    throw new Error(`Unexpected test query: ${sql}`);
  };
  setQueryImplementation(query);
  return state;
}

function makeInvitation(overrides = {}) {
  return {
    id: invitationId,
    workspaceId,
    email: "person@example.com",
    role: "owner",
    maxAttempts: 5,
    codeRequestCount: 0,
    codeRequestWindowStartedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    revokedAt: null,
    ...overrides,
  };
}

function requestWithCookie(token) {
  return { headers: { cookie: `rrv_verify_session=${token}` } };
}

function responseDouble() {
  return {
    statusCode: 200,
    payload: undefined,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
}

async function requestCode(email = "person@example.com") {
  let delivered;
  const result = await requestVerifyAccessCode(
    { email },
    {
      emailDeliveryAvailable: () => true,
      sendCode: async (message) => {
        delivered = message;
      },
    },
  );
  return { result, delivered };
}

test.afterEach(() => {
  setQueryImplementation(undefined);
  config.sessionSecret = previousSessionSecret;
  config.sessionSecret = "verify-beta-test-secret-with-at-least-32-bytes";
  config.production = previousProduction;
  config.allowedOrigin = previousAllowedOrigin;
});

test("valid six-digit code is hashed, consumed once and provisions only its invited workspace", async () => {
  const state = makeStore({ invitation: makeInvitation() });
  const { result: requestResult, delivered } = await requestCode("PERSON@example.com");
  assert.match(delivered.code, /^\d{6}$/);
  assert.equal(delivered.to, "person@example.com");
  assert.notEqual(state.accessCode.codeHash, delivered.code);
  assert.equal(requestResult.message.includes(delivered.code), false);
  assert.equal(JSON.stringify(requestResult).includes(delivered.code), false);
  assert.equal(state.session, null, "requesting a code must not create a session");

  const session = await verifyVerifyAccessCode({
    email: "PERSON@example.com",
    code: delivered.code,
    name: "Pessoa Convidada",
  });
  assert.equal(session.identity.id, identityId);
  assert.equal(session.workspaceId, workspaceId);
  assert.notEqual(session.token, delivered.code);
  assert.equal(state.invitation.consumedAt instanceof Date, true);
  assert.equal(state.accessCode.consumedAt instanceof Date, true);
  assert.deepEqual(state.member, { workspaceId, identityId, role: "owner" });
  assert.equal(state.histories.length, 1);
  await assert.rejects(
    verifyVerifyAccessCode({ email: "person@example.com", code: delivered.code, name: "Pessoa" }),
    (error) => error instanceof VerifyAuthError && error.code === "ACCESS_CODE_INVALID",
  );
});

test("expired invitations and codes are rejected without creating sessions", async () => {
  const expiredInvitationState = makeStore({
    invitation: makeInvitation({ expiresAt: new Date(Date.now() - 1) }),
  });
  let sentForExpiredInvitation = false;
  const unavailableInviteResponse = await requestVerifyAccessCode(
    { email: "person@example.com" },
    {
      emailDeliveryAvailable: () => true,
      sendCode: async () => {
        sentForExpiredInvitation = true;
      },
    },
  );
  assert.match(unavailableInviteResponse.message, /Se o e-mail estiver cadastrado/);
  assert.equal(sentForExpiredInvitation, false);
  assert.equal(expiredInvitationState.accessCode, null);

  const state = makeStore({ invitation: makeInvitation() });
  const { delivered } = await requestCode();
  state.accessCode.expiresAt = new Date(Date.now() - 1);
  await assert.rejects(
    verifyVerifyAccessCode({ email: "person@example.com", code: delivered.code, name: "Pessoa" }),
    (error) => error.code === "ACCESS_CODE_INVALID",
  );
  assert.equal(state.session, null);
});

test("wrong codes count toward the attempt limit and invalidate the challenge", async () => {
  const state = makeStore({
    invitation: makeInvitation({ maxAttempts: 2 }),
  });
  const { delivered } = await requestCode();
  for (let attempts = 1; attempts <= 2; attempts += 1) {
    await assert.rejects(
      verifyVerifyAccessCode({ email: "person@example.com", code: "000000", name: "Pessoa" }),
      (error) => error.code === "ACCESS_CODE_INVALID",
    );
    assert.equal(state.accessCode.attempts, attempts);
  }
  await assert.rejects(
    verifyVerifyAccessCode({ email: "person@example.com", code: delivered.code, name: "Pessoa" }),
    (error) => error.code === "ACCESS_CODE_INVALID",
  );
  assert.equal(state.session, null);
  assert.equal(state.member, null);
});

test("access-code requests use a generic response and do not reveal unknown email addresses", async () => {
  makeStore({ invitation: makeInvitation() });
  const { result: invited, delivered } = await requestCode();
  assert.match(invited.message, /Se o e-mail estiver cadastrado/);
  assert.equal(Boolean(delivered), true);

  makeStore();
  let sent = false;
  const unknown = await requestVerifyAccessCode(
    { email: "unknown@example.com" },
    {
      emailDeliveryAvailable: () => true,
      sendCode: async () => {
        sent = true;
      },
    },
  );
  assert.deepEqual(unknown, invited);
  assert.equal(sent, false);
});

test("access-code requests are capped per invitation as well as by client IP", async () => {
  const state = makeStore({ invitation: makeInvitation() });
  let deliveries = 0;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await requestVerifyAccessCode(
      { email: "person@example.com" },
      {
        emailDeliveryAvailable: () => true,
        sendCode: async () => {
          deliveries += 1;
        },
      },
    );
  }
  assert.equal(deliveries, 5);
  assert.equal(state.invitation.codeRequestCount, 5);
});

test("identity confirmation rejects caller-supplied workspace and role fields", async () => {
  makeStore({ invitation: makeInvitation() });
  await assert.rejects(
    verifyVerifyAccessCode({
      email: "person@example.com",
      code: "123456",
      name: "Pessoa",
      workspaceId,
      role: "owner",
    }),
    (error) => error.code === "ACCESS_CODE_INVALID",
  );
});

test("access-code requests stay blocked until a real email provider is configured", async () => {
  setQueryImplementation(async () => assert.fail("blocked delivery must not query the database"));
  await assert.rejects(
    requestVerifyAccessCode(
      { email: "person@example.com" },
      { emailDeliveryAvailable: () => false },
    ),
    (error) => error.status === 503 && error.code === "VERIFY_EMAIL_UNAVAILABLE",
  );
});

test("invitation issuance remains blocked until a real email provider is configured", async () => {
  setQueryImplementation(async () => assert.fail("blocked delivery must not write database records"));
  await assert.rejects(
    issueVerifyInvitation(
      { email: "person@example.com", workspaceName: "Beta workspace" },
      { id: "55555555-5555-4555-8555-555555555555", role: "admin" },
      {
        emailDeliveryAvailable: () => false,
        sendInvitation: async () => assert.fail("unavailable delivery must not send"),
      },
    ),
    (error) => error.status === 503 && error.code === "VERIFY_EMAIL_UNAVAILABLE",
  );
});

test("invitation links allow HTTPS and loopback HTTP only in development", () => {
  config.production = false;
  assert.equal(isAllowedVerifyInvitationUrl("https://verify.example.test/start/verify/access"), true);
  assert.equal(isAllowedVerifyInvitationUrl("http://localhost:3100/start/verify/access"), true);
  assert.equal(isAllowedVerifyInvitationUrl("http://192.0.2.1/start/verify/access"), false);
  config.production = true;
  assert.equal(isAllowedVerifyInvitationUrl("https://verify.example.test/start/verify/access"), true);
  assert.equal(isAllowedVerifyInvitationUrl("http://localhost:3100/start/verify/access"), false);
});

test("invitation origin must be safe before any workspace or invitation is written", async () => {
  config.production = true;
  config.allowedOrigin = "http://localhost:3100";
  setQueryImplementation(async () => assert.fail("invalid origin must not write records"));
  await assert.rejects(
    issueVerifyInvitation(
      { email: "person@example.com", workspaceName: "Beta workspace" },
      { id: "55555555-5555-4555-8555-555555555555", role: "admin" },
      { emailDeliveryAvailable: () => true },
    ),
    (error) => error.status === 503 && error.code === "VERIFY_PUBLIC_URL_REQUIRED",
  );
});

test("valid session resolves identity and workspace memberships", async () => {
  const state = makeStore({
    session: {
      id: sessionId,
      identityId,
      tokenHash: hashVerifyToken(sessionToken),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    },
  });
  const session = await resolveVerifySession(requestWithCookie(sessionToken));
  assert.deepEqual(session.identity, {
    id: identityId,
    email: "person@example.com",
    name: "Pessoa",
    active: true,
  });
  assert.equal(session.workspaces[0].workspaceId, workspaceId);
  assert.equal(state.queries.some(({ sql }) => sql.includes("last_used_at")), true);
});

test("expired and revoked sessions are rejected", async () => {
  makeStore({
    session: {
      id: sessionId,
      identityId,
      tokenHash: hashVerifyToken(sessionToken),
      expiresAt: new Date(Date.now() - 1),
      revokedAt: null,
    },
  });
  assert.equal(await resolveVerifySession(requestWithCookie(sessionToken)), null);

  makeStore({
    session: {
      id: sessionId,
      identityId,
      tokenHash: hashVerifyToken(sessionToken),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    },
  });
  assert.equal(await resolveVerifySession(requestWithCookie(sessionToken)), null);
});

test("logout revokes the hashed session and emits an expired HttpOnly cookie", async () => {
  const state = makeStore({
    session: {
      id: sessionId,
      identityId,
      tokenHash: hashVerifyToken(sessionToken),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    },
  });
  await revokeVerifySession(requestWithCookie(sessionToken));
  assert.equal(state.session.revokedAt instanceof Date, true);
  const expiredCookie = clearVerifySessionCookie();
  assert.match(expiredCookie, /HttpOnly/);
  assert.match(expiredCookie, /Max-Age=0/);
  assert.match(verifySessionCookie(sessionToken, new Date(Date.now() + 60_000)), /SameSite=Strict/);
});

test("unauthenticated and forged administrative identities cannot reach Verify", async () => {
  setQueryImplementation(async () => assert.fail("no session cookie should query the database"));
  const request = {
    headers: {
      cookie: "rrv_admin_session=admin-secret",
      "x-verify-identity": identityId,
      "x-verify-email": "person@example.com",
    },
    admin: { id: identityId, role: "viewer" },
  };
  await new Promise((resolve, reject) => {
    resolveVerifyIdentity(request, responseDouble(), (error) => error ? reject(error) : resolve());
  });
  const response = responseDouble();
  let continued = false;
  requireVerifyIdentity(request, response, () => {
    continued = true;
  });
  assert.equal(response.statusCode, 401);
  assert.equal(continued, false);
  assert.equal(request.verifyIdentity, null);
});

test("access-code and invitation issuance are rate-limited per client IP", () => {
  for (const [limiter, scope, limit] of [
    [verifyAccessRequestLimiter, "access-request", 3],
    [verifyInviteLimiter, "access-code", 5],
    [verifyInviteAdminLimiter, "issue", 10],
  ]) {
    let allowed = 0;
    let blockedResponse;
    for (let attempt = 0; attempt < limit + 1; attempt += 1) {
      const response = responseDouble();
      limiter(
        { ip: `verify-beta-${scope}-test` },
        response,
        () => {
          allowed += 1;
        },
      );
      if (attempt === limit) blockedResponse = response;
    }
    assert.equal(allowed, limit);
    assert.equal(blockedResponse.statusCode, 429);
    assert.ok(blockedResponse.headers["Retry-After"]);
  }
});
