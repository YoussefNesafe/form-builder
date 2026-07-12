import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "otp-dependson";
const title = "Cross-step caveat: otp";

function Section() {
  return (
    <DocsSection id={id} title="Cross-step caveat: otp dependsOn">
      <P>
        An <IC>otp</IC> field&apos;s <IC>dependsOn</IC> source normally lives on the same step. If it&apos;s on a
        different step, the config validator dev-warns rather than errors — it works, because{" "}
        <IC>shouldUnregister</IC> stays <IC>false</IC> so values persist while a step&apos;s fields are unmounted
        — but editing the source field while the otp field&apos;s step is unmounted defers re-verification until
        that step remounts. Keep the pair on one step unless that tradeoff is intentional.
      </P>
    </DocsSection>
  );
}

export const OtpDependsOnSection = { id, title, Section };
