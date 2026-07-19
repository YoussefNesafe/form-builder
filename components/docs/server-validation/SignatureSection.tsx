import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "signature";
const title = "Signature";

const SIGNATURE_CODE = `function parseSubmission(
  config: FormConfig,
  rawBody: unknown,
  opts?: {
    otpVerified?: OtpVerifiedChecker;   // required if a visible otp field exists
    messages?: Partial<Messages>;       // i18n overrides, merged over defaultMessages
    maxStringLength?: number;           // default 10_000
  },
):
  | { ok: true; values: FormValues; unvalidated: string[] }
  | { ok: false; code: ParseSubmissionErrorCode; errors: ServerErrorResult; unvalidated: string[] };`;

const CODES: { code: string; when: string }[] = [
  { code: "invalid_body", when: "rawBody isn't a plain JSON object (array, string, number, null, undefined)." },
  {
    code: "otp_checker_missing",
    when: "a visible otp field exists and opts.otpVerified was omitted. Fails closed — see the OTP section below.",
  },
  {
    code: "otp_in_group",
    when: "the config nests an otp field inside a group, at any depth — rejected outright, unconditionally.",
  },
  {
    code: "input_too_large",
    when: "a string value, top-level or inside a group row, exceeds maxStringLength (default 10_000).",
  },
  { code: "validation_failed", when: "the body parsed against the config's schema and failed." },
];

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        Pure and synchronous — no I/O, no promise. Reuses the exact schema builder the client&apos;s
        condition-aware resolver uses (<IC>buildFieldsSchema</IC>), never a forked validation path.
      </P>
      <CodeBlock code={SIGNATURE_CODE} label="parseSubmission signature" copy copyLabel="signature" />
      <P>
        <IC>code</IC> is for server-side logging only — every <em>non-</em>
        <IC>validation_failed</IC> failure branch returns the <em>same</em> generic <IC>errors.formError</IC> copy
        regardless of cause (tuning dials and otp verification state are not an oracle a client response should
        expose). <IC>validation_failed</IC> is the deliberate exception: it returns per-field messages, since a
        form needs to tell a user which field is wrong.
      </P>
      <dl className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
        {CODES.map((row) => (
          <div key={row.code} className="flex flex-col gap-[0.534vw] tablet:gap-[0.25vw] desktop:gap-[0.104vw]">
            <dt>
              <IC>{row.code}</IC>
            </dt>
            <dd>
              <P>{row.when}</P>
            </dd>
          </div>
        ))}
      </dl>
    </DocsSection>
  );
}

export const SignatureSection = { id, title, Section };
