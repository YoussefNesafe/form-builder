import { cva } from "class-variance-authority";
import type { ResponsiveFieldWidth } from "../core/types";

// Error color stays on the message and control border only — labels and
// input text keep the default foreground.
export const fieldWrapperVariants = cva("flex flex-col gap-1.5", {
  variants: {
    size: { sm: "text-sm", md: "", lg: "text-lg" },
  },
  defaultVariants: { size: "md" },
});

export type FieldWrapperSize = "sm" | "md" | "lg";

// Spans assume the shared 4-column field grid (FLAT_GRID_CLASS and the
// nested GroupField grid). Static strings only — Tailwind cannot see
// dynamically built class names. One variant key per breakpoint because cva
// has no native responsive-variant support.
export const fieldWidthVariants = cva("", {
  variants: {
    width: { full: "col-span-4", half: "col-span-2" },
    widthTablet: { full: "tablet:col-span-4", half: "tablet:col-span-2" },
    widthDesktop: { full: "desktop:col-span-4", half: "desktop:col-span-2" },
  },
  defaultVariants: { width: "full", widthTablet: "full", widthDesktop: "full" },
});

/**
 * Resolve a field's `width` config to grid classes. A plain string applies
 * to every breakpoint; the object form sets mobile/tablet/desktop
 * independently, with unset breakpoints falling back to full.
 */
export function fieldWidthClass(width?: ResponsiveFieldWidth): string {
  const resolved =
    typeof width === "string" ? { mobile: width, tablet: width, desktop: width } : (width ?? {});
  return fieldWidthVariants({
    width: resolved.mobile,
    widthTablet: resolved.tablet,
    widthDesktop: resolved.desktop,
  });
}
