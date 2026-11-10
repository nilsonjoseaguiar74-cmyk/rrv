import crypto from "node:crypto";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { startLocalFixture } from "./local-fixture.js";

export const LOCAL_PAGE_SMOKE_TEST = "local-page-smoke";
export const LOCAL_PAGE_SMOKE_LABEL = "Página local controlada";
export const EXECUTION_TIMEOUT_MS = 120_000;

const evidenceDirectory = path.resolve(process.cwd(), ".verify-evidence");

export function getExecutionEvidencePath(evidenceId) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(evidenceId)) {
    throw new Error("Invalid evidence identifier.");
  }
  return path.join(evidenceDirectory, `${evidenceId}.png`);
}

export async function openControlledPage({ signal, viewport = { width: 1280, height: 800 } }) {
  if (signal.aborted) throw new DOMException("Execution cancelled.", "AbortError");
  const fixture = await startLocalFixture();
  let browser;
  let context;
  let closeBrowserOnAbort;
  try {
    browser = await chromium.launch({
      headless: true,
      timeout: 15_000,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-background-networking"],
    });
    closeBrowserOnAbort = () => {
      void browser?.close().catch(() => {});
    };
    signal.addEventListener("abort", closeBrowserOnAbort, { once: true });
    context = await browser.newContext({ viewport, serviceWorkers: "block" });
    await context.route("**/*", (route) => {
      const requestUrl = new URL(route.request().url());
      if (requestUrl.origin !== fixture.origin) return route.abort("blockedbyclient");
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(10_000);
    page.setDefaultTimeout(5_000);
    await page.goto(`${fixture.origin}/controlled`, { waitUntil: "domcontentloaded" });
    return {
      browser,
      context,
      page,
      fixture,
      close: async () => {
        signal.removeEventListener("abort", closeBrowserOnAbort);
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
        await fixture.close().catch(() => {});
      },
    };
  } catch (error) {
    if (closeBrowserOnAbort) signal.removeEventListener("abort", closeBrowserOnAbort);
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
    await fixture.close().catch(() => {});
    throw error;
  }
}

export async function captureExecutionEvidence(page) {
  await fs.mkdir(evidenceDirectory, { recursive: true, mode: 0o700 });
  await fs.chmod(evidenceDirectory, 0o700);
  const evidenceId = crypto.randomUUID();
  const evidencePath = getExecutionEvidencePath(evidenceId);
  try {
    await page.screenshot({ path: evidencePath, type: "png" });
    await fs.chmod(evidencePath, 0o600);
    const file = await fs.readFile(evidencePath);
    return {
      id: evidenceId,
      mediaType: "image/png",
      byteLength: file.length,
      sha256: crypto.createHash("sha256").update(file).digest("hex"),
    };
  } catch (error) {
    await fs.unlink(evidencePath).catch(() => {});
    throw error;
  }
}

export async function runLocalPageSmoke({ signal }) {
  const controlled = await openControlledPage({ signal });
  const { page } = controlled;
  const startedAt = Date.now();
  const assertions = [];
  try {
    const title = await page.title();
    assert.equal(title, "RRV Verify Controlled Fixture");
    assertions.push({ name: "page title matches controlled fixture", passed: true });
    const readinessText = await page.getByTestId("fixture-ready").innerText();
    assert.equal(readinessText, "Local fixture ready");
    assertions.push({ name: "fixture readiness text is visible", passed: true });
    if (signal.aborted) throw new DOMException("Execution cancelled.", "AbortError");
    const evidence = await captureExecutionEvidence(page);
    return {
      status: "passed",
      results: [{
        testKey: LOCAL_PAGE_SMOKE_TEST,
        label: LOCAL_PAGE_SMOKE_LABEL,
        browser: "Chromium",
        pageTitle: await page.title(),
        assertions,
        durationMs: Date.now() - startedAt,
      }],
      evidence,
    };
  } catch (error) {
    if (signal.aborted || error?.name === "AbortError") {
      throw new DOMException("Execution cancelled.", "AbortError");
    }
    const message = error?.name === "AssertionError"
      ? "Uma asserção da página local controlada falhou."
      : "Chromium não concluiu o teste local.";
    const evidence = controlled.browser.isConnected()
      ? await captureExecutionEvidence(page).catch(() => null)
      : null;
    return {
      status: "failed",
      results: [{
        testKey: LOCAL_PAGE_SMOKE_TEST,
        label: LOCAL_PAGE_SMOKE_LABEL,
        browser: "Chromium",
        assertions: [
          ...assertions,
          { name: "controlled page assertions", passed: false, message },
        ],
        durationMs: Date.now() - startedAt,
      }],
      evidence,
      errorMessage: message,
    };
  } finally {
    await controlled.close();
  }
}
