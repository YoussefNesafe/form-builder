import fs from "node:fs";
import path from "node:path";

/**
 * Install-time alias-rewrite pass. The repo source under `form-builder/**`
 * and `components/ui/**` stays alias-based (`@/components/ui/*`,
 * `@/lib/utils`) forever — that's the tested form these files ship in, and
 * this module never touches them. It only rewrites STAGED COPIES on their
 * way into a consumer's single `<base>/form-builder/` folder, so the result
 * is self-contained: zero `@/` aliases, portable regardless of the
 * consumer's own tsconfig paths or lack thereof.
 *
 * Both alias forms are always used as a quoted module specifier — never
 * inside a string built at runtime — in every file this rewrite touches
 * (verified against the current tree), so a literal quoted-string
 * replacement is safe and doesn't need import-statement parsing.
 */

const UI_ALIAS_RE = /(["'])@\/components\/ui\/([\w-]+)\1/g;
const LIB_UTILS_ALIAS_RE = /(["'])@\/lib\/utils\1/g;

/** Relative module specifier from `fromFileAbs` to `toModuleAbsNoExt` (no extension — matches this codebase's extensionless import style), forced to start with "." per the same convention shadcn's own local-file resolution requires. */
export function relativeSpecifier(fromFileAbs, toModuleAbsNoExt) {
  let rel = path.relative(path.dirname(fromFileAbs), toModuleAbsNoExt).split(path.sep).join("/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

/**
 * Rewrites every `@/components/ui/X` and `@/lib/utils` occurrence in
 * `content` to a path relative to `targetFileAbs`, pointed at
 * `<formBuilderTargetDir>/components/ui/X` and
 * `<formBuilderTargetDir>/internal/cn` respectively. One function handles
 * both the vendored primitives (where this produces a sibling `./X`, since
 * every primitive lands together in `form-builder/components/ui/`) and the
 * engine/field files (where it produces `../components/ui/X` or similar) —
 * the relative-path math is the same computation either way, just from a
 * different `targetFileAbs`.
 */
export function rewriteAliasImports(content, targetFileAbs, formBuilderTargetDir) {
  let rewritten = content.replace(UI_ALIAS_RE, (_match, quote, name) => {
    const modulePath = path.join(formBuilderTargetDir, "components", "ui", name);
    return `${quote}${relativeSpecifier(targetFileAbs, modulePath)}${quote}`;
  });
  rewritten = rewritten.replace(LIB_UTILS_ALIAS_RE, (_match, quote) => {
    const modulePath = path.join(formBuilderTargetDir, "internal", "cn");
    return `${quote}${relativeSpecifier(targetFileAbs, modulePath)}${quote}`;
  });
  return rewritten;
}

/**
 * The self-contained guarantee, enforced rather than assumed: rewriteAliasImports()
 * only knows how to rewrite `@/components/ui/*` and `@/lib/utils` — those
 * were the only two alias forms this tree used at the time this installer
 * was built. If a future file introduces a different `@/…` import (e.g.
 * `@/lib/formatDate`), rewriteAliasImports() would silently pass it through
 * unchanged, shipping a consumer folder with a broken import and no error
 * until the user's own build fails. This turns that into a loud, immediate
 * build-time error instead, naming the exact file and specifier so whoever
 * added the new alias knows to add a rewrite rule for it above.
 */
export function assertNoResidualAlias(content, fileLabel) {
  const match = content.match(/(["'])(@\/[^"']*)\1/);
  if (match) {
    throw new Error(
      `form-builder: unrewritten alias import "${match[2]}" remains in ${fileLabel} after the rewrite pass — add a rewrite rule for this alias in cli/src/rewrite.mjs (self-contained installs must have zero @/ imports).`,
    );
  }
}

/** Reads sourceAbs, rewrites its alias imports, verifies zero `@/` residue survived, and writes it to targetAbs (creating directories as needed). Returns the rewritten content for callers that want to inspect it. Throws (without writing anything) if a residual alias remains — see assertNoResidualAlias(). */
export function copyAndRewrite(sourceAbs, targetAbs, formBuilderTargetDir) {
  const content = fs.readFileSync(sourceAbs, "utf8");
  const rewritten = rewriteAliasImports(content, targetAbs, formBuilderTargetDir);
  assertNoResidualAlias(rewritten, path.relative(formBuilderTargetDir, targetAbs).split(path.sep).join("/"));
  fs.mkdirSync(path.dirname(targetAbs), { recursive: true });
  fs.writeFileSync(targetAbs, rewritten);
  return rewritten;
}
