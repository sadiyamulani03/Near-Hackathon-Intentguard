"use client";

import { Code2, User, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/sections/loading-state";

const ICONS: Record<string, React.ElementType> = {
  contract: Code2,
  wallet: User,
  transaction: Clock,
};

const LEVEL_BADGE: Record<string, string> = {
  safe: "safe",
  warning: "warning",
  critical: "critical",
};

const SCANS = [
  { target: "0x12ab...34cd", type: "contract", date: "2m ago", level: "safe", status: "Completed" },
  { target: "near1abc...xyz", type: "wallet", date: "15m ago", level: "warning", status: "Completed" },
  { target: "0x9ef4...ab12", type: "transaction", date: "1h ago", level: "critical", status: "Completed" },
  { target: "near1def...uvw", type: "wallet", date: "2h ago", level: "safe", status: "Completed" },
  { target: "0x4fd5...1a2b", type: "transaction", date: "3h ago", level: "warning", status: "Completed" },
];

export default function RecentScans() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Recent Scans</CardTitle>
        <a href="/scan" className="text-xs text-[#4778ff] hover:text-[#4778ff]/80 underline underline-offset-4">
          View all scans
        </a>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(148,163,184,0.12)]">
                <th className="text-left pb-3 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Target</th>
                <th className="text-left pb-3 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Type</th>
                <th className="text-left pb-3 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Date</th>
                <th className="text-left pb-3 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Risk</th>
                <th className="text-left pb-3 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {SCANS.map((scan) => {
                const Icon = ICONS[scan.type];
                return (
                  <tr
                    key={scan.target}
                    className="border-b border-[rgba(148,163,184,0.08)] hover:bg-[rgba(148,163,184,0.04)] transition-colors"
                  >
                    <td className="py-3 text-sm text-[#f8fafc]">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-[#64748b]" />
                        {scan.target}
                      </div>
                    </td>
                    <td className="py-3 text-sm text-[#94a3b8]">
                      {scan.type}
                    </td>
                    <td className="py-3 text-sm text-[#94a3b8]">{scan.date}</td>
                    <td className="py-3">
                      <Badge variant={LEVEL_BADGE[scan.level]} className="text-xs">
                        {scan.level}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-[#94a3b8]">{scan.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {SCANS.length === 0 && (
          <EmptyState title="No recent scans" description="Scan activity will appear here." icon={CheckCircle2} />
        )}
      </CardContent>
    </Card>
  );
}
