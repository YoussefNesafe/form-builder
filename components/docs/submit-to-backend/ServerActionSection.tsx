import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "server-action";
const title = "Variant A: Server Action via createFormAction";

const CONFIG_CODE = `// config.ts
import { defineForm } from "@/form-builder";

export const signupConfig = defineForm({
  id: "signup",
  fields: [
    { type: "email", name: "email", required: true },
    { type: "submit", name: "submit", text: "Sign up" },
  ],
});`;

const ACTION_CODE = `// action.ts
"use server";
import { createFormAction } from "@/form-builder/next";
import { signupConfig } from "./config";
import { createAccount, findAccountByEmail } from "@/lib/accounts"; // your own persistence

export const signup = createFormAction(signupConfig, async (values) => {
  // \`values\` is InferValues<typeof signupConfig> — no cast, no re-parsing.
  const existing = await findAccountByEmail(values.email);
  if (existing) {
    // A thrown { fieldErrors?, formError? } is funneled into the action's
    // error result. Anything else thrown re-throws — genuine errors are
    // never swallowed.
    throw { fieldErrors: { email: "That email is already registered." } };
  }
  const account = await createAccount(values);
  return { ok: true as const, accountId: account.id };
});`;

const PAGE_CODE = `// page.tsx
"use client";
import { FormRenderer } from "@/form-builder";
import { signupConfig } from "./config";
import { signup } from "./action";

export function SignupForm() {
  return (
    <FormRenderer
      config={signupConfig}
      onSubmit={async (values) => {
        const res = await signup(values);
        if (res.ok) return; // res.accountId is available here, typed
        return res.errors; // FormRenderer applies it to the failing field(s)
      }}
    />
  );
}`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        <IC>createFormAction(config, handler)</IC> wraps <IC>parseSubmission</IC> around a Server Action: it parses
        the incoming body against <IC>config</IC>, and only calls your <IC>handler</IC> once parsing succeeds — with
        the typed, validated payload.
      </P>
      <CodeBlock code={CONFIG_CODE} label="Shared config" copy copyLabel="config code" />
      <CodeBlock code={ACTION_CODE} label="Server Action" copy copyLabel="action code" />
      <P>
        The result is <IC>{"{ ok: true } & Omit<R, \"ok\">"}</IC> on success (whatever extra keys your handler
        returned, alongside <IC>ok</IC>) or <IC>{"{ ok: false, errors: ServerErrorResult }"}</IC> on failure — from
        either a parse failure or a thrown field error, unified into the same shape.
      </P>
      <CodeBlock code={PAGE_CODE} label="Client" copy copyLabel="page code" />
      <DocsNote variant="note" label="form-builder/next is a separate entry point">
        <IC>createFormAction</IC> lives under <IC>form-builder/next</IC>, not the root <IC>form-builder</IC> barrel
        — core stays framework-agnostic, and this is the one piece that knows about Server Actions.
      </DocsNote>
    </DocsSection>
  );
}

export const ServerActionSection = { id, title, Section };
