// Pins the per-PM command mapping ported from shadcn/ui's own transformer
// (see command.ts's COMMAND_PREFIXES doc comment) — a wrong prefix here would
// silently ship an incorrect copy-pasteable command to every CommandBlock.
import { describe, expect, it } from "vitest";
import { DEFAULT_PACKAGE_MANAGER, PACKAGE_MANAGERS, deriveCommand, type PackageManager } from "./command";

describe("deriveCommand", () => {
  it("derives the 4 runner-command ('execute') variants from one canonical args string", () => {
    expect(deriveCommand("execute", "shadcn@latest add button")).toEqual({
      pnpm: "pnpm dlx shadcn@latest add button",
      npm: "npx shadcn@latest add button",
      yarn: "yarn dlx shadcn@latest add button",
      bun: "bunx --bun shadcn@latest add button",
    });
  });

  it("derives the 4 dependency-install variants from one canonical args string", () => {
    expect(deriveCommand("install", "react-hook-form zod")).toEqual({
      pnpm: "pnpm add react-hook-form zod",
      npm: "npm install react-hook-form zod",
      yarn: "yarn add react-hook-form zod",
      bun: "bun add react-hook-form zod",
    });
  });

  it("does not use `npm dlx` for the npm runner form — npm has no dlx command", () => {
    const variants = deriveCommand("execute", "shadcn@latest init");
    expect(variants.npm).toBe("npx shadcn@latest init");
    expect(variants.npm).not.toContain("dlx");
  });

  it("uses `bunx --bun`, not plain `bunx`, for bun's runner form", () => {
    expect(deriveCommand("execute", "shadcn@latest add button").bun).toBe("bunx --bun shadcn@latest add button");
  });

  it("preserves multi-line backslash-continued args verbatim across every PM", () => {
    const args = "button calendar \\\n  checkbox dialog";
    const variants = deriveCommand("execute", args);
    for (const pm of PACKAGE_MANAGERS) {
      expect(variants[pm].endsWith(args)).toBe(true);
    }
  });

  it("PACKAGE_MANAGERS lists pnpm first with no duplicates, matching shadcn's own tab order", () => {
    expect(PACKAGE_MANAGERS).toEqual<PackageManager[]>(["pnpm", "npm", "yarn", "bun"]);
    expect(new Set(PACKAGE_MANAGERS).size).toBe(PACKAGE_MANAGERS.length);
  });

  it("defaults to pnpm, matching shadcn's own default tab", () => {
    expect(DEFAULT_PACKAGE_MANAGER).toBe("pnpm");
    expect(PACKAGE_MANAGERS).toContain(DEFAULT_PACKAGE_MANAGER);
  });
});
