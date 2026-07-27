/**
 * Interpretation of the HTML `accept` attribute, shared by the Zod schema and
 * the upload UI so the two can never disagree about a file's *type*.
 *
 * Type is only half of acceptance: the schema also enforces `maxSizeMB`
 * (core/validation.ts). Anything deciding a per-file accepted/rejected status
 * for the user must check both — this module answers the type question only.
 *
 * Tokens are read the way a browser's own file picker reads them: `.pdf`
 * against the file name, `image/*` and `application/pdf` against the file's
 * MIME type. A token we cannot interpret simply matches nothing, so a typo in
 * `accept` narrows the selection instead of silently opening it up. The two
 * wildcard spellings in `WILDCARD_TOKENS` below are the one exception: they are
 * interpreted, not unrecognised, and what they denote is "anything".
 *
 * Anything else needing to read `accept` — naming the allowed formats in an
 * error message, say — belongs here too, rather than re-splitting the string at
 * the call site.
 *
 * Two deliberate narrownesses, both failing closed:
 * - MIME parameters are not stripped, so `text/csv;charset=utf-8` does not match
 *   the token `text/csv`, where HTML would. Most likely to show up in
 *   drag-and-drop, since `DataTransfer` is the usual source of a parameterised
 *   type.
 * - `file.type` is lowercased defensively even though the `File` constructor
 *   already normalises it, because structural typing lets a hand-rolled
 *   `{ name, type }` reach here. Normalising an input is worth keeping;
 *   a redundant *branch* is not, which is why there is no `mime !== ""` guard —
 *   every branch already rejects a typeless file on its own.
 */

/** The HTML spellings of "any file at all"; an absent `accept` means the same. */
const WILDCARD_TOKENS = new Set(["*", "*/*"]);

/** Splits an `accept` string into normalised, non-empty lowercase tokens. */
function acceptTokens(accept: string | undefined): string[] {
  if (!accept) return [];
  return accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0 && token !== ".");
}

/**
 * Whether `file` satisfies an `accept` string. An absent or empty `accept`
 * means "no constraint".
 *
 * A file the browser could not type (`file.type === ""`, common for less usual
 * extensions) matches no MIME token at all: we cannot prove what it is, and a
 * misfiled KYC document is worse than a rejected one. An `accept` that must
 * tolerate those files should list the extension too, e.g. ".pdf,application/pdf".
 */
export function fileMatchesAccept(file: File, accept: string | undefined): boolean {
  const tokens = acceptTokens(accept);
  if (tokens.length === 0) return true;

  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  return tokens.some((token) => {
    if (WILDCARD_TOKENS.has(token)) return true;
    // ".pdf" — matched against the end of the name, so "payslip.pdf.exe" fails.
    if (token.startsWith(".")) return name.endsWith(token);
    // "image/*" — any subtype of one type.
    if (token.endsWith("/*")) return mime.startsWith(token.slice(0, -1));
    return mime === token;
  });
}

/**
 * "scan.tiff" -> "TIFF". Used to name the rejected format back to the user.
 *
 * Returns "" when there is no extension to show. Callers must fall back to a
 * generic phrase ("this file type") rather than interpolating an empty format
 * name into user-facing text.
 */
export function fileExtensionLabel(file: File): string {
  const dot = file.name.lastIndexOf(".");
  if (dot === -1 || dot === file.name.length - 1) return "";
  return file.name.slice(dot + 1).toUpperCase();
}
