// @vitest-environment jsdom
//
// Replaces the old app/(site)/docs/toc.test.ts, which regex-scanned page
// source for `<DocsSection id="...">` to keep TOC_ITEMS and heading ids from
// drifting apart. That scan doesn't apply anymore: TOC_ITEMS is now DERIVED
// from each page's SECTIONS registry (`SECTIONS.map(({id,title}) => ...)`,
// see e.g. components/docs/conditions/sections.ts), and every section's `id`
// is the same binding passed to its own <DocsSection id> — one variable, two
// uses, so TOC/heading id drift is impossible by construction rather than
// something a test has to keep catching after the fact.
//
// What's still worth asserting, per page: ids are unique and non-empty, the
// TOC really is in SECTIONS order, and — the one thing "single-sourced by
// construction" doesn't fully rule out (a section could still hardcode a
// different id string into its own <DocsSection id="...">  instead of using
// the shared `id` binding) — that each Section, once rendered, actually
// produces a heading whose real DOM id matches its registry entry.
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { registerBuiltInFields } from "@/form-builder";
import { SECTIONS as installationSections, TOC_ITEMS as installationToc } from "./installation/sections";
import { SECTIONS as yourFirstFormSections, TOC_ITEMS as yourFirstFormToc } from "./your-first-form/sections";
import { SECTIONS as conditionsSections, TOC_ITEMS as conditionsToc } from "./conditions/sections";
import { SECTIONS as wizardsSections, TOC_ITEMS as wizardsToc } from "./wizards/sections";
import { SECTIONS as fieldTypesSections, TOC_ITEMS as fieldTypesToc } from "./field-types/sections";

registerBuiltInFields();
afterEach(cleanup);

// Some field primitives observe size; jsdom has no ResizeObserver.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver ?? (ResizeObserverStub as typeof ResizeObserver);

type SectionEntry = { id: string; title: string; Section: React.ComponentType };

const PAGES: { name: string; SECTIONS: SectionEntry[]; TOC_ITEMS: { id: string; title: string }[] }[] = [
  { name: "installation", SECTIONS: installationSections, TOC_ITEMS: installationToc },
  { name: "your-first-form", SECTIONS: yourFirstFormSections, TOC_ITEMS: yourFirstFormToc },
  { name: "conditions", SECTIONS: conditionsSections, TOC_ITEMS: conditionsToc },
  { name: "wizards", SECTIONS: wizardsSections, TOC_ITEMS: wizardsToc },
  { name: "field-types", SECTIONS: fieldTypesSections, TOC_ITEMS: fieldTypesToc },
];

describe("docs section registries", () => {
  for (const page of PAGES) {
    describe(page.name, () => {
      it("has unique, non-empty section ids", () => {
        const ids = page.SECTIONS.map((s) => s.id);
        for (const id of ids) {
          expect(id.length, `empty id in ${page.name}`).toBeGreaterThan(0);
        }
        expect(new Set(ids).size, `duplicate id in ${page.name}`).toBe(ids.length);
      });

      it("derives TOC_ITEMS from SECTIONS, in the same order", () => {
        expect(page.TOC_ITEMS).toEqual(page.SECTIONS.map(({ id, title }) => ({ id, title })));
      });

      for (const { id, title, Section } of page.SECTIONS) {
        it(`section "${id}" (${title}) renders a heading with matching id`, () => {
          const { container } = render(<Section />);
          const heading = container.querySelector(`[id="${id}"]`);
          expect(heading, `no element with id="${id}" rendered by ${page.name}'s "${title}" section`).not.toBeNull();
          expect(heading?.tagName).toBe("H2");
        });
      }
    });
  }
});

// field-types' per-type sections (FieldTypeSection.tsx, one per
// FIELD_TYPE_ORDER entry) are the runtime mapping logic in the docs
// (BUILT_IN_FIELD_TYPES × t.fieldTypes) — the "renders a heading with
// matching id" loop above already renders and asserts on every one of them,
// so a newly-registered type missing its locale entry still fails here.
