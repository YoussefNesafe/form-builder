import { docs } from "@/locales/en/docs";

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
 * two views can never drift apart. This module stays the single STRUCTURAL
 * source (grouping/href/order); the words themselves live in
 * locales/en/docs.ts (`docs.nav`) — imported here (domain slice, not the aggregate `t` — this module is
 * consumed by client components, so the aggregate would leak every locale
 * domain into the docs client chunks), not duplicated.
 */
export const DOCS_NAV_GROUPS: DocsNavGroup[] = [
  {
    title: docs.nav.groups.overview,
    items: [{ href: "/docs", title: docs.nav.pages.overview }],
  },
  {
    title: docs.nav.groups.gettingStarted,
    items: [
      { href: "/docs/installation", title: docs.nav.pages.installation },
      { href: "/docs/your-first-form", title: docs.nav.pages.yourFirstForm },
    ],
  },
  {
    title: docs.nav.groups.concepts,
    items: [
      { href: "/docs/conditions", title: docs.nav.pages.conditions },
      { href: "/docs/wizards", title: docs.nav.pages.wizards },
      { href: "/docs/server-validation", title: docs.nav.pages.serverValidation },
    ],
  },
  {
    title: docs.nav.groups.reference,
    items: [{ href: "/docs/field-types", title: docs.nav.pages.fieldTypes }],
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
