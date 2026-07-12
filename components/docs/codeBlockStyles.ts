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
  "rounded-[10px] tablet:rounded-[10px] desktop:rounded-[10px] border border-border bg-muted";

/** Monospace body copy size/line-height. */
export const CODE_BLOCK_TEXT_CLASS =
  "text-[13px] tablet:text-[13px] desktop:text-[13px] font-mono leading-[20px] tablet:leading-[20px] desktop:leading-[20px]";

/** Inner spacing for the code content. */
export const CODE_BLOCK_PADDING_CLASS = "p-[14px] tablet:p-[14px] desktop:p-[14px]";

/** Extra right-inset reserved for the absolutely-positioned CopyButton overlay. */
export const CODE_BLOCK_COPY_PADDING_CLASS = "pe-[44px] tablet:pe-[44px] desktop:pe-[44px]";
