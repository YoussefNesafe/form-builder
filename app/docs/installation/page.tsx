import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const metadata: Metadata = { title: "Installation" };

const SHADCN_ADD = `npx shadcn@latest add button calendar checkbox command dialog field \\
  input input-group input-otp label popover progress radio-group \\
  select separator slider switch textarea`;

const YARN_ADD_PEERS = `yarn add react-hook-form @hookform/resolvers zod zustand \\
  class-variance-authority clsx tailwind-merge cmdk date-fns \\
  react-day-picker input-otp libphonenumber-js react-phone-number-input \\
  signature_pad lucide-react radix-ui tw-animate-css`;

const GLOBALS_CSS_IMPORT = `@import "shadcn/tailwind.css";`;

const REGISTER_FIELDS = `// e.g. app/layout.tsx, once, before any FormRenderer mounts
import { registerBuiltInFields } from "@/form-builder";

registerBuiltInFields();`;

const IMPORT_RULE = `// Correct — the package's one public entry point
import { FormRenderer, useDynamicForm } from "@/form-builder";

// Wrong — nothing outside index.ts is a supported import path
import { FormRenderer } from "@/form-builder/components/FormRenderer";`;

/**
 * Copy-in adoption guide. Source of truth is the README's "Adopting the
 * engine" section — this page restates it as a walkthrough with code blocks
 * instead of a flat list. Verified against package.json, components.json,
 * and components/ui/* on 2026-07-11: the shadcn add list below is the exact
 * set of primitives present under components/ui/ in this repo.
 */
export default function InstallationPage() {
  return (
    <div className="flex flex-col gap-[28px] tablet:gap-[28px] desktop:gap-[28px]">
      <div className="flex flex-col gap-[8px] tablet:gap-[8px] desktop:gap-[8px]">
        <h1 className="text-[24px] tablet:text-[24px] desktop:text-[24px] font-semibold tracking-tight">
          Installation
        </h1>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          The engine is copy-in, not an npm package — the same model as shadcn/ui. You copy the source into your
          own Next.js project and own it from that point on; there is no runtime dependency on this repo.
        </p>
      </div>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <h2 className="text-[17px] tablet:text-[17px] desktop:text-[17px] font-semibold tracking-tight">
          1. Copy the package folder
        </h2>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          Copy the{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            form-builder/
          </code>{" "}
          folder into your Next.js project as-is. It has no dependency on anything else in this repo —
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            {" "}
            components/ui/
          </code>{" "}
          (below) and the peer packages it imports.
        </p>
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <h2 className="text-[17px] tablet:text-[17px] desktop:text-[17px] font-semibold tracking-tight">
          2. Add the shadcn primitives
        </h2>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          The engine&apos;s fields are built on these shadcn primitives — it&apos;s the exact set under{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            components/ui/
          </code>{" "}
          in this repo, so check your own{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            components/ui/
          </code>{" "}
          before re-adding anything you already have:
        </p>
        <CodeBlock code={SHADCN_ADD} />
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            shadcn
          </code>{" "}
          itself stays a <strong>devDependency</strong> — it&apos;s a codegen CLI that writes files into your repo
          at install time, not a library your bundle ships at runtime. Its base layer still has to reach your CSS
          though: add this import to your global stylesheet (this repo does it in{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            app/globals.css
          </code>
          ):
        </p>
        <CodeBlock code={GLOBALS_CSS_IMPORT} />
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <h2 className="text-[17px] tablet:text-[17px] desktop:text-[17px] font-semibold tracking-tight">
          3. Install the runtime peer dependencies
        </h2>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          These are the libraries the copied field components actually import at runtime:
        </p>
        <CodeBlock code={YARN_ADD_PEERS} />
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          Plus{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            tailwindcss@^4
          </code>{" "}
          and{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            @tailwindcss/postcss
          </code>{" "}
          if your project isn&apos;t already on Tailwind 4.
        </p>
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <h2 className="text-[17px] tablet:text-[17px] desktop:text-[17px] font-semibold tracking-tight">
          4. Register the built-in fields
        </h2>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          Field types render through a registry, not a switch statement — nothing renders until it&apos;s
          registered. Call this once, before the first{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            FormRenderer
          </code>{" "}
          mounts (a root layout or app entry point works; it&apos;s safe to call more than once):
        </p>
        <CodeBlock code={REGISTER_FIELDS} />
      </section>

      <section className="flex flex-col gap-[10px] tablet:gap-[10px] desktop:gap-[10px]">
        <h2 className="text-[17px] tablet:text-[17px] desktop:text-[17px] font-semibold tracking-tight">
          5. Import only from the package entry point
        </h2>
        <p className="text-[14px] tablet:text-[14px] desktop:text-[14px] text-muted-foreground">
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            form-builder/index.ts
          </code>{" "}
          is the package&apos;s only supported import path — it&apos;s the public API surface (
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            FormRenderer
          </code>
          ,{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            useDynamicForm
          </code>
          , types, and the rest of the exports live there). Reaching into{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            form-builder/core
          </code>{" "}
          or{" "}
          <code className="rounded-[4px] tablet:rounded-[4px] desktop:rounded-[4px] bg-muted px-[4px] tablet:px-[4px] desktop:px-[4px] py-[2px] tablet:py-[2px] desktop:py-[2px] text-[13px] tablet:text-[13px] desktop:text-[13px]">
            form-builder/fields
          </code>{" "}
          directly is unsupported — those modules can be restructured without notice.
        </p>
        <CodeBlock code={IMPORT_RULE} />
      </section>

      <p className="text-[13px] tablet:text-[13px] desktop:text-[13px] text-muted-foreground">
        Next: build{" "}
        <Link href="/docs/your-first-form" className="underline underline-offset-2 hover:text-foreground">
          your first form
        </Link>
        .
      </p>
    </div>
  );
}
