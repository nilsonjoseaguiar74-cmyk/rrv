import test from "node:test";
import assert from "node:assert/strict";
import { interpretVerifyResults } from "../server/services/verify-analysis.js";

const results = [{
  testKey: "local-axe-audit",
  axe: {
    violationsCount: 1,
    passesCount: 12,
    incompleteCount: 2,
    violations: [{
      id: "button-name",
      impact: "serious",
      help: "Buttons must have discernible text",
      criteria: ["4.1.2"],
      nodes: [{ html: "<button>...</button>" }],
    }],
  },
}];

test("interprets actual audit measurements using only the local Ollama endpoint", async () => {
  let requestUrl;
  let requestBody;
  const analysis = {
    summary: "Uma violação de nome acessível foi detectada.",
  };
  const result = await interpretVerifyResults(results, {
    baseUrl: "http://127.0.0.1:11434",
    model: "qwen2.5:1.5b",
    fetchImpl: async (url, init) => {
      requestUrl = url;
      requestBody = JSON.parse(init.body);
      assert.equal(init.redirect, "error");
      return Response.json({ message: { content: JSON.stringify(analysis) } });
    },
  });
  assert.equal(requestUrl, "http://127.0.0.1:11434/api/chat");
  assert.equal(requestBody.model, "qwen2.5:1.5b");
  assert.equal(requestBody.stream, false);
  assert.equal(requestBody.options.temperature, 0.1);
  assert.match(requestBody.messages[1].content, /button-name/);
  assert.equal(result.status, "available");
  assert.equal(result.summary, analysis.summary);
});

test("refuses non-loopback Ollama endpoints without making a request", async () => {
  let called = false;
  const result = await interpretVerifyResults(results, {
    baseUrl: "http://ollama.example.test:11434",
    fetchImpl: async () => {
      called = true;
      throw new Error("must not make a network request");
    },
  });
  assert.equal(called, false);
  assert.equal(result.status, "unavailable");
});

test("keeps measured results usable when Ollama is unavailable or returns invalid output", async () => {
  const offline = await interpretVerifyResults(results, {
    fetchImpl: async () => {
      throw new Error("offline");
    },
  });
  assert.equal(offline.status, "unavailable");
  assert.match(offline.message, /resultados medidos foram preservados/);

  const invalid = await interpretVerifyResults(results, {
    fetchImpl: async () => Response.json({ message: { content: "not JSON" } }),
  });
  assert.equal(invalid.status, "unavailable");
});
