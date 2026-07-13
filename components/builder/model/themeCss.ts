/**
 * Generator for the engine's sizing-token stylesheet
 * (`form-builder/theme/tokens.css`). The builder's "Sizing CSS" export lets a
 * host regenerate that file in the unit of their choice; this module is the
 * pure, framework-free core behind it (unit-tested in `themeCss.test.ts`,
 * which also pins the `vw` output against the shipped `tokens.css`).
 *
 * The engine bakes every size as `var(--fb-space-N[-tier], <vw default>)`, so
 * this file is never required — it only lets a consumer RETHEME the scale.
 * See AGENTS.md "Portable-package sizing tokens".
 */

export type ThemeUnit = "vw" | "px" | "rem" | "em";

export type ThemeGenOptions = {
  unit: ThemeUnit;
  /** px per 1rem/em — only used for rem/em. */
  base?: number;
  /** Reference viewport widths (px) used to convert vw -> fixed units, per tier. */
  refMobile?: number;
  refTablet?: number;
  refDesktop?: number;
};

export const THEME_DEFAULTS = {
  base: 16,
  refMobile: 375,
  refTablet: 800,
  refDesktop: 1920,
} as const;

// The sizing scale: the union of steps the engine actually uses. Per tier the
// value is `step * VW_PER_STEP[tier]` in vw (mobile = base / no suffix).
// `tokens.css` is generated from this (vw mode), and `themeCss.test.ts` pins
// BOTH sides that must agree with it: the shipped `tokens.css` AND the ~324
// inline `var(--fb-space-N[-tier], <vw>)` fallbacks the engine actually renders
// from. Retuning a factor here without updating those fallbacks fails that test
// (they are the real render path — this module only mirrors them).
const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 18, 20, 24, 144] as const;

const TIERS = [
  { suffix: "", vwPerStep: 0.534, refKey: "refMobile" },
  { suffix: "-tablet", vwPerStep: 0.25, refKey: "refTablet" },
  { suffix: "-desktop", vwPerStep: 0.104, refKey: "refDesktop" },
] as const;

/** Trim floating-point noise and trailing zeros: 1.6019999 -> "1.602", 16 -> "16". */
function num(n: number): string {
  return parseFloat(n.toFixed(4)).toString();
}

/**
 * Render one token's value in the requested unit.
 * - vw: the fluid default, emitted verbatim.
 * - px/rem/em: FIXED — vw resolved at the tier's reference width, so a form
 *   themed in these units jumps between breakpoints instead of scaling within
 *   a band. px is rounded to whole pixels (the scale is designed on integers);
 *   rem/em divide by `base`.
 */
function value(vw: number, unit: ThemeUnit, ref: number, base: number): string {
  if (unit === "vw") return `${num(vw)}vw`;
  const px = Math.round((vw / 100) * ref);
  if (unit === "px") return `${px}px`;
  return `${num(px / base)}${unit}`;
}

function header(unit: ThemeUnit, o: Required<ThemeGenOptions>): string {
  const common = ` * form-builder sizing tokens (OPTIONAL override surface)
 * ---------------------------------------------------------------------------
 * The engine sizes every field through \`var(--fb-space-N[-tier], <default>)\`
 * references, so this file is NOT required — skip it and the built-in fallbacks
 * render the defaults unchanged. Import it (or copy any line into your own
 * :root) only to RETHEME the scale: three independent breakpoint tiers per step
 * (mobile = base / no suffix, -tablet >= 481px, -desktop >= 1025px).`;
  if (unit === "vw") {
    return `/*
${common}
 *
 * Unit: vw (fluid — sizes scale within each breakpoint band, matching the
 * engine defaults). Override a token in any unit you like (px/rem/em/%/clamp).
 * ---------------------------------------------------------------------------
 */`;
  }
  return `/*
${common}
 *
 * Unit: ${unit} (FIXED — sizes are constant within a breakpoint band and jump
 * at the breakpoint, unlike the fluid vw defaults). Generated from the engine's
 * vw scale resolved at these reference widths: mobile ${o.refMobile}px,
 * tablet ${o.refTablet}px, desktop ${o.refDesktop}px${
   unit === "px" ? "" : `, base ${o.base}px`
 }.
 * ---------------------------------------------------------------------------
 */`;
}

/** Generate the full `tokens.css` contents for the given unit + reference widths. */
export function generateThemeCss(options: ThemeGenOptions): string {
  const o: Required<ThemeGenOptions> = {
    unit: options.unit,
    base: options.base ?? THEME_DEFAULTS.base,
    refMobile: options.refMobile ?? THEME_DEFAULTS.refMobile,
    refTablet: options.refTablet ?? THEME_DEFAULTS.refTablet,
    refDesktop: options.refDesktop ?? THEME_DEFAULTS.refDesktop,
  };
  const refs = { refMobile: o.refMobile, refTablet: o.refTablet, refDesktop: o.refDesktop };

  const lines: string[] = [header(o.unit, o), ":root {"];
  for (const step of STEPS) {
    for (const tier of TIERS) {
      const vw = step * tier.vwPerStep;
      const ref = refs[tier.refKey];
      lines.push(`  --fb-space-${step}${tier.suffix}: ${value(vw, o.unit, ref, o.base)};`);
    }
  }
  lines.push("}");
  return lines.join("\n") + "\n";
}
