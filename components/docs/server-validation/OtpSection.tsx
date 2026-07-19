import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "otp";
const title = "The otp recipe — the one to get right";

const OTP_ROUTE_CODE = `// app/api/signup/route.ts
import { timingSafeEqual } from "node:crypto";
import { parseSubmission } from "@/form-builder";
import { signupConfig } from "./config";
import { getSession } from "@/lib/session";
import { otpStore } from "@/lib/otpStore"; // your own store — Redis, a DB table, whatever
import { createAccount } from "@/lib/accounts"; // your own persistence

export async function POST(request: Request) {
  const session = await getSession(request); // a session/challenge id — never a body field
  const rawBody = await request.json();

  // Rate-limit attempts BEFORE spending a lookup.
  if (await otpStore.tooManyAttempts(session.id)) {
    return Response.json({ formError: "Too many attempts. Try again later." }, { status: 429 });
  }

  // Phase 1: ONE await against your own store, building a synchronous
  // lookup. parseSubmission is synchronous end to end — it can never await
  // your store mid-call, so this Map has to exist before you call it.
  const challenge = await otpStore.get(session.id); // keyed by session, never rawBody
  const issuedCode = challenge?.fieldName === "otp" ? challenge.code : undefined;

  // Phase 2: a sync closure over what phase 1 fetched — a PURE comparison,
  // no side effects. The checker may run independent of whether the rest
  // of the submission ultimately validates, so it must never consume/expire
  // the code itself (that would burn a correct code on, e.g., a submission
  // that fails only because the password is too short).
  const result = parseSubmission(signupConfig, rawBody, {
    otpVerified: (fieldName, code) => {
      if (fieldName !== "otp" || issuedCode === undefined) return false;
      const submitted = Buffer.from(code);
      const issued = Buffer.from(issuedCode);
      return submitted.length === issued.length && timingSafeEqual(submitted, issued);
    },
  });

  if (!result.ok) return Response.json(result.errors, { status: 400 });

  // Consume/expire the code only now — AFTER the whole submission is known
  // to be valid, not inside the checker. Single-use, correctly enforced.
  await otpStore.consume(session.id);
  await createAccount(result.values);
  return Response.json({ ok: true });
}`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        <IC>parseSubmission</IC> is synchronous. Real OTP verification is I/O (a store lookup). The pattern is
        two-phase: await your own store <strong className="text-foreground">once</strong>, build a lookup from the
        result, then pass a synchronous closure over that lookup as <IC>otpVerified</IC>.
      </P>
      <P>The recipe below is the secure version — there is no permissive variant anywhere in this doc:</P>
      <ul className="flex flex-col gap-[0.534vw] tablet:gap-[0.25vw] desktop:gap-[0.104vw] list-disc pl-[4.272vw] tablet:pl-[2vw] desktop:pl-[0.832vw] text-[4.005vw] tablet:text-[1.875vw] desktop:text-[0.78vw] leading-[6.675vw] tablet:leading-[3.125vw] desktop:leading-[1.3vw] text-muted-foreground">
        <li>
          Look the code up against server-side state keyed by a <strong className="text-foreground">session or
          challenge id</strong>, never by a body field — verifying a code against{" "}
          <IC>values.email</IC> is worthless when <IC>values.email</IC> came from the same untrusted request.
        </li>
        <li>
          Compare with <IC>crypto.timingSafeEqual</IC>, not <IC>===</IC>.
        </li>
        <li>Consume/expire the code on success — single use.</li>
        <li>Rate-limit verification attempts.</li>
      </ul>
      <CodeBlock code={OTP_ROUTE_CODE} label="Secure otp recipe" copy copyLabel="otp code" />
      <DocsNote variant="danger" label="Fails closed">
        Omitting <IC>otpVerified</IC> when a visible <IC>otp</IC> field exists returns{" "}
        <IC>{"{ ok: false, code: \"otp_checker_missing\" }"}</IC> — always, unconditionally. There is no skip
        flag. If you handle OTP verification out-of-band (a separate confirm step before this endpoint runs), the{" "}
        <IC>FormConfig</IC> you pass to <IC>parseSubmission</IC> must not include that <IC>otp</IC> field at all —
        the checker requirement is not something you can opt out of on a field that&apos;s still in the config.
      </DocsNote>
      <DocsNote variant="warning" label="otp inside a group">
        An <IC>otp</IC> field nested inside a <IC>group</IC> is rejected outright — <IC>{'code: "otp_in_group"'}</IC> —
        regardless of the submitted body. Group rows are runtime-prefixed (<IC>{'"team.0.code"'}</IC>), a name a
        session-keyed verified-code registry can never match, so such an otp is unverifiable server-side by
        construction.
      </DocsNote>
    </DocsSection>
  );
}

export const OtpSection = { id, title, Section };
