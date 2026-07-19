import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "trusted-values";
const title = "What the body can — and can't — override";

const HIDDEN_VS_DISABLED_CODE = `{
  // hidden: value is re-injected from config BEFORE visibility is computed,
  // on every parse, unconditionally. The body's own "plan" key is discarded.
  type: "hidden",
  name: "plan",
  value: "pro",
},
{
  // disabled: a purely presentational flag. It carries no config value to
  // re-inject, so parseSubmission has nothing to enforce here — the body's
  // "discountPercent" is trusted as submitted, same as any other field.
  type: "number",
  name: "discountPercent",
  disabled: true,
}`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <DocsNote variant="danger" label="disabled is not a lock">
        A field&apos;s <IC>disabled: true</IC> is a presentational flag — it carries no config-authored value, so
        there is nothing for <IC>parseSubmission</IC> to re-assert. Its value is trusted from the body exactly
        like any other visible field, even though the client-rendered UI never let a user change it.
      </DocsNote>
      <P>
        <strong className="text-foreground">The rule:</strong> a value the server must own belongs in a{" "}
        <IC>hidden</IC> field, or nowhere in the form at all (read it from the session instead). Never in a{" "}
        <IC>disabled</IC> one.
      </P>
      <P>
        <IC>hidden</IC> fields go the other way — their value is re-injected from the config on{" "}
        <strong className="text-foreground">every</strong> parse, with no opt-out, and always{" "}
        <em>before</em> visibility is computed. That ordering is load-bearing, not incidental:{" "}
        <IC>hidden</IC> fields are legal <IC>visibleWhen</IC> sources, so if the body&apos;s value were trusted
        even briefly, an attacker could flip which <em>other</em> fields the form treats as required.
      </P>
      <P>
        This recursion reaches into every <IC>group</IC> row too, at any nesting depth — a per-row{" "}
        <IC>hidden</IC> field (a line-item price, a SKU) is exactly as protected as a top-level one.
      </P>
      <CodeBlock code={HIDDEN_VS_DISABLED_CODE} label="hidden vs. disabled" copy copyLabel="code" />
    </DocsSection>
  );
}

export const TrustedValuesSection = { id, title, Section };
