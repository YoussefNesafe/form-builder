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
