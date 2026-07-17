// Headless-only entry point — the shadcn-free "Unit A" surface (see
// docs/plans/2026-07-17-packaging-analysis.md §5.1). This is the ONLY entry
// built/published from this package right now. The rendering layer
// (FormRenderer, FieldRuntime's render half, FieldWrapper, fields/*) all
// transitively import host-owned `@/components/ui/*` shadcn primitives (and
// `../internal/cn`) and is copy-in only — Phase 2, not built here. Do not
// import from "./components/FormRenderer", "./components/FieldRuntime"
// (value imports), "./ui/FieldWrapper", "./components/FormStepper",
// "./components/ReviewStep", "./fields", or any "./fields/*Field" module —
// the tsup build gate greps the built dist for `@/components/ui` and
// `internal/cn` and must find zero matches.
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
export { useDynamicForm, buildDefaultValues, type FormDraft } from "./hooks/useDynamicForm";
export { clearDraft, type AutosaveOptions } from "./core/autosave";
export { useOtpFlow, type OtpFlowConfig, type OtpFlowStatus } from "./hooks/useOtpFlow";
export {
  useOtpController,
  type OtpController,
  type OtpFieldHandlers,
  type UseOtpControllerOptions,
} from "./hooks/useOtpController";
export type { OtpVerifiedChecker } from "./core/validation";
// FormLocale/OtpRuntime are declared in FieldRuntime.tsx alongside the
// render-runtime exports (useFieldRuntime, useFieldDisabled, FieldGate) that
// stay OUT of this entry — but the types themselves have no shadcn/cn
// coupling (verified: FieldRuntime.tsx imports only react-hook-form,
// core/conditions, hooks/useSourceSync, core/messages, core/types). Re-
// exported `export type`-only so no runtime code from that module reaches
// the built output — OtpController above references OtpRuntime, so hosts
// need it to type their own controller wiring.
export type { FormLocale, OtpRuntime } from "./components/FieldRuntime";
export {
  applyServerErrors,
  type ServerErrorResult,
  type AppliedServerErrors,
} from "./core/serverErrors";
// Masked payloads carry the RAW value; hosts re-format for display (e.g.
// review/confirmation screens, emails) with the same helpers the field uses.
export { formatMasked, extractRaw, maskTokenCount } from "./fields/maskedValue";
// Review-step value display — exported so headless hosts building their own
// rendering can reuse it and type their reviewFormatters.
export {
  formatReviewValue,
  type ReviewFormatter,
  type ReviewFormatters,
} from "./components/reviewValue";
