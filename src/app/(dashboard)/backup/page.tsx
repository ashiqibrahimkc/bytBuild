"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  FileJson,
  RefreshCw,
  History,
  Building2,
  Truck,
  Users,
  Receipt,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Database,
  FileText,
  Layers,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── CSV Conversion & Download Helpers ───────────────────────────────────────
function sanitizeCSVField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function generateCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T | string; label: string; accessor?: (row: T) => unknown }[]
): string {
  const headerLine = columns.map((c) => sanitizeCSVField(c.label)).join(",");
  const dataLines = rows.map((row) =>
    columns
      .map((c) => {
        const value = c.accessor ? c.accessor(row) : (row as Record<string, unknown>)[c.key as string];
        return sanitizeCSVField(value);
      })
      .join(",")
  );
  return [headerLine, ...dataLines].join("\r\n");
}

function triggerDownload(content: string, filename: string, mimeType = "text/csv;charset=utf-8;") {
  const blob = new Blob(["\uFEFF" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function BackupPage() {
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
    salarySlips,
    auditLogs,
    exportFullBackupPayload,
    restoreFullBackupPayload,
    canAccessPage,
  } = useConstruction();

  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restorePreview, setRestorePreview] = useState<any>(null);
  const [restoreStatus, setRestoreStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    try {
      const savedTime = localStorage.getItem("bytbuild_last_backup_time");
      if (savedTime) setLastBackupTime(savedTime);
    } catch {}
  }, []);

  const hasAccess =
    role.toUpperCase() === "OWNER" ||
    role.toUpperCase() === "ADMIN" ||
    canAccessPage("backup");

  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const stampBackupTime = (note = "Exported") => {
    const timeStr = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastBackupTime(timeStr);
    try {
      localStorage.setItem("bytbuild_last_backup_time", timeStr);
    } catch {}
    setDownloadSuccessMessage(`Successfully generated ${note} at ${timeStr}`);
    setTimeout(() => setDownloadSuccessMessage(null), 5000);
  };

  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <div className="rounded-2xl bg-rose-50 p-4 text-rose-600 border border-rose-200 mb-4 shadow-xs">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted by RBAC</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Only the <strong>Company Owner</strong> has security authorization to export, download, or restore complete ERP database backups.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
          <span>Current active role:</span>
          <Badge variant="secondary">{role}</Badge>
        </div>
      </div>
    );
  }

  // ─── CSV Generators ────────────────────────────────────────────────────────
  // 1. Sites CSV
  const handleExportSitesCSV = () => {
    const csv = generateCSV(sites as any[], [
      { key: "id", label: "Site ID" },
      { key: "name", label: "Site Name" },
      { key: "clientName", label: "Client Name" },
      { key: "location", label: "Location" },
      { key: "status", label: "Project Status" },
      { key: "estimatedBudget", label: "Estimated Budget (INR)" },
      { key: "openingBalance", label: "Opening Balance (INR)" },
      { key: "createdAt", label: "Creation Date" },
    ]);
    triggerDownload(csv, `sites_${getTodayStr()}.csv`);
    stampBackupTime("Sites CSV");
  };

  // 2. Vendors CSV
  const handleExportVendorsCSV = () => {
    const csv = generateCSV(vendors as any[], [
      { key: "id", label: "Vendor ID" },
      { key: "name", label: "Vendor Name" },
      { key: "phone", label: "Phone" },
      { key: "tradeCategory", label: "Trade Category" },
      { key: "openingBalance", label: "Opening Balance (INR)" },
      { key: "notes", label: "Notes" },
      { key: "createdAt", label: "Created Date" },
    ]);
    triggerDownload(csv, `vendors_${getTodayStr()}.csv`);
    stampBackupTime("Vendors CSV");
  };

  // 3. Workers CSV
  const handleExportWorkersCSV = () => {
    const csv = generateCSV(workers as any[], [
      { key: "id", label: "Worker ID" },
      { key: "name", label: "Worker Name" },
      { key: "phone", label: "Phone" },
      { key: "trade", label: "Trade / Role" },
      { key: "compensationType", label: "Compensation Type" },
      { key: "defaultDailyWage", label: "Default Daily Wage (INR)" },
      { key: "monthlySalary", label: "Monthly Salary (INR)" },
      { key: "openingBalance", label: "Opening Balance (INR)" },
      { key: "isActive", label: "Active Status", accessor: (w: any) => (w.isActive ? "Active" : "Inactive") },
      { key: "createdAt", label: "Created Date" },
    ]);
    triggerDownload(csv, `workers_${getTodayStr()}.csv`);
    stampBackupTime("Workers CSV");
  };

  // 4. Material Purchases CSV
  const handleExportPurchasesCSV = () => {
    const csv = generateCSV(vendorPurchases as any[], [
      { key: "id", label: "Purchase ID" },
      { key: "purchaseDate", label: "Purchase Date" },
      {
        key: "vendorId",
        label: "Vendor Name",
        accessor: (p: any) => vendors.find((v) => v.id === p.vendorId)?.name || p.vendorId,
      },
      {
        key: "siteId",
        label: "Site Name",
        accessor: (p: any) => sites.find((s) => s.id === p.siteId)?.name || p.siteId,
      },
      { key: "voucherNo", label: "Voucher / Bill No" },
      { key: "amount", label: "Bill Amount (INR)" },
      { key: "notes", label: "Notes" },
    ]);
    triggerDownload(csv, `material_bills_${getTodayStr()}.csv`);
    stampBackupTime("Material Purchases CSV");
  };

  // 5. Daily Worker Wages CSV
  const handleExportWorkLogsCSV = () => {
    const csv = generateCSV(workerWorkLogs as any[], [
      { key: "id", label: "Log ID" },
      { key: "workDate", label: "Work Date" },
      {
        key: "workerId",
        label: "Worker Name",
        accessor: (l: any) => workers.find((w) => w.id === l.workerId)?.name || l.workerId,
      },
      {
        key: "workerTrade",
        label: "Trade",
        accessor: (l: any) => workers.find((w) => w.id === l.workerId)?.trade || "-",
      },
      {
        key: "siteId",
        label: "Site Name",
        accessor: (l: any) => sites.find((s) => s.id === l.siteId)?.name || l.siteId,
      },
      { key: "wageAmount", label: "Wage Earned (INR)" },
      { key: "notes", label: "Notes" },
    ]);
    triggerDownload(csv, `daily_worker_wages_${getTodayStr()}.csv`);
    stampBackupTime("Daily Wages CSV");
  };

  // 6. Company Expenses CSV
  const handleExportExpensesCSV = () => {
    const csv = generateCSV(companyExpenses as any[], [
      { key: "id", label: "Expense ID" },
      { key: "expenseDate", label: "Date" },
      { key: "category", label: "Expense Category" },
      {
        key: "siteId",
        label: "Associated Site",
        accessor: (e: any) => (e.siteId ? sites.find((s) => s.id === e.siteId)?.name || e.siteId : "General Overhead"),
      },
      {
        key: "workerId",
        label: "Beneficiary Worker",
        accessor: (e: any) => (e.workerId ? workers.find((w) => w.id === e.workerId)?.name || e.workerId : "-"),
      },
      { key: "amount", label: "Amount (INR)" },
      { key: "paymentMode", label: "Payment Mode" },
      { key: "voucherNo", label: "Voucher No" },
      { key: "notes", label: "Notes" },
    ]);
    triggerDownload(csv, `company_expenses_${getTodayStr()}.csv`);
    stampBackupTime("Expenses CSV");
  };

  // 7. Site Client Inflows CSV
  const handleExportInflowsCSV = () => {
    const csv = generateCSV(siteIncomes as any[], [
      { key: "id", label: "Inflow ID" },
      { key: "incomeDate", label: "Date" },
      {
        key: "siteId",
        label: "Site Name",
        accessor: (i: any) => sites.find((s) => s.id === i.siteId)?.name || i.siteId,
      },
      { key: "receivedFrom", label: "Received From / Client" },
      { key: "amount", label: "Inflow Amount (INR)" },
      { key: "paymentMode", label: "Payment Mode" },
      { key: "referenceNo", label: "Ref / Cheque No" },
      { key: "notes", label: "Notes" },
    ]);
    triggerDownload(csv, `client_inflows_${getTodayStr()}.csv`);
    stampBackupTime("Client Inflows CSV");
  };

  // 8. Salary Slips CSV
  const handleExportSalarySlipsCSV = () => {
    const csv = generateCSV(salarySlips as any[], [
      { key: "slipNumber", label: "Slip Number" },
      { key: "monthLabel", label: "Pay Period" },
      { key: "workerName", label: "Worker Name" },
      { key: "workerTrade", label: "Trade / Role" },
      { key: "baseSalary", label: "Base Salary (INR)" },
      { key: "advanceDeductions", label: "Advance Deducted (INR)" },
      { key: "otherDeductions", label: "Other Deductions (INR)" },
      { key: "netPayableAmount", label: "Net Paid Amount (INR)" },
      { key: "paymentDate", label: "Disbursement Date" },
      { key: "paymentMode", label: "Payment Mode" },
      { key: "voucherNo", label: "Voucher / Ref No" },
      { key: "notes", label: "Notes" },
    ]);
    triggerDownload(csv, `salary_slips_${getTodayStr()}.csv`);
    stampBackupTime("Salary Slips CSV");
  };

  // 9. Vendor Payments CSV
  const handleExportVendorPaymentsCSV = () => {
    const csv = generateCSV(vendorPayments as any[], [
      { key: "id", label: "Payment ID" },
      { key: "paymentDate", label: "Payment Date" },
      {
        key: "vendorId",
        label: "Vendor Name",
        accessor: (p: any) => vendors.find((v) => v.id === p.vendorId)?.name || p.vendorId,
      },
      {
        key: "siteId",
        label: "Site",
        accessor: (p: any) => (p.siteId ? sites.find((s) => s.id === p.siteId)?.name || p.siteId : "-"),
      },
      { key: "amount", label: "Amount Paid (INR)" },
      { key: "paymentMode", label: "Payment Mode" },
      { key: "voucherNo", label: "Voucher No" },
      { key: "notes", label: "Notes" },
    ]);
    triggerDownload(csv, `vendor_payments_${getTodayStr()}.csv`);
    stampBackupTime("Vendor Payments CSV");
  };

  // 10. Worker Payments CSV
  const handleExportWorkerPaymentsCSV = () => {
    const csv = generateCSV(workerPayments as any[], [
      { key: "id", label: "Payment ID" },
      { key: "paymentDate", label: "Payment Date" },
      {
        key: "workerId",
        label: "Worker Name",
        accessor: (p: any) => workers.find((w) => w.id === p.workerId)?.name || p.workerId,
      },
      { key: "amount", label: "Amount Paid (INR)" },
      { key: "paymentMode", label: "Payment Mode" },
      { key: "voucherNo", label: "Voucher No" },
      { key: "notes", label: "Notes" },
    ]);
    triggerDownload(csv, `worker_payments_${getTodayStr()}.csv`);
    stampBackupTime("Worker Payments CSV");
  };

  // ─── Master Consolidated Financial Ledger CSV ──────────────────────────────
  const handleExportMasterLedgerCSV = () => {
    const rows: Record<string, unknown>[] = [];

    // Client Inflows
    siteIncomes.forEach((i) => {
      const site = sites.find((s) => s.id === i.siteId);
      rows.push({
        date: i.incomeDate,
        type: "Client Inflow",
        siteName: site?.name || "General",
        party: i.receivedFrom || site?.clientName || "Client",
        category: "Client Milestone Advance",
        reference: i.referenceNo || "-",
        paymentMode: i.paymentMode,
        inflow: i.amount,
        outflow: 0,
        notes: i.notes || "",
      });
    });

    // Material Bills
    vendorPurchases.forEach((p) => {
      const vendor = vendors.find((v) => v.id === p.vendorId);
      const site = sites.find((s) => s.id === p.siteId);
      rows.push({
        date: p.purchaseDate,
        type: "Material Bill",
        siteName: site?.name || "-",
        party: vendor?.name || "Vendor",
        category: vendor?.tradeCategory || "Materials",
        reference: p.voucherNo || "-",
        paymentMode: "CREDIT_BILL",
        inflow: 0,
        outflow: p.amount,
        notes: p.notes || "",
      });
    });

    // Daily Worker Wages
    workerWorkLogs.forEach((w) => {
      const worker = workers.find((wk) => wk.id === w.workerId);
      const site = sites.find((s) => s.id === w.siteId);
      rows.push({
        date: w.workDate,
        type: "Daily Worker Wage",
        siteName: site?.name || "-",
        party: worker?.name || "Worker",
        category: worker?.trade || "Labor",
        reference: "-",
        paymentMode: "WAGE_LOG",
        inflow: 0,
        outflow: w.wageAmount,
        notes: w.notes || "",
      });
    });

    // Company Expenses
    companyExpenses.forEach((e) => {
      const site = e.siteId ? sites.find((s) => s.id === e.siteId) : null;
      const worker = e.workerId ? workers.find((w) => w.id === e.workerId) : null;
      rows.push({
        date: e.expenseDate,
        type: "Company Expense",
        siteName: site?.name || "Head Office / General",
        party: worker?.name || "Office / Vendor",
        category: e.category,
        reference: e.voucherNo || "-",
        paymentMode: e.paymentMode,
        inflow: 0,
        outflow: e.amount,
        notes: e.notes || "",
      });
    });

    // Vendor Payments
    vendorPayments.forEach((vp) => {
      const vendor = vendors.find((v) => v.id === vp.vendorId);
      const site = vp.siteId ? sites.find((s) => s.id === vp.siteId) : null;
      rows.push({
        date: vp.paymentDate,
        type: "Vendor Payment",
        siteName: site?.name || "-",
        party: vendor?.name || "Vendor",
        category: vendor?.tradeCategory || "Settlement",
        reference: vp.voucherNo || "-",
        paymentMode: vp.paymentMode,
        inflow: 0,
        outflow: vp.amount,
        notes: vp.notes || "",
      });
    });

    // Worker Wage Payments
    workerPayments.forEach((wp) => {
      const worker = workers.find((w) => w.id === wp.workerId);
      rows.push({
        date: wp.paymentDate,
        type: "Worker Wage Payment",
        siteName: "-",
        party: worker?.name || "Worker",
        category: worker?.trade || "Wages",
        reference: wp.voucherNo || "-",
        paymentMode: wp.paymentMode,
        inflow: 0,
        outflow: wp.amount,
        notes: wp.notes || "",
      });
    });

    // Sort chronologically (latest first)
    rows.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

    const csv = generateCSV(rows, [
      { key: "date", label: "Date" },
      { key: "type", label: "Transaction Type" },
      { key: "siteName", label: "Construction Site" },
      { key: "party", label: "Party / Worker / Vendor / Client" },
      { key: "category", label: "Category / Trade" },
      { key: "reference", label: "Voucher / Reference #" },
      { key: "paymentMode", label: "Payment Mode" },
      { key: "inflow", label: "Cash Inflow (INR)" },
      { key: "outflow", label: "Cash Outflow (INR)" },
      { key: "notes", label: "Notes & Descriptions" },
    ]);

    triggerDownload(csv, `master_financial_ledger_${getTodayStr()}.csv`);
    stampBackupTime("Master Financial Ledger CSV");
  };

  // Download All Individual CSVs in a bundle
  const handleExportAllCSVs = () => {
    handleExportMasterLedgerCSV();
    setTimeout(() => handleExportSitesCSV(), 300);
    setTimeout(() => handleExportVendorsCSV(), 600);
    setTimeout(() => handleExportWorkersCSV(), 900);
    setTimeout(() => handleExportPurchasesCSV(), 1200);
    setTimeout(() => handleExportWorkLogsCSV(), 1500);
    setTimeout(() => handleExportExpensesCSV(), 1800);
    setTimeout(() => handleExportInflowsCSV(), 2100);
    setTimeout(() => handleExportSalarySlipsCSV(), 2400);
    stampBackupTime("All 10 CSV Database Files");
  };

  // ─── JSON Backup & Restore ──────────────────────────────────────────────────
  const handleDownloadJSON = () => {
    const payload = exportFullBackupPayload();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement("a");
    const filename = `bytbuild_database_snapshot_${getTodayStr()}.json`;
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    stampBackupTime("Full JSON Snapshot");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.data) {
          setRestoreStatus({
            success: false,
            message: "Invalid file format. The file is not a valid BytBuild backup snapshot.",
          });
          setRestorePreview(null);
          return;
        }
        setRestorePreview(parsed);
        setRestoreStatus(null);
      } catch {
        setRestoreStatus({
          success: false,
          message: "Could not parse JSON. The file appears to be corrupted.",
        });
        setRestorePreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!restorePreview) return;
    const res = restoreFullBackupPayload(restorePreview);
    setRestoreStatus(res);
    setRestorePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalTransactions =
    vendorPurchases.length +
    workerWorkLogs.length +
    companyExpenses.length +
    siteIncomes.length +
    vendorPayments.length +
    workerPayments.length;

  return (
    <div className="space-y-5">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-600 text-white p-2 shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Database Backup &amp; CSV Data Export
                </h1>
                <Badge variant="warning" className="text-[10px] font-mono font-bold">
                  Owner Privilege
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Export all live database tables to Excel-compatible CSV files, download offline archives, and restore data.
              </p>
            </div>
          </div>
        </div>

        {lastBackupTime && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <History className="h-3.5 w-3.5 text-emerald-600" />
            <span>Last Export: {lastBackupTime}</span>
          </div>
        )}
      </div>

      {/* Success Notification Alert */}
      {downloadSuccessMessage && (
        <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* ── Summary KPI Tiles ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Sites Recorded</span>
          <span className="text-2xl font-black text-slate-900">{sites.length}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Active Workers</span>
          <span className="text-2xl font-black text-blue-600">{workers.length}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Registered Vendors</span>
          <span className="text-2xl font-black text-amber-600">{vendors.length}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Transactions</span>
          <span className="text-2xl font-black text-emerald-600">{totalTransactions}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left Column: CSV Exports & Offline Snapshot (7 cols) ────────── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Master CSV & All Tables Export */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Export Tables to CSV</h2>
                  <p className="text-xs text-slate-500">
                    High-precision tabular data ready for Microsoft Excel, Google Sheets, or tax audits.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                UTF-8 Excel CSV
              </span>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Button
                onClick={handleExportMasterLedgerCSV}
                className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-10 px-4 text-xs shadow-xs cursor-pointer flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Master Financial Ledger CSV
              </Button>
              <Button
                onClick={handleExportAllCSVs}
                variant="outline"
                className="w-full sm:w-auto border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold h-10 px-4 text-xs cursor-pointer"
              >
                <Layers className="h-4 w-4 mr-2" />
                Download All 10 CSVs
              </Button>
            </div>

            {/* Individual Table Export Grid */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 block mb-2.5">
                Individual Table CSV Exports:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleExportSitesCSV}
                  className="p-2.5 text-left rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 block">
                      Sites &amp; Projects
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {sites.length} rows
                    </span>
                  </div>
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleExportVendorsCSV}
                  className="p-2.5 text-left rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 block">
                      Material Vendors
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {vendors.length} rows
                    </span>
                  </div>
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleExportWorkersCSV}
                  className="p-2.5 text-left rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 block">
                      Workers Roster
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {workers.length} rows
                    </span>
                  </div>
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleExportPurchasesCSV}
                  className="p-2.5 text-left rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 block">
                      Material Bills
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {vendorPurchases.length} rows
                    </span>
                  </div>
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleExportWorkLogsCSV}
                  className="p-2.5 text-left rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 block">
                      Daily Wage Logs
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {workerWorkLogs.length} rows
                    </span>
                  </div>
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleExportExpensesCSV}
                  className="p-2.5 text-left rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 block">
                      Company Expenses
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {companyExpenses.length} rows
                    </span>
                  </div>
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleExportInflowsCSV}
                  className="p-2.5 text-left rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 block">
                      Client Inflows
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {siteIncomes.length} rows
                    </span>
                  </div>
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleExportSalarySlipsCSV}
                  className="p-2.5 text-left rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 block">
                      Salary Slips
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {salarySlips.length} rows
                    </span>
                  </div>
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={handleExportVendorPaymentsCSV}
                  className="p-2.5 text-left rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 block">
                      Vendor Payments
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {vendorPayments.length} rows
                    </span>
                  </div>
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Offline Relational Database Snapshot */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Offline Database Snapshot</h2>
                <p className="text-xs text-slate-500">
                  Save a full relational database backup file to your laptop, PC, or external drive.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <Button
                onClick={handleDownloadJSON}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-4 text-xs cursor-pointer shadow-xs"
              >
                <FileJson className="h-4 w-4 mr-2 text-amber-400" />
                Download JSON Snapshot
              </Button>
              <span className="text-xs text-slate-400">
                Contains complete relational IDs and structure for 1-click restore.
              </span>
            </div>
          </div>
        </div>

        {/* ── Right Column: Restore & Recovery (5 cols) ────────────────── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 3: 1-Click Restore */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Restore from Backup</h2>
                <p className="text-xs text-slate-500">
                  Upload any previously downloaded backup snapshot to restore database records.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100 cursor-pointer border border-dashed border-slate-300 rounded-xl p-3"
              />

              {restoreStatus && (
                <div
                  className={`rounded-xl p-3 text-xs border ${
                    restoreStatus.success
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                      : "bg-rose-50 text-rose-900 border-rose-200"
                  }`}
                >
                  <p className="font-bold">{restoreStatus.message}</p>
                </div>
              )}

              {/* Restore Confirmation Box */}
              {restorePreview && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                    <span className="font-bold text-amber-900">Verified Backup Archive:</span>
                    <Badge variant="warning" className="text-[10px] font-mono">
                      {restorePreview.exportedAt ? new Date(restorePreview.exportedAt).toLocaleDateString() : "Valid"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-900 font-mono">
                    <div>• Sites: <strong>{restorePreview.data?.sites?.length || 0}</strong></div>
                    <div>• Workers: <strong>{restorePreview.data?.workers?.length || 0}</strong></div>
                    <div>• Vendors: <strong>{restorePreview.data?.vendors?.length || 0}</strong></div>
                    <div>• Bills: <strong>{restorePreview.data?.vendorPurchases?.length || 0}</strong></div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      onClick={handleConfirmRestore}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs shadow-xs cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Restore All Records Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRestorePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="h-9 px-3 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Information & Privacy Note */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Direct Database Export Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              All CSV and backup files are generated directly from your live PostgreSQL database on demand. No email credentials or external mail servers are required. Your data is formatted cleanly with UTF-8 encoding for seamless opening in Excel and Google Sheets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
