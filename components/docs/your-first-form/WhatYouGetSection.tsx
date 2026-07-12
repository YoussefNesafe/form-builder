import { DocsSection, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "what-you-get";
const title = "What you got for free";

function Section() {
  return (
    <DocsSection id={id} title="What you got for free">
      <ul className="flex flex-col gap-[6px] tablet:gap-[6px] desktop:gap-[6px] text-[15px] tablet:text-[15px] desktop:text-[15px] leading-[25px] tablet:leading-[25px] desktop:leading-[25px] text-muted-foreground">
        <li>
          <strong className="text-foreground">Zod validation</strong> — a schema is derived from the config
          (each field&apos;s <IC>required</IC>, type, and rules), never hand-duplicated in a separate schema
          file. The email field is checked for email format automatically.
        </li>
        <li>
          <strong className="text-foreground">Error messages</strong> — human-readable, out of the box, wired
          to each field via <IC>aria-describedby</IC> for screen readers. Override any of them with a{" "}
          <IC>messages</IC> prop on <IC>FormRenderer</IC>.
        </li>
        <li>
          <strong className="text-foreground">Grid layout</strong> — every field defaults to a full-width row
          in a 12-column responsive grid. Set <IC>width: &quot;half&quot;</IC> (or a per-breakpoint object) on a
          field to change that.
        </li>
      </ul>
    </DocsSection>
  );
}

export const WhatYouGetSection = { id, title, Section };
