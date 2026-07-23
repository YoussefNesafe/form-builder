"use server";

import { createFormAction } from "@/form-builder/next";
import { typedSubmitConfig } from "./config";
import { TAKEN_EMAIL } from "./demoEmail";

export const submitTypedForm = createFormAction(typedSubmitConfig, async (data) => {
  if (data.email === TAKEN_EMAIL) {
    throw { fieldErrors: { email: "This email is already registered." } };
  }
  return { ok: true as const, username: data.username };
});
