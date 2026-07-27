// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { acceptedFormatsLabel, fileExtensionLabel, fileMatchesAccept } from "./fileAccept";

const file = (name: string, type: string) => new File(["x"], name, { type });

describe("fileMatchesAccept", () => {
  it("accepts everything when accept is empty or absent", () => {
    expect(fileMatchesAccept(file("a.tiff", "image/tiff"), undefined)).toBe(true);
    expect(fileMatchesAccept(file("a.tiff", "image/tiff"), "  ")).toBe(true);
  });

  it("accepts everything for the wildcard tokens", () => {
    expect(fileMatchesAccept(file("a.tiff", "image/tiff"), "*/*")).toBe(true);
    expect(fileMatchesAccept(file("a.tiff", "image/tiff"), "*")).toBe(true);
  });

  it("matches extension tokens case-insensitively", () => {
    expect(fileMatchesAccept(file("Scan.PDF", ""), ".pdf,.jpg")).toBe(true);
    expect(fileMatchesAccept(file("scan.pdf", ""), ".PDF")).toBe(true);
    expect(fileMatchesAccept(file("scan.tiff", ""), ".pdf,.jpg")).toBe(false);
  });

  it("matches the end of the name only, not an extension buried in it", () => {
    expect(fileMatchesAccept(file("payslip.pdf.exe", "application/x-msdownload"), ".pdf")).toBe(
      false,
    );
  });

  it("matches exact and wildcard MIME tokens", () => {
    expect(fileMatchesAccept(file("a.png", "image/png"), "image/*")).toBe(true);
    expect(fileMatchesAccept(file("a.pdf", "application/pdf"), "image/*")).toBe(false);
    expect(fileMatchesAccept(file("a.pdf", "application/pdf"), "application/pdf")).toBe(true);
  });

  it("rejects a file the browser gave no MIME type for unless an extension is listed", () => {
    expect(fileMatchesAccept(file("scan.pdf", ""), "application/pdf")).toBe(false);
    expect(fileMatchesAccept(file("scan.png", ""), "image/*")).toBe(false);
    expect(fileMatchesAccept(file("scan.pdf", ""), ".pdf,application/pdf")).toBe(true);
  });

  it("rejects a token it cannot interpret rather than accepting it", () => {
    expect(fileMatchesAccept(file("a.pdf", "application/pdf"), "pdf")).toBe(false);
  });

  it("does not let a bare dot or empty token match everything", () => {
    expect(fileMatchesAccept(file("noext", ""), ".pdf")).toBe(false);
    expect(fileMatchesAccept(file("noext", ""), ".pdf,")).toBe(false);
    // A name ending in a dot is what pins the bare-dot filter: without it the
    // "." token would match this via endsWith(".").
    expect(fileMatchesAccept(file("scan.", ""), ".pdf,.")).toBe(false);
  });

  it("treats an accept made only of empty tokens as no constraint", () => {
    expect(fileMatchesAccept(file("a.tiff", "image/tiff"), " , . ")).toBe(true);
  });
});

describe("acceptedFormatsLabel", () => {
  it("names extension tokens without the dot", () => {
    expect(acceptedFormatsLabel(".pdf")).toBe("PDF");
  });

  it("joins with commas and 'or' before the last", () => {
    expect(acceptedFormatsLabel(".pdf,.jpg")).toBe("PDF or JPG");
    expect(acceptedFormatsLabel(".pdf,.jpg,.png")).toBe("PDF, JPG or PNG");
  });

  it("names a MIME token by its subtype", () => {
    expect(acceptedFormatsLabel("application/pdf")).toBe("PDF");
  });

  it("names a type wildcard in prose rather than as a glob", () => {
    expect(acceptedFormatsLabel("image/*")).toBe("images");
    expect(acceptedFormatsLabel("audio/*")).toBe("audio files");
    expect(acceptedFormatsLabel("model/*")).toBe("model files");
  });

  // ".pdf,application/pdf" is the pairing fileMatchesAccept's own docs recommend
  // for files the browser cannot type, so it must not read "PDF or PDF".
  it("collapses tokens that name the same format", () => {
    expect(acceptedFormatsLabel(".pdf,application/pdf")).toBe("PDF");
  });

  it("omits tokens that name no format, so nothing unmatchable is advertised", () => {
    expect(acceptedFormatsLabel(".pdf,*/*")).toBe("PDF");
    expect(acceptedFormatsLabel(".pdf,pdf")).toBe("PDF");
  });

  it("returns an empty string when accept names no format at all", () => {
    expect(acceptedFormatsLabel(undefined)).toBe("");
    expect(acceptedFormatsLabel("*")).toBe("");
    expect(acceptedFormatsLabel(" , . ")).toBe("");
  });
});

describe("fileExtensionLabel", () => {
  it("returns an uppercase extension without the dot", () => {
    expect(fileExtensionLabel(file("scan.tiff", ""))).toBe("TIFF");
  });

  it("returns the last segment of a multi-dot name", () => {
    expect(fileExtensionLabel(file("scan.tar.gz", ""))).toBe("GZ");
  });

  it("returns an empty string when there is no extension", () => {
    expect(fileExtensionLabel(file("scan", ""))).toBe("");
    expect(fileExtensionLabel(file("scan.", ""))).toBe("");
  });

  it("treats a leading-dot name as all extension", () => {
    expect(fileExtensionLabel(file(".gitignore", ""))).toBe("GITIGNORE");
  });
});
