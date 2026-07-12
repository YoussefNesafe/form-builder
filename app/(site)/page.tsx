import { BuilderCodeSplit } from "@/components/home/BuilderCodeSplit";
import { ComparisonStrip } from "@/components/home/ComparisonStrip";
import { DemoSection } from "@/components/home/DemoSection";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { FinalCta } from "@/components/home/FinalCta";
import { HeroSection } from "@/components/home/HeroSection";
import { ShowcaseSection } from "@/components/home/ShowcaseSection";
import { LANDING_CONTAINER } from "@/components/shared/containers";
import { cn } from "@/lib/utils";

/**
 * Marketing landing page. Server Component throughout except the hero demo
 * panel (components/home/LandingDemoForm, isolated to its own client leaf
 * inside DemoSection) — everything else here is static markup, no
 * interactivity to justify a client boundary. Accent color is budgeted
 * deliberately (see each section's own comments); default to grayscale
 * unless a section is explicitly called out.
 */
export default function Home() {
  return (
    <main id="main-content" className="flex-1">
      <div className={cn(LANDING_CONTAINER, "flex flex-col")}>
        <HeroSection />
        <ShowcaseSection />
        <DemoSection />
        <BuilderCodeSplit />
        <FeatureGrid />
        <ComparisonStrip />
        <FinalCta />
      </div>
    </main>
  );
}
