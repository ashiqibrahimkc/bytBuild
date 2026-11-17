"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConstruction } from "@/lib/store";
import { PaymentMode, ExpenseCategory } from "@/lib/types";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

interface ActionModalsProps {
  defaultSiteId?: string;
  preselectedVendorId?: string;
  preselectedWorkerId?: string;
  preselectedSiteId?: string;

  // Modal states
  isOpenPurchase?: boolean;
  onClosePurchase?: () => void;

  isOpenWorkLog?: boolean;
  onCloseWorkLog?: () => void;

  isOpenVendorPay?: boolean;
  onCloseVendorPay?: () => void;

  isOpenWorkerPay?: boolean;
  onCloseWorkerPay?: () => void;

  isOpenIncome?: boolean;
  onCloseIncome?: () => void;

  isOpenExpense?: boolean;
  onCloseExpense?: () => void;
}

export function ActionModals({
  defaultSiteId,
  preselectedVendorId,
  preselectedWorkerId,
  preselectedSiteId,
  isOpenPurchase = false,
  onClosePurchase = () => { },
  isOpenWorkLog = false,
  onCloseWorkLog = () => { },
  isOpenVendorPay = false,
  onCloseVendorPay = () => { },
  isOpenWorkerPay = false,
  onCloseWorkerPay = () => { },
  isOpenIncome = false,
  onCloseIncome = () => { },
  isOpenExpense = false,
  onCloseExpense = () => { },
}: ActionModalsProps) {
  const {
    role,
    sites,
    vendors,
    workers,
    recordMaterialPurchase,
    recordVendorPayment,
    assignWorkerWorkLog,
    recordWorkerPayment,
    recordSiteIncome,
    recordCompanyExpense,
  } = useConstruction();

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  // 1. Vendor Material Purchase State
  const [purchaseVendorId, setPurchaseVendorId] = useState("");
  const [purchaseSiteId, setPurchaseSiteId] = useState(defaultSiteId || "");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [purchaseVoucherNo, setPurchaseVoucherNo] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");

  // 2. Worker Work Log State
  const [workLogWorkerId, setWorkLogWorkerId] = useState("");
  const [workLogSiteId, setWorkLogSiteId] = useState(defaultSiteId || "");
  const [workLogDate, setWorkLogDate] = useState("");
  const [workLogWageAmount, setWorkLogWageAmount] = useState("");
  const [workLogNotes, setWorkLogNotes] = useState("");

  // 3. Vendor Payment State
  const [payVendorId, setPayVendorId] = useState("");
  const [payVendorSiteId, setPayVendorSiteId] = useState(defaultSiteId || "");
  const [payVendorDate, setPayVendorDate] = useState("");
  const [payVendorAmount, setPayVendorAmount] = useState("");
  const [payVendorMode, setPayVendorMode] = useState<PaymentMode>("CASH");
  const [payVendorVoucher, setPayVendorVoucher] = useState("");
  const [payVendorNotes, setPayVendorNotes] = useState("");

  // 4. Worker Payment State
  const [payWorkerId, setPayWorkerId] = useState("");
  const [payWorkerDate, setPayWorkerDate] = useState("");
  const [payWorkerAmount, setPayWorkerAmount] = useState("");
  const [payWorkerMode, setPayWorkerMode] = useState<PaymentMode>("CASH");
  const [payWorkerVoucher, setPayWorkerVoucher] = useState("");
  const [payWorkerNotes, setPayWorkerNotes] = useState("");

  // 5. Site Income State
  const [incomeSiteId, setIncomeSiteId] = useState(defaultSiteId || "");
  const [incomeDate, setIncomeDate] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeMode, setIncomeMode] = useState<PaymentMode>("BANK_TRANSFER");
  const [incomeReceivedFrom, setIncomeReceivedFrom] = useState("");
  const [incomeRefNo, setIncomeRefNo] = useState("");
  const [incomeNotes, setIncomeNotes] = useState("");

  // 6. Company Expense State
  const [expenseSiteId, setExpenseSiteId] = useState<string>(defaultSiteId || "");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("FUEL_TRAVEL");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseMode, setExpenseMode] = useState<PaymentMode>("CASH");
  const [expenseVoucher, setExpenseVoucher] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");

  React.useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setPurchaseDate((d) => d || today);
    setWorkLogDate((d) => d || today);
    setPayVendorDate((d) => d || today);
    setPayWorkerDate((d) => d || today);
    setIncomeDate((d) => d || today);
    setExpenseDate((d) => d || today);
  }, [isOpenPurchase, isOpenWorkLog, isOpenVendorPay, isOpenWorkerPay, isOpenIncome, isOpenExpense]);

  React.useEffect(() => {
    if (preselectedVendorId) {
      setPurchaseVendorId(preselectedVendorId);
      setPayVendorId(preselectedVendorId);
    }
  }, [preselectedVendorId]);

  React.useEffect(() => {
    if (preselectedWorkerId) {
      setWorkLogWorkerId(preselectedWorkerId);
      setPayWorkerId(preselectedWorkerId);
    }
  }, [preselectedWorkerId]);

  React.useEffect(() => {
    const sId = preselectedSiteId || defaultSiteId;
    if (sId) {
      setPurchaseSiteId(sId);
      setWorkLogSiteId(sId);
      setPayVendorSiteId(sId);
      setIncomeSiteId(sId);
      setExpenseSiteId(sId);
    }
  }, [preselectedSiteId, defaultSiteId]);

  // Sync defaultSiteId when passed
  React.useEffect(() => {
    if (defaultSiteId) {
      setPurchaseSiteId(defaultSiteId);
      setWorkLogSiteId(defaultSiteId);
      setPayVendorSiteId(defaultSiteId);
      setIncomeSiteId(defaultSiteId);
      setExpenseSiteId(defaultSiteId);
    }
  }, [defaultSiteId, isOpenPurchase, isOpenWorkLog, isOpenVendorPay, isOpenIncome, isOpenExpense]);

  // Handlers
  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseVendorId || !purchaseSiteId || !purchaseAmount) return;

    recordMaterialPurchase({
      vendorId: purchaseVendorId,
      siteId: purchaseSiteId,
      purchaseDate: purchaseDate || getTodayDate(),
      amount: parseFloat(purchaseAmount),
      voucherNo: purchaseVoucherNo || undefined,
      notes: purchaseNotes || undefined,
    });
    // Reset
    setPurchaseAmount("");
    setPurchaseVoucherNo("");
    setPurchaseNotes("");
    setPurchaseDate(getTodayDate());
    onClosePurchase();
  };

  const handleWorkLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workLogWorkerId || !workLogSiteId || !workLogWageAmount) return;

    assignWorkerWorkLog({
      workerId: workLogWorkerId,
      siteId: workLogSiteId,
      workDate: workLogDate || getTodayDate(),
      wageAmount: parseFloat(workLogWageAmount),
      notes: workLogNotes || undefined,
    });
    setWorkLogWageAmount("");
    setWorkLogNotes("");
    setWorkLogDate(getTodayDate());
    onCloseWorkLog();
  };

  const handleVendorPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payVendorId || !payVendorAmount) return;

    recordVendorPayment({
      vendorId: payVendorId,
      siteId: payVendorSiteId || undefined,
      paymentDate: payVendorDate || getTodayDate(),
      amount: parseFloat(payVendorAmount),
      paymentMode: payVendorMode,
      voucherNo: payVendorVoucher || undefined,
      notes: payVendorNotes || undefined,
    });
    setPayVendorAmount("");
    setPayVendorVoucher("");
    setPayVendorNotes("");
    setPayVendorDate(getTodayDate());
    onCloseVendorPay();
  };

  const handleWorkerPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payWorkerId || !payWorkerAmount) return;

    recordWorkerPayment({
      workerId: payWorkerId,
      paymentDate: payWorkerDate || getTodayDate(),
      amount: parseFloat(payWorkerAmount),
      paymentMode: payWorkerMode,
      voucherNo: payWorkerVoucher || undefined,
      notes: payWorkerNotes || undefined,
    });
    setPayWorkerAmount("");
    setPayWorkerVoucher("");
    setPayWorkerNotes("");
    setPayWorkerDate(getTodayDate());
    onCloseWorkerPay();
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== "OWNER") return;
    if (!incomeSiteId || !incomeAmount) return;

    recordSiteIncome({
      siteId: incomeSiteId,
      incomeDate: incomeDate || getTodayDate(),
      amount: parseFloat(incomeAmount),
      paymentMode: incomeMode,
      receivedFrom: incomeReceivedFrom || undefined,
      referenceNo: incomeRefNo || undefined,
      notes: incomeNotes || undefined,
    });
    setIncomeAmount("");
    setIncomeReceivedFrom("");
    setIncomeRefNo("");
    setIncomeNotes("");
    setIncomeDate(getTodayDate());
    onCloseIncome();
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount) return;

    recordCompanyExpense({
      siteId: expenseSiteId ? expenseSiteId : undefined,
      category: expenseCategory,
      expenseDate: expenseDate || getTodayDate(),
      amount: parseFloat(expenseAmount),
      paymentMode: expenseMode,
      voucherNo: expenseVoucher || undefined,
      notes: expenseNotes || undefined,
    });
    setExpenseAmount("");
    setExpenseVoucher("");
    setExpenseNotes("");
    setExpenseDate(getTodayDate());
    onCloseExpense();
  };

  return (
    <>
      {/* 1. RECORD MATERIAL PURCHASE MODAL */}
      <Modal
        isOpen={isOpenPurchase}
        onClose={onClosePurchase}
        title="Record Site Material Purchase (Credit / Payable)"
        description="Records a new site material expense and adds to vendor credit without itemized material lists."
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-4">
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2 border border-amber-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Dual Action:</strong> 1. Accrues as an expense for the selected site. 2. Recorded as credit/balance owed to the vendor.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Vendor *
            </label>
            <select
              value={purchaseVendorId}
              onChange={(e) => setPurchaseVendorId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Choose Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.tradeCategory})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Site *
            </label>
            <select
              value={purchaseSiteId}
              onChange={(e) => setPurchaseSiteId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Choose Site --</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.clientName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Date *
              </label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Voucher / Bill No.
              </label>
              <Input
                type="text"
                placeholder="e.g. PMR-109"
                value={purchaseVoucherNo}
                onChange={(e) => setPurchaseVoucherNo(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purchase Amount (₹) *
            </label>
            <Input
              type="number"
              placeholder="e.g. 45000"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. 50 bags OPC cement, voucher attached"
              value={purchaseNotes}
              onChange={(e) => setPurchaseNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClosePurchase}>
              Cancel
            </Button>
            <Button type="submit">Record Purchase</Button>
          </div>
        </form>
      </Modal>

      {/* 2. ASSIGN WORKER & LOG DAILY WAGE */}
      <Modal
        isOpen={isOpenWorkLog}
        onClose={onCloseWorkLog}
        title="Assign Worker to Site (Log Daily Wage)"
        description="Records the worker's earned salary and immediately adds a labor expense for the site."
      >
        <form onSubmit={handleWorkLogSubmit} className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 flex items-start gap-2 border border-blue-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <span>
              <strong>Dual Action:</strong> 1. Site incurs labor expense. 2. Worker balance increases as salary earned (payable anytime).
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Worker *
            </label>
            <select
              value={workLogWorkerId}
              onChange={(e) => {
                setWorkLogWorkerId(e.target.value);
                const w = workers.find((w) => w.id === e.target.value);
                if (w) setWorkLogWageAmount(w.defaultDailyWage.toString());
              }}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Choose Worker --</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} - {w.trade} (Default: ₹{w.defaultDailyWage})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Site Assigned *
            </label>
            <select
              value={workLogSiteId}
              onChange={(e) => setWorkLogSiteId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Choose Site --</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.clientName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work / Attendance Date *
              </label>
              <Input
                type="date"
                value={workLogDate}
                onChange={(e) => setWorkLogDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Wage Amount (₹) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 950"
                value={workLogWageAmount}
                onChange={(e) => setWorkLogWageAmount(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Description / Notes
            </label>
            <Input
              type="text"
              placeholder="e.g. Plinth beam concreting work"
              value={workLogNotes}
              onChange={(e) => setWorkLogNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCloseWorkLog}>
              Cancel
            </Button>
            <Button type="submit">Log Attendance & Wage</Button>
          </div>
        </form>
      </Modal>

      {/* 3. SETTLE VENDOR PAYMENT */}
      <Modal
        isOpen={isOpenVendorPay}
        onClose={onCloseVendorPay}
        title="Pay Vendor (Settle Credit / Partial Payment)"
        description="Records an actual cash outflow from the company and reduces the vendor's outstanding credit."
      >
        <form onSubmit={handleVendorPaySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Vendor *
            </label>
            <select
              value={payVendorId}
              onChange={(e) => setPayVendorId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Choose Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.tradeCategory})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Site Allocated (Optional)
            </label>
            <select
              value={payVendorSiteId}
              onChange={(e) => setPayVendorSiteId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- General Vendor Payment (Not Site Specific) --</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.clientName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Date *
              </label>
              <Input
                type="date"
                value={payVendorDate}
                onChange={(e) => setPayVendorDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Paid (₹) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 25000"
                value={payVendorAmount}
                onChange={(e) => setPayVendorAmount(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode *
              </label>
              <select
                value={payVendorMode}
                onChange={(e) => setPayVendorMode(e.target.value as PaymentMode)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Voucher / Cheque No.
              </label>
              <Input
                type="text"
                placeholder="e.g. PV-102"
                value={payVendorVoucher}
                onChange={(e) => setPayVendorVoucher(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes
            </label>
            <Input
              type="text"
              placeholder="e.g. Part payment for steel delivery"
              value={payVendorNotes}
              onChange={(e) => setPayVendorNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCloseVendorPay}>
              Cancel
            </Button>
            <Button type="submit" variant="success">
              Disburse Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. DISBURSE WORKER PAYMENT */}
      <Modal
        isOpen={isOpenWorkerPay}
        onClose={onCloseWorkerPay}
        title="Pay Worker (Weekly / Partial Wage Settlement)"
        description="Records an actual company cash outflow and deducts from the worker's accumulated wage credit."
      >
        <form onSubmit={handleWorkerPaySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Worker *
            </label>
            <select
              value={payWorkerId}
              onChange={(e) => setPayWorkerId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Choose Worker --</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.trade})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Date *
              </label>
              <Input
                type="date"
                value={payWorkerDate}
                onChange={(e) => setPayWorkerDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Paid (₹) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={payWorkerAmount}
                onChange={(e) => setPayWorkerAmount(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode *
              </label>
              <select
                value={payWorkerMode}
                onChange={(e) => setPayWorkerMode(e.target.value as PaymentMode)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Voucher / Receipt No.
              </label>
              <Input
                type="text"
                placeholder="e.g. WAGE-105"
                value={payWorkerVoucher}
                onChange={(e) => setPayWorkerVoucher(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes
            </label>
            <Input
              type="text"
              placeholder="e.g. Saturday weekly settlement"
              value={payWorkerNotes}
              onChange={(e) => setPayWorkerNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCloseWorkerPay}>
              Cancel
            </Button>
            <Button type="submit" variant="success">
              Disburse Wage Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. RECORD CLIENT SITE INCOME (OWNER ONLY RBAC) */}
      <Modal
        isOpen={isOpenIncome}
        onClose={onCloseIncome}
        title="Record Client Payment (Site Inflow)"
        description="Records funds received from a client for a project. Increases company cash balance."
      >
        {role !== "OWNER" ? (
          <div className="space-y-3 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Access Restricted (RBAC)
            </h3>
            <p className="text-xs text-slate-500">
              Only users with the <strong>Owner</strong> role are authorized to record client incomes and direct financial receipts. Switch to Owner role using the top bar to test this action.
            </p>
            <Button variant="outline" onClick={onCloseIncome} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleIncomeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Site *
              </label>
              <select
                value={incomeSiteId}
                onChange={(e) => setIncomeSiteId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Choose Site --</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.clientName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receipt Date *
                </label>
                <Input
                  type="date"
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received (₹) *
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 100000"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={incomeMode}
                  onChange={(e) => setIncomeMode(e.target.value as PaymentMode)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Cheque / UTR No.
                </label>
                <Input
                  type="text"
                  placeholder="e.g. HDFC-90218"
                  value={incomeRefNo}
                  onChange={(e) => setIncomeRefNo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Received From / Client Rep
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Rajesh Kumar (Self)"
                  value={incomeReceivedFrom}
                  onChange={(e) => setIncomeReceivedFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Phase 2 slab casting milestone payment"
                  value={incomeNotes}
                  onChange={(e) => setIncomeNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCloseIncome}>
                Cancel
              </Button>
              <Button type="submit">Record Cash Inflow</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 6. RECORD COMPANY OVERHEAD & SITE MISC */}
      <Modal
        isOpen={isOpenExpense}
        onClose={onCloseExpense}
        title="Record Company Overhead / Site Misc Expense"
        description="Records operational cash outflows like petrol for site visits, tea/snacks, or equipment."
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expense Category *
            </label>
            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="OUTSIDE_LABOR">👷 Outside Labour Wages (Immediate Payment)</option>
              <option value="ROOM_RENT">🏠 Room / Labour Camp Rent</option>
              <option value="PETROL_FUEL">⛽ Company Petrol & Vehicle Fuel</option>
              <option value="FOOD_TEA_REFRESHMENTS">🍵 Worker Mess & Tea Refreshments</option>
              <option value="MACHINERY_RENT">🚜 Machinery & Equipment Rental</option>
              <option value="OFFICE_OVERHEAD">🏢 Office Overhead / Electricity</option>
              <option value="SITE_PERMIT_FEES">📄 Site Permit & Municipal Fees</option>
              <option value="MISCELLANEOUS">📦 Other Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associate with Site (Optional)
            </label>
            <select
              value={expenseSiteId}
              onChange={(e) => setExpenseSiteId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- General Company Overhead (No Site) --</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.clientName})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Select a site if this petrol or expense was incurred specifically for that project.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expense Date *
              </label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 1500"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode *
              </label>
              <select
                value={expenseMode}
                onChange={(e) => setExpenseMode(e.target.value as PaymentMode)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Voucher / Bill No.
              </label>
              <Input
                type="text"
                placeholder="e.g. PETROL-54"
                value={expenseVoucher}
                onChange={(e) => setExpenseVoucher(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes
            </label>
            <Input
              type="text"
              placeholder={expenseCategory === "OUTSIDE_LABOR" ? "e.g. 3 casual daily helpers for unloading / concrete work" : "e.g. Site supervisor visit to Sector 45"}
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCloseExpense}>
              Cancel
            </Button>
            <Button type="submit">Record Expense</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

