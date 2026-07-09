import type { FormConfig } from "@/form-builder";
import { DemoClient } from "./DemoClient";

const config: FormConfig = {
  id: "kitchen-sink",
  fields: [
    { type: "static", name: "title", content: "Kitchen Sink", as: "h1" },
    {
      type: "text",
      name: "firstName",
      label: "First name",
      required: true,
      // Full width on mobile, half from tablet up.
      width: { tablet: "half", desktop: "half" },
      rules: { pattern: "^[A-Za-z ]+$", message: "Letters and spaces only" },
    },
    { type: "email", name: "email", label: "Email", required: true, width: { tablet: "half", desktop: "half" } },
    { type: "password", name: "secret", label: "Password", required: true, rules: { minLength: 8 } },
    { type: "textarea", name: "bio", label: "Bio", placeholder: "A few words" },
    { type: "number", name: "age", label: "Age", min: 18, max: 120, width: "half" },
    { type: "switch", name: "newsletter", label: "Newsletter", width: "half" },
    {
      type: "text",
      name: "nickname",
      label: "Nickname (disabled while newsletter off)",
      disabledWhen: { field: "newsletter", equals: false },
    },
    { type: "checkbox", name: "other", label: "Something else?" },
    {
      type: "text",
      name: "details",
      label: "Details",
      required: true,
      visibleWhen: { field: "other", equals: true },
    },
    {
      type: "radio",
      name: "size",
      label: "Size",
      required: true,
      options: [
        { label: "Small", value: 1 },
        { label: "Large", value: 2 },
      ],
    },
    {
      type: "select",
      name: "color",
      label: "Color",
      required: true,
      width: "half",
      options: [
        { label: "Red", value: "red" },
        { label: "Green", value: "green" },
        { label: "Blue", value: "blue" },
      ],
    },
    {
      type: "select",
      name: "toppings",
      label: "Toppings",
      multiple: true,
      searchable: true,
      width: "half",
      placeholder: "Pick toppings",
      options: [
        { label: "Cheese", value: "cheese" },
        { label: "Olives", value: "olives" },
        { label: "Basil", value: "basil" },
      ],
    },
    { type: "otp", name: "code", label: "Code", length: 4 },
    {
      type: "country",
      name: "residence",
      label: "Country of residence",
      width: "half",
      countries: ["NL", "AE", "EG", "SA"],
      preferredCountries: ["AE"],
      placeholder: "Pick a country",
    },
    { type: "phone", name: "mobile", label: "Mobile", defaultCountry: "NL", countryFrom: "residence", width: "half" },
    {
      type: "segmented",
      name: "plan",
      label: "Plan",
      required: true,
      options: [
        { label: "Basic", value: "basic" },
        { label: "Pro", value: "pro" },
        { label: "Max", value: "max" },
      ],
    },
    {
      type: "checkbox",
      name: "interests",
      label: "Interests",
      width: "half",
      options: [
        { label: "Design", value: "design" },
        { label: "Engineering", value: "engineering" },
        { label: "Marketing", value: "marketing" },
      ],
    },
    { type: "rating", name: "satisfaction", label: "Satisfaction", max: 5, width: "half" },
    { type: "date", name: "birthday", label: "Birthday", width: "half" },
    { type: "date", name: "stay", label: "Stay", range: true, width: "half" },
    { type: "time", name: "meeting", label: "Meeting time", minTime: "09:00", maxTime: "17:00", stepMinutes: 15, width: "half" },
    { type: "masked", name: "card", label: "Card number", mask: "#### #### #### ####", width: "half" },
    { type: "slider", name: "level", label: "Level", min: 0, max: 10, step: 1, width: "half" },
    { type: "signature", name: "sign", label: "Signature", heightPx: 160 },
    { type: "file", name: "cv", label: "CV", accept: ".pdf,.txt", maxSizeMB: 1 },
    {
      type: "group",
      name: "team",
      label: "Team members",
      min: 1,
      max: 3,
      placeholder: "Add member",
      fields: [
        { type: "text", name: "member", label: "Name", required: true, width: "half" },
        { type: "checkbox", name: "lead", label: "Lead?", width: "half" },
      ],
    },
    { type: "hidden", name: "utm", value: "smoke-campaign" },
    { type: "submit", name: "go", text: "Send" },
  ],
  steps: [
    { title: "Account", fieldNames: ["title", "firstName", "email", "secret", "bio", "age"] },
    {
      title: "Profile",
      fieldNames: ["newsletter", "nickname", "other", "details", "size", "color", "toppings", "code", "residence", "mobile", "plan", "interests", "satisfaction"],
    },
    { title: "Extras", fieldNames: ["birthday", "stay", "meeting", "card", "level", "sign", "cv", "team"] },
  ],
};

export default function DemoPage() {
  return <DemoClient config={config} />;
}
