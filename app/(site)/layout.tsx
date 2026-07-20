import { SiteNav } from "@/components/site/SiteNav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteNav />
      {children}
    </div>
  );
}
