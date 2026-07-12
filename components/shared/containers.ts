/**
 * Page-shell container class constants — full static class strings (Tailwind
 * must see them literally; never build these dynamically).
 *
 * The per-surface widths are DELIBERATELY different content registers, not
 * drift: docs carries a sidebar + TOC (widest), the landing is a centered
 * marketing column, examples is a narrow reading column. The one alignment
 * rule: the nav bar's desktop cap matches the docs content cap (1320px) so
 * the header edge lines up with the widest content edge.
 *
 * Horizontal padding (px-[16px]/24/32) is shared by all surfaces and baked
 * into each constant alongside its width so a consumer can't take one
 * without the other.
 */

/** SiteNav inner bar — desktop cap aligned to DOCS_CONTAINER (1320px). */
export const NAV_CONTAINER =
  "mx-auto w-full max-w-full tablet:max-w-full desktop:max-w-[1320px] px-[16px] tablet:px-[24px] desktop:px-[32px]";

/** Docs shell (sidebar + content + TOC rail) — widest surface. */
export const DOCS_CONTAINER =
  "mx-auto w-full max-w-[1180px] tablet:max-w-[1180px] desktop:max-w-[1320px] px-[16px] tablet:px-[24px] desktop:px-[32px]";

/** Landing marketing column. */
export const LANDING_CONTAINER =
  "mx-auto w-full max-w-full tablet:max-w-[1080px] desktop:max-w-[1200px] px-[16px] tablet:px-[24px] desktop:px-[32px]";

/** Examples narrow reading column. */
export const EXAMPLES_CONTAINER =
  "mx-auto w-full max-w-[860px] tablet:max-w-[860px] desktop:max-w-[860px] px-[16px] tablet:px-[24px] desktop:px-[32px]";
