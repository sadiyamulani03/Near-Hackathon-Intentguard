"use client";

import Link from "next/link";
import { Shield, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#4778ff]/10 blur-[120px]" />
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#7557ff]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center lg:max-w-4xl lg:mx-auto">
          <div className="inline-flex items-center gap-2 rounded-md border border-[rgba(148,163,184,0.16)] bg-[#111827] px-3 py-1 text-xs font-medium text-[#94a3b8]">
            Web3 Threat Protection Platform
          </div>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-[#f8fafc] sm:text-6xl">
            Your First Line of Defense Against{" "}
            <span className="text-gradient-primary">Web3 Threats.</span>
          </h1>
          <p className="mt-6 text-lg text-[#94a3b8] max-w-2xl mx-auto sm:text-xl">
            Understand transaction risks, inspect suspicious addresses, and
            analyze smart contracts before interacting with Web3.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/scan">
                Start Scanning <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">Explore Dashboard</Link>
            </Button>
          </div>
          <p className="mt-8 text-xs text-[#64748b]">
            Analysis service not connected yet — see scanner page for honest
            status.
          </p>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 border border-[rgba(148,163,184,0.16)] rounded-2xl bg-[#111827] p-6 lg:p-8 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]">
          <ShieldCheck className="h-6 w-6 text-[#22c55e] shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#f8fafc]">
              Built for the NEAR Ecosystem
            </p>
            <p className="mt-1 text-sm text-[#94a3b8]">
              Native-level security infrastructure on NEAR — cross-chain
              identity and threat intelligence planned for NEAR and 100+
              chains.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
