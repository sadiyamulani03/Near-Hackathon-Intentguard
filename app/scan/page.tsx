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

interface NearRiskIndicator {
  ruleId: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  evidence: string;
  recommendation: string;
  isVerifiedFact: boolean;
}

interface NearAccountAnalysis {
  accountId: string;
  network: string;
  account: {
    accountId: string;
    amount: string;
    amountNear: string;
    locked?: string;
    lockedNear?: string;
    storageUsage: number;
    codeHash?: string;
    blockHeight: number;
    blockHash: string;
  } | null;
  exists: boolean;
  riskIndicators: NearRiskIndicator[];
  positiveSignals: string[];
  limitations: string[];
  rpcSource: string;
  timestamp: string;
}

interface NearTransactionAnalysis {
  txHash: string;
  network: string;
  transaction: {
    status: "success" | "failure";
    statusDetail: string;
    signerId: string;
    receiverId: string;
    actions: Array<{
      type: string;
      deposit?: string;
      depositNear?: string;
      gas?: string;
      gasTgas?: string;
      methodName?: string;
    }>;
    gasBurnt?: string;
    gasBurntTgas?: string;
    tokensBurnt?: string;
    tokensBurntNear?: string;
  } | null;
  exists: boolean;
  riskIndicators: NearRiskIndicator[];
  positiveSignals: string[];
  limitations: string[];
  rpcSource: string;
  timestamp: string;
}

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
  const [nearAccountAnalysis, setNearAccountAnalysis] = useState<NearAccountAnalysis | null>(null);
  const [nearTransactionAnalysis, setNearTransactionAnalysis] = useState<NearTransactionAnalysis | null>(null);
  const [nearAccountError, setNearAccountError] = useState<string | null>(null);
  const [nearTransactionError, setNearTransactionError] = useState<string | null>(null);

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
    setNearAccountAnalysis(null);
    setNearTransactionAnalysis(null);
    setNearAccountError(null);
    setNearTransactionError(null);
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
    } else if (tab === "wallet") {
      try {
        const res = await fetch("/api/near-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: values.wallet }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setNearAccountError(
            (data.error && (data.error.message as string)) ||
              `Request failed with status ${res.status}. Please retry.`
          );
          return;
        }
        setNearAccountAnalysis(data.analysis as NearAccountAnalysis);
      } catch {
        setNearAccountError("Unable to reach the analysis service. Please retry.");
      } finally {
        setAnalyzing(false);
      }
    } else if (tab === "transaction") {
      try {
        const res = await fetch("/api/near-transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: values.transaction }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setNearTransactionError(
            (data.error && (data.error.message as string)) ||
              `Request failed with status ${res.status}. Please retry.`
          );
          return;
        }
        setNearTransactionAnalysis(data.analysis as NearTransactionAnalysis);
      } catch {
        setNearTransactionError("Unable to reach the analysis service. Please retry.");
      } finally {
        setAnalyzing(false);
      }
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
                    setNearAccountAnalysis(null);
                    setNearTransactionAnalysis(null);
                    setNearAccountError(null);
                    setNearTransactionError(null);
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

              {nearAccountError && (
                <div className="rounded-lg border border-[rgba(239,68,68,0.2)] bg-[#ef4444]/10 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#ef4444] shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-[#f8fafc]">Account analysis unavailable</h3>
                      <p className="mt-1 text-sm text-[#94a3b8]">{nearAccountError}</p>
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

              {nearAccountAnalysis && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#172033] p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={nearAccountAnalysis.exists ? "safe" : "informational"}>
                        Account: {nearAccountAnalysis.accountId}
                      </Badge>
                      <span className="ml-auto text-xs text-[#64748b]">
                        Network: {nearAccountAnalysis.network}
                      </span>
                    </div>
                    <p className="text-sm text-[#94a3b8] leading-relaxed">
                      {nearAccountAnalysis.exists
                        ? `Account "${nearAccountAnalysis.accountId}" exists on ${nearAccountAnalysis.network}.`
                        : `Account "${nearAccountAnalysis.accountId}" was not found on ${nearAccountAnalysis.network}.`}
                    </p>
                    {nearAccountAnalysis.account && (
                      <div className="mt-4 grid gap-2 md:grid-cols-2 text-sm">
                        <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3">
                          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Balance</p>
                          <p className="text-sm text-[#f8fafc]">{nearAccountAnalysis.account.amountNear} NEAR</p>
                        </div>
                        <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3">
                          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Storage</p>
                          <p className="text-sm text-[#f8fafc]">{nearAccountAnalysis.account.storageUsage.toLocaleString()} bytes</p>
                        </div>
                        <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3">
                          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Block Height</p>
                          <p className="text-sm text-[#f8fafc]">{nearAccountAnalysis.account.blockHeight.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3">
                          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Contract</p>
                          <p className="text-sm text-[#f8fafc]">
                            {nearAccountAnalysis.account.codeHash ? "Deployed" : "No contract"}
                          </p>
                        </div>
                        {nearAccountAnalysis.account.lockedNear && (
                          <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3">
                            <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Locked</p>
                            <p className="text-sm text-[#f8fafc]">{nearAccountAnalysis.account.lockedNear} NEAR</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {nearAccountAnalysis.riskIndicators.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#f8fafc] mb-3">Risk Indicators ({nearAccountAnalysis.riskIndicators.length})</h3>
                      <div className="space-y-3">
                        {nearAccountAnalysis.riskIndicators.map((finding, idx) => (
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
                                  <span className="ml-2 text-[10px] font-mono text-[#64748b] bg-[#172033] border border-[rgba(148,163,184,0.12)] rounded px-1.5 py-0.5">
                                    {finding.ruleId}
                                  </span>
                                  {finding.isVerifiedFact && (
                                    <span className="ml-2 text-[10px] text-[#22c55e]">&#10003; Verified</span>
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
                                  <span>
                                    <span className="font-semibold">Confidence:</span> {finding.confidence}
                                  </span>
                                </div>
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
                  )}

                  {nearAccountAnalysis.positiveSignals.length > 0 && (
                    <div className="rounded-lg border border-[rgba(34,197,94,0.16)] bg-[#22c55e]/10 p-4">
                      <h3 className="text-xs font-semibold text-[#22c55e] uppercase tracking-wider mb-2">Positive Signals</h3>
                      <ul className="text-sm text-[#94a3b8] space-y-1 list-disc list-inside">
                        {nearAccountAnalysis.positiveSignals.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {nearAccountAnalysis.limitations.length > 0 && (
                    <div className="rounded-lg border border-[rgba(245,158,11,0.16)] bg-[#f59e0b]/10 p-4">
                      <h3 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-2">Limitations</h3>
                      <ul className="text-sm text-[#94a3b8] space-y-1 list-disc list-inside">
                        {nearAccountAnalysis.limitations.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3">
                    <p className="text-xs text-[#64748b]">
                      RPC Source: {nearAccountAnalysis.rpcSource} &nbsp;|&nbsp; Retrieved: {new Date(nearAccountAnalysis.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {nearTransactionError && (
                <div className="rounded-lg border border-[rgba(239,68,68,0.2)] bg-[#ef4444]/10 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#ef4444] shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-[#f8fafc]">Transaction analysis unavailable</h3>
                      <p className="mt-1 text-sm text-[#94a3b8]">{nearTransactionError}</p>
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

              {nearTransactionAnalysis && (
                <>
                  <div className="space-y-4">
                  <div className="rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#172033] p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={nearTransactionAnalysis.transaction?.status === "success" ? "safe" : "warning"}>
                        Transaction: {nearTransactionAnalysis.transaction?.statusDetail || "unknown"}
                      </Badge>
                      <span className="ml-auto text-xs text-[#64748b]">
                        Network: {nearTransactionAnalysis.network}
                      </span>
                    </div>
                    <p className="text-sm text-[#94a3b8] leading-relaxed">
                      {nearTransactionAnalysis.transaction
                        ? `Transaction "${nearTransactionAnalysis.txHash}" executed by ${nearTransactionAnalysis.transaction.signerId} to ${nearTransactionAnalysis.transaction.receiverId}.`
                        : `Transaction "${nearTransactionAnalysis.txHash}" was not found on ${nearTransactionAnalysis.network}.`}
                    </p>
                    {nearTransactionAnalysis.transaction && (
                      <div className="mt-4 grid gap-2 md:grid-cols-2 text-sm">
                        <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3">
                          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Signer</p>
                          <p className="text-sm text-[#f8fafc] font-mono">{nearTransactionAnalysis.transaction.signerId}</p>
                        </div>
                        <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3">
                          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Receiver</p>
                          <p className="text-sm text-[#f8fafc] font-mono">{nearTransactionAnalysis.transaction.receiverId}</p>
                        </div>
                        <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3">
                          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Actions</p>
                          <p className="text-sm text-[#f8fafc]">{nearTransactionAnalysis.transaction.actions.length}</p>
                        </div>
                        <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3">
                          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Gas Burnt</p>
                          <p className="text-sm text-[#f8fafc]">{nearTransactionAnalysis.transaction.gasBurntTgas || "--"} TGas</p>
                        </div>
                      </div>)}
                      {nearTransactionAnalysis.transaction && nearTransactionAnalysis.transaction.actions.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Actions</h4>
                          <div className="space-y-2">
                            {nearTransactionAnalysis.transaction.actions.map((action, idx) => (
                              <div key={idx} className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3 text-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-[#f8fafc]">{action.type}</span>
                                  <span className="text-xs text-[#64748b]">{action.methodName || "-"}</span>
                                </div>
                                {action.depositNear && (
                                  <p className="text-xs text-[#94a3b8]">Deposit: {action.depositNear} NEAR</p>
                                )}
                                {action.gasTgas && (
                                  <p className="text-xs text-[#94a3b8]">Gas: {action.gasTgas} TGas</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {nearTransactionAnalysis.riskIndicators.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#f8fafc] mb-3">Risk Indicators ({nearTransactionAnalysis.riskIndicators.length})</h3>
                      <div className="space-y-3">
                        {nearTransactionAnalysis.riskIndicators.map((finding, idx) => (
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
                                  <span className="ml-2 text-[10px] font-mono text-[#64748b] bg-[#172033] border border-[rgba(148,163,184,0.12)] rounded px-1.5 py-0.5">
                                    {finding.ruleId}
                                  </span>
                                  {finding.isVerifiedFact && (
                                    <span className="ml-2 text-[10px] text-[#22c55e]">&#10003; Verified</span>
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
                                  <span>
                                    <span className="font-semibold">Confidence:</span> {finding.confidence}
                                  </span>
                                </div>
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
                  )}

                  {nearTransactionAnalysis.positiveSignals.length > 0 && (
                    <div className="rounded-lg border border-[rgba(34,197,94,0.16)] bg-[#22c55e]/10 p-4">
                      <h3 className="text-xs font-semibold text-[#22c55e] uppercase tracking-wider mb-2">Positive Signals</h3>
                      <ul className="text-sm text-[#94a3b8] space-y-1 list-disc list-inside">
                        {nearTransactionAnalysis.positiveSignals.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {nearTransactionAnalysis.limitations.length > 0 && (
                    <div className="rounded-lg border border-[rgba(245,158,11,0.16)] bg-[#f59e0b]/10 p-4">
                      <h3 className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wider mb-2">Limitations</h3>
                      <ul className="text-sm text-[#94a3b8] space-y-1 list-disc list-inside">
                        {nearTransactionAnalysis.limitations.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-lg border border-[rgba(148,163,184,0.12)] bg-[#111827] p-3">
                    <p className="text-xs text-[#64748b]">
                      RPC Source: {nearTransactionAnalysis.rpcSource} &nbsp;|&nbsp; Retrieved: {new Date(nearTransactionAnalysis.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                </>
              )}

              {analysis === null && apiError === null && !analyzing && nearAccountAnalysis === null && nearAccountError === null && nearTransactionAnalysis === null && nearTransactionError === null && values[tab].trim() === "" && (
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
