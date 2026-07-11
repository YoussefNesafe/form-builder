import Link from "next/link";
import {
  Check,
  GitBranch,
  KeyRound,
  Layers,
  ListChecks,
  Save,
  ShieldCheck,
} from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { LandingDemoForm } from "./landing/LandingDemoForm";

const FEATURES = [
  {
    icon: ListChecks,
    title: "24 built-in field types",
    description: "Text, phone, OTP, signature, masked input, rating, and more — one component per type.",
  },
  {
    icon: GitBranch,
    title: "Conditional logic",
    description: "Show, hide, enable, or disable fields with visibleWhen — no imperative wiring.",
  },
  {
    icon: Layers,
    title: "Multi-step wizards",
    description: "Step-gated validation, conditional steps, and a read-only review step before submit.",
  },
  {
    icon: ShieldCheck,
    title: "Cross-field validation",
    description: "Matching passwords, sibling date/time bounds — enforced by a form-level rule.",
  },
  {
    icon: KeyRound,
    title: "OTP verification flows",
    description: "Send/verify codes per field, with submit gated on a verified-code registry.",
  },
  {
    icon: Save,
    title: "Autosave + draft restore",
    description: "Drafts persist as the user types and restore on return, without extra config.",
  },
] as const;

const COMPARISON_ROWS = [
  {
    capability: "Own the generated code",
    hosted: "No — locked to a hosted runtime",
    handRolled: "Yes — but every line is yours to write",
    engine: "Yes — copy it into your app",
  },
  {
    capability: "Type-safe Zod validation",
    hosted: "Varies by platform",
    handRolled: "Yes — hand-written schema per form",
    engine: "Yes — generated from the config",
  },
  {
    capability: "Conditional logic & wizards",
    hosted: "Limited, platform-specific",
    handRolled: "Yes — you build the state machine",
    engine: "Yes — visibleWhen + step config",
  },
] as const;

const BUILDER_CHIPS = ["Email", "Password", "Country", "Submit"] as const;

const CODE_SNIPPET = `import { FormRenderer, registerBuiltInFields } from "@/form-builder";
import type { FormConfig } from "@/form-builder";

registerBuiltInFields();

const config: FormConfig = {
  id: "signup",
  fields: [
    { type: "email", name: "email", label: "Email", required: true },
    { type: "password", name: "password", label: "Password", required: true },
    { type: "country", name: "country", label: "Country" },
    { type: "submit", name: "submit", text: "Create account" },
  ],
};

export function SignupForm() {
  return <FormRenderer config={config} onSubmit={(values) => console.log(values)} />;
}`;

/**
 * Marketing landing page. Server Component throughout except the hero demo
 * panel (LandingDemoForm, isolated to its own client leaf) — everything
 * else here is static markup, no interactivity to justify a client
 * boundary. Accent color is budgeted deliberately (see comments below);
 * default to grayscale unless a section is explicitly called out.
 */
