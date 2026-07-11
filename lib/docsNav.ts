export type DocsNavItem = {
  href: string;
  title: string;
};

export type DocsNavGroup = {
  title: string;
  items: DocsNavItem[];
};

/**
 * Single source of truth for the docs sidebar AND prev/next pagination —
 * grouped for the sidebar, flattened (below) for pagination order, so the
 * two views can never drift apart.
 */
export const DOCS_NAV_GROUPS: DocsNavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/docs", title: "Overview" }],
  },
  {
    title: "Getting started",
    items: [
      { href: "/docs/installation", title: "Installation" },
      { href: "/docs/your-first-form", title: "Your first form" },
    ],
  },
  {
    title: "Reference",
    items: [{ href: "/docs/field-types", title: "Field types" }],
  },
];

export const DOCS_PAGES: DocsNavItem[] = DOCS_NAV_GROUPS.flatMap((group) => group.items);

export function getDocsPagination(pathname: string): {
  prev: DocsNavItem | null;
  next: DocsNavItem | null;
} {
  const index = DOCS_PAGES.findIndex((page) => page.href === pathname);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? DOCS_PAGES[index - 1] : null,
    next: index < DOCS_PAGES.length - 1 ? DOCS_PAGES[index + 1] : null,
  };
}
