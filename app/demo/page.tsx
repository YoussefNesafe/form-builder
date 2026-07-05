import type { FormConfig } from "@/form-builder";
import { DemoClient } from "./DemoClient";

const config: FormConfig = {
  id: "smoke",
  fields: [
    { type: "static", name: "title", content: "Smoke Test", as: "h1" },
    { type: "text", name: "firstName", label: "First name", required: true, colSpan: 2 },
    { type: "email", name: "email", label: "Email", required: true, colSpan: 2 },
    { type: "password", name: "secret", label: "Password", required: true, rules: { minLength: 8 } },
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
      colSpan: 2,
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
      colSpan: 2,
      placeholder: "Pick toppings",
      options: [
        { label: "Cheese", value: "cheese" },
        { label: "Olives", value: "olives" },
        { label: "Basil", value: "basil" },
      ],
    },
    { type: "otp", name: "code", label: "Code", length: 4 },
    { type: "phone", name: "mobile", label: "Mobile", defaultCountry: "NL", colSpan: 2 },
    { type: "date", name: "birthday", label: "Birthday", colSpan: 2 },
    { type: "date", name: "stay", label: "Stay", range: true, colSpan: 2 },
    { type: "slider", name: "level", label: "Level", min: 0, max: 10, step: 1, colSpan: 2 },
    { type: "file", name: "cv", label: "CV", accept: ".pdf,.txt", maxSizeMB: 1 },
    {
      type: "group",
      name: "team",
      label: "Team members",
      min: 1,
      max: 3,
      placeholder: "Add member",
      fields: [
        { type: "text", name: "member", label: "Name", required: true, colSpan: 2 },
        { type: "checkbox", name: "lead", label: "Lead?", colSpan: 2 },
      ],
    },
    { type: "hidden", name: "utm", value: "smoke-campaign" },
    { type: "submit", name: "go", text: "Send" },
  ],
  steps: [
    { title: "Account", fieldNames: ["title", "firstName", "email", "secret"] },
    { title: "Profile", fieldNames: ["other", "details", "size", "color", "toppings", "code", "mobile"] },
    { title: "Extras", fieldNames: ["birthday", "stay", "level", "cv", "team"] },
  ],
};

export default function DemoPage() {
  return <DemoClient config={config} />;
}
