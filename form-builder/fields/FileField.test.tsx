// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { registerBuiltInFields } from ".";
import { defaultMessages } from "../core/messages";
import type { AnyFieldConfig } from "../core/types";
import { FormRenderer } from "../components/FormRenderer";

registerBuiltInFields();
afterEach(cleanup);

const noop = () => {};
const LABEL = "Identity documents";

function renderField(overrides: Partial<Extract<AnyFieldConfig, { type: "file" }>> = {}) {
  const field = { type: "file", name: "docs", label: LABEL, ...overrides } as AnyFieldConfig;
  return render(<FormRenderer config={{ id: "kyc", fields: [field] }} onSubmit={noop} />);
}

/**
 * The dropzone by its styling seam, not by walking up from the input — the
 * `data-slot` is the hook a consumer restyles it through, so it is part of the
 * component's surface rather than an incidental detail of its markup.
 */
function dropzone(): HTMLElement {
  const el = document.querySelector('[data-slot="file-dropzone"]');
  if (!el) throw new Error("no dropzone rendered");
  return el as HTMLElement;
}

/**
 * The file input by accessible name. `input[type=file]` maps to no ARIA role,
 * so `getByRole` can never find it; its name is the only handle there is, which
 * is exactly why every query here goes through one.
 */
// Not `LABEL` exactly: a required field's label text carries the `*` too.
function fileInput(name: string | RegExp = new RegExp(`^${LABEL}`)): HTMLInputElement {
  return screen.getByLabelText(name, { selector: "input" }) as HTMLInputElement;
}

