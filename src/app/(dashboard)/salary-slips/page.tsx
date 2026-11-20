"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileCheck,
  Printer,
  Download,
  IndianRupee,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Search,
  Building2,
  ShieldAlert,
  CreditCard,
  Plus,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Receipt,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SalarySlip, PaymentMode, Worker } from "@/lib/types";
import { SalarySlipsSkeleton } from "@/components/ui/page-skeletons";

// Helper: Convert number to Indian Rupee Words
function numberToWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Rupees Only";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n: number): string => {
    let str = "";
    if (n >= 10000000) {
      str += inWords(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      str += inWords(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      str += inWords(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (n >= 100) {
      str += inWords(Math.floor(n / 100)) + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "and ";
      if (n < 20) str += a[n] + " ";
      else {
        str += b[Math.floor(n / 10)] + (n % 10 > 0 ? " " + a[n % 10] : "") + " ";
      }
    }
    return str.trim();
  };

  const words = inWords(Math.floor(num));
  return `${words} Rupees Only`;
}

// Generate Month Options (Past 12 months + current)
function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    options.push({ value, label });
  }
  return options;
}

function SalarySlipsContent() {
  const {
    role,
    isDbLoading,
    companyName,
    workers,
    companyExpenses,
    salarySlips,
    generateSalarySlip,
    deleteSalarySlip,
    getWorkerMonthlySalaryInfo,
    canAccessPage,
  } = useConstruction();

  const searchParams = useSearchParams();
  const workerIdFromUrl = searchParams.get("workerId") || "";

  // Month Selection
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthOptions[0]?.value || "2026-11"
  );
  const selectedMonthLabel = useMemo(() => {
    return (
      monthOptions.find((m) => m.value === selectedMonth)?.label ||
      selectedMonth
    );
  }, [monthOptions, selectedMonth]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ROSTER" | "ARCHIVE">("ROSTER");

  // Modal States
  const [generatingWorker, setGeneratingWorker] = useState<Worker | null>(null);
  const [viewingSlip, setViewingSlip] = useState<SalarySlip | null>(null);

  // Slip Form Inputs
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [voucherNo, setVoucherNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // RBAC Permission Gate
  const hasAccess =
    role.toUpperCase() === "OWNER" ||
    role.toUpperCase() === "ADMIN" ||
    canAccessPage("salary-slips");

  // Auto-open worker from URL if present
  useEffect(() => {
    if (workerIdFromUrl && workers.length > 0) {
      const targetWorker = workers.find((w) => w.id === workerIdFromUrl);
      if (targetWorker) {
        // Check if slip already exists for current month
        const info = getWorkerMonthlySalaryInfo(targetWorker.id, selectedMonth);
        if (info.alreadyGenerated && info.existingSlip) {
          setViewingSlip(info.existingSlip);
        } else if (targetWorker.compensationType === "MONTHLY_SALARY") {
          setGeneratingWorker(targetWorker);
          setVoucherNo(`SAL-${selectedMonth.replace("-", "")}-${targetWorker.id.slice(-4)}`);
        }
      }
    }
  }, [workerIdFromUrl, workers, selectedMonth, getWorkerMonthlySalaryInfo]);

  // Salaried Workers Only
  const salariedWorkers = useMemo(() => {
    return workers.filter((w) => w.compensationType === "MONTHLY_SALARY");
  }, [workers]);

  // Filtered Salaried Workers for Roster
  const filteredSalariedWorkers = useMemo(() => {
    if (!searchQuery.trim()) return salariedWorkers;
    const q = searchQuery.toLowerCase();
    return salariedWorkers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.trade.toLowerCase().includes(q) ||
        w.phone.toLowerCase().includes(q)
    );
  }, [salariedWorkers, searchQuery]);

  // Filtered Historical Slips
  const filteredArchiveSlips = useMemo(() => {
    return salarySlips.filter((slip) => {
      if (selectedMonth && slip.monthYear !== selectedMonth) {
        // Can filter by selected month or show all
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        slip.workerName.toLowerCase().includes(q) ||
        slip.slipNumber.toLowerCase().includes(q) ||
        slip.workerTrade.toLowerCase().includes(q) ||
        (slip.voucherNo && slip.voucherNo.toLowerCase().includes(q))
      );
    });
  }, [salarySlips, selectedMonth, searchQuery]);

  // Month Statistics
  const monthStats = useMemo(() => {
    let totalGrossSalary = 0;
    let totalAdvancesDeducted = 0;
    let totalNetPayable = 0;
    let generatedCount = 0;
    let pendingCount = 0;

    salariedWorkers.forEach((w) => {
      const info = getWorkerMonthlySalaryInfo(w.id, selectedMonth);
      totalGrossSalary += info.monthlySalary;
      totalAdvancesDeducted += info.advanceDeductions;
      totalNetPayable += info.netPayableAmount;
      if (info.alreadyGenerated) {
        generatedCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      totalGrossSalary,
      totalAdvancesDeducted,
      totalNetPayable,
      generatedCount,
      pendingCount,
      totalStaff: salariedWorkers.length,
    };
  }, [salariedWorkers, selectedMonth, getWorkerMonthlySalaryInfo]);

  // Open Generate Modal
  const handleOpenGenerate = (worker: Worker) => {
    setFormError(null);
    setGeneratingWorker(worker);
    setPaymentMode("CASH");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setVoucherNo(`SAL-${selectedMonth.replace("-", "")}-${Math.floor(100 + Math.random() * 900)}`);
    setNotes(`Monthly Salary for ${selectedMonthLabel}`);
  };

  // Submit Salary Slip Generation
  const handleConfirmGenerate = () => {
    if (!generatingWorker) return;
    setFormError(null);

    const info = getWorkerMonthlySalaryInfo(generatingWorker.id, selectedMonth);
    if (info.alreadyGenerated) {
      setFormError(
        `A salary slip for ${selectedMonthLabel} has already been generated for this worker. Monthly salary slips can only be generated ONCE per month.`
      );
      return;
    }

    const result = generateSalarySlip({
      workerId: generatingWorker.id,
      workerName: generatingWorker.name,
      workerTrade: generatingWorker.trade,
      monthYear: selectedMonth,
      monthLabel: selectedMonthLabel,
      baseSalary: info.monthlySalary,
      advanceDeductions: info.advanceDeductions,
      netPayableAmount: info.netPayableAmount,
      paymentMode,
      paymentDate,
      voucherNo: voucherNo.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (result.success && result.slip) {
      setGeneratingWorker(null);
      setViewingSlip(result.slip); // Immediately show printable slip
    } else {
      setFormError(result.message || "Failed to generate salary slip.");
    }
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <div className="rounded-2xl bg-rose-50 p-4 text-rose-600 border border-rose-200 mb-4 shadow-xs">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted by RBAC</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          You do not have security authorization to view or generate worker salary slips.
          Please contact your System Administrator or Company Owner to request access in Team & Permissions.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
          <span>Current active role:</span>
          <Badge variant="secondary">{role}</Badge>
        </div>
      </div>
    );
  }

  if (isDbLoading) {
    return <SalarySlipsSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 print:p-0 print:m-0 print:max-w-none">
      <div className="space-y-6 print:hidden">
        {/* ── Page Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-xs">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Monthly Salary Slips &amp; Payroll
                  </h1>
                  <Badge className="bg-indigo-600 text-white font-mono text-[10px] tracking-wide">
                    Single-Issuance Rule
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate certified 1-time monthly pay slips with automatic deduction of salary advances.
                </p>
              </div>
            </div>
          </div>

          {/* Month Selector Bar */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
            <Calendar className="h-4 w-4 text-slate-400 ml-2" />
            <span className="text-xs font-semibold text-slate-600">Pay Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── KPI Summary Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Gross Roll */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Gross Monthly Roll</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(monthStats.totalGrossSalary)}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                For {monthStats.totalStaff} monthly salaried worker(s) in {selectedMonthLabel}
              </p>
            </CardContent>
          </Card>

          {/* Advances Deducted */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Advances Deducted</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-rose-600 font-mono">
                -{formatCurrency(monthStats.totalAdvancesDeducted)}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Logged in Company Expenses as &quot;Salary Advance&quot;
              </p>
            </CardContent>
          </Card>

          {/* Net Salary Payable */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Net Payable Balance</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-600 font-mono">
                {formatCurrency(monthStats.totalNetPayable)}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Gross Monthly Salary minus Total Advances
              </p>
            </CardContent>
          </Card>

          {/* Generation Status */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Slip Generation Status</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2 font-mono">
                <span className="text-2xl font-black text-indigo-700">
                  {monthStats.generatedCount}
                </span>
                <span className="text-xs text-slate-400 font-normal">Generated</span>
                <span className="text-slate-300">/</span>
                <span className="text-xl font-bold text-amber-600">
                  {monthStats.pendingCount}
                </span>
                <span className="text-xs text-slate-400 font-normal">Pending</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {monthStats.totalStaff > 0
                  ? `${Math.round((monthStats.generatedCount / monthStats.totalStaff) * 100)}% issued for ${selectedMonthLabel}`
                  : "No salaried staff registered"}
              </p>
            </CardContent>
          </Card>
        </div>



        {/* ── Navigation Tabs & Search ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("ROSTER")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "ROSTER"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Monthly Salary Roster ({filteredSalariedWorkers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ARCHIVE")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "ARCHIVE"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              All Generated Slips Archive ({salarySlips.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search staff, trade, slip #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Link href="/workers">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1 text-slate-700">
                <Users className="h-3.5 w-3.5" />
                Manage Staff
              </Button>
            </Link>
          </div>
        </div>

        {/* ── TAB 1: MONTHLY ROSTER ─────────────────────────────────────────── */}
        {activeTab === "ROSTER" && (
          <>
            {salariedWorkers.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 p-12 text-center bg-white shadow-xs">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Monthly Salaried Staff Registered</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  To generate salary slips, register workers under &quot;Monthly Salary&quot; compensation type in Workers &amp; Wages.
                </p>
                <Link href="/workers">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Go to Workers &amp; Register Salaried Staff
                  </Button>
                </Link>
              </Card>
            ) : (
              <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
                <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Salaried Staff Roster — {selectedMonthLabel}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Gross salary, advance expense deductions, net payable balance, and 1-time slip issuance.
                    </CardDescription>
                  </div>
                </CardHeader>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-mono border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Worker / Employee</th>
                        <th className="py-3 px-4 font-semibold">Trade / Role</th>
                        <th className="py-3 px-4 text-right font-semibold">Gross Salary</th>
                        <th className="py-3 px-4 text-right font-semibold">Advance Deductions</th>
                        <th className="py-3 px-4 text-right font-semibold">Net Balance Payable</th>
                        <th className="py-3 px-4 text-center font-semibold">Slip Status</th>
                        <th className="py-3 px-4 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSalariedWorkers.map((worker) => {
                        const info = getWorkerMonthlySalaryInfo(worker.id, selectedMonth);
                        const isGenerated = info.alreadyGenerated && info.existingSlip;

                        return (
                          <tr
                            key={worker.id}
                            className={`hover:bg-slate-50/70 transition-colors ${isGenerated ? "bg-slate-50/30" : ""
                              }`}
                          >
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 text-sm">
                                {worker.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {worker.phone}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-[10px] bg-slate-50 font-medium">
                                {worker.trade}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(info.monthlySalary)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {info.advanceDeductions > 0 ? (
                                <div className="inline-flex flex-col items-end">
                                  <span className="font-bold text-rose-600">
                                    -{formatCurrency(info.advanceDeductions)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {info.advanceList.length} advance(s)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">₹0</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-sm font-black text-emerald-600">
                              {formatCurrency(info.netPayableAmount)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isGenerated ? (
                                <div className="inline-flex flex-col items-center">
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-semibold gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    ✓ Generated
                                  </Badge>
                                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                                    {info.existingSlip?.slipNumber}
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-[10px] font-medium gap-1">
                                  <Clock className="h-3 w-3 text-amber-500" />
                                  Pending Slip
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isGenerated ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setViewingSlip(info.existingSlip)}
                                    className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold gap-1 shadow-xs"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    View / Print Slip
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenGenerate(worker)}
                                    className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1 shadow-xs"
                                  >
                                    <FileCheck className="h-3.5 w-3.5" />
                                    Generate Slip
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ── TAB 2: ARCHIVED GENERATED SLIPS ───────────────────────────────── */}
        {activeTab === "ARCHIVE" && (
          <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Generated Salary Slips Registry ({filteredArchiveSlips.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Certified historical payroll vouchers issued to monthly salaried staff.
                </CardDescription>
              </div>
            </CardHeader>

            {filteredArchiveSlips.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No salary slips found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-mono border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Slip #</th>
                      <th className="py-3 px-4 font-semibold">Employee</th>
                      <th className="py-3 px-4 font-semibold">Period</th>
                      <th className="py-3 px-4 text-right font-semibold">Gross</th>
                      <th className="py-3 px-4 text-right font-semibold">Advance Deductions</th>
                      <th className="py-3 px-4 text-right font-semibold">Net Paid</th>
                      <th className="py-3 px-4 font-semibold">Payment Mode</th>
                      <th className="py-3 px-4 font-semibold">Payment Date</th>
                      <th className="py-3 px-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredArchiveSlips.map((slip) => (
                      <tr key={slip.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                          {slip.slipNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{slip.workerName}</div>
                          <div className="text-[11px] text-slate-400">{slip.workerTrade}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {slip.monthLabel || slip.monthYear}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {formatCurrency(slip.baseSalary)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600 font-semibold">
                          -{formatCurrency(slip.advanceDeductions)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                          {formatCurrency(slip.netPayableAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {slip.paymentMode.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {formatDate(slip.paymentDate)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingSlip(slip)}
                              className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
                            >
                              <Printer className="h-3.5 w-3.5 mr-1" />
                              Print
                            </Button>
                            {(role.toUpperCase() === "OWNER" || role.toUpperCase() === "ADMIN") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Are you sure you want to delete slip #${slip.slipNumber}? This will remove the pay slip record.`
                                    )
                                  ) {
                                    deleteSalarySlip(slip.id);
                                  }
                                }}
                                className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                                title="Delete Slip"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ── MODAL 1: GENERATE SALARY SLIP ──────────────────────────────────── */}
      {generatingWorker && (
        <Modal
          isOpen={!!generatingWorker}
          onClose={() => setGeneratingWorker(null)}
          title="Generate Monthly Salary Slip"
          description={`Pay Period: ${selectedMonthLabel} • Staff: ${generatingWorker.name} (${generatingWorker.trade})`}
          maxWidth="xl"
        >
          {(() => {
            const info = getWorkerMonthlySalaryInfo(generatingWorker.id, selectedMonth);
            return (
              <div className="space-y-4 py-2">
                {/* Warning banner */}
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Single Issuance Rule:</strong> This slip can only be generated <strong>once</strong> for {selectedMonthLabel}. The calculated net balance will be settled and reflected in the company cash ledger.
                  </div>
                </div>

                {/* Calculation Breakdown Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span>Gross Monthly Fixed Salary</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(info.monthlySalary)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-rose-600">
                    <div className="flex items-center gap-1.5">
                      <span>Less: Salary Advance Deductions</span>
                      {info.advanceList.length > 0 && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-mono">
                          {info.advanceList.length} entry
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold">
                      -{formatCurrency(info.advanceDeductions)}
                    </span>
                  </div>

                  {/* Itemized Advances if any */}
                  {info.advanceList.length > 0 && (
                    <div className="pl-3 border-l-2 border-rose-200 space-y-1 my-1">
                      {info.advanceList.map((adv) => (
                        <div
                          key={adv.id}
                          className="flex items-center justify-between text-[11px] text-slate-500"
                        >
                          <span>
                            {formatDate(adv.expenseDate)} • {adv.notes || "Salary advance"}
                          </span>
                          <span className="font-mono text-rose-600">
                            -{formatCurrency(adv.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Net Salary Payable
                      </span>
                      <span className="text-[10px] text-slate-500">
                        (Gross Salary - Advance Deductions)
                      </span>
                    </div>
                    <span className="text-xl font-black font-mono text-emerald-600">
                      {formatCurrency(info.netPayableAmount)}
                    </span>
                  </div>
                </div>

                {formError && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Payment Details Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Disbursement Mode *
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="CASH">Cash Disbursement</option>
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS/RTGS)</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="CHEQUE">Bank Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Payment Date *
                    </label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Voucher / Tx Ref #
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. TXN-998822"
                      value={voucherNo}
                      onChange={(e) => setVoucherNo(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Internal Notes / Remarks
                    </label>
                    <Input
                      type="text"
                      placeholder="Optional remarks"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setGeneratingWorker(null)}
                    className="h-9 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmGenerate}
                    className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5"
                  >
                    <FileCheck className="h-4 w-4" />
                    Confirm &amp; Generate Salary Slip
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ── MODAL 2: PRINT-READY CERTIFIED SALARY SLIP ─────────────────────── */}
      {viewingSlip && (
        <Modal
          isOpen={!!viewingSlip}
          onClose={() => setViewingSlip(null)}
          title="Official Certified Salary Slip"
          description={`Slip #${viewingSlip.slipNumber} • ${viewingSlip.monthLabel}`}
          maxWidth="3xl"
        >
          <div className="space-y-4">
            {/* Modal Controls Toolbar (Hidden when printed) */}
            <div className="print:hidden p-3 bg-slate-900 text-white flex items-center justify-between rounded-lg">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold">Printable Payslip Document</h3>
                  <p className="text-[10px] text-slate-400">
                    Slip #{viewingSlip.slipNumber} • {viewingSlip.workerName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm h-8"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setViewingSlip(null)}
                  className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs h-8"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* ── THE PRINTABLE DOCUMENT ─────────────────────────────────────── */}
            <div
              id="printable-salary-slip"
              className="p-6 bg-white text-slate-900 space-y-6 font-sans print:p-0 print:space-y-4 border border-slate-200 rounded-xl print:border-none print:shadow-none"
            >
              {/* Header with Logo & Company Info */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl border border-slate-200 p-1 flex items-center justify-center bg-white shadow-xs">
                    <Image
                      src="/image/logo.png"
                      alt="Company Logo"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      {companyName}
                    </h2>
                    <p className="text-xs text-slate-600 font-medium">
                      Civil Engineering, Infrastructure &amp; Commercial Building Construction
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      GSTIN / Reg: 33AAAAA0000A1Z5 • ERP Payroll Division
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1 rounded text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    Official Pay Slip
                  </div>
                  <p className="text-xs font-mono font-bold text-indigo-700 mt-1.5">
                    {viewingSlip.slipNumber}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Date: {formatDate(viewingSlip.paymentDate)}
                  </p>
                </div>
              </div>

              {/* Title & Pay Period */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div>
                  <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                    Payslip For Month:
                  </span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {viewingSlip.monthLabel || viewingSlip.monthYear}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Payment Mode:</span>
                    <span className="font-bold text-slate-800">
                      {viewingSlip.paymentMode.replace("_", " ")}
                    </span>
                  </div>
                  {viewingSlip.voucherNo && (
                    <div>
                      <span className="text-slate-400 text-[10px] block">Reference Voucher:</span>
                      <span className="font-bold text-slate-800">{viewingSlip.voucherNo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Employee Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-lg p-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Employee Name
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {viewingSlip.workerName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Designation / Trade
                  </span>
                  <span className="font-semibold text-slate-800">
                    {viewingSlip.workerTrade}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Employment Type
                  </span>
                  <span className="font-semibold text-indigo-700">
                    Permanent Monthly Salaried
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    Staff ID
                  </span>
                  <span className="font-mono text-slate-700">
                    {viewingSlip.workerId.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-2.5 px-4 text-left w-1/2 border-r border-slate-200">
                        Earnings (A)
                      </th>
                      <th className="py-2.5 px-4 text-left w-1/2">
                        Deductions (B)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      {/* Left: Earnings */}
                      <td className="p-4 align-top border-r border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700">Basic Monthly Salary</span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(viewingSlip.baseSalary)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400 text-[11px]">
                          <span>Fixed Overhead Allowance</span>
                          <span className="font-mono">Included</span>
                        </div>
                      </td>

                      {/* Right: Deductions */}
                      <td className="p-4 align-top space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-slate-700 font-medium">Salary Advance Deduction</span>
                            <span className="text-[10px] text-slate-400 block">
                              (Logged in Company Expenses)
                            </span>
                          </div>
                          <span className="font-mono font-bold text-rose-600">
                            {formatCurrency(viewingSlip.advanceDeductions)}
                          </span>
                        </div>
                        {viewingSlip.otherDeductions && viewingSlip.otherDeductions > 0 ? (
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Other Deductions</span>
                            <span className="font-mono font-bold text-rose-600">
                              {formatCurrency(viewingSlip.otherDeductions)}
                            </span>
                          </div>
                        ) : null}
                      </td>
                    </tr>

                    {/* Subtotals Row */}
                    <tr className="bg-slate-50 font-bold font-mono">
                      <td className="py-2 px-4 border-r border-slate-200 flex justify-between">
                        <span>Total Gross Earnings:</span>
                        <span>{formatCurrency(viewingSlip.baseSalary)}</span>
                      </td>
                      <td className="py-2 px-4 flex justify-between text-rose-600">
                        <span>Total Deductions:</span>
                        <span>-{formatCurrency(viewingSlip.advanceDeductions)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Payable Highlight Box */}
              <div className="rounded-xl bg-emerald-50 border-2 border-emerald-300 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs uppercase font-extrabold text-emerald-800 tracking-wider block">
                    Net Salary Disbursed / Payable (A - B)
                  </span>
                  <p className="text-xs text-emerald-700 mt-0.5 italic font-medium">
                    {numberToWords(viewingSlip.netPayableAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
                    {formatCurrency(viewingSlip.netPayableAmount)}
                  </div>
                </div>
              </div>

              {viewingSlip.notes && (
                <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded border border-slate-200">
                  <strong>Notes:</strong> {viewingSlip.notes}
                </div>
              )}

              {/* Signature Blocks */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-2 w-48 mx-auto font-bold text-slate-800">
                    Employee Signature
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {viewingSlip.workerName}
                  </p>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-2 w-48 mx-auto font-bold text-slate-800">
                    Authorized Signatory
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    For {companyName}
                  </p>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                System-generated computer payslip via bytBuild Construction ERP • Single monthly voucher rule verified.
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function SalarySlipsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Salary Slips...</div>}>
      <SalarySlipsContent />
    </Suspense>
  );
}
