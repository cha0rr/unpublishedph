import { TechBackground } from "@/components/landing/TechBackground";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PainSection } from "@/components/landing/PainSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { ShowcaseSection } from "@/components/landing/ShowcaseSection";
import { DifferentialSection } from "@/components/landing/DifferentialSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <TechBackground />
      <Navbar />
      <HeroSection />
      <PainSection />
      <SolutionSection />
      <HowItWorks />
      <UseCasesSection />
      <ShowcaseSection />
      <DifferentialSection />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
