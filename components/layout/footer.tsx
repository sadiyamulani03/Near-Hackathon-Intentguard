"use client";

import Link from "next/link";
import { Shield, Mail, Code2, Globe, Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(148,163,184,0.12)] bg-[#0b1220]">
      <div className="px-4 py-12 lg:px-8 lg:py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-[#4778ff]" />
              <span className="font-bold text-lg tracking-tight text-[#f8fafc]">
                IntentGuard
              </span>
            </div>
            <p className="text-sm text-[#94a3b8] max-w-xs">
              Web3 threat protection platform. Understand transaction risks,
              inspect suspicious addresses, and analyze smart contracts before
              interacting with Web3.
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-[rgba(148,163,184,0.25)] bg-[#111827] text-[#f8fafc] hover:bg-[#172033] transition-colors"
                aria-label="GitHub"
              >
                <Code2 className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-[rgba(148,163,184,0.25)] bg-[#111827] text-[#f8fafc] hover:bg-[#172033] transition-colors"
                aria-label="Twitter"
              >
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#f8fafc] mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-[#94a3b8]">
              <li>
                <Link href="/scan" className="hover:text-[#f8fafc]">
                  Security Scanner
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#f8fafc]">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/identity" className="hover:text-[#f8fafc]">
                  Cross-Chain Identity
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#f8fafc] mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-[#94a3b8]">
              <li>
                <Link href="/docs" className="hover:text-[#f8fafc]">
                  Documentation
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-[#f8fafc]">
                  Guides
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#f8fafc]">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#f8fafc] mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-[#94a3b8]">
              <li>
                <a href="#" className="hover:text-[#f8fafc]">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#f8fafc]">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#f8fafc]">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-[rgba(148,163,184,0.12)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#64748b]">
            IntentGuard is in development. Blockchain security analysis is not
            yet connected. Do not rely on this platform for financial decisions.
          </p>
          <div className="flex items-center gap-3 text-xs text-[#64748b]">
            <span>Built on NEAR</span>
            <span className="w-px h-3 bg-[#64748b]"></span>
            <span>Web3 Security Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
