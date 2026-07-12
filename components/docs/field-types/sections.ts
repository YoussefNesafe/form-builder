import type { TocItem } from "@/components/docs/DocsToc";

// No H2 sections on this page (it's one reference table, rendered directly
// by page.tsx as <FieldTypesTableSection/> — see that file) — empty
// TOC_ITEMS so DocsToc renders null, same null-guard pattern as
// DocsPagination. Kept as its own module (rather than inlining `[]` in
// page.tsx) so every docs page imports TOC_ITEMS from the same place.
export const TOC_ITEMS: TocItem[] = [];
