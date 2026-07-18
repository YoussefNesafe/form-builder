import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "what-you-got";
const title = "What you got";

const TREE = `src/form-builder/
├── core/           # types, zod schema/validation, conditions, messages, registry — framework-agnostic
├── hooks/          # useDynamicForm, useOtpFlow, useOtpController
├── store/          # zustand stepper store
├── ui/             # FieldWrapper, cva variants, the 12-col grid layout
├── components/     # FormRenderer, FormStepper, FieldRuntime, ReviewStep, ...
│   └── ui/         # the shadcn primitives this install needed — vendored, import-rewritten
├── fields/         # one component per field type (+ index.ts's registerBuiltInFields, whole-tree installs only)
└── internal/       # the cn() class-merge helper (was @/lib/utils)`;

function Section() {
  return (
    <DocsSection id={id} title="3. What you got">
      <P>Everything lands together under one folder, self-contained:</P>
      <CodeBlock code={TREE} label="Installed folder structure" />
      <P>
        It&apos;s yours from the moment it lands — same &quot;copy it, own it&quot; model as the manual copy-in
        further down this page, just automated. Two differences from that manual flow worth knowing: every
        primitive under <IC>components/ui/</IC> here is a copy scoped to this folder, not shared with any{" "}
        <IC>components/ui/</IC> you already have elsewhere in the app; and there is no single package entry point
        — the copied tree has no root <IC>index.ts</IC> barrel, so you import straight from whichever submodule
        has what you need (next section shows the shape).
      </P>
      <P>
        <IC>tw-animate-css</IC> gets <IC>npm install -D</IC>&apos;d for you automatically as part of the theme
        step. The base <IC>shadcn</IC> package and its own <IC>@import</IC> lines do not — see Prerequisites,
        above.
      </P>
    </DocsSection>
  );
}

export const WhatYouGotSection = { id, title, Section };
