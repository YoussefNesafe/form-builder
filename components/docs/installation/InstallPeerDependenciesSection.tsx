import { CommandBlock } from "@/components/docs/CommandBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "install-peer-dependencies";
const title = "Install peer dependencies";

const PEER_DEPENDENCIES = `react-hook-form @hookform/resolvers zod zustand \\
  class-variance-authority clsx tailwind-merge cmdk date-fns \\
  react-day-picker input-otp libphonenumber-js react-phone-number-input \\
  signature_pad lucide-react radix-ui tw-animate-css`;

function Section() {
  return (
    <DocsSection id={id} title="9. Install the runtime peer dependencies">
      <P>These are the libraries the copied field components actually import at runtime:</P>
      <CommandBlock kind="install" args={PEER_DEPENDENCIES} />
      <P>
        Plus <IC>tailwindcss@^4</IC> and <IC>@tailwindcss/postcss</IC> if your project isn&apos;t already on
        Tailwind 4.
      </P>
    </DocsSection>
  );
}

export const InstallPeerDependenciesSection = { id, title, Section };
