import test from "node:test";
import assert from "node:assert/strict";
import {
  sendVerifyAccessCode,
  sendVerifyInvitation,
} from "../server/services/verify-mailer.js";

test("Verify email delivery sends invitation and access-code messages through a mocked Resend endpoint", async () => {
  const previousApiKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.VERIFY_EMAIL_FROM;
  const previousFetch = globalThis.fetch;
  const requests = [];
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.VERIFY_EMAIL_FROM = "RRV Verify <verify@example.test>";
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    return new Response(JSON.stringify({ id: `email-${requests.length}` }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    assert.equal(await sendVerifyInvitation({
      to: "person@example.test",
      workspaceName: "Projeto <Alpha>",
      invitationUrl: "https://verify.example.test/start/verify/access",
      expiresAt: "2026-11-11T00:00:00.000Z",
    }), true);
    assert.equal(await sendVerifyAccessCode({
      to: "person@example.test",
      code: "123456",
    }), true);

    assert.equal(requests.length, 2);
    for (const { url, options } of requests) {
      assert.equal(url, "https://api.resend.com/emails");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer re_test_key");
      const payload = JSON.parse(options.body);
      assert.deepEqual(payload.to, ["person@example.test"]);
      assert.equal(payload.from, "RRV Verify <verify@example.test>");
      assert.ok(payload.subject);
      assert.ok(payload.text);
      assert.ok(payload.html);
    }

    const invitation = JSON.parse(requests[0].options.body);
    assert.match(invitation.html, /Projeto &lt;Alpha&gt;/);
    const accessCode = JSON.parse(requests[1].options.body);
    assert.match(accessCode.text, /123456/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
    if (previousFrom === undefined) delete process.env.VERIFY_EMAIL_FROM;
    else process.env.VERIFY_EMAIL_FROM = previousFrom;
  }
});
