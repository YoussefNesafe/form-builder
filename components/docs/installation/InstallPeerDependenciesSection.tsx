import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsSection, DocsBody as P, DocsInlineCode as IC } from "@/components/docs/DocsProse";

const id = "install-peer-dependencies";
const title = "Install peer dependencies";

const YARN_ADD_PEERS = `yarn add react-hook-form @hookform/resolvers zod zustand \\
  class-variance-authority clsx tailwind-merge cmdk date-fns \\
  react-day-picker input-otp libphonenumber-js react-phone-number-input \\
  signature_pad lucide-react radix-ui tw-animate-css`;

function Section() {
  return (
    <DocsSection id={id} title="3. Install the runtime peer dependencies">
      <P>These are the libraries the copied field components actually import at runtime:</P>
      <CodeBlock code={YARN_ADD_PEERS} />
      <P>
        Plus <IC>tailwindcss@^4</IC> and <IC>@tailwindcss/postcss</IC> if your project isn&apos;t already on
        Tailwind 4.
      </P>
    </DocsSection>
  );
}

export const InstallPeerDependenciesSection = { id, title, Section };
