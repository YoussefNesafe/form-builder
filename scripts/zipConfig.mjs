/**
 * Single source for the generated zip's filename — imported by both the
 * build script (scripts/zip-form-builder.mjs, which writes
 * public/<FORM_BUILDER_ZIP_BASENAME>) and the installation page's download
 * button (components/docs/installation/CopyPackageFolderSection.tsx, which
 * links to FORM_BUILDER_ZIP_PUBLIC_PATH). Plain JS on purpose: the build
 * script runs via `node scripts/zip-form-builder.mjs` with no TS loader, so
 * this can't be a .ts file — the .tsx side imports it fine too (allowJs).
 * Change the filename here and both sides — and both tests pinning them —
 * move together instead of one silently drifting into a 404.
 */
export const FORM_BUILDER_ZIP_BASENAME = "form-builder.zip";
export const FORM_BUILDER_ZIP_PUBLIC_PATH = `/${FORM_BUILDER_ZIP_BASENAME}`;
