// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { registerBuiltInFields } from "@/form-builder";
import { SECTIONS as installationSections, TOC_ITEMS as installationToc } from "./installation/sections";
import { SECTIONS as yourFirstFormSections, TOC_ITEMS as yourFirstFormToc } from "./your-first-form/sections";
import { SECTIONS as conditionsSections, TOC_ITEMS as conditionsToc } from "./conditions/sections";
import { SECTIONS as wizardsSections, TOC_ITEMS as wizardsToc } from "./wizards/sections";
import {
  SECTIONS as serverValidationSections,
  TOC_ITEMS as serverValidationToc,
} from "./server-validation/sections";
import { SECTIONS as fieldTypesSections, TOC_ITEMS as fieldTypesToc } from "./field-types/sections";

registerBuiltInFields();
afterEach(cleanup);

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
  { name: "server-validation", SECTIONS: serverValidationSections, TOC_ITEMS: serverValidationToc },
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
