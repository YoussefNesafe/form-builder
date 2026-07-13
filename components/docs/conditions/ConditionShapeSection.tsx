import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC, DocsNote } from "@/components/docs/DocsProse";

const id = "condition-shape";
const title = "Condition shape";

const AND_ARRAY_CODE = `// Condition[] — every entry must match (AND)
visibleWhen: [
  { field: "country", equals: "US" },
  { field: "accountType", notEquals: "individual" },
]`;

const ANY_OF_CODE = `// { anyOf: Condition[][] } — OR of AND-groups (DNF)
visibleWhen: {
  anyOf: [
    [{ field: "plan", equals: "pro" }],
    [{ field: "plan", equals: "enterprise" }, { field: "seats", in: [10, 25, 50] }],
  ],
}`;

function Section() {
  return (
    <DocsSection id={id} title="Condition shape">
      <P>
        A single condition is <IC>{"{ field, equals?, notEquals?, in?, isValid? }"}</IC> — those four are the
        complete operator list (the validator rejects a condition with none of them set). A{" "}
        <IC>ConditionSpec</IC> is one of three shapes, all evaluating to the same normalized form internally:
      </P>
      {/* Definition list, not a bullet list: this is a closed set of type-shape
          variants (term → what it means → example), so each shape sits next to
          its own code block instead of stacking both examples after the list. */}
      <dl className="flex flex-col gap-[2.67vw] tablet:gap-[1.25vw] desktop:gap-[0.52vw]">
        <div className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
          <dt>
            <IC>Condition</IC>
          </dt>
          <dd>
            <P>A single condition — the object above, on its own.</P>
          </dd>
        </div>
        <div className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
          <dt>
            <IC>Condition[]</IC>
          </dt>
          <dd className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
            <P>An AND-list; every entry must match.</P>
            <CodeBlock code={AND_ARRAY_CODE} label="AND array example" />
          </dd>
        </div>
        <div className="flex flex-col gap-[1.068vw] tablet:gap-[0.5vw] desktop:gap-[0.208vw]">
          <dt>
            <IC>{"{ anyOf: Condition[][] }"}</IC>
          </dt>
          <dd className="flex flex-col gap-[1.602vw] tablet:gap-[0.75vw] desktop:gap-[0.312vw]">
            <P>OR of AND-groups (DNF: disjunctive normal form). Any group matching is enough.</P>
            <CodeBlock code={ANY_OF_CODE} label="anyOf DNF example" />
          </dd>
        </div>
      </dl>
      <P>
        The flat two-level shape (groups OR together, conditions AND within a group) is deliberate — any boolean
        combination is expressible this way without a recursive tree, which keeps evaluation a one-liner (
        <IC>groups.some(g =&gt; g.every(match))</IC>) and keeps a future builder UI flat instead of recursive.
      </P>
      <DocsNote variant="warning" label="Validator">
        An empty spec (<IC>[]</IC> or <IC>{"{ anyOf: [] }"}</IC>) is rejected rather than silently treated as
        always-matching, since for <IC>disabledWhen</IC> that would mean permanently disabled.
      </DocsNote>
    </DocsSection>
  );
}

export const ConditionShapeSection = { id, title, Section };
