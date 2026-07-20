import { CommandBlock } from "@/components/docs/CommandBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "prerequisites";
const title = "Prerequisites";

const PEER_PACKAGES = `react react-dom react-hook-form zod date-fns lucide-react`;

function Section() {
  return (
    <DocsSection id={id} title="1. Prerequisites">
      <P>These need to already be true in your project — nothing the installer does can substitute for them.</P>
      <ul className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] text-[4.005vw] tablet:text-[1.875vw] desktop:text-[0.78vw] leading-[6.675vw] tablet:leading-[3.125vw] desktop:leading-[1.3vw] text-muted-foreground">
        <li>
          <strong className="text-foreground">A React 19 project.</strong> The copied engine itself has no
          Next.js-specific coupling, but the installer&apos;s own base-folder detection (<IC>src/</IC> → else{" "}
          <IC>app/</IC> → else your project root) assumes a Next.js-shaped layout.
        </li>
        <li>
          <strong className="text-foreground">Tailwind CSS v4, CSS-first config.</strong> <IC>@import &quot;tailwindcss&quot;;</IC>{" "}
          in your global stylesheet, no <IC>tailwind.config.js</IC>. Without it, neither the custom{" "}
          <IC>tablet:</IC>/<IC>desktop:</IC> breakpoints nor any shadcn token-driven utility the copied fields use
          (<IC>bg-primary</IC>, <IC>border-input</IC>, …) compiles to anything.
        </li>
        <li>
          <strong className="text-foreground">shadcn&apos;s own foundation already in that stylesheet.</strong> See
          below — the installer only adds to it, it doesn&apos;t create it.
        </li>
      </ul>
      <DocsNote variant="warning" label="shadcn foundation required">
        The installer&apos;s theme step is additive only: it writes the engine&apos;s own breakpoints, accent
        tokens, and sizing scale on top of an existing shadcn foundation — it does not scaffold that foundation
        itself (<IC>--background</IC>/<IC>--primary</IC>/<IC>--border</IC>/<IC>--radius</IC>,{" "}
        <IC>@custom-variant dark</IC>, the base border/outline layer rule, plus the <IC>shadcn</IC> and{" "}
        <IC>tw-animate-css</IC> packages&apos; own <IC>@import</IC> lines). If this project has never used
        shadcn/ui, run <IC>npx shadcn@latest init</IC> once first — it scaffolds exactly that (nothing else here
        needs the <IC>components.json</IC> it also writes). Already have shadcn/ui components somewhere in this
        app? You already have it.
      </DocsNote>
      <P>
        Runtime peer dependencies — the installer never installs these itself (a duplicate React, React Hook
        Form, or Zod instance is the actual footgun, not a missing install step):
      </P>
      <CommandBlock kind="install" args={PEER_PACKAGES} />
    </DocsSection>
  );
}

export const PrerequisitesSection = { id, title, Section };
