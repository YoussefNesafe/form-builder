import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { DocsBreadcrumb } from "@/components/docs/DocsBreadcrumb";
import { DOCS_CONTAINER } from "@/components/shared/containers";
import { cn } from "@/lib/utils";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        DOCS_CONTAINER,
        "flex flex-1 flex-col desktop:flex-row items-start gap-0 tablet:gap-0 desktop:gap-[2.08vw]",
      )}
    >
      <DocsSidebar />
      <main
        id="main-content"
        className="min-w-0 w-full flex-1 py-[7.476vw] tablet:py-[4.5vw] desktop:py-[2.496vw]"
      >
        <DocsBreadcrumb />
        {children}
        <div>
          <DocsPagination />
        </div>
      </main>
    </div>
  );
}
