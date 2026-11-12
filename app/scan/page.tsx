"use client";

import React from "react";
import { useState } from "react";
import {
  Code2,
  User,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/sections/loading-state";
import {
  AnalysisFinding,
  ApiAnalysis,
  mapApiRiskToFrontend,
  mapApiSeverityToFrontend,
} from "@/components/types";

type TabId = "contract" | "wallet" | "transaction";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "contract", label: "Smart Contract", icon: Code2 },
  { id: "wallet", label: "Wallet Address", icon: User },
  { id: "transaction", label: "Transaction", icon: ShieldAlert },
];

interface FormErrors {
  contract?: string;
  wallet?: string;
  transaction?: string;
}

export default function ScanPage() {
  const [tab, setTab] = useState<TabId>("contract");
  const [values, setValues] = useState<Record<TabId, string>>({
    contract: "",
    wallet: "",
    transaction: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ApiAnalysis | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const next: FormErrors = {};
    let valid = true;
    const val = values[tab].trim();
    if (!val) {
      next[tab] = "Please enter a value.";
      valid = false;
    }
    if (tab === "wallet" && val && !/^0x[a-fA-F0-9]{40}$|^near[^.]+\.[^.]+$/.test(val)) {
      next[tab] = "Enter a valid Ethereum address or NEAR account ID.";
      valid = false;
    }
    setErrors(next);
    return valid;
  };

  const clear = () => {
    setValues({ ...values, [tab]: "" });
    setErrors({ ...errors, [tab]: undefined });
    setAnalysis(null);
    setApiError(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setAnalyzing(true);
    setAnalysis(null);
    setApiError(null);

    if (tab === "contract") {
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceCode: values.contract }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setApiError(
            (data.error && (data.error.message as string)) ||
              `Request failed with status ${res.status}. Please retry.`
          );
          return;
        }
        setAnalysis(data.analysis as ApiAnalysis);
      } catch {
        setApiError("Unable to reach the analysis service. Please retry.");
      } finally {
        setAnalyzing(false);
      }
    } else {
      // Wallet address and transaction intelligence are not connected to a live RPC yet.
      setTimeout(() => {
        setAnalyzing(false);
        setApiError(
          tab === "wallet"
            ? "Live wallet-address intelligence is not connected yet. This input has not been submitted for an actual assessment."
            : "Live transaction intelligence is not connected yet. This input has not been submitted for an actual assessment."
        );
      }, 600);
    }
  };

  const severityColor = (severity: AnalysisFinding["severity"]) => {
    switch (severity) {
      case "CRITICAL":
      case "HIGH":
        return "critical";
      case "MEDIUM":
        return "warning";
      default:
        return "informational";
    }
  };

  const TabIcon = TABS.find((t) => t.id === tab)?.icon || Code2;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[rgba(148,163,184,0.12)] bg-[#080d18]">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-[#f8fafc]">Security Scanner</h1>
            <p className="text-xs text-[#94a3b8]">Analyze contracts, addresses, and transactions.</p>
          </div>
          <Button onClick={() => clear()} variant="outline" disabled={analyzing || !values[tab].trim()}>
            Clear
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-8">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    setAnalysis(null);
                    setApiError(null);
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    tab === t.id
                      ? "border-[#4778ff] bg-[#172033] text-[#4778ff]"
                      : "border-[rgba(148,163,184,0.16)] bg-[#111827] text-[#94a3b8] hover:border-[rgba(148,163,184,0.4)] hover:text-[#f8fafc]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{TABS.find((t) => t.id === tab)?.label} Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAnalyze} className="space-y-4">
                {tab === "contract" ? (
                  <Textarea
                    label="Contract source code"
                    placeholder="Paste Solidity source code..."
                    value={values.contract}
                    onChange={(e) => setValues({ ...values, contract: e.target.value })}
                    error={errors.contract}
                    disabled={analyzing}
                  />
                ) : tab === "wallet" ? (
                  <Input
                    label="Wallet address"
                    placeholder="0x... or near1..."
                    value={values.wallet}
                    onChange={(e) => setValues({ ...values, wallet: e.target.value })}
                    error={errors.wallet}
                    disabled={analyzing}
                  />
                ) : (
                  <Input
                    label="Transaction hash"
                    placeholder="0x..."
                    value={values.transaction}
                    onChange={(e) => setValues({ ...values, transaction: e.target.value })}
                    error={errors.transaction}
                    disabled={analyzing}
                  />
                )}
                <Button type="submit" className="w-full" disabled={analyzing || !values[tab].trim()}>
                  {analyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    "Analyze"
                  )}
                </Button>
              </form>

              {apiError && (
                <div className="rounded-lg border border-[rgba(239,68,68,0.2)] bg-[#ef4444]/10 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#ef4444] shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-[#f8fafc]">Analysis unavailable</h3>
                      <p className="mt-1 text-sm text-[#94a3b8]">{apiError}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleAnalyze(
                          new Event("submit") as unknown as React.FormEvent
                        )
                      }
                      disabled={analyzing}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {analysis && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#172033] p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={mapApiRiskToFrontend(analysis.riskLevel)}>
                        Overall risk: {analysis.riskLevel}
                      </Badge>
                      <span className="ml-auto text-xs text-[#64748b]">
                        AI-assisted analysis is not a formal security audit.
                      </span>
                    </div>
                    <p className="text-sm text-[#94a3b8] leading-relaxed">{analysis.summary}</p>
                  </div>

                  {analysis.findings.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold text-[#f8fafc] mb-3">Findings ({analysis.findings.length})</h3>
                      <div className="space-y-3">
                        {analysis.findings.map((finding, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#111827] p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-[#f8fafc]">{finding.title}</span>
                                  <Badge variant={severityColor(finding.severity)} className="ml-auto text-[10px]">
                                    {finding.severity}
                                  </Badge>
                                  {finding.ruleId && (
                                    <span className="ml-2 text-[10px] font-mono text-[#64748b] bg-[#172033] border border-[rgba(148,163,184,0.12)] rounded px-1.5 py-0.5">
                                      {finding.ruleId}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-[#94a3b8] leading-relaxed">{finding.description}</p>
                                {finding.evidence && (
                                  <div className="mt-2">
                                    <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Evidence</p>
                                    <pre className="text-xs text-[#f8fafc] overflow-x-auto rounded border border-[rgba(148,163,184,0.12)] bg-[#080d18] p-2 break-all">{finding.evidence}</pre>
                                  </div>
                                )}
                                <div className="mt-2 flex flex-col sm:flex-row gap-2 text-xs text-[#94a3b8]">
                                  {finding.line !== undefined && finding.column !== undefined && (
                                    <span>
                                      <span className="font-semibold">Location:</span> L{finding.line}:C{finding.column}
                                    </span>
                                  )}
                                  <span>
                                    <span className="font-semibold">Confidence:</span> {finding.confidence}
                                  </span>
                                </div>
                                {finding.proof && (
                                  <div className="mt-1.5">
                                    <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Why this matched</p>
                                    <p className="text-xs text-[#64748b] leading-relaxed">{finding.proof}</p>
                                  </div>
                                )}
                                {finding.recommendation && (
                                  <div className="mt-2">
                                    <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Recommendation</p>
                                    <p className="text-sm text-[#f8fafc]">{finding.recommendation}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-5">
                      <p className="text-sm text-[#94a3b8]">No security patterns detected by static analysis. This does not guarantee the contract is secure.</p>
                    </div>
                  )}

                  {analysis.positiveSignals.length > 0 && (
                    <div className="rounded-lg border border-[rgba(34,197,94,0.16)] bg-[#22c55e]/10 p-4">
                      <h3 className="text-xs font-semibold text-[#22c55e] uppercase tracking-wider mb-2">Positive signals</h3>
                      <ul className="text-sm text-[#94a3b8] space-y-1 list-disc list-inside">
                        {analysis.positiveSignals.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.limitations.length > 0 && (
                    <div className="rounded-lg border border-[rgba(245,158,11,0.16)] bg-[#f59e0b]/10 p-4">
                      <h3 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-2">Limitations</h3>
                      <ul className="text-sm text-[#94a3b8] space-y-1 list-disc list-inside">
                        {analysis.limitations.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-[#64748b] italic">{analysis.disclaimer}</p>
                  {analysis.engine && analysis.engine !== "ai" && (
                    <p className="text-xs text-[#64748b] italic mt-1">
                      Analysis engine: {analysis.engine === "static" ? "Deterministic static analysis (no AI credits required)" : "Hybrid (static analysis + AI)"}.
                    </p>
                  )}
                </div>
              )}

              {analysis === null && apiError === null && !analyzing && values[tab].trim() === "" && (
                <EmptyState
                  icon={CheckCircle2}
                  title="Ready to scan"
                  description="Enter a contract, wallet address, or transaction above, then select Analyze."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
