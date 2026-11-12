export type RiskLevel = "safe" | "warning" | "critical" | "informational";

export interface RiskBadgeProps {
  level: RiskLevel;
  label?: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: RiskLevel;
  description: string;
  evidence?: string;
  recommendation?: string;
}

export interface ScanResult {
  target: string;
  type: "contract" | "wallet" | "transaction";
  riskLevel: RiskLevel;
  score?: number;
  findings: Finding[];
  positiveSignals: string[];
  recommendations: string[];
  limitations: string[];
}

export type AnalysisSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface AnalysisFinding {
  title: string;
  severity: AnalysisSeverity;
  description: string;
  evidence?: string;
  recommendation?: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

export interface ApiAnalysis {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "INSUFFICIENT_DATA";
  summary: string;
  findings: AnalysisFinding[];
  positiveSignals: string[];
  limitations: string[];
  disclaimer: string;
}

export function mapApiRiskToFrontend(riskLevel: ApiAnalysis["riskLevel"]): RiskLevel {
  switch (riskLevel) {
    case "CRITICAL":
    case "HIGH":
      return "critical";
    case "MEDIUM":
      return "warning";
    case "LOW":
    case "INSUFFICIENT_DATA":
    default:
      return "informational";
  }
}

export function mapApiSeverityToFrontend(severity: AnalysisSeverity): RiskLevel {
  switch (severity) {
    case "CRITICAL":
    case "HIGH":
      return "critical";
    case "MEDIUM":
      return "warning";
    case "LOW":
    case "INFO":
    default:
      return "informational";
  }
}

export interface ScanTab {
  id: "contract" | "wallet" | "transaction";
  label: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export interface IdentityStatus {
  status: "not-connected" | "derivation-pending" | "derived" | "signature-requested" | "verified";
  nearAccount?: string;
  derivedAddress?: string;
}
