import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "quick-start";
const title = "Quick start: Next.js Route Handler";

const ROUTE_HANDLER_CODE = `// app/api/signup/route.ts
import { parseSubmission } from "@/form-builder";
import { signupConfig } from "./config";
import { createAccount } from "@/lib/accounts"; // your own persistence

export async function POST(request: Request) {
  const result = parseSubmission(signupConfig, await request.json());
  if (!result.ok) return Response.json(result.errors, { status: 400 });

  // result.values is the validated payload — create the account, etc.
  await createAccount(result.values);
  return Response.json({ ok: true });
}`;

const CLIENT_CODE = `"use client";
// FormRenderer's onSubmit may return a ServerErrorResult (or resolve to
// one) — returning it maps fieldErrors -> setError per field and
// formError -> the form's root error slot, via applyServerErrors
// internally. No extra client-side glue needed.
import { FormRenderer } from "@/form-builder";
import { signupConfig } from "./config";

export function SignupForm() {
  return (
    <FormRenderer
      config={signupConfig}
      onSubmit={async (values) => {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (res.ok) return;
        // res.body IS the ServerErrorResult parseSubmission returned as
        // \`result.errors\` on the server — return it as-is.
        return res.json();
      }}
    />
  );
}`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        The whole server side of a submission is two lines: parse, and if it failed, return the errors as-is.
      </P>
      <CodeBlock code={ROUTE_HANDLER_CODE} label="Route Handler recipe" copy copyLabel="Route Handler code" />
      <P>
        <IC>result.errors</IC> IS a <IC>ServerErrorResult</IC> — the same shape a host&apos;s <IC>onSubmit</IC>{" "}
        callback may already return from an API failure. Returning it verbatim as the 400 body closes the round
        trip end to end: the client&apos;s existing error-handling path repaints the exact fields that failed,
        with the exact message the server produced, no server-specific client code required.
      </P>
      <CodeBlock code={CLIENT_CODE} label="Client round trip" copy copyLabel="client code" />
    </DocsSection>
  );
}

export const QuickStartSection = { id, title, Section };
