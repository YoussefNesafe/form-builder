import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "framework-recipes";
const title = "More framework recipes";

const SERVER_ACTION_CODE = `// app/signup/actions.ts
"use server";
import { parseSubmission } from "@/form-builder";
import type { FormValues } from "@/form-builder";
import { signupConfig } from "./config";
import { createAccount } from "@/lib/accounts"; // your own persistence

export async function submitSignup(values: FormValues) {
  const result = parseSubmission(signupConfig, values);
  if (!result.ok) return result.errors; // matches onSubmit's return contract
  await createAccount(result.values);
}`;

const SERVER_ACTION_CLIENT_CODE = `"use client";
// A Server Action is just an async function once "use server" marks its
// module — pass it straight to onSubmit, no fetch/route glue at all.
import { FormRenderer } from "@/form-builder";
import { signupConfig } from "./config";
import { submitSignup } from "./actions";

export function SignupForm() {
  return <FormRenderer config={signupConfig} onSubmit={submitSignup} />;
}`;

const EXPRESS_CODE = `// A non-Next host — same two-line core, wired to Express instead of a Route Handler.
import express from "express";
import { parseSubmission } from "@form-builder/engine"; // published headless entry
import { signupConfig } from "./signupConfig";
import { createAccount } from "./accounts"; // your own persistence

const app = express();
app.use(express.json());

app.post("/api/signup", async (req, res) => {
  const result = parseSubmission(signupConfig, req.body);
  if (!result.ok) return res.status(400).json(result.errors);

  await createAccount(result.values);
  res.json({ ok: true });
});`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        Every recipe on this page is the same core: parse, and if it failed, hand back <IC>result.errors</IC>{" "}
        unchanged. Only the transport around it differs.
      </P>
      <P>
        <strong className="text-foreground">Next.js Server Action.</strong> <IC>onSubmit</IC>&apos;s contract —{" "}
        <IC>(values) =&gt; void | ServerErrorResult | Promise&lt;void | ServerErrorResult&gt;</IC> — is exactly a
        Server Action&apos;s shape, so it can be passed to <IC>onSubmit</IC> directly:
      </P>
      <CodeBlock code={SERVER_ACTION_CODE} label="Server Action" copy copyLabel="Server Action code" />
      <CodeBlock code={SERVER_ACTION_CLIENT_CODE} label="Server Action wired to onSubmit" copy copyLabel="client code" />
      <P>
        <strong className="text-foreground">A non-Next host (Express shown; Hono, Fastify, etc. are the same
        shape).</strong> <IC>parseSubmission</IC> has zero Next.js coupling — it&apos;s exported from{" "}
        <IC>form-builder/headless.ts</IC>, the same shadcn-free entry published as{" "}
        <IC>@form-builder/engine</IC>:
      </P>
      <CodeBlock code={EXPRESS_CODE} label="Express recipe" copy copyLabel="Express code" />
    </DocsSection>
  );
}

export const FrameworkRecipesSection = { id, title, Section };
