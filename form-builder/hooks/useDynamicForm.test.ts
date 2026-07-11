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

  it("hidden-step required fields do not block submit and are stripped from the payload", async () => {
    const steppedConfig: FormConfig = {
      id: "cs",
      fields: [
        { type: "checkbox", name: "wantsExtras" },
        { type: "text", name: "extra", required: true },
      ],
      steps: [
        { title: "Base", fieldNames: ["wantsExtras"] },
        { title: "Extras", fieldNames: ["extra"], visibleWhen: { field: "wantsExtras", equals: true } },
      ],
    };
    const { result } = renderHook(() => useDynamicForm(steppedConfig));
    const onSubmit = vi.fn();
    await act(async () => {
      result.current.form.setValue("extra", "stale");
      await result.current.form.handleSubmit(onSubmit)();
    });
    expect(onSubmit).toHaveBeenCalled();
    expect("extra" in onSubmit.mock.calls[0][0]).toBe(false);

    // Step visible → its required field blocks again.
    onSubmit.mockClear();
    await act(async () => {
      result.current.form.setValue("wantsExtras", true);
      result.current.form.setValue("extra", "");
      await result.current.form.handleSubmit(onSubmit)();
    });
    expect(onSubmit).not.toHaveBeenCalled();
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

  it("autosave: persists values (debounced) and restores them on the next mount", async () => {
    window.localStorage.clear();
    const draftConfig: FormConfig = {
      id: "draft-form",
      fields: [
        { type: "text", name: "name" },
        { type: "email", name: "email" },
      ],
    };
    const first = renderHook(() => useDynamicForm(draftConfig, { autosave: { debounceMs: 0 } }));
    await act(async () => {
      first.result.current.form.setValue("name", "Ada");
    });
    await waitFor(() =>
      expect(window.localStorage.getItem("form-builder:draft:draft-form")).toContain("Ada"),
    );
    first.unmount();

    const second = renderHook(() => useDynamicForm(draftConfig, { autosave: { debounceMs: 0 } }));
    await waitFor(() => expect(second.result.current.form.getValues("name")).toBe("Ada"));

    // clear() drops the entry.
    act(() => second.result.current.draft!.clear());
    expect(window.localStorage.getItem("form-builder:draft:draft-form")).toBeNull();
  });

  it("autosave: a draft from a different fields config is ignored and dropped", async () => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "form-builder:draft:draft-form",
      JSON.stringify({ hash: "stale", values: { name: "Old" } }),
    );
    const draftConfig: FormConfig = { id: "draft-form", fields: [{ type: "text", name: "name" }] };
    const { result } = renderHook(() => useDynamicForm(draftConfig, { autosave: {} }));
    await act(async () => {});
    expect(result.current.form.getValues("name")).toBe("");
    expect(window.localStorage.getItem("form-builder:draft:draft-form")).toBeNull();
  });

  it("autosave: clear() cancels a pending debounced save (no draft resurrection)", async () => {
    window.localStorage.clear();
    vi.useFakeTimers();
    try {
      const draftConfig: FormConfig = { id: "draft-form", fields: [{ type: "text", name: "name" }] };
      const { result } = renderHook(() =>
        useDynamicForm(draftConfig, { autosave: { debounceMs: 60_000 } }),
      );
      // Flush the restore effect so noteStep/clear guards are armed.
      await act(async () => {});
      act(() => {
        result.current.form.setValue("name", "typed just before submit");
      });
      // Clean submit path: clear while the save is still pending.
      act(() => result.current.draft!.clear());
      act(() => {
        vi.advanceTimersByTime(120_000);
      });
      expect(window.localStorage.getItem("form-builder:draft:draft-form")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("no autosave option: no draft api, nothing written", async () => {
    window.localStorage.clear();
    const { result } = renderHook(() => useDynamicForm(config));
    await act(async () => {
      result.current.form.setValue("firstName", "x");
    });
    expect(result.current.draft).toBeUndefined();
    expect(window.localStorage.length).toBe(0);
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
