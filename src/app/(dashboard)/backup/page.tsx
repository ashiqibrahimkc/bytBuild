"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CloudDownload,
  Mail,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  History,
  Building2,
  Truck,
  Users,
  Key,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function BackupPage() {
  const {
    role,
    companyName,
    sites,
    vendors,
    workers,
    vendorPurchases,
    workerWorkLogs,
    auditLogs,
    exportFullBackupPayload,
    restoreFullBackupPayload,
    canAccessPage,
  } = useConstruction();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
    notConfigured?: boolean;
  } | null>(null);

  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restorePreview, setRestorePreview] = useState<any>(null);
  const [restoreStatus, setRestoreStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("bytbuild_backup_gmail");
      if (savedEmail) setEmail(savedEmail);
      const savedTime = localStorage.getItem("bytbuild_last_backup_time");
      if (savedTime) setLastBackupTime(savedTime);
    } catch {}
  }, []);

  const hasAccess =
    role.toUpperCase() === "OWNER" ||
    role.toUpperCase() === "ADMIN" ||
    canAccessPage("backup");

  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <div className="rounded-2xl bg-rose-50 p-4 text-rose-600 border border-rose-200 mb-4 shadow-xs">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted by RBAC</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Only the <strong>Company Owner</strong> has security authorization to export, email, or restore complete ERP database backups.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
          <span>Current active role:</span>
          <Badge variant="secondary">{role}</Badge>
        </div>
      </div>
    );
  }

  // Handle Send to Gmail
  const handleSendToGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setSendResult({ success: false, message: "Please provide a valid Gmail address." });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      localStorage.setItem("bytbuild_backup_gmail", email);
      const payload = exportFullBackupPayload();

      const res = await fetch("/api/backup/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: email,
          companyName,
          backupData: payload,
        }),
      });

      const data = await res.json();
      setSendResult(data);

      if (data.success) {
        const timeStr = new Date().toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        setLastBackupTime(timeStr);
        localStorage.setItem("bytbuild_last_backup_time", timeStr);
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || "Failed to communicate with backup server.",
      });
    } finally {
      setSending(false);
    }
  };

  // Download Offline JSON File
  const handleDownloadJSON = () => {
    const payload = exportFullBackupPayload();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement("a");
    const filename = `bytbuild_backup_${new Date().toISOString().split("T")[0]}.json`;
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    const timeStr = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastBackupTime(timeStr);
    localStorage.setItem("bytbuild_last_backup_time", timeStr);
  };

  // Handle File Selection for Restore
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
      } catch (err) {
        setRestoreStatus({
          success: false,
          message: "Could not parse JSON. The file appears to be corrupted.",
        });
        setRestorePreview(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleConfirmRestore = () => {
    if (!restorePreview) return;
    const res = restoreFullBackupPayload(restorePreview);
    setRestoreStatus(res);
    setRestorePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-amber-500 text-slate-950 p-2 shadow-xs">
              <CloudDownload className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Gmail Backup &amp; Disaster Recovery
                </h1>
                <Badge variant="warning" className="text-[10px] font-mono font-bold">
                  Owner Privilege
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Send full database backups directly to your Gmail inbox, download offline archives, and restore data.
              </p>
            </div>
          </div>
        </div>

        {lastBackupTime && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <History className="h-3.5 w-3.5 text-emerald-600" />
            <span>Last Backup: {lastBackupTime}</span>
          </div>
        )}
      </div>

      {/* ── Summary Tiles ─────────────────────────────────────────────────── */}
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
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Audit Events</span>
          <span className="text-2xl font-black text-purple-600">{auditLogs.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left Column: Gmail Dispatch & Offline Download (7 cols) ───── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Gmail Backup Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-lg bg-red-50 text-red-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Email Backup to Gmail</h2>
                <p className="text-xs text-slate-500">
                  Sends an encrypted JSON database snapshot attachment directly to your email inbox.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendToGmail} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Recipient Gmail Address
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    required
                    placeholder="e.g. owner.company@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={sending}
                    className="h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 shrink-0 shadow-xs cursor-pointer"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Backup
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  The email will include an automated summary of all {sites.length} sites, {workers.length} workers, and cash transactions.
                </p>
              </div>
            </form>

            {/* Result Alerts */}
            {sendResult && (
              <div
                className={`rounded-xl p-4 text-xs border ${
                  sendResult.success
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : sendResult.notConfigured
                    ? "bg-amber-50 text-amber-900 border-amber-200"
                    : "bg-rose-50 text-rose-900 border-rose-200"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {sendResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : sendResult.notConfigured ? (
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1">
                    <p className="font-bold">{sendResult.message}</p>
                    {sendResult.notConfigured && (
                      <div className="space-y-2 pt-1 text-[11px] text-amber-800">
                        <p>
                          To enable sending emails directly through your Gmail, add your Gmail and Google App Password to your <code>.env</code> file:
                        </p>
                        <div className="bg-white/80 p-2.5 rounded-lg font-mono text-[11px] border border-amber-200">
                          <div>GMAIL_BACKUP_USER=&quot;yourname@gmail.com&quot;</div>
                          <div>GMAIL_APP_PASSWORD=&quot;xxxx xxxx xxxx xxxx&quot;</div>
                        </div>
                        <p>
                          You can generate the 16-character password in 30 seconds at:{" "}
                          <a
                            href="https://myaccount.google.com/apppasswords"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold underline text-amber-900"
                          >
                            myaccount.google.com/apppasswords
                          </a>
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDownloadJSON}
                          className="mt-2 bg-white text-amber-900 border-amber-300 hover:bg-amber-100"
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Download Offline Backup Now Instead
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Offline Direct Download */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Download Offline Archive</h2>
                <p className="text-xs text-slate-500">
                  Save a physical copy directly to your laptop, PC, or external USB drive.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <Button
                onClick={handleDownloadJSON}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-4 text-xs cursor-pointer shadow-xs"
              >
                <FileJson className="h-4 w-4 mr-2 text-amber-400" />
                Download JSON Backup File
              </Button>
              <span className="text-xs text-slate-400">
                Contains complete relational state ready for instant 1-click restore.
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
                  Upload any backup JSON file received in your Gmail to restore your database.
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

          {/* Quick Setup Guide Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Key className="h-4 w-4 text-amber-600" />
              <span>3-Step Google Gmail Setup</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 leading-relaxed">
              <li>Turn on 2-Step Verification in your Google Account.</li>
              <li>
                Open{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-amber-700 hover:underline inline-flex items-center gap-0.5"
                >
                  App Passwords <ExternalLink className="h-2.5 w-2.5" />
                </a>{" "}
                and create a password named &ldquo;bytBuild&rdquo;.
              </li>
              <li>Paste the 16-letter code into your <code>.env</code> file under <code>GMAIL_APP_PASSWORD</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

