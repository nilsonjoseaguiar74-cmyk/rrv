import { createRequire } from "node:module";
import { chromium } from "playwright";
import {
  captureExecutionEvidence,
  openControlledPage,
} from "./playwright-local.js";
import { startLocalFixture } from "./local-fixture.js";

const require = createRequire(import.meta.url);
const axeScriptPath = require.resolve("axe-core/axe.min.js");
const LIGHTHOUSE_TEST = "local-lighthouse-audit";
const AXE_TEST = "local-axe-audit";

export const QUALITY_AUDITS = {
  [LIGHTHOUSE_TEST]: {
    label: "Lighthouse · Performance, Acessibilidade, Boas práticas e SEO",
  },
  [AXE_TEST]: {
    label: "axe-core · Acessibilidade",
  },
};

const LIGHTHOUSE_CATEGORIES = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
];
const LIGHTHOUSE_METRIC_IDS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "speed-index",
  "total-blocking-time",
  "cumulative-layout-shift",
  "interactive",
];

function boundedText(value, maxLength = 500) {
  if (typeof value !== "string") return value;
  return value.slice(0, maxLength);
}

function summarizeAuditDetails(details) {
  if (!details || typeof details !== "object") return undefined;
  const allowedItemKeys = new Set([
    "label",
    "value",
    "node",
    "reason",
    "requestCount",
    "totalBytes",
    "wastedBytes",
    "overallSavingsMs",
    "overallSavingsBytes",
  ]);
  return {
    type: details.type,
    overallSavingsMs: details.overallSavingsMs,
    overallSavingsBytes: details.overallSavingsBytes,
    items: Array.isArray(details.items)
      ? details.items.slice(0, 5).map((item) =>
        Object.fromEntries(
          Object.entries(item)
            .filter(([key, value]) => allowedItemKeys.has(key) && ["string", "number", "boolean"].includes(typeof value))
            .map(([key, value]) => [key, boundedText(value, 300)]),
        ),
      )
      : undefined,
  };
}

function summarizeLighthouseReport(lhr) {
  const categories = Object.fromEntries(
    LIGHTHOUSE_CATEGORIES.map((id) => {
      const category = lhr.categories[id];
      return [id, category ? {
        title: boundedText(category.title, 120),
        score: category.score,
      } : null];
    }),
  );
  const auditIds = new Set(
    LIGHTHOUSE_CATEGORIES.flatMap((id) =>
      (lhr.categories[id]?.auditRefs || []).map((reference) => reference.id),
    ),
  );
  const audits = [...auditIds].flatMap((id) => {
    const audit = lhr.audits[id];
    if (!audit) return [];
    return [{
      id,
      title: boundedText(audit.title, 200),
      description: boundedText(audit.description, 1000),
      score: audit.score,
      scoreDisplayMode: audit.scoreDisplayMode,
      displayValue: boundedText(audit.displayValue, 200),
      numericValue: audit.numericValue,
      numericUnit: audit.numericUnit,
      errorMessage: boundedText(audit.errorMessage, 500),
      details: summarizeAuditDetails(audit.details),
    }];
  });
  return {
    version: lhr.lighthouseVersion,
    fetchTime: lhr.fetchTime,
    categories,
    metrics: LIGHTHOUSE_METRIC_IDS.flatMap((id) => {
      const audit = lhr.audits[id];
      if (!audit) return [];
      return [{
        id,
        title: boundedText(audit.title, 120),
        score: audit.score,
        numericValue: audit.numericValue,
        numericUnit: audit.numericUnit,
        displayValue: boundedText(audit.displayValue, 120),
      }];
    }),
    audits,
  };
}

