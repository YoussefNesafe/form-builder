import type { TocItem } from "@/components/docs/DocsToc";
import { PrerequisitesSection } from "./PrerequisitesSection";
import { InstallCliSection } from "./InstallCliSection";
import { WhatYouGotSection } from "./WhatYouGotSection";
import { UseItSection } from "./UseItSection";
import { TroubleshootingSection } from "./TroubleshootingSection";
import { CopyPackageFolderSection } from "./CopyPackageFolderSection";
import { AddShadcnPrimitivesSection } from "./AddShadcnPrimitivesSection";
import { CssSetupSection } from "./CssSetupSection";
import { InstallPeerDependenciesSection } from "./InstallPeerDependenciesSection";
import { RegisterFieldsSection } from "./RegisterFieldsSection";
import { ImportEntryPointSection } from "./ImportEntryPointSection";

// Ordered registry — single source for both page composition and the TOC.
// Each entry's `id` is the same binding the section passes to its own
// <DocsSection id>, so the TOC anchor can never drift from the heading it
// points at (see components/docs/sections.test.tsx for the guarantee).
//
// Order: the CLI flow leads (Prerequisites -> Install -> What you got -> Use
// it -> Troubleshooting), the pre-CLI manual copy-in flow follows as a
// documented fallback (still accurate, just no longer the first thing a
// reader sees) — see CopyPackageFolderSection's opening paragraph for why
// both exist. Numbering inside each section's own <DocsSection title> runs
// 1-11 straight through both groups.
export const SECTIONS: { id: string; title: string; Section: React.ComponentType }[] = [
  PrerequisitesSection,
  InstallCliSection,
  WhatYouGotSection,
  UseItSection,
  TroubleshootingSection,
  CopyPackageFolderSection,
  AddShadcnPrimitivesSection,
  CssSetupSection,
  InstallPeerDependenciesSection,
  RegisterFieldsSection,
  ImportEntryPointSection,
];

export const TOC_ITEMS: TocItem[] = SECTIONS.map(({ id, title }) => ({ id, title }));
