import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "controlled-step";
const title = "Driving the step from your app";

const CONTROLLED_STEP_CODE = `const STEP_ROUTES = ["/apply/account", "/apply/details", "/apply/review"];

<FormRenderer
  config={config}
  onSubmit={submit}
  step={STEP_ROUTES.indexOf(pathname)}
  onStepChange={(step) => router.push(STEP_ROUTES[step])}
  stepperOrientation="vertical"
  autosave={{ key: "application" }}
  onDraftRestore={({ step }) => setRestoredFrom(step)}
/>`;

function Section() {
  return (
    <DocsSection id={id} title={title}>
      <P>
        By default the wizard owns its own step. Pass <IC>step</IC> and <IC>onStepChange</IC> to put it on
        routes instead — one URL per step, so the back button, deep links and the review screen&apos;s
        &quot;Edit&quot; buttons all become ordinary navigation.
      </P>
      <CodeBlock code={CONTROLLED_STEP_CODE} label="Wizard driven by the router" />
      <P>
        <IC>step</IC> <strong className="text-foreground">shares</strong> the step, it doesn&apos;t own it —
        this is not a controlled <IC>{"<input value>"}</IC>. The wizard still moves itself when it must: Next
        advances once its own validation gate passes, a step that hides under the visitor bounces to the
        nearest visible one, and a server field error jumps to that field&apos;s step. Setting <IC>step</IC>{" "}
        asks the wizard to go somewhere; it goes, then reports through <IC>onStepChange</IC> where it actually
        landed. A host that ignores <IC>onStepChange</IC> still gets a working wizard — its own copy of the
        step just goes stale.
      </P>
      <P>
        Two requests aren&apos;t honoured literally: an out-of-range index is clamped into{" "}
        <IC>{"[0, steps.length - 1]"}</IC>, and an index whose step is hidden by <IC>visibleWhen</IC>{" "}
        redirects to the nearest visible step. <IC>onStepChange</IC> reports the real index whenever it
        differs from the step the wizard was already on — so <IC>{"step={99}"}</IC> on a fresh mount reports
        the last step, while <IC>{"step={-5}"}</IC> reports nothing, having clamped to the step it was already
        showing.
      </P>
      <P>
        <strong className="text-foreground">Derive <IC>step</IC> synchronously from the URL</strong> — as the
        snippet above does with <IC>pathname</IC> — rather than updating it after a navigation commits. A{" "}
        <IC>step</IC> that lags behind the wizard has two consequences. First, a return to the step you still
        hold isn&apos;t reported: hold <IC>{"step={1}"}</IC> while the visitor goes Next to 2 (reported) then
        Back to 1, and that last move matches the value you passed, so the engine stays silent — you and the
        wizard agree on the step, but no callback told you. Second, a late <IC>step</IC> pulls the visitor
        forward again: if your router lands <IC>{"step={2}"}</IC> a tick after the visitor already pressed
        Back, the wizard honours it. The engine can&apos;t tell a stale echo of its own report from a genuine
        browser-Back to that URL — both arrive as the same number.
      </P>
      <P>
        <IC>onStepChange</IC> reports landings, not requests. It stays quiet for the step the wizard mounts on
        and for a step it reached because you passed it as <IC>step</IC>, so writing{" "}
        <IC>{"onStepChange={(s) => router.push(routes[s])}"}</IC> literally costs you no redundant navigation
        on load and no echo of your own prop. It does fire for every step the wizard chose itself: Next/Back, a
        review-step Edit, a server-error jump, a hidden-step bounce, and the two corrections above.
      </P>
      <P>
        <IC>stepperOrientation=&quot;vertical&quot;</IC> lays the step list out as a left rail beside the
        fields (from the tablet breakpoint up; narrower than that it stacks, as horizontal does). The list
        markup is identical either way — same <IC>{"<ol>"}</IC>, accessible name, <IC>aria-current=&quot;step&quot;</IC>{" "}
        and focus move on step change — so only layout changes, never semantics. If you want a step change
        spoken as well as focused, render your own <IC>aria-live</IC> region from <IC>onStepChange</IC>: the
        engine deliberately ships no live region, because it would announce over the focus move it already
        performs and the wording is yours, not the engine&apos;s.
      </P>
      <P>
        With <IC>autosave</IC> on, <IC>onDraftRestore</IC> fires once per restore so you can tell the visitor
        their progress came back. Its <IC>step</IC> is whatever step the restored draft recorded (
        <IC>undefined</IC> if it recorded none); the wizard moves there itself and reports it through{" "}
        <IC>onStepChange</IC>, so a router-backed host navigates to where the visitor left off. Autosave
        records the current step over its own internal channel rather than <IC>onStepChange</IC>, so the moves
        that callback deliberately stays silent about — the ones you asked for — are still persisted, and a
        router-driven wizard keeps a correct resume point.
      </P>
    </DocsSection>
  );
}

export const ControlledStepSection = { id, title, Section };
