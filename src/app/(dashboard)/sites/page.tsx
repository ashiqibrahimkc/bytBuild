"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Plus,
  Printer,
  Calendar,
  CheckCircle2,
  Receipt,
  Truck,
  IndianRupee,
  Fuel,
  Users,
  Filter,
  Search,
  List,
  LayoutGrid,
  ShieldAlert,
  ArrowRight,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Site, SiteStatus, PaymentMode, ExpenseCategory } from "@/lib/types";
import { useConstruction } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { ActionModals } from "@/components/modals/ActionModals";
import { Pagination } from "@/components/ui/pagination";
import { SitesSkeleton } from "@/components/ui/page-skeletons";

export default function SitesPage() {
  const {
    companyName,
    role,
    isDbLoading,
    sites,
    vendors,
    workers,
    vendorPurchases,
    workerWorkLogs,
    siteIncomes,
    companyExpenses,
    vendorPayments,
    getSiteStats,
    addSite,
    updateSite,
    deleteSite,
    updateVendorPurchase,
    deleteVendorPurchase,
    updateWorkerWorkLog,
    deleteWorkerWorkLog,
    updateCompanyExpense,
    deleteCompanyExpense,
    updateSiteIncome,
    deleteSiteIncome,
  } = useConstruction();

  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);

  // Edit Site State
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [editName, setEditName] = useState("");
  const [editClientName, setEditClientName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStatus, setEditStatus] = useState<SiteStatus>("ACTIVE");
  const [editEstimatedBudget, setEditEstimatedBudget] = useState("");
  const [editOpeningBalance, setEditOpeningBalance] = useState("");

  // Delete Site State & Relational Warning
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);
  const [confirmCascade, setConfirmCascade] = useState(false);

  const openEditModal = (site: Site) => {
    setEditingSite(site);
    setEditName(site.name);
    setEditClientName(site.clientName);
    setEditLocation(site.location || "");
    setEditStatus(site.status);
    setEditEstimatedBudget(site.estimatedBudget ? site.estimatedBudget.toString() : "");
    setEditOpeningBalance(site.openingBalance ? site.openingBalance.toString() : "");
  };

  const handleUpdateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite || !editName.trim() || !editClientName.trim()) return;

    updateSite(editingSite.id, {
      name: editName.trim(),
      clientName: editClientName.trim(),
      location: editLocation.trim() || "City Center",
      status: editStatus,
      estimatedBudget: parseFloat(editEstimatedBudget) || 0,
      openingBalance: parseFloat(editOpeningBalance) || 0,
    });
    setEditingSite(null);
  };

  const getSiteDependencies = (siteId: string) => {
    const purchases = vendorPurchases.filter((p) => p.siteId === siteId);
    const workLogs = workerWorkLogs.filter((w) => w.siteId === siteId);
    const incomes = siteIncomes.filter((i) => i.siteId === siteId);
    const expenses = companyExpenses.filter((e) => e.siteId === siteId);
    const vendorPays = (vendorPayments || []).filter((vp) => vp.siteId === siteId);
    const total =
      purchases.length + workLogs.length + incomes.length + expenses.length + vendorPays.length;

    return {
      purchasesCount: purchases.length,
      workLogsCount: workLogs.length,
      incomesCount: incomes.length,
      expensesCount: expenses.length,
      vendorPaysCount: vendorPays.length,
      total,
    };
  };

  const openDeleteModal = (site: Site) => {
    setDeletingSite(site);
    setConfirmCascade(false);
  };

  const handleExecuteDeleteSite = (forceCascade = false) => {
    if (!deletingSite) return;
    const res = deleteSite(deletingSite.id, forceCascade);
    if (res.success) {
      if (selectedSiteId === deletingSite.id) {
        setSelectedSiteId("");
      }
      setDeletingSite(null);
    }
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  // Roster Pagination
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterPageSize, setRosterPageSize] = useState(5);

  // New site form state
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  // Action Modals State with pre-selected site
  const [activeActionSiteId, setActiveActionSiteId] = useState<string>("");
  const [openPurchase, setOpenPurchase] = useState(false);
  const [openWorkLog, setOpenWorkLog] = useState(false);
  const [openIncome, setOpenIncome] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);

  // Date Filter State for statement
  const [datePreset, setDatePreset] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination & filter states for unified site statement
  const [statementPage, setStatementPage] = useState(1);
  const [statementPageSize, setStatementPageSize] = useState(10);
  const [statementTypeFilter, setStatementTypeFilter] = useState<string>("ALL");
  const [statementVendorFilter, setStatementVendorFilter] = useState<string>("ALL");
  const [statementWorkerFilter, setStatementWorkerFilter] = useState<string>("ALL");
  const [statementSearch, setStatementSearch] = useState("");

  useEffect(() => {
    setStatementVendorFilter("ALL");
    setStatementWorkerFilter("ALL");
  }, [selectedSiteId]);

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

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim()) return;

    addSite({
      name: name.trim(),
      clientName: clientName.trim(),
      location: location.trim() || "City Center",
      status: "ACTIVE",
      estimatedBudget: parseFloat(estimatedBudget) || 0,
      openingBalance: parseFloat(openingBalance) || 0,
    });

    setName("");
    setClientName("");
    setLocation("");
    setEstimatedBudget("");
    setOpeningBalance("");
    setIsAddSiteOpen(false);
  };

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
  };

  // Filtered Sites (Search & Status)
  const filteredSites = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return sites.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (q) {
        const matchName = s.name.toLowerCase().includes(q);
        const matchClient = s.clientName.toLowerCase().includes(q);
        const matchLoc = s.location.toLowerCase().includes(q);
        const matchStatus = s.status.toLowerCase().includes(q);
        if (!matchName && !matchClient && !matchLoc && !matchStatus) return false;
      }
      return true;
    });
  }, [sites, searchTerm, statusFilter]);

  // Paginated Sites
  const paginatedSites = useMemo(() => {
    const size = Math.max(1, Number(rosterPageSize) || 5);
    const totalPages = Math.max(1, Math.ceil(filteredSites.length / size));
    const safePage = Math.min(Math.max(1, rosterPage), totalPages);
    const start = (safePage - 1) * size;
    return filteredSites.slice(start, start + size);
  }, [filteredSites, rosterPage, rosterPageSize]);

  useEffect(() => {
    const size = Math.max(1, Number(rosterPageSize) || 5);
    const totalPages = Math.max(1, Math.ceil(filteredSites.length / size));
    if (rosterPage > totalPages) {
      setRosterPage(totalPages);
    }
  }, [filteredSites.length, rosterPage, rosterPageSize]);

  // Selected Site Detail
  const currentSite = sites.find((s) => s.id === selectedSiteId);
  const currentStats = currentSite ? getSiteStats(currentSite.id) : null;

  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + "T23:59:59")) return false;
    return true;
  };

  const allSitePurchases = currentSite
    ? vendorPurchases.filter((p) => p.siteId === currentSite.id && isDateInRange(p.purchaseDate))
    : [];
  const allSiteWorkLogs = currentSite
    ? workerWorkLogs.filter((w) => w.siteId === currentSite.id && isDateInRange(w.workDate))
    : [];
  const allSiteMiscExpenses = currentSite
    ? companyExpenses.filter((e) => e.siteId === currentSite.id && isDateInRange(e.expenseDate))
    : [];
  const allSiteIncomes = currentSite
    ? siteIncomes.filter((i) => i.siteId === currentSite.id && isDateInRange(i.incomeDate))
    : [];

  // Unified Site Statement Entry Interface
  interface SiteLedgerEntry {
    id: string;
    rawId: string;
    date: string;
    type: "MATERIAL" | "LABOR" | "EXPENSE" | "INCOME" | "OPENING_BALANCE";
    typeLabel: string;
    title: string;
    subtitle?: string;
    voucherNo?: string;
    amount: number;
    isInflow: boolean;
    rawCreatedAt?: string;
    rawRecord?: any;
    vendorId?: string;
    workerId?: string;
  }

  // Combined all transactions sorted DATE-WISE (LATEST IN FIRST)
  const allSiteLedgerEntries = useMemo(() => {
    if (!currentSite) return [];

    const entries: SiteLedgerEntry[] = [];

    // 1. Material Purchases / Vendor Bills
    allSitePurchases.forEach((p) => {
      const ven = vendors.find((v) => v.id === p.vendorId);
      entries.push({
        id: `pur-${p.id}`,
        rawId: p.id,
        date: p.purchaseDate,
        type: "MATERIAL",
        typeLabel: "Material Bill",
        title: ven?.name || "Material Supplier",
        subtitle: [ven?.tradeCategory, p.notes].filter(Boolean).join(" • "),
        voucherNo: p.voucherNo,
        amount: Number(p.amount),
        isInflow: false,
        rawCreatedAt: p.createdAt,
        rawRecord: p,
        vendorId: p.vendorId,
      });
    });

    // 2. Labor Attendance & Wages
    allSiteWorkLogs.forEach((w) => {
      const worker = workers.find((wk) => wk.id === w.workerId);
      entries.push({
        id: `work-${w.id}`,
        rawId: w.id,
        date: w.workDate,
        type: "LABOR",
        typeLabel: "Labor Wage",
        title: worker?.name || "Laborer",
        subtitle: [worker?.trade, w.notes].filter(Boolean).join(" • "),
        voucherNo: undefined,
        amount: Number(w.wageAmount),
        isInflow: false,
        rawCreatedAt: w.createdAt,
        rawRecord: w,
        workerId: w.workerId,
      });
    });

    // 3. Site Expenses / Overhead
    allSiteMiscExpenses.forEach((e) => {
      const formatCategory = (cat: string) => {
        switch (cat) {
          case "OUTSIDE_LABOR":
            return "Outside Labour Wages";
          case "ROOM_RENT":
            return "Room / Labour Camp Rent";
          case "PETROL_FUEL":
          case "FUEL_TRAVEL":
            return "Petrol & Vehicle Fuel";
          case "FOOD_TEA_REFRESHMENTS":
          case "TEA_REFRESHMENTS":
            return "Worker Mess & Tea";
          case "MACHINERY_RENT":
          case "EQUIPMENT_RENT":
            return "Machinery & Equipment Rent";
          case "OFFICE_OVERHEAD":
            return "Office & Admin Overhead";
          case "SITE_PERMIT_FEES":
            return "Site Permit & Legal Fees";
          case "SALARY_ADVANCE":
            return "Worker Salary Advance";
          default:
            return "Site Misc Overhead";
        }
      };

      entries.push({
        id: `exp-${e.id}`,
        rawId: e.id,
        date: e.expenseDate,
        type: "EXPENSE",
        typeLabel: e.category === "OUTSIDE_LABOR" ? "Outside Labour" : "Site Expense",
        title: formatCategory(e.category),
        subtitle: [e.notes, `Paid via ${e.paymentMode}`].filter(Boolean).join(" • "),
        voucherNo: e.voucherNo,
        amount: Number(e.amount),
        isInflow: false,
        rawCreatedAt: e.createdAt,
        rawRecord: e,
        vendorId: (e as any).vendorId,
        workerId: (e as any).workerId,
      });
    });

    // 4. Client Incomes / Advance Inflows
    allSiteIncomes.forEach((i) => {
      entries.push({
        id: `inc-${i.id}`,
        rawId: i.id,
        date: i.incomeDate,
        type: "INCOME",
        typeLabel: "Client Inflow",
        title: i.receivedFrom ? `From: ${i.receivedFrom}` : `Client Payment (${currentSite.clientName})`,
        subtitle: [i.notes, `Via ${i.paymentMode}`].filter(Boolean).join(" • "),
        voucherNo: i.referenceNo,
        amount: Number(i.amount),
        isInflow: true,
        rawCreatedAt: i.createdAt,
        rawRecord: i,
      });
    });

    // 5. Site Opening Balance (if specified and in date range)
    if (
      currentSite.openingBalance &&
      currentSite.openingBalance > 0 &&
      isDateInRange(currentSite.createdAt)
    ) {
      entries.push({
        id: `op-${currentSite.id}`,
        rawId: currentSite.id,
        date: currentSite.createdAt,
        type: "OPENING_BALANCE",
        typeLabel: "Opening Advance",
        title: "Client Opening Advance",
        subtitle: `Starting fund balance logged on project creation`,
        voucherNo: "OPENING",
        amount: Number(currentSite.openingBalance),
        isInflow: true,
        rawCreatedAt: currentSite.createdAt,
        rawRecord: currentSite,
      });
    }

    // Sort DATE-WISE: LATEST IN FIRST (descending date)
    entries.sort((a, b) => {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
      if (b.rawCreatedAt && a.rawCreatedAt) {
        return b.rawCreatedAt.localeCompare(a.rawCreatedAt);
      }
      return 0;
    });

    return entries;
  }, [
    currentSite,
    allSitePurchases,
    allSiteWorkLogs,
    allSiteMiscExpenses,
    allSiteIncomes,
    vendors,
    workers,
    startDate,
    endDate,
  ]);

  // ── Unified Ledger Edit & Delete States ──
  const [editingLedgerEntry, setEditingLedgerEntry] = useState<SiteLedgerEntry | null>(null);
  const [deletingLedgerEntry, setDeletingLedgerEntry] = useState<SiteLedgerEntry | null>(null);

  // Edit Form Fields
  const [editEntryDate, setEditEntryDate] = useState("");
  const [editEntryAmount, setEditEntryAmount] = useState("");
  const [editEntryVoucherNo, setEditEntryVoucherNo] = useState("");
  const [editEntryNotes, setEditEntryNotes] = useState("");
  const [editEntryVendorId, setEditEntryVendorId] = useState("");
  const [editEntryWorkerId, setEditEntryWorkerId] = useState("");
  const [editEntryCategory, setEditEntryCategory] = useState<ExpenseCategory>("MISCELLANEOUS");
  const [editEntryPaymentMode, setEditEntryPaymentMode] = useState<PaymentMode>("CASH");
  const [editEntryReceivedFrom, setEditEntryReceivedFrom] = useState("");

  const openEditLedgerEntry = (entry: SiteLedgerEntry) => {
    setEditingLedgerEntry(entry);
    setEditEntryDate(entry.date);
    setEditEntryAmount(entry.amount.toString());
    setEditEntryVoucherNo(entry.voucherNo || "");
    setEditEntryNotes(entry.rawRecord?.notes || "");

    if (entry.type === "MATERIAL") {
      setEditEntryVendorId(entry.rawRecord?.vendorId || vendors[0]?.id || "");
    } else if (entry.type === "LABOR") {
      setEditEntryWorkerId(entry.rawRecord?.workerId || workers[0]?.id || "");
    } else if (entry.type === "EXPENSE") {
      const rawCat = entry.rawRecord?.category;
      const normalizedCat: ExpenseCategory =
        rawCat === "FUEL_TRAVEL"
          ? "PETROL_FUEL"
          : rawCat === "TEA_REFRESHMENTS"
          ? "FOOD_TEA_REFRESHMENTS"
          : rawCat === "EQUIPMENT_RENT"
          ? "MACHINERY_RENT"
          : (rawCat || "MISCELLANEOUS");
      setEditEntryCategory(normalizedCat);
      setEditEntryPaymentMode(entry.rawRecord?.paymentMode || "CASH");
    } else if (entry.type === "INCOME") {
      setEditEntryReceivedFrom(entry.rawRecord?.receivedFrom || "");
      setEditEntryPaymentMode(entry.rawRecord?.paymentMode || "BANK_TRANSFER");
      setEditEntryVoucherNo(entry.rawRecord?.referenceNo || "");
    }
  };

  const openDeleteLedgerEntry = (entry: SiteLedgerEntry) => {
    setDeletingLedgerEntry(entry);
  };

  const handleSaveLedgerEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLedgerEntry) return;

    const amountNum = parseFloat(editEntryAmount) || 0;

    if (editingLedgerEntry.type === "MATERIAL") {
      updateVendorPurchase(editingLedgerEntry.rawId, {
        purchaseDate: editEntryDate,
        vendorId: editEntryVendorId,
        amount: amountNum,
        voucherNo: editEntryVoucherNo.trim(),
        notes: editEntryNotes.trim(),
      });
    } else if (editingLedgerEntry.type === "LABOR") {
      updateWorkerWorkLog(editingLedgerEntry.rawId, {
        workDate: editEntryDate,
        workerId: editEntryWorkerId,
        wageAmount: amountNum,
        notes: editEntryNotes.trim(),
      });
    } else if (editingLedgerEntry.type === "EXPENSE") {
      updateCompanyExpense(editingLedgerEntry.rawId, {
        expenseDate: editEntryDate,
        category: editEntryCategory,
        amount: amountNum,
        paymentMode: editEntryPaymentMode,
        voucherNo: editEntryVoucherNo.trim(),
        notes: editEntryNotes.trim(),
      });
    } else if (editingLedgerEntry.type === "INCOME") {
      updateSiteIncome(editingLedgerEntry.rawId, {
        incomeDate: editEntryDate,
        amount: amountNum,
        paymentMode: editEntryPaymentMode,
        referenceNo: editEntryVoucherNo.trim(),
        receivedFrom: editEntryReceivedFrom.trim(),
        notes: editEntryNotes.trim(),
      });
    } else if (editingLedgerEntry.type === "OPENING_BALANCE") {
      if (currentSite) {
        updateSite(currentSite.id, {
          openingBalance: amountNum,
        });
      }
    }

    setEditingLedgerEntry(null);
  };

  const handleConfirmDeleteLedgerEntry = () => {
    if (!deletingLedgerEntry) return;

    if (deletingLedgerEntry.type === "MATERIAL") {
      deleteVendorPurchase(deletingLedgerEntry.rawId);
    } else if (deletingLedgerEntry.type === "LABOR") {
      deleteWorkerWorkLog(deletingLedgerEntry.rawId);
    } else if (deletingLedgerEntry.type === "EXPENSE") {
      deleteCompanyExpense(deletingLedgerEntry.rawId);
    } else if (deletingLedgerEntry.type === "INCOME") {
      deleteSiteIncome(deletingLedgerEntry.rawId);
    } else if (deletingLedgerEntry.type === "OPENING_BALANCE") {
      if (currentSite) {
        updateSite(currentSite.id, {
          openingBalance: 0,
        });
      }
    }

    setDeletingLedgerEntry(null);
  };

  // Filtered entries by category, vendor, worker, and search term
  const filteredStatementEntries = useMemo(() => {
    let list = allSiteLedgerEntries;
    if (statementTypeFilter !== "ALL") {
      list = list.filter((e) => e.type === statementTypeFilter);
    }
    if (statementVendorFilter !== "ALL" && statementWorkerFilter !== "ALL") {
      list = list.filter(
        (e) => e.vendorId === statementVendorFilter || e.workerId === statementWorkerFilter
      );
    } else if (statementVendorFilter !== "ALL") {
      list = list.filter((e) => e.vendorId === statementVendorFilter);
    } else if (statementWorkerFilter !== "ALL") {
      list = list.filter((e) => e.workerId === statementWorkerFilter);
    }
    if (statementSearch.trim()) {
      const q = statementSearch.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.subtitle && e.subtitle.toLowerCase().includes(q)) ||
          (e.voucherNo && e.voucherNo.toLowerCase().includes(q)) ||
          e.typeLabel.toLowerCase().includes(q) ||
          e.date.includes(q)
      );
    }
    return list;
  }, [
    allSiteLedgerEntries,
    statementTypeFilter,
    statementVendorFilter,
    statementWorkerFilter,
    statementSearch,
  ]);

  // Paginated entries for the unified table
  const paginatedStatementEntries = useMemo(() => {
    const size = Math.max(1, Number(statementPageSize) || 10);
    const totalPages = Math.max(1, Math.ceil(filteredStatementEntries.length / size));
    const safePage = Math.min(Math.max(1, statementPage), totalPages);
    const start = (safePage - 1) * size;
    return filteredStatementEntries.slice(start, start + size);
  }, [filteredStatementEntries, statementPage, statementPageSize]);

  // Date-filtered totals for active statement period
  const periodInflows = useMemo(() => {
    return filteredStatementEntries
      .filter((e) => e.isInflow)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredStatementEntries]);

  const periodExpenses = useMemo(() => {
    return filteredStatementEntries
      .filter((e) => !e.isInflow)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredStatementEntries]);

  const handlePrintStatement = () => {
    const originalTitle = document.title;
    document.title = "";
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Reset pagination when site or filters change
  useEffect(() => {
    setStatementPage(1);
  }, [
    selectedSiteId,
    statementTypeFilter,
    statementVendorFilter,
    statementWorkerFilter,
    statementSearch,
    startDate,
    endDate,
  ]);

  const triggerSiteAction = (
    siteId: string,
    action: "PURCHASE" | "WORK_LOG" | "INCOME" | "EXPENSE"
  ) => {
    setActiveActionSiteId(siteId);
    if (action === "PURCHASE") setOpenPurchase(true);
    if (action === "WORK_LOG") setOpenWorkLog(true);
    if (action === "INCOME") setOpenIncome(true);
    if (action === "EXPENSE") setOpenExpense(true);
  };

  if (isDbLoading) {
    return <SitesSkeleton />;
  }

  // ── STRICT RBAC ENFORCEMENT FOR ACCOUNTANT ─────────────────────────────
  if (role === "ACCOUNTANT") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted to Owner</h2>
        <p className="text-sm text-slate-500 max-w-md mt-2">
          Sites and client project administration is restricted to the Company Owner and Site Managers. As an Accountant, you can manage cash flow, vendor bills, and worker wages.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/cashflow">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Go to Cash Flow
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline">View Financial Reports</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Sites Roster & Project Controls (Hidden when printing site statement) ── */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-amber-500 text-slate-950 p-2 shadow-md shadow-amber-500/20">
                <Building2 className="h-5 w-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Sites &amp; Client Projects
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage construction projects, budgets, allocate laborers, record material bills, and generate client statements.
            </p>
          </div>
          <Button onClick={() => setIsAddSiteOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
            <Plus className="h-4 w-4 mr-1.5" />
            New Site Project
          </Button>
        </div>

        {/* ── Search & Filter Bar ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by site name, client, location..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setRosterPage(1);
                }}
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setRosterPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 font-medium focus:outline-hidden"
              >
                <option value="ALL">All Project Statuses ({sites.length})</option>
                <option value="ACTIVE">Active Construction</option>
                <option value="COMPLETED">Completed Projects</option>
                <option value="ON_HOLD">On Hold</option>
              </select>

              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "GRID"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                  title="Card Grid View (with Action Buttons)"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("TABLE")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "TABLE"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                  title="Table List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
            <span>
              Found <strong>{filteredSites.length}</strong> matching sites out of{" "}
              <strong>{sites.length}</strong> total
            </span>
            {selectedSiteId && (
              <button
                onClick={() => setSelectedSiteId("")}
                className="text-amber-700 hover:underline font-semibold"
              >
                ✕ Close Selected Site Statement
              </button>
            )}
          </div>
        </div>

        {/* ── Empty State ────────────────────────────────────────────────────── */}
        {sites.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300 p-12 text-center bg-white shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Sites Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Click &quot;+ New Site Project&quot; to add your first construction project with client details and budget.
            </p>
            <Button onClick={() => setIsAddSiteOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Site
            </Button>
          </Card>
        ) : paginatedSites.length === 0 ? (
          <Card className="p-8 text-center bg-white border-slate-200">
            <p className="text-xs text-slate-400 italic">
              No sites match &quot;{searchTerm}&quot; with selected status filter.
            </p>
          </Card>
        ) : viewMode === "GRID" ? (
          /* ── GRID VIEW (With 4 Action Buttons per site) ──────────────────── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedSites.map((site) => {
                const stats = getSiteStats(site.id);
                const isSelected = site.id === selectedSiteId;

                return (
                  <Card
                    key={site.id}
                    onClick={() => setSelectedSiteId(site.id)}
                    className={`relative overflow-hidden cursor-pointer transition-all ${isSelected ? "ring-2 ring-amber-500 shadow-md bg-amber-50/20" : "hover:border-slate-300 hover:shadow-xs"
                      }`}
                  >
                    <div
                      className={`h-1.5 w-full ${site.status === "ACTIVE"
                        ? "bg-amber-500"
                        : site.status === "COMPLETED"
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                        }`}
                    />
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base font-bold text-slate-900">
                            {site.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500 mt-0.5">
                            Client: <strong>{site.clientName}</strong> • {site.location || "City Center"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={site.status === "ACTIVE" ? "warning" : "secondary"}
                            className="text-[10px]"
                          >
                            {site.status}
                          </Badge>
                          <div className="flex items-center ml-1 border-l border-slate-200 pl-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => openEditModal(site)}
                              className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-100/60 transition-colors"
                              title="Edit Site Details"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(site)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 transition-colors"
                              title="Delete Site Project"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 space-y-3">
                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-mono">Materials Cost:</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {formatCurrency(stats.materialExpense)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-mono">Labor Wages:</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {formatCurrency(stats.laborExpense)}
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-200 flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-600">Total Project Outflow:</span>
                          <span className="font-black text-rose-600 font-mono">
                            {formatCurrency(stats.totalExpense)}
                          </span>
                        </div>
                      </div>

                      {/* 4 ACTION BUTTONS IN EVERY SITE */}
                      <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
                          Direct Site Actions:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] font-semibold bg-white border-amber-300 text-amber-900 hover:bg-amber-50"
                            onClick={() => triggerSiteAction(site.id, "PURCHASE")}
                          >
                            <Truck className="h-3 w-3 mr-1 text-amber-600" />
                            + Material
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] font-semibold bg-white border-blue-300 text-blue-900 hover:bg-blue-50"
                            onClick={() => triggerSiteAction(site.id, "WORK_LOG")}
                          >
                            <Users className="h-3 w-3 mr-1 text-blue-600" />
                            + Worker
                          </Button>
                          {role === "OWNER" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] font-semibold bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-50"
                              onClick={() => triggerSiteAction(site.id, "INCOME")}
                            >
                              <IndianRupee className="h-3 w-3 mr-1 text-emerald-600" />
                              + Advance
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] font-semibold bg-white border-purple-300 text-purple-900 hover:bg-purple-50"
                            onClick={() => triggerSiteAction(site.id, "EXPENSE")}
                          >
                            <Fuel className="h-3 w-3 mr-1 text-purple-600" />
                            + Expense
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Pagination
              currentPage={rosterPage}
              totalItems={filteredSites.length}
              pageSize={rosterPageSize}
              onPageChange={setRosterPage}
              onPageSizeChange={setRosterPageSize}
            />
          </div>
        ) : (
          /* ── TABLE VIEW (Compact for 100 Sites) ─────────────────────────── */
          <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-mono border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Site Name</th>
                      <th className="py-3 px-4 font-semibold">Client</th>
                      <th className="py-3 px-4 font-semibold">Location</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 text-right font-semibold">Materials</th>
                      <th className="py-3 px-4 text-right font-semibold">Labor</th>
                      <th className="py-3 px-4 text-right font-semibold">Total Cost</th>
                      <th className="py-3 px-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedSites.map((site) => {
                      const stats = getSiteStats(site.id);
                      const isSelected = site.id === selectedSiteId;

                      return (
                        <tr
                          key={site.id}
                          onClick={() => setSelectedSiteId(site.id)}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-amber-50/70 font-semibold" : "hover:bg-amber-50/30"
                            }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                            {site.name}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-700">{site.clientName}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-500">{site.location}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge
                              variant={site.status === "ACTIVE" ? "warning" : "secondary"}
                              className="text-[10px]"
                            >
                              {site.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                            {formatCurrency(stats.materialExpense)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                            {formatCurrency(stats.laborExpense)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-rose-600">
                            {formatCurrency(stats.totalExpense)}
                          </td>
                          <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5"
                                onClick={() => triggerSiteAction(site.id, "PURCHASE")}
                              >
                                + Material
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5"
                                onClick={() => triggerSiteAction(site.id, "WORK_LOG")}
                              >
                                + Worker
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5 text-slate-700 hover:text-amber-700 hover:border-amber-400"
                                onClick={() => openEditModal(site)}
                                title="Edit Site Details"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                                onClick={() => openDeleteModal(site)}
                                title="Delete Site"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5"
                                onClick={() => setSelectedSiteId(site.id)}
                                title="View Statement"
                              >
                                <Eye className="h-3 w-3" />
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
                totalItems={filteredSites.length}
                pageSize={rosterPageSize}
                onPageChange={setRosterPage}
                onPageSizeChange={setRosterPageSize}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Selected Site Detailed Statement ──────────────────────────────── */}
      {currentSite && currentStats && (
        <Card className="border-slate-200 bg-white shadow-md overflow-hidden mt-6 print:border-none print:shadow-none print:mt-0">
          {/* ── Official Printable Site Statement Header (Print Only) ───── */}
          <div className="hidden print:block p-4 border-b-2 border-slate-900 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                  {companyName || "MK BUILDERS"}
                </h1>
              </div>
              <div className="text-right text-xs font-mono">
                <p className="text-slate-700 font-semibold">Date: {generatedDate || "Official Record"}</p>
              </div>
            </div>

            {/* Standard Project & Client Info (No Status) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3 mt-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Project Name:</span>
                <span className="font-bold text-slate-950 text-sm">{currentSite.name}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Client Name:</span>
                <span className="font-bold text-slate-950 text-sm">{currentSite.clientName}</span>
              </div>
              {currentSite.location && (
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Location:</span>
                  <span className="font-semibold text-slate-800 text-sm">{currentSite.location}</span>
                </div>
              )}
            </div>

            {/* Date-Filtered Period Summary (No Net Margin) */}
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200 text-center font-mono">
              <div className="bg-white rounded p-2 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimated Budget</span>
                <span className="font-bold text-slate-900 text-sm">{formatCurrency(currentSite.estimatedBudget)}</span>
              </div>
              <div className="bg-white rounded p-2 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Client Inflows</span>
                <span className="font-bold text-emerald-700 text-sm">+{formatCurrency(periodInflows)}</span>
              </div>
              <div className="bg-white rounded p-2 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Expenses</span>
                <span className="font-bold text-rose-700 text-sm">-{formatCurrency(periodExpenses)}</span>
              </div>
            </div>
          </div>

          <CardHeader className="border-b border-slate-200 bg-slate-50/60 pb-4 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  {currentSite.name} • Comprehensive Site Statement
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-mono">
                  Client: {currentSite.clientName} • Location: {currentSite.location} • Status: {currentSite.status}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(currentSite)}
                  className="text-slate-700 hover:text-amber-700 hover:border-amber-300"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit Site
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteModal(currentSite)}
                  className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete Site
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintStatement}>
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print Statement
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
              <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Budget</span>
                <span className="text-base font-bold text-slate-900 font-mono">{formatCurrency(currentSite.estimatedBudget)}</span>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Client Inflows</span>
                <span className="text-base font-bold text-emerald-600 font-mono">{formatCurrency(currentStats.totalIncome)}</span>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Total Expenses</span>
                <span className="text-base font-bold text-rose-600 font-mono">{formatCurrency(currentStats.totalExpense)}</span>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Net Margin</span>
                <span className={`text-base font-black font-mono ${currentStats.netMargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatCurrency(currentStats.netMargin)}
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
                  }}
                  className="text-xs bg-transparent text-slate-800 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* ── Unified Statement Header & Actions ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 print:hidden">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
                    Site Financial Ledger &amp; Comprehensive Statement
                  </h3>
                  <Badge variant="outline" className="text-xs font-mono font-bold text-slate-700 bg-slate-100">
                    {filteredStatementEntries.length} records
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological unified log of all site material bills, worker wages, operational expenses, and client inflows (sorted latest first).
                </p>
              </div>

              {/* Direct Site Actions */}
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerSiteAction(currentSite.id, "PURCHASE")}
                  className="h-8 text-xs text-amber-800 border-amber-200 bg-amber-50/70 hover:bg-amber-100 font-bold"
                >
                  <Truck className="h-3 w-3 mr-1 text-amber-600" />
                  + Material
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerSiteAction(currentSite.id, "WORK_LOG")}
                  className="h-8 text-xs text-blue-800 border-blue-200 bg-blue-50/70 hover:bg-blue-100 font-bold"
                >
                  <Users className="h-3 w-3 mr-1 text-blue-600" />
                  + Worker Wage
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerSiteAction(currentSite.id, "EXPENSE")}
                  className="h-8 text-xs text-purple-800 border-purple-200 bg-purple-50/70 hover:bg-purple-100 font-bold"
                >
                  <Receipt className="h-3 w-3 mr-1 text-purple-600" />
                  + Expense
                </Button>
                {role === "OWNER" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerSiteAction(currentSite.id, "INCOME")}
                    className="h-8 text-xs text-emerald-800 border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 font-bold"
                  >
                    <IndianRupee className="h-3 w-3 mr-1 text-emerald-600" />
                    + Client Inflow
                  </Button>
                )}
              </div>
            </div>

            {/* ── Filter Pills, Vendor & Worker Filters, and Search ── */}
            <div className="space-y-2.5 print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStatementTypeFilter("ALL");
                      setStatementPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      statementTypeFilter === "ALL"
                        ? "bg-slate-900 text-white shadow-xs font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All ({allSiteLedgerEntries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatementTypeFilter("MATERIAL");
                      setStatementPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      statementTypeFilter === "MATERIAL"
                        ? "bg-amber-600 text-white shadow-xs font-bold"
                        : "bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100"
                    }`}
                  >
                    📦 Materials ({allSitePurchases.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatementTypeFilter("LABOR");
                      setStatementPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      statementTypeFilter === "LABOR"
                        ? "bg-blue-600 text-white shadow-xs font-bold"
                        : "bg-blue-50 text-blue-800 border border-blue-200/60 hover:bg-blue-100"
                    }`}
                  >
                    👷 Wages ({allSiteWorkLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatementTypeFilter("EXPENSE");
                      setStatementPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      statementTypeFilter === "EXPENSE"
                        ? "bg-purple-600 text-white shadow-xs font-bold"
                        : "bg-purple-50 text-purple-800 border border-purple-200/60 hover:bg-purple-100"
                    }`}
                  >
                    ⛽ Expenses ({allSiteMiscExpenses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatementTypeFilter("INCOME");
                      setStatementPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      statementTypeFilter === "INCOME"
                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100"
                    }`}
                  >
                    💰 Inflows ({allSiteIncomes.length})
                  </button>
                </div>

                {/* In-table Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search in site statement..."
                    value={statementSearch}
                    onChange={(e) => {
                      setStatementSearch(e.target.value);
                      setStatementPage(1);
                    }}
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* ── Sub-Filters: Vendor Filter & Worker Filter (Mobile Responsive) ── */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-500 font-mono text-[11px] uppercase tracking-wide flex items-center gap-1 shrink-0">
                  <Filter className="h-3 w-3 text-amber-600" />
                  Filters:
                </span>

                <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  {/* Vendor Filter Dropdown */}
                  <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-amber-50/80 border border-amber-200 rounded-lg px-2.5 py-1.5 sm:py-1 w-full sm:w-auto shadow-2xs">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-none">
                      <Truck className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                      <span className="text-amber-800 font-semibold text-[11px] shrink-0">Vendor:</span>
                      <select
                        value={statementVendorFilter}
                        onChange={(e) => {
                          setStatementVendorFilter(e.target.value);
                          setStatementPage(1);
                        }}
                        className="bg-transparent text-xs font-bold text-amber-950 focus:outline-none cursor-pointer w-full sm:max-w-[160px] truncate pr-1"
                      >
                        <option value="ALL">All Vendors ({vendors.length})</option>
                        {vendors.map((v) => {
                          const count = allSitePurchases.filter((p) => p.vendorId === v.id).length;
                          return (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.tradeCategory}){count > 0 ? ` • ${count} bills` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {statementVendorFilter !== "ALL" && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatementVendorFilter("ALL");
                          setStatementPage(1);
                        }}
                        className="ml-1 text-slate-400 hover:text-rose-600 font-bold text-[10px] shrink-0 cursor-pointer"
                        title="Clear vendor filter"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Worker Filter Dropdown */}
                  <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-blue-50/80 border border-blue-200 rounded-lg px-2.5 py-1.5 sm:py-1 w-full sm:w-auto shadow-2xs">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-none">
                      <Users className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                      <span className="text-blue-800 font-semibold text-[11px] shrink-0">Worker:</span>
                      <select
                        value={statementWorkerFilter}
                        onChange={(e) => {
                          setStatementWorkerFilter(e.target.value);
                          setStatementPage(1);
                        }}
                        className="bg-transparent text-xs font-bold text-blue-950 focus:outline-none cursor-pointer w-full sm:max-w-[160px] truncate pr-1"
                      >
                        <option value="ALL">All Workers ({workers.length})</option>
                        {workers.map((w) => {
                          const count = allSiteWorkLogs.filter((l) => l.workerId === w.id).length;
                          return (
                            <option key={w.id} value={w.id}>
                              {w.name} ({w.trade}){count > 0 ? ` • ${count} logs` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {statementWorkerFilter !== "ALL" && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatementWorkerFilter("ALL");
                          setStatementPage(1);
                        }}
                        className="ml-1 text-slate-400 hover:text-rose-600 font-bold text-[10px] shrink-0 cursor-pointer"
                        title="Clear worker filter"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {(statementVendorFilter !== "ALL" || statementWorkerFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatementVendorFilter("ALL");
                      setStatementWorkerFilter("ALL");
                      setStatementPage(1);
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-semibold sm:ml-1 cursor-pointer w-full sm:w-auto text-center"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* ── Unified Statement Table (On-Screen Paginated View) ── */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs print:hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-mono text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Party / Description</th>
                    <th className="py-2.5 px-3">Voucher / Ref #</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3 text-right print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedStatementEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        No transactions, material bills, wage logs, or expenses recorded for this site project.
                      </td>
                    </tr>
                  ) : (
                    paginatedStatementEntries.map((entry) => {
                      const badgeClass =
                        entry.type === "INCOME"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : entry.type === "OPENING_BALANCE"
                          ? "bg-teal-50 text-teal-800 border-teal-200"
                          : entry.type === "MATERIAL"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : entry.type === "LABOR"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : entry.typeLabel === "Outside Labour"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-purple-50 text-purple-700 border-purple-200";

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-2.5 px-3 font-mono text-slate-600 font-medium whitespace-nowrap">
                            {formatDate(entry.date)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge variant="outline" className={`text-[10px] font-bold ${badgeClass}`}>
                              {entry.typeLabel}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{entry.title}</div>
                            {entry.subtitle && (
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {entry.subtitle}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap text-amber-800">
                            {entry.voucherNo ? `#${entry.voucherNo}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <span
                              className={`font-mono font-bold text-xs sm:text-sm ${
                                entry.isInflow ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {entry.isInflow
                                ? `+${formatCurrency(entry.amount)}`
                                : `-${formatCurrency(entry.amount)}`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap print:hidden">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditLedgerEntry(entry)}
                                title="Edit Transaction"
                                className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 cursor-pointer transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteLedgerEntry(entry)}
                                title="Delete Transaction"
                                className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Print Record Count Header Only */}
            <div className="hidden print:flex items-center justify-between py-1 font-mono text-xs font-bold text-slate-800">
              <span>Total Records: {filteredStatementEntries.length}</span>
              {datePreset !== "ALL" && (startDate || endDate) && (
                <span className="text-[11px] text-slate-600 font-normal">
                  Period: {startDate ? formatDate(startDate) : "Start"} to {endDate ? formatDate(endDate) : "Latest"}
                </span>
              )}
            </div>

            {/* ── Print-Only Table (Full Unpaginated Statement with ALL Data) ── */}
            <div className="hidden print:block">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-[10px] uppercase font-mono text-slate-900 border-b-2 border-slate-400">
                  <tr>
                    <th className="py-2 px-3 font-bold">Date</th>
                    <th className="py-2 px-3 font-bold">Type</th>
                    <th className="py-2 px-3 font-bold">Party / Description</th>
                    <th className="py-2 px-3 font-bold">Voucher / Ref #</th>
                    <th className="py-2 px-3 text-right font-bold">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStatementEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                        No transactions recorded for this site project.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {filteredStatementEntries.map((entry) => (
                        <tr key={`print-${entry.id}`} className="break-inside-avoid text-slate-900 border-b border-slate-200">
                          <td className="py-2 px-3 font-mono whitespace-nowrap text-xs">
                            {formatDate(entry.date)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-[10px]">
                            {entry.typeLabel}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900">{entry.title}</div>
                            {entry.subtitle && (
                              <div className="text-[10px] text-slate-600">{entry.subtitle}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold whitespace-nowrap text-slate-800">
                            {entry.voucherNo ? `#${entry.voucherNo}` : "—"}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-bold text-xs">
                            <span className={entry.isInflow ? "text-emerald-700" : "text-rose-700"}>
                              {entry.isInflow
                                ? `+${formatCurrency(entry.amount)}`
                                : `-${formatCurrency(entry.amount)}`}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* End-of-Statement Date-Filtered Summary (Only at the end of the last page, NOT on every page) */}
                      <tr className="bg-slate-50 border-t-2 border-slate-400 font-mono text-xs break-inside-avoid">
                        <td colSpan={4} className="py-2 px-3 text-right font-semibold text-slate-700">
                          Total Client Inflows:
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">
                          +{formatCurrency(periodInflows)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50 border-t border-slate-200 font-mono text-xs break-inside-avoid">
                        <td colSpan={4} className="py-2 px-3 text-right font-semibold text-slate-700">
                          Total Site Expenses:
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-rose-700">
                          -{formatCurrency(periodExpenses)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="print:hidden">
              <Pagination
                currentPage={statementPage}
                totalItems={filteredStatementEntries.length}
                pageSize={statementPageSize}
                onPageChange={setStatementPage}
                onPageSizeChange={setStatementPageSize}
                pageSizeOptions={[5, 10, 25, 50, 100, 500]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: New Site */}
      <Modal
        isOpen={isAddSiteOpen}
        onClose={() => setIsAddSiteOpen(false)}
        title="Create New Site Project"
        description="Add a new construction site, client name, location, and estimated budget."
      >
        <form onSubmit={handleCreateSite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project / Site Name *</label>
            <Input
              placeholder="e.g. Skyline Towers - Block A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Full Name *</label>
              <Input
                placeholder="e.g. Rajesh Kumar"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Sector</label>
              <Input
                placeholder="e.g. Whitefield, Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Budget (₹)</label>
              <Input
                type="number"
                placeholder="e.g. 5000000"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Balance / Advance (₹) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                placeholder="e.g. 50000 (Optional)"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddSiteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Site Modal */}
      <Modal
        isOpen={!!editingSite}
        onClose={() => setEditingSite(null)}
        title={`Edit Site: ${editingSite?.name || ""}`}
        description="Update site project parameters, client details, status, or estimated budget."
      >
        <form onSubmit={handleUpdateSite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Site / Project Name *</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Full Name *</label>
              <Input
                value={editClientName}
                onChange={(e) => setEditClientName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Sector</label>
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as SiteStatus)}
                className="w-full h-10 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden"
              >
                <option value="ACTIVE">Active Construction</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Budget (₹)</label>
              <Input
                type="number"
                value={editEstimatedBudget}
                onChange={(e) => setEditEstimatedBudget(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Opening Balance / Advance (₹) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="number"
              placeholder="e.g. 50000"
              value={editOpeningBalance}
              onChange={(e) => setEditOpeningBalance(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setEditingSite(null)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Site Modal with Relational Integrity Warning */}
      {deletingSite && (() => {
        const dep = getSiteDependencies(deletingSite.id);
        const hasDependencies = dep.total > 0;

        return (
          <Modal
            isOpen={!!deletingSite}
            onClose={() => setDeletingSite(null)}
            title={hasDependencies ? "⚠️ High-Risk Action: Relational Data Loss Warning" : "Delete Site Project"}
            description={hasDependencies ? "This site is linked to active financial transactions and operational logs." : "Confirm permanent removal of this site project."}
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
                          The site <strong>&quot;{deletingSite.name}&quot;</strong> has <strong>{dep.total}</strong> related records linked across your accounting and workforce ledgers:
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pl-12 grid grid-cols-2 gap-2 text-xs font-mono text-rose-800">
                      <div className="bg-white/80 p-2 rounded border border-rose-200">
                        📦 Material Bills: <strong>{dep.purchasesCount}</strong>
                      </div>
                      <div className="bg-white/80 p-2 rounded border border-rose-200">
                        👷 Worker Wages: <strong>{dep.workLogsCount}</strong>
                      </div>
                      <div className="bg-white/80 p-2 rounded border border-rose-200">
                        💰 Client Incomes: <strong>{dep.incomesCount}</strong>
                      </div>
                      <div className="bg-white/80 p-2 rounded border border-rose-200">
                        ⛽ Overhead Exp.: <strong>{dep.expensesCount}</strong>
                      </div>
                      {dep.vendorPaysCount > 0 && (
                        <div className="col-span-2 bg-white/80 p-2 rounded border border-rose-200">
                          💳 Vendor Payments: <strong>{dep.vendorPaysCount}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                    <p className="font-semibold">Recommended Safe Option:</p>
                    <p className="text-[11px] mt-0.5 text-amber-800">
                      Do not delete if you want to keep historical project audit accounts and vendor vouchers intact. You can change this site status to <strong>&quot;Completed&quot;</strong> or <strong>&quot;On Hold&quot;</strong> via Edit instead.
                    </p>
                  </div>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-rose-300 bg-rose-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmCascade}
                      onChange={(e) => setConfirmCascade(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-medium text-rose-950">
                      I understand that deleting this site will cascade-delete all {dep.total} related transactions, vouchers, and ledger records permanently.
                    </span>
                  </label>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs text-slate-600">
                    Are you sure you want to delete <strong>&quot;{deletingSite.name}&quot;</strong>? This site has no linked bills, wage logs, or vouchers, and can be removed safely.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingSite(null)}
                  className="h-9 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 shrink-0"
                >
                  {hasDependencies ? "No, Keep Data (Cancel)" : "Cancel"}
                </Button>
                {hasDependencies ? (
                  <Button
                    type="button"
                    disabled={!confirmCascade}
                    onClick={() => handleExecuteDeleteSite(true)}
                    className="h-9 px-4 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Force Delete &amp; Wipe Data
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleExecuteDeleteSite(false)}
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

      {/* ── Edit Site Ledger Entry Modal ── */}
      <Modal
        isOpen={!!editingLedgerEntry}
        onClose={() => setEditingLedgerEntry(null)}
        title={`Edit ${editingLedgerEntry?.typeLabel || "Transaction"}`}
        description={`Modify transaction details for this ${editingLedgerEntry?.typeLabel.toLowerCase() || "entry"} on ${currentSite?.name || "this site"}.`}
      >
        <form onSubmit={handleSaveLedgerEntry} className="space-y-4 pt-2">
          {/* Date & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date *
              </label>
              <Input
                type="date"
                required
                value={editEntryDate}
                onChange={(e) => setEditEntryDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹) *
              </label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                value={editEntryAmount}
                onChange={(e) => setEditEntryAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Conditional type-specific fields */}
          {editingLedgerEntry?.type === "MATERIAL" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor / Supplier *
              </label>
              <select
                required
                value={editEntryVendorId}
                onChange={(e) => setEditEntryVendorId(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.tradeCategory ? `(${v.tradeCategory})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {editingLedgerEntry?.type === "LABOR" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Worker Name *
              </label>
              <select
                required
                value={editEntryWorkerId}
                onChange={(e) => setEditEntryWorkerId(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.trade ? `(${w.trade})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {editingLedgerEntry?.type === "EXPENSE" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expense Category *
                </label>
                <select
                  value={editEntryCategory}
                  onChange={(e) => setEditEntryCategory(e.target.value as ExpenseCategory)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="OUTSIDE_LABOR">Outside Labour (Immediate Wage)</option>
                  <option value="ROOM_RENT">Room / Labour Camp Rent</option>
                  <option value="PETROL_FUEL">Company Petrol &amp; Vehicle Fuel</option>
                  <option value="FOOD_TEA_REFRESHMENTS">Worker Mess &amp; Tea Refreshments</option>
                  <option value="MACHINERY_RENT">Machinery &amp; Equipment Rental</option>
                  <option value="OFFICE_OVERHEAD">Office Overhead / Electricity</option>
                  <option value="SITE_PERMIT_FEES">Site Permit &amp; Municipal Fees</option>
                  <option value="MISCELLANEOUS">Other Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={editEntryPaymentMode}
                  onChange={(e) => setEditEntryPaymentMode(e.target.value as PaymentMode)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>
          )}

          {editingLedgerEntry?.type === "INCOME" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Received From
                </label>
                <Input
                  placeholder="e.g. Client name / Owner"
                  value={editEntryReceivedFrom}
                  onChange={(e) => setEditEntryReceivedFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={editEntryPaymentMode}
                  onChange={(e) => setEditEntryPaymentMode(e.target.value as PaymentMode)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="UPI">UPI / Online</option>
                </select>
              </div>
            </div>
          )}

          {/* Voucher / Ref # & Notes */}
          {editingLedgerEntry?.type !== "OPENING_BALANCE" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingLedgerEntry?.type === "INCOME" ? "Transaction / Cheque Ref #" : "Voucher / Bill #"}
                </label>
                <Input
                  placeholder="e.g. V-1024 or Cheque #"
                  value={editEntryVoucherNo}
                  onChange={(e) => setEditEntryVoucherNo(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Remarks
                </label>
                <Input
                  placeholder="e.g. 50 bags OPC cement, plastering day work, etc."
                  value={editEntryNotes}
                  onChange={(e) => setEditEntryNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingLedgerEntry(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={!!deletingLedgerEntry}
        onClose={() => setDeletingLedgerEntry(null)}
        title={`Delete ${deletingLedgerEntry?.typeLabel || "Transaction"}`}
        description="Are you sure you want to remove this record? This action will adjust the site financials immediately."
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Date:</span>
              <span className="font-bold text-slate-800">{deletingLedgerEntry?.date && formatDate(deletingLedgerEntry.date)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Record Type:</span>
              <Badge variant="outline" className="font-bold">
                {deletingLedgerEntry?.typeLabel}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Party / Details:</span>
              <span className="font-semibold text-slate-800 text-right">{deletingLedgerEntry?.title}</span>
            </div>
            {deletingLedgerEntry?.voucherNo && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">Voucher / Ref:</span>
                <span className="font-mono font-bold text-amber-800">#{deletingLedgerEntry.voucherNo}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2">
              <span className="text-slate-500 font-mono">Amount:</span>
              <span className={`font-mono font-bold text-sm ${deletingLedgerEntry?.isInflow ? "text-emerald-600" : "text-rose-600"}`}>
                {deletingLedgerEntry?.isInflow ? "+" : "-"}{formatCurrency(deletingLedgerEntry?.amount || 0)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingLedgerEntry(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDeleteLedgerEntry}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>

      {/* Action Modals */}
      <ActionModals
        isOpenPurchase={openPurchase}
        onClosePurchase={() => setOpenPurchase(false)}
        isOpenWorkLog={openWorkLog}
        onCloseWorkLog={() => setOpenWorkLog(false)}
        isOpenIncome={openIncome}
        onCloseIncome={() => setOpenIncome(false)}
        isOpenExpense={openExpense}
        onCloseExpense={() => setOpenExpense(false)}
        preselectedSiteId={activeActionSiteId || selectedSiteId}
      />
    </div>
  );
}
