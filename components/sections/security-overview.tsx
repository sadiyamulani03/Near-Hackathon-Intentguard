"use client";

import { Circle, AlertCircle, ShieldAlert, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/sections/loading-state";

interface Stat {
  label: string;
  value: string | number;
  subtitle?: string;
  color: "safe" | "warning" | "critical" | "primary";
}

const STATS: Stat[] = [
  { label: "Total Scans", value: "--", subtitle: "No scans yet", color: "primary" },
  { label: "Safe", value: "--", subtitle: "No findings", color: "safe" },
  { label: "Warnings", value: "--", subtitle: "No findings", color: "warning" },
  { label: "Critical", value: "--", subtitle: "No findings", color: "critical" },
];

function statColor(color: Stat["color"]) {
  switch (color) {
    case "safe": return "text-[#22c55e] border-[#22c55e]/20 bg-[#22c55e]/10";
    case "warning": return "text-[#f59e0b] border-[#f59e0b]/20 bg-[#f59e0b]/10";
    case "critical": return "text-[#ef4444] border-[#ef4444]/20 bg-[#ef4444]/10";
    default: return "text-[#4778ff] border-[#4778ff]/20 bg-[#4778ff]/10";
  }
}

export default function SecurityOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Overview</CardTitle>
        <p className="text-xs text-[#64748b] mt-1">
          Summary of scan activity and risk posture.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1.5 rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#111827] p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94a3b8]">{stat.label}</span>
              <div className="flex h-6 w-6 items-center justify-center rounded-md {statColor(stat.color)}">
                <span className="text-[10px]">{stat.color === "safe" ? "●" : stat.color === "warning" ? "●" : stat.color === "critical" ? "●" : "●"}</span>
              </div>
            </div>
            <span className="text-lg font-semibold text-[#f8fafc]">{stat.value}</span>
            {stat.subtitle && (
              <span className="text-xs text-[#64748b]">{stat.subtitle}</span>
            )}
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <EmptyState
          title="No scan data yet"
          description="Run a scan from the scanner page to populate your security overview."
          icon={ShieldAlert}
        />
      </CardFooter>
    </Card>
  );
}
