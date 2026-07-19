import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "limits-and-scope";
const title = "What's out of scope, on purpose";

const MALFORMED_CONFIG_CODE = `// A malformed config THROWS — parseSubmission does not catch it for you.
try {
  const result = parseSubmission(config, rawBody, { otpVerified });
  // ...
} catch {
  // A broken config is an authoring error, not bad user input. Let this
  // surface as a 500 (or don't catch it at all) — folding it into a 400
  // would hide a real outage from monitoring behind ordinary form noise.
}`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        <IC>maxStringLength</IC> (default 10,000) bounds string content — it exists to bound ReDoS amplification
        from a config <IC>rules.pattern</IC> and to cap oversized <IC>signature</IC> data-URLs. A second, fixed,
        non-configurable depth cap (32 levels) also exists, purely so a maliciously deep, nested body can&apos;t
        turn this size check&apos;s own recursion into a stack overflow. Both are{" "}
        <strong className="text-foreground">self-protection</strong> for <IC>parseSubmission</IC>&apos;s own
        checks, nothing broader.
      </P>
      <DocsNote variant="note" label="The host's job">
        Overall request body size, rate limiting, and how many rows a <IC>group</IC> is allowed to submit are all
        the host&apos;s concern, enforced at the edge/framework layer — a body-size cap on the Route Handler
        itself, a WAF rule, an API gateway limit. <IC>parseSubmission</IC> does not attempt any of these; adding a
        second or third limit inside the library would just be a worse, less-configurable copy of what the
        platform layer already does well.
      </DocsNote>
      <P>
        A malformed <IC>FormConfig</IC> throws, unconditionally — <IC>validateFormConfig</IC> always runs
        (configs may be CMS-sourced), and <IC>parseSubmission</IC> does not swallow its exception.
      </P>
      <DocsNote variant="danger" label="A 500, deliberately — not a 400">
        A broken config is an authoring/deployment error, not user input gone wrong. Catching it into a 400 would
        make a real outage look like ordinary form validation noise in your logs and dashboards — let it surface
        as a 500 (or don&apos;t catch it) so it pages someone.
      </DocsNote>
      <CodeBlock code={MALFORMED_CONFIG_CODE} label="Handling a malformed config" copy copyLabel="code" />
      <DocsNote variant="warning" label="stripInvisibleValues is not a server sanitizer">
        <IC>stripInvisibleValues</IC> is a client-side helper for headless <IC>getValues()</IC> consumers — it
        passes through undeclared keys, has no <IC>__proto__</IC> scrub, and is blind to step visibility (fields-
        only). It is tempting to reach for by name when writing a server sanitizer; don&apos;t. Use{" "}
        <IC>parseSubmission</IC> for anything touching a request body.
      </DocsNote>
    </DocsSection>
  );
}

export const LimitsAndScopeSection = { id, title, Section };
