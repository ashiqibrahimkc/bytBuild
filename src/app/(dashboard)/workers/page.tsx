"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Plus,
  Calendar,
  Wallet,
  Clock,
  Printer,
  FileText,
  Filter,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { Worker, WorkerCompensationType } from "@/lib/types";
import { useConstruction } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { ActionModals } from "@/components/modals/ActionModals";
import { Pagination } from "@/components/ui/pagination";

export default function WorkersPage() {
  const {
    companyName,
    workers,
    sites,
    workerWorkLogs,
    workerPayments,
    getWorkerStats,
    addWorker,
    updateWorker,
    deleteWorker,
  } = useConstruction();

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);

  // Edit Worker State
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTrade, setEditTrade] = useState("Head Mason");
  const [editCompensationType, setEditCompensationType] = useState<WorkerCompensationType>("DAILY_WAGE");
  const [editDefaultWage, setEditDefaultWage] = useState("950");
  const [editMonthlySalary, setEditMonthlySalary] = useState("35000");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editOpeningBalance, setEditOpeningBalance] = useState("");

  // Delete Worker State & Relational Integrity Check
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);
  const [confirmWorkerCascade, setConfirmWorkerCascade] = useState(false);

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setEditName(worker.name);
    setEditPhone(worker.phone || "");
    setEditTrade(worker.trade || "Laborer");
    const isSalary = worker.compensationType === "MONTHLY_SALARY" || (worker.monthlySalary && worker.monthlySalary > 0);
    setEditCompensationType(isSalary ? "MONTHLY_SALARY" : "DAILY_WAGE");
    setEditDefaultWage(worker.defaultDailyWage ? worker.defaultDailyWage.toString() : "950");
    setEditMonthlySalary(worker.monthlySalary ? worker.monthlySalary.toString() : "35000");
    setEditIsActive(worker.isActive !== false);
    setEditOpeningBalance(worker.openingBalance ? worker.openingBalance.toString() : "");
  };

  const handleUpdateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker || !editName.trim()) return;

    updateWorker(editingWorker.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      trade: editTrade.trim() || "Laborer",
      compensationType: editCompensationType,
      defaultDailyWage: editCompensationType === "DAILY_WAGE" ? (parseFloat(editDefaultWage) || 0) : 0,
      monthlySalary: editCompensationType === "MONTHLY_SALARY" ? (parseFloat(editMonthlySalary) || 0) : undefined,
      isActive: editIsActive,
      openingBalance: parseFloat(editOpeningBalance) || 0,
    });
    setEditingWorker(null);
  };

  const getWorkerDependencies = (workerId: string) => {
    const workLogs = workerWorkLogs.filter((w) => w.workerId === workerId);
    const payments = workerPayments.filter((wp) => wp.workerId === workerId);
    const total = workLogs.length + payments.length;

    return {
      workLogsCount: workLogs.length,
      paymentsCount: payments.length,
      total,
    };
  };

  const openDeleteModal = (worker: Worker) => {
    setDeletingWorker(worker);
    setConfirmWorkerCascade(false);
  };

  const handleExecuteDeleteWorker = (forceCascade = false) => {
    if (!deletingWorker) return;
    const res = deleteWorker(deletingWorker.id, forceCascade);
    if (res.success) {
      if (selectedWorkerId === deletingWorker.id) {
        setSelectedWorkerId("");
      }
      setDeletingWorker(null);
    }
  };

  // Search & Filter state for 1,000 workers
  const [searchTerm, setSearchTerm] = useState("");
  const [tradeFilter, setTradeFilter] = useState("ALL");
  const [balanceFilter, setBalanceFilter] = useState<"ALL" | "PENDING" | "SETTLED">("ALL");
  const [sortBy, setSortBy] = useState<"NAME" | "PENDING_DESC" | "WAGE_DESC">("PENDING_DESC");
  const [viewMode, setViewMode] = useState<"TABLE" | "GRID">("TABLE");

  // Pagination for Workers roster
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterPageSize, setRosterPageSize] = useState(15);
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

  // Modals for Actions
  const [openWorkLog, setOpenWorkLog] = useState(false);
  const [openWorkerPay, setOpenWorkerPay] = useState(false);
  const [actionTargetWorkerId, setActionTargetWorkerId] = useState<string | undefined>(undefined);

  // New Worker Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [trade, setTrade] = useState("Mason");
  const [compensationType, setCompensationType] = useState<WorkerCompensationType>("DAILY_WAGE");
  const [defaultWage, setDefaultWage] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addWorker({
      name: name.trim(),
      phone: phone.trim(),
      trade: trade.trim() || "Labor",
      compensationType,
      defaultDailyWage: compensationType === "DAILY_WAGE" ? (parseFloat(defaultWage) || 0) : 0,
      monthlySalary: compensationType === "MONTHLY_SALARY" ? (parseFloat(monthlySalary) || 0) : undefined,
      isActive: true,
      openingBalance: parseFloat(openingBalance) || 0,
    });

    setName("");
    setPhone("");
    setCompensationType("DAILY_WAGE");
    setDefaultWage("950");
    setMonthlySalary("35000");
    setOpeningBalance("");
    setIsAddWorkerOpen(false);
  };

  // Distinct trade categories present in worker dataset
  const distinctTrades = useMemo(() => {
    const set = new Set<string>();
    workers.forEach((w) => {
      if (w.trade) set.add(w.trade);
    });
    return Array.from(set).sort();
  }, [workers]);

  // Overall Worker Statistics
  const overallStats = useMemo(() => {
    let totalEarned = 0;
    let totalPaid = 0;
    let pendingCount = 0;

    workers.forEach((w) => {
      const s = getWorkerStats(w.id);
      totalEarned += s.totalEarned;
      totalPaid += s.totalPaid;
      if (s.outstandingBalance > 0) pendingCount++;
    });

    return {
      totalWorkers: workers.length,
      totalEarned,
      totalPaid,
      totalPending: totalEarned - totalPaid,
      pendingCount,
    };
  }, [workers, getWorkerStats]);

  // Filtered & Sorted Workers (Handles 1,000+ smoothly)
  const filteredWorkers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return workers
      .filter((w) => {
        // Trade filter
        if (tradeFilter !== "ALL" && w.trade !== tradeFilter) return false;

        const stats = getWorkerStats(w.id);
        // Balance filter
        if (balanceFilter === "PENDING" && stats.outstandingBalance <= 0) return false;
        if (balanceFilter === "SETTLED" && stats.outstandingBalance > 0) return false;

        // Search text
        if (q) {
          const matchName = w.name.toLowerCase().includes(q);
          const matchPhone = w.phone.toLowerCase().includes(q);
          const matchTrade = w.trade.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchTrade) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "NAME") return a.name.localeCompare(b.name);
        const statsA = getWorkerStats(a.id);
        const statsB = getWorkerStats(b.id);
        if (sortBy === "PENDING_DESC") return statsB.outstandingBalance - statsA.outstandingBalance;
        if (sortBy === "WAGE_DESC") return b.defaultDailyWage - a.defaultDailyWage;
        return 0;
      });
  }, [workers, searchTerm, tradeFilter, balanceFilter, sortBy, getWorkerStats]);

  // Paginated Workers
  const paginatedWorkers = useMemo(() => {
    const start = (rosterPage - 1) * rosterPageSize;
    return filteredWorkers.slice(start, start + rosterPageSize);
  }, [filteredWorkers, rosterPage, rosterPageSize]);

  // Selected Worker Detail
  const currentWorker = workers.find((w) => w.id === selectedWorkerId);
  const workerStats = currentWorker ? getWorkerStats(currentWorker.id) : null;

  // Work logs and payments for selected worker
  const currentLogs = currentWorker
    ? workerWorkLogs.filter((l) => l.workerId === currentWorker.id)
    : [];
  const currentPayments = currentWorker
    ? workerPayments.filter((p) => p.workerId === currentWorker.id)
    : [];

  // Combined Worker Ledger (Earned + Paid chronological statement)
  const workerLedger = useMemo(() => {
    if (!currentWorker) return [];
    return [
      ...currentLogs.map((log) => ({
        id: log.id,
        date: log.workDate,
        type: "EARNED" as const,
        description: `Worked at ${sites.find((s) => s.id === log.siteId)?.name || "Site"}`,
        siteName: sites.find((s) => s.id === log.siteId)?.name || "Site",
        notes: log.notes,
        voucherNo: undefined,
        creditEarned: log.wageAmount,
        debitPaid: 0,
      })),
      ...currentPayments.map((pay) => ({
        id: pay.id,
        date: pay.paymentDate,
        type: "PAID" as const,
        description: `Wage Disbursement (${pay.paymentMode})`,
        siteName: "—",
        notes: pay.notes,
        voucherNo: pay.voucherNo,
        creditEarned: 0,
        debitPaid: pay.amount,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [currentWorker, currentLogs, currentPayments, sites]);

  // Compute running balance
  const ledgerWithBalance = useMemo(() => {
    let running = 0;
    return workerLedger.map((item) => {
      running += item.creditEarned - item.debitPaid;
      return {
        ...item,
        runningBalance: running,
      };
    });
  }, [workerLedger]);

  // Date Filtering on selected worker statement
  const [datePreset, setDatePreset] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statementPage, setStatementPage] = useState(1);
  const [statementPageSize, setStatementPageSize] = useState(10);

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
    setStatementPage(1);
  };

  const filteredStatement = useMemo(() => {
    return ledgerWithBalance.filter((item) => {
      if (startDate && new Date(item.date) < new Date(startDate)) return false;
      if (endDate && new Date(item.date) > new Date(endDate + "T23:59:59")) return false;
      return true;
    });
  }, [ledgerWithBalance, startDate, endDate]);

  const paginatedStatement = useMemo(() => {
    const start = (statementPage - 1) * statementPageSize;
    return filteredStatement.slice(start, start + statementPageSize);
  }, [filteredStatement, statementPage, statementPageSize]);

  return (
    <div className="space-y-6">
      {/* ── Top Worker Roster & Controls (Hidden when printing worker statement) ── */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20">
                <Users className="h-5 w-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Workers &amp; Labor Wage Ledger
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track daily site attendance, credit wage accruals and partial disbursements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setIsAddWorkerOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-1.5" />
              New Worker
            </Button>
            <Button
              onClick={() => {
                setActionTargetWorkerId(undefined);
                setOpenWorkLog(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Log Daily Wage
            </Button>
            <Button
              onClick={() => {
                setActionTargetWorkerId(undefined);
                setOpenWorkerPay(true);
              }}
              variant="success"
              className="font-bold"
            >
              <Wallet className="h-4 w-4 mr-1.5" />
              Pay Worker Wage
            </Button>
          </div>
        </div>

        {/* Top Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 border-l-4 border-l-slate-700 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
              <span>Total Workers Registered</span>
              <Users className="h-4 w-4 text-slate-700" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {overallStats.totalWorkers.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {overallStats.pendingCount} workers currently have pending wage balances
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 border-l-4 border-l-orange-500 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
              <span>Pending Wage Liability</span>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-black text-orange-600 font-mono">
              {formatCurrency(overallStats.totalPending)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Unsettled credit wages owed to laborers</p>
          </div>

          <div className="rounded-xl border border-slate-200 border-l-4 border-l-blue-500 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
              <span>Total Wages Earned</span>
              <IndianRupee className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(overallStats.totalEarned)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Cumulative work attendance logged</p>
          </div>

          <div className="rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
              <span>Total Wages Disbursed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {formatCurrency(overallStats.totalPaid)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Actual bank &amp; cash disbursements</p>
          </div>
        </div>

        {/* ── Search & Filter Controls (Scalable to 1,000 workers) ─────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by worker name, phone number, trade skill..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setRosterPage(1);
                }}
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Filters & View Mode */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Trade Selector */}
              <select
                value={tradeFilter}
                onChange={(e) => {
                  setTradeFilter(e.target.value);
                  setRosterPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 font-medium focus:outline-hidden"
              >
                <option value="ALL">All Trade Skills ({workers.length})</option>
                {distinctTrades.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Balance Status */}
              <select
                value={balanceFilter}
                onChange={(e) => {
                  setBalanceFilter(e.target.value as any);
                  setRosterPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 font-medium focus:outline-hidden"
              >
                <option value="ALL">All Balances</option>
                <option value="PENDING">Pending Wages Owed (&gt; ₹0)</option>
                <option value="SETTLED">Settled / Fully Paid (₹0)</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 font-medium focus:outline-hidden"
              >
                <option value="PENDING_DESC">Highest Pending Wage</option>
                <option value="WAGE_DESC">Daily Rate (High to Low)</option>
                <option value="NAME">Name (A to Z)</option>
              </select>

              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("TABLE")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "TABLE"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                  title="Table List View (Recommended for 1,000 Workers)"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "GRID"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
            <span>
              Found <strong>{filteredWorkers.length}</strong> matching workers out of{" "}
              <strong>{workers.length}</strong> total
            </span>
            {selectedWorkerId && (
              <button
                onClick={() => setSelectedWorkerId("")}
                className="text-amber-700 hover:underline font-semibold"
              >
                ✕ Close Selected Worker Details
              </button>
            )}
          </div>
        </div>

        {/* ── Empty State ────────────────────────────────────────────────────── */}
        {workers.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300 p-12 text-center bg-white shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Workers Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Click &quot;+ New Worker&quot; to add your first worker with their trade skill and daily wage rate.
            </p>
            <Button onClick={() => setIsAddWorkerOpen(true)} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-1.5" />
              Register First Worker
            </Button>
          </Card>
        ) : paginatedWorkers.length === 0 ? (
          <Card className="p-8 text-center bg-white border-slate-200">
            <p className="text-xs text-slate-400 italic">
              No workers match &quot;{searchTerm}&quot; with selected filters. Try adjusting your search query.
            </p>
          </Card>
        ) : viewMode === "TABLE" ? (
          /* ── TABLE VIEW (Super Adaptable for 1,000 Workers) ─────────────── */
          <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-mono border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Worker Name</th>
                      <th className="py-3 px-4 font-semibold">Trade / Skill</th>
                      <th className="py-3 px-4 font-semibold">Phone Number</th>
                      <th className="py-3 px-4 text-right font-semibold">Compensation / Rate</th>
                      <th className="py-3 px-4 text-right font-semibold">Total Earned</th>
                      <th className="py-3 px-4 text-right font-semibold">Total Paid</th>
                      <th className="py-3 px-4 text-right font-semibold">Pending Balance</th>
                      <th className="py-3 px-4 text-right font-semibold">Direct Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedWorkers.map((worker) => {
                      const stats = getWorkerStats(worker.id);
                      const isSelected = worker.id === selectedWorkerId;
                      const isMonthly = worker.compensationType === "MONTHLY_SALARY" || (worker.monthlySalary && worker.monthlySalary > 0);

                      return (
                        <tr
                          key={worker.id}
                          onClick={() => setSelectedWorkerId(worker.id)}
                          className={`cursor-pointer transition-colors ${isSelected
                            ? "bg-amber-50/70 font-semibold"
                            : "hover:bg-amber-50/30"
                            }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-bold text-[10px] flex items-center justify-center">
                                {worker.name.slice(0, 2).toUpperCase()}
                              </span>
                              <span>{worker.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-300">
                                {worker.trade || "Laborer"}
                              </Badge>
                              {isMonthly && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                                  Salary
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-slate-500">
                            {worker.phone}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold">
                            {isMonthly ? (
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-xs">
                                {formatCurrency(worker.monthlySalary || worker.defaultDailyWage)}/mo
                              </span>
                            ) : (
                              <span className="text-slate-800">
                                {formatCurrency(worker.defaultDailyWage)}/day
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-slate-600">
                            {formatCurrency(stats.totalEarned)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-emerald-600 font-semibold">
                            {formatCurrency(stats.totalPaid)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${stats.outstandingBalance > 0
                                ? "bg-orange-100 text-orange-800 border border-orange-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                            >
                              {formatCurrency(stats.outstandingBalance)}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {isMonthly && (
                                <Link href={`/salary-slips?workerId=${worker.id}`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] px-2 text-indigo-700 bg-indigo-50/60 border-indigo-200 hover:bg-indigo-100 font-bold"
                                    title="View / Generate Salary Slip"
                                  >
                                    <FileCheck className="h-3 w-3 mr-1 text-indigo-600" />
                                    Salary Slip
                                  </Button>
                                </Link>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2 border-slate-200 text-slate-700 hover:bg-slate-100"
                                onClick={() => setSelectedWorkerId(worker.id)}
                              >
                                <Eye className="h-3 w-3 mr-1 text-slate-500" />
                                Statement
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-[11px] px-2 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                onClick={() => {
                                  setActionTargetWorkerId(worker.id);
                                  setOpenWorkLog(true);
                                }}
                              >
                                + Log Wage
                              </Button>
                              <Button
                                size="sm"
                                variant="success"
                                className="h-7 text-[11px] px-2 font-bold"
                                onClick={() => {
                                  setActionTargetWorkerId(worker.id);
                                  setOpenWorkerPay(true);
                                }}
                              >
                                Pay
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2 text-slate-700 hover:text-amber-700 hover:border-amber-300"
                                onClick={() => openEditModal(worker)}
                                title="Edit Worker Details"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                                onClick={() => openDeleteModal(worker)}
                                title="Delete Worker"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={rosterPage}
                totalItems={filteredWorkers.length}
                pageSize={rosterPageSize}
                onPageChange={setRosterPage}
                onPageSizeChange={setRosterPageSize}
              />
            </CardContent>
          </Card>
        ) : (
          /* ── GRID VIEW ───────────────────────────────────────────────────── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedWorkers.map((worker) => {
                const stats = getWorkerStats(worker.id);
                const isSelected = worker.id === selectedWorkerId;

                return (
                  <div
                    key={worker.id}
                    onClick={() => setSelectedWorkerId(worker.id)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${isSelected
                      ? "border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">{worker.name}</h3>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] bg-slate-50">
                            {worker.trade || "Laborer"}
                          </Badge>
                          {worker.compensationType === "MONTHLY_SALARY" ? (
                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-medium py-0">
                              Monthly
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50/50 py-0">
                              Daily
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 mt-1">{worker.phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openEditModal(worker)}
                            className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-100/60 transition-colors"
                            title="Edit Worker Details"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(worker)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 transition-colors"
                            title="Delete Worker"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Pending Wage</span>
                          <span
                            className={`text-base font-black ${stats.outstandingBalance > 0 ? "text-orange-600" : "text-emerald-600"
                              }`}
                          >
                            {formatCurrency(stats.outstandingBalance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        {worker.compensationType === "MONTHLY_SALARY"
                          ? `${formatCurrency(worker.monthlySalary || worker.defaultDailyWage)}/mo`
                          : `${formatCurrency(worker.defaultDailyWage)}/day`}
                      </span>
                      <span>Paid: {formatCurrency(stats.totalPaid)}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                      {worker.compensationType === "MONTHLY_SALARY" && (
                        <Link href={`/salary-slips?workerId=${worker.id}`} className="flex-1 min-w-[90px]">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-7 text-[11px] border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 font-bold"
                          >
                            <FileCheck className="h-3 w-3 mr-1 text-indigo-600" />
                            Slip
                          </Button>
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 min-w-[70px] h-7 text-[11px]"
                        onClick={() => setSelectedWorkerId(worker.id)}
                      >
                        Ledger
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 min-w-[65px] h-7 text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold"
                        onClick={() => {
                          setActionTargetWorkerId(worker.id);
                          setOpenWorkLog(true);
                        }}
                      >
                        + Work
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        className="flex-1 min-w-[60px] h-7 text-[11px] font-bold"
                        onClick={() => {
                          setActionTargetWorkerId(worker.id);
                          setOpenWorkerPay(true);
                        }}
                      >
                        Pay
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={rosterPage}
              totalItems={filteredWorkers.length}
              pageSize={rosterPageSize}
              onPageChange={setRosterPage}
              onPageSizeChange={setRosterPageSize}
            />
          </div>
        )}
      </div>

      {/* ── Selected Worker Detailed Statement Ledger ──────────────────────── */}
      {currentWorker && workerStats && (
        <Card className="border-slate-200 bg-white shadow-md overflow-hidden print:border-none print:shadow-none">
          {/* ── Official Printable Worker Statement Header (Print Only) ───── */}
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
                    Worker Wage Statement &amp; Attendance History
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    bytBuild Construction ERP • Field Payroll Division
                  </p>
                </div>
              </div>
              <div className="text-right text-xs font-mono">
                <div className="inline-block bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded font-bold uppercase">
                  WORKER STATEMENT
                </div>
                <p className="text-slate-600 mt-1">Date: {generatedDate || "Official Record"}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded p-2.5 mt-3 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">Worker Name:</span>
                <span className="font-bold text-slate-900">{currentWorker.name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Trade / Skill:</span>
                <span className="font-semibold text-slate-800">{currentWorker.trade}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Compensation:</span>
                <span className="font-semibold text-slate-800">
                  {currentWorker.compensationType === "MONTHLY_SALARY"
                    ? `${formatCurrency(currentWorker.monthlySalary || currentWorker.defaultDailyWage)}/mo`
                    : `${formatCurrency(currentWorker.defaultDailyWage)}/day`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Phone:</span>
                <span className="font-semibold text-slate-800">{currentWorker.phone}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200 text-center font-mono">
              <div className="bg-white rounded p-2 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Total Earned</span>
                <span className="font-bold text-slate-900 text-sm">{formatCurrency(workerStats.totalEarned)}</span>
              </div>
              <div className="bg-white rounded p-2 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Total Disbursed</span>
                <span className="font-bold text-emerald-600 text-sm">{formatCurrency(workerStats.totalPaid)}</span>
              </div>
              <div className="bg-white rounded p-2 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Pending Balance</span>
                <span className="font-black text-orange-600 text-sm">{formatCurrency(workerStats.outstandingBalance)}</span>
              </div>
            </div>
          </div>

          <CardHeader className="border-b border-slate-200 bg-slate-50/60 pb-4 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center">
                    {currentWorker.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      {currentWorker.name} • Wage Statement &amp; History
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 font-mono">
                      Trade: {currentWorker.trade} • Daily Rate: {formatCurrency(currentWorker.defaultDailyWage)} • Phone: {currentWorker.phone}
                    </CardDescription>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-slate-700 hover:text-amber-700 hover:border-amber-300"
                  onClick={() => openEditModal(currentWorker)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit Worker
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                  onClick={() => openDeleteModal(currentWorker)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete Worker
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print Statement
                </Button>
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  onClick={() => {
                    setActionTargetWorkerId(currentWorker.id);
                    setOpenWorkLog(true);
                  }}
                >
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  + Log Wage
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  className="font-bold"
                  onClick={() => {
                    setActionTargetWorkerId(currentWorker.id);
                    setOpenWorkerPay(true);
                  }}
                >
                  <Wallet className="h-3.5 w-3.5 mr-1" />
                  Disburse Wage
                </Button>
              </div>
            </div>

            {/* Quick Stat Pill Row */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200">
              <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Total Wages Earned</span>
                <span className="text-base font-bold text-slate-900 font-mono">{formatCurrency(workerStats.totalEarned)}</span>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Total Wages Paid</span>
                <span className="text-base font-bold text-emerald-600 font-mono">{formatCurrency(workerStats.totalPaid)}</span>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Outstanding Balance</span>
                <span className={`text-base font-black font-mono ${workerStats.outstandingBalance > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                  {formatCurrency(workerStats.outstandingBalance)}
                </span>
              </div>
            </div>
          </CardHeader>

          {/* Statement Date Filter */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white print:hidden">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Filter className="h-3.5 w-3.5 text-amber-600" />
              <span>Statement Period:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {(["ALL", "THIS_MONTH", "LAST_MONTH", "THIS_WEEK"] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded ${datePreset === preset ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    {preset === "ALL" ? "All Time" : preset === "THIS_MONTH" ? "This Month" : preset === "LAST_MONTH" ? "Last Month" : "This Week"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset("CUSTOM");
                    setStatementPage(1);
                  }}
                  className="text-xs bg-transparent text-slate-800 focus:outline-hidden"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset("CUSTOM");
                    setStatementPage(1);
                  }}
                  className="text-xs bg-transparent text-slate-800 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Statement Table */}
          <CardContent className="p-0">
            {/* Screen Table (Paginated) */}
            <div className="overflow-x-auto print:hidden">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-mono border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Description / Site Allocation</th>
                    <th className="py-3 px-4 font-semibold">Voucher / Notes</th>
                    <th className="py-3 px-4 text-right font-semibold">Wages Earned (Credit)</th>
                    <th className="py-3 px-4 text-right font-semibold">Wages Paid (Debit)</th>
                    <th className="py-3 px-4 text-right font-semibold">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedStatement.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400 italic">
                        No transactions recorded for this worker within the selected date range.
                      </td>
                    </tr>
                  ) : (
                    paginatedStatement.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs whitespace-nowrap text-slate-500">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant={tx.type === "EARNED" ? "secondary" : "success"} className="text-[10px]">
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4 max-w-[200px] truncate text-xs text-slate-500">
                          {tx.voucherNo ? (
                            <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mr-1.5">
                              #{tx.voucherNo}
                            </span>
                          ) : null}
                          {tx.notes || "—"}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-slate-900">
                          {tx.creditEarned > 0 ? formatCurrency(tx.creditEarned) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-emerald-600">
                          {tx.debitPaid > 0 ? formatCurrency(tx.debitPaid) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                          <span
                            className={tx.runningBalance > 0 ? "text-orange-600" : "text-emerald-600"}
                          >
                            {formatCurrency(tx.runningBalance)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Print-Only Table (Full Filtered Ledger) ─────────────────── */}
            <div className="hidden print:block p-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-800 font-mono border-b-2 border-slate-300">
                  <tr>
                    <th className="py-2 px-3 font-bold">Date</th>
                    <th className="py-2 px-3 font-bold">Type</th>
                    <th className="py-2 px-3 font-bold">Description / Site Allocation</th>
                    <th className="py-2 px-3 font-bold">Voucher / Notes</th>
                    <th className="py-2 px-3 text-right font-bold">Wages Earned</th>
                    <th className="py-2 px-3 text-right font-bold">Wages Paid</th>
                    <th className="py-2 px-3 text-right font-bold">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStatement.map((tx) => (
                    <tr key={tx.id} className="text-slate-800">
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-xs">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] font-semibold">
                        {tx.type}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-medium">
                        {tx.description}
                      </td>
                      <td className="py-2 px-3 text-xs max-w-sm">
                        {tx.voucherNo ? `#${tx.voucherNo} ` : ""}
                        {tx.notes || "—"}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                        {tx.creditEarned > 0 ? formatCurrency(tx.creditEarned) : "—"}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-bold text-emerald-600">
                        {tx.debitPaid > 0 ? formatCurrency(tx.debitPaid) : "—"}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-black text-slate-900">
                        {formatCurrency(tx.runningBalance)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-100 font-bold font-mono border-t-2 border-slate-900">
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-slate-900">
                      Statement Totals:
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-bold">
                      {formatCurrency(workerStats.totalEarned)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                      {formatCurrency(workerStats.totalPaid)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-orange-700 font-black">
                      {formatCurrency(workerStats.outstandingBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto font-bold text-slate-800">
                    Worker Acknowledgment
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{currentWorker.name}</p>
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
                currentPage={statementPage}
                totalItems={filteredStatement.length}
                pageSize={statementPageSize}
                onPageChange={setStatementPage}
                onPageSizeChange={setStatementPageSize}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: New Worker */}
      <Modal
        isOpen={isAddWorkerOpen}
        onClose={() => setIsAddWorkerOpen(false)}
        title="Register New Worker"
        description="Add a new construction laborer, mason, carpenter, or technician to the company roster."
      >
        <form onSubmit={handleCreateWorker} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Worker Full Name *</label>
            <Input
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Compensation Model Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Compensation Model *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCompensationType("DAILY_WAGE")}
                className={`py-2 px-3 rounded-lg border text-left transition-all ${compensationType === "DAILY_WAGE"
                  ? "border-amber-500 bg-amber-50/70 text-amber-950 font-bold ring-1 ring-amber-500"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <div className="text-xs">👷 Daily Wage Labor</div>
                <div className="text-[10px] text-slate-500 font-normal">Paid daily / per work log</div>
              </button>

              <button
                type="button"
                onClick={() => setCompensationType("MONTHLY_SALARY")}
                className={`py-2 px-3 rounded-lg border text-left transition-all ${compensationType === "MONTHLY_SALARY"
                  ? "border-amber-500 bg-amber-50/70 text-amber-950 font-bold ring-1 ring-amber-500"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <div className="text-xs">👔 Monthly Salary Staff</div>
                <div className="text-[10px] text-slate-500 font-normal">Fixed salary &amp; pay slip</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trade / Skill Category *</label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden"
              >
                <option value="Head Mason">Head Mason</option>
                <option value="Mason Helper">Mason Helper</option>
                <option value="Shuttering Carpenter">Shuttering Carpenter</option>
                <option value="Bar Bender / Steel Fixer">Bar Bender / Steel Fixer</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Welder / Fabricator">Welder / Fabricator</option>
                <option value="Painter &amp; Polisher">Painter &amp; Polisher</option>
                <option value="Crane &amp; Hoist Operator">Crane Operator</option>
                <option value="General Laborer">General Laborer</option>
                <option value="Site Supervisor">Site Supervisor</option>
                <option value="Site Engineer">Site Engineer</option>
              </select>
            </div>

            <div>
              {compensationType === "DAILY_WAGE" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Daily Wage (₹) *</label>
                  <Input
                    type="number"
                    placeholder="e.g. 950"
                    value={defaultWage}
                    onChange={(e) => setDefaultWage(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fixed Monthly Salary (₹) *</label>
                  <Input
                    type="number"
                    placeholder="e.g. 35000"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
              <Input
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Balance / Wage Due (₹) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000 (Optional)"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddWorkerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Save Worker
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Worker Modal */}
      <Modal
        isOpen={!!editingWorker}
        onClose={() => setEditingWorker(null)}
        title={`Edit Worker: ${editingWorker?.name || ""}`}
        description="Update worker profile details, trade skill category, standard daily wage, or phone."
      >
        <form onSubmit={handleUpdateWorker} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          {/* Compensation Model Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Compensation Model *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditCompensationType("DAILY_WAGE")}
                className={`py-2 px-3 rounded-lg border text-left transition-all ${editCompensationType === "DAILY_WAGE"
                  ? "border-amber-500 bg-amber-50/70 text-amber-950 font-bold ring-1 ring-amber-500"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <div className="text-xs">👷 Daily Wage Labor</div>
                <div className="text-[10px] text-slate-500 font-normal">Paid daily / per work log</div>
              </button>

              <button
                type="button"
                onClick={() => setEditCompensationType("MONTHLY_SALARY")}
                className={`py-2 px-3 rounded-lg border text-left transition-all ${editCompensationType === "MONTHLY_SALARY"
                  ? "border-amber-500 bg-amber-50/70 text-amber-950 font-bold ring-1 ring-amber-500"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <div className="text-xs">👔 Monthly Salary Staff</div>
                <div className="text-[10px] text-slate-500 font-normal">Fixed salary &amp; pay slip</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trade / Skill Category *</label>
              <select
                value={editTrade}
                onChange={(e) => setEditTrade(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden"
              >
                <option value="Head Mason">Head Mason</option>
                <option value="Mason Helper">Mason Helper</option>
                <option value="Shuttering Carpenter">Shuttering Carpenter</option>
                <option value="Bar Bender / Steel Fixer">Bar Bender / Steel Fixer</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Welder / Fabricator">Welder / Fabricator</option>
                <option value="Painter &amp; Polisher">Painter &amp; Polisher</option>
                <option value="Crane &amp; Hoist Operator">Crane Operator</option>
                <option value="General Laborer">General Laborer</option>
                <option value="Site Supervisor">Site Supervisor</option>
                <option value="Site Engineer">Site Engineer</option>
              </select>
            </div>

            <div>
              {editCompensationType === "DAILY_WAGE" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Daily Wage (₹) *</label>
                  <Input
                    type="number"
                    value={editDefaultWage}
                    onChange={(e) => setEditDefaultWage(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fixed Monthly Salary (₹) *</label>
                  <Input
                    type="number"
                    value={editMonthlySalary}
                    onChange={(e) => setEditMonthlySalary(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Balance / Wage Due (₹) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={editOpeningBalance}
                onChange={(e) => setEditOpeningBalance(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-semibold text-slate-700">Active Roster Worker</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setEditingWorker(null)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Worker Modal with Relational Integrity Warning */}
      {deletingWorker && (() => {
        const dep = getWorkerDependencies(deletingWorker.id);
        const hasDependencies = dep.total > 0;

        return (
          <Modal
            isOpen={!!deletingWorker}
            onClose={() => setDeletingWorker(null)}
            title={hasDependencies ? "⚠️ High-Risk Action: Relational Data Loss Warning" : "Delete Worker"}
            description={hasDependencies ? "This worker has daily attendance logs and wage payment vouchers." : "Confirm permanent removal of this worker."}
            maxWidth="lg"
          >
            <div className="space-y-4">
              {hasDependencies ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-rose-900">
                          WARNING: YOUR DATA WILL BE LOST!
                        </h4>
                        <p className="text-xs text-rose-700 mt-1">
                          The worker <strong>&quot;{deletingWorker.name}&quot;</strong> ({deletingWorker.trade}) has <strong>{dep.total}</strong> active records in your labor muster roll:
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pl-12 grid grid-cols-2 gap-2 text-xs font-mono text-rose-800">
                      <div className="bg-white/80 p-2.5 rounded border border-rose-200">
                        👷 Daily Wage Logs: <strong>{dep.workLogsCount}</strong>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded border border-rose-200">
                        💳 Salary Disbursements: <strong>{dep.paymentsCount}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                    <p className="font-semibold">Recommended Safe Option:</p>
                    <p className="text-[11px] mt-0.5 text-amber-800">
                      Do not delete if you need historical site attendance sheets or wage disbursement receipts for labor compliance. You can mark this worker as <strong>Inactive</strong> via Edit instead.
                    </p>
                  </div>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-rose-300 bg-rose-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmWorkerCascade}
                      onChange={(e) => setConfirmWorkerCascade(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-medium text-rose-950">
                      I understand that deleting this worker will cascade-delete all {dep.total} daily wage logs and payment disbursement vouchers permanently.
                    </span>
                  </label>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs text-slate-600">
                    Are you sure you want to delete <strong>&quot;{deletingWorker.name}&quot;</strong>? This worker has no linked attendance logs or wage payments, and can be removed safely.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingWorker(null)}
                  className="h-9 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 shrink-0"
                >
                  {hasDependencies ? "No, Keep Data (Cancel)" : "Cancel"}
                </Button>
                {hasDependencies ? (
                  <Button
                    type="button"
                    disabled={!confirmWorkerCascade}
                    onClick={() => handleExecuteDeleteWorker(true)}
                    className="h-9 px-4 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Force Delete &amp; Wipe Data
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleExecuteDeleteWorker(false)}
                    className="h-9 px-4 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Confirm Delete
                  </Button>
                )}
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Action Modals */}
      <ActionModals
        isOpenWorkLog={openWorkLog}
        onCloseWorkLog={() => setOpenWorkLog(false)}
        isOpenWorkerPay={openWorkerPay}
        onCloseWorkerPay={() => setOpenWorkerPay(false)}
        preselectedWorkerId={actionTargetWorkerId || selectedWorkerId}
      />
    </div>
  );
}
