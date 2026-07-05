import { cva } from "class-variance-authority";

export const fieldWrapperVariants = cva("flex flex-col gap-1.5", {
  variants: {
    size: { sm: "text-sm", md: "", lg: "text-lg" },
    state: { default: "", error: "[&_label]:text-destructive" },
  },
  defaultVariants: { size: "md", state: "default" },
});

export type FieldWrapperSize = "sm" | "md" | "lg";
