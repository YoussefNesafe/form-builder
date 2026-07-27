/**
 * The npm entry point (`.` in `package.json`'s `exports` map) and the semver
 * contract described in CHANGELOG.md.
 *
 * WHAT BELONGS HERE: everything a consumer needs to drive the engine WITHOUT
 * its rendered components — the `core/` logic and helpers, the hooks, and any
 * type a symbol already on this surface forces the consumer to name, wherever
 * that type is declared. `FormLocale` and `OtpRuntime` are declared in
 * `components/` and still belong here, because `formatReviewValue` and
 * `useOtpController` take them; `DraftStorage` is here for the same reason,
 * via `AutosaveOptions.storage`.
 *
 * "Headless" is about the component tree, not about React — `useDynamicForm`
 * is a client hook. What stays out is anything that renders, and anything only
 * a renderer would need to name.
 *
 * Adding a name here is a semver commitment; renaming or removing one is a
 * major bump. Every value here must also appear in `index.ts`; that superset
 * relation, and the exact list of names `index.ts` adds on top, are pinned by
 * `barrels.test-d.ts`.
 */
export type {
  FormConfig,
  FieldConfig,
  BaseField,
  CustomFieldConfig,
  AnyFieldConfig,
  FieldType,
  Condition,
  ConditionSpec,
  Option,
  TextRules,
  PasswordComplexity,
  ButtonVariant,
  FieldWidth,
  ResponsiveFieldWidth,
  StepConfig,
  FormValues,
} from "./core/types";
export { BUILT_IN_FIELD_TYPES, isBuiltInField } from "./core/types";
export { defaultMessages, type Messages } from "./core/messages";
export { registerField, getRegisteredTypes, type FieldComponentProps } from "./core/registry";
export { validateFormConfig } from "./core/schema";
export {
  conditionMatches,
  conditionSpecMatches,
  conditionFieldNames,
  toConditionGroups,
  fromConditionGroups,
  evaluateCondition,
  stripInvisibleValues,
  visibleFieldsFor,
  hiddenStepFieldNames,
  type IsFieldValid,
} from "./core/conditions";
export { useDynamicForm, type FormDraft } from "./hooks/useDynamicForm";
export { buildDefaultValues } from "./core/defaults";
export {
  clearDraft,
  type AutosaveOptions,
  type DraftStorage,
  type DraftStorageOption,
} from "./core/autosave";
export { acceptedFormatsLabel } from "./core/fileAccept";
export { useOtpFlow, type OtpFlowConfig, type OtpFlowStatus } from "./hooks/useOtpFlow";
export {
  useOtpController,
  type OtpController,
  type OtpFieldHandlers,
  type UseOtpControllerOptions,
} from "./hooks/useOtpController";
export type { OtpVerifiedChecker } from "./core/validation";
export type { FormLocale, OtpRuntime } from "./components/FieldRuntime";
export {
  applyServerErrors,
  type ServerErrorResult,
  type AppliedServerErrors,
} from "./core/serverErrors";
export {
  parseSubmission,
  type ParseSubmissionOptions,
  type ParseSubmissionResult,
  type ParseSubmissionErrorCode,
} from "./core/parseSubmission";
export { defineForm } from "./core/defineForm";
export type { InferValues, FieldNames, FieldValue } from "./core/inferValues";
export { formatMasked, extractRaw, maskTokenCount } from "./fields/maskedValue";
export {
  formatReviewValue,
  type ReviewFormatter,
  type ReviewFormatters,
} from "./components/reviewValue";
