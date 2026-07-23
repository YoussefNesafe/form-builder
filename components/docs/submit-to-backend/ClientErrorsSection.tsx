import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "client-errors";
const title = "Client: applying server errors";

const MANUAL_CODE = `// Driving your own submit UI on top of useDynamicForm — no FormRenderer.
"use client";
import { useDynamicForm, applyServerErrors } from "@/form-builder";
import { signupConfig } from "./config";
import { signup } from "./action";

export function useSignupForm() {
  const { form } = useDynamicForm(signupConfig);

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await signup(values);
    if (res.ok) return;
    // Same mapping FormRenderer runs internally: fieldErrors -> setError
    // per field, formError -> the returned root-level message.
    const { formError } = applyServerErrors(form.setError, res.errors, signupConfig.fields);
    if (formError) form.setError("root", { type: "server", message: formError });
  });

  return { form, onSubmit };
}`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        With <IC>FormRenderer</IC>, this is automatic — its <IC>onSubmit</IC> prop accepts{" "}
        <IC>void | ServerErrorResult | Promise&lt;...&gt;</IC>. Return the <IC>errors</IC> object from either
        variant above as-is and <IC>FormRenderer</IC> calls <IC>applyServerErrors</IC> internally, mapping{" "}
        <IC>fieldErrors</IC> to a <IC>setError</IC> call per field (jumping to that field&apos;s wizard step and
        focusing it, if the form has steps) and <IC>formError</IC> to the form&apos;s root error slot. No extra
        client-side glue needed for that path.
      </P>
      <P>
        Building a custom submit UI directly on <IC>useDynamicForm</IC> instead of <IC>FormRenderer</IC>? Call{" "}
        <IC>applyServerErrors</IC> yourself — it&apos;s the same function, exported for exactly this:
      </P>
      <CodeBlock code={MANUAL_CODE} label="Manual applyServerErrors" copy copyLabel="code" />
    </DocsSection>
  );
}

export const ClientErrorsSection = { id, title, Section };
