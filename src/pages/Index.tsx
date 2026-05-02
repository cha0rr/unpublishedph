import { TechBackground } from "@/components/landing/TechBackground";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ShowcaseSection } from "@/components/landing/ShowcaseSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { ProofValueSection } from "@/components/landing/ProofValueSection";
import { ForWhoSection } from "@/components/landing/ForWhoSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <TechBackground />
      <Navbar />
      <HeroSection />
      <ProofValueSection />
      <BenefitsSection />
      <ForWhoSection />
      <HowItWorks />
      <ShowcaseSection />
      <SocialProofSection />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
