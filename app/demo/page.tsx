import type { FormConfig } from "@/form-builder/core/types";
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
    { type: "radio", name: "size", label: "Size", required: true, options: [
      { label: "Small", value: 1 },
      { label: "Large", value: 2 },
    ] },
    { type: "hidden", name: "utm", value: "smoke-campaign" },
    { type: "submit", name: "go", text: "Send" },
  ],
};

export default function DemoPage() {
  return <DemoClient config={config} />;
}
