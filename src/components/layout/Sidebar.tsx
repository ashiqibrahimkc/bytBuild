"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Truck,
  Users,
  IndianRupee,
  HardHat,
  LogOut,
  X,
  History,
  Key,
  FileBarChart,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CloudDownload,
  FileCheck,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { PagePermission } from "@/lib/types";

const ALL_NAV_LINKS: {
  href: string;
  label: string;
  icon: React.ElementType;
  permission: PagePermission;
}[] = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
    { href: "/sites", label: "Sites & Clients", icon: Building2, permission: "sites" },
    { href: "/vendors", label: "Vendors & Credit", icon: Truck, permission: "vendors" },
    { href: "/workers", label: "Workers & Wages", icon: Users, permission: "workers" },
    { href: "/salary-slips", label: "Salary Slips", icon: FileCheck, permission: "salary-slips" },
    { href: "/cashflow", label: "Cash Flow & Treasury", icon: IndianRupee, permission: "cashflow" },
    { href: "/company-expenses", label: "Company Expenses", icon: Receipt, permission: "company-expenses" },
    { href: "/reports", label: "Financial Reports", icon: FileBarChart, permission: "reports" },
    { href: "/audit-logs", label: "Audit Logs", icon: History, permission: "audit-logs" },
    { href: "/team-roles", label: "Team & Permissions", icon: Key, permission: "team-roles" },
    { href: "/backup", label: "Gmail Backup & Sync", icon: CloudDownload, permission: "backup" },
  ];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  mobileOpen = false,
  onMobileClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole, currentUser, canAccessPage, companyName } = useConstruction();
  const [userDisplay, setUserDisplay] = useState<{ name: string; username: string }>({
    name: "User",
    username: "",
  });

  const handleClose = onMobileClose || (() => { });

  useEffect(() => {
    try {
      const savedUser =
        localStorage.getItem("bytbuild_user") || localStorage.getItem("buildflow_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUserDisplay({
          name: parsed.fullName || parsed.email || "User",
          username: parsed.username || parsed.email || "user",
        });
        if (parsed.role) setRole(parsed.role);
      }
    } catch { }
  }, [setRole]);

  // Close drawer on route change
  useEffect(() => {
    handleClose();
  }, [pathname]);

  async function handleSignOut() {
    // Clear session cookies for middleware
    document.cookie = "bytbuild_session=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "buildflow_session=; path=/; max-age=0; SameSite=Lax";
    localStorage.removeItem("bytbuild_user");
    localStorage.removeItem("buildflow_user");
    router.push("/login");
    router.refresh();
  }

  const initials = userDisplay.name ? userDisplay.name.slice(0, 2).toUpperCase() : "OW";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Filter links dynamically based on logged-in role permissions
  // Owner & Admin always see all links; other roles filtered by configured RBAC
  const isOwner = role.toUpperCase() === "OWNER" || role.toUpperCase() === "ADMIN";
  const visibleNavLinks = ALL_NAV_LINKS.filter((item) => isOwner || canAccessPage(item.permission));

  const SidebarContent = ({ isMini = false }: { isMini?: boolean }) => (
    <div className="flex flex-col h-full bg-white text-slate-900 select-none border-r border-slate-200 transition-all duration-300">
      {/* Brand Header */}
      <div
        className={`flex items-center ${isMini ? "justify-center flex-col gap-2 py-4 px-2" : "justify-between px-4 py-4"
          } border-b border-slate-200`}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-xs border border-slate-100">
            <Image
              src="/image/logo.png"
              alt="BytBuild Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain p-0.5"
              priority
            />
          </div>
          {!isMini && (
            <div>
              <p className="font-extrabold text-slate-900 leading-tight tracking-tight text-base">
                bytBuild<span className="text-amber-600">.</span>
              </p>
              <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider font-mono truncate max-w-[130px]" title={companyName || "MK Builders"}>
                {companyName || "MK Builders"}
              </p>
            </div>
          )}
        </div>

        {/* Collapsible Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            type="button"
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isMini ? "Expand Sidebar Menu" : "Collapse Sidebar Menu"}
            aria-label="Toggle sidebar collapse"
          >
            {isMini ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">

        {visibleNavLinks.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex items-center ${isMini ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"
                } rounded-lg text-xs sm:text-sm font-semibold transition-all ${active
                  ? "bg-amber-50 text-amber-900 shadow-xs border-l-4 border-amber-500 font-bold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${active ? "text-amber-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
              />
              {!isMini && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Sign Out (No role switcher) */}
      <div className="px-3 py-3 border-t border-slate-200 bg-slate-50/50">
        <div className={`flex items-center ${isMini ? "justify-center" : "gap-3"}`}>
          <div
            className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs"
            title={currentUser?.fullName || userDisplay.name}
          >
            {initials}
          </div>
          {!isMini && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentUser?.fullName || userDisplay.name}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {currentUser?.username || userDisplay.username}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleSignOut}
          type="button"
          title="Sign Out"
          className={`mt-2.5 flex items-center justify-center gap-2 w-full ${isMini ? "p-1.5" : "px-3 py-1.5"
            } rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors border border-rose-200 cursor-pointer`}
        >
          <LogOut className="w-3.5 h-3.5" />
          {!isMini && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={handleClose}
        />
      )}

      {/* Mobile Drawer Content (Always full width when open) */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transition-transform duration-200 ease-in-out print:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <button
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          onClick={handleClose}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent isMini={false} />
      </div>

      {/* Desktop Fixed Left Sidebar (Collapsible) */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 ${collapsed ? "w-20" : "w-64"
          } bg-white border-r border-slate-200 shadow-xs transition-all duration-300 ease-in-out print:hidden`}
      >
        <SidebarContent isMini={collapsed} />
      </aside>
    </>
  );
}
