"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  IndianRupee,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Lock,
  ShieldAlert,
  Fuel,
  Receipt,
  ArrowRight,
  Layers,
  ClipboardList,
  Plus,
  Zap,
  RefreshCw,
  Landmark,
  Banknote,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionModals } from "@/components/modals/ActionModals";
import { DashboardSkeleton } from "@/components/ui/page-skeletons";

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Good day");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    setCurrentDate(
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const {
    role,
    isDbLoading,
    companyName,
    setCompanyName,
    sites,
    vendors,
    workers,
    vendorPurchases,
    vendorPayments,
    workerWorkLogs,
    workerPayments,
    siteIncomes,
    companyExpenses,
    getMasterCashFlow,
    getSiteStats,
  } = useConstruction();

  const cashFlow = getMasterCashFlow();

  // Modal state
  const [openPurchase, setOpenPurchase] = useState(false);
  const [openWorkLog, setOpenWorkLog] = useState(false);
  const [openVendorPay, setOpenVendorPay] = useState(false);
  const [openWorkerPay, setOpenWorkerPay] = useState(false);
  const [openIncome, setOpenIncome] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(undefined);

  if (isDbLoading) {
    return <DashboardSkeleton />;
  }

  const handleSiteAction = (
    siteId: string,
    action: "PURCHASE" | "WORK" | "EXPENSE" | "INCOME"
  ) => {
    setSelectedSiteId(siteId);
    if (action === "PURCHASE") setOpenPurchase(true);
    if (action === "WORK") setOpenWorkLog(true);
    if (action === "EXPENSE") setOpenExpense(true);
    if (action === "INCOME") setOpenIncome(true);
  };

  // Preview top 4 sites for dashboard overview
  const previewSites = useMemo(() => sites.slice(0, 4), [sites]);

  // Quick Action cards config
  const quickActions = useMemo(() => {
    if (role === "ACCOUNTANT") {
      return [
        {
          label: "Pay Vendor",
          desc: "Disburse partial or full credit",
          icon: Receipt,
          iconBg: "bg-rose-100",
          iconColor: "text-rose-700",
          border: "border-l-rose-500",
          onClick: () => setOpenVendorPay(true),
        },
        {
          label: "Pay Worker",
          desc: "Disburse wages to labor",
          icon: Users,
          iconBg: "bg-orange-100",
          iconColor: "text-orange-700",
          border: "border-l-orange-500",
          onClick: () => setOpenWorkerPay(true),
        },
        {
          label: "Log Overhead / Petrol",
          desc: "Record room rent, fuel or mess",
          icon: Fuel,
          iconBg: "bg-purple-100",
          iconColor: "text-purple-700",
          border: "border-l-purple-500",
          onClick: () => setOpenExpense(true),
        },
      ];
    }
    return [
      {
        label: "Material Bill",
        desc: "Record vendor purchase with voucher",
        icon: Truck,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-700",
        border: "border-l-amber-500",
        onClick: () => setOpenPurchase(true),
      },
      {
        label: "Assign Worker",
        desc: "Log daily wage to site",
        icon: Users,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-700",
        border: "border-l-blue-500",
        onClick: () => setOpenWorkLog(true),
      },
      {
        label: "Pay Vendor",
        desc: "Disburse partial or full credit",
        icon: Receipt,
        iconBg: "bg-rose-100",
        iconColor: "text-rose-700",
        border: "border-l-rose-500",
        onClick: () => setOpenVendorPay(true),
      },
      {
        label: "Pay Worker",
        desc: "Disburse wages to labor",
        icon: Users,
        iconBg: "bg-orange-100",
        iconColor: "text-orange-700",
        border: "border-l-orange-500",
        onClick: () => setOpenWorkerPay(true),
      },
      ...(role === "OWNER"
        ? [
          {
            label: "Record Client Income",
            desc: "Log advance or milestone collection",
            icon: IndianRupee,
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-700",
            border: "border-l-emerald-500",
            onClick: () => setOpenIncome(true),
          },
        ]
        : []),
      {
        label: "Log Overhead / Petrol",
        desc: "Record room rent, fuel or mess",
        icon: Fuel,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-700",
        border: "border-l-purple-500",
        onClick: () => setOpenExpense(true),
      },
    ];
  }, [role]);

  return (
    <div className="space-y-8 pb-12">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {greeting},{" "}
              <span className="text-amber-600 capitalize">
                {role.toLowerCase()}
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {currentDate} • {role === "ACCOUNTANT" ? "Financial balances, vendor liabilities, payroll settlements, and cash books." : "Construction Cash Flow, Available Liquidity & Multi-Site Ledger."}
          </p>
        </div>
      </div>

      {/* ── Manager RBAC Notice ───────────────────────────────────────────── */}
      {role === "MANAGER" && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <span>
            <strong>Manager Role Active:</strong> Company overall cash balance and client inflows are masked. You have full access to log site materials, assign worker wages, record field petrol, and view statements.
          </span>
        </div>
      )}

      {/* ── 🌟 CROWN JEWEL: COMPANY CASH IN HAND / TREASURY HUB ──────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <h2 className="text-base font-extrabold tracking-tight uppercase text-slate-900 dark:text-slate-100 font-mono">
              Company Cash in Hand & Liquidity Hub
            </h2>
          </div>
          <Link
            href="/cashflow"
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline flex items-center gap-1 font-mono"
          >
            Full Cash Flow Book <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Master Treasury Hero Card (Rich Construction Theme) */}
        <div className="rounded-2xl border-2 border-amber-500/80 bg-slate-900 text-white p-6 shadow-xl relative overflow-hidden">
          {/* Subtle amber & emerald accent gradient glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Net Cash in Hand Figure */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
                <Wallet className="h-4 w-4 text-amber-400" />
                <span className="font-bold">Available Company Liquid Cash in Hand</span>
              </div>

              {role === "OWNER" ? (
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-3xl sm:text-5xl font-black tracking-tight text-emerald-400 font-mono">
                    {formatCurrency(cashFlow.currentCashInHand)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    (Net Bank Accounts + Cash Box)
                  </span>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-slate-400">
                  <Lock className="h-5 w-5 text-amber-400" />
                  <span className="text-2xl font-bold font-mono">•••••••••• (Owner Access Only)</span>
                </div>
              )}


            </div>

            {/* Right: Liquidity Vault Distribution (Bank vs Cash Box) */}
            {role === "OWNER" && (
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-3.5 min-w-[170px] shadow-sm">
                  <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono mb-1">
                    <Landmark className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-semibold">Bank Accounts</span>
                  </div>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {formatCurrency(cashFlow.cashInBank)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">NEFT / RTGS / Cheques</span>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-3.5 min-w-[170px] shadow-sm">
                  <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono mb-1">
                    <Banknote className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-semibold">Physical Cash Box</span>
                  </div>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {formatCurrency(cashFlow.cashInPhysicalBox)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Site Petty Cash</span>
                </div>
              </div>
            )}
          </div>

          {/* Equation Breakdown Bar */}
          <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Client Inflows (+)</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                {role === "OWNER" ? formatCurrency(cashFlow.totalCashReceived) : "••••••"}
              </span>
              <span className="text-[10px] text-slate-500">From {siteIncomes.length} receipts</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vendor Disbursements (-)</span>
              <span className="text-base font-bold text-rose-300 mt-0.5 block">
                -{formatCurrency(cashFlow.totalVendorCashPaid)}
              </span>
              <span className="text-[10px] text-slate-500">Material bill settlements</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Worker Wages Paid (-)</span>
              <span className="text-base font-bold text-orange-300 mt-0.5 block">
                -{formatCurrency(cashFlow.totalWorkerCashPaid)}
              </span>
              <span className="text-[10px] text-slate-500">Disbursed cash wages</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Company Overhead (-)</span>
              <span className="text-base font-bold text-amber-300 mt-0.5 block">
                -{formatCurrency(cashFlow.totalOverheadCashPaid)}
              </span>
              <span className="text-[10px] text-slate-500">Room rent, petrol & mess</span>
            </div>
          </div>
        </div>

        {/* Liabilities & Payables Warning Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Unsettled Vendor Credit */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-rose-500 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">
                Vendor Credit Owed (Payables)
              </span>
              <Truck className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatCurrency(cashFlow.totalVendorPayables)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400 font-mono">Across {vendors.length} vendors</span>
              <button
                onClick={() => setOpenVendorPay(true)}
                className="font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
              >
                Pay Vendor →
              </button>
            </div>
          </div>

          {/* Card 2: Unpaid Accrued Wages */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-orange-500 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">
                Unpaid Worker Wages (Accruals)
              </span>
              <Users className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-black text-orange-600 dark:text-orange-400 font-mono">
              {formatCurrency(cashFlow.totalWorkerPayables)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400 font-mono">Owed to {workers.length} workers</span>
              <button
                onClick={() => setOpenWorkerPay(true)}
                className="font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
              >
                Disburse Wages →
              </button>
            </div>
          </div>

          {/* Card 3: Net Liquidity Solvency */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">
                Net Solvency Position
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {role === "OWNER"
                ? formatCurrency(
                  cashFlow.currentCashInHand -
                  (cashFlow.totalVendorPayables + cashFlow.totalWorkerPayables)
                )
                : "••••••••••"}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-mono">
              <span>Cash in Hand minus All Payables</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
          <h2 className="text-xs font-extrabold uppercase tracking-tight text-slate-700 font-mono">
            Direct Financial Actions
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                onClick={action.onClick}
                variant="outline"
                size="sm"
                title={action.desc}
                className="h-8 px-3 text-xs font-medium gap-1.5 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs cursor-pointer"
              >
                <Icon className={`h-3.5 w-3.5 ${action.iconColor}`} />
                <span>{action.label}</span>
              </Button>
            );
          })}
        </div>
      </section>

      {/* ── Site Performance Table (Hidden for Accountants) ───── */}
      {role !== "ACCOUNTANT" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
              <h2 className="text-sm font-extrabold uppercase tracking-tight text-slate-900 font-mono">
                Site Performance &amp; Direct Actions ({sites.length} Active Sites)
              </h2>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {sites.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                No active construction sites yet. Click &quot;Sites &amp; Clients&quot; in the menu to add your first project.
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-mono border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Site Name</th>
                        <th className="py-3 px-4 font-semibold">Client</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 text-right font-semibold">Materials</th>
                        <th className="py-3 px-4 text-right font-semibold">Labor Wages</th>
                        <th className="py-3 px-4 text-right font-semibold">Total Expenses</th>
                        {role === "OWNER" && (
                          <th className="py-3 px-4 text-right font-semibold">Client Income</th>
                        )}
                        <th className="py-3 px-4 text-right font-semibold">Direct Site Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {previewSites.map((site) => {
                        const stats = getSiteStats(site.id);
                        return (
                          <tr
                            key={site.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                              {site.name}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{site.clientName}</td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  site.status === "ACTIVE"
                                    ? "success"
                                    : site.status === "COMPLETED"
                                      ? "default"
                                      : "warning"
                                }
                                className="text-[10px]"
                              >
                                {site.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                              {formatCurrency(stats.materialExpense)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                              {formatCurrency(stats.laborExpense)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(stats.totalExpense)}
                            </td>
                            {role === "OWNER" && (
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                                {formatCurrency(stats.totalIncome)}
                              </td>
                            )}
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] px-2 bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                                  onClick={() => handleSiteAction(site.id, "PURCHASE")}
                                  title="Add Vendor Material Bill for this site"
                                >
                                  + Material
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] px-2 bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
                                  onClick={() => handleSiteAction(site.id, "WORK")}
                                  title="Assign Worker Wage for this site"
                                >
                                  + Worker
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer replacing pagination with site count and 'All Sites →' button */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-600">
                  <span className="font-mono text-[11px] text-slate-500">
                    Showing <strong className="text-slate-900 font-bold">{previewSites.length}</strong> of{" "}
                    <strong className="text-slate-900 font-bold">{sites.length}</strong> active sites
                  </span>
                  <Link
                    href="/sites"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-xs font-bold text-slate-800 hover:text-amber-700 shadow-2xs transition-all font-mono"
                  >
                    All Sites <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}



      {/* ── Action Modals ─────────────────────────────────────────────────── */}
      <ActionModals
        defaultSiteId={selectedSiteId}
        isOpenPurchase={openPurchase}
        onClosePurchase={() => setOpenPurchase(false)}
        isOpenWorkLog={openWorkLog}
        onCloseWorkLog={() => setOpenWorkLog(false)}
        isOpenVendorPay={openVendorPay}
        onCloseVendorPay={() => setOpenVendorPay(false)}
        isOpenWorkerPay={openWorkerPay}
        onCloseWorkerPay={() => setOpenWorkerPay(false)}
        isOpenIncome={openIncome}
        onCloseIncome={() => setOpenIncome(false)}
        isOpenExpense={openExpense}
        onCloseExpense={() => setOpenExpense(false)}
      />
    </div>
  );
}
