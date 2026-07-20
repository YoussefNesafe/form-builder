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
