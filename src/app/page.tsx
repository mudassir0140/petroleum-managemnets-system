import { CtaSection } from "@/components/cta-section";
import { FeaturesSection } from "@/components/features-section";
import { HeroSection } from "@/components/hero-section";
import { InsightsSection } from "@/components/insights-section";
import { OperationsSection } from "@/components/operations-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <OperationsSection />
        <InsightsSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
