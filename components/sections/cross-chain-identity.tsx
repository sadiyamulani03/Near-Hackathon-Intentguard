"use client";

import { Globe, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

const STATUSES = [
  { label: "Not Connected", color: "informational" },
  { label: "Address Derivation Pending", color: "warning" },
  { label: "Address Derived", color: "warning" },
  { label: "Signature Requested", color: "warning" },
  { label: "Signature Verified", color: "safe" },
];

export default function CrossChainIdentity() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Cross-Chain Identity</CardTitle>
        <a href="/identity" className="text-xs text-[#4778ff] hover:text-[#4778ff]/80 underline underline-offset-4">
          Manage identity
        </a>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#111827] p-4">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">NEAR Account</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#94a3b8] font-mono">--</span>
            <span className="text-[10px] text-[#ef4444]">Not connected</span>
          </div>
        </div>
        <div className="rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#111827] p-4">
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Integration Status</p>
          <Badge variant="warning">Chain Signatures integration pending</Badge>
          <p className="mt-2 text-xs text-[#64748b]">
            Cross-chain identity is planned. No addresses derived, no
            signatures requested or verified.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {STATUSES.map((s) => (
            <div key={s.label} className="rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#111827] p-3 text-center">
              <Badge variant={s.color} className="text-xs mb-1 block mx-auto">
                {s.label}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <p className="text-xs text-[#64748b]">
          Configure your cross-chain identity on the identity page.
        </p>
      </CardFooter>
    </Card>
  );
}
