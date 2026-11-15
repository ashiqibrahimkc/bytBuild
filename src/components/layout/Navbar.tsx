"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Users,
  Truck,
  IndianRupee,
  LayoutDashboard,
  ShieldCheck,
  UserCheck,
  Menu,
  X,
  PlusCircle,
  HardHat,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const pathname = usePathname();
  const { role, setRole } = useConstruction();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/sites", label: "Sites & Clients", icon: Building2 },
    { href: "/vendors", label: "Vendors & Credit", icon: Truck },
    { href: "/workers", label: "Workers & Wages", icon: Users },
    { href: "/cashflow", label: "Cash Flow & Overhead", icon: IndianRupee },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                byten<span className="text-amber-600">.</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block">
                Cash Flow & Sites
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-50 text-amber-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* RBAC Role Switcher & Controls */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setRole("OWNER")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                role === "OWNER"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Full Financial Authority, Bank Balances, Client Income"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Owner
            </button>
            <button
              onClick={() => setRole("MANAGER")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                role === "MANAGER"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Site Operations, Expense Logging, Worker Attendance"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Manager
            </button>
          </div>

          <Badge
            variant={role === "OWNER" ? "warning" : "secondary"}
            className="hidden lg:inline-flex"
          >
            RBAC: {role}
          </Badge>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          {/* Quick role toggle on mobile */}
          <button
            onClick={() => setRole(role === "OWNER" ? "MANAGER" : "OWNER")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
          >
            {role === "OWNER" ? "👑 Owner" : "👷 Mgr"}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? "bg-amber-50 text-amber-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Current Role Mode:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setRole("OWNER")}
                className={`px-3 py-1 rounded text-xs font-bold ${
                  role === "OWNER" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                Owner
              </button>
              <button
                onClick={() => setRole("MANAGER")}
                className={`px-3 py-1 rounded text-xs font-bold ${
                  role === "MANAGER" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

