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
export { FormRenderer } from "./components/FormRenderer";
export { FormSection } from "./components/FormSection";
// For custom field authors: match built-in chrome and runtime behavior.
export { FieldWrapper, fieldAriaDescribedBy } from "./ui/FieldWrapper";
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
export type { OtpRuntime } from "./components/FieldRuntime";
export { stripInvisibleValues, visibleFieldsFor, hiddenStepFieldNames } from "./core/conditions";
export {
  applyServerErrors,
  type ServerErrorResult,
  type AppliedServerErrors,
} from "./core/serverErrors";
export { registerBuiltInFields } from "./fields";
// Masked payloads carry the RAW value; hosts re-format for display (e.g.
// review/confirmation screens) with the same helpers the field uses.
export { formatMasked, extractRaw, maskTokenCount } from "./fields/maskedValue";
// Review-step value display — exported so hosts can reuse it (e.g. emails,
// confirmation screens) and type their reviewFormatters.
export {
  formatReviewValue,
  type ReviewFormatter,
  type ReviewFormatters,
} from "./components/reviewValue";
