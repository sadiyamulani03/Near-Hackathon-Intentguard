"use client";

import { ShieldCheck, Zap, Globe, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

const FEATURES = [
  { label: "Real-time Transaction Scanning", status: "In Development", icon: ShieldCheck, desc: "Protection against malicious transactions." },
  { label: "AI-Powered Threat Detection", status: "In Development", icon: Zap, desc: "ML models identify new threats." },
  { label: "Cross-Chain Protection", status: "Integration Pending", icon: Globe, desc: "Securing you across chains." },
  { label: "Privacy First", status: "Available", icon: Lock, desc: "We never store your private keys or funds." },
];

function statusVariant(status: string) {
  switch (status) {
    case "Available": return "safe";
    case "In Development": return "warning";
    case "Integration Pending": return "informational";
    default: return "informational";
  }
}

export default function ProtectionFeatures() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Protection Features</CardTitle>
        <p className="text-xs text-[#64748b] mt-1">
          Product capabilities and implementation status.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {FEATURES.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-4 py-2 border-b border-[rgba(148,163,184,0.08)] last:border-0">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-6 w-6 items-center justify-center rounded border-[rgba(148,163,184,0.16)] bg-[#111827]">
                <f.icon className="h-3.5 w-3.5 text-[#94a3b8]" />
              </div>
              <span className="text-sm text-[#f8fafc]">{f.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(f.status)} className="text-xs">
                {f.status}
              </Badge>
              <span className="text-[10px] text-[#64748b]">{f.desc}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
