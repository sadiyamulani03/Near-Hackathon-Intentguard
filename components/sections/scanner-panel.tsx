"use client";

import React from "react";
import { Code2, User, Scroll, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/components/ui/button";

interface Mode {
  id: "contract" | "wallet" | "transaction";
  label: string;
  description: string;
  icon: React.ElementType;
}

const MODES: Mode[] = [
  {
    id: "contract",
    label: "Smart Contract",
    description: "Paste contract source code or address",
    icon: Scroll,
  },
  {
    id: "wallet",
    label: "Wallet Address",
    description: "Inspect a wallet address risk",
    icon: User,
  },
  {
    id: "transaction",
    label: "Transaction",
    description: "Analyze a transaction hash",
    icon: Code2,
  },
];

export default function ScannerPreview() {
  const [mode, setMode] = React.useState<Mode["id"]>("contract");
  const [value, setValue] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const clear = () => {
    setValue("");
    setSubmitted(false);
  };

  const ModeIcon = MODES.find((m) => m.id === mode)?.icon || Scroll;

  return (
    <section className="py-20 lg:py-32 bg-[#0b1220]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-[#f8fafc] sm:text-4xl">
            Scanner Preview
          </h2>
          <p className="mt-4 text-[#94a3b8]">
            Choose an input mode. Analysis is not connected yet.
          </p>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <div className="flex flex-wrap gap-2 mb-6">
              {MODES.map((m) => {
                const Active = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      mode === m.id
                        ? "border-[#4778ff] bg-[#172033] text-[#4778ff]"
                        : "border-[rgba(148,163,184,0.16)] bg-[#111827] text-[#94a3b8] hover:border-[rgba(148,163,184,0.4)] hover:text-[#f8fafc]"
                    )}
                  >
                    <Active className="h-4 w-4" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScan} className="space-y-4">
              {mode === "contract" ? (
                <Textarea
                  label="Contract source code or address"
                  placeholder="Paste Solidity/Rust source or contract address..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={submitted}
                />
              ) : (
                <Input
                  label={
                    mode === "wallet" ? "Wallet address" : "Transaction hash"
                  }
                  placeholder={`Enter a ${
                    mode === "wallet" ? "wallet address" : "transaction hash"
                  }...`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={submitted}
                />
              )}
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={submitted || !value.trim()}
                  className="flex-1"
                >
                  Scan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clear}
                  disabled={submitted || !value.trim()}
                >
                  Clear
                </Button>
              </div>
              <p className="text-xs text-[#64748b]">
                Accepts contract source, wallet address, or transaction hash.
                Results appear here when the analysis service is connected.
              </p>
            </form>
            {submitted && (
              <div className="mt-6 rounded-lg border border-[rgba(239,68,68,0.2)] bg-[#ef4444]/10 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-4 w-4 text-[#ef4444] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#f8fafc]">
                      Analysis not connected yet
                    </p>
                    <p className="mt-1 text-sm text-[#94a3b8]">
                      Your input has not been submitted for an actual security
                      assessment. The analysis service is pending backend
                      integration.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
