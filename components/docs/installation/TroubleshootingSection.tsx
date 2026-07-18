import { DocsSection, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "troubleshooting";
const title = "Troubleshooting";

function Section() {
  return (
    <DocsSection id={id} title="5. Troubleshooting">
      <ul className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw] text-[4.005vw] tablet:text-[1.875vw] desktop:text-[0.78vw] leading-[6.675vw] tablet:leading-[3.125vw] desktop:leading-[1.3vw] text-muted-foreground">
        <li>
          <strong className="text-foreground">
            &quot;Cannot find module &apos;react-hook-form&apos;&quot; (or zod/date-fns/lucide-react/react/react-dom)
          </strong>{" "}
          — the installer only installs the copied fields&apos; own leaf dependencies, never these peers
          (Prerequisites, above). Install them yourself.
        </li>
        <li>
          <strong className="text-foreground"><IC>tablet:</IC>/<IC>desktop:</IC> classes doing nothing</strong> —
          the theme step never found a <IC>globals.css</IC> to write into. Check what the install printed to the
          terminal (it prints the block for you to paste manually when it can&apos;t find one), or search your
          stylesheet for the <IC>/* form-builder theme (managed) */</IC> sentinel comment to confirm whether it
          ran at all.
        </li>
        <li>
          <strong className="text-foreground">
            Breakpoints work, but primitives still render with no visible border or fill
          </strong>{" "}
          — the shadcn base foundation isn&apos;t there yet (see Prerequisites): the installer&apos;s theme write
          only layers its own tokens on top of that foundation, it doesn&apos;t scaffold it. Run{" "}
          <IC>npx shadcn@latest init</IC> once.
        </li>
        <li>
          <strong className="text-foreground">&quot;Field type not registered&quot; at render</strong> — whole-tree
          install: <IC>registerBuiltInFields()</IC> wasn&apos;t called before the first <IC>FormRenderer</IC>{" "}
          mount. Subset install: there&apos;s no aggregate to call — register each installed type with{" "}
          <IC>registerField</IC> yourself (see Use it, above).
        </li>
        <li>
          <strong className="text-foreground">A changed field didn&apos;t update after re-running the installer</strong>{" "}
          — that&apos;s the clobber protection working as designed: existing files are skipped so your own edits
          survive a re-run. Pass <IC>--force</IC> to overwrite.
        </li>
      </ul>
    </DocsSection>
  );
}

export const TroubleshootingSection = { id, title, Section };
