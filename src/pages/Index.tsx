import { TechBackground } from "@/components/landing/TechBackground";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { WhatYouCanCreate } from "@/components/landing/WhatYouCanCreate";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { WhoIsItFor } from "@/components/landing/WhoIsItFor";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ShowcaseSection } from "@/components/landing/ShowcaseSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { PricingSection } from "@/components/landing/PricingSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <TechBackground />
      <Navbar />
      <HeroSection />
      <WhatYouCanCreate />
      <BenefitsSection />
      <WhoIsItFor />
      <HowItWorks />
      <ShowcaseSection />
      <SocialProof />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
