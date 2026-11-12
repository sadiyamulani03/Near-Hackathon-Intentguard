"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import {
  Shield,
  Home,
  LayoutDashboard,
  FileText,
  Settings,
  HelpCircle,
  Phone,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { Button, cn } from "@/components/ui/button";

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Docs", href: "/docs" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[rgba(148,163,184,0.12)] bg-[#080d18]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[#080d18]/70">
        <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#4778ff]" />
              <span className="font-bold text-lg tracking-tight text-[#f8fafc]">
                IntentGuard
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors",
                  isActive(item.href)
                    ? "text-[#4778ff]"
                    : "text-[#94a3b8] hover:text-[#f8fafc]"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild size="sm" variant="outline">
              <Link href="/docs">Docs</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/scan">
                Launch App <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            <button
              className="md:hidden inline-flex items-center justify-center p-2 text-[#94a3b8] hover:text-[#f8fafc]"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-[#0b1220]/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          "fixed inset-0 z-[61] flex flex-col bg-[#080d18] border-l border-[rgba(148,163,184,0.16)] transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile navigation"
      >
        <div className="flex h-16 items-center justify-between gap-4 px-4 border-b border-[rgba(148,163,184,0.12)]">
          <span className="font-bold text-lg tracking-tight text-[#f8fafc]">
            IntentGuard
          </span>
          <button
            className="inline-flex items-center justify-center p-2 text-[#94a3b8] hover:text-[#f8fafc]"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-[#172033] text-[#4778ff]"
                  : "text-[#94a3b8] hover:bg-[rgba(148,163,184,0.08)] hover:text-[#f8fafc]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
