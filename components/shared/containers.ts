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
 * Horizontal padding (px-[4.272vw]/24/32) is shared by all surfaces and baked
 * into each constant alongside its width so a consumer can't take one
 * without the other.
 */

/** SiteNav inner bar — desktop cap aligned to DOCS_CONTAINER (1320px). */
export const NAV_CONTAINER =
  "mx-auto w-full max-w-full tablet:max-w-full desktop:max-w-[68.64vw] px-[4.272vw] tablet:px-[3vw] desktop:px-[1.664vw]";

/** Docs shell (sidebar + content + TOC rail) — widest surface. */
export const DOCS_CONTAINER =
  "mx-auto w-full max-w-[315.06vw] tablet:max-w-[147.5vw] desktop:max-w-[83.2vw] px-[4.272vw] tablet:px-[3vw] desktop:px-[1.664vw]";

/** Landing marketing column. */
export const LANDING_CONTAINER =
  "mx-auto w-full max-w-full tablet:max-w-[135vw] desktop:max-w-[62.4vw] px-[4.272vw] tablet:px-[3vw] desktop:px-[1.664vw]";

/** Examples narrow reading column. */
export const EXAMPLES_CONTAINER =
  "mx-auto w-full max-w-[229.62vw] tablet:max-w-[107.5vw] desktop:max-w-[44.72vw] px-[4.272vw] tablet:px-[3vw] desktop:px-[1.664vw]";
