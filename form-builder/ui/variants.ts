import { cva } from "class-variance-authority";

// Error color stays on the message and control border only — labels and
// input text keep the default foreground.
export const fieldWrapperVariants = cva("flex flex-col gap-1.5", {
  variants: {
    size: { sm: "text-sm", md: "", lg: "text-lg" },
  },
  defaultVariants: { size: "md" },
});

export type FieldWrapperSize = "sm" | "md" | "lg";
