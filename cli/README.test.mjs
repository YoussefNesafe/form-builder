import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const README_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "README.md");

describe("cli README quick-start config", () => {
  const readme = fs.readFileSync(README_PATH, "utf8");

  it("scaffolds the starter config with defineForm", () => {
    expect(readme).toContain("const config = defineForm({");
  });

  it("imports defineForm from @/form-builder", () => {
    expect(readme).toMatch(/import \{[^}]*defineForm[^}]*\} from ["']@\/form-builder["']/);
  });
});
