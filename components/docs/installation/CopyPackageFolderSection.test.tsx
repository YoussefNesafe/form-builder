// @vitest-environment jsdom
//
// Pins the one hard link between the docs page and the build-time zip
// script (scripts/zip-form-builder.mjs): the download button must point at
// exactly the public path that script writes. Both sides import the same
// scripts/zipConfig.mjs constant (see zip-form-builder.test.mjs for the
// script-side pin), so renaming the zip in one place fails here instead of
// silently 404ing the button.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CopyPackageFolderSection } from "./CopyPackageFolderSection";
import { FORM_BUILDER_ZIP_BASENAME, FORM_BUILDER_ZIP_PUBLIC_PATH } from "@/scripts/zipConfig.mjs";

afterEach(cleanup);

describe("CopyPackageFolderSection", () => {
  it("renders a download link to the build-time zip asset at FORM_BUILDER_ZIP_PUBLIC_PATH", () => {
    render(<CopyPackageFolderSection.Section />);

    const link = screen.getByRole("link", {
      name: (accessibleName) => accessibleName.toLowerCase() === `download ${FORM_BUILDER_ZIP_BASENAME}`.toLowerCase(),
    });
    expect(link.getAttribute("href")).toBe(FORM_BUILDER_ZIP_PUBLIC_PATH);
    expect(link.hasAttribute("download")).toBe(true);
  });
});
