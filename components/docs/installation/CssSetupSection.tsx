import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "css-setup";
const title = "Set up the required CSS";

// Trimmed, verbatim excerpt of this repo's own app/globals.css — same
// values, reordered/filtered down to what the copied engine + the shadcn
// primitives from step 2 actually reference (see the prose below for how
// that set was derived). The full file also carries --color-card,
// --color-chart-*, --color-sidebar-*, and the brand-accent/interactive-
// border tokens — those are landing-page/builder-only, nothing under
// form-builder/ or the shadcn add-list reads them, so they're left out here
// on purpose rather than pasted in as noise. `body`/`html`'s rules inside
// the trailing @layer base (font-sans, scroll-padding-top) are the same
// kind of site-chrome-only exclusion; the `*` rule stays because bare
// `border`/`outline` utilities the adopter may add later depend on it.
const GLOBALS_CSS_TOKENS = `@custom-variant dark (&:is(.dark *));

@theme inline {
  --breakpoint-tablet: 481px;
  --breakpoint-desktop: 1025px;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 10px;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
}`;

function Section() {
  return (
    <DocsSection id={id} title="3. Set up the required CSS">
      <P>
        Three things the copied engine silently depends on and that nothing above wires up yet. First,{" "}
        <IC>tablet:</IC> and <IC>desktop:</IC> aren&apos;t stock Tailwind breakpoints — they only exist because
        this repo declares them in <IC>@theme</IC>. Without that, every <IC>tablet:</IC>/<IC>desktop:</IC> class
        the engine ships compiles to nothing and the layout never leaves its mobile styles. Second, the shadcn
        primitives from step 2 (and a few of the engine&apos;s own field wrappers) render color through utilities
        like <IC>bg-primary</IC>, <IC>text-muted-foreground</IC>, and <IC>border-destructive</IC> — Tailwind v4
        only generates those classes when the matching <IC>--color-*</IC> key exists in <IC>@theme</IC>, so
        skipping the token definitions doesn&apos;t error, it just renders fields with no visible borders or fill.
      </P>
      <P>
        Third, <IC>@custom-variant dark (&amp;:is(.dark *));</IC> — without it, Tailwind&apos;s default{" "}
        <IC>dark:</IC> variant follows the OS-level <IC>prefers-color-scheme</IC> media query instead of a{" "}
        <IC>.dark</IC> class on an ancestor. Several field components ship <IC>dark:</IC>-conditional classes
        (e.g. <IC>OtpField</IC>&apos;s slot fill, <IC>PhoneField</IC>&apos;s input background and valid-state
        border) — skip this line and those only flip when the OS theme does, independently of whatever theme
        toggle your own app uses.
      </P>
      <P>
        Add this to the same global stylesheet as the <IC>@import &quot;shadcn/tailwind.css&quot;;</IC> line from
        step 2 (this repo&apos;s copy lives in <IC>app/globals.css</IC>) — it&apos;s a trimmed copy of this
        repo&apos;s actual tokens, not a generic palette:
      </P>
      <CodeBlock code={GLOBALS_CSS_TOKENS} label="Required app/globals.css tokens" copy copyLabel="CSS" />
      <P>
        The trailing <IC>@layer base</IC> block matters even though nothing in <IC>form-builder/</IC> or the
        shadcn add-list uses a bare <IC>border</IC>/<IC>outline</IC> utility today — without it Tailwind&apos;s
        default border/outline color is <IC>currentColor</IC>, not <IC>--color-border</IC>/<IC>--color-ring</IC>,
        so a bare-<IC>border</IC> primitive you add later (e.g. shadcn&apos;s <IC>alert</IC>) renders with a
        mismatched or invisible edge and every element loses its focus-visible outline color.
      </P>
      <P>
        Don&apos;t want dark mode? Drop the <IC>@custom-variant dark</IC> line and the <IC>.dark</IC> block — the{" "}
        <IC>:root</IC> values apply everywhere. Want exact visual parity with this site instead of picking your own
        palette? Copy this repo&apos;s entire <IC>app/globals.css</IC> — the tokens left out above (
        <IC>--color-card</IC>, <IC>--color-chart-*</IC>, <IC>--color-sidebar-*</IC>, the brand-accent and
        interactive-border tokens) are landing-page/builder styling this site uses for itself, not anything{" "}
        <IC>form-builder/</IC> or the shadcn add-list reads.
      </P>
    </DocsSection>
  );
}

export const CssSetupSection = { id, title, Section };
