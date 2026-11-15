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
import { Site, SiteStatus } from "@/lib/types";
import { useConstruction } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { ActionModals } from "@/components/modals/ActionModals";
import { Pagination } from "@/components/ui/pagination";

export default function SitesPage() {
  const {
    companyName,
    role,
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
  const [rosterPageSize, setRosterPageSize] = useState(9);

  // New site form state
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");

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

  // Pagination states for statements
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [purchasesPageSize, setPurchasesPageSize] = useState(5);
  const [workLogsPage, setWorkLogsPage] = useState(1);
  const [workLogsPageSize, setWorkLogsPageSize] = useState(5);

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

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim()) return;

    addSite({
      name: name.trim(),
      clientName: clientName.trim(),
      location: location.trim() || "City Center",
      status: "ACTIVE",
      estimatedBudget: parseFloat(estimatedBudget) || 0,
    });

    setName("");
    setClientName("");
    setLocation("");
    setEstimatedBudget("");
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
    const start = (rosterPage - 1) * rosterPageSize;
    return filteredSites.slice(start, start + rosterPageSize);
  }, [filteredSites, rosterPage, rosterPageSize]);

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

  const paginatedPurchases = useMemo(() => {
    const start = (purchasesPage - 1) * purchasesPageSize;
    return allSitePurchases.slice(start, start + purchasesPageSize);
  }, [allSitePurchases, purchasesPage, purchasesPageSize]);

  const paginatedWorkLogs = useMemo(() => {
    const start = (workLogsPage - 1) * workLogsPageSize;
    return allSiteWorkLogs.slice(start, start + workLogsPageSize);
  }, [allSiteWorkLogs, workLogsPage, workLogsPageSize]);

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
              + Create First Site
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
                    Project Financial Cost Statement &amp; Billing Ledger
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    BytBuild Construction ERP • Multi-Site Project Accounting
                  </p>
                </div>
              </div>
              <div className="text-right text-xs font-mono">
                <div className="inline-block bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded font-bold uppercase">
                  SITE STATEMENT
                </div>
                <p className="text-slate-600 mt-1">Date: {generatedDate || "Official Record"}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded p-2.5 mt-3 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">Project Name:</span>
                <span className="font-bold text-slate-900">{currentSite.name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Client Name:</span>
                <span className="font-semibold text-slate-800">{currentSite.clientName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Location:</span>
                <span className="font-semibold text-slate-800">{currentSite.location}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Status:</span>
                <span className="font-semibold text-slate-800 uppercase">{currentSite.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-200 text-center font-mono">
              <div className="bg-white rounded p-2 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Estimated Budget</span>
                <span className="font-bold text-slate-900 text-sm">{formatCurrency(currentSite.estimatedBudget)}</span>
              </div>
              <div className="bg-white rounded p-2 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Client Inflows</span>
                <span className="font-bold text-emerald-600 text-sm">{formatCurrency(currentStats.totalIncome)}</span>
              </div>
              <div className="bg-white rounded p-2 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Total Expenses</span>
                <span className="font-bold text-rose-600 text-sm">{formatCurrency(currentStats.totalExpense)}</span>
              </div>
              <div className="bg-white rounded p-2 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block">Net Margin</span>
                <span className={`font-black text-sm ${currentStats.netMargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatCurrency(currentStats.netMargin)}
                </span>
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
                <Button variant="outline" size="sm" onClick={() => window.print()}>
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

          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Material Purchases Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  1. Material Purchases &amp; Vendor Bills ({allSitePurchases.length})
                </h3>
                <span className="text-xs font-mono font-bold text-slate-900">
                  Subtotal: {formatCurrency(allSitePurchases.reduce((s, p) => s + Number(p.amount), 0))}
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-mono text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Voucher #</th>
                      <th className="py-2.5 px-3">Vendor</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                          No material bills recorded for this site.
                        </td>
                      </tr>
                    ) : (
                      paginatedPurchases.map((p) => {
                        const ven = vendors.find((v) => v.id === p.vendorId);
                        return (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-mono text-slate-500">{formatDate(p.purchaseDate)}</td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-800">
                              {p.voucherNo ? `#${p.voucherNo}` : "—"}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{ven?.name || "Vendor"}</td>
                            <td className="py-2 px-3 text-slate-500">{p.notes || "—"}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(p.amount)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="print:hidden">
                <Pagination
                  currentPage={purchasesPage}
                  totalItems={allSitePurchases.length}
                  pageSize={purchasesPageSize}
                  onPageChange={setPurchasesPage}
                  onPageSizeChange={setPurchasesPageSize}
                />
              </div>
            </div>

            {/* Worker Work Logs Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  2. Labor Attendance &amp; Wages ({allSiteWorkLogs.length})
                </h3>
                <span className="text-xs font-mono font-bold text-slate-900">
                  Subtotal: {formatCurrency(allSiteWorkLogs.reduce((s, w) => s + Number(w.wageAmount), 0))}
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-mono text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Worker Name</th>
                      <th className="py-2.5 px-3">Trade Skill</th>
                      <th className="py-2.5 px-3">Work Description</th>
                      <th className="py-2.5 px-3 text-right">Wage Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedWorkLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                          No worker attendance logged for this site.
                        </td>
                      </tr>
                    ) : (
                      paginatedWorkLogs.map((w) => {
                        const wk = workers.find((item) => item.id === w.workerId);
                        return (
                          <tr key={w.id}>
                            <td className="py-2 px-3 font-mono text-slate-500">{formatDate(w.workDate)}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{wk?.name || "Worker"}</td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-[10px]">{wk?.trade || "Laborer"}</Badge>
                            </td>
                            <td className="py-2 px-3 text-slate-500">{w.notes || "—"}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(w.wageAmount)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="print:hidden">
                <Pagination
                  currentPage={workLogsPage}
                  totalItems={allSiteWorkLogs.length}
                  pageSize={workLogsPageSize}
                  onPageChange={setWorkLogsPage}
                  onPageSizeChange={setWorkLogsPageSize}
                />
              </div>
            </div>

            {/* Print Sign-off Blocks */}
            <div className="hidden print:grid pt-12 grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto font-bold text-slate-800">
                  Site Engineer / Project Manager
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Field Supervision</p>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1.5 w-44 mx-auto font-bold text-slate-800">
                  Authorized Signatory
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">For {companyName}</p>
              </div>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Project Budget (₹)</label>
            <Input
              type="number"
              placeholder="e.g. 5000000"
              value={estimatedBudget}
              onChange={(e) => setEstimatedBudget(e.target.value)}
            />
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
