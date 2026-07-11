import type { Metadata } from "next";
import { ExampleForm } from "@/components/examples/ExampleForm";
import { conditionalProfileConfig } from "./config";

export const metadata: Metadata = { title: "Conditional profile" };

export default function ConditionalProfilePage() {
  return (
    <div className="flex flex-col gap-[20px] tablet:gap-[20px] desktop:gap-[20px]">
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <h1 className="text-[24px] tablet:text-[24px] desktop:text-[24px] font-semibold tracking-tight">
          Conditional profile
        </h1>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          Company name only appears once you pick &quot;Company&quot;, billing cycle options come from the plan
          you picked, and the phone field&apos;s country flag follows the country field.
        </p>
      </div>
      <ExampleForm config={conditionalProfileConfig} />
    </div>
  );
}
