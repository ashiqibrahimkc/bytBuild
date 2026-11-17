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
  return {
    id: r.id,
    name: r.name,
    displayName: r.name === "OWNER" ? "Company Owner" : r.name === "MANAGER" ? "Site Project Manager" : "Head Accountant",
    description: r.description || "",
    permissions: r.permissions,
    isSystem: r.isSystem,
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
        const created = await prisma.site.create({
          data: {
            name: payload.name,
            clientName: payload.clientName,
            location: payload.location || "",
            status: payload.status || "ACTIVE",
            estimatedBudget: payload.estimatedBudget || 0,
            openingBalance: payload.openingBalance || 0,
          },
        });
        return NextResponse.json({ success: true, item: serializeSite(created) });
      }
      case "UPDATE_SITE": {
        const updated = await prisma.site.update({
          where: { id: payload.id },
          data: {
            name: payload.name,
            clientName: payload.clientName,
            location: payload.location || "",
            status: payload.status,
            estimatedBudget: payload.estimatedBudget || 0,
            openingBalance: payload.openingBalance || 0,
          },
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
        const created = await prisma.vendor.create({
          data: {
            name: payload.name,
            phone: payload.phone || "",
            tradeCategory: payload.tradeCategory || "",
            notes: payload.notes || "",
            openingBalance: payload.openingBalance || 0,
          },
        });
        return NextResponse.json({ success: true, item: serializeVendor(created) });
      }
      case "UPDATE_VENDOR": {
        const updated = await prisma.vendor.update({
          where: { id: payload.id },
          data: {
            name: payload.name,
            phone: payload.phone || "",
            tradeCategory: payload.tradeCategory || "",
            notes: payload.notes || "",
            openingBalance: payload.openingBalance || 0,
          },
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
        const created = await prisma.worker.create({
          data: {
            name: payload.name,
            phone: payload.phone || "",
            trade: payload.trade || "Helper",
            compensationType: payload.compensationType || "DAILY_WAGE",
            defaultDailyWage: payload.defaultDailyWage || 0,
            monthlySalary: payload.monthlySalary || 0,
            openingBalance: payload.openingBalance || 0,
            isActive: payload.isActive !== false,
          },
        });
        return NextResponse.json({ success: true, item: serializeWorker(created) });
      }
      case "UPDATE_WORKER": {
        const updated = await prisma.worker.update({
          where: { id: payload.id },
          data: {
            name: payload.name,
            phone: payload.phone || "",
            trade: payload.trade,
            compensationType: payload.compensationType,
            defaultDailyWage: payload.defaultDailyWage || 0,
            monthlySalary: payload.monthlySalary || 0,
            openingBalance: payload.openingBalance || 0,
            isActive: payload.isActive !== false,
          },
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
      case "UPDATE_ROLE_PERMS": {
        const updated = await prisma.customRole.update({
          where: { id: payload.roleId },
          data: { permissions: payload.permissions },
        });
        return NextResponse.json({ success: true, item: serializeRole(updated) });
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
