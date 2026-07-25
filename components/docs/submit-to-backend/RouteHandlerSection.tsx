import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "route-handler";
const title = "Variant B: Route Handler via parseSubmission";

const ROUTE_CODE = `// app/api/signup/route.ts
import { parseSubmission } from "@/form-builder";
import { signupConfig } from "./config";
import { createAccount, findAccountByEmail } from "@/lib/accounts";

export async function POST(request: Request) {
  const result = parseSubmission(signupConfig, await request.json());
  if (!result.ok) return Response.json(result.errors, { status: 400 });

  // result.values is InferValues<typeof signupConfig> — typed, no cast.
  const existing = await findAccountByEmail(result.values.email);
  if (existing) {
    return Response.json(
      { fieldErrors: { email: "That email is already registered." } },
      { status: 400 },
    );
  }

  await createAccount(result.values);
  return Response.json({ ok: true });
}`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        <IC>createFormAction</IC> is a thin convenience wrapper — calling <IC>parseSubmission</IC> directly works
        the same way and fits any transport, not just a Server Action: a Route Handler, a queue consumer, a
        third-party webhook relay. The success key is <IC>values</IC>, typed as{" "}
        <IC>InferValues&lt;typeof config&gt;</IC> from the generic <IC>config</IC> argument — the same type{" "}
        <IC>createFormAction</IC> hands its handler.
      </P>
      <CodeBlock code={ROUTE_CODE} label="Route Handler" copy copyLabel="route code" />
      <P>
        A field error you construct by hand, like the duplicate-email check above, only needs to match{" "}
        <IC>ServerErrorResult</IC>&apos;s shape (<IC>{"{ fieldErrors?, formError? }"}</IC>) — it doesn&apos;t have
        to come from <IC>parseSubmission</IC> itself to be applied correctly on the client.
      </P>
    </DocsSection>
  );
}

export const RouteHandlerSection = { id, title, Section };
