import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to safely serialize Prisma records (converting Decimals to numbers and Dates to strings)
function serializeSite(s: any) {
  return {
    id: s.id,
    name: s.name,
    clientName: s.clientName,
    location: s.location || "",
    status: s.status,
    estimatedBudget: Number(s.estimatedBudget || 0),
    openingBalance: Number(s.openingBalance || 0),
    createdAt: s.createdAt.toISOString().slice(0, 10),
  };
}

function serializeVendor(v: any) {
  return {
    id: v.id,
    name: v.name,
    phone: v.phone || "",
    tradeCategory: v.tradeCategory || "",
    notes: v.notes || "",
    openingBalance: Number(v.openingBalance || 0),
    createdAt: v.createdAt.toISOString().slice(0, 10),
  };
}

function serializeWorker(w: any) {
  return {
    id: w.id,
    name: w.name,
    phone: w.phone || "",
    trade: w.trade || "Helper",
    compensationType: w.compensationType || "DAILY_WAGE",
    defaultDailyWage: Number(w.defaultDailyWage || 0),
    monthlySalary: w.monthlySalary ? Number(w.monthlySalary) : undefined,
    isActive: Boolean(w.isActive),
    openingBalance: Number(w.openingBalance || 0),
    createdAt: w.createdAt.toISOString().slice(0, 10),
  };
}

function serializePurchase(p: any) {
  return {
    id: p.id,
    vendorId: p.vendorId,
    siteId: p.siteId,
    purchaseDate: p.purchaseDate.toISOString().slice(0, 10),
    amount: Number(p.amount),
    voucherNo: p.voucherNo || "",
    notes: p.notes || "",
    createdAt: p.createdAt.toISOString().slice(0, 10),
  };
}

function serializeVendorPayment(vp: any) {
  return {
    id: vp.id,
    vendorId: vp.vendorId,
    siteId: vp.siteId || undefined,
    paymentDate: vp.paymentDate.toISOString().slice(0, 10),
    amount: Number(vp.amount),
    paymentMode: vp.paymentMode,
    voucherNo: vp.voucherNo || "",
    notes: vp.notes || "",
    createdAt: vp.createdAt.toISOString().slice(0, 10),
  };
}

function serializeWorkLog(wl: any) {
  return {
    id: wl.id,
    workerId: wl.workerId,
    siteId: wl.siteId,
    workDate: wl.workDate.toISOString().slice(0, 10),
    wageAmount: Number(wl.wageAmount),
    notes: wl.notes || "",
    createdAt: wl.createdAt.toISOString().slice(0, 10),
  };
}

function serializeWorkerPayment(wp: any) {
  return {
    id: wp.id,
    workerId: wp.workerId,
    paymentDate: wp.paymentDate.toISOString().slice(0, 10),
    amount: Number(wp.amount),
    paymentMode: wp.paymentMode,
    voucherNo: wp.voucherNo || "",
    notes: wp.notes || "",
    createdAt: wp.createdAt.toISOString().slice(0, 10),
  };
}

function serializeSiteIncome(i: any) {
  return {
    id: i.id,
    siteId: i.siteId,
    incomeDate: i.incomeDate.toISOString().slice(0, 10),
    amount: Number(i.amount),
    paymentMode: i.paymentMode,
    referenceNo: i.referenceNo || "",
    receivedFrom: i.receivedFrom || "",
    notes: i.notes || "",
    createdAt: i.createdAt.toISOString().slice(0, 10),
  };
}

function serializeCompanyExpense(e: any) {
  return {
    id: e.id,
    siteId: e.siteId || undefined,
    workerId: e.workerId || undefined,
    category: e.category,
    expenseDate: e.expenseDate.toISOString().slice(0, 10),
    amount: Number(e.amount),
    paymentMode: e.paymentMode,
    voucherNo: e.voucherNo || "",
    notes: e.notes || "",
    createdAt: e.createdAt.toISOString().slice(0, 10),
  };
}

function serializeSalarySlip(s: any) {
  return {
    id: s.id,
    slipNumber: s.slipNumber,
    workerId: s.workerId,
    workerName: s.workerName,
    workerTrade: s.workerTrade,
    monthYear: s.monthYear,
    monthLabel: s.monthLabel,
    baseSalary: Number(s.baseSalary),
    advanceDeductions: Number(s.advanceDeductions),
    otherDeductions: s.otherDeductions ? Number(s.otherDeductions) : undefined,
    netPayableAmount: Number(s.netPayableAmount),
    paymentMode: s.paymentMode,
    paymentDate: s.paymentDate.toISOString().slice(0, 10),
    voucherNo: s.voucherNo || "",
    notes: s.notes || "",
    createdAt: s.createdAt.toISOString().slice(0, 10),
  };
}

function serializeAuditLog(a: any) {
  return {
    id: a.id,
    action: a.action,
    entity: a.entity,
    entityId: a.entityId || "",
    details: a.details,
    actorName: a.actorName,
    actorRole: a.actorRole,
    createdAt: a.createdAt.toISOString(),
  };
}

function serializeUser(u: any) {
  return {
    id: u.id,
    username: u.username,
    email: u.email || "",
    fullName: u.fullName,
    password: u.password,
    roleId: u.roleId,
    roleName: u.role?.name || "OWNER",
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString().slice(0, 10),
  };
}

