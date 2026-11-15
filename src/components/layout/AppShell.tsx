"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Sidebar from "./Sidebar";
import { Menu, ShieldCheck, PanelLeft } from "lucide-react";
import { useConstruction } from "@/lib/store";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { role, sites, workers, vendors } = useConstruction();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) setIsCollapsed(saved === "true");
    } catch { }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch { }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Collapsible Sidebar */}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        collapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div
        className={`flex flex-col flex-1 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"
          } min-w-0 transition-all duration-300 ease-in-out print:pl-0 print:m-0`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md print:hidden">
          {/* Mobile menu trigger & Desktop Collapse button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              onClick={handleToggleCollapse}
              className="hidden lg:flex items-center gap-1.5 px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title={isCollapsed ? "Expand Sidebar (Full Menu)" : "Collapse Sidebar (Compact Icons)"}
            >
              <PanelLeft className="h-4 w-4 text-slate-600" />
              <span className="text-[11px] font-medium font-mono">
                {isCollapsed ? "Expand" : "Collapse"}
              </span>
            </button>

            <div className="lg:hidden flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden bg-white shadow-xs border border-slate-100">
                <Image
                  src="/image/logo.png"
                  alt="BytBuild Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                byten<span className="text-amber-600">.</span>
              </span>
            </div>

            {/* Desktop status pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 ml-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-mono text-[11px] border border-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Live ERP
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-mono text-slate-600">
                {sites.length} Sites · {workers.length} Workers · {vendors.length} Vendors
              </span>
            </div>
          </div>

          {/* Right Header Controls: Active Role Badge (No dark mode button) */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-200 bg-amber-50 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
              <span className="font-bold text-amber-900 tracking-wide uppercase text-[11px]">
                {role}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto print:p-0 print:max-w-none print:m-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden">
          <span>
            © 2026 <a href="https://www.byten.in" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-800 hover:text-amber-700 transition-colors">byten</a>. Real Cash Flow &amp; Multi-Site Ledger.
          </span>
          <div className="flex items-center gap-1.5 text-xs">
            <a
              href="https://www.byten.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-amber-700 hover:text-amber-800 hover:underline transition-colors"
            >
              www.byten.in
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
