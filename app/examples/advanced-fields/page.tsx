import type { Metadata } from "next";
import { ExampleForm } from "@/components/examples/ExampleForm";
import { advancedFieldsConfig } from "./config";

export const metadata: Metadata = { title: "Advanced fields" };

export default function AdvancedFieldsPage() {
  return (
    <div className="flex flex-col gap-[20px] tablet:gap-[20px] desktop:gap-[20px]">
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <h1 className="text-[24px] tablet:text-[24px] desktop:text-[24px] font-semibold tracking-tight">
          Advanced fields
        </h1>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          Masked input, date and time pairs that enforce end-after-start, rating, segmented, slider, signature,
          and file — each backed by a built-in field type.
        </p>
      </div>
      <ExampleForm config={advancedFieldsConfig} />
    </div>
  );
}
