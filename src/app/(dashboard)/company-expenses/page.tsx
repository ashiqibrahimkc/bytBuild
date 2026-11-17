"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Receipt,
  Fuel,
  Building,
  Utensils,
  Wrench,
  FileText,
  Plus,
  Printer,
  Calendar,
  Filter,
  Search,
  IndianRupee,
  Layers,
  ArrowUpRight,
  TrendingDown,
  HardHat,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { ExpenseCategory, PaymentMode } from "@/lib/types";

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: React.ElementType; colorClass: string; badgeClass: string }
> = {
  OUTSIDE_LABOR: {
    label: "Outside Labour Wages",
    icon: HardHat,
    colorClass: "text-amber-600 dark:text-amber-400",
    badgeClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
  },
  SALARY_ADVANCE: {
    label: "Worker Salary Advance",
    icon: IndianRupee,
    colorClass: "text-rose-600 dark:text-rose-400",
    badgeClass: "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/60",
  },
  ROOM_RENT: {
    label: "Room / Camp Rent",
    icon: Building,
    colorClass: "text-blue-600 dark:text-blue-400",
    badgeClass: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
  },
  PETROL_FUEL: {
    label: "Petrol & Vehicle Fuel",
    icon: Fuel,
    colorClass: "text-amber-600 dark:text-amber-400",
    badgeClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
  },
  FUEL_TRAVEL: {
    label: "Petrol & Vehicle Fuel",
    icon: Fuel,
    colorClass: "text-amber-600 dark:text-amber-400",
    badgeClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
  },
  FOOD_TEA_REFRESHMENTS: {
    label: "Worker Mess & Tea",
    icon: Utensils,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    badgeClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
  },
  TEA_REFRESHMENTS: {
    label: "Worker Mess & Tea",
    icon: Utensils,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    badgeClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
  },
  MACHINERY_RENT: {
    label: "Machinery & Equipment",
    icon: Wrench,
    colorClass: "text-purple-600 dark:text-purple-400",
    badgeClass: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60",
  },
  EQUIPMENT_RENT: {
    label: "Machinery & Equipment",
    icon: Wrench,
    colorClass: "text-purple-600 dark:text-purple-400",
    badgeClass: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60",
  },
  OFFICE_OVERHEAD: {
    label: "Office & Utilities",
    icon: Layers,
    colorClass: "text-cyan-600 dark:text-cyan-400",
    badgeClass: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/60",
  },
  SITE_PERMIT_FEES: {
    label: "Permits & Legal Fees",
    icon: FileText,
    colorClass: "text-indigo-600 dark:text-indigo-400",
    badgeClass: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60",
  },
  MISCELLANEOUS: {
    label: "Miscellaneous Overhead",
    icon: Receipt,
    colorClass: "text-slate-600 dark:text-slate-400",
    badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

export default function CompanyExpensesPage() {
  const { companyName, sites, workers, companyExpenses, recordCompanyExpense } = useConstruction();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [datePreset, setDatePreset] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination state
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
    setExpenseDate(new Date().toISOString().split("T")[0]);
  }, []);

  // New Expense Modal Form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("ROOM_RENT");
  const [siteId, setSiteId] = useState<string>("");
  const [workerId, setWorkerId] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("BANK_TRANSFER");
  const [voucherNo, setVoucherNo] = useState("");
  const [notes, setNotes] = useState("");

  // Only monthly salaried workers are eligible for salary advances
  const salariedWorkers = useMemo(() => {
    return workers.filter(
      (w) =>
        w.isActive !== false &&
        w.compensationType !== "DAILY_WAGE" &&
        (w.compensationType === "MONTHLY_SALARY" ||
          (!w.compensationType && Boolean(w.monthlySalary) && Number(w.monthlySalary) > 0))
    );
  }, [workers]);

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

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (category === "SALARY_ADVANCE" && !workerId) return;

    recordCompanyExpense({
      amount: parsedAmount,
      category,
      siteId: siteId ? siteId : undefined,
      workerId: category === "SALARY_ADVANCE" && workerId ? workerId : undefined,
      paymentMode,
      voucherNo: voucherNo ? voucherNo.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      expenseDate: expenseDate || new Date().toISOString().split("T")[0],
    });

    setAmount("");
    setWorkerId("");
    setVoucherNo("");
    setNotes("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setIsAddOpen(false);
  };

  // Metrics by Category
  const metrics = useMemo(() => {
    let total = 0;
    let roomRent = 0;
    let petrolFuel = 0;
    let foodMess = 0;
    let machinery = 0;
    let officeUtil = 0;

    for (const exp of companyExpenses) {
      const val = Number(exp.amount);
      total += val;
      if (exp.category === "ROOM_RENT") roomRent += val;
      else if (exp.category === "PETROL_FUEL" || exp.category === "FUEL_TRAVEL") petrolFuel += val;
      else if (exp.category === "FOOD_TEA_REFRESHMENTS" || exp.category === "TEA_REFRESHMENTS") foodMess += val;
      else if (exp.category === "MACHINERY_RENT" || exp.category === "EQUIPMENT_RENT") machinery += val;
      else if (exp.category === "OFFICE_OVERHEAD") officeUtil += val;
    }

    return { total, roomRent, petrolFuel, foodMess, machinery, officeUtil };
  }, [companyExpenses]);

  // Filtered dataset
  const filteredExpenses = useMemo(() => {
    return companyExpenses.filter((exp) => {
      // Category filter
      if (selectedCategory !== "ALL") {
        if (selectedCategory === "PETROL_FUEL" && exp.category !== "PETROL_FUEL" && exp.category !== "FUEL_TRAVEL") {
          return false;
        }
        if (selectedCategory === "FOOD_TEA_REFRESHMENTS" && exp.category !== "FOOD_TEA_REFRESHMENTS" && exp.category !== "TEA_REFRESHMENTS") {
          return false;
        }
        if (selectedCategory === "MACHINERY_RENT" && exp.category !== "MACHINERY_RENT" && exp.category !== "EQUIPMENT_RENT") {
          return false;
        }
        if (selectedCategory !== "PETROL_FUEL" && selectedCategory !== "FOOD_TEA_REFRESHMENTS" && selectedCategory !== "MACHINERY_RENT" && exp.category !== selectedCategory) {
          return false;
        }
      }

      // Date filter
      if (startDate && new Date(exp.expenseDate) < new Date(startDate)) return false;
      if (endDate && new Date(exp.expenseDate) > new Date(endDate + "T23:59:59")) return false;

      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const siteName = sites.find((s) => s.id === exp.siteId)?.name.toLowerCase() || "";
        const voucher = (exp.voucherNo || "").toLowerCase();
        const note = (exp.notes || "").toLowerCase();
        const mode = exp.paymentMode.toLowerCase();
        const cat = exp.category.toLowerCase();
        if (
          !siteName.includes(q) &&
          !voucher.includes(q) &&
          !note.includes(q) &&
          !mode.includes(q) &&
          !cat.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [companyExpenses, selectedCategory, startDate, endDate, searchTerm, sites]);

  // Paginated records
  const paginatedExpenses = useMemo(() => {
    const sorted = [...filteredExpenses].sort(
      (a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
    );
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20">
              <Receipt className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Company Expenses & Overhead
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track operational company overhead: Room rent, labour camp accommodation, company petrol & fuel, worker mess, machinery hire, and utilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print Register
          </Button>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Record Expense
          </Button>
        </div>
      </div>

      {/* Metric Cards - Warm Construction Theme */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 print:hidden">
        {/* Total Overhead */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-slate-700 dark:border-l-slate-300 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Total Overhead
            </span>
            <Receipt className="h-4 w-4 text-slate-700 dark:text-slate-300" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(metrics.total)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
            {companyExpenses.length} transactions logged
          </p>
        </div>

        {/* Room Rent */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-500 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Room / Camp Rent
            </span>
            <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatCurrency(metrics.roomRent)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Labour colony & staff flats</p>
        </div>

        {/* Company Petrol / Fuel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-amber-500 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Petrol & Fuel
            </span>
            <Fuel className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(metrics.petrolFuel)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Site visits & generators</p>
        </div>

        {/* Worker Mess & Refreshments */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Worker Mess & Tea
            </span>
            <Utensils className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(metrics.foodMess)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Tea, snacks & mess food</p>
        </div>

        {/* Machinery Hire */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-purple-500 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Machinery Hire
            </span>
            <Wrench className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
            {formatCurrency(metrics.machinery)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">JCB, cranes & equipment</p>
        </div>

        {/* Office Utilities & Misc */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-cyan-500 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Office & Utilities
            </span>
            <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400">
            {formatCurrency(metrics.officeUtil)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Electricity, internet & admin</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by voucher #, site, notes, payment mode..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Date range & presets */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {(["ALL", "THIS_MONTH", "LAST_MONTH", "THIS_WEEK"] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${datePreset === preset
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                >
                  {preset === "ALL"
                    ? "All"
                    : preset === "THIS_MONTH"
                      ? "This Month"
                      : preset === "LAST_MONTH"
                        ? "Last Month"
                        : "This Week"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("CUSTOM");
                  setCurrentPage(1);
                }}
                className="text-xs bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden"
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
                className="text-xs bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 font-mono">Category:</span>
          {[
            { id: "ALL", label: "All Overhead" },
            { id: "OUTSIDE_LABOR", label: "👷 Outside Labour" },
            { id: "ROOM_RENT", label: "🏠 Room / Camp Rent" },
            { id: "PETROL_FUEL", label: "⛽ Petrol & Fuel" },
            { id: "FOOD_TEA_REFRESHMENTS", label: "🍵 Worker Mess & Tea" },
            { id: "MACHINERY_RENT", label: "🚜 Machinery Hire" },
            { id: "OFFICE_OVERHEAD", label: "🏢 Office & Utilities" },
            { id: "MISCELLANEOUS", label: "📄 Misc" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${selectedCategory === cat.id
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Official Printable Register Header (Print View Only) ────────────── */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
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
                Company Operational Overhead &amp; Expense Register
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Tax &amp; Compliance Verified • Financial ERP Register
              </p>
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="inline-block bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded font-bold uppercase">
              EXPENSE REGISTER
            </div>
            <p className="text-slate-600 mt-1">Date: {generatedDate || "Official Record"}</p>
            <p className="text-slate-500">Records: {filteredExpenses.length} transactions</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-mono bg-slate-50 p-2.5 rounded border border-slate-200">
          <span>
            Period: {startDate && endDate ? `${formatDate(startDate)} to ${formatDate(endDate)}` : datePreset === "ALL" ? "All Historical Records" : datePreset.replace("_", " ")}
          </span>
          <span>
            Category: {selectedCategory === "ALL" ? "All Overhead Categories" : selectedCategory.replace("_", " ")}
          </span>
          <span className="font-bold text-slate-900">
            Total Overhead: {formatCurrency(filteredExpenses.reduce((s, e) => s + Number(e.amount), 0))}
          </span>
        </div>
      </div>

      {/* Main Expense Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Company Expense Ledger
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Showing {filteredExpenses.length} matching transactions
              </CardDescription>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900/60">
              Total Overhead: {formatCurrency(filteredExpenses.reduce((s, e) => s + Number(e.amount), 0))}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Screen Table (Paginated) */}
          <div className="overflow-x-auto print:hidden">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Voucher #</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Site / Allocation</th>
                  <th className="py-3 px-4 font-semibold">Payment Mode</th>
                  <th className="py-3 px-4 font-semibold">Purpose & Notes</th>
                  <th className="py-3 px-4 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {paginatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400 italic">
                      No company expenses found matching your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((exp) => {
                    const catInfo = CATEGORY_MAP[exp.category] || {
                      label: exp.category.replace("_", " "),
                      icon: Receipt,
                      colorClass: "text-slate-600 dark:text-slate-400",
                      badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200",
                    };
                    const Icon = catInfo.icon;
                    const siteObj = sites.find((s) => s.id === exp.siteId);

                    return (
                      <tr
                        key={exp.id}
                        className="hover:bg-amber-50/40 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(exp.expenseDate)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                          {exp.voucherNo ? (
                            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                              #{exp.voucherNo}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {exp.category === "SALARY_ADVANCE" ? (
                            (() => {
                              const workerObj = workers.find((w) => w.id === exp.workerId);
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                  <IndianRupee className="h-3 w-3" />
                                  Advance: {workerObj?.name || "Salaried Worker"}
                                </span>
                              );
                            })()
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${catInfo.badgeClass}`}>
                              <Icon className="h-3.5 w-3.5" />
                              {catInfo.label}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {siteObj ? (
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {siteObj.name}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Central Company Overhead
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            {exp.paymentMode.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 max-w-[280px] truncate text-xs text-slate-600 dark:text-slate-400">
                          {exp.notes || "—"}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Print-Only Table (Full Filtered Ledger) ───────────────────── */}
          <div className="hidden print:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-800 font-mono border-b-2 border-slate-300">
                <tr>
                  <th className="py-2 px-3 font-bold">Date</th>
                  <th className="py-2 px-3 font-bold">Voucher #</th>
                  <th className="py-2 px-3 font-bold">Category</th>
                  <th className="py-2 px-3 font-bold">Site / Allocation</th>
                  <th className="py-2 px-3 font-bold">Payment Mode</th>
                  <th className="py-2 px-3 font-bold">Purpose &amp; Notes</th>
                  <th className="py-2 px-3 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExpenses.map((exp) => {
                  const siteObj = sites.find((s) => s.id === exp.siteId);
                  const workerObj = exp.workerId ? workers.find((w) => w.id === exp.workerId) : null;
                  const catLabel =
                    exp.category === "SALARY_ADVANCE"
                      ? `Salary Advance (${workerObj?.name || "Staff"})`
                      : (CATEGORY_MAP[exp.category]?.label || exp.category.replace("_", " "));

                  return (
                    <tr key={exp.id} className="text-slate-800">
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-xs">
                        {formatDate(exp.expenseDate)}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-xs font-semibold">
                        {exp.voucherNo ? `#${exp.voucherNo}` : "—"}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-medium">
                        {catLabel}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {siteObj?.name || "Central Overhead"}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-mono uppercase text-[11px]">
                        {exp.paymentMode.replace("_", " ")}
                      </td>
                      <td className="py-2 px-3 text-xs max-w-sm">
                        {exp.notes || "—"}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                        {formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  );
                })}

                {/* Grand Total Row */}
                <tr className="bg-slate-100 font-bold font-mono border-t-2 border-slate-900">
                  <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-slate-900">
                    Grand Total Overhead Disbursed:
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-900 font-black text-sm">
                    {formatCurrency(filteredExpenses.reduce((s, e) => s + Number(e.amount), 0))}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Print Sign-off Blocks */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto font-bold text-slate-800">
                  Prepared By (Accounts)
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Accounts Department</p>
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
              totalItems={filteredExpenses.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </CardContent>
      </Card>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record Company Overhead Expense"
        description="Log room rent, company petrol, mess food, machinery hire, or office overhead."
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
              required
            >
              <option value="OUTSIDE_LABOR">👷 Outside Labour Wages (Immediate Payment)</option>
              <option value="SALARY_ADVANCE">💵 Salaried Worker Advance</option>
              <option value="ROOM_RENT">🏠 Room / Labour Camp Rent</option>
              <option value="PETROL_FUEL">⛽ Company Petrol & Vehicle Fuel</option>
              <option value="FOOD_TEA_REFRESHMENTS">🍵 Worker Mess Food & Daily Tea</option>
              <option value="MACHINERY_RENT">🚜 Machinery & Equipment Rental</option>
              <option value="OFFICE_OVERHEAD">🏢 Office Utilities & Admin Overhead</option>
              <option value="SITE_PERMIT_FEES">📄 Site Permit & Legal Municipal Fees</option>
              <option value="MISCELLANEOUS">📦 Miscellaneous Company Expense</option>
            </select>
          </div>

          {category === "SALARY_ADVANCE" && (
            <div className="rounded-xl p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300">
                Select Salaried Worker for Advance *
              </label>
              {salariedWorkers.length === 0 ? (
                <div className="p-2.5 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-xs">
                  <p className="font-bold">No monthly salaried workers found.</p>
                  <p className="text-[11px] mt-0.5 text-amber-800 dark:text-amber-300">
                    Daily wage workers cannot receive monthly salary advances. You can register or change a worker&apos;s compensation to &quot;Monthly Salary&quot; in Workers &amp; Wages.
                  </p>
                </div>
              ) : (
                <select
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  className="w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  required
                >
                  <option value="">-- Choose Salaried Worker --</option>
                  {salariedWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.trade}) — Monthly Fixed: ₹{Number(w.monthlySalary || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[10px] text-amber-800 dark:text-amber-400">
                ⚡ Note: Only monthly salaried workers are shown. This advance will be automatically deducted from their monthly salary slip when generating payroll.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expense Date *
              </label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
              >
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CASH">Physical Cash</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Voucher / Bill / Receipt Number
              </label>
              <Input
                placeholder="e.g. RENT-CAMP-01 or PETROL-902"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Site Allocation (Optional)
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
            >
              <option value="">Company Central Overhead (Unallocated)</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.clientName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose & Notes
            </label>
            <Input
              placeholder="e.g. 15-room labor colony rent paid to landlord Mr. Murthy"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-500/20"
            >
              Log Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
