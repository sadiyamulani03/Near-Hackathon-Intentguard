"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Search,
  List,
  MapPin,
  ShieldAlert,
  Globe,
  Settings,
  BookOpen,
} from "lucide-react";
import { cn } from "@/components/ui/button";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Scan", href: "/scan", icon: Search },
  { label: "Transactions", href: "#transactions", icon: List },
  { label: "Addresses", href: "#addresses", icon: MapPin },
  { label: "Threat Intelligence", href: "#threat-intel", icon: ShieldAlert },
  { label: "Cross-Chain Identity", href: "/identity", icon: Globe },
  { label: "Settings", href: "#settings", icon: Settings },
  { label: "Documentation", href: "/docs", icon: BookOpen },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col lg:w-64 border-r border-[rgba(148,163,184,0.12)] flex-shrink-0",
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-[rgba(148,163,184,0.12)] px-6">
          <ShieldAlert className="h-5 w-5 text-[#4778ff]" />
          <span className="font-bold text-lg tracking-tight text-[#f8fafc]">
            IntentGuard
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#172033] text-[#4778ff]"
                    : "text-[#94a3b8] hover:bg-[rgba(148,163,184,0.08)] hover:text-[#f8fafc]"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[rgba(148,163,184,0.12)] p-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-[#64748b]">
            <span className="relative flex h-1.5 w-1.5 rounded-full bg-[#22c55e]">
              <span className="absolute inset-0 rounded-full animate-pulse mix-blend-overlay bg-[#22c55e]" />
            </span>
            NEAR Testnet
          </div>
        </div>
      </div>
    </aside>
  );
}
