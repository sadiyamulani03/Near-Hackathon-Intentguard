"use client";

import Link from "next/link";

const ECOSYSTEM = [
  { name: "NEAR", url: "#", label: "NEAR Protocol" },
  { name: "Pagoda", url: "#", label: "Pagoda" },
  { name: "Ref Finance", url: "#", label: "Ref Finance" },
  { name: "Burrow", url: "#", label: "Burrow" },
  { name: "Meteor", url: "#", label: "Meteor" },
  { name: "Paras", url: "#", label: "Paras" },
];

export default function EcosystemSection() {
  return (
    <section className="py-20 lg:py-32 border-y border-[rgba(148,163,184,0.08)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-[#f8fafc] sm:text-4xl">
            Built for the NEAR Ecosystem
          </h2>
          <p className="mt-4 text-[#94a3b8] max-w-2xl mx-auto">
            IntentGuard is designed to integrate with NEAR infrastructure for
            cross-chain identity and threat intelligence.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {ECOSYSTEM.map((item) => (
            <Link
              key={item.name}
              href={item.url}
              className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
              aria-label={item.label}
            >
              <span className="rounded border border-[rgba(148,163,184,0.25)] px-2 py-0.5 text-xs text-[#64748b]">
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 border border-[rgba(148,163,184,0.12)] rounded-2xl bg-[#111827] p-8 md:p-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-3">
                Why NEAR?
              </h3>
              <ul className="space-y-3 text-sm text-[#94a3b8]">
                <li className="flex items-start gap-2">
                  <span className="text-[#22c55e]">✓</span>
                  Native-level security infrastructure
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#22c55e]">✓</span>
                  Lightning-finality performance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#22c55e]">✓</span>
                  Low transaction fees
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#22c55e]">✓</span>
                  Developer-friendly tooling
                </li>
              </ul>
            </div>
            <div className="text-right md:text-left">
              <p className="text-sm text-[#94a3b8] mb-4">
                Planned cross-chain identity capabilities will leverage NEAR
                Chain Signatures.
              </p>
              <p className="text-xs text-[#64748b] italic">
                Chain Signatures integration is pending — not yet implemented.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-12 text-xs text-[#64748b] text-center">
          NEAR, Pagoda, Ref Finance, Burrow, Meteor, and Paras names are shown
          for ecosystem context only. IntentGuard is not endorsed by or
          affiliated with the NEAR Foundation or any listed project.
        </p>
      </div>
    </section>
  );
}
