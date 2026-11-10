import type { Project, Requirement, Result } from "@/domain/verify/data";
import { states } from "@/domain/verify/data";
import type { VerifyProfile, VerifySession } from "@/domain/verify/models";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isResult(value: unknown): value is Result {
  return states.some((state) => state === value);
}

function isRequirement(value: unknown): value is Requirement {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.objective === "string" &&
    typeof value.description === "string" &&
    typeof value.criterion === "string" &&
    typeof value.method === "string" &&
    typeof value.module === "string" &&
    typeof value.implemented === "boolean" &&
    Array.isArray(value.results) &&
    value.results.every(isResult) &&
    typeof value.evidence === "string" &&
    typeof value.note === "string"
  );
}

function isProject(value: unknown): value is Project {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.url === "string" &&
    typeof value.owner === "string" &&
    typeof value.market === "string" &&
    typeof value.segment === "string" &&
    typeof value.audience === "string" &&
    isStringArray(value.types) &&
    typeof value.flows === "string" &&
    typeof value.procedures === "string" &&
    typeof value.objectives === "string" &&
    isStringArray(value.modules) &&
    (value.customModules === undefined ||
      (Array.isArray(value.customModules) &&
        value.customModules.every(isStringArray))) &&
    Array.isArray(value.requirements) &&
    value.requirements.every(isRequirement)
  );
}

function readStoredValue<T>(
  key: string,
  isExpectedValue: (value: unknown) => value is T,
): T | null {
  if (typeof window === "undefined") {
    throw new Error("Verify local storage is only available in the browser.");
  }
  const raw = window.localStorage.getItem(key);
  if (raw === null) return null;

  const value: unknown = JSON.parse(raw);
  if (!isExpectedValue(value)) {
    throw new Error(`Stored Verify data for "${key}" has an invalid shape.`);
  }
  return value;
}

function writeStoredValue(key: string, value: unknown) {
  if (typeof window === "undefined") {
    throw new Error("Verify local storage is only available in the browser.");
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readVerifyProjects() {
  const isProjectList = (value: unknown): value is Project[] =>
    Array.isArray(value) && value.every(isProject);
  return readStoredValue("rrv-verify-projects", isProjectList);
}

export function readVerifySessions() {
  const isSessionList = (value: unknown): value is VerifySession[] =>
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.project === "string" &&
        typeof item.version === "string" &&
        typeof item.count === "number" &&
        typeof item.mode === "string" &&
        typeof item.date === "string",
    );
  return readStoredValue("rrv-verify-sessions", isSessionList);
}

export function readVerifyProfile() {
  const isProfile = (value: unknown): value is VerifyProfile =>
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.workspace === "string";
  return readStoredValue("rrv-verify-profile", isProfile);
}

export function saveVerifyProjects(projects: Project[]) {
  writeStoredValue("rrv-verify-projects", projects);
}

export function saveVerifySessions(sessions: VerifySession[]) {
  writeStoredValue("rrv-verify-sessions", sessions);
}

export function saveVerifyProfile(profile: VerifyProfile) {
  writeStoredValue("rrv-verify-profile", profile);
}

export function removeVerifySessions() {
  if (typeof window === "undefined") {
    throw new Error("Verify local storage is only available in the browser.");
  }
  window.localStorage.removeItem("rrv-verify-sessions");
}
