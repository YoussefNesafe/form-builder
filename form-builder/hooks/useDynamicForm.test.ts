import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useDynamicForm } from "./useDynamicForm";
import { defaultMessages } from "../core/messages";
import type { FormConfig } from "../core/types";

const config: FormConfig = {
  id: "t",
  fields: [
    { type: "text", name: "firstName", required: true },
    { type: "checkbox", name: "agree" },
    { type: "checkbox", name: "tags", options: [{ label: "A", value: "a" }] },
    { type: "select", name: "colors", multiple: true, options: [{ label: "Red", value: "red" }] },
    { type: "number", name: "age" },
    { type: "date", name: "birthday" },
    { type: "slider", name: "level", min: 2, max: 10 },
    { type: "hidden", name: "utm", value: "campaign-x" },
    { type: "group", name: "team", min: 1, fields: [{ type: "text", name: "member" }] },
    { type: "static", name: "note", content: "hi" },
    { type: "submit", name: "go", text: "Go" },
  ],
};

describe("useDynamicForm", () => {
  it("derives default values from config", () => {
    const { result } = renderHook(() => useDynamicForm(config));
    expect(result.current.form.getValues()).toEqual({
      firstName: "",
      agree: false,
      tags: [],
      colors: [],
      age: undefined,
      birthday: undefined,
      level: 2,
      utm: "campaign-x",
      team: [{ member: "" }],
    });
  });

  it("produces no default keys for static/submit", () => {
    const { result } = renderHook(() => useDynamicForm(config));
    const values = result.current.form.getValues();
    expect("note" in values).toBe(false);
    expect("go" in values).toBe(false);
  });

  it("wires resolver with default messages", async () => {
    const { result } = renderHook(() => useDynamicForm(config));
    await act(async () => {
      await result.current.form.trigger("firstName");
    });
    expect(result.current.form.getFieldState("firstName").error?.message).toBe("This field is required");
  });

  it("wires resolver with overridden messages", async () => {
    const { result } = renderHook(() => useDynamicForm(config, { messages: { required: "verplicht" } }));
    await act(async () => {
      await result.current.form.trigger("firstName");
    });
    expect(result.current.form.getFieldState("firstName").error?.message).toBe("verplicht");
  });

  it("hidden value survives handleSubmit", async () => {
    const submitConfig: FormConfig = {
      id: "s",
      fields: [
        { type: "text", name: "name" },
        { type: "hidden", name: "utm", value: "campaign-x" },
      ],
    };
    const { result } = renderHook(() => useDynamicForm(submitConfig));
    const onSubmit = vi.fn();
    await act(async () => {
      await result.current.form.handleSubmit(onSubmit)();
    });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ utm: "campaign-x" }), undefined);
  });

  it("condition-hidden required field does not block submit", async () => {
    const conditionalConfig: FormConfig = {
      id: "c",
      fields: [
        { type: "checkbox", name: "other" },
        { type: "text", name: "details", required: true, visibleWhen: { field: "other", equals: true } },
      ],
    };
    const { result } = renderHook(() => useDynamicForm(conditionalConfig));
    const onSubmit = vi.fn();
    await act(async () => {
      await result.current.form.handleSubmit(onSubmit)();
    });
    expect(onSubmit).toHaveBeenCalled();
  });

  it("condition-hidden value is absent from submit payload (schema strip-mode)", async () => {
    const conditionalConfig: FormConfig = {
      id: "c",
      fields: [
        { type: "checkbox", name: "other" },
        { type: "text", name: "details", visibleWhen: { field: "other", equals: true } },
      ],
    };
    const { result } = renderHook(() => useDynamicForm(conditionalConfig));
    const onSubmit = vi.fn();
    await act(async () => {
      result.current.form.setValue("details", "stale");
    });
    await act(async () => {
      await result.current.form.handleSubmit(onSubmit)();
    });
    expect(onSubmit).toHaveBeenCalled();
    expect("details" in onSubmit.mock.calls[0][0]).toBe(false);
  });

  it("pins v1 limitation: condition-hidden field INSIDE a group still validates", async () => {
    const groupConfig: FormConfig = {
      id: "g",
      fields: [
        {
          type: "group",
          name: "team",
          min: 1,
          fields: [
            { type: "checkbox", name: "hasRole" },
            { type: "text", name: "role", required: true, visibleWhen: { field: "hasRole", equals: true } },
          ],
        },
      ],
    };
    const { result } = renderHook(() => useDynamicForm(groupConfig));
    const onSubmit = vi.fn();
    await act(async () => {
      await result.current.form.handleSubmit(onSubmit)();
    });
    // Documented v1 limitation — inner conditions are not skipped by validation.
    // When row-scoped condition support lands, flip this assertion.
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("re-validates a touched confirm field when its matches source changes", async () => {
    const confirmConfig: FormConfig = {
      id: "cf",
      fields: [
        { type: "password", name: "password", label: "Password", required: true },
        { type: "password", name: "confirm", required: true, rules: { matches: "password" } },
      ],
    };
    const { result } = renderHook(() => useDynamicForm(confirmConfig));
    await act(async () => {
      result.current.form.setValue("password", "secret1");
      result.current.form.setValue("confirm", "secret2", { shouldTouch: true });
      await result.current.form.trigger("confirm");
    });
    expect(result.current.form.getFieldState("confirm").error?.message).toBe(
      defaultMessages.matches("Password"),
    );

    // Fixing the SOURCE must clear the confirm error without touching confirm.
    await act(async () => {
      result.current.form.setValue("password", "secret2");
    });
    await waitFor(() => expect(result.current.form.getFieldState("confirm").error).toBeUndefined());

    // Breaking it from the source side must surface the error again.
    await act(async () => {
      result.current.form.setValue("password", "different");
    });
    await waitFor(() =>
      expect(result.current.form.getFieldState("confirm").error?.message).toBe(
        defaultMessages.matches("Password"),
      ),
    );
  });

  it("does not surface a matches error on an untouched confirm when the source changes", async () => {
    const confirmConfig: FormConfig = {
      id: "cf",
      fields: [
        { type: "password", name: "password", required: true },
        { type: "password", name: "confirm", required: true, rules: { matches: "password" } },
      ],
    };
    const { result } = renderHook(() => useDynamicForm(confirmConfig));
    await act(async () => {
      result.current.form.setValue("password", "secret1");
    });
    // onTouched semantics preserved: confirm never validated, no error appears.
    expect(result.current.form.getFieldState("confirm").isTouched).toBe(false);
    expect(result.current.form.getFieldState("confirm").error).toBeUndefined();
  });

  it("condition-visible required field blocks submit", async () => {
    const conditionalConfig: FormConfig = {
      id: "c",
      fields: [
        { type: "checkbox", name: "other" },
        { type: "text", name: "details", required: true, visibleWhen: { field: "other", equals: true } },
      ],
    };
    const { result } = renderHook(() => useDynamicForm(conditionalConfig));
    const onSubmit = vi.fn();
    await act(async () => {
      result.current.form.setValue("other", true);
    });
    await act(async () => {
      await result.current.form.handleSubmit(onSubmit)();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("details").error?.message).toBe("This field is required");
  });
});
