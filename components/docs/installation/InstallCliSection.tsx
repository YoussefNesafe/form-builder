import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "install";
const title = "Install (one command)";

const INSTALL_ALL = `# from a checkout of this repo, targeting another project on disk
node cli/bin/form-builder.mjs --cwd ../my-app`;

const INSTALL_SUBSET = `node cli/bin/form-builder.mjs add text phone --cwd ../my-app`;

function Section() {
  return (
    <DocsSection id={id} title="2. Install (one command)">
      <DocsNote variant="warning" label="Pre-release">
        Not on npm yet — <IC>npx form-builder-nextjs</IC> won&apos;t resolve for anyone outside this repo until
        it&apos;s published. Two honest options right now: run it from a checkout of this repo (below), or use the
        manual copy-in fallback further down this page. Once it ships to npm, <IC>npx form-builder-nextjs</IC> is
        the one-command install.
      </DocsNote>
      <P>
        One command copies the engine, every built-in field, the 17 vendored shadcn primitives, and the theme
        tokens into a single self-contained <IC>&lt;base&gt;/form-builder/</IC> folder (<IC>src/</IC> if your
        project has one, else <IC>app/</IC>, else the project root). Every <IC>@/components/ui/*</IC> import
        inside the copy is rewritten to a relative path on the way in — zero alias setup to do, and the folder
        works regardless of your own <IC>tsconfig.json</IC>.
      </P>
      <CodeBlock code={INSTALL_ALL} copy copyLabel="command" />
      <P>
        Only need a few field types? Install a scoped subset instead — it pulls in just the requested fields plus
        whatever slice of the engine and primitives they actually need, not the full 17:
      </P>
      <CodeBlock code={INSTALL_SUBSET} copy copyLabel="command" />
      <P>
        Re-running is safe by default: existing files are left alone so your edits survive, only newly-added items
        get written. Pass <IC>--force</IC> to overwrite everything anyway, or <IC>--no-install</IC>/
        <IC>--no-theme</IC> to skip the npm-install / globals.css-write steps and handle them yourself. Run{" "}
        <IC>node cli/bin/form-builder.mjs --help</IC> for the full flag list.
      </P>
    </DocsSection>
  );
}

export const InstallCliSection = { id, title, Section };
