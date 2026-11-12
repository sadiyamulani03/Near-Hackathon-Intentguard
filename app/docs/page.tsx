import { Metadata } from "next";
import { BookOpen, Shield, AlertTriangle, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation — IntentGuard",
  description: "IntentGuard project documentation and security disclaimers.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[#f8fafc] mb-3">
        <BookOpen className="h-5 w-5 text-[#4778ff]" />
        {title}
      </h2>
      <div className="prose prose-invert sm:prose-lg max-w-none text-[#94a3b8] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[rgba(148,163,184,0.12)] bg-[#080d18]">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-[#f8fafc]">Documentation</h1>
            <p className="text-xs text-[#94a3b8]">Project overview, status, and disclaimers.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <Section title="Overview">
            IntentGuard is a Web3 cybersecurity platform frontend that helps
            users understand potential risks before interacting with blockchain
            transactions, wallet addresses, and smart contracts.
          </Section>

          <Section title="Routes">
            <ul className="list-disc list-inside space-y-1 text-[#94a3b8] text-sm">
              <li><code className="text-[#f8fafc] font-mono">/</code> — Marketing landing page.</li>
              <li><code className="text-[#f8fafc] font-mono">/dashboard</code> — Security dashboard.</li>
              <li><code className="text-[#f8fafc] font-mono">/scan</code> — Security scanner.</li>
              <li><code className="text-[#f8fafc] font-mono">/identity</code> — Cross-chain identity.</li>
              <li><code className="text-[#f8fafc] font-mono">/docs</code> — This documentation page.</li>
            </ul>
          </Section>

          <Section title="Implementation Status">
            <ul className="list-disc list-inside space-y-1 text-[#94a3b8] text-sm">
              <li>Frontend UI and navigation — <span className="text-[#22c55e]">Available</span></li>
              <li>Security analysis service — <span className="text-[#ef4444]">Not connected</span></li>
              <li>NEAR Chain Signatures — <span className="text-[#f59e0b]">Integration pending</span></li>
              <li>Wallet connection — <span className="text-[#f59e0b]">Placeholder</span></li>
            </ul>
          </Section>

          <Section title="Security Disclaimer">
            <AlertTriangle className="mr-2 h-5 w-5 text-[#ef4444]" />
            IntentGuard is in development. This frontend does not perform real
            blockchain security analysis, AI scanning, transaction simulation,
            or cryptographic verification. Do not rely on this platform for
            financial or security decisions. All scan results, balances, and
            risk scores shown are illustrative or placeholder states unless
            produced by a connected analysis service.
          </Section>

          <Section title="No Endorsements">
            IntentGuard is not endorsed by or affiliated with the NEAR
            Foundation, Blockaid, Rabby, or any other company. Ecosystem names
            appear for context only.
          </Section>
        </div>
      </div>
    </div>
  );
}
