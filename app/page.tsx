import { Metadata } from "next";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/sections/hero-section";
import ScannerPreview from "@/components/sections/scanner-panel";
import FeaturesSection from "@/components/sections/feature-card";
import HowItWorks from "@/components/sections/how-it-works";
import EcosystemSection from "@/components/sections/ecosystem-section";

export const metadata: Metadata = {
  title: "IntentGuard — Web3 Threat Protection",
  description:
    "Understand transaction risks, inspect suspicious addresses, and analyze smart contracts before interacting with Web3.",
};

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ScannerPreview />
        <FeaturesSection />
        <HowItWorks />
        <EcosystemSection />
      </main>
      <Footer />
    </div>
  );
}
