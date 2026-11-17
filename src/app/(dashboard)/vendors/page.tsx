"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Truck,
  Plus,
  CreditCard,
  Building2,
  FileText,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Calendar,
  Filter,
  Search,
  List,
  LayoutGrid,
  Eye,
  IndianRupee,
  Pencil,
  Trash2,
  AlertTriangle,
  Printer,
} from "lucide-react";
import { Vendor } from "@/lib/types";
import { useConstruction } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { ActionModals } from "@/components/modals/ActionModals";
import { Pagination } from "@/components/ui/pagination";

export default function VendorsPage() {
  const {
    companyName,
    vendors,
    sites,
    vendorPurchases,
    vendorPayments,
    getVendorStats,
    addVendor,
    updateVendor,
    deleteVendor,
  } = useConstruction();

  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
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

  // Edit Vendor State
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTradeCategory, setEditTradeCategory] = useState("Cement Supplier");
  const [editNotes, setEditNotes] = useState("");
  const [editOpeningBalance, setEditOpeningBalance] = useState("");

  // Delete Vendor State & Relational Integrity Check
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [confirmVendorCascade, setConfirmVendorCascade] = useState(false);

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setEditName(vendor.name);
    setEditPhone(vendor.phone || "");
    setEditTradeCategory(vendor.tradeCategory || "Cement Supplier");
    setEditNotes(vendor.notes || "");
    setEditOpeningBalance(vendor.openingBalance ? vendor.openingBalance.toString() : "");
  };

  const handleUpdateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor || !editName.trim()) return;

    updateVendor(editingVendor.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      tradeCategory: editTradeCategory.trim() || "Materials",
      notes: editNotes.trim(),
      openingBalance: parseFloat(editOpeningBalance) || 0,
    });
    setEditingVendor(null);
  };

  const getVendorDependencies = (vendorId: string) => {
    const purchases = vendorPurchases.filter((p) => p.vendorId === vendorId);
    const payments = vendorPayments.filter((vp) => vp.vendorId === vendorId);
    const total = purchases.length + payments.length;

    return {
      purchasesCount: purchases.length,
      paymentsCount: payments.length,
      total,
    };
  };

  const openDeleteModal = (vendor: Vendor) => {
    setDeletingVendor(vendor);
    setConfirmVendorCascade(false);
  };

  const handleExecuteDeleteVendor = (forceCascade = false) => {
    if (!deletingVendor) return;
    const res = deleteVendor(deletingVendor.id, forceCascade);
    if (res.success) {
      if (selectedVendorId === deletingVendor.id) {
        setSelectedVendorId("");
      }
      setDeletingVendor(null);
    }
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [siteBreakdownSearch, setSiteBreakdownSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [balanceFilter, setBalanceFilter] = useState<"ALL" | "PENDING" | "SETTLED">("ALL");
  const [sortBy, setSortBy] = useState<"BALANCE_DESC" | "NAME" | "BILLED_DESC">("BALANCE_DESC");
  const [viewMode, setViewMode] = useState<"TABLE" | "GRID">("TABLE");

  // Roster Pagination
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterPageSize, setRosterPageSize] = useState(15);

  // Modals for Actions
  const [openPurchase, setOpenPurchase] = useState(false);
  const [openVendorPay, setOpenVendorPay] = useState(false);
  const [actionTargetVendorId, setActionTargetVendorId] = useState<string | undefined>(undefined);

  // New Vendor Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tradeCategory, setTradeCategory] = useState("Cement Supplier");
  const [notes, setNotes] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addVendor({
      name: name.trim(),
      phone: phone.trim(),
      tradeCategory: tradeCategory.trim() || "Materials",
      notes: notes.trim(),
      openingBalance: parseFloat(openingBalance) || 0,
    });

    setName("");
    setPhone("");
    setNotes("");
    setOpeningBalance("");
    setIsAddVendorOpen(false);
  };

  // Distinct categories
  const distinctCategories = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach((v) => {
      if (v.tradeCategory) set.add(v.tradeCategory);
    });
    return Array.from(set).sort();
  }, [vendors]);

  // Overall Vendor Statistics
  const overallStats = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let pendingCount = 0;

    vendors.forEach((v) => {
      const s = getVendorStats(v.id);
      totalBilled += s.totalPurchased;
      totalPaid += s.totalPaid;
      if (s.outstandingBalance > 0) pendingCount++;
    });

    return {
      totalVendors: vendors.length,
      totalBilled,
      totalPaid,
      totalPending: totalBilled - totalPaid,
      pendingCount,
    };
  }, [vendors, getVendorStats]);

  // Filtered & Sorted Vendors
  const filteredVendors = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return vendors
      .filter((v) => {
        if (categoryFilter !== "ALL" && v.tradeCategory !== categoryFilter) return false;

        const stats = getVendorStats(v.id);
        if (balanceFilter === "PENDING" && stats.outstandingBalance <= 0) return false;
        if (balanceFilter === "SETTLED" && stats.outstandingBalance > 0) return false;

        if (q) {
          const matchName = v.name.toLowerCase().includes(q);
          const matchPhone = v.phone.toLowerCase().includes(q);
          const matchCat = v.tradeCategory.toLowerCase().includes(q);
          const matchNotes = (v.notes || "").toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchCat && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "NAME") return a.name.localeCompare(b.name);
        const statsA = getVendorStats(a.id);
        const statsB = getVendorStats(b.id);
        if (sortBy === "BALANCE_DESC") return statsB.outstandingBalance - statsA.outstandingBalance;
        if (sortBy === "BILLED_DESC") return statsB.totalPurchased - statsA.totalPurchased;
        return 0;
      });
  }, [vendors, searchTerm, categoryFilter, balanceFilter, sortBy, getVendorStats]);

  // Paginated Roster
  const paginatedVendors = useMemo(() => {
    const start = (rosterPage - 1) * rosterPageSize;
    return filteredVendors.slice(start, start + rosterPageSize);
  }, [filteredVendors, rosterPage, rosterPageSize]);

  // Selected Vendor Detail
  const currentVendor = vendors.find((v) => v.id === selectedVendorId);
  const vendorStats = currentVendor ? getVendorStats(currentVendor.id) : null;

  // Purchases & Payments for selected vendor
  const currentPurchases = currentVendor
    ? vendorPurchases.filter((p) => p.vendorId === currentVendor.id)
    : [];
  const currentPayments = currentVendor
    ? vendorPayments.filter((p) => p.vendorId === currentVendor.id)
    : [];

  // Date Filtering on selected vendor statement
  const [datePreset, setDatePreset] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize, setPaymentPageSize] = useState(10);

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
    setPaymentPage(1);
  };

  const filteredPurchases = useMemo(() => {
    return currentPurchases.filter((p) => {
      if (startDate && new Date(p.purchaseDate) < new Date(startDate)) return false;
      if (endDate && new Date(p.purchaseDate) > new Date(endDate + "T23:59:59")) return false;
      return true;
    });
  }, [currentPurchases, startDate, endDate]);

  const filteredPayments = useMemo(() => {
    return currentPayments.filter((p) => {
      if (startDate && new Date(p.paymentDate) < new Date(startDate)) return false;
      if (endDate && new Date(p.paymentDate) > new Date(endDate + "T23:59:59")) return false;
      return true;
    });
  }, [currentPayments, startDate, endDate]);

  const paginatedPayments = useMemo(() => {
    const start = (paymentPage - 1) * paymentPageSize;
    return filteredPayments.slice(start, start + paymentPageSize);
  }, [filteredPayments, paymentPage, paymentPageSize]);

  const handlePrintStatement = () => {
    const originalTitle = document.title;
    document.title = "";
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Site-wise breakdown for selected vendor
  const siteBreakdown = useMemo(() => {
    const list = sites
      .map((site) => {
        const sitePurchases = filteredPurchases.filter((p) => p.siteId === site.id);
        const siteTotal = sitePurchases.reduce((sum, p) => sum + Number(p.amount), 0);
        return {
          site,
          purchases: sitePurchases,
          total: siteTotal,
        };
      })
      .filter((b) => b.purchases.length > 0);

    if (!siteBreakdownSearch.trim()) return list;
    const q = siteBreakdownSearch.toLowerCase();
    return list.filter(
      (b) =>
        b.site.name.toLowerCase().includes(q) ||
        (b.site.clientName && b.site.clientName.toLowerCase().includes(q)) ||
        (b.site.location && b.site.location.toLowerCase().includes(q))
    );
  }, [sites, filteredPurchases, siteBreakdownSearch]);

  return (
    <div className="space-y-6">
      {/* ── Top Vendors Roster & Material Controls (Hidden when printing statement) ── */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20">
                <Truck className="h-5 w-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Vendors &amp; Material Credit Ledger
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track material bills with voucher numbers, credit terms, partial disbursements, and site-wise supply details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setIsAddVendorOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-1.5" />
              New Vendor
            </Button>
            <Button
              onClick={() => {
                setActionTargetVendorId(undefined);
                setOpenPurchase(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              <Receipt className="h-4 w-4 mr-1.5" />
              Record Material Bill
            </Button>
            <Button
              onClick={() => {
                setActionTargetVendorId(undefined);
                setOpenVendorPay(true);
              }}
              variant="success"
              className="font-bold"
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              Pay Vendor Bill
            </Button>
          </div>
        </div>

        {/* Top Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 border-l-4 border-l-slate-700 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
              <span>Total Vendors</span>
              <Truck className="h-4 w-4 text-slate-700" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {overallStats.totalVendors.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {overallStats.pendingCount} suppliers currently owed credit
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 border-l-4 border-l-rose-500 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
              <span>Pending Credit Balance</span>
              <AlertCircle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600 font-mono">
              {formatCurrency(overallStats.totalPending)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Unsettled vendor material bills</p>
          </div>

          <div className="rounded-xl border border-slate-200 border-l-4 border-l-blue-500 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
              <span>Total Material Billed</span>
              <Receipt className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(overallStats.totalBilled)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Cumulative material vouchers logged</p>
          </div>

          <div className="rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-semibold">
              <span>Total Paid to Vendors</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {formatCurrency(overallStats.totalPaid)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Actual bank &amp; cash settlements</p>
          </div>
        </div>

        {/* ── Search & Filter Controls ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by vendor name, category, phone, notes..."
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
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setRosterPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 font-medium focus:outline-hidden"
              >
                <option value="ALL">All Material Types ({vendors.length})</option>
                {distinctCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={balanceFilter}
                onChange={(e) => {
                  setBalanceFilter(e.target.value as any);
                  setRosterPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 font-medium focus:outline-hidden"
              >
                <option value="ALL">All Balances</option>
                <option value="PENDING">Credit Owed (&gt; ₹0)</option>
                <option value="SETTLED">Fully Paid (₹0)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 font-medium focus:outline-hidden"
              >
                <option value="BALANCE_DESC">Highest Credit Owed</option>
                <option value="BILLED_DESC">Total Billed (High to Low)</option>
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
                  title="Table View"
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
              Found <strong>{filteredVendors.length}</strong> matching vendors out of{" "}
              <strong>{vendors.length}</strong> total
            </span>
            {selectedVendorId && (
              <button
                onClick={() => setSelectedVendorId("")}
                className="text-amber-700 hover:underline font-semibold"
              >
                ✕ Close Selected Vendor Details
              </button>
            )}
          </div>
        </div>

        {/* ── Empty State ────────────────────────────────────────────────────── */}
        {vendors.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300 p-12 text-center bg-white shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Vendors Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Click &quot;+ New Vendor&quot; to register material suppliers (Cement, Steel, Bricks, Electrical, etc.).
            </p>
            <Button onClick={() => setIsAddVendorOpen(true)} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-1.5" />
              Register First Vendor
            </Button>
          </Card>
        ) : paginatedVendors.length === 0 ? (
          <Card className="p-8 text-center bg-white border-slate-200">
            <p className="text-xs text-slate-400 italic">
              No vendors match &quot;{searchTerm}&quot; with selected filters.
            </p>
          </Card>
        ) : viewMode === "TABLE" ? (
          /* ── TABLE VIEW ──────────────────────────────────────────────────── */
          <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-mono border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Vendor Name</th>
                      <th className="py-3 px-4 font-semibold">Material Category</th>
                      <th className="py-3 px-4 font-semibold">Phone Number</th>
                      <th className="py-3 px-4 text-right font-semibold">Total Billed</th>
                      <th className="py-3 px-4 text-right font-semibold">Total Paid</th>
                      <th className="py-3 px-4 text-right font-semibold">Credit Balance Owed</th>
                      <th className="py-3 px-4 text-right font-semibold">Direct Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedVendors.map((vendor) => {
                      const stats = getVendorStats(vendor.id);
                      const isSelected = vendor.id === selectedVendorId;

                      return (
                        <tr
                          key={vendor.id}
                          onClick={() => setSelectedVendorId(vendor.id)}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-amber-50/70 font-semibold" : "hover:bg-amber-50/30"
                            }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                            {vendor.name}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                              {vendor.tradeCategory || "Materials"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-slate-500">
                            {vendor.phone}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-slate-700">
                            {formatCurrency(stats.totalPurchased)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-emerald-600 font-semibold">
                            {formatCurrency(stats.totalPaid)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${stats.outstandingBalance > 0
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                            >
                              {formatCurrency(stats.outstandingBalance)}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2 border-slate-200 text-slate-700 hover:bg-slate-100"
                                onClick={() => setSelectedVendorId(vendor.id)}
                              >
                                <Eye className="h-3 w-3 mr-1 text-slate-500" />
                                Ledger
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-[11px] px-2 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                onClick={() => {
                                  setActionTargetVendorId(vendor.id);
                                  setOpenPurchase(true);
                                }}
                              >
                                + Bill
                              </Button>
                              <Button
                                size="sm"
                                variant="success"
                                className="h-7 text-[11px] px-2 font-bold"
                                onClick={() => {
                                  setActionTargetVendorId(vendor.id);
                                  setOpenVendorPay(true);
                                }}
                              >
                                Pay
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2 text-slate-700 hover:text-amber-700 hover:border-amber-300"
                                onClick={() => openEditModal(vendor)}
                                title="Edit Vendor Details"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                                onClick={() => openDeleteModal(vendor)}
                                title="Delete Vendor"
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
                totalItems={filteredVendors.length}
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
              {paginatedVendors.map((vendor) => {
                const stats = getVendorStats(vendor.id);
                const isSelected = vendor.id === selectedVendorId;

                return (
                  <div
                    key={vendor.id}
                    onClick={() => setSelectedVendorId(vendor.id)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${isSelected
                      ? "border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{vendor.name}</h3>
                        <Badge variant="outline" className="mt-1 text-[10px] bg-slate-50">
                          {vendor.tradeCategory || "Supplier"}
                        </Badge>
                        <p className="text-[11px] font-mono text-slate-400 mt-1">{vendor.phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openEditModal(vendor)}
                            className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-100/60 transition-colors"
                            title="Edit Vendor Details"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(vendor)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 transition-colors"
                            title="Delete Vendor"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Balance Owed</span>
                          <span
                            className={`text-base font-black ${stats.outstandingBalance > 0 ? "text-rose-600" : "text-emerald-600"
                              }`}
                          >
                            {formatCurrency(stats.outstandingBalance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Billed: {formatCurrency(stats.totalPurchased)}</span>
                      <span>Paid: {formatCurrency(stats.totalPaid)}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-[11px]"
                        onClick={() => setSelectedVendorId(vendor.id)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold"
                        onClick={() => {
                          setActionTargetVendorId(vendor.id);
                          setOpenPurchase(true);
                        }}
                      >
                        + Bill
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        className="flex-1 h-7 text-[11px] font-bold"
                        onClick={() => {
                          setActionTargetVendorId(vendor.id);
                          setOpenVendorPay(true);
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
              totalItems={filteredVendors.length}
              pageSize={rosterPageSize}
              onPageChange={setRosterPage}
              onPageSizeChange={setRosterPageSize}
            />
          </div>
        )}
      </div>

      {/* ── Selected Vendor Deep Dive ────────────────────────────────────────── */}
      {currentVendor && vendorStats && (
        <div className="space-y-6 pt-4 border-t border-slate-200 print:border-none print:pt-0">
          <Card className="border-slate-200 bg-white shadow-md overflow-hidden print:border-none print:shadow-none">
            {/* ── Official Printable Vendor Statement Header (Print Only) ───── */}
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

              {/* Standard Vendor Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3 mt-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Vendor Name:</span>
                  <span className="font-bold text-slate-950 text-sm">{currentVendor.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Supply Category:</span>
                  <span className="font-bold text-slate-950 text-sm">{currentVendor.tradeCategory}</span>
                </div>
                {currentVendor.phone && (
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Contact Phone:</span>
                    <span className="font-semibold text-slate-800 text-sm">{currentVendor.phone}</span>
                  </div>
                )}
              </div>

              {/* Top Summary Cards */}
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200 text-center font-mono">
                <div className="bg-white rounded p-2 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Billed</span>
                  <span className="font-bold text-slate-900 text-sm">{formatCurrency(vendorStats.totalPurchased)}</span>
                </div>
                <div className="bg-white rounded p-2 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Paid</span>
                  <span className="font-bold text-emerald-700 text-sm">{formatCurrency(vendorStats.totalPaid)}</span>
                </div>
                <div className="bg-white rounded p-2 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Balance Owed</span>
                  <span className={`font-bold text-sm ${vendorStats.outstandingBalance > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                    {formatCurrency(vendorStats.outstandingBalance)}
                  </span>
                </div>
              </div>
            </div>

            <CardHeader className="border-b border-slate-200 bg-slate-50/60 pb-4 print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold">
                      <Truck className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        {currentVendor.name} • Account Statement
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 font-mono">
                        Category: {currentVendor.tradeCategory} • Contact: {currentVendor.phone}
                      </CardDescription>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-slate-700 hover:text-amber-700 hover:border-amber-300"
                    onClick={() => openEditModal(currentVendor)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit Vendor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                    onClick={() => openDeleteModal(currentVendor)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete Vendor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintStatement}
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Print Statement
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                    onClick={() => {
                      setActionTargetVendorId(currentVendor.id);
                      setOpenPurchase(true);
                    }}
                  >
                    + Add Material Bill
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    className="font-bold"
                    onClick={() => {
                      setActionTargetVendorId(currentVendor.id);
                      setOpenVendorPay(true);
                    }}
                  >
                    Pay Vendor
                  </Button>
                </div>
              </div>

              {/* Stat Row */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200">
                <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Total Billed</span>
                  <span className="text-base font-bold text-slate-900 font-mono">{formatCurrency(vendorStats.totalPurchased)}</span>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Total Paid</span>
                  <span className="text-base font-bold text-emerald-600 font-mono">{formatCurrency(vendorStats.totalPaid)}</span>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Remaining Balance</span>
                  <span className={`text-base font-black font-mono ${vendorStats.outstandingBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {formatCurrency(vendorStats.outstandingBalance)}
                  </span>
                </div>
              </div>
            </CardHeader>

            {/* Site Breakdown Cards (On-Screen Interactive View) */}
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="print:hidden space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                      Site-Wise Material Supply Breakdown
                    </h3>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {siteBreakdown.length} {siteBreakdown.length === 1 ? "Site" : "Sites"}
                    </span>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search site or client..."
                      value={siteBreakdownSearch}
                      onChange={(e) => setSiteBreakdownSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-white border-slate-200"
                    />
                  </div>
                </div>

                {siteBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    {siteBreakdownSearch.trim()
                      ? `No supply sites found matching "${siteBreakdownSearch}".`
                      : "No site-allocated material purchases recorded yet."}
                  </p>
                ) : (
                  <div className="max-h-[380px] overflow-y-auto pr-1.5 scrollbar-thin">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {siteBreakdown.map(({ site, purchases, total }) => (
                        <div key={site.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{site.name}</span>
                            <span className="font-mono font-bold text-slate-900 text-xs">{formatCurrency(total)}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {purchases.length} bill(s) logged for client: <strong>{site.clientName}</strong>
                          </div>
                          <div className="space-y-1 pt-1 border-t border-slate-200 max-h-28 overflow-y-auto pr-1">
                            {purchases.map((p) => (
                              <div key={p.id} className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-slate-500">
                                  {formatDate(p.purchaseDate)} {p.voucherNo ? `(Voucher #${p.voucherNo})` : ""}
                                </span>
                                <span className="font-semibold text-slate-800">{formatCurrency(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Print Record Count Header Only */}
              <div className="hidden print:flex items-center justify-between py-1 font-mono text-xs font-bold text-slate-800">
                <span>Total Material Bills: {filteredPurchases.length}</span>
                {datePreset !== "ALL" && (startDate || endDate) && (
                  <span className="text-[11px] text-slate-600 font-normal">
                    Period: {startDate ? formatDate(startDate) : "Start"} to {endDate ? formatDate(endDate) : "Latest"}
                  </span>
                )}
              </div>

              {/* ── Print-Only Table (Full Unpaginated Material Statement with ALL Data) ── */}
              <div className="hidden print:block">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-[10px] uppercase font-mono text-slate-900 border-b-2 border-slate-400">
                    <tr>
                      <th className="py-2 px-3 font-bold">Date</th>
                      <th className="py-2 px-3 font-bold">Site Project</th>
                      <th className="py-2 px-3 font-bold">Client Name</th>
                      <th className="py-2 px-3 font-bold">Voucher / Ref #</th>
                      <th className="py-2 px-3 text-right font-bold">Bill Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                          No material purchases recorded for this vendor.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {filteredPurchases.map((p) => {
                          const site = sites.find((s) => s.id === p.siteId);
                          return (
                            <tr key={`print-${p.id}`} className="break-inside-avoid text-slate-900 border-b border-slate-200">
                              <td className="py-2 px-3 font-mono whitespace-nowrap text-xs">
                                {formatDate(p.purchaseDate)}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-900">
                                {site?.name || "General / Head Office"}
                              </td>
                              <td className="py-2 px-3 text-slate-700">
                                {site?.clientName || "—"}
                              </td>
                              <td className="py-2 px-3 font-mono font-semibold whitespace-nowrap text-slate-800">
                                {p.voucherNo ? `#${p.voucherNo}` : "—"}
                              </td>
                              <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-bold text-xs text-slate-900">
                                {formatCurrency(p.amount)}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Summary Totals: Last Page Only */}
                        <tr className="bg-slate-50 border-t-2 border-slate-400 font-mono text-xs break-inside-avoid">
                          <td colSpan={4} className="py-2 px-3 text-right font-semibold text-slate-700">
                            Total Material Billed:
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(vendorStats.totalPurchased)}
                          </td>
                        </tr>
                        <tr className="bg-slate-50 border-t border-slate-200 font-mono text-xs break-inside-avoid">
                          <td colSpan={4} className="py-2 px-3 text-right font-semibold text-slate-700">
                            Total Payments Disbursed:
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">
                            {formatCurrency(vendorStats.totalPaid)}
                          </td>
                        </tr>
                        <tr className="bg-slate-100 font-bold border-t border-slate-300 font-mono text-xs break-inside-avoid">
                          <td colSpan={4} className="py-2 px-3 text-right font-bold text-slate-900">
                            Remaining Balance Owed:
                          </td>
                          <td className={`py-2 px-3 text-right font-black ${vendorStats.outstandingBalance > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                            {formatCurrency(vendorStats.outstandingBalance)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: New Vendor */}
      <Modal
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        title="Register New Material Vendor"
        description="Add a new supplier for cement, steel, sand, bricks, plumbing, or electrical supplies."
      >
        <form onSubmit={handleCreateVendor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Business Name *</label>
            <Input
              placeholder="e.g. PMR Cement &amp; Infra Supplies"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Material Category *</label>
              <select
                value={tradeCategory}
                onChange={(e) => setTradeCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden"
              >
                <option value="Cement Supplier">Cement Supplier</option>
                <option value="Steel &amp; TMT Bars">Steel &amp; TMT Bars</option>
                <option value="Ready-Mix Concrete (RMC)">Ready-Mix Concrete (RMC)</option>
                <option value="Red Bricks &amp; AAC Blocks">Red Bricks &amp; AAC Blocks</option>
                <option value="Electrical Cables &amp; Switchgear">Electrical &amp; Wiring</option>
                <option value="Plumbing &amp; Sanitaryware">Plumbing &amp; Sanitaryware</option>
                <option value="Sand &amp; Aggregates">Sand &amp; Aggregates</option>
                <option value="Hardware &amp; Tools">Hardware &amp; Tools</option>
                <option value="Paint &amp; Putty">Paint &amp; Putty</option>
                <option value="Timber &amp; Plywood">Timber &amp; Plywood</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
              <Input
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Balance / Credit Owed (₹) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                placeholder="e.g. 15000 (Optional)"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Terms &amp; Notes</label>
              <Input
                placeholder="e.g. 15-day credit period"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddVendorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Save Vendor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal
        isOpen={!!editingVendor}
        onClose={() => setEditingVendor(null)}
        title={`Edit Vendor: ${editingVendor?.name || ""}`}
        description="Update vendor trade category, contact phone number, or credit terms."
      >
        <form onSubmit={handleUpdateVendor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Enterprise Name *</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Material Category *</label>
              <select
                value={editTradeCategory}
                onChange={(e) => setEditTradeCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden"
              >
                <option value="Cement Supplier">Cement Supplier</option>
                <option value="Steel &amp; TMT Bars">Steel &amp; TMT Bars</option>
                <option value="Ready-Mix Concrete (RMC)">Ready-Mix Concrete (RMC)</option>
                <option value="Red Bricks &amp; AAC Blocks">Red Bricks &amp; AAC Blocks</option>
                <option value="Electrical Cables &amp; Switchgear">Electrical &amp; Wiring</option>
                <option value="Plumbing &amp; Sanitaryware">Plumbing &amp; Sanitaryware</option>
                <option value="Sand &amp; Aggregates">Sand &amp; Aggregates</option>
                <option value="Hardware &amp; Tools">Hardware &amp; Tools</option>
                <option value="Paint &amp; Putty">Paint &amp; Putty</option>
                <option value="Timber &amp; Plywood">Timber &amp; Plywood</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Balance / Credit Owed (₹) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                placeholder="e.g. 15000"
                value={editOpeningBalance}
                onChange={(e) => setEditOpeningBalance(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Terms &amp; Notes</label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setEditingVendor(null)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Vendor Modal with Relational Integrity Warning */}
      {deletingVendor && (() => {
        const dep = getVendorDependencies(deletingVendor.id);
        const hasDependencies = dep.total > 0;

        return (
          <Modal
            isOpen={!!deletingVendor}
            onClose={() => setDeletingVendor(null)}
            title={hasDependencies ? "⚠️ High-Risk Action: Relational Data Loss Warning" : "Delete Vendor"}
            description={hasDependencies ? "This vendor is linked to material purchase bills and settlement vouchers." : "Confirm permanent removal of this vendor."}
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
                          The vendor <strong>&quot;{deletingVendor.name}&quot;</strong> has <strong>{dep.total}</strong> financial records linked in your accounting ledger:
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pl-12 grid grid-cols-2 gap-2 text-xs font-mono text-rose-800">
                      <div className="bg-white/80 p-2.5 rounded border border-rose-200">
                        📦 Material Purchase Bills: <strong>{dep.purchasesCount}</strong>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded border border-rose-200">
                        💳 Payment Disbursements: <strong>{dep.paymentsCount}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                    <p className="font-semibold">Recommended Safe Option:</p>
                    <p className="text-[11px] mt-0.5 text-amber-800">
                      Do not delete if you need historical tax and expense records for this supplier. Settle any outstanding balance instead.
                    </p>
                  </div>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-rose-300 bg-rose-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmVendorCascade}
                      onChange={(e) => setConfirmVendorCascade(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-medium text-rose-950">
                      I understand that deleting this vendor will cascade-delete all {dep.total} material purchase bills and payment vouchers permanently.
                    </span>
                  </label>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs text-slate-600">
                    Are you sure you want to delete <strong>&quot;{deletingVendor.name}&quot;</strong>? This vendor has no linked purchases or payment vouchers, and can be removed safely.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeletingVendor(null)}
                  className="h-9 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 shrink-0"
                >
                  {hasDependencies ? "No, Keep Data (Cancel)" : "Cancel"}
                </Button>
                {hasDependencies ? (
                  <Button
                    type="button"
                    disabled={!confirmVendorCascade}
                    onClick={() => handleExecuteDeleteVendor(true)}
                    className="h-9 px-4 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Force Delete &amp; Wipe Data
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleExecuteDeleteVendor(false)}
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
        isOpenPurchase={openPurchase}
        onClosePurchase={() => setOpenPurchase(false)}
        isOpenVendorPay={openVendorPay}
        onCloseVendorPay={() => setOpenVendorPay(false)}
        preselectedVendorId={actionTargetVendorId || selectedVendorId}
      />
    </div>
  );
}
