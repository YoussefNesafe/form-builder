import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/CodeBlock";
import {
  DocsIntro,
  DocsSection,
  DocsFootnote,
  DocsBody as P,
  DocsInlineCode as IC,
} from "@/components/docs/DocsProse";
import type { TocItem } from "@/components/docs/DocsToc";
import { DocsPageShell } from "@/components/docs/DocsPageShell";
import { t } from "@/locales";

export const metadata: Metadata = { title: t.docs.nav.pages.installation };

const TOC_ITEMS: TocItem[] = [
  { id: "copy-package-folder", title: "Copy the package folder" },
  { id: "add-shadcn-primitives", title: "Add the shadcn primitives" },
  { id: "install-peer-dependencies", title: "Install peer dependencies" },
  { id: "register-fields", title: "Register the built-in fields" },
  { id: "import-entry-point", title: "Import from the entry point" },
];

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
    <DocsPageShell toc={TOC_ITEMS}>
      <DocsIntro title={t.docs.nav.pages.installation}>
        The engine is copy-in, not an npm package — the same model as shadcn/ui. You copy the source into your
        own Next.js project and own it from that point on; there is no runtime dependency on this repo.
      </DocsIntro>

      <DocsSection id="copy-package-folder" title="1. Copy the package folder">
        <P>
          Copy the <IC>form-builder/</IC> folder into your Next.js project as-is. It has no dependency on anything
          else in this repo — <IC>components/ui/</IC> (below) and the peer packages it imports.
        </P>
      </DocsSection>

      <DocsSection id="add-shadcn-primitives" title="2. Add the shadcn primitives">
        <P>
          The engine&apos;s fields are built on these shadcn primitives — it&apos;s the exact set under{" "}
          <IC>components/ui/</IC> in this repo, so check your own <IC>components/ui/</IC> before re-adding anything
          you already have:
        </P>
        <CodeBlock code={SHADCN_ADD} />
        <P>
          <IC>shadcn</IC> itself stays a <strong>devDependency</strong> — it&apos;s a codegen CLI that writes files
          into your repo at install time, not a library your bundle ships at runtime. Its base layer still has to
          reach your CSS though: add this import to your global stylesheet (this repo does it in{" "}
          <IC>app/globals.css</IC>):
        </P>
        <CodeBlock code={GLOBALS_CSS_IMPORT} />
      </DocsSection>

      <DocsSection id="install-peer-dependencies" title="3. Install the runtime peer dependencies">
        <P>These are the libraries the copied field components actually import at runtime:</P>
        <CodeBlock code={YARN_ADD_PEERS} />
        <P>
          Plus <IC>tailwindcss@^4</IC> and <IC>@tailwindcss/postcss</IC> if your project isn&apos;t already on
          Tailwind 4.
        </P>
      </DocsSection>

      <DocsSection id="register-fields" title="4. Register the built-in fields">
        <P>
          Field types render through a registry, not a switch statement — nothing renders until it&apos;s
          registered. Call this once, before the first <IC>FormRenderer</IC> mounts (a root layout or app entry
          point works; it&apos;s safe to call more than once):
        </P>
        <CodeBlock code={REGISTER_FIELDS} />
      </DocsSection>

      <DocsSection id="import-entry-point" title="5. Import only from the package entry point">
        <P>
          <IC>form-builder/index.ts</IC> is the package&apos;s only supported import path — it&apos;s the public
          API surface (<IC>FormRenderer</IC>, <IC>useDynamicForm</IC>, types, and the rest of the exports live
          there). Reaching into <IC>form-builder/core</IC> or <IC>form-builder/fields</IC> directly is unsupported —
          those modules can be restructured without notice.
        </P>
        <CodeBlock code={IMPORT_RULE} />
      </DocsSection>

      <DocsFootnote>
        Next: build{" "}
        <Link href="/docs/your-first-form" className="underline underline-offset-2 hover:text-foreground">
          your first form
        </Link>
        .
      </DocsFootnote>
    </DocsPageShell>
  );
}
