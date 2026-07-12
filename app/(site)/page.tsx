import { CapabilitiesSection } from "@/components/home/CapabilitiesSection";
import { ComparisonStrip } from "@/components/home/ComparisonStrip";
import { FinalCta } from "@/components/home/FinalCta";
import { FlagshipSplit } from "@/components/home/FlagshipSplit";
import { HeroSection } from "@/components/home/HeroSection";
import { ShowcaseSection } from "@/components/home/ShowcaseSection";
import { LANDING_CONTAINER } from "@/components/shared/containers";
import { cn } from "@/lib/utils";

/**
 * Marketing landing page. Six sections, rhythm split -> grid -> split ->
 * panel -> table -> band: HeroSection (live demo merged in), ShowcaseSection,
 * FlagshipSplit (the multi-step-signup example's real config + live form,
 * reused from app/(site)/examples/multi-step-signup — not duplicated),
 * CapabilitiesSection, ComparisonStrip, FinalCta. Server Component throughout
 * except the two live-form leaves (components/home/LandingDemoForm inside
 * HeroSection, and components/home/FlagshipSignupForm inside FlagshipSplit —
 * only the config + OTP stubs are borrowed from the examples route; the leaf
 * itself is lean, scoped-registration) — everything else here is static
 * markup, no
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
        <FlagshipSplit />
        <CapabilitiesSection />
        <ComparisonStrip />
        <FinalCta />
      </div>
    </main>
  );
}
