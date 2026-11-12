"use client";

import { ShieldAlert, Zap, User, Lock, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

const CATEGORIES = [
  { label: "Malicious contracts", value: 0, icon: ShieldAlert, color: "critical" },
  { label: "Phishing", value: 0, icon: Zap, color: "warning" },
  { label: "Suspicious approvals", value: 0, icon: Lock, color: "warning" },
  { label: "Potential fund-draining", value: 0, icon: User, color: "critical" },
  { label: "Other risks", value: 0, icon: Globe, color: "informational" },
];

function colorClass(color: string) {
  switch (color) {
    case "critical": return "text-[#ef4444] border-[#ef4444]/20";
    case "warning": return "text-[#f59e0b] border-[#f59e0b]/20";
    case "informational": return "text-[#4778ff] border-[#4778ff]/20";
    default: return "text-[#94a3b8]";
  }
}

export default function ThreatBreakdown() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Threat Categories</CardTitle>
        <p className="text-xs text-[#64748b] mt-1">
          Breakdown of detected threat types across scans.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.label} className="flex items-center justify-between py-2 border-b border-[rgba(148,163,184,0.08)] last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border {colorClass(cat.color)} bg-[#111827]">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-[#f8fafc]">{cat.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-[#f8fafc]">{cat.value}</span>
                <span className="text-xs text-[#64748b]">findings</span>
              </div>
            </div>
          );
        })}
        <div className="pt-4 border-t border-[rgba(148,163,184,0.12)]">
          <p className="text-xs text-[#64748b]">
            No real threat data — analysis service not connected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
