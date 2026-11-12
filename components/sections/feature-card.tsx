"use client";

import Link from "next/link";
import {
  Scroll as ScrollIcon,
  User as UserIcon,
  Zap as ZapIcon,
  Globe as GlobeIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

interface Feature {
  title: string;
  description: string;
  icon: React.ElementType;
  status: "Available" | "In Development" | "Integration Pending";
}

const FEATURES: Feature[] = [
  {
    title: "Smart Contract Analysis",
    description:
      "Inspect contract source and bytecode for vulnerabilities before deployment or interaction.",
    icon: ScrollIcon,
    status: "In Development",
  },
  {
    title: "Wallet Address Risk Assessment",
    description:
      "Evaluate wallet addresses for phishing, theft, and fund-draining associations.",
    icon: UserIcon,
    status: "Integration Pending",
  },
  {
    title: "Transaction Risk Intelligence",
    description:
      "Simulate and review transaction risks to protect your funds before signing.",
    icon: ZapIcon,
    status: "In Development",
  },
  {
    title: "Cross-Chain Identity",
    description:
      "Derive and manage identities across chains using NEAR Chain Signatures (planned).",
    icon: GlobeIcon,
    status: "Integration Pending",
  },
];

function badgeVariant(status: string) {
  switch (status) {
    case "Available":
      return "safe";
    case "In Development":
      return "warning";
    case "Integration Pending":
    default:
      return "informational";
  }
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-[#f8fafc] sm:text-4xl">
            Capabilities
          </h2>
          <p className="mt-4 text-[#94a3b8] max-w-2xl mx-auto">
            Planned security capabilities. Status reflects current
            implementation — not all features are live.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const Comp = feature.icon;
            return (
              <Card key={feature.title}>
                <CardHeader className="pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#172033] mb-4">
                    <Comp className="h-5 w-5 text-[#4778ff]" />
                  </div>
                  <CardTitle className="text-base">
                    {feature.title}
                  </CardTitle>
                  <Badge variant={badgeVariant(feature.status)} className="mt-3">
                    {feature.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">
                    {feature.description}
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
