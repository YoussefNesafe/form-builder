import { installFormBuilder } from "./install.mjs";

const HELP = `Usage:
  form-builder                  Install the entire form builder (engine + all fields + all primitives + theme)
  form-builder add <field...>   Install only the named fields, plus their transitive engine/primitive closure

Flags:
  --cwd <dir>     Target project directory (default: current directory)
  --no-install    Skip npm-installing leaf dependencies; print them instead
  --no-theme      Skip the theme/cssVars (breakpoints, --fb-space-*) injection step
  --force         Overwrite files/theme block that already exist (default: skip them, preserving edits)
  -h, --help      Show this help
`;

/** True if `value` looks like the NEXT flag rather than an argument for the current one (missing --cwd value, --cwd at the end of argv, etc.) */
function looksLikeFlag(value) {
  return value === undefined || value.startsWith("--");
}

export function parseArgs(argv) {
  const positional = [];
  let cwd = process.cwd();
  let install = true;
  let theme = true;
  let force = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cwd") {
      const value = argv[++i];
      if (looksLikeFlag(value)) throw new Error("form-builder: --cwd requires a directory argument");
      cwd = value;
    } else if (arg === "--no-install") {
      install = false;
    } else if (arg === "--no-theme") {
      theme = false;
    } else if (arg === "--force") {
      force = true;
    } else if (arg === "--help" || arg === "-h") {
      return { mode: "help" };
    } else if (arg.startsWith("--")) {
      throw new Error(`form-builder: unknown flag "${arg}"`);
    } else {
      positional.push(arg);
    }
  }

  if (positional[0] === "add") {
    return { mode: "add", fields: positional.slice(1), cwd, install, theme, force };
  }
  if (positional.length > 0) {
    throw new Error(`form-builder: unknown command "${positional[0]}" (did you mean "add"?)`);
  }
  return { mode: "all", cwd, install, theme, force };
}

export async function runCli(argv) {
  const args = parseArgs(argv);
  if (args.mode === "help") {
    console.log(HELP);
    return;
  }
  if (args.mode === "add" && args.fields.length === 0) {
    throw new Error('form-builder: "add" needs at least one field name, e.g. "form-builder add text email"');
  }
  const summary = await installFormBuilder(args);
  console.log(
    `form-builder: installed ${summary.itemNames.length} item(s), ${summary.fileCount} file(s) under ${summary.base}/form-builder/`,
  );
  if (summary.skipped.length > 0) {
    console.log(
      `form-builder: ${summary.skipped.length} file(s) already present, skipped (edits preserved) — use --force to overwrite:`,
    );
    for (const rel of summary.skipped) console.log(`  - ${rel}`);
  }
}
