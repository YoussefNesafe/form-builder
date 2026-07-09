// Mask tokens: # = digit, A = letter, * = alphanumeric; every other mask
// char is a literal inserted automatically. The stored (raw) value contains
// only the user's token characters — literals are presentation.

const TOKENS = new Set(["#", "A", "*"]);

function matchesToken(token: string, char: string): boolean {
  if (token === "#") return /\d/.test(char);
  if (token === "A") return /[A-Za-z]/.test(char);
  return /[A-Za-z0-9]/.test(char);
}

export function maskTokenCount(mask: string): number {
  let count = 0;
  for (const char of mask) if (TOKENS.has(char)) count += 1;
  return count;
}

/** "4111111111111111" + "#### #### #### ####" → "4111 1111 1111 1111" (partial raw → partial display, no trailing literals) */
export function formatMasked(raw: string, mask: string): string {
  let out = "";
  let index = 0;
  for (const char of mask) {
    if (index >= raw.length) break;
    if (TOKENS.has(char)) {
      out += raw[index];
      index += 1;
    } else {
      out += char;
    }
  }
  return out;
}

/**
 * Inverse of formatMasked. Walks mask and display in tandem so a literal that
 * happens to match a token class (e.g. the "1" in "+1 ###") is consumed as a
 * literal, never absorbed into the raw value — extractRaw(formatMasked(raw))
 * === raw for every raw that fits the mask. Display chars that fit no slot
 * are dropped; raw is capped by the mask's token count by construction.
 */
export function extractRaw(display: string, mask: string): string {
  let raw = "";
  let maskIndex = 0;
  let displayIndex = 0;
  while (displayIndex < display.length && maskIndex < mask.length) {
    const maskChar = mask[maskIndex];
    const displayChar = display[displayIndex];
    if (TOKENS.has(maskChar)) {
      if (matchesToken(maskChar, displayChar)) {
        raw += displayChar;
        maskIndex += 1;
      }
      // Non-matching char is garbage for this slot — drop it, stay on the slot.
      displayIndex += 1;
    } else if (displayChar === maskChar) {
      // Literal present in the display (formatted input) — consume both.
      maskIndex += 1;
      displayIndex += 1;
    } else {
      // Literal absent (raw input, e.g. pasted digits) — skip the mask literal.
      maskIndex += 1;
    }
  }
  return raw;
}
