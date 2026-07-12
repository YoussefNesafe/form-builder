export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

/** Tab order + default match shadcn/ui's own docs (github.com/shadcn-ui/ui, apps/v4/hooks/use-config.ts — `atomWithStorage` default `packageManager: "pnpm"`). */
export const PACKAGE_MANAGERS: readonly PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

export const DEFAULT_PACKAGE_MANAGER: PackageManager = "pnpm";

export type CommandKind = "execute" | "install";

export type CommandVariants = Record<PackageManager, string>;

/**
 * Per-package-manager prefix for each command kind, ported verbatim from
 * shadcn/ui's own command-tab transformer — read directly from source
 * (rendered docs pages proved unreliable to scrape; see CommandBlock.tsx's
 * caller-facing rationale) at:
 *   https://github.com/shadcn-ui/ui/blob/43f64065b7f45b79d6edbfd19cbde092e38181b5/apps/v4/lib/highlight-code.ts
 * (commit 43f64065b7f45b79d6edbfd19cbde092e38181b5, "main" as of 2026-07-12).
 * Its shiki `code()` transformer derives
 * `__npm__`/`__yarn__`/`__pnpm__`/`__bun__` from one raw npm-form command
 * string via these same string substitutions:
 *   raw.startsWith("npx")          -> yarn: "yarn dlx", pnpm: "pnpm dlx", bun: "bunx --bun"
 *   raw.startsWith("npm install")  -> yarn: "yarn add",  pnpm: "pnpm add", bun: "bun add"
 * Two non-obvious forms this pins: npm's runner stays plain `npx` (there is
 * no `npm dlx` — confirmed absent from npm's own CLI docs), and bun's runner
 * is `bunx --bun` (forces bun's resolver), not plain `bunx`. Note also that
 * `yarn dlx` is Yarn Berry syntax only (Yarn Classic/v1 has no `dlx` and
 * errors on it) — a deliberate match with shadcn, which makes the same
 * Berry assumption.
 */
const COMMAND_PREFIXES: Record<CommandKind, CommandVariants> = {
  execute: {
    pnpm: "pnpm dlx",
    npm: "npx",
    yarn: "yarn dlx",
    bun: "bunx --bun",
  },
  install: {
    pnpm: "pnpm add",
    npm: "npm install",
    yarn: "yarn add",
    bun: "bun add",
  },
};

/**
 * Derives all 4 package-manager command variants from ONE canonical
 * argument string, so the tabs can never drift out of sync with each other —
 * change `args` once and every PM variant updates together. `args` may be a
 * multi-line backslash-continued string; it's appended verbatim after each
 * PM's prefix.
 */
export function deriveCommand(kind: CommandKind, args: string): CommandVariants {
  const prefixes = COMMAND_PREFIXES[kind];
  return {
    pnpm: `${prefixes.pnpm} ${args}`,
    npm: `${prefixes.npm} ${args}`,
    yarn: `${prefixes.yarn} ${args}`,
    bun: `${prefixes.bun} ${args}`,
  };
}
