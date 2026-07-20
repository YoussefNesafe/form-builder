// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  clearDraft,
  draftConfigHash,
  draftStorageKey,
  hasDraft,
  loadDraft,
  sanitizeDraftValues,
  saveDraft,
} from "./autosave";
import type { AnyFieldConfig } from "./types";

afterEach(() => window.localStorage.clear());

const fields: AnyFieldConfig[] = [
  { type: "text", name: "name" },
  { type: "file", name: "cv" },
  { type: "signature", name: "sig" },
  { type: "password", name: "pass" },
  { type: "otp", name: "code", length: 6 },
  {
    type: "group",
    name: "team",
    fields: [
      { type: "text", name: "member" },
      { type: "file", name: "badge" },
    ],
  },
];

describe("draftConfigHash", () => {
  it("is stable for equal configs and differs when fields change", () => {
    expect(draftConfigHash(fields)).toBe(draftConfigHash([...fields]));
    expect(draftConfigHash(fields)).not.toBe(draftConfigHash([{ type: "text", name: "name" }]));
  });
});

describe("sanitizeDraftValues", () => {
  it("drops file values, signature by default, and files inside group rows", () => {
    const values = {
      name: "Ada",
      cv: new File(["x"], "cv.pdf"),
      sig: "data:image/png;base64,abc",
      team: [{ member: "Bob", badge: new File(["y"], "badge.png") }],
      custom: [new File(["z"], "sneaky.bin")],
    };
    expect(sanitizeDraftValues(fields, values)).toEqual({
      name: "Ada",
      team: [{ member: "Bob" }],
    });
  });

  it("keeps signatures when opted in", () => {
    const values = { sig: "data:image/png;base64,abc" };
    expect(sanitizeDraftValues(fields, values, true)).toEqual({ sig: "data:image/png;base64,abc" });
  });

  it("never persists password or otp values (credentials at rest)", () => {
    const values = { name: "Ada", pass: "hunter2", code: "123456" };
    expect(sanitizeDraftValues(fields, values, true)).toEqual({ name: "Ada" });
  });
});

describe("draft persistence", () => {
  it("round-trips values and step, keyed without the hash", () => {
    saveDraft("signup", "h1", { name: "Ada" }, 2);
    expect(window.localStorage.getItem(draftStorageKey("signup"))).toBeTruthy();
    expect(loadDraft("signup", "h1")).toEqual({ values: { name: "Ada" }, step: 2 });
    expect(hasDraft("signup")).toBe(true);
  });

  it("drops a draft written for a different fields config", () => {
    saveDraft("signup", "old-hash", { name: "Ada" });
    expect(loadDraft("signup", "new-hash")).toBeNull();
    expect(hasDraft("signup")).toBe(false);
  });

  it("survives corrupt payloads", () => {
    window.localStorage.setItem(draftStorageKey("signup"), "{not json");
    expect(loadDraft("signup", "h1")).toBeNull();
  });

  it("clearDraft removes the entry", () => {
    saveDraft("signup", "h1", { name: "Ada" });
    clearDraft("signup");
    expect(hasDraft("signup")).toBe(false);
  });
});
