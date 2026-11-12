"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

export default function SecurityAnalysis() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Security Analysis</CardTitle>
        <a href="/scan" className="text-xs text-[#4778ff] hover:text-[#4778ff]/80 underline underline-offset-4">
          Run analysis
        </a>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#111827] p-5">
            <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Risk score</p>
            <span className="text-2xl font-bold text-[#f8fafc]">--</span>
          </div>
          <div className="rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#111827] p-5">
            <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Risk level</p>
            <Badge variant="safe">No assessment</Badge>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#111827] p-5">
            <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Findings</p>
            <span className="text-2xl font-bold text-[#f8fafc]">--</span>
          </div>
          <div className="rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#111827] p-5">
            <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Recommendations</p>
            <span className="text-sm text-[#94a3b8]">Run a scan to view recommendations.</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <p className="text-xs text-[#64748b]">
          Analysis results appear here after a scan. Security analysis service
          is not connected yet.
        </p>
      </CardFooter>
    </Card>
  );
}
