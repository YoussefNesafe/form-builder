/**
 * The in-repo and copy-in entry point — `@/form-builder`, what a
 * shadcn-style install imports.
 *
 * It is `headless.ts` re-listed in full, plus the layer that entry
 * deliberately omits: the components, the `ui/` primitives, the field-runtime
 * hooks, and the built-in field registration. The types those UI-only APIs
 * force a host to name (`StepperOrientation`, `DraftRestoreInfo`,
 * `FileDropzoneProps`) live here and NOT in `headless.ts`, because that
 * package ships no renderer to use them on — a name a consumer cannot act on
 * is contract surface bought for nothing.
 *
 * The list is written out rather than re-exported from `./headless`, so each
 * barrel reads as its own contract. `barrels.test-d.ts` pins that this one
 * never falls behind, and enumerates exactly what it adds.
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
export { FormRenderer, type DraftRestoreInfo } from "./components/FormRenderer";
export type { StepperOrientation } from "./components/FormStepper";
export { FormSection } from "./components/FormSection";
export { FieldWrapper, fieldAriaDescribedBy } from "./ui/FieldWrapper";
export { FileDropzone, type FileDropzoneProps } from "./ui/FileDropzone";
export { useFieldRuntime, useFieldDisabled, type FormLocale } from "./components/FieldRuntime";
export {
  conditionMatches,
  conditionSpecMatches,
  conditionFieldNames,
  toConditionGroups,
  fromConditionGroups,
  evaluateCondition,
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
export type { OtpRuntime } from "./components/FieldRuntime";
export { stripInvisibleValues, visibleFieldsFor, hiddenStepFieldNames } from "./core/conditions";
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
export { registerBuiltInFields } from "./fields";
export { formatMasked, extractRaw, maskTokenCount } from "./fields/maskedValue";
export {
  formatReviewValue,
  type ReviewFormatter,
  type ReviewFormatters,
} from "./components/reviewValue";
