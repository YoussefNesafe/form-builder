import { multiStepSignupConfig } from "@/app/(site)/examples/multi-step-signup/config";
import { toTs } from "@/components/builder/model/serializeCode";

/**
 * The flagship code pane reuses the visual builder's own serializer
 * (components/builder/model/serializeCode.ts's `toTs` — the exact function
 * behind the builder's "Export code" button) applied to a real, imported
 * FormConfig. The string is never hand-maintained: change the config and the
 * displayed code changes with it. Pinned by generatedCode.test.ts.
 */
export const FLAGSHIP_CODE = toTs(multiStepSignupConfig);
