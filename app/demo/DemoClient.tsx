"use client";

import { useState } from "react";
import { FormRenderer, registerBuiltInFields, type FormConfig, type FormValues } from "@/form-builder";

registerBuiltInFields();

export function DemoClient({ config }: { config: FormConfig }) {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);
  const [rtl, setRtl] = useState(false);
  const [dark, setDark] = useState(false);

  // documentElement, not a wrapper class: Radix portals content to body.
  const toggleDark = () => {
    document.documentElement.classList.toggle("dark", !dark);
    setDark(!dark);
  };

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="bg-background text-foreground">
      <div className="mx-auto max-w-[672px] tablet:max-w-[672px] desktop:max-w-[672px] space-y-[32px] tablet:space-y-[32px] desktop:space-y-[32px] p-[32px] tablet:p-[32px] desktop:p-[32px]">
        <div className="flex gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
          <button
            type="button"
            className="rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] border px-[12px] tablet:px-[12px] desktop:px-[12px] py-[4px] tablet:py-[4px] desktop:py-[4px] text-[14px] tablet:text-[14px] desktop:text-[14px]"
            onClick={() => setRtl((previous) => !previous)}
          >
            {rtl ? "LTR" : "RTL"}
          </button>
          <button type="button" className="rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] border px-[12px] tablet:px-[12px] desktop:px-[12px] py-[4px] tablet:py-[4px] desktop:py-[4px] text-[14px] tablet:text-[14px] desktop:text-[14px]" onClick={toggleDark}>
            {dark ? "Light" : "Dark"}
          </button>
        </div>
        <FormRenderer config={config} onSubmit={setSubmitted} />
        {submitted && (
          <pre className="overflow-x-auto rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] bg-muted p-[16px] tablet:p-[16px] desktop:p-[16px] text-[14px] tablet:text-[14px] desktop:text-[14px]" dir="ltr">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
