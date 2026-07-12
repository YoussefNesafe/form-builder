import { EXAMPLES_CONTAINER } from "@/components/shared/containers";
import { cn } from "@/lib/utils";

export default function ExamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      id="main-content"
      className={cn(
        EXAMPLES_CONTAINER,
        "flex-1 py-[8.544vw] tablet:py-[5vw] desktop:py-[2.496vw]",
      )}
    >
      {children}
    </main>
  );
}
