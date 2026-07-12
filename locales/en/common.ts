/**
 * Strings genuinely shared across domains (site chrome, docs, examples,
 * builder). Keep this minimal — a string used by exactly one feature
 * belongs in that feature's own dictionary slice, not here.
 */
export const common = {
  skipToContent: "Skip to content",
} as const;
