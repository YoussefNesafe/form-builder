import { describe, expect, it } from "vitest";
import { BUILT_IN_FIELD_TYPES } from "@/form-builder";
import { fieldTypes } from "./en/fieldTypes";
// Crossing the components/builder -> locales boundary is normally one-way
// (builder consumes the dictionary, not the other way round — see
// locales/en/fieldTypes.ts). This import is TEST-ONLY. As of slice 5 the
// builder switched its add-field menu, field-list rows, and prop-editor
// header over to this dictionary for labels, so a fieldTypes.ts label ===
// FIELD_META.label parity pin would now be circular (both would trivially
// agree since only fieldTypes.ts carries labels). Instead this pins the
// *shape* of that handoff: FIELD_META no longer carries a `label` field at
// all, so a label can't silently sneak back in as a second source of truth.
import { FIELD_META } from "@/components/builder/model/fieldMeta";

describe("locales/en/fieldTypes completeness", () => {
  for (const type of BUILT_IN_FIELD_TYPES) {
    it(`${type}: has a non-empty label and description`, () => {
      const entry = fieldTypes[type];
      expect(entry).toBeDefined();
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
    });

    it(`${type}: FIELD_META carries no label (fieldTypes.ts is the sole source)`, () => {
      expect(FIELD_META[type]).not.toHaveProperty("label");
    });
  }
});
