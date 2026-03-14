import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { ModesSection } from "@/components/landing/ModesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ShowcaseSection } from "@/components/landing/ShowcaseSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <BenefitsSection />
      <ModesSection />
      <HowItWorks />
      <ShowcaseSection />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