export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteNav />
      <main id="main-content" className="flex-1">
        <div className="mx-auto flex w-full max-w-[1080px] tablet:max-w-[1080px] desktop:max-w-[1080px] flex-col px-[16px] tablet:px-[24px] desktop:px-[32px]">
          {/* 1. Hero */}
          <section className="flex flex-col items-center gap-[24px] tablet:gap-[24px] desktop:gap-[24px] py-[64px] tablet:py-[96px] desktop:py-[120px] text-center">
            <h1 className="text-[36px] tablet:text-[48px] desktop:text-[56px] font-semibold tracking-tight">
              Build the form visually. Ship the{" "}
              <span className="text-accent-brand">code</span>.
            </h1>
            <p className="max-w-[560px] tablet:max-w-[560px] desktop:max-w-[560px] text-[15px] tablet:text-[15px] desktop:text-[15px] text-muted-foreground">
              A visual builder that exports real Zod- and React Hook Form–validated React — you own the code, not a
              hosted widget.
            </p>
            <div className="flex flex-col tablet:flex-row desktop:flex-row gap-[12px] tablet:gap-[12px] desktop:gap-[12px]">
              <Button asChild variant="brand" size="lg">
                <Link href="/builder">Open the builder</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/docs">Read the docs</Link>
              </Button>
            </div>
          </section>

          {/* 2. Live demo */}
          <section className="flex flex-col items-center gap-[16px] tablet:gap-[16px] desktop:gap-[16px] pb-[64px] tablet:pb-[96px] desktop:pb-[120px]">
            <div className="flex flex-col items-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] text-center">
              <h2 className="text-[24px] tablet:text-[28px] desktop:text-[32px] font-semibold tracking-tight">
                Try it right here
              </h2>
              <p className="max-w-[480px] tablet:max-w-[480px] desktop:max-w-[480px] text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
                Pick &quot;Company&quot; to see a conditional field appear — this is the real engine, not a
                screenshot.
              </p>
            </div>
            <div className="w-full max-w-[640px] tablet:max-w-[640px] desktop:max-w-[640px] rounded-[16px] tablet:rounded-[16px] desktop:rounded-[16px] border border-border bg-card p-[24px] tablet:p-[32px] desktop:p-[32px]">
              <LandingDemoForm />
            </div>
            <p className="text-[12px] tablet:text-[12px] desktop:text-[12px] text-muted-foreground">
              Live — this is the actual FormRenderer, not a mock.
            </p>
          </section>

          {/* 3. Builder <-> code split (fully grayscale) */}
          <section className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px] pb-[64px] tablet:pb-[96px] desktop:pb-[120px]">
            <div className="grid grid-cols-1 desktop:grid-cols-2 gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
              <div className="flex flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px] rounded-[16px] tablet:rounded-[16px] desktop:rounded-[16px] border border-border bg-card p-[20px] tablet:p-[24px] desktop:p-[24px]">
                <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
                  Builder canvas
                </span>
                <div
                  aria-hidden="true"
                  className="flex flex-1 flex-col justify-center gap-[10px] tablet:gap-[10px] desktop:gap-[10px] rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-dashed border-border p-[16px] tablet:p-[20px] desktop:p-[20px]"
                >
                  {BUILDER_CHIPS.map((chip) => (
                    <div
                      key={chip}
                      className="rounded-[8px] tablet:rounded-[8px] desktop:rounded-[8px] border border-border bg-muted px-[12px] tablet:px-[12px] desktop:px-[12px] py-[8px] tablet:py-[8px] desktop:py-[8px] text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground"
                    >
                      {chip}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-[12px] tablet:gap-[12px] desktop:gap-[12px] rounded-[16px] tablet:rounded-[16px] desktop:rounded-[16px] border border-border bg-card p-[20px] tablet:p-[24px] desktop:p-[24px]">
                <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
                  Exported code
                </span>
                <CodeBlock code={CODE_SNIPPET} label="Exported form code" className="flex-1" />
              </div>
            </div>
          </section>

          {/* 4. Feature grid */}
          <section className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px] pb-[64px] tablet:pb-[96px] desktop:pb-[120px]">
            <h2 className="text-center text-[24px] tablet:text-[28px] desktop:text-[32px] font-semibold tracking-tight">
              Everything a real form needs
            </h2>
            <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-[16px] tablet:gap-[16px] desktop:gap-[16px]">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px] rounded-[12px] tablet:rounded-[12px] desktop:rounded-[12px] border border-border bg-card p-[20px] tablet:p-[20px] desktop:p-[20px]"
                >
                  <Icon
                    aria-hidden="true"
                    className="size-[16px] tablet:size-[16px] desktop:size-[16px] text-accent-brand"
                  />
                  <span className="text-[15px] tablet:text-[15px] desktop:text-[15px] font-medium text-card-foreground">
                    {title}
                  </span>
                  <span className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
                    {description}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Comparison strip */}
          <section className="flex flex-col gap-[24px] tablet:gap-[24px] desktop:gap-[24px] pb-[64px] tablet:pb-[96px] desktop:pb-[120px]">
            <h2 className="text-center text-[24px] tablet:text-[28px] desktop:text-[32px] font-semibold tracking-tight">
              How it compares
            </h2>
            <div className="flex flex-col">
              <div className="hidden tablet:grid desktop:grid grid-cols-4 gap-[12px] tablet:gap-[12px] desktop:gap-[12px] pb-[10px] tablet:pb-[10px] desktop:pb-[10px] text-[11px] tablet:text-[11px] desktop:text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <span>Capability</span>
                <span>Hosted builders</span>
                <span>Hand-rolled RHF</span>
                <span>This engine</span>
              </div>
              {COMPARISON_ROWS.map((row) => (
                <div
                  key={row.capability}
                  className="grid grid-cols-1 tablet:grid-cols-4 desktop:grid-cols-4 gap-[6px] tablet:gap-[12px] desktop:gap-[12px] border-t border-border py-[14px] tablet:py-[14px] desktop:py-[14px] text-[13px] tablet:text-[13px] desktop:text-[13px]"
                >
                  <span className="font-medium text-foreground">{row.capability}</span>
                  <span className="text-muted-foreground">
                    {/* sr-only (not hidden) at tablet+ so the column label stays in the a11y tree */}
                    <span className="tablet:sr-only desktop:sr-only font-medium uppercase tracking-wide text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
                      Hosted builders:{" "}
                    </span>
                    {row.hosted}
                  </span>
                  <span className="text-muted-foreground">
                    <span className="tablet:sr-only desktop:sr-only font-medium uppercase tracking-wide text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
                      Hand-rolled RHF:{" "}
                    </span>
                    {row.handRolled}
                  </span>
                  <span className="flex items-start gap-[6px] tablet:gap-[6px] desktop:gap-[6px] text-accent-brand">
                    <Check
                      aria-hidden="true"
                      className="mt-[2px] size-[14px] tablet:size-[14px] desktop:size-[14px] shrink-0"
                    />
                    <span>
                      <span className="tablet:sr-only desktop:sr-only font-medium uppercase tracking-wide text-[11px] tablet:text-[11px] desktop:text-[11px] text-muted-foreground">
                        This engine:{" "}
                      </span>
                      {row.engine}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Final CTA */}
          <section className="flex flex-col items-center gap-[20px] tablet:gap-[20px] desktop:gap-[20px] border-t border-border py-[64px] tablet:py-[80px] desktop:py-[96px] text-center">
            <h2 className="text-[28px] tablet:text-[32px] desktop:text-[36px] font-semibold tracking-tight">
              Stop hand-wiring the same form again.
            </h2>
            <Button asChild variant="brand" size="lg">
              <Link href="/builder">Open the builder</Link>
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
