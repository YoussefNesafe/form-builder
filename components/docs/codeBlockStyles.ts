/**
 * Shared visual tokens between CodeBlock's `<pre>` and CommandBlock's tabbed
 * variant — single source so the two can't visually drift apart. CodeBlock
 * composes all four onto one `<pre>` (it owns its own box); CommandBlock
 * splits them across an outer tab container (CONTAINER_CLASS) and the active
 * `<TabsContent>` panel (TEXT/PADDING/COPY_PADDING_CLASS), since it has an
 * extra tab row CodeBlock doesn't.
 */

/** Rounded border + muted background — the block's outer box. */
export const CODE_BLOCK_CONTAINER_CLASS =
  "rounded-[2.67vw] tablet:rounded-[1.25vw] desktop:rounded-[0.52vw] border border-border bg-muted";

/** Monospace body copy size/line-height. */
export const CODE_BLOCK_TEXT_CLASS =
  "text-[3.471vw] tablet:text-[1.625vw] desktop:text-[0.832vw] font-mono leading-[5.34vw] tablet:leading-[2.5vw] desktop:leading-[1.04vw]";

/** Inner spacing for the code content. */
export const CODE_BLOCK_PADDING_CLASS =
  "p-[3.738vw] tablet:p-[1.75vw] desktop:p-[0.728vw]";

/** Extra right-inset reserved for the absolutely-positioned CopyButton overlay. */
export const CODE_BLOCK_COPY_PADDING_CLASS =
  "pe-[11.748vw] tablet:pe-[5.5vw] desktop:pe-[2.288vw]";
