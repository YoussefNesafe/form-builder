/**
 * Pure decision for how to navigate to a search result — extracted from the
 * palette so both branches are unit-testable (the component just executes the
 * action). A result on the CURRENT page with a `#hash` is an in-page scroll
 * (App Router's programmatic push doesn't reliably re-scroll to a hash on the
 * page you're already on); anything else is a route push.
 */
export type NavAction =
  | { kind: "scroll"; id: string; href: string }
  | { kind: "push"; href: string };

export function resolveNav(href: string, pathname: string): NavAction {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return { kind: "push", href };

  const path = href.slice(0, hashIndex);
  const id = href.slice(hashIndex + 1);
  if (path === pathname) return { kind: "scroll", id, href };
  return { kind: "push", href };
}