async function runLighthouse({ signal }) {
  const fixture = await startLocalFixture();
  let chrome;
  const closeChromeOnAbort = () => {
    chrome?.kill();
  };
  signal.addEventListener("abort", closeChromeOnAbort, { once: true });
  const startedAt = Date.now();
  try {
    if (signal.aborted) throw new DOMException("Execution cancelled.", "AbortError");
    const [{ launch: launchChrome }, { default: lighthouse }] = await Promise.all([
      import("chrome-launcher"),
      import("lighthouse"),
    ]);
    chrome = await launchChrome({
      chromePath: chromium.executablePath(),
      port: 0,
      logLevel: "silent",
      chromeFlags: [
        "--headless",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-networking",
        "--disable-extensions",
        "--disable-sync",
        "--no-first-run",
        "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1",
      ],
    });
    if (signal.aborted) throw new DOMException("Execution cancelled.", "AbortError");
    const result = await lighthouse(`${fixture.origin}/controlled`, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: LIGHTHOUSE_CATEGORIES,
    });
    if (signal.aborted) throw new DOMException("Execution cancelled.", "AbortError");
    if (!result?.lhr || result.lhr.runtimeError) {
      throw new Error("Lighthouse did not return a usable report.");
    }
    const report = summarizeLighthouseReport(result.lhr);
    if (LIGHTHOUSE_CATEGORIES.some((category) => typeof report.categories[category]?.score !== "number")) {
      throw new Error("Lighthouse omitted a requested category.");
    }
    const screenshot = await openControlledPage({ signal });
    let evidence;
    try {
      evidence = await captureExecutionEvidence(screenshot.page);
    } finally {
      await screenshot.close();
    }
    return {
      status: "passed",
      results: [{
        testKey: LIGHTHOUSE_TEST,
        label: QUALITY_AUDITS[LIGHTHOUSE_TEST].label,
        browser: "Chromium",
        durationMs: Date.now() - startedAt,
        lighthouse: report,
      }],
      evidence,
    };
  } catch (error) {
    if (signal.aborted || error?.name === "AbortError") {
      throw new DOMException("Execution cancelled.", "AbortError");
    }
    return {
      status: "failed",
      results: [{
        testKey: LIGHTHOUSE_TEST,
        label: QUALITY_AUDITS[LIGHTHOUSE_TEST].label,
        browser: "Chromium",
        durationMs: Date.now() - startedAt,
        error: "Lighthouse não conseguiu concluir a análise local.",
      }],
      evidence: null,
      errorMessage: "Lighthouse não conseguiu concluir a análise local.",
    };
  } finally {
    signal.removeEventListener("abort", closeChromeOnAbort);
    chrome?.kill();
    await fixture.close().catch(() => {});
  }
}

async function runAxeAudit({ signal }) {
  const controlled = await openControlledPage({ signal });
  const startedAt = Date.now();
  try {
    await controlled.page.addScriptTag({ path: axeScriptPath });
    const axeResult = await controlled.page.evaluate(async () => {
      return window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
        },
      });
    });
    if (signal.aborted) throw new DOMException("Execution cancelled.", "AbortError");
    const violations = axeResult.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact || "unknown",
      help: boundedText(violation.help, 300),
      helpUrl: boundedText(violation.helpUrl, 500),
      tags: violation.tags,
      criteria: violation.tags.flatMap((tag) => {
        const match = /^wcag([0-9])([0-9])([0-9])$/.exec(tag);
        return match ? [`${match[1]}.${match[2]}.${match[3]}`] : [];
      }),
      nodes: violation.nodes.slice(0, 10).map((node) => ({
        target: node.target.slice(0, 10).map((selector) => boundedText(selector, 300)),
        html: boundedText(node.html, 500),
        failureSummary: boundedText(node.failureSummary, 1000),
      })),
    }));
    const evidence = await captureExecutionEvidence(controlled.page);
    return {
      status: "passed",
      results: [{
        testKey: AXE_TEST,
        label: QUALITY_AUDITS[AXE_TEST].label,
        browser: "Chromium",
        durationMs: Date.now() - startedAt,
        axe: {
          version: axeResult.testEngine.version,
          violationsCount: violations.length,
          passesCount: axeResult.passes.length,
          incompleteCount: axeResult.incomplete.length,
          inapplicableCount: axeResult.inapplicable.length,
          violations,
        },
      }],
      evidence,
    };
  } catch (error) {
    if (signal.aborted || error?.name === "AbortError") {
      throw new DOMException("Execution cancelled.", "AbortError");
    }
    return {
      status: "failed",
      results: [{
        testKey: AXE_TEST,
        label: QUALITY_AUDITS[AXE_TEST].label,
        browser: "Chromium",
        durationMs: Date.now() - startedAt,
        error: "axe-core não conseguiu concluir a análise local.",
      }],
      evidence: null,
      errorMessage: "axe-core não conseguiu concluir a análise local.",
    };
  } finally {
    await controlled.close();
  }
}

export async function runLocalQualityAudit(testKey, { signal }) {
  if (testKey === LIGHTHOUSE_TEST) return runLighthouse({ signal });
  if (testKey === AXE_TEST) return runAxeAudit({ signal });
  throw new Error("Unsupported local quality audit.");
}
