"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Menu,
  X,
  Bell,
  Settings as SettingsIcon,
  Wallet,
  Network,
} from "lucide-react";
import Footer from "@/components/layout/footer";
import Sidebar from "@/components/layout/sidebar";
import SecurityOverview from "@/components/sections/security-overview";
import RecentScans from "@/components/sections/recent-scans";
import ThreatBreakdown from "@/components/sections/threat-breakdown";
import SecurityAnalysis from "@/components/sections/security-analysis";
import ProtectionFeatures from "@/components/sections/protection-features";
import CrossChainIdentity from "@/components/sections/cross-chain-identity";

const NAV: { label: string; href: string; icon: React.ElementType }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Scan", href: "/scan", icon: LayoutDashboard },
  { label: "Transactions", href: "#transactions", icon: LayoutDashboard },
  { label: "Addresses", href: "#addresses", icon: LayoutDashboard },
  { label: "Threat Intelligence", href: "#threat-intel", icon: LayoutDashboard },
  { label: "Cross-Chain Identity", href: "/identity", icon: LayoutDashboard },
  { label: "Settings", href: "#settings", icon: SettingsIcon },
  { label: "Documentation", href: "/docs", icon: LayoutDashboard },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#080d18]">
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-[#080d18]/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-[rgba(148,163,184,0.12)] bg-[#0b1220] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          aria-label="Dashboard navigation"
        >
          <div className="flex h-16 shrink-0 items-center gap-2 border-b border-[rgba(148,163,184,0.12)] px-6">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 text-[#4778ff]">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-[#f8fafc]">IntentGuard</span>
            </div>
            <button
              className="lg:hidden inline-flex items-center justify-center p-2 text-[#94a3b8] hover:text-[#f8fafc]"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[#94a3b8] hover:bg-[rgba(148,163,184,0.08)] hover:text-[#f8fafc]"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-[rgba(148,163,184,0.12)] p-4">
            <div className="inline-flex items-center gap-2 text-xs text-[#64748b]">
              <span className="relative flex h-1.5 w-1.5 rounded-full bg-[#22c55e]">
                <span className="absolute inset-0 rounded-full animate-pulse mix-blend-overlay bg-[#22c55e]" />
              </span>
              NEAR Testnet
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col min-w-0">
          {/* Top bar */}
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[rgba(148,163,184,0.12)] bg-[#080d18]/80 backdrop-blur-md px-6 lg:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <button
                className="inline-flex items-center justify-center p-2 text-[#94a3b8] hover:text-[#f8fafc]"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <div className="hidden lg:flex-1 lg:flex lg:items-center lg:justify-center">
              <h1 className="font-semibold text-[#f8fafc] tracking-tight">Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 rounded-lg border border-[rgba(148,163,184,0.16)] bg-[#111827] px-3 py-1.5">
                <Network className="h-4 w-4 text-[#94a3b8]" />
                <span className="text-xs text-[#94a3b8]">NEAR Testnet</span>
                <button className="flex h-6 w-6 items-center justify-center rounded text-[#94a3b8] hover:text-[#f8fafc]">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17l5 5 5-5" /></svg>
                </button>
              </div>
              <button className="hidden sm:inline-flex items-center gap-2 rounded-md border border-[rgba(148,163,184,0.25)] bg-[#111827] px-3 py-1.5 text-sm text-[#f8fafc] hover:bg-[#172033] transition-colors">
                <Wallet className="h-4 w-4 mr-1" />
                Connect Wallet
              </button>
              <button className="inline-flex items-center justify-center p-2 text-[#94a3b8] hover:text-[#f8fafc] lg:hidden">
                <Bell className="h-5 w-5" />
              </button>
              <button className="inline-flex items-center justify-center p-2 text-[#94a3b8] hover:text-[#f8fafc]">
                <SettingsIcon className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Security Overview - spans 4 cols */}
                <div className="lg:col-span-4">
                  <SecurityOverview />
                </div>
                {/* Recent Scans - spans 4 cols */}
                <div className="lg:col-span-4">
                  <RecentScans />
                </div>
                {/* Threat Breakdown - spans 4 cols */}
                <div className="lg:col-span-4">
                  <ThreatBreakdown />
                </div>
                {/* Security Analysis - spans 6 cols */}
                <div className="lg:col-span-6">
                  <SecurityAnalysis />
                </div>
                {/* Protection Features - spans 3 cols */}
                <div className="lg:col-span-3">
                  <ProtectionFeatures />
                </div>
                {/* Cross-Chain Identity - spans 3 cols */}
                <div className="lg:col-span-3">
                  <CrossChainIdentity />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
