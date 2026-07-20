export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export const PACKAGE_MANAGERS: readonly PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

export const DEFAULT_PACKAGE_MANAGER: PackageManager = "pnpm";

export type CommandKind = "execute" | "install";

export type CommandVariants = Record<PackageManager, string>;

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

export function deriveCommand(kind: CommandKind, args: string): CommandVariants {
  const prefixes = COMMAND_PREFIXES[kind];
  return {
    pnpm: `${prefixes.pnpm} ${args}`,
    npm: `${prefixes.npm} ${args}`,
    yarn: `${prefixes.yarn} ${args}`,
    bun: `${prefixes.bun} ${args}`,
  };
}
