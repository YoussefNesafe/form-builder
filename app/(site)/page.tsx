import { CapabilitiesSection } from "@/components/home/CapabilitiesSection";
import { ComparisonStrip } from "@/components/home/ComparisonStrip";
import { FlagshipSplit } from "@/components/home/FlagshipSplit";
import { HeroSection } from "@/components/home/HeroSection";
import { ShowcaseSection } from "@/components/home/ShowcaseSection";
import { LANDING_CONTAINER } from "@/components/shared/containers";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main id="main-content" className="flex-1">
      <div className={cn(LANDING_CONTAINER, "flex flex-col")}>
        <HeroSection />
        <ShowcaseSection />
        <FlagshipSplit />
        <CapabilitiesSection />
        <ComparisonStrip />
      </div>
    </main>
  );
}
