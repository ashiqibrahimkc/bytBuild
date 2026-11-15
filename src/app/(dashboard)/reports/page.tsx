"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FileBarChart,
  Printer,
  Calendar,
  Building2,
  Truck,
  Users,
  IndianRupee,
  Receipt,
  Layers,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

type ReportType =
  | "SITE_STATEMENT"
  | "VENDOR_LEDGER"
  | "WORKER_PAYROLL"
  | "CASH_BOOK"
  | "EXPENSE_CATEGORY";

export default function ReportsPage() {
  const {
    role,
    companyName,
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
  } = useConstruction();

  const [activeReport, setActiveReport] = useState<ReportType>("SITE_STATEMENT");

  // Filters - Defaults to ALL for consolidated views
  const [selectedSiteId, setSelectedSiteId] = useState<string>("ALL");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("ALL");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("ALL");

  // Date Filtering
  const [datePreset, setDatePreset] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [generatedDate, setGeneratedDate] = useState("");

  useEffect(() => {
    setGeneratedDate(
      new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );
  }, []);

  // Quick Preset Date selector
  const handlePresetSelect = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "THIS_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const today = now.toISOString().split("T")[0];
      setStartDate(firstDay);
      setEndDate(today);
    } else if (preset === "LAST_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
        .toISOString()
        .split("T")[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === "THIS_WEEK") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff)).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      setStartDate(monday);
      setEndDate(today);
    }
    setCurrentPage(1);
  };

  const isDateInRange = (dateStr: string) => {
    if (!startDate && !endDate) return true;
    const d = new Date(dateStr).getTime();
    if (startDate && d < new Date(startDate).getTime()) return false;
    if (endDate && d > new Date(endDate).getTime() + 86400000) return false;
    return true;
  };

  // ─── 1. Site Statement Dataset ───────────────────────────────────────────
  const siteTransactions = useMemo(() => {
    const list: any[] = [];
    const isTargetSite = (siteId?: string) => {
      if (selectedSiteId === "ALL" || !selectedSiteId) return true;
      return siteId === selectedSiteId;
    };

    // Purchases
    vendorPurchases
      .filter((p) => isTargetSite(p.siteId) && isDateInRange(p.purchaseDate))
      .forEach((p) => {
        const v = vendors.find((ven) => ven.id === p.vendorId);
        const s = sites.find((site) => site.id === p.siteId);
        list.push({
          id: p.id,
          date: p.purchaseDate,
          type: "MATERIAL_PURCHASE",
          party: `${v?.name || "Vendor"} (${v?.tradeCategory || "Material"})${selectedSiteId === "ALL" && s ? ` • ${s.name}` : ""}`,
          voucher: p.voucherNo,
          notes: p.notes,
          debit: p.amount,
          credit: 0,
        });
      });

    // Labor
    workerWorkLogs
      .filter((w) => isTargetSite(w.siteId) && isDateInRange(w.workDate))
      .forEach((w) => {
        const wk = workers.find((wrk) => wrk.id === w.workerId);
        const s = sites.find((site) => site.id === w.siteId);
        list.push({
          id: w.id,
          date: w.workDate,
          type: "LABOR_WAGE",
          party: `${wk?.name || "Worker"} (${wk?.trade || "Labor"})${selectedSiteId === "ALL" && s ? ` • ${s.name}` : ""}`,
          voucher: undefined,
          notes: w.notes,
          debit: w.wageAmount,
          credit: 0,
        });
      });

    // Misc
    companyExpenses
      .filter((e) => (e.siteId ? isTargetSite(e.siteId) : selectedSiteId === "ALL") && isDateInRange(e.expenseDate))
      .forEach((e) => {
        const s = sites.find((site) => site.id === e.siteId);
        list.push({
          id: e.id,
          date: e.expenseDate,
          type: "SITE_EXPENSE",
          party: `Overhead: ${e.category.replace("_", " ")}${s ? ` • ${s.name}` : ""}`,
          voucher: e.voucherNo,
          notes: e.notes,
          debit: e.amount,
          credit: 0,
        });
      });

    // Incomes
    if (role === "OWNER") {
      siteIncomes
        .filter((i) => isTargetSite(i.siteId) && isDateInRange(i.incomeDate))
        .forEach((i) => {
          const s = sites.find((site) => site.id === i.siteId);
          list.push({
            id: i.id,
            date: i.incomeDate,
            type: "CLIENT_INCOME",
            party: `Client Payment (${i.receivedFrom || "Client"})${selectedSiteId === "ALL" && s ? ` • ${s.name}` : ""}`,
            voucher: i.referenceNo,
            notes: i.notes,
            debit: 0,
            credit: i.amount,
          });
        });
    }

    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runBal = 0;
    return list.map((item) => {
      runBal += item.credit - item.debit;
      return { ...item, balance: runBal };
    });
  }, [
    selectedSiteId,
    vendorPurchases,
    workerWorkLogs,
    companyExpenses,
    siteIncomes,
    vendors,
    workers,
    sites,
    role,
    startDate,
    endDate,
  ]);

  // ─── 2. Vendor Ledger Dataset ────────────────────────────────────────────
  const vendorTransactions = useMemo(() => {
    const list: any[] = [];
    const targetPurchases =
      selectedVendorId === "ALL"
        ? vendorPurchases
        : vendorPurchases.filter((p) => p.vendorId === selectedVendorId);

    const targetPayments =
      selectedVendorId === "ALL"
        ? vendorPayments
        : vendorPayments.filter((p) => p.vendorId === selectedVendorId);

    targetPurchases
      .filter((p) => isDateInRange(p.purchaseDate))
      .forEach((p) => {
        const v = vendors.find((ven) => ven.id === p.vendorId);
        const s = sites.find((site) => site.id === p.siteId);
        list.push({
          id: p.id,
          date: p.purchaseDate,
          party: v?.name || "Vendor",
          site: s?.name || "Site",
          type: "PURCHASE_BILL",
          voucher: p.voucherNo,
          notes: p.notes,
          billedCredit: p.amount,
          paidDebit: 0,
        });
      });

    targetPayments
      .filter((p) => isDateInRange(p.paymentDate))
      .forEach((p) => {
        const v = vendors.find((ven) => ven.id === p.vendorId);
        const s = sites.find((site) => site.id === p.siteId);
        list.push({
          id: p.id,
          date: p.paymentDate,
          party: v?.name || "Vendor",
          site: s?.name || "General Payment",
          type: "PAYMENT_SETTLEMENT",
          voucher: p.voucherNo,
          notes: p.notes,
          billedCredit: 0,
          paidDebit: p.amount,
        });
      });

    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runBal = 0;
    return list.map((item) => {
      runBal += item.billedCredit - item.paidDebit;
      return { ...item, balance: runBal };
    });
  }, [selectedVendorId, vendorPurchases, vendorPayments, vendors, sites, startDate, endDate]);

  // ─── 3. Worker Payroll Register Dataset ───────────────────────────────────
  const workerTransactions = useMemo(() => {
    const list: any[] = [];
    const targetLogs =
      selectedWorkerId === "ALL"
        ? workerWorkLogs
        : workerWorkLogs.filter((w) => w.workerId === selectedWorkerId);

    const targetPayments =
      selectedWorkerId === "ALL"
        ? workerPayments
        : workerPayments.filter((p) => p.workerId === selectedWorkerId);

    targetLogs
      .filter((w) => isDateInRange(w.workDate))
      .forEach((w) => {
        const worker = workers.find((wrk) => wrk.id === w.workerId);
        const site = sites.find((s) => s.id === w.siteId);
        list.push({
          id: w.id,
          date: w.workDate,
          workerName: worker?.name || "Worker",
          trade: worker?.trade || "Labor",
          siteName: site?.name || "Site",
          type: "WAGE_EARNED",
          notes: w.notes,
          voucher: "-",
          earnedCredit: w.wageAmount,
          paidDebit: 0,
        });
      });

    targetPayments
      .filter((p) => isDateInRange(p.paymentDate))
      .forEach((p) => {
        const worker = workers.find((wrk) => wrk.id === p.workerId);
        list.push({
          id: p.id,
          date: p.paymentDate,
          workerName: worker?.name || "Worker",
          trade: worker?.trade || "Labor",
          siteName: "Disbursement",
          type: "WAGE_PAYMENT",
          notes: p.notes,
          voucher: p.voucherNo || "-",
          earnedCredit: 0,
          paidDebit: p.amount,
        });
      });

    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runBal = 0;
    return list.map((item) => {
      runBal += item.earnedCredit - item.paidDebit;
      return { ...item, balance: runBal };
    });
  }, [selectedWorkerId, workerWorkLogs, workerPayments, workers, sites, startDate, endDate]);

  // ─── 4. Master Cash Flow Ledger Dataset ──────────────────────────────────
  const cashFlowTransactions = useMemo(() => {
    const list: any[] = [];

    if (role === "OWNER") {
      siteIncomes
        .filter((i) => isDateInRange(i.incomeDate))
        .forEach((i) => {
          const s = sites.find((site) => site.id === i.siteId);
          list.push({
            id: i.id,
            date: i.incomeDate,
            category: "Client Site Inflow",
            party: i.receivedFrom || "Client",
            site: s?.name || "Site",
            voucher: i.referenceNo || "-",
            inflow: i.amount,
            outflow: 0,
          });
        });
    }

    vendorPayments
      .filter((p) => isDateInRange(p.paymentDate))
      .forEach((p) => {
        const v = vendors.find((ven) => ven.id === p.vendorId);
        const s = sites.find((site) => site.id === p.siteId);
        list.push({
          id: p.id,
          date: p.paymentDate,
          category: "Vendor Bill Settlement",
          party: v?.name || "Vendor",
          site: s?.name || "General",
          voucher: p.voucherNo || "-",
          inflow: 0,
          outflow: p.amount,
        });
      });

    workerPayments
      .filter((p) => isDateInRange(p.paymentDate))
      .forEach((p) => {
        const w = workers.find((wrk) => wrk.id === p.workerId);
        list.push({
          id: p.id,
          date: p.paymentDate,
          category: "Labor Wage Disbursement",
          party: w?.name || "Worker",
          site: "Wage Settlement",
          voucher: p.voucherNo || "-",
          inflow: 0,
          outflow: p.amount,
        });
      });

    companyExpenses
      .filter((e) => isDateInRange(e.expenseDate))
      .forEach((e) => {
        const s = sites.find((site) => site.id === e.siteId);
        list.push({
          id: e.id,
          date: e.expenseDate,
          category: `Overhead: ${e.category.replace("_", " ")}`,
          party: e.category,
          site: s?.name || "General HQ",
          voucher: e.voucherNo || "-",
          inflow: 0,
          outflow: e.amount,
        });
      });

    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runCash = 0;
    return list.map((item) => {
      runCash += item.inflow - item.outflow;
      return { ...item, netCash: runCash };
    });
  }, [
    siteIncomes,
    vendorPayments,
    workerPayments,
    companyExpenses,
    vendors,
    workers,
    sites,
    role,
    startDate,
    endDate,
  ]);

  // Current active dataset
  const activeDataset = useMemo(() => {
    switch (activeReport) {
      case "SITE_STATEMENT":
        return siteTransactions;
      case "VENDOR_LEDGER":
        return vendorTransactions;
      case "WORKER_PAYROLL":
        return workerTransactions;
      case "CASH_BOOK":
      case "EXPENSE_CATEGORY":
        return cashFlowTransactions;
      default:
        return [];
    }
  }, [
    activeReport,
    siteTransactions,
    vendorTransactions,
    workerTransactions,
    cashFlowTransactions,
  ]);

  // Aggregate Totals for active dataset
  const summaryTotals = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    if (activeReport === "SITE_STATEMENT") {
      activeDataset.forEach((item) => {
        totalDebit += item.debit || 0;
        totalCredit += item.credit || 0;
      });
    } else if (activeReport === "VENDOR_LEDGER") {
      activeDataset.forEach((item) => {
        totalCredit += item.billedCredit || 0;
        totalDebit += item.paidDebit || 0;
      });
    } else if (activeReport === "WORKER_PAYROLL") {
      activeDataset.forEach((item) => {
        totalCredit += item.earnedCredit || 0;
        totalDebit += item.paidDebit || 0;
      });
    } else {
      activeDataset.forEach((item) => {
        totalCredit += item.inflow || 0;
        totalDebit += item.outflow || 0;
      });
    }

    return {
      totalDebit,
      totalCredit,
      netBalance: totalCredit - totalDebit,
    };
  }, [activeDataset, activeReport]);

  // Paginated slice
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeDataset.slice(start, start + pageSize);
  }, [activeDataset, currentPage, pageSize]);

  const currentSiteObj = sites.find((s) => s.id === selectedSiteId);

  return (
    <div className="space-y-4">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-amber-500 text-slate-950 p-2 shadow-xs">
              <FileBarChart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Financial Accounting Reports
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Certified multi-site statements, vendor payables ledger, and daily wage registers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8.5 px-3 text-xs bg-white text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print Active Report
          </Button>
        </div>
      </div>

      {/* ── Sleek Segmented Navigation Tabs (Centered) ──────────────────── */}
      <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto mx-auto w-fit max-w-full shadow-2xs print:hidden">
        {[
          { id: "SITE_STATEMENT", label: "Client Statement", icon: Building2 },
          { id: "VENDOR_LEDGER", label: "Vendor Payables", icon: Truck },
          { id: "WORKER_PAYROLL", label: "Wage Register", icon: Users },
          { id: "CASH_BOOK", label: "Cash Flow Ledger", icon: IndianRupee },
          { id: "EXPENSE_CATEGORY", label: "Category Summary", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveReport(tab.id as ReportType);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <Icon className={`h-4 w-4 ${isSelected ? "text-amber-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Unified Compact Filter Toolbar (Aligned & Centered) ──────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs print:hidden">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-center">
          {/* Target Filter (Aligned & Text-Center) */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider text-center shrink-0">
              Filter Target:
            </span>

            {activeReport === "SITE_STATEMENT" && (
              <select
                value={selectedSiteId}
                onChange={(e) => {
                  setSelectedSiteId(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-none min-w-[220px] text-center cursor-pointer"
              >
                <option value="ALL">All Sites (Consolidated Statement)</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.clientName ? `(${s.clientName})` : ""}
                  </option>
                ))}
              </select>
            )}

            {activeReport === "VENDOR_LEDGER" && (
              <select
                value={selectedVendorId}
                onChange={(e) => {
                  setSelectedVendorId(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-none min-w-[220px] text-center cursor-pointer"
              >
                <option value="ALL">All Vendors (Combined Credit)</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.tradeCategory})
                  </option>
                ))}
              </select>
            )}

            {activeReport === "WORKER_PAYROLL" && (
              <select
                value={selectedWorkerId}
                onChange={(e) => {
                  setSelectedWorkerId(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-none min-w-[220px] text-center cursor-pointer"
              >
                <option value="ALL">All Workers (Complete Register)</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.trade})
                  </option>
                ))}
              </select>
            )}

            {(activeReport === "CASH_BOOK" || activeReport === "EXPENSE_CATEGORY") && (
              <Badge variant="outline" className="text-xs font-mono font-medium text-center">
                Company-wide Consolidated Book
              </Badge>
            )}
          </div>

          {/* Clean Divider */}
          <div className="hidden lg:block h-6 w-px bg-slate-200" />

          {/* Date Controls (Aligned & Text-Center) */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-center">
            {/* Presets */}
            <div className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-center shadow-2xs">
              {[
                { id: "ALL", label: "All Time" },
                { id: "THIS_MONTH", label: "This Month" },
                { id: "LAST_MONTH", label: "Last Month" },
                { id: "THIS_WEEK", label: "This Week" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold text-center transition-all cursor-pointer ${
                    datePreset === p.id
                      ? "bg-slate-900 text-white shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Range */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="text-slate-400 font-mono text-[11px] uppercase">Period:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("CUSTOM");
                  setCurrentPage(1);
                }}
                className="h-8.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-mono text-center shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("CUSTOM");
                  setCurrentPage(1);
                }}
                className="h-8.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-mono text-center shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => handlePresetSelect("ALL")}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold cursor-pointer ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Certified Accountant Statement Letterhead Card ───────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden print:shadow-none print:border-none">
        {/* Letterhead Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-black text-slate-950 text-xl sm:text-2xl tracking-tight">
                  {companyName}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <ShieldCheck className="h-3 w-3" />
                  AUDITED STATEMENT
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-500 font-mono">
                BytBuild Financial ERP • Certified Multi-Site Statement
              </p>

              <h2 className="text-sm sm:text-base font-bold text-slate-800 pt-0.5">
                {activeReport === "SITE_STATEMENT" &&
                  (selectedSiteId === "ALL"
                    ? "Client Billing Statement: All Sites (Consolidated)"
                    : `Client Billing Statement: ${currentSiteObj?.name || "Selected Site"}`)}
                {activeReport === "VENDOR_LEDGER" &&
                  (selectedVendorId === "ALL"
                    ? "Vendor Statement of Account & Payables Ledger (All Vendors)"
                    : `Vendor Statement of Account: ${vendors.find((v) => v.id === selectedVendorId)?.name || "Selected Vendor"}`)}
                {activeReport === "WORKER_PAYROLL" &&
                  (selectedWorkerId === "ALL"
                    ? "Worker Daily Wage Register & Payroll Sheet (All Workers)"
                    : `Worker Daily Wage Statement: ${workers.find((w) => w.id === selectedWorkerId)?.name || "Selected Worker"}`)}
                {activeReport === "CASH_BOOK" && "Master Cash Book (Actual Inflows & Outflows)"}
                {activeReport === "EXPENSE_CATEGORY" && "Categorical Cost Center Expenditure Analysis"}
              </h2>

              <p className="text-xs text-slate-500">
                Period: <strong>{startDate || "All Time"}</strong> to <strong>{endDate || "Present"}</strong> • Generated: <strong>{generatedDate || "Today"}</strong>
              </p>
            </div>

            {/* Quick Metrics Header Tiles */}
            <div className="flex flex-wrap items-center gap-2 font-mono">
              <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-right shadow-2xs">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  Total Debit (-)
                </span>
                <span className="text-sm font-black text-rose-600">
                  {formatCurrency(summaryTotals.totalDebit)}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-right shadow-2xs">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  Total Credit (+)
                </span>
                <span className="text-sm font-black text-emerald-600">
                  {formatCurrency(summaryTotals.totalCredit)}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-right shadow-2xs">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  Transactions
                </span>
                <span className="text-sm font-black text-amber-400">
                  {activeDataset.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {activeDataset.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-slate-400 italic">
            No transactions found within the selected date range.
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              {/* 1. TABLE: Site Statement */}
              {activeReport === "SITE_STATEMENT" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-2.5 px-3.5 font-bold">Date</th>
                      <th className="py-2.5 px-3.5 font-bold">Particulars / Party</th>
                      <th className="py-2.5 px-3.5 font-bold">Voucher / Ref</th>
                      <th className="py-2.5 px-3.5 font-bold">Description</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Debit / Cost (-)</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Credit / Inflow (+)</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Net Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-800">{item.party}</td>
                        <td className="py-2.5 px-3.5 font-mono text-xs text-slate-600">
                          {item.voucher ? `#${item.voucher}` : "-"}
                        </td>
                        <td className="py-2.5 px-3.5 text-xs text-slate-500">{item.notes || "-"}</td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-rose-600 font-mono">
                          {item.debit > 0 ? formatCurrency(item.debit) : "-"}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-emerald-600 font-mono">
                          {item.credit > 0 ? formatCurrency(item.credit) : "-"}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-black text-slate-900 font-mono">
                          {formatCurrency(item.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* 2. TABLE: Vendor Ledger */}
              {activeReport === "VENDOR_LEDGER" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-2.5 px-3.5 font-bold">Date</th>
                      <th className="py-2.5 px-3.5 font-bold">Vendor Name</th>
                      <th className="py-2.5 px-3.5 font-bold">Site Allocated</th>
                      <th className="py-2.5 px-3.5 font-bold">Voucher No.</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Billed Credit (+)</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Paid Debit (-)</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Balance Owed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-800">{item.party}</td>
                        <td className="py-2.5 px-3.5 text-slate-600">{item.site}</td>
                        <td className="py-2.5 px-3.5 font-mono text-xs text-slate-600">
                          {item.voucher ? `#${item.voucher}` : "-"}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-amber-700 font-mono">
                          {item.billedCredit > 0 ? formatCurrency(item.billedCredit) : "-"}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-emerald-600 font-mono">
                          {item.paidDebit > 0 ? formatCurrency(item.paidDebit) : "-"}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-black text-rose-600 font-mono">
                          {formatCurrency(item.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* 3. TABLE: Worker Payroll */}
              {activeReport === "WORKER_PAYROLL" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-2.5 px-3.5 font-bold">Date</th>
                      <th className="py-2.5 px-3.5 font-bold">Worker Name</th>
                      <th className="py-2.5 px-3.5 font-bold">Trade / Skill</th>
                      <th className="py-2.5 px-3.5 font-bold">Site Allocated</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Wage Earned (+)</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Cash Paid (-)</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Unpaid Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-800">
                          {item.workerName}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500">{item.trade}</td>
                        <td className="py-2.5 px-3.5 text-slate-600">{item.siteName}</td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-orange-700 font-mono">
                          {item.earnedCredit > 0 ? formatCurrency(item.earnedCredit) : "-"}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-emerald-600 font-mono">
                          {item.paidDebit > 0 ? formatCurrency(item.paidDebit) : "-"}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-black text-slate-900 font-mono">
                          {formatCurrency(item.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* 4. TABLE: Master Cash Book */}
              {(activeReport === "CASH_BOOK" || activeReport === "EXPENSE_CATEGORY") && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200 font-mono">
                    <tr>
                      <th className="py-2.5 px-3.5 font-bold">Date</th>
                      <th className="py-2.5 px-3.5 font-bold">Category / Account</th>
                      <th className="py-2.5 px-3.5 font-bold">Party / Description</th>
                      <th className="py-2.5 px-3.5 font-bold">Site Reference</th>
                      <th className="py-2.5 px-3.5 font-bold">Voucher / UTR</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Inflow (+)</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Outflow (-)</th>
                      <th className="py-2.5 px-3.5 font-bold text-right">Net Cash In Hand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-800">{item.category}</td>
                        <td className="py-2.5 px-3.5 text-slate-600">{item.party}</td>
                        <td className="py-2.5 px-3.5 text-slate-500">{item.site}</td>
                        <td className="py-2.5 px-3.5 font-mono text-xs text-slate-600">{item.voucher}</td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-emerald-600 font-mono">
                          {item.inflow > 0 ? formatCurrency(item.inflow) : "-"}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-rose-600 font-mono">
                          {item.outflow > 0 ? formatCurrency(item.outflow) : "-"}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-black text-slate-900 font-mono">
                          {role === "OWNER" ? formatCurrency(item.netCash) : "••••••"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Universal Pagination */}
            <div className="p-3 border-t border-slate-100 print:hidden">
              <Pagination
                currentPage={currentPage}
                totalItems={activeDataset.length}
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(sz) => setPageSize(sz)}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>

            {/* Accountant Formal Sign-off Stamps */}
            <div className="p-5 border-t border-slate-200 bg-slate-50/50 grid grid-cols-3 gap-6 text-center text-xs text-slate-500">
              <div className="border-t border-dashed border-slate-300 pt-2.5">
                <span className="font-bold text-slate-800 block text-xs">Chief Financial Accountant</span>
                <span className="text-[10px] text-slate-400">Ledger Verified &amp; Balanced</span>
              </div>
              <div className="border-t border-dashed border-slate-300 pt-2.5">
                <span className="font-bold text-slate-800 block text-xs">Site Project Manager</span>
                <span className="text-[10px] text-slate-400">Field Audit &amp; Labor Verified</span>
              </div>
              <div className="border-t border-dashed border-slate-300 pt-2.5">
                <span className="font-bold text-slate-800 block text-xs">Managing Director / Owner</span>
                <span className="text-[10px] text-slate-400">Final Financial Approval</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