function describedText(input: HTMLElement): string {
  return (input.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ");
}

function pick(files: File[]) {
  const input = fileInput();
  Object.defineProperty(input, "files", { value: files, configurable: true });
  fireEvent.change(input);
}

function drop(files: File[]) {
  return fireEvent.drop(dropzone(), { dataTransfer: { files, types: ["Files"] } });
}

const pdf = () => new File(["x"], "passport.pdf", { type: "application/pdf" });
const tiff = () => new File(["x"], "scan.tiff", { type: "image/tiff" });
/** 2 MB — over every `maxSizeMB: 1` in this file. */
const bigPdf = () => new File([new Uint8Array(2 * 1024 * 1024)], "statement.pdf", { type: "application/pdf" });
/** Wrong format *and* oversized, so the two issues race for the same row. */
const bigTiff = () => new File([new Uint8Array(2 * 1024 * 1024)], "deed.tiff", { type: "image/tiff" });

const rejection = (reason: string) => defaultMessages.fileRejected(reason);
const wrongFormat = (name: string, ext: string, formats: string) =>
  rejection(defaultMessages.fileTypeRejected(name, ext, formats));
const tooBig = (mb: number) => rejection(defaultMessages.fileSize(mb));

describe("FileDropzone naming and description", () => {
  it("is named by the field label and the drop prompt together", () => {
    renderField();

    // Two <label for> elements point at one input, so both contribute — the
    // field label leads and the prompt follows it.
    expect(fileInput(LABEL)).toBe(fileInput(new RegExp(defaultMessages.dropFiles)));
  });

  it("takes the field's placeholder as the prompt when it has one", () => {
    renderField({ placeholder: "Attach your passport" });

    expect(fileInput(/Attach your passport/)).toBeTruthy();
    expect(screen.queryByLabelText(new RegExp(defaultMessages.dropFiles))).toBeNull();
  });

  it("carries the accepted formats and the size ceiling as a description", () => {
    renderField({ accept: ".pdf,.jpg,.png", maxSizeMB: 5 });

    // acceptedFormatsLabel writes the list; the hint must not re-split `accept`.
    expect(describedText(fileInput())).toContain("PDF, JPG or PNG, max 5 MB");
  });

  it("keeps the hint out of the name", () => {
    renderField({ accept: ".pdf", maxSizeMB: 5 });

    // A name is for identifying the control, not for listing its constraints —
    // and a name that grew every time `accept` did would be unusable.
    expect(screen.queryByLabelText(/max 5 MB/)).toBeNull();
  });

  it("names only the formats when there is no size ceiling", () => {
    renderField({ accept: ".pdf" });

    expect(describedText(fileInput())).toContain("PDF");
    expect(describedText(fileInput())).not.toContain("max");
  });

  it("names only the ceiling when there is no accept", () => {
    renderField({ maxSizeMB: 5 });

    expect(describedText(fileInput())).toContain("max 5 MB");
  });

  it("renders no hint at all when the field constrains nothing", () => {
    renderField({ description: "Any document is fine" });

    // The empty hint has to take its element with it: an id in
    // aria-describedby pointing at an empty node is a description of nothing.
    expect(describedText(fileInput()).trim()).toBe("Any document is fine");
  });

  it("still describes the field when accept names no format we can write out", () => {
    // "pdf" (no dot) is uninterpretable, so every file is rejected and
    // acceptedFormatsLabel returns "" — the path most likely to be seen, not
    // the least. The ceiling must still get through on its own.
    renderField({ accept: "pdf", maxSizeMB: 5 });

    expect(describedText(fileInput())).toContain("max 5 MB");
  });
});

describe("FileDropzone is a drop surface, not a widget", () => {
  it("exposes no role and takes no focus", () => {
    renderField();
    const zone = dropzone();

    // The whole design rests on this: the drop surface catches drag events and
    // nothing else, and the keyboard path is the file input inside it. A role
    // or a tabindex here would put an unnamed, unoperable widget in the tab
    // order in front of the control that actually works. Measured: adding
    // `role="button" tabIndex={0}` to this element passes every other
    // assertion in this file, which is exactly why it needs its own.
    expect(zone.getAttribute("role")).toBeNull();
    expect(zone.getAttribute("tabindex")).toBeNull();
    zone.focus();
    expect(document.activeElement).not.toBe(zone);
  });

  it("puts the focus on the file input instead", () => {
    renderField();

    const input = fileInput();
    input.focus();
    expect(document.activeElement).toBe(input);
  });
});

describe("FileDropzone dragging", () => {
  it("prevents the default on dragover, so the browser does not navigate to the file", () => {
    renderField();

    // `dispatchEvent` returns false exactly when a cancelable event was
    // prevented. Without this the page is replaced by the dropped file.
    expect(fireEvent.dragOver(dropzone(), { dataTransfer: { files: [], types: ["Files"] } })).toBe(false);
  });

  it("prevents the default on drop as well", () => {
    renderField();

    expect(drop([pdf()])).toBe(false);
  });

  it("takes the dropped files into the value", async () => {
    renderField({ multiple: true });

    drop([pdf(), tiff()]);

    await waitFor(() => expect(screen.getByText("passport.pdf")).toBeTruthy());
    expect(screen.getByText("scan.tiff")).toBeTruthy();
  });

  it("marks itself while a drag is over it and unmarks it on leave", () => {
    renderField();
    const zone = dropzone();

    fireEvent.dragEnter(zone, { dataTransfer: { files: [], types: ["Files"] } });
    expect(zone.getAttribute("data-dragging")).toBe("true");

    fireEvent.dragLeave(zone);
    expect(zone.getAttribute("data-dragging")).toBeNull();
  });

  it("stays marked while the pointer crosses its own children", () => {
    renderField();
    const zone = dropzone();

    // A dragenter on a child is preceded by a dragleave on the parent, so a
    // plain boolean would flicker off the moment the pointer reached the icon.
    fireEvent.dragEnter(zone, { dataTransfer: { files: [], types: ["Files"] } });
    fireEvent.dragEnter(zone, { dataTransfer: { files: [], types: ["Files"] } });
    fireEvent.dragLeave(zone);

    expect(zone.getAttribute("data-dragging")).toBe("true");
  });

  it("unmarks itself once the files land", () => {
    renderField();
    const zone = dropzone();

    fireEvent.dragEnter(zone, { dataTransfer: { files: [], types: ["Files"] } });
    drop([pdf()]);

    expect(zone.getAttribute("data-dragging")).toBeNull();
  });

  it("ignores a drop while disabled", () => {
    renderField({ disabled: true });

    drop([pdf()]);

    expect(screen.queryByText("passport.pdf")).toBeNull();
  });
});

describe("FileField per-file status", () => {
  it("gives every rejected file its own reason", async () => {
    // The regression this component shipped with: per-index issues leave
    // `fieldState.error.message` undefined, so passing the error straight to
    // FieldWrapper rendered nothing whatsoever for a multi-file rejection.
    renderField({ multiple: true, accept: ".pdf", maxSizeMB: 1 });

    pick([pdf(), tiff(), bigPdf()]);

    await waitFor(() =>
      expect(screen.getByText(wrongFormat("scan.tiff", "TIFF", "PDF"))).toBeTruthy(),
    );
    expect(screen.getByText(tooBig(1))).toBeTruthy();
  });

  it("names the format it refused instead of failing generically", async () => {
    renderField({ multiple: true, accept: ".pdf,.jpg,.png", maxSizeMB: 5 });

    pick([tiff()]);

    await waitFor(() =>
      expect(
        screen.getByText(wrongFormat("scan.tiff", "TIFF", "PDF, JPG or PNG")),
      ).toBeTruthy(),
    );
  });

  it("reports the format when a file is both the wrong type and too large", async () => {
    // Both issues land on the same path and only the first survives RHF's
    // firstError mapping; validation emits type first because it is the more
    // actionable of the two.
    renderField({ multiple: true, accept: ".pdf", maxSizeMB: 1 });

    pick([bigTiff()]);

    await waitFor(() => expect(screen.getByText(wrongFormat("deed.tiff", "TIFF", "PDF"))).toBeTruthy());
    expect(screen.queryByText(tooBig(1))).toBeNull();
  });

  it("leaves an accepted file with no reason of its own", async () => {
    renderField({ multiple: true, accept: ".pdf", maxSizeMB: 1 });

    pick([pdf(), tiff()]);

    await waitFor(() => expect(screen.getByText(wrongFormat("scan.tiff", "TIFF", "PDF"))).toBeTruthy());
    // Structural, deliberately: "no reason on row 0" is an absence, and an
    // absence cannot be queried by accessible name. `data-slot`/`data-rejected`
    // are the restyling seam this component publishes, so this asserts a
    // documented surface rather than incidental markup — but it is the one
    // place in this file that reads the DOM instead of the a11y tree, and the
    // presence half is still pinned by `getByText` above.
    const rows = document.querySelectorAll('[data-slot="file-row"]');
    expect(rows[0].getAttribute("data-rejected")).toBeNull();
    expect(rows[1].getAttribute("data-rejected")).toBe("");
  });

  it("keeps the rejected file in the value so it can explain itself", async () => {
    renderField({ multiple: true, accept: ".pdf" });

    pick([tiff()]);

    // Refusing it outright would leave the user with an empty field and no
    // stated cause; the schema only has something to say about what it holds.
    await waitFor(() => expect(screen.getByText("scan.tiff")).toBeTruthy());
    expect(screen.getByText(wrongFormat("scan.tiff", "TIFF", "PDF"))).toBeTruthy();
  });

  it("announces the first rejection through the field's alert region", async () => {
    renderField({ multiple: true, accept: ".pdf", maxSizeMB: 1 });

    pick([pdf(), bigPdf(), tiff()]);

    // The rows are static text; this is the only part of the field that speaks
    // up on its own when something goes wrong.
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(defaultMessages.fileSize(1)));
  });

  it("reports a single-file rejection on its row and at field level", async () => {
    renderField({ accept: ".pdf" });

    pick([tiff()]);

    // A single-file field reports at its own path, so the shape RHF hands back
    // is a plain FieldError rather than the sparse array.
    await waitFor(() => expect(screen.getByText(wrongFormat("scan.tiff", "TIFF", "PDF"))).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toBe(
      defaultMessages.fileTypeRejected("scan.tiff", "TIFF", "PDF"),
    );
  });

  it("keeps a list-level message off the rows", async () => {
    renderField({ multiple: true, required: true });

    // Emptying a required list is how a multi-file field reaches a list-level
    // rule: `min(1)` is the only one it has, and it can only fail on an empty
    // array. RHF reports it as a plain FieldError — the same shape a
    // single-file field uses for *its own file's* reason — so `multiple` is
    // what keeps it from being read as file 0's reason. There is no file 0.
    pick([pdf()]);
    await waitFor(() => expect(screen.getByText("passport.pdf")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: defaultMessages.removeFile("passport.pdf") }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(defaultMessages.required));
    expect(document.querySelectorAll('[data-slot="file-row"]').length).toBe(0);
  });

  it("clears the reason once the offending file is removed", async () => {
    renderField({ multiple: true, accept: ".pdf" });

    pick([pdf(), tiff()]);
    await waitFor(() => expect(screen.getByText(wrongFormat("scan.tiff", "TIFF", "PDF"))).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: defaultMessages.removeFile("scan.tiff") }));

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(screen.getByText("passport.pdf")).toBeTruthy();
  });

  it("returns focus to the dropzone after removing a row", async () => {
    renderField({ multiple: true });

    pick([pdf()]);
    await waitFor(() => expect(screen.getByText("passport.pdf")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: defaultMessages.removeFile("passport.pdf") }));

    // The button that had focus is gone; without this a keyboard user is back
    // on <body> and restarts from the top of the page.
    await waitFor(() => expect(document.activeElement).toBe(fileInput()));
  });
});

describe("FileField selection status", () => {
  it("has a status region in the document before anything is selected", () => {
    renderField({ multiple: true });

    // A live region created and filled in the same commit is not announced, so
    // the region has to outlive the empty state.
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("reports the count, in words, as files arrive", async () => {
    renderField({ multiple: true });

    pick([pdf()]);
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("1 file selected"));

    pick([tiff()]);
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("2 files selected"));
  });

  it("counts a rejected file as selected, because it is", async () => {
    renderField({ multiple: true, accept: ".pdf" });

    pick([tiff()]);

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("1 file selected"));
  });
});
