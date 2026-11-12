"use client";

import React from "react";
import { useState } from "react";
import {
  Globe,
  ShieldAlert,
  Key,
  Signature,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type IdentityStatus =
  | "not-connected"
  | "derivation-pending"
  | "derived"
  | "signature-requested"
  | "verified";

const STATUS_LABEL: Record<IdentityStatus, string> = {
  "not-connected": "Not Connected",
  "derivation-pending": "Address Derivation Pending",
  derived: "Address Derived",
  "signature-requested": "Signature Requested",
  verified: "Signature Verified",
};

const STATUS_VARIANT: Record<IdentityStatus, string> = {
  "not-connected": "informational",
  "derivation-pending": "warning",
  derived: "warning",
  "signature-requested": "warning",
  verified: "safe",
};

export default function IdentityPage() {
  const [nearAccount, setNearAccount] = useState("");
  const [status, setStatus] = useState<IdentityStatus>("not-connected");
  const [derivedAddress, setDerivedAddress] = useState("");
  const [deriving, setDeriving] = useState(false);
  const [signing, setSigning] = useState(false);

  const isValidNear = /^[a-z0-9._-]{2,64}$/.test(nearAccount);

  const handleDerive = () => {
    if (!isValidNear) return;
    setStatus("derivation-pending");
    setDeriving(true);
    setDerivedAddress("");
    // Honest simulation: derivation pending, not actually performed
    setTimeout(() => {
      setDeriving(false);
      // Remain in derivation-pending until a real derivation occurs
    }, 1500);
  };

  const handleRequestSignature = () => {
    if (status !== "derived") return;
    setStatus("signature-requested");
    setSigning(true);
    setTimeout(() => {
      setSigning(false);
      // Remain at signature-requested unless actually verified
    }, 1500);
  };

  const handleVerify = () => {
    if (status !== "signature-requested") return;
    setStatus("verified");
  };

  const reset = () => {
    setStatus("not-connected");
    setDerivedAddress("");
    setNearAccount("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[rgba(148,163,184,0.12)] bg-[#080d18]">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-[#f8fafc]">Cross-Chain Identity</h1>
            <p className="text-xs text-[#94a3b8]">Derive and manage identities across chains.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>NEAR Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="NEAR account ID"
                placeholder="example.near"
                value={nearAccount}
                onChange={(e) => setNearAccount(e.target.value)}
                disabled={deriving || signing || status === "verified"}
              />
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleDerive}
                  disabled={deriving || signing || !isValidNear || status === "verified"}
                  className="flex-1"
                >
                  {deriving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deriving...
                    </span>
                  ) : (
                    "Derive Address"
                  )}
                </Button>
                <Button variant="outline" onClick={reset} disabled={status === "not-connected" && !nearAccount && !derivedAddress}>
                  Reset
                </Button>
              </div>
              {!isValidNear && nearAccount && (
                <p className="text-xs text-[#ef4444]">Enter a valid NEAR account ID.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Derived Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-[#4778ff]" />
                  <div>
                    <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Chain-Signature Address</p>
                    <p className="text-sm text-[#f8fafc] font-mono">
                      {derivedAddress || "--"}
                    </p>
                  </div>
                </div>
                {derivedAddress && (
                  <Button size="sm" variant="outline" onClick={() => {}}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                )}
              </div>
              <p className="text-xs text-[#64748b]">
                No Ethereum address is generated without actual derivation.
                Displayed only after a real derivation occurs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_VARIANT[status]}>
                  {STATUS_LABEL[status]}
                </Badge>
              </div>
              <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-4">
                <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                  Chain Signatures
                </p>
                <p className="text-sm text-[#ef4444] font-semibold mb-1">
                  Integration pending
                </p>
                <p className="text-sm text-[#94a3b8]">
                  NEAR Chain Signatures integration is planned and not yet
                  implemented. No addresses have been derived and no signatures
                  have been requested or verified.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { label: "Derive Address", active: status === "derivation-pending" || status === "derived" },
                  { label: "Request Signature", active: status === "signature-requested" },
                  { label: "Verify Signature", active: status === "verified" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`rounded-lg border px-3 py-2 text-xs text-center transition-colors ${
                      s.active
                        ? "border-[#4778ff]/30 bg-[#4778ff]/10 text-[#4778ff]"
                        : "border-[rgba(148,163,184,0.12)] bg-[#111827] text-[#64748b]"
                    }`}
                  >
                    {s.label}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={handleRequestSignature}
                  disabled={signing || status !== "derived"}
                  className="flex-1"
                >
                  {signing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Requesting...
                    </span>
                  ) : (
                    "Request Signature"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleVerify}
                  disabled={status !== "signature-requested"}
                >
                  Mark Verified
                </Button>
              </div>
              <p className="mt-3 text-xs text-[#64748b]">
                &ldquo;Mark Verified&rdquo; is a UI placeholder — verification
                only occurs after an actual cryptographic signature check.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#94a3b8] leading-relaxed">
                Cross-chain identity lets you derive addresses on other chains
                from a single NEAR account using Chain Signatures. This is a
                planned integration — none of the steps below are connected to
                a live signing service yet.
              </p>
              <ol className="mt-4 space-y-3 text-sm text-[#94a3b8] list-decimal list-inside">
                <li>Enter your NEAR account ID.</li>
                <li>Request address derivation (pending integration).</li>
                <li>Review the derived address on the destination chain.</li>
                <li>Request and verify a cross-chain signature.</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
