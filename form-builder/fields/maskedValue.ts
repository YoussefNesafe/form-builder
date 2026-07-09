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

/** Inverse of formatMasked; drops chars that don't fit the next token class and caps at the token count. */
export function extractRaw(display: string, mask: string): string {
  const tokens: string[] = [];
  for (const char of mask) if (TOKENS.has(char)) tokens.push(char);
  let raw = "";
  for (const char of display) {
    if (raw.length >= tokens.length) break;
    if (matchesToken(tokens[raw.length], char)) raw += char;
  }
  return raw;
}
