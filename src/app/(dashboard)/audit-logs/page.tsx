"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Printer,
  History,
  RotateCcw,
  Receipt,
  KeyRound,
  FileSpreadsheet,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { AuditLogsSkeleton } from "@/components/ui/page-skeletons";

export default function AuditLogsPage() {
  const { auditLogs, canAccessPage, role, isDbLoading } = useConstruction();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (isDbLoading) {
    return <AuditLogsSkeleton />;
  }

  const hasAccess = canAccessPage("audit-logs");

  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <div className="rounded-2xl bg-rose-50 p-4 text-rose-600 border border-rose-200 mb-4 shadow-xs">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted by RBAC</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Only users with the <strong>Owner</strong> role (or assigned Audit Logs permission) can inspect the immutable company audit trail.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
          <span>Current active role:</span>
          <Badge variant="secondary">{role}</Badge>
        </div>
      </div>
    );
  }

  // Filter audit logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    const matchesRole = roleFilter === "ALL" || log.actorRole.toUpperCase() === roleFilter.toUpperCase();

    return matchesSearch && matchesAction && matchesRole;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "RECORD_INCOME":
        return "success";
      case "PURCHASE_MATERIAL":
        return "warning";
      case "PAY_VENDOR":
      case "PAY_WORKER":
        return "destructive";
      case "WAGE_LOG":
        return "info";
      case "CREATE_USER":
      case "CREATE_ROLE":
      case "UPDATE_PERMISSIONS":
        return "default";
      default:
        return "secondary";
    }
  };

  const isFiltered = searchTerm !== "" || actionFilter !== "ALL" || roleFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchTerm("");
    setActionFilter("ALL");
    setRoleFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-amber-500 text-slate-950 p-2 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Security Audit Logs
                </h1>
                <Badge variant="warning" className="text-[10px] font-mono font-bold">
                  Owner Confidential
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable chronological record of every financial transaction, wage allocation, and role modification.
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
            Print Audit Sheet
          </Button>
        </div>
      </div>

      {/* ── Modern Compact KPI Tiles ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase font-mono">Total Tracked Events</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <History className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {auditLogs.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Recorded since system initialization
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase font-mono">Financial Entries</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">
            {
              auditLogs.filter((l) =>
                [
                  "PURCHASE_MATERIAL",
                  "PAY_VENDOR",
                  "PAY_WORKER",
                  "RECORD_INCOME",
                  "RECORD_OVERHEAD",
                ].includes(l.action)
              ).length
            }
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Material bills, worker wages &amp; client receipts
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase font-mono">Role &amp; Auth Changes</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <KeyRound className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 font-mono mt-1">
            {
              auditLogs.filter((l) =>
                ["CREATE_USER", "DELETE_USER", "UPDATE_PERMISSIONS", "CREATE_ROLE"].includes(
                  l.action
                )
              ).length
            }
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            User credentials &amp; permission updates
          </p>
        </div>
      </div>

      {/* ── Unified Audit Trail Card ─────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Card Header & Integrated Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Audit Trail Register
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-slate-200 text-slate-800">
                  {filteredLogs.length} verified events
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Displaying immutable logs filtered by search criteria, action categories, and actor roles.
              </p>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Integrated Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search description, user or site..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 h-8.5 text-xs bg-white border-slate-200 shadow-2xs focus:border-amber-500"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              <option value="PURCHASE_MATERIAL">Material Purchases</option>
              <option value="PAY_VENDOR">Vendor Payments</option>
              <option value="WAGE_LOG">Daily Wage Logs</option>
              <option value="PAY_WORKER">Worker Wage Payments</option>
              <option value="RECORD_INCOME">Client Incomes</option>
              <option value="RECORD_OVERHEAD">Company Overhead</option>
              <option value="CREATE_USER">User Creation</option>
              <option value="UPDATE_PERMISSIONS">Permission Updates</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">All Actor Roles</option>
              <option value="OWNER">Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="ACCOUNTANT">Accountant</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredLogs.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-slate-400 italic">
            No audit records matched your filter criteria.
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-2.5 px-3.5 font-bold">Timestamp</th>
                    <th className="py-2.5 px-3.5 font-bold">Action</th>
                    <th className="py-2.5 px-3.5 font-bold">Actor &amp; Role</th>
                    <th className="py-2.5 px-3.5 font-bold">Target Entity</th>
                    <th className="py-2.5 px-3.5 font-bold">Event Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                          {log.createdAt}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <Badge variant={getActionBadgeColor(log.action)} className="text-[10px] font-mono font-semibold py-0 px-2">
                            {log.action.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{log.actorName}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-600 border border-slate-200">
                              {log.actorRole}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600 font-semibold">
                          {log.entity}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-700 text-xs font-medium">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-100">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredLogs.length}
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(sz) => setPageSize(sz)}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
