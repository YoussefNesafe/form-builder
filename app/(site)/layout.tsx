import { SiteNav } from "@/components/site/SiteNav";

/**
 * Shared shell for every marketing/docs/examples route (everything except
 * /builder, which stays outside this group — chrome-minimal, no SiteNav).
 * Hoisted from the page.tsx / docs layout.tsx / examples layout.tsx that
 * used to each render this same `<div><SiteNav />{children}</div>` wrapper
 * independently. Page-specific containers (docs sidebar shell, examples
 * narrow column, landing sections) stay in their own files.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteNav />
      {children}
    </div>
  );
}
