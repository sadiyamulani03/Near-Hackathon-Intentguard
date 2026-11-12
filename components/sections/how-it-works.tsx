"use client";

import { Play, Scan, Eye, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  {
    num: "01",
    title: "Submit",
    description:
      "Provide a contract, wallet address, or transaction to analyze.",
    icon: Scan,
  },
  {
    num: "02",
    title: "Inspect",
    description:
      "IntentGuard prepares the security analysis of your input.",
    icon: Eye,
  },
  {
    num: "03",
    title: "Understand",
    description: "Review potential risks and findings in plain language.",
    icon: Play,
  },
  {
    num: "04",
    title: "Decide",
    description:
      "Make an informed decision before interacting with Web3.",
    icon: ArrowRight,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 lg:py-32 bg-[#0b1220]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-[#f8fafc] sm:text-4xl">
            How IntentGuard Works
          </h2>
          <p className="mt-4 text-[#94a3b8] max-w-2xl mx-auto">
            Advanced protection in four simple steps.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.num}>
                <CardHeader className="pb-3 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#172033] mx-auto mb-3">
                    <Icon className="h-5 w-5 text-[#4778ff]" />
                  </div>
                  <span className="text-xs font-semibold text-[#4778ff] uppercase tracking-wider">
                    {step.num}
                  </span>
                  <CardTitle className="mt-2 text-base">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-sm text-[#94a3b8] leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
