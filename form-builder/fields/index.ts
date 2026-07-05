import { registerField } from "../core/registry";
import { CheckboxField } from "./CheckboxField";
import { HiddenField } from "./HiddenField";
import { RadioField } from "./RadioField";
import { StaticField } from "./StaticField";
import { SubmitField } from "./SubmitField";
import { TextField } from "./TextField";

export function registerBuiltInFields(): void {
  registerField("text", TextField);
  registerField("email", TextField);
  registerField("password", TextField);
  registerField("textarea", TextField);
  registerField("number", TextField);
  registerField("checkbox", CheckboxField);
  registerField("switch", CheckboxField);
  registerField("radio", RadioField);
  registerField("hidden", HiddenField);
  registerField("static", StaticField);
  registerField("submit", SubmitField);
  // extended in Phase 6 as complex fields land
}
