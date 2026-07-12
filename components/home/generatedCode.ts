import { multiStepSignupConfig } from "@/app/(site)/examples/multi-step-signup/config";
import { toTs } from "@/components/builder/model/serializeCode";
import { landingDemoConfig } from "./demoConfig";

/**
 * Both landing-page code panes reuse the visual builder's own serializer
 * (components/builder/model/serializeCode.ts's `toTs` — the exact function
 * behind the builder's "Export code" button) applied to a real, imported
 * FormConfig. Neither string is hand-maintained: change the config and the
 * displayed code changes with it. Pinned by generatedCode.test.ts.
 */
export const FLAGSHIP_CODE = toTs(multiStepSignupConfig);

/** Final CTA's copy-pasteable snippet — the same config running live in the hero panel. */
export const FINAL_CTA_CODE = toTs(landingDemoConfig);
