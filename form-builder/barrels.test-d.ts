import { describe, it, expectTypeOf } from "vitest";

/**
 * The public surface, reached the way a consumer reaches it.
 *
 * Every other file in this package imports its neighbours by relative path
 * (`../core/fileAccept`). A consumer cannot: they get `@/form-builder` and
 * `@/form-builder/headless`, resolved through the `paths` mapping in
 * `tsconfig.json` (mirrored by the alias in `vitest.config.ts`). That gap is
 * the whole reason this file exists — a symbol can typecheck perfectly at
 * `../core/fileAccept` and still be unreachable at `@/form-builder`, because
 * reaching it there is a fact about the barrel, not about the module that
 * declares it. Nothing below may import a relative path.
 *
 * `typeof import(...)` keeps the file entirely type-level: no module is
 * loaded, so nothing here depends on a barrel's runtime side effects, and the
 * two `"use client"` component trees behind `index.ts` are never evaluated.
 *
 * Naming a type through `import("@/form-builder").X` IS the assertion — an
 * unexported `X` is a compile error, which vitest's typecheck mode reports as
 * a failure. The `expectTypeOf` calls pin the shapes on top of that.
 *
 * One thing deliberately NOT asserted: that a type is *absent* from a barrel.
 * `keyof` sees only value exports, and writing the type's name to prove it is
 * missing is itself a compile error. Type placement is held by the rule stated
 * on the two barrels and by the value-level split enumerated below.
 */
type Index = typeof import("@/form-builder");
type Headless = typeof import("@/form-builder/headless");

describe("the barrel split", () => {
  it("gives index.ts every value headless.ts has", () => {
    // `index.ts` is the in-repo/copy-in entry and `headless.ts` the npm one;
    // the app imports only the former, so anything the npm consumer gets must
    // also be there. Superset, never a fork.
    expectTypeOf<Exclude<keyof Headless, keyof Index>>().toEqualTypeOf<never>();
  });

  it("keeps exactly the rendered UI layer out of headless.ts", () => {
    // Enumerated, not counted: a bare number names none of its members, so it
    // desynchronises silently. Adding a value export to `index.ts` alone must
    // be a deliberate act that shows up here — either it belongs to the
    // rendering layer and joins this list, or it belongs in both barrels.
    expectTypeOf<Exclude<keyof Index, keyof Headless>>().toEqualTypeOf<
      | "FormRenderer"
      | "FormSection"
      | "FieldWrapper"
      | "fieldAriaDescribedBy"
      | "FileDropzone"
      | "useFieldRuntime"
      | "useFieldDisabled"
      | "registerBuiltInFields"
    >();
  });
});

describe("autosave storage, from both barrels", () => {
  it("lets a consumer name the option AutosaveOptions.storage accepts", () => {
    expectTypeOf<import("@/form-builder").DraftStorageOption>().toEqualTypeOf<
      import("@/form-builder/headless").DraftStorageOption
    >();
    expectTypeOf<import("@/form-builder").AutosaveOptions["storage"]>().toEqualTypeOf<
      import("@/form-builder").DraftStorageOption | undefined
    >();
  });

  it("lets a consumer annotate a custom store without reaching into core/", () => {
    // The reason DraftStorage is public at all: a module-scope adapter wants an
    // annotation, and `AutosaveOptions["storage"]` also admits "local"/"session",
    // so it cannot serve as one.
    type Store = import("@/form-builder/headless").DraftStorage;
    const memory: Store = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
    expectTypeOf(memory).toExtend<import("@/form-builder").DraftStorageOption>();
  });
});

describe("file-accept prose, from both barrels", () => {
  it("exposes the accepted-format list a custom file field needs for its hint", () => {
    expectTypeOf<typeof import("@/form-builder").acceptedFormatsLabel>().toEqualTypeOf<
      (accept: string | undefined) => string
    >();
    expectTypeOf<typeof import("@/form-builder/headless").acceptedFormatsLabel>().toEqualTypeOf<
      (accept: string | undefined) => string
    >();
  });
});

describe("the rendering layer, from index.ts only", () => {
  it("names the stepper orientation a host passes to FormRenderer", () => {
    expectTypeOf<import("@/form-builder").StepperOrientation>().toEqualTypeOf<
      "horizontal" | "vertical"
    >();
  });

  it("names the payload a standalone onDraftRestore handler receives", () => {
    // Without this name the only way to write the handler outside the JSX is
    // Parameters<NonNullable<ComponentProps<typeof FormRenderer>["onDraftRestore"]>>[0].
    expectTypeOf<import("@/form-builder").DraftRestoreInfo>().toEqualTypeOf<{ step?: number }>();
    const handler = (info: import("@/form-builder").DraftRestoreInfo) => info.step;
    expectTypeOf(handler).toExtend<
      NonNullable<Parameters<typeof import("@/form-builder").FormRenderer>[0]["onDraftRestore"]>
    >();
  });

  it("names the dropzone's props so a custom field can wrap it", () => {
    expectTypeOf<import("@/form-builder").FileDropzoneProps["onFiles"]>().toEqualTypeOf<
      (files: File[]) => void
    >();
    expectTypeOf<import("@/form-builder").FileDropzoneProps>().toEqualTypeOf<
      Parameters<typeof import("@/form-builder").FileDropzone>[0]
    >();
  });
});
