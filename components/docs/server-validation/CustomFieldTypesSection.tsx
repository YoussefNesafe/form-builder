import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "custom-fields";
const title = "Custom (registered) field types";

const CUSTOM_VALIDATE_CODE = `const result = parseSubmission(config, rawBody, { otpVerified });
if (!result.ok) return Response.json(result.errors, { status: 400 });

// result.unvalidated names every field the schema skipped — files, and
// custom registered types. Validate the ones you care about yourself:
const gizmo = z.object({ widgetId: z.string(), qty: z.number().int().min(1) });
const parsedGizmo = gizmo.safeParse(result.values.gizmo);
if (!parsedGizmo.success) {
  return Response.json({ fieldErrors: { gizmo: "Invalid widget selection" } }, { status: 400 });
}`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        A field registered via <IC>registerField</IC> validates, at the config level, as <IC>BaseField</IC> only
        — its own props pass through unchecked. <IC>parseSubmission</IC> mirrors that pinned engine contract: a
        custom type&apos;s value schema is <IC>z.unknown().optional()</IC>, so its name always lands in{" "}
        <IC>unvalidated</IC> next to any file fields, in <IC>config.fields</IC> order.
      </P>
      <DocsNote variant="warning" label="Disclosure, not a fail-closed gate">
        This is a deliberate design choice, not an oversight: <IC>parseSubmission</IC> discloses what it{" "}
        <em>didn&apos;t</em> check via <IC>unvalidated</IC> rather than rejecting the whole submission outright.
        The engine has no way to know what a given custom type&apos;s value should look like — only the host that
        registered the type does. Skipping <IC>result.unvalidated</IC> is the sharp edge: three lines of zod over{" "}
        <IC>result.values[name]</IC> closes it.
      </DocsNote>
      <DocsNote variant="warning" label="Reserved-key scrubbing does not recurse into it">
        <IC>parseSubmission</IC>&apos;s <IC>__proto__</IC>/<IC>constructor</IC>/<IC>prototype</IC> scrub only
        walks the body&apos;s top level and <IC>group</IC> rows — a custom field&apos;s value passes through raw,
        including any reserved keys nested inside it. Safe as long as you validate it with your own schema and{" "}
        <strong className="text-foreground">never deep-merge</strong> <IC>result.values[name]</IC> into another
        object.
      </DocsNote>
      <CodeBlock code={CUSTOM_VALIDATE_CODE} label="Validating a custom field's value" copy copyLabel="code" />
    </DocsSection>
  );
}

export const CustomFieldTypesSection = { id, title, Section };