function serializeRole(r: any) {
  let displayName = r.name;
  let description = r.description || "";

  if (r.name === "OWNER") {
    displayName = "Company Owner";
  } else if (r.name === "MANAGER") {
    displayName = "Site Project Manager";
  } else if (r.name === "ACCOUNTANT") {
    displayName = "Head Accountant";
  } else if (r.description) {
    try {
      if (typeof r.description === "string" && r.description.startsWith("{") && r.description.endsWith("}")) {
        const parsed = JSON.parse(r.description);
        displayName = parsed.display || parsed.displayName || r.name;
        description = parsed.desc || parsed.description || "";
      } else {
        displayName = r.name.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    } catch {
      displayName = r.name.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }
  } else {
    displayName = r.name.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }

  return {
    id: r.id,
    name: r.name,
    displayName,
    description,
    permissions: r.permissions || [],
    isSystem: Boolean(r.isSystem),
    createdAt: r.createdAt.toISOString().slice(0, 10),
  };
}

// ─── GET: Fetch all live collections from PostgreSQL database ─────────────────
export async function GET() {
  try {
    const [
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
      roles,
      users,
      auditLogs,
    ] = await Promise.all([
      prisma.site.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.vendor.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.worker.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.vendorPurchase.findMany({ orderBy: { purchaseDate: "desc" } }),
      prisma.vendorPayment.findMany({ orderBy: { paymentDate: "desc" } }),
      prisma.workerWorkLog.findMany({ orderBy: { workDate: "desc" } }),
      prisma.workerPayment.findMany({ orderBy: { paymentDate: "desc" } }),
      prisma.siteIncome.findMany({ orderBy: { incomeDate: "desc" } }),
      prisma.companyExpense.findMany({ orderBy: { expenseDate: "desc" } }),
      prisma.salarySlip.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.customRole.findMany({ orderBy: { name: "asc" } }),
      prisma.appUser.findMany({ include: { role: true }, orderBy: { createdAt: "desc" } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sites: sites.map(serializeSite),
        vendors: vendors.map(serializeVendor),
        workers: workers.map(serializeWorker),
        vendorPurchases: vendorPurchases.map(serializePurchase),
        vendorPayments: vendorPayments.map(serializeVendorPayment),
        workerWorkLogs: workerWorkLogs.map(serializeWorkLog),
        workerPayments: workerPayments.map(serializeWorkerPayment),
        siteIncomes: siteIncomes.map(serializeSiteIncome),
        companyExpenses: companyExpenses.map(serializeCompanyExpense),
        salarySlips: salarySlips.map(serializeSalarySlip),
        roles: roles.map(serializeRole),
        users: users.map(serializeUser),
        auditLogs: auditLogs.map(serializeAuditLog),
      },
    });
  } catch (error: any) {
    console.error("GET /api/data database query failed:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch database data" },
      { status: 500 }
    );
  }
}

// ─── POST: Direct Database Mutations via Prisma ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { action, payload } = await request.json();

    switch (action) {
      // ── Sites ──
      case "ADD_SITE": {
        const siteData: Record<string, any> = {
          name: payload.name,
          clientName: payload.clientName,
          location: payload.location || "",
          status: payload.status || "ACTIVE",
          estimatedBudget: payload.estimatedBudget || 0,
          openingBalance: payload.openingBalance || 0,
        };
        const created = await (prisma as any).site.create({
          data: siteData,
        });
        return NextResponse.json({ success: true, item: serializeSite(created) });
      }
      case "UPDATE_SITE": {
        const updateData: Record<string, any> = {
          name: payload.name,
          clientName: payload.clientName,
          location: payload.location || "",
          status: payload.status,
          estimatedBudget: payload.estimatedBudget || 0,
          openingBalance: payload.openingBalance || 0,
        };
        const updated = await (prisma as any).site.update({
          where: { id: payload.id },
          data: updateData,
        });
        return NextResponse.json({ success: true, item: serializeSite(updated) });
      }
      case "DELETE_SITE": {
        if (payload.forceCascade) {
          await prisma.$transaction([
            prisma.vendorPurchase.deleteMany({ where: { siteId: payload.id } }),
            prisma.workerWorkLog.deleteMany({ where: { siteId: payload.id } }),
            prisma.siteIncome.deleteMany({ where: { siteId: payload.id } }),
            prisma.companyExpense.deleteMany({ where: { siteId: payload.id } }),
            prisma.vendorPayment.deleteMany({ where: { siteId: payload.id } }),
            prisma.site.delete({ where: { id: payload.id } }),
          ]);
        } else {
          await prisma.site.delete({ where: { id: payload.id } });
        }
        return NextResponse.json({ success: true, id: payload.id });
      }

      // ── Vendors ──
      case "ADD_VENDOR": {
        const vendorData: Record<string, any> = {
          name: payload.name,
          phone: payload.phone || "",
          tradeCategory: payload.tradeCategory || "",
          notes: payload.notes || "",
          openingBalance: payload.openingBalance || 0,
        };
        const created = await (prisma as any).vendor.create({
          data: vendorData,
        });
        return NextResponse.json({ success: true, item: serializeVendor(created) });
      }
      case "UPDATE_VENDOR": {
        const vendorData: Record<string, any> = {
          name: payload.name,
          phone: payload.phone || "",
          tradeCategory: payload.tradeCategory || "",
          notes: payload.notes || "",
          openingBalance: payload.openingBalance || 0,
        };
        const updated = await (prisma as any).vendor.update({
          where: { id: payload.id },
          data: vendorData,
        });
        return NextResponse.json({ success: true, item: serializeVendor(updated) });
      }
      case "DELETE_VENDOR": {
        if (payload.forceCascade) {
          await prisma.$transaction([
            prisma.vendorPurchase.deleteMany({ where: { vendorId: payload.id } }),
            prisma.vendorPayment.deleteMany({ where: { vendorId: payload.id } }),
            prisma.vendor.delete({ where: { id: payload.id } }),
          ]);
        } else {
          await prisma.vendor.delete({ where: { id: payload.id } });
        }
        return NextResponse.json({ success: true, id: payload.id });
      }

      // ── Workers ──
      case "ADD_WORKER": {
        const workerData: Record<string, any> = {
          name: payload.name,
          phone: payload.phone || "",
          trade: payload.trade || "Helper",
          compensationType: payload.compensationType || "DAILY_WAGE",
          defaultDailyWage: payload.defaultDailyWage || 0,
          monthlySalary: payload.monthlySalary || 0,
          openingBalance: payload.openingBalance || 0,
          isActive: payload.isActive !== false,
        };
        const created = await (prisma as any).worker.create({
          data: workerData,
        });
        return NextResponse.json({ success: true, item: serializeWorker(created) });
      }
      case "UPDATE_WORKER": {
        const workerData: Record<string, any> = {
          name: payload.name,
          phone: payload.phone || "",
          trade: payload.trade,
          compensationType: payload.compensationType,
          defaultDailyWage: payload.defaultDailyWage || 0,
          monthlySalary: payload.monthlySalary || 0,
          openingBalance: payload.openingBalance || 0,
          isActive: payload.isActive !== false,
        };
        const updated = await (prisma as any).worker.update({
          where: { id: payload.id },
          data: workerData,
        });
        return NextResponse.json({ success: true, item: serializeWorker(updated) });
      }
      case "DELETE_WORKER": {
        if (payload.forceCascade) {
          await prisma.$transaction([
            prisma.workerWorkLog.deleteMany({ where: { workerId: payload.id } }),
            prisma.workerPayment.deleteMany({ where: { workerId: payload.id } }),
            prisma.salarySlip.deleteMany({ where: { workerId: payload.id } }),
            prisma.companyExpense.deleteMany({ where: { workerId: payload.id } }),
            prisma.worker.delete({ where: { id: payload.id } }),
          ]);
        } else {
          await prisma.worker.delete({ where: { id: payload.id } });
        }
        return NextResponse.json({ success: true, id: payload.id });
      }

      // ── Vendor Purchases ──
      case "ADD_PURCHASE": {
        const created = await prisma.vendorPurchase.create({
          data: {
            vendorId: payload.vendorId,
            siteId: payload.siteId,
            purchaseDate: new Date(payload.purchaseDate),
            amount: payload.amount,
            voucherNo: payload.voucherNo || "",
            notes: payload.notes || "",
          },
        });
        return NextResponse.json({ success: true, item: serializePurchase(created) });
      }
      case "UPDATE_PURCHASE": {
        const updated = await prisma.vendorPurchase.update({
          where: { id: payload.id },
          data: {
            ...(payload.vendorId ? { vendorId: payload.vendorId } : {}),
            ...(payload.siteId ? { siteId: payload.siteId } : {}),
            ...(payload.purchaseDate ? { purchaseDate: new Date(payload.purchaseDate) } : {}),
            ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
            ...(payload.voucherNo !== undefined ? { voucherNo: payload.voucherNo || "" } : {}),
            ...(payload.notes !== undefined ? { notes: payload.notes || "" } : {}),
          },
        });
        return NextResponse.json({ success: true, item: serializePurchase(updated) });
      }
      case "DELETE_PURCHASE": {
        await prisma.vendorPurchase.delete({ where: { id: payload.id } });
        return NextResponse.json({ success: true, id: payload.id });
      }

      // ── Vendor Payments ──
      case "ADD_VENDOR_PAYMENT": {
        const created = await prisma.vendorPayment.create({
          data: {
            vendorId: payload.vendorId,
            siteId: payload.siteId || null,
            paymentDate: new Date(payload.paymentDate),
            amount: payload.amount,
            paymentMode: payload.paymentMode || "CASH",
            voucherNo: payload.voucherNo || "",
            notes: payload.notes || "",
          },
        });
        return NextResponse.json({ success: true, item: serializeVendorPayment(created) });
      }
      case "UPDATE_VENDOR_PAYMENT": {
        const updated = await prisma.vendorPayment.update({
          where: { id: payload.id },
          data: {
            ...(payload.vendorId ? { vendorId: payload.vendorId } : {}),
            ...(payload.siteId !== undefined ? { siteId: payload.siteId || null } : {}),
            ...(payload.paymentDate ? { paymentDate: new Date(payload.paymentDate) } : {}),
            ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
            ...(payload.paymentMode ? { paymentMode: payload.paymentMode } : {}),
            ...(payload.voucherNo !== undefined ? { voucherNo: payload.voucherNo || "" } : {}),
            ...(payload.notes !== undefined ? { notes: payload.notes || "" } : {}),
          },
        });
        return NextResponse.json({ success: true, item: serializeVendorPayment(updated) });
      }
      case "DELETE_VENDOR_PAYMENT": {
        await prisma.vendorPayment.delete({ where: { id: payload.id } });
        return NextResponse.json({ success: true, id: payload.id });
      }

      // ── Worker Work Logs (Attendance) ──
      case "ADD_WORK_LOG": {
        const created = await prisma.workerWorkLog.create({
          data: {
            workerId: payload.workerId,
            siteId: payload.siteId,
            workDate: new Date(payload.workDate),
            wageAmount: payload.wageAmount,
            notes: payload.notes || "",
          },
        });
        return NextResponse.json({ success: true, item: serializeWorkLog(created) });
      }
      case "UPDATE_WORK_LOG": {
        const updated = await prisma.workerWorkLog.update({
          where: { id: payload.id },
          data: {
            ...(payload.workerId ? { workerId: payload.workerId } : {}),
            ...(payload.siteId ? { siteId: payload.siteId } : {}),
            ...(payload.workDate ? { workDate: new Date(payload.workDate) } : {}),
            ...(payload.wageAmount !== undefined ? { wageAmount: payload.wageAmount } : {}),
            ...(payload.notes !== undefined ? { notes: payload.notes || "" } : {}),
          },
        });
        return NextResponse.json({ success: true, item: serializeWorkLog(updated) });
      }
      case "DELETE_WORK_LOG": {
        await prisma.workerWorkLog.delete({ where: { id: payload.id } });
        return NextResponse.json({ success: true, id: payload.id });
      }

      // ── Worker Payments ──
      case "ADD_WORKER_PAYMENT": {
        const created = await prisma.workerPayment.create({
          data: {
            workerId: payload.workerId,
            paymentDate: new Date(payload.paymentDate),
            amount: payload.amount,
            paymentMode: payload.paymentMode || "CASH",
            voucherNo: payload.voucherNo || "",
            notes: payload.notes || "",
          },
        });
        return NextResponse.json({ success: true, item: serializeWorkerPayment(created) });
      }
      case "UPDATE_WORKER_PAYMENT": {
        const updated = await prisma.workerPayment.update({
          where: { id: payload.id },
          data: {
            ...(payload.workerId ? { workerId: payload.workerId } : {}),
            ...(payload.paymentDate ? { paymentDate: new Date(payload.paymentDate) } : {}),
            ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
            ...(payload.paymentMode ? { paymentMode: payload.paymentMode } : {}),
            ...(payload.voucherNo !== undefined ? { voucherNo: payload.voucherNo || "" } : {}),
            ...(payload.notes !== undefined ? { notes: payload.notes || "" } : {}),
          },
        });
        return NextResponse.json({ success: true, item: serializeWorkerPayment(updated) });
      }
      case "DELETE_WORKER_PAYMENT": {
        await prisma.workerPayment.delete({ where: { id: payload.id } });
        return NextResponse.json({ success: true, id: payload.id });
      }

      // ── Site Incomes (Client Inflows) ──
      case "ADD_SITE_INCOME": {
        const created = await prisma.siteIncome.create({
          data: {
            siteId: payload.siteId,
            incomeDate: new Date(payload.incomeDate),
            amount: payload.amount,
            paymentMode: payload.paymentMode || "BANK_TRANSFER",
            referenceNo: payload.referenceNo || "",
            receivedFrom: payload.receivedFrom || "",
            notes: payload.notes || "",
          },
        });
        return NextResponse.json({ success: true, item: serializeSiteIncome(created) });
      }
      case "UPDATE_SITE_INCOME": {
        const updated = await prisma.siteIncome.update({
          where: { id: payload.id },
          data: {
            ...(payload.siteId ? { siteId: payload.siteId } : {}),
            ...(payload.incomeDate ? { incomeDate: new Date(payload.incomeDate) } : {}),
            ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
            ...(payload.paymentMode ? { paymentMode: payload.paymentMode } : {}),
            ...(payload.referenceNo !== undefined ? { referenceNo: payload.referenceNo || "" } : {}),
            ...(payload.receivedFrom !== undefined ? { receivedFrom: payload.receivedFrom || "" } : {}),
            ...(payload.notes !== undefined ? { notes: payload.notes || "" } : {}),
          },
        });
        return NextResponse.json({ success: true, item: serializeSiteIncome(updated) });
      }
      case "DELETE_SITE_INCOME": {
        await prisma.siteIncome.delete({ where: { id: payload.id } });
        return NextResponse.json({ success: true, id: payload.id });
      }

      // ── Company / Site Expenses ──
      case "ADD_EXPENSE": {
        const created = await prisma.companyExpense.create({
          data: {
            siteId: payload.siteId || null,
            workerId: payload.workerId || null,
            category: payload.category,
            expenseDate: new Date(payload.expenseDate),
            amount: payload.amount,
            paymentMode: payload.paymentMode || "CASH",
            voucherNo: payload.voucherNo || "",
            notes: payload.notes || "",
          },
        });
        return NextResponse.json({ success: true, item: serializeCompanyExpense(created) });
      }
      case "UPDATE_EXPENSE": {
        const updated = await prisma.companyExpense.update({
          where: { id: payload.id },
          data: {
            ...(payload.siteId !== undefined ? { siteId: payload.siteId || null } : {}),
            ...(payload.workerId !== undefined ? { workerId: payload.workerId || null } : {}),
            ...(payload.category ? { category: payload.category } : {}),
            ...(payload.expenseDate ? { expenseDate: new Date(payload.expenseDate) } : {}),
            ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
            ...(payload.paymentMode ? { paymentMode: payload.paymentMode } : {}),
            ...(payload.voucherNo !== undefined ? { voucherNo: payload.voucherNo || "" } : {}),
            ...(payload.notes !== undefined ? { notes: payload.notes || "" } : {}),
          },
        });
        return NextResponse.json({ success: true, item: serializeCompanyExpense(updated) });
      }
      case "DELETE_EXPENSE": {
        await prisma.companyExpense.delete({ where: { id: payload.id } });
        return NextResponse.json({ success: true, id: payload.id });
      }

      // ── Salary Slips ──
      case "ADD_SALARY_SLIP": {
        const created = await prisma.salarySlip.create({
          data: {
            slipNumber: payload.slipNumber,
            workerId: payload.workerId,
            workerName: payload.workerName,
            workerTrade: payload.workerTrade,
            monthYear: payload.monthYear,
            monthLabel: payload.monthLabel,
            baseSalary: payload.baseSalary,
            advanceDeductions: payload.advanceDeductions || 0,
            otherDeductions: payload.otherDeductions || null,
            netPayableAmount: payload.netPayableAmount,
            paymentMode: payload.paymentMode || "BANK_TRANSFER",
            paymentDate: new Date(payload.paymentDate),
            voucherNo: payload.voucherNo || "",
            notes: payload.notes || "",
          },
        });
        return NextResponse.json({ success: true, item: serializeSalarySlip(created) });
      }
      case "DELETE_SALARY_SLIP": {
        await prisma.salarySlip.delete({ where: { id: payload.id } });
        return NextResponse.json({ success: true, id: payload.id });
      }

      // ── Audit Logs ──
      case "ADD_AUDIT_LOG": {
        const created = await prisma.auditLog.create({
          data: {
            action: payload.action,
            entity: payload.entity,
            entityId: payload.entityId || "",
            details: payload.details,
            actorName: payload.actorName || "Admin",
            actorRole: payload.actorRole || "OWNER",
          },
        });
        return NextResponse.json({ success: true, item: serializeAuditLog(created) });
      }

      // ── Users ──
      case "ADD_USER": {
        const created = await prisma.appUser.create({
          data: {
            username: payload.username.trim().toLowerCase(),
            email: payload.email ? payload.email.trim().toLowerCase() : null,
            fullName: payload.fullName,
            password: payload.password,
            roleId: payload.roleId,
            isActive: payload.isActive !== false,
          },
          include: { role: true },
        });
        return NextResponse.json({ success: true, item: serializeUser(created) });
      }
      case "UPDATE_USER": {
        const updated = await prisma.appUser.update({
          where: { id: payload.id },
          data: {
            username: payload.username ? payload.username.trim().toLowerCase() : undefined,
            email: payload.email ? payload.email.trim().toLowerCase() : undefined,
            fullName: payload.fullName,
            password: payload.password,
            roleId: payload.roleId,
            isActive: payload.isActive !== false,
          },
          include: { role: true },
        });
        return NextResponse.json({ success: true, item: serializeUser(updated) });
      }
      case "DELETE_USER": {
        await prisma.appUser.delete({ where: { id: payload.id } });
        return NextResponse.json({ success: true, id: payload.id });
      }

      // ── Roles ──
      case "ADD_ROLE": {
        const roleName = String(payload.name || "").trim().toUpperCase().replace(/\s+/g, "_");
        if (!roleName) {
          return NextResponse.json({ success: false, error: "Role name is required" }, { status: 400 });
        }

        const existing = await prisma.customRole.findUnique({ where: { name: roleName } });
        if (existing) {
          return NextResponse.json(
            { success: false, error: `Role code "${roleName}" already exists.` },
            { status: 400 }
          );
        }

        const descPayload = JSON.stringify({
          display: payload.displayName || payload.name,
          desc: payload.description || "",
        });

        const created = await prisma.customRole.create({
          data: {
            name: roleName,
            description: descPayload,
            permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
            isSystem: false,
          },
        });
        return NextResponse.json({ success: true, item: serializeRole(created) });
      }

      case "DELETE_ROLE": {
        const target = await prisma.customRole.findUnique({ where: { id: payload.id } });
        if (!target) {
          return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
        }
        if (target.isSystem) {
          return NextResponse.json({ success: false, error: "System roles cannot be deleted." }, { status: 400 });
        }
        const userCount = await prisma.appUser.count({ where: { roleId: payload.id } });
        if (userCount > 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Cannot delete role. There are ${userCount} user account(s) assigned to this role.`,
            },
            { status: 400 }
          );
        }
        await prisma.customRole.delete({ where: { id: payload.id } });
        return NextResponse.json({ success: true, id: payload.id });
      }

      case "UPDATE_ROLE_PERMS": {
        const updated = await prisma.customRole.update({
          where: { id: payload.roleId },
          data: { permissions: payload.permissions },
        });
        return NextResponse.json({ success: true, item: serializeRole(updated) });
      }

      // ── Bulk CSV Import ──
      case "IMPORT_CSV_BATCH": {
        const target = payload.target || "ALL_DATA";
        const rows: Record<string, any>[] = Array.isArray(payload.rows) ? payload.rows : [];

        if (rows.length === 0) {
          return NextResponse.json({ success: true, count: 0, message: "No records found in CSV file." });
        }

        const getVal = (row: Record<string, any>, possibleKeys: string[]): string => {
          for (const key of possibleKeys) {
            const cleanKey = key.toLowerCase().trim();
            for (const rk of Object.keys(row)) {
              if (rk.toLowerCase().trim() === cleanKey) {
                return String(row[rk] ?? "").trim();
              }
            }
          }
          return "";
        };

        const parseNum = (row: Record<string, any>, possibleKeys: string[], defaultVal = 0): number => {
          const val = getVal(row, possibleKeys);
          if (!val) return defaultVal;
          const cleaned = val.replace(/[^0-9.-]/g, "");
          const num = parseFloat(cleaned);
          return isNaN(num) ? defaultVal : num;
        };

        const parseDate = (val: string): Date => {
          if (!val || val === "-") return new Date();
          const d = new Date(val);
          return isNaN(d.getTime()) ? new Date() : d;
        };

        const parsePaymentMode = (val: string): any => {
          const m = val.toUpperCase().trim();
          if (m.includes("CASH")) return "CASH";
          if (m.includes("BANK") || m.includes("TRANSFER") || m.includes("NEFT") || m.includes("RTGS") || m.includes("IMPS")) return "BANK_TRANSFER";
          if (m.includes("CHEQUE") || m.includes("CHECK")) return "CHEQUE";
          if (m.includes("UPI") || m.includes("GPAY") || m.includes("PHONEPE")) return "UPI";
          return "CASH";
        };

        const parseExpenseCat = (val: string): any => {
          const c = val.toUpperCase().trim().replace(/[\s-]/g, "_");
          const valid = [
            "PETROL_FUEL",
            "ROOM_RENT",
            "FOOD_TEA_REFRESHMENTS",
            "MACHINERY_RENT",
            "SITE_PERMIT_FEES",
            "OUTSIDE_LABOR",
            "SALARY_ADVANCE",
            "OFFICE_OVERHEAD",
            "MISCELLANEOUS",
          ];
          if (valid.includes(c)) return c;
          if (c.includes("FUEL") || c.includes("PETROL")) return "PETROL_FUEL";
          if (c.includes("RENT") && c.includes("ROOM")) return "ROOM_RENT";
          if (c.includes("RENT") && (c.includes("MACHIN") || c.includes("EQUIP"))) return "MACHINERY_RENT";
          if (c.includes("FOOD") || c.includes("TEA")) return "FOOD_TEA_REFRESHMENTS";
          if (c.includes("PERMIT") || c.includes("FEE")) return "SITE_PERMIT_FEES";
          if (c.includes("OUTSIDE") || c.includes("LABOR") || c.includes("LABOUR")) return "OUTSIDE_LABOR";
          if (c.includes("SALARY") || c.includes("ADVANCE")) return "SALARY_ADVANCE";
          if (c.includes("OFFICE") || c.includes("OVERHEAD")) return "OFFICE_OVERHEAD";
          return "MISCELLANEOUS";
        };

        let importedCount = 0;

        const existingSites: any[] = await prisma.site.findMany();
        const existingVendors: any[] = await prisma.vendor.findMany();
        const existingWorkers: any[] = await prisma.worker.findMany();

        const findOrCreateSite = async (name: string, clientName?: string) => {
          const trimmed = (name || "").trim();
          if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "general" || trimmed.toLowerCase() === "head office") {
            if (existingSites.length > 0) return existingSites[0];
            const defSite = await (prisma as any).site.create({
              data: { name: "Main Project", clientName: clientName || "Client", location: "Active Site", status: "ACTIVE" },
            });
            existingSites.push(defSite);
            return defSite;
          }
          let found = existingSites.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
          if (!found) {
            found = await (prisma as any).site.create({
              data: { name: trimmed, clientName: clientName || "Client", location: "Active Site", status: "ACTIVE" },
            });
            existingSites.push(found);
          }
          return found;
        };

        const findOrCreateVendor = async (name: string, category?: string) => {
          const trimmed = (name || "").trim();
          if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "vendor") {
            if (existingVendors.length > 0) return existingVendors[0];
            const defVen = await (prisma as any).vendor.create({
              data: { name: "General Materials Vendor", tradeCategory: category || "General Materials" },
            });
            existingVendors.push(defVen);
            return defVen;
          }
          let found = existingVendors.find((v) => v.name.toLowerCase() === trimmed.toLowerCase());
          if (!found) {
            found = await (prisma as any).vendor.create({
              data: { name: trimmed, tradeCategory: category || "General Materials" },
            });
            existingVendors.push(found);
          }
          return found;
        };

        const findOrCreateWorker = async (name: string, trade?: string) => {
          const trimmed = (name || "").trim();
          if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "worker") {
            if (existingWorkers.length > 0) return existingWorkers[0];
            const defW = await (prisma as any).worker.create({
              data: { name: "General Worker", trade: trade || "Helper", compensationType: "DAILY_WAGE" },
            });
            existingWorkers.push(defW);
            return defW;
          }
          let found = existingWorkers.find((w) => w.name.toLowerCase() === trimmed.toLowerCase());
          if (!found) {
            found = await (prisma as any).worker.create({
              data: { name: trimmed, trade: trade || "Helper", compensationType: "DAILY_WAGE" },
            });
            existingWorkers.push(found);
          }
          return found;
        };

        if (target === "ALL_DATA") {
          for (const row of rows) {
            const type = getVal(row, ["Transaction Type", "Type", "Transaction"]).toLowerCase();
            const date = parseDate(getVal(row, ["Date", "Transaction Date"]));
            const siteName = getVal(row, ["Site Name", "Site", "Project"]);
            const party = getVal(row, ["Party / Worker / Vendor / Client", "Party", "Vendor", "Worker", "Client", "Name"]);
            const category = getVal(row, ["Category / Trade", "Category", "Trade"]);
            const reference = getVal(row, ["Voucher / Reference #", "Voucher", "Reference", "Voucher No", "Bill No", "Reference No"]);
            const paymentMode = parsePaymentMode(getVal(row, ["Payment Mode", "Mode"]));
            const inflow = parseNum(row, ["Inflow Amount (INR)", "Inflow", "Credit"]);
            const outflow = parseNum(row, ["Outflow Amount (INR)", "Outflow", "Debit", "Amount"]);
            const notes = getVal(row, ["Notes & Descriptions", "Notes", "Description"]);

            if (type.includes("client") || type.includes("inflow")) {
              const amount = inflow > 0 ? inflow : outflow;
              if (amount > 0) {
                const s = await findOrCreateSite(siteName, party);
                await prisma.siteIncome.create({
                  data: {
                    siteId: s.id,
                    amount,
                    receivedFrom: party || s.clientName || "Client",
                    incomeDate: date,
                    paymentMode,
                    referenceNo: reference && reference !== "-" ? reference : "",
                    notes,
                  },
                });
                importedCount++;
              }
            } else if (type.includes("material") || type.includes("purchase") || type.includes("bill")) {
              const amount = outflow > 0 ? outflow : inflow;
              if (amount > 0) {
                const s = await findOrCreateSite(siteName);
                const v = await findOrCreateVendor(party, category);
                await prisma.vendorPurchase.create({
                  data: {
                    vendorId: v.id,
                    siteId: s.id,
                    purchaseDate: date,
                    amount,
                    voucherNo: reference && reference !== "-" ? reference : "",
                    notes,
                  },
                });
                importedCount++;
              }
            } else if ((type.includes("wage") && !type.includes("payment")) || type.includes("work log") || type.includes("labor")) {
              const amount = outflow > 0 ? outflow : inflow;
              if (amount > 0) {
                const s = await findOrCreateSite(siteName);
                const w = await findOrCreateWorker(party, category);
                await prisma.workerWorkLog.create({
                  data: {
                    workerId: w.id,
                    siteId: s.id,
                    workDate: date,
                    wageAmount: amount,
                    notes,
                  },
                });
                importedCount++;
              }
            } else if (type.includes("vendor payment")) {
              const amount = outflow > 0 ? outflow : inflow;
              if (amount > 0) {
                const v = await findOrCreateVendor(party, category);
                const s = siteName && siteName !== "-" ? await findOrCreateSite(siteName) : null;
                await prisma.vendorPayment.create({
                  data: {
                    vendorId: v.id,
                    siteId: s ? s.id : null,
                    paymentDate: date,
                    amount,
                    paymentMode,
                    voucherNo: reference && reference !== "-" ? reference : "",
                    notes,
                  },
                });
                importedCount++;
              }
            } else if (type.includes("wage payment") || type.includes("worker payment")) {
              const amount = outflow > 0 ? outflow : inflow;
              if (amount > 0) {
                const w = await findOrCreateWorker(party, category);
                await prisma.workerPayment.create({
                  data: {
                    workerId: w.id,
                    paymentDate: date,
                    amount,
                    paymentMode,
                    voucherNo: reference && reference !== "-" ? reference : "",
                    notes,
                  },
                });
                importedCount++;
              }
            } else if (type.includes("salary")) {
              const amount = outflow > 0 ? outflow : inflow;
              if (amount > 0) {
                const w = await findOrCreateWorker(party, category);
                const slipNumber = reference && reference !== "-" ? reference : `SLIP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const monthStr = date.toISOString().slice(0, 7);
                await (prisma as any).salarySlip.create({
                  data: {
                    slipNumber,
                    workerId: w.id,
                    workerName: w.name,
                    workerTrade: category || w.trade,
                    monthYear: monthStr,
                    monthLabel: monthStr,
                    paymentDate: date,
                    baseSalary: amount,
                    advanceDeductions: 0,
                    netPayableAmount: amount,
                    paymentMode,
                    notes,
                  },
                });
                importedCount++;
              }
            } else if (type.includes("expense") || type.includes("overhead")) {
              const amount = outflow > 0 ? outflow : inflow;
              if (amount > 0) {
                const s = siteName && siteName !== "-" && siteName.toLowerCase() !== "head office" ? await findOrCreateSite(siteName) : null;
                const categoryEnum = parseExpenseCat(category);
                await prisma.companyExpense.create({
                  data: {
                    amount,
                    category: categoryEnum,
                    siteId: s ? s.id : null,
                    expenseDate: date,
                    paymentMode,
                    voucherNo: reference && reference !== "-" ? reference : "",
                    notes,
                  },
                });
                importedCount++;
              }
            }
          }
        } else if (target === "SITES") {
          for (const row of rows) {
            const name = getVal(row, ["Site Name", "Name", "Site"]);
            if (name) {
              const clientName = getVal(row, ["Client Name", "Client"]) || "Direct Client";
              const location = getVal(row, ["Location", "City", "Address"]);
              const statusRaw = getVal(row, ["Status", "Project Status"]).toUpperCase();
              const status = ["ACTIVE", "COMPLETED", "ON_HOLD"].includes(statusRaw) ? statusRaw : "ACTIVE";
              const estimatedBudget = parseNum(row, ["Estimated Budget", "Budget"]);
              const openingBalance = parseNum(row, ["Opening Balance"]);
              await (prisma as any).site.create({
                data: { name, clientName, location, status, estimatedBudget, openingBalance },
              });
              importedCount++;
            }
          }
        } else if (target === "VENDORS") {
          for (const row of rows) {
            const name = getVal(row, ["Vendor Name", "Name", "Vendor", "Party", "Party / Worker / Vendor / Client"]);
            if (name) {
              const phone = getVal(row, ["Phone", "Mobile", "Contact"]);
              const tradeCategory = getVal(row, ["Category", "Trade Category", "Trade"]) || "General Materials";
              const openingBalance = parseNum(row, ["Opening Balance"]);
              const notes = getVal(row, ["Notes", "Description"]);
              await (prisma as any).vendor.create({
                data: { name, phone, tradeCategory, notes, openingBalance },
              });
              importedCount++;
            }
          }
        } else if (target === "WORKERS") {
          for (const row of rows) {
            const name = getVal(row, ["Worker Name", "Name", "Worker", "Party", "Party / Worker / Vendor / Client"]);
            if (name) {
              const phone = getVal(row, ["Phone", "Mobile", "Contact"]);
              const trade = getVal(row, ["Trade / Role", "Trade", "Role"]) || "Helper";
              const compRaw = getVal(row, ["Compensation Type"]).toUpperCase();
              const compensationType = ["DAILY_WAGE", "MONTHLY_SALARY"].includes(compRaw) ? compRaw : "DAILY_WAGE";
              const defaultDailyWage = parseNum(row, ["Daily Wage", "Default Daily Wage"]);
              const monthlySalary = parseNum(row, ["Monthly Salary"]);
              const openingBalance = parseNum(row, ["Opening Balance"]);
              const isActive = getVal(row, ["Status"]).toLowerCase() !== "inactive";
              await (prisma as any).worker.create({
                data: { name, phone, trade, compensationType, defaultDailyWage, monthlySalary, openingBalance, isActive },
              });
              importedCount++;
            }
          }
        } else if (target === "PURCHASES") {
          for (const row of rows) {
            const amount = parseNum(row, ["Amount", "Bill Amount", "Outflow Amount (INR)", "Outflow"]);
            if (amount > 0) {
              const vendorName = getVal(row, ["Vendor Name", "Vendor", "Party / Worker / Vendor / Client", "Party"]);
              const siteName = getVal(row, ["Site Name", "Site"]);
              const v = await findOrCreateVendor(vendorName);
              const s = await findOrCreateSite(siteName);
              await prisma.vendorPurchase.create({
                data: {
                  vendorId: v.id,
                  siteId: s.id,
                  amount,
                  voucherNo: getVal(row, ["Voucher / Reference #", "Voucher No", "Bill No"]),
                  purchaseDate: parseDate(getVal(row, ["Date", "Purchase Date"])),
                  notes: getVal(row, ["Notes", "Description", "Notes & Descriptions"]),
                },
              });
              importedCount++;
            }
          }
        } else if (target === "WORK_LOGS") {
          for (const row of rows) {
            const amount = parseNum(row, ["Wage Amount", "Wage Earned", "Amount", "Outflow Amount (INR)", "Outflow"]);
            if (amount > 0) {
              const workerName = getVal(row, ["Worker Name", "Worker", "Party / Worker / Vendor / Client", "Party"]);
              const siteName = getVal(row, ["Site Name", "Site"]);
              const w = await findOrCreateWorker(workerName);
              const s = await findOrCreateSite(siteName);
              await prisma.workerWorkLog.create({
                data: {
                  workerId: w.id,
                  siteId: s.id,
                  wageAmount: amount,
                  workDate: parseDate(getVal(row, ["Work Date", "Date"])),
                  notes: getVal(row, ["Notes", "Description", "Notes & Descriptions"]),
                },
              });
              importedCount++;
            }
          }
        } else if (target === "EXPENSES") {
          for (const row of rows) {
            const amount = parseNum(row, ["Amount", "Outflow Amount (INR)", "Outflow"]);
            if (amount > 0) {
              const siteName = getVal(row, ["Site Name", "Site"]);
              const s = siteName && siteName !== "-" ? await findOrCreateSite(siteName) : null;
              await prisma.companyExpense.create({
                data: {
                  amount,
                  category: parseExpenseCat(getVal(row, ["Expense Category", "Category", "Category / Trade"])),
                  siteId: s ? s.id : null,
                  expenseDate: parseDate(getVal(row, ["Date", "Expense Date"])),
                  paymentMode: parsePaymentMode(getVal(row, ["Payment Mode", "Mode"])),
                  voucherNo: getVal(row, ["Voucher No", "Voucher / Reference #"]),
                  notes: getVal(row, ["Notes", "Notes & Descriptions"]),
                },
              });
              importedCount++;
            }
          }
        } else if (target === "INCOMES") {
          for (const row of rows) {
            const amount = parseNum(row, ["Amount", "Inflow Amount (INR)", "Inflow", "Credit"]);
            if (amount > 0) {
              const siteName = getVal(row, ["Site Name", "Site"]);
              const s = await findOrCreateSite(siteName);
              await prisma.siteIncome.create({
                data: {
                  siteId: s.id,
                  amount,
                  receivedFrom: getVal(row, ["Received From", "Client", "Party / Worker / Vendor / Client", "Party"]),
                  incomeDate: parseDate(getVal(row, ["Date", "Income Date"])),
                  paymentMode: parsePaymentMode(getVal(row, ["Payment Mode", "Mode"])),
                  referenceNo: getVal(row, ["Reference / Cheque No", "Reference", "Voucher / Reference #"]),
                  notes: getVal(row, ["Notes", "Notes & Descriptions"]),
                },
              });
              importedCount++;
            }
          }
        }

        return NextResponse.json({
          success: true,
          count: importedCount,
          target,
          message: `Successfully imported ${importedCount} records into ${target} from CSV!`,
        });
      }

      default:
        return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("POST /api/data database mutation failed:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to persist to database" },
      { status: 500 }
    );
  }
}
