import { cva } from "class-variance-authority";
import type { ResponsiveFieldWidth } from "../core/types";

// Error color stays on the message and control border only — labels and
// input text keep the default foreground.
export const fieldWrapperVariants = cva(
  "flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px]",
  {
    variants: {
      size: {
        sm: "text-[14px] tablet:text-[14px] desktop:text-[14px]",
        md: "",
        lg: "text-[18px] tablet:text-[18px] desktop:text-[18px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type FieldWrapperSize = "sm" | "md" | "lg";

// Spans assume the shared 12-column field grid (FLAT_GRID_CLASS and the
// nested GroupField grid): full=12, half=6, third=4, quarter=3. Static
// strings only — Tailwind cannot see dynamically built class names. One
// variant key per breakpoint because cva has no native responsive-variant
// support.
export const fieldWidthVariants = cva("", {
  variants: {
    width: {
      full: "col-span-12",
      half: "col-span-6",
      third: "col-span-4",
      quarter: "col-span-3",
    },
    widthTablet: {
      full: "tablet:col-span-12",
      half: "tablet:col-span-6",
      third: "tablet:col-span-4",
      quarter: "tablet:col-span-3",
    },
    widthDesktop: {
      full: "desktop:col-span-12",
      half: "desktop:col-span-6",
      third: "desktop:col-span-4",
      quarter: "desktop:col-span-3",
    },
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
