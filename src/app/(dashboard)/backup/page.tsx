"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  History,
  Building2,
  Truck,
  Users,
  Receipt,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackupSkeleton } from "@/components/ui/page-skeletons";

// ─── CSV Sanitization & Generation Helpers ────────────────────────────────────
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

function triggerDownload(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// ─── Robust Browser CSV Parser ────────────────────────────────────────────────
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) return { headers: [], rows: [] };

  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === '"') {
      if (insideQuotes && clean[i + 1] === '"') {
        currentLine += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && clean[i + 1] === "\n") i++;
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseCells = (line: string): string[] => {
    const result: string[] = [];
    let cell = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === "," && !inQuote) {
        result.push(cell.trim());
        cell = "";
      } else {
        cell += c;
      }
    }
    result.push(cell.trim());
    return result;
  };

  const headers = parseCells(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCells(lines[i]);
    if (values.every((v) => v === "")) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

type ImportTargetTable =
  | "AUTO_DETECT"
  | "SITES"
  | "VENDORS"
  | "WORKERS"
  | "PURCHASES"
  | "WORK_LOGS"
  | "EXPENSES"
  | "INCOMES";

export default function BackupPage() {
  const {
    role,
    isDbLoading,
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
    addSite,
    addVendor,
    addWorker,
    recordMaterialPurchase,
    assignWorkerWorkLog,
    recordCompanyExpense,
    recordSiteIncome,
    canAccessPage,
  } = useConstruction();

  const [lastExportTime, setLastExportTime] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // CSV Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTarget, setSelectedTarget] = useState<ImportTargetTable>("AUTO_DETECT");
  const [detectedTarget, setDetectedTarget] = useState<ImportTargetTable | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    try {
      const savedTime = localStorage.getItem("bytbuild_last_csv_export");
      if (savedTime) setLastExportTime(savedTime);
    } catch {}
  }, []);

  if (isDbLoading) {
    return <BackupSkeleton />;
  }

  const hasAccess =
    role.toUpperCase() === "OWNER" ||
    role.toUpperCase() === "ADMIN" ||
    canAccessPage("backup");

  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const stampExport = (label: string) => {
    const timeStr = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastExportTime(timeStr);
    try {
      localStorage.setItem("bytbuild_last_csv_export", timeStr);
    } catch {}
    setExportNotice(`Exported ${label} (${timeStr})`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <div className="rounded-2xl bg-rose-50 p-4 text-rose-600 border border-rose-200 mb-4 shadow-xs">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted by RBAC</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Only authorized administrators have permission to download or upload database CSV files.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
          <span>Current active role:</span>
          <Badge variant="secondary">{role}</Badge>
        </div>
      </div>
    );
  }

  // ─── Download All Data (Master CSV) ────────────────────────────────────────
  const handleExportAllDataCSV = () => {
    const rows: Record<string, unknown>[] = [];

    // 1. Client Milestone Inflows
    siteIncomes.forEach((i) => {
      const site = sites.find((s) => s.id === i.siteId);
      rows.push({
        date: i.incomeDate,
        type: "Client Inflow",
        siteName: site?.name || "General",
        party: i.receivedFrom || site?.clientName || "Client",
        category: "Client Milestone Payment",
        reference: i.referenceNo || "-",
        paymentMode: i.paymentMode,
        inflow: i.amount,
        outflow: 0,
        notes: i.notes || "",
      });
    });

    // 2. Material Purchases
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

    // 3. Daily Worker Wages
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

    // 4. Company & Overhead Expenses
    companyExpenses.forEach((e) => {
      const site = e.siteId ? sites.find((s) => s.id === e.siteId) : null;
      rows.push({
        date: e.expenseDate,
        type: "Company Expense",
        siteName: site?.name || "Head Office",
        party: "Vendor / Office",
        category: e.category,
        reference: e.voucherNo || "-",
        paymentMode: e.paymentMode,
        inflow: 0,
        outflow: e.amount,
        notes: e.notes || "",
      });
    });

    // 5. Vendor Cash Payments
    vendorPayments.forEach((vp) => {
      const vendor = vendors.find((v) => v.id === vp.vendorId);
      rows.push({
        date: vp.paymentDate,
        type: "Vendor Payment",
        siteName: "-",
        party: vendor?.name || "Vendor",
        category: vendor?.tradeCategory || "Settlement",
        reference: vp.voucherNo || "-",
        paymentMode: vp.paymentMode,
        inflow: 0,
        outflow: vp.amount,
        notes: vp.notes || "",
      });
    });

    // 6. Worker Wage Payments
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

    // 7. Monthly Salary Slips
    salarySlips.forEach((s) => {
      rows.push({
        date: s.paymentDate,
        type: "Salary Slip",
        siteName: "-",
        party: s.workerName,
        category: s.workerTrade,
        reference: s.slipNumber,
        paymentMode: s.paymentMode,
        inflow: 0,
        outflow: s.netPayableAmount,
        notes: `Month: ${s.monthLabel} | Base: ${s.baseSalary} | Advance: ${s.advanceDeductions} | ${s.notes || ""}`,
      });
    });

    // Sort chronologically (latest first)
    rows.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

    const csv = generateCSV(rows, [
      { key: "date", label: "Date" },
      { key: "type", label: "Transaction Type" },
      { key: "siteName", label: "Site Name" },
      { key: "party", label: "Party / Worker / Vendor / Client" },
      { key: "category", label: "Category / Trade" },
      { key: "reference", label: "Voucher / Reference #" },
      { key: "paymentMode", label: "Payment Mode" },
      { key: "inflow", label: "Inflow Amount (INR)" },
      { key: "outflow", label: "Outflow Amount (INR)" },
      { key: "notes", label: "Notes & Descriptions" },
    ]);

    triggerDownload(csv, `all_data_export_${getTodayStr()}.csv`);
    stampExport("All Data (Master CSV)");
  };

  // ─── CSV Upload / Import Handler ───────────────────────────────────────────
  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadStatus({
        success: false,
        message: "Please select a valid .csv file.",
      });
      return;
    }

    setCsvFileName(file.name);
    setUploadStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || "");
        const { headers, rows } = parseCSV(text);

        if (headers.length === 0 || rows.length === 0) {
          setUploadStatus({
            success: false,
            message: "The uploaded CSV file is empty or missing headers.",
          });
          setParsedHeaders([]);
          setParsedRows([]);
          setDetectedTarget(null);
          return;
        }

        setParsedHeaders(headers);
        setParsedRows(rows);

        // Auto-detect target table by inspecting headers
        const headerLower = headers.map((h) => h.toLowerCase()).join(" ");
        let detected: ImportTargetTable = "SITES";

        if (headerLower.includes("vendor") && (headerLower.includes("trade") || headerLower.includes("phone"))) {
          detected = "VENDORS";
        } else if (headerLower.includes("worker") && (headerLower.includes("trade") || headerLower.includes("daily wage") || headerLower.includes("salary"))) {
          detected = "WORKERS";
        } else if (headerLower.includes("bill") || (headerLower.includes("purchase") && headerLower.includes("vendor"))) {
          detected = "PURCHASES";
        } else if (headerLower.includes("wage") && headerLower.includes("work date")) {
          detected = "WORK_LOGS";
        } else if (headerLower.includes("expense") || headerLower.includes("category")) {
          detected = "EXPENSES";
        } else if (headerLower.includes("inflow") || headerLower.includes("received from")) {
          detected = "INCOMES";
        } else if (headerLower.includes("site") || headerLower.includes("budget")) {
          detected = "SITES";
        }

        setDetectedTarget(detected);
      } catch (err: any) {
        setUploadStatus({
          success: false,
          message: err?.message || "Could not read CSV file.",
        });
      }
    };
    reader.readAsText(file);
  };

  const getEffectiveTarget = (): ImportTargetTable => {
    if (selectedTarget === "AUTO_DETECT") {
      return detectedTarget || "SITES";
    }
    return selectedTarget;
  };

  const handleConfirmCSVUpload = async () => {
    if (parsedRows.length === 0) return;
    setUploading(true);
    setUploadStatus(null);

    const target = getEffectiveTarget();
    let importedCount = 0;

    try {
      for (const row of parsedRows) {
        const getVal = (possibleNames: string[]): string => {
          for (const name of possibleNames) {
            for (const key of Object.keys(row)) {
              if (key.toLowerCase().trim() === name.toLowerCase().trim()) {
                return String(row[key] || "").trim();
              }
            }
          }
          return "";
        };

        const parseNum = (possibleNames: string[], defaultVal = 0): number => {
          const val = getVal(possibleNames);
          const cleaned = val.replace(/[^0-9.-]/g, "");
          const num = parseFloat(cleaned);
          return isNaN(num) ? defaultVal : num;
        };

        if (target === "SITES") {
          const name = getVal(["Site Name", "Name", "Site"]);
          const clientName = getVal(["Client Name", "Client"]) || "Direct Client";
          if (name) {
            await addSite({
              name,
              clientName,
              location: getVal(["Location", "City", "Address"]),
              status: (getVal(["Status", "Project Status"]).toUpperCase() || "ACTIVE") as any,
              estimatedBudget: parseNum(["Estimated Budget", "Budget"]),
              openingBalance: parseNum(["Opening Balance"]),
            });
            importedCount++;
          }
        } else if (target === "VENDORS") {
          const name = getVal(["Vendor Name", "Name", "Vendor"]);
          if (name) {
            await addVendor({
              name,
              phone: getVal(["Phone", "Mobile", "Contact"]),
              tradeCategory: getVal(["Category", "Trade Category", "Trade"]) || "General Materials",
              openingBalance: parseNum(["Opening Balance"]),
              notes: getVal(["Notes", "Description"]),
            });
            importedCount++;
          }
        } else if (target === "WORKERS") {
          const name = getVal(["Worker Name", "Name", "Worker"]);
          if (name) {
            await addWorker({
              name,
              phone: getVal(["Phone", "Mobile"]),
              trade: getVal(["Trade / Role", "Trade", "Role"]) || "Helper",
              compensationType: (getVal(["Compensation Type"]).toUpperCase() || "DAILY_WAGE") as any,
              defaultDailyWage: parseNum(["Daily Wage", "Default Daily Wage"]),
              monthlySalary: parseNum(["Monthly Salary"]),
              openingBalance: parseNum(["Opening Balance"]),
              isActive: getVal(["Status"]).toLowerCase() !== "inactive",
            });
            importedCount++;
          }
        } else if (target === "PURCHASES") {
          const amount = parseNum(["Amount", "Bill Amount"]);
          if (amount > 0 && vendors.length > 0 && sites.length > 0) {
            const vendorName = getVal(["Vendor Name", "Vendor"]);
            const siteName = getVal(["Site Name", "Site"]);
            const matchedVendor = vendors.find((v) => v.name.toLowerCase() === vendorName.toLowerCase()) || vendors[0];
            const matchedSite = sites.find((s) => s.name.toLowerCase() === siteName.toLowerCase()) || sites[0];

            await recordMaterialPurchase({
              vendorId: matchedVendor.id,
              siteId: matchedSite.id,
              amount,
              voucherNo: getVal(["Voucher / Bill No", "Voucher No", "Bill No"]),
              purchaseDate: getVal(["Date", "Purchase Date"]) || getTodayStr(),
              notes: getVal(["Notes"]),
            });
            importedCount++;
          }
        } else if (target === "WORK_LOGS") {
          const amount = parseNum(["Wage Amount", "Wage Earned", "Amount"]);
          if (amount > 0 && workers.length > 0 && sites.length > 0) {
            const workerName = getVal(["Worker Name", "Worker"]);
            const siteName = getVal(["Site Name", "Site"]);
            const matchedWorker = workers.find((w) => w.name.toLowerCase() === workerName.toLowerCase()) || workers[0];
            const matchedSite = sites.find((s) => s.name.toLowerCase() === siteName.toLowerCase()) || sites[0];

            await assignWorkerWorkLog({
              workerId: matchedWorker.id,
              siteId: matchedSite.id,
              wageAmount: amount,
              workDate: getVal(["Work Date", "Date"]) || getTodayStr(),
              notes: getVal(["Notes"]),
            });
            importedCount++;
          }
        } else if (target === "EXPENSES") {
          const amount = parseNum(["Amount"]);
          if (amount > 0) {
            const siteName = getVal(["Site Name", "Site"]);
            const matchedSite = sites.find((s) => s.name.toLowerCase() === siteName.toLowerCase());

            await recordCompanyExpense({
              amount,
              category: (getVal(["Expense Category", "Category"]).toUpperCase() || "MISCELLANEOUS") as any,
              siteId: matchedSite?.id,
              expenseDate: getVal(["Date", "Expense Date"]) || getTodayStr(),
              paymentMode: (getVal(["Payment Mode"]).toUpperCase() || "CASH") as any,
              voucherNo: getVal(["Voucher No"]),
              notes: getVal(["Notes"]),
            });
            importedCount++;
          }
        } else if (target === "INCOMES") {
          const amount = parseNum(["Amount", "Inflow Amount"]);
          if (amount > 0 && sites.length > 0) {
            const siteName = getVal(["Site Name", "Site"]);
            const matchedSite = sites.find((s) => s.name.toLowerCase() === siteName.toLowerCase()) || sites[0];

            await recordSiteIncome({
              siteId: matchedSite.id,
              amount,
              receivedFrom: getVal(["Received From", "Client"]),
              incomeDate: getVal(["Date", "Income Date"]) || getTodayStr(),
              paymentMode: (getVal(["Payment Mode"]).toUpperCase() || "BANK_TRANSFER") as any,
              referenceNo: getVal(["Reference / Cheque No", "Reference"]),
              notes: getVal(["Notes"]),
            });
            importedCount++;
          }
        }
      }

      setUploadStatus({
        success: true,
        message: `Successfully imported ${importedCount} records into ${target} from CSV!`,
      });

      setParsedRows([]);
      setParsedHeaders([]);
      setCsvFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadStatus({
        success: false,
        message: err?.message || "An error occurred while importing CSV data.",
      });
    } finally {
      setUploading(false);
    }
  };

  const totalTransactions =
    vendorPurchases.length +
    workerWorkLogs.length +
    companyExpenses.length +
    siteIncomes.length +
    vendorPayments.length +
    workerPayments.length +
    salarySlips.length;

  return (
    <div className="space-y-5">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-emerald-600 text-white p-2 shadow-xs">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                CSV Data Download &amp; Upload
              </h1>
              <Badge variant="warning" className="text-[10px] font-mono font-bold">
                Owner Privilege
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Download your complete ERP database in a single master spreadsheet, or upload CSV files to import data.
            </p>
          </div>
        </div>

        {lastExportTime && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <History className="h-3.5 w-3.5 text-emerald-600" />
            <span>Last Activity: {lastExportTime}</span>
          </div>
        )}
      </div>

      {exportNotice && (
        <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* ── Summary Counters ───────────────────────────────────────────────── */}
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
        {/* ── Left Column: Download All Data Setup (6 cols) ───────────────── */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Download All Data</h2>
                  <p className="text-xs text-slate-500">
                    Export all construction database transactions in one complete spreadsheet.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                UTF-8 CSV
              </span>
            </div>

            {/* Primary Download All Data Button */}
            <div className="pt-1">
              <Button
                onClick={handleExportAllDataCSV}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-12 px-6 text-sm shadow-md shadow-emerald-700/20 cursor-pointer"
              >
                <Download className="h-5 w-5 mr-2" />
                Download All Data (CSV)
              </Button>
            </div>

            {/* Included Data Breakdown List */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs text-slate-600">
              <span className="font-bold text-slate-900 block border-b border-slate-200/80 pb-1.5">
                Included in Your All-Data CSV Export:
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span><strong>{sites.length}</strong> Sites &amp; Construction Projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span><strong>{siteIncomes.length}</strong> Client Milestone Advances &amp; Inflows</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span><strong>{vendorPurchases.length}</strong> Material Purchases &amp; Supplier Bills</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span><strong>{workerWorkLogs.length}</strong> Daily Worker Wages &amp; Labor Logs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span><strong>{companyExpenses.length}</strong> Company Expenses (Room rent, petrol, mess, permits)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span><strong>{vendorPayments.length + workerPayments.length}</strong> Vendor &amp; Worker Cash Settlements</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span><strong>{salarySlips.length}</strong> Generated Monthly Salary Slips</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Total Transactions:</span>
                <span className="font-bold text-slate-900">{totalTransactions} records</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Upload CSV Setup (6 cols) ─────────────────────── */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Upload CSV to Database</h2>
                <p className="text-xs text-slate-500">
                  Import rows from any CSV spreadsheet directly into your PostgreSQL database.
                </p>
              </div>
            </div>

            {/* Target Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Target Database Table:
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value as ImportTargetTable)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="AUTO_DETECT">⚡ Auto-Detect Table from Headers</option>
                <option value="SITES">Sites &amp; Construction Projects</option>
                <option value="VENDORS">Material Vendors</option>
                <option value="WORKERS">Workers &amp; Laborers</option>
                <option value="PURCHASES">Material Purchase Bills</option>
                <option value="WORK_LOGS">Daily Worker Wage Logs</option>
                <option value="EXPENSES">Company &amp; Overhead Expenses</option>
                <option value="INCOMES">Client Milestone Inflows</option>
              </select>
            </div>

            {/* CSV File Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Select .CSV File:
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVFileSelect}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer border border-dashed border-slate-300 rounded-xl p-3"
              />
            </div>

            {uploadStatus && (
              <div
                className={`rounded-xl p-3 text-xs border ${
                  uploadStatus.success
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-rose-50 text-rose-900 border-rose-200"
                }`}
              >
                <p className="font-bold">{uploadStatus.message}</p>
              </div>
            )}

            {/* Preview & Confirmation Box */}
            {parsedRows.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-emerald-950 block">{csvFileName}</span>
                    <span className="text-[11px] text-emerald-800">
                      Target: <strong>{getEffectiveTarget()}</strong> • <strong>{parsedRows.length}</strong> rows detected
                    </span>
                  </div>
                  <Badge variant="success" className="text-[10px] font-mono">
                    Ready
                  </Badge>
                </div>

                {/* Headers preview */}
                <div className="text-[11px] text-emerald-900">
                  <span className="font-semibold">Columns: </span>
                  <span className="font-mono text-emerald-800">
                    {parsedHeaders.slice(0, 5).join(", ")}
                    {parsedHeaders.length > 5 ? ` +${parsedHeaders.length - 5} more` : ""}
                  </span>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <Button
                    onClick={handleConfirmCSVUpload}
                    disabled={uploading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-10 text-xs shadow-xs cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Importing into Database…
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Import {parsedRows.length} Records to DB
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={uploading}
                    onClick={() => {
                      setParsedRows([]);
                      setParsedHeaders([]);
                      setCsvFileName("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="h-10 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
