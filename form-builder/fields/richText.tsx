import { Fragment, type ReactNode } from "react";

// Static content may carry an inline link. We do NOT inject raw HTML (configs
// can be CMS-sourced — that would be an XSS vector). Instead we render a tiny
// allowlist: <a href> (scheme-checked) and <br>. Everything else stays literal
// text, which React escapes.

const TOKEN = /<a\b([^>]*)>([\s\S]*?)<\/a>|<br\s*\/?>/gi;

/** ASCII control chars (NUL..US, DEL) — scheme-smuggling vectors. */
function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/** Allow only navigable schemes; block javascript:/data:/etc. Relative and hash are fine. */
function isSafeHref(href: string): boolean {
  const value = href.trim();
  if (value === "") return false;
  // Control chars make the validated string diverge from what a lenient parser
  // navigates — the classic filter bypass. Reject outright.
  if (hasControlChar(value)) return false;
  // Hash and root-relative are scheme-less by construction; protocol-relative
  // "//host" is NOT — let it fall through to the scheme check.
  if (value.startsWith("#") || (value.startsWith("/") && !value.startsWith("//"))) return true;
  try {
    const url = new URL(value, "http://base.invalid/");
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function getAttr(attrs: string, name: string): string | undefined {
  // Anchor at start-or-whitespace so `href` is not matched inside `data-href`.
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(attrs);
  return match ? (match[2] ?? match[3]) : undefined;
}

/**
 * Render static content, turning an allowlisted `<a href>`/`<br>` into real
 * elements and leaving all other text literal. Only `href` (safe schemes),
 * `target="_blank"` (with `rel` hardening) survive — no other attributes, so no
 * event handlers or inline styles can be injected.
 */
export function renderRichText(content: string): ReactNode {
  const out: ReactNode[] = [];
  const re = new RegExp(TOKEN);
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    if (match.index > last) out.push(content.slice(last, match.index));

    if (match[0].toLowerCase().startsWith("<br")) {
      out.push(<br key={key++} />);
    } else {
      const attrs = match[1] ?? "";
      const text = match[2] ?? "";
      const href = getAttr(attrs, "href");
      if (href && isSafeHref(href)) {
        const newTab = getAttr(attrs, "target") === "_blank";
        out.push(
          <a
            key={key++}
            href={href}
            {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="underline underline-offset-2"
          >
            {text}
          </a>,
        );
      } else {
        // Missing or unsafe href — keep the link text, drop the anchor.
        out.push(text);
      }
    }
    last = re.lastIndex;
  }
  if (last < content.length) out.push(content.slice(last));

  if (out.length === 0) return content;
  if (out.length === 1) return out[0];
  return <Fragment>{out}</Fragment>;
}
