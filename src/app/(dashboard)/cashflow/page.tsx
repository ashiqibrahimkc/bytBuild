"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Fuel,
  Coffee,
  Briefcase,
  Wrench,
  Receipt,
  Plus,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  Calendar,
  Filter,
  Building,
  Landmark,
  Banknote,
  Printer,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionModals } from "@/components/modals/ActionModals";
import { Pagination } from "@/components/ui/pagination";

export default function CashFlowPage() {
  const {
    companyName,
    role,
    sites,
    companyExpenses,
    vendorPayments,
    workerPayments,
    siteIncomes,
    getMasterCashFlow,
  } = useConstruction();

  const cashFlow = getMasterCashFlow();

  const [openExpense, setOpenExpense] = useState(false);
  const [openIncome, setOpenIncome] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [datePreset, setDatePreset] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
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

  // Group company overhead by category
  const expensesByCategory = companyExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
    return acc;
  }, {} as Record<string, number>);

  // Master Cash In & Out Ledger (Actual bank / cash movements only)
  const cashMovements = [
    ...siteIncomes.map((inc) => ({
      id: inc.id,
      date: inc.incomeDate,
      direction: "INFLOW" as const,
      category: "Client Advance / Site Inflow",
      party: inc.receivedFrom || "Client",
      site: sites.find((s) => s.id === inc.siteId)?.name || "Site",
      refNo: inc.referenceNo || "-",
      notes: inc.notes,
      amount: inc.amount,
      mode: inc.paymentMode,
    })),
    ...vendorPayments.map((vp) => ({
      id: vp.id,
      date: vp.paymentDate,
      direction: "OUTFLOW" as const,
      category: "Vendor Bill Settlement",
      party: "Material Supplier",
      site: sites.find((s) => s.id === vp.siteId)?.name || "General Payment",
      refNo: vp.voucherNo || "-",
      notes: vp.notes,
      amount: vp.amount,
      mode: vp.paymentMode,
    })),
    ...workerPayments.map((wp) => ({
      id: wp.id,
      date: wp.paymentDate,
      direction: "OUTFLOW" as const,
      category: "Worker Wage Disbursement",
      party: "Worker Wage",
      site: "Labor Settlement",
      refNo: wp.voucherNo || "-",
      notes: wp.notes,
      amount: wp.amount,
      mode: wp.paymentMode,
    })),
    ...companyExpenses.map((exp) => ({
      id: exp.id,
      date: exp.expenseDate,
      direction: "OUTFLOW" as const,
      category: `Overhead (${exp.category.replace("_", " ")})`,
      party: "Company Expense",
      site: sites.find((s) => s.id === exp.siteId)?.name || "Company Overhead",
      refNo: exp.voucherNo || "-",
      notes: exp.notes,
      amount: exp.amount,
      mode: exp.paymentMode,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredMovements = cashMovements.filter((m) => {
    if (startDate && new Date(m.date) < new Date(startDate)) return false;
    if (endDate && new Date(m.date) > new Date(endDate + "T23:59:59")) return false;
    return true;
  });

  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* ── Top Overview & Overhead (Hidden when printing cash movement ledger) ── */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Company Cash Flow & Overhead
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real cash reconciliation: Cash in hand, actual cash outflows (vendors, wages, petrol), and client receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print Cash Book
          </Button>
          <Button onClick={() => setOpenExpense(true)} className="bg-slate-900 hover:bg-slate-800">
            <Fuel className="h-4 w-4 mr-1.5" />
            + Record Overhead / Petrol
          </Button>
          {role === "OWNER" && (
            <Button onClick={() => setOpenIncome(true)} variant="success">
              <IndianRupee className="h-4 w-4 mr-1.5" />
              + Client Income
            </Button>
          )}
        </div>
      </div>

      {/* RBAC Notice if Manager */}
      {role === "MANAGER" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>RBAC Restriction:</strong> You are currently viewing as <strong>Manager</strong>. Overall company cash balance and client inflows are masked. Switch to Owner role at top right to view master balance.
            </span>
          </div>
        </div>
      )}

      {/* Cash Flow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash in Hand */}
        <Card className="border-l-4 border-l-amber-500 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold">
                Net Cash in Hand
              </CardDescription>
              <Wallet className="h-4 w-4 text-amber-600" />
            </div>
            {role === "OWNER" ? (
              <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatCurrency(cashFlow.currentCashInHand)}
              </CardTitle>
            ) : (
              <div className="py-1 text-sm font-semibold text-slate-400">
                •••••••• (Owner only)
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-slate-500">
            Inflows ({formatCurrency(cashFlow.totalCashReceived)}) minus Outflows ({formatCurrency(cashFlow.totalCashOutflow)})
          </CardContent>
        </Card>

        {/* Total Inflows */}
        <Card className="border-l-4 border-l-emerald-500 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold">
                Total Cash Inflows (Clients)
              </CardDescription>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            {role === "OWNER" ? (
              <CardTitle className="text-2xl sm:text-3xl font-black text-emerald-600">
                {formatCurrency(cashFlow.totalCashReceived)}
              </CardTitle>
            ) : (
              <div className="py-1 text-sm font-semibold text-slate-400">
                •••••••• (Owner only)
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-slate-500">
            {siteIncomes.length} client payment transactions
          </CardContent>
        </Card>

        {/* Total Actual Cash Out */}
        <Card className="border-l-4 border-l-rose-500 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold">
                Total Cash Outflows
              </CardDescription>
              <TrendingDown className="h-4 w-4 text-rose-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black text-rose-600">
              {formatCurrency(cashFlow.totalCashOutflow)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-slate-500">
            Vendors ({formatCurrency(cashFlow.totalVendorCashPaid)}) + Wages ({formatCurrency(cashFlow.totalWorkerCashPaid)}) + Overhead ({formatCurrency(cashFlow.totalOverheadCashPaid)})
          </CardContent>
        </Card>

        {/* Total Liabilities Pending */}
        <Card className="border-l-4 border-l-slate-600 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold">
                Total Unsettled Credit (Payables)
              </CardDescription>
              <Clock className="h-4 w-4 text-slate-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-800">
              {formatCurrency(cashFlow.totalVendorPayables + cashFlow.totalWorkerPayables)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-slate-500">
            Vendor Credit: {formatCurrency(cashFlow.totalVendorPayables)} | Worker Wages: {formatCurrency(cashFlow.totalWorkerPayables)}
          </CardContent>
        </Card>
      </div>

      {/* Company Overhead Breakdown */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Non-Site Overhead & Miscellaneous Expenses
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Expenses not directly billed to a single material vendor (petrol for supervisor site visits, tea snacks, permits, office upkeep).
              </CardDescription>
            </div>
            <Button onClick={() => setOpenExpense(true)} size="sm" variant="outline">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Overhead
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Room / Camp Rent", cat: "ROOM_RENT", icon: Building, color: "text-blue-600 dark:text-blue-400", border: "border-l-blue-500" },
              { label: "Company Petrol", cat: "PETROL_FUEL", icon: Fuel, color: "text-amber-600 dark:text-amber-400", border: "border-l-amber-500" },
              { label: "Worker Mess & Tea", cat: "FOOD_TEA_REFRESHMENTS", icon: Coffee, color: "text-emerald-600 dark:text-emerald-400", border: "border-l-emerald-500" },
              { label: "Machinery Hire", cat: "MACHINERY_RENT", icon: Wrench, color: "text-purple-600 dark:text-purple-400", border: "border-l-purple-500" },
              { label: "Office Overhead", cat: "OFFICE_OVERHEAD", icon: Briefcase, color: "text-cyan-600 dark:text-cyan-400", border: "border-l-cyan-500" },
              { label: "Miscellaneous", cat: "MISCELLANEOUS", icon: Receipt, color: "text-slate-600 dark:text-slate-400", border: "border-l-slate-400" },
            ].map((item) => {
              const Icon = item.icon;
              // Sum both aliases if any
              let total = expensesByCategory[item.cat] || 0;
              if (item.cat === "PETROL_FUEL") total += (expensesByCategory["FUEL_TRAVEL"] || 0);
              if (item.cat === "FOOD_TEA_REFRESHMENTS") total += (expensesByCategory["TEA_REFRESHMENTS"] || 0);
              if (item.cat === "MACHINERY_RENT") total += (expensesByCategory["EQUIPMENT_RENT"] || 0);

              return (
                <div key={item.cat} className={`rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 ${item.border} bg-white dark:bg-slate-900 p-3 text-center shadow-xs`}>
                  <Icon className={`h-5 w-5 mx-auto mb-1 ${item.color}`} />
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block truncate">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block mt-1 font-mono">
                    {formatCurrency(total)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Cash Movement Ledger */}
      <Card className="print:border-none print:shadow-none">
        {/* ── Official Printable Cash Book Header (Print Only) ─────────────── */}
        <div className="hidden print:block p-6 border-b-2 border-slate-900 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg border border-slate-300 p-1 flex items-center justify-center bg-white">
                <Image
                  src="/image/logo.png"
                  alt="Company Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                  {companyName}
                </h1>
                <p className="text-xs font-semibold text-slate-600">
                  Treasury Cash Book &amp; Actual Cash In Hand Register
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  bytBuild Construction ERP • Treasury &amp; Cash Reconciliation Division
                </p>
              </div>
            </div>
            <div className="text-right text-xs font-mono">
              <div className="inline-block bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded font-bold uppercase">
                CASH BOOK REGISTER
              </div>
              <p className="text-slate-600 mt-1">Date: {generatedDate || "Official Record"}</p>
              <p className="text-slate-500">Total Entries: {filteredMovements.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200 text-center font-mono">
            <div className="bg-white rounded p-2 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block">Total Cash Inflows</span>
              <span className="font-bold text-emerald-600 text-sm">+{formatCurrency(cashFlow.totalCashReceived)}</span>
            </div>
            <div className="bg-white rounded p-2 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block">Total Cash Outflows</span>
              <span className="font-bold text-rose-600 text-sm">-{formatCurrency(cashFlow.totalCashOutflow)}</span>
            </div>
            <div className="bg-white rounded p-2 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block">Net Cash In Hand</span>
              <span className="font-black text-slate-900 text-sm">{formatCurrency(cashFlow.currentCashInHand)}</span>
            </div>
          </div>
        </div>

        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Cash Movement Book (Actual Inflows & Outflows)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Every Rupee entering or leaving the bank accounts or physical cash box.
            </CardDescription>
          </div>

          {/* Date Filter & Presets */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(["ALL", "THIS_MONTH", "LAST_MONTH", "THIS_WEEK"] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded ${
                    datePreset === preset
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {preset === "ALL"
                    ? "All Time"
                    : preset === "THIS_MONTH"
                    ? "This Month"
                    : preset === "LAST_MONTH"
                    ? "Last Month"
                    : "This Week"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("CUSTOM");
                  setCurrentPage(1);
                }}
                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 bg-white"
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
                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 bg-white"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto print:hidden">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Movement</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Site / Project</th>
                  <th className="py-3 px-4">Mode & Ref</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Inflow (+)</th>
                  <th className="py-3 px-4 text-right">Outflow (-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400 italic">
                      No cash movements recorded matching the selected date criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 text-xs">
                        {formatDate(m.date)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={m.direction === "INFLOW" ? "success" : "destructive"}
                          className="text-[10px]"
                        >
                          {m.direction === "INFLOW" ? "CASH IN" : "CASH OUT"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {m.category}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {m.site}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="font-medium text-slate-700 block">{m.mode}</span>
                        {m.refNo !== "-" && (
                          <span className="font-mono text-slate-400 text-[10px]">#{m.refNo}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {m.notes || "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {m.direction === "INFLOW" ? (role === "OWNER" ? `+${formatCurrency(m.amount)}` : "••••••") : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        {m.direction === "OUTFLOW" ? `-${formatCurrency(m.amount)}` : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Print-Only Table (Full Filtered Cash Book) ────────────────── */}
          <div className="hidden print:block p-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-800 font-mono border-b-2 border-slate-300">
                <tr>
                  <th className="py-2 px-3 font-bold">Date</th>
                  <th className="py-2 px-3 font-bold">Movement</th>
                  <th className="py-2 px-3 font-bold">Category</th>
                  <th className="py-2 px-3 font-bold">Site / Project</th>
                  <th className="py-2 px-3 font-bold">Mode &amp; Ref</th>
                  <th className="py-2 px-3 font-bold">Notes</th>
                  <th className="py-2 px-3 text-right font-bold">Inflow (+)</th>
                  <th className="py-2 px-3 text-right font-bold">Outflow (-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMovements.map((m) => (
                  <tr key={m.id} className="text-slate-800">
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-xs">
                      {formatDate(m.date)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-[10px]">
                      {m.direction === "INFLOW" ? "INFLOW" : "OUTFLOW"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-medium">
                      {m.category}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {m.site}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-xs">
                      {m.mode} {m.refNo !== "-" ? `(#${m.refNo})` : ""}
                    </td>
                    <td className="py-2 px-3 text-xs max-w-sm">
                      {m.notes || "—"}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-bold text-emerald-700">
                      {m.direction === "INFLOW" ? `+${formatCurrency(m.amount)}` : "—"}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-bold text-rose-700">
                      {m.direction === "OUTFLOW" ? `-${formatCurrency(m.amount)}` : "—"}
                    </td>
                  </tr>
                ))}

                {/* Totals Row */}
                <tr className="bg-slate-100 font-bold font-mono border-t-2 border-slate-900">
                  <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-slate-900">
                    Register Totals:
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-800 font-black">
                    +{formatCurrency(
                      filteredMovements
                        .filter((m) => m.direction === "INFLOW")
                        .reduce((sum, m) => sum + m.amount, 0)
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-800 font-black">
                    -{formatCurrency(
                      filteredMovements
                        .filter((m) => m.direction === "OUTFLOW")
                        .reduce((sum, m) => sum + m.amount, 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Print Sign-off Blocks */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto font-bold text-slate-800">
                  Prepared By (Cashier)
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Treasury &amp; Cash Book</p>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto font-bold text-slate-800">
                  Authorized Signatory
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">For {companyName}</p>
              </div>
            </div>
          </div>

          <div className="print:hidden">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredMovements.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </CardContent>
      </Card>

      {/* Global Modals */}
      <ActionModals
        isOpenPurchase={false}
        onClosePurchase={() => {}}
        isOpenWorkLog={false}
        onCloseWorkLog={() => {}}
        isOpenVendorPay={false}
        onCloseVendorPay={() => {}}
        isOpenWorkerPay={false}
        onCloseWorkerPay={() => {}}
        isOpenIncome={openIncome}
        onCloseIncome={() => setOpenIncome(false)}
        isOpenExpense={openExpense}
        onCloseExpense={() => setOpenExpense(false)}
      />
    </div>
  );
}

