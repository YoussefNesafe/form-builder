import { defineForm } from "@/form-builder";

export const typedSubmitConfig = defineForm({
  id: "typed-submit",
  title: "Create account",
  fields: [
    { type: "text", name: "username", label: "Username", required: true },
    { type: "email", name: "email", label: "Email", required: true },
    { type: "submit", name: "submit", text: "Create account" },
  ],
});
