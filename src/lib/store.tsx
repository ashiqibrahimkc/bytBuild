"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  UserRole,
  PagePermission,
  CustomRole,
  AppUser,
  AuditLog,
  Site,
  SiteStatus,
  Vendor,
  VendorPurchase,
  VendorPayment,
  Worker,
  WorkerWorkLog,
  WorkerPayment,
  SiteIncome,
  CompanyExpense,
  SalarySlip,
  WorkerCompensationType,
} from "./types";

interface ConstructionContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  isDbLoading?: boolean;

  roles: CustomRole[];
  users: AppUser[];
  auditLogs: AuditLog[];

  sites: Site[];
  vendors: Vendor[];
  workers: Worker[];
  vendorPurchases: VendorPurchase[];
  vendorPayments: VendorPayment[];
  workerWorkLogs: WorkerWorkLog[];
  workerPayments: WorkerPayment[];
  siteIncomes: SiteIncome[];
  companyExpenses: CompanyExpense[];
  salarySlips: SalarySlip[];

  // Salary Slips & Monthly Payroll
  generateSalarySlip: (
    data: Omit<SalarySlip, "id" | "slipNumber" | "createdAt">
  ) => { success: boolean; message: string; slip?: SalarySlip };
  deleteSalarySlip: (slipId: string) => void;
  getWorkerMonthlySalaryInfo: (
    workerId: string,
    monthYear: string
  ) => {
    worker?: Worker;
    monthlySalary: number;
    advanceDeductions: number;
    advanceList: CompanyExpense[];
    netPayableAmount: number;
    alreadyGenerated: boolean;
    existingSlip: SalarySlip | null;
  };

  // RBAC Permission Checker
  canAccessPage: (permission: PagePermission) => boolean;
  createCustomRole: (role: Omit<CustomRole, "id" | "createdAt">) => void;
  updateRolePermissions: (roleId: string, permissions: PagePermission[]) => void;
  createAppUser: (user: Omit<AppUser, "id" | "createdAt">) => boolean;
  deleteAppUser: (userId: string) => void;
  authenticateUser: (usernameOrEmail: string, password: string) => AppUser | null;

  // Audit Logger
  logAudit: (action: string, entity: string, entityId: string | undefined, details: string) => void;

  // Mutators
  addSite: (site: Omit<Site, "id" | "createdAt">) => void;
  updateSite: (id: string, site: Partial<Omit<Site, "id" | "createdAt">>) => void;
  deleteSite: (id: string, forceCascade?: boolean) => { success: boolean; message: string; linkedCount: number };
  addVendor: (vendor: Omit<Vendor, "id" | "createdAt">) => void;
  updateVendor: (id: string, vendor: Partial<Omit<Vendor, "id" | "createdAt">>) => void;
  deleteVendor: (id: string, forceCascade?: boolean) => { success: boolean; message: string; linkedCount: number };
  addWorker: (worker: Omit<Worker, "id" | "createdAt">) => void;
  updateWorker: (id: string, worker: Partial<Omit<Worker, "id" | "createdAt">>) => void;
  deleteWorker: (id: string, forceCascade?: boolean) => { success: boolean; message: string; linkedCount: number };

  // Interconnected Actions
  recordMaterialPurchase: (purchase: Omit<VendorPurchase, "id" | "createdAt">) => void;
  updateVendorPurchase: (id: string, purchase: Partial<Omit<VendorPurchase, "id" | "createdAt">>) => void;
  deleteVendorPurchase: (id: string) => void;
  recordVendorPayment: (payment: Omit<VendorPayment, "id" | "createdAt">) => void;
  updateVendorPayment: (id: string, payment: Partial<Omit<VendorPayment, "id" | "createdAt">>) => void;
  deleteVendorPayment: (id: string) => void;
  assignWorkerWorkLog: (log: Omit<WorkerWorkLog, "id" | "createdAt">) => void;
  updateWorkerWorkLog: (id: string, log: Partial<Omit<WorkerWorkLog, "id" | "createdAt">>) => void;
  deleteWorkerWorkLog: (id: string) => void;
  recordWorkerPayment: (payment: Omit<WorkerPayment, "id" | "createdAt">) => void;
  updateWorkerPayment: (id: string, payment: Partial<Omit<WorkerPayment, "id" | "createdAt">>) => void;
  deleteWorkerPayment: (id: string) => void;
  recordSiteIncome: (income: Omit<SiteIncome, "id" | "createdAt">) => void;
  updateSiteIncome: (id: string, income: Partial<Omit<SiteIncome, "id" | "createdAt">>) => void;
  deleteSiteIncome: (id: string) => void;
  recordCompanyExpense: (expense: Omit<CompanyExpense, "id" | "createdAt">) => void;
  updateCompanyExpense: (id: string, expense: Partial<Omit<CompanyExpense, "id" | "createdAt">>) => void;
  deleteCompanyExpense: (id: string) => void;

  // Calculated Metrics
  getVendorStats: (vendorId: string) => {
    totalPurchased: number;
    totalPaid: number;
    outstandingBalance: number;
  };
  getWorkerStats: (workerId: string) => {
    totalEarned: number;
    totalPaid: number;
    outstandingBalance: number;
  };
  getSiteStats: (siteId: string) => {
    totalIncome: number;
    materialExpense: number;
    laborExpense: number;
    miscExpense: number;
    totalExpense: number;
    netMargin: number;
  };
  getMasterCashFlow: () => {
    totalCashReceived: number;
    totalVendorCashPaid: number;
    totalWorkerCashPaid: number;
    totalOverheadCashPaid: number;
    totalCashOutflow: number;
    currentCashInHand: number;
    totalVendorPayables: number;
    totalWorkerPayables: number;
    cashInBank: number;
    cashInPhysicalBox: number;
  };

  // Helper & Disaster Recovery
  loadScaleData: (siteCount?: number, workerCount?: number, vendorCount?: number) => void;
  clearAllData: () => void;
  exportFullBackupPayload: () => Record<string, any>;
  restoreFullBackupPayload: (backupJson: Record<string, any>) => { success: boolean; message: string };
}

const ConstructionContext = createContext<ConstructionContextType | undefined>(undefined);

// ─── Initial Roles & Permissions ──────────────────────────────────────────
const INITIAL_ROLES: CustomRole[] = [
  {
    id: "role-owner",
    name: "OWNER",
    displayName: "Company Owner",
    description: "Full financial authority, cash flow in hand, audit logs, and user role administration.",
    permissions: [
      "dashboard",
      "sites",
      "vendors",
      "workers",
      "salary-slips",
      "cashflow",
      "company-expenses",
      "reports",
      "audit-logs",
      "team-roles",
      "backup",
    ],
    isSystem: true,
    createdAt: "2026-11-14",
  },
  {
    id: "role-manager",
    name: "MANAGER",
    displayName: "Site Project Manager",
    description: "Field supervisor: logs site materials, worker attendance, and day-to-day site progress.",
    permissions: ["dashboard", "sites", "vendors", "workers", "company-expenses", "reports"],
    isSystem: true,
    createdAt: "2026-11-14",
  },
  {
    id: "role-accountant",
    name: "ACCOUNTANT",
    displayName: "Head Accountant",
    description: "Finance role: manages vendor credits, worker salary disbursements, overhead, and cash flow ledger.",
    permissions: [
      "dashboard",
      "vendors",
      "workers",
      "salary-slips",
      "cashflow",
      "company-expenses",
      "reports",
      "backup",
    ],
    isSystem: true,
    createdAt: "2026-11-14",
  },
];

// ─── Initial Users: Empty (No hardcoded accounts or credentials) ─────────
const INITIAL_USERS: AppUser[] = [];

// ─── Clean Fresh Empty Collections ────────────────────────────────────────
const INITIAL_AUDIT_LOGS: AuditLog[] = [];
const INITIAL_SITES: Site[] = [];
const INITIAL_VENDORS: Vendor[] = [];
const INITIAL_WORKERS: Worker[] = [];
const INITIAL_PURCHASES: VendorPurchase[] = [];
const INITIAL_VENDOR_PAYMENTS: VendorPayment[] = [];
const INITIAL_WORK_LOGS: WorkerWorkLog[] = [];
const INITIAL_WORKER_PAYMENTS: WorkerPayment[] = [];
const INITIAL_INCOMES: SiteIncome[] = [];
const INITIAL_EXPENSES: CompanyExpense[] = [];

export function ConstructionProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("OWNER");
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Company Name (Customer: MK Builders)
  const [companyName, setCompanyNameState] = useState<string>("MK Builders");

  const setCompanyName = useCallback((name: string) => {
    setCompanyNameState(name);
  }, []);

  // ─── Database-Backed Live Collections ────────────────────────────────────
  const [roles, setRoles] = useState<CustomRole[]>(INITIAL_ROLES);
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [vendorPurchases, setVendorPurchases] = useState<VendorPurchase[]>([]);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>([]);
  const [workerWorkLogs, setWorkerWorkLogs] = useState<WorkerWorkLog[]>([]);
  const [workerPayments, setWorkerPayments] = useState<WorkerPayment[]>([]);
  const [siteIncomes, setSiteIncomes] = useState<SiteIncome[]>([]);
  const [companyExpenses, setCompanyExpenses] = useState<CompanyExpense[]>([]);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // API Mutation Helper to execute transactions in PostgreSQL database
  const apiMutation = useCallback(async (action: string, payload: any) => {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(`[DB Error] Mutation ${action} failed:`, err);
        return null;
      }
      return await res.json().catch(() => null);
    } catch (err) {
      console.error(`[DB Network Error] Mutation ${action}:`, err);
      return null;
    }
  }, []);

  // Fetch all live records directly from PostgreSQL Database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDatabaseData() {
      try {
        const res = await fetch("/api/data");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setSites(json.data.sites || []);
            setVendors(json.data.vendors || []);
            setWorkers(json.data.workers || []);
            setVendorPurchases(json.data.vendorPurchases || []);
            setVendorPayments(json.data.vendorPayments || []);
            setWorkerWorkLogs(json.data.workerWorkLogs || []);
            setWorkerPayments(json.data.workerPayments || []);
            setSiteIncomes(json.data.siteIncomes || []);
            setCompanyExpenses(json.data.companyExpenses || []);
            setSalarySlips(json.data.salarySlips || []);
            if (json.data.roles && json.data.roles.length > 0) setRoles(json.data.roles);
            if (json.data.users) setUsers(json.data.users);
            if (json.data.auditLogs) setAuditLogs(json.data.auditLogs);
          }
        }
      } catch (err) {
        console.error("[DB Error] Failed to load data from database:", err);
      } finally {
        if (isMounted) setIsDbLoading(false);
      }
    }
    loadDatabaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load session user from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved =
          localStorage.getItem("bytbuild_user") || localStorage.getItem("buildflow_user");
        if (saved) {
          const parsed = JSON.parse(saved);
          const matched = users.find(
            (u) =>
              u.username.toLowerCase() === (parsed.username || "").toLowerCase() ||
              u.email?.toLowerCase() === (parsed.email || "").toLowerCase()
          );
          if (matched) {
            setCurrentUser(matched);
            const matchedRole = roles.find((r) => r.id === matched.roleId);
            if (matchedRole) setRoleState(matchedRole.name);
          } else if (parsed.role) {
            setRoleState(parsed.role);
          }
        }
      } catch { }
    }
  }, [users, roles]);

  const setRole = (newRoleName: UserRole) => {
    setRoleState(newRoleName);
    const matched = users.find((u) => {
      const r = roles.find((rl) => rl.id === u.roleId);
      return r?.name.toUpperCase() === newRoleName.toUpperCase();
    });
    if (matched) {
      setCurrentUser(matched);
      localStorage.setItem(
        "bytbuild_user",
        JSON.stringify({
          id: matched.id,
          username: matched.username,
          email: matched.email,
          fullName: matched.fullName,
          role: newRoleName,
        })
      );
      localStorage.setItem(
        "buildflow_user",
        JSON.stringify({
          id: matched.id,
          username: matched.username,
          email: matched.email,
          fullName: matched.fullName,
          role: newRoleName,
        })
      );
    }
  };

  // ─── Audit Logger Helper ────────────────────────────────────────────────
  const logAudit = useCallback(
    (action: string, entity: string, entityId: string | undefined, details: string) => {
      const actorName = currentUser?.fullName || (role === "OWNER" ? "Owner" : "User");
      const actorRole = role;
      const now = new Date();
      const formatted = now.toISOString().replace("T", " ").slice(0, 19);

      const newLog: AuditLog = {
        id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        action,
        entity,
        entityId,
        details,
        actorName,
        actorRole,
        createdAt: formatted,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
      apiMutation("ADD_AUDIT_LOG", newLog);
    },
    [currentUser, role, apiMutation]
  );

  // ─── RBAC Access Checker ────────────────────────────────────────────────
  const canAccessPage = useCallback(
    (permission: PagePermission): boolean => {
      // Owner and Admin always have unrestricted authority over all pages
      const normalizedRole = role.toUpperCase();
      if (normalizedRole === "OWNER" || normalizedRole === "ADMIN") {
        return true;
      }

      const currentRoleDef = roles.find(
        (r) => r.name.toUpperCase() === normalizedRole
      );
      if (!currentRoleDef) {
        if (normalizedRole === "ACCOUNTANT")
          return [
            "dashboard",
            "vendors",
            "workers",
            "salary-slips",
            "cashflow",
            "company-expenses",
            "reports",
            "backup",
          ].includes(permission);
        if (normalizedRole === "MANAGER")
          return [
            "dashboard",
            "sites",
            "vendors",
            "workers",
            "company-expenses",
            "reports",
          ].includes(permission);
        return permission === "dashboard";
      }
      return currentRoleDef.permissions.includes(permission);
    },
    [roles, role]
  );

  // ─── Role & User Management ─────────────────────────────────────────────
  const createCustomRole = (roleData: Omit<CustomRole, "id" | "createdAt">) => {
    const newRole: CustomRole = {
      ...roleData,
      id: `role-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setRoles((prev) => [...prev, newRole]);
    logAudit(
      "CREATE_ROLE",
      "CustomRole",
      newRole.id,
      `Created role "${newRole.displayName}" with permissions: [${newRole.permissions.join(", ")}]`
    );
  };

  const updateRolePermissions = (roleId: string, permissions: PagePermission[]) => {
    const targetRole = roles.find((r) => r.id === roleId);
    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, permissions } : r))
    );
    apiMutation("UPDATE_ROLE_PERMS", { roleId, permissions });
    logAudit(
      "UPDATE_PERMISSIONS",
      "CustomRole",
      roleId,
      `Updated permissions for role "${targetRole?.displayName || roleId}" to: [${permissions.join(", ")}]`
    );
  };

  const createAppUser = (userData: Omit<AppUser, "id" | "createdAt">): boolean => {
    const exists = users.some(
      (u) =>
        u.username.toLowerCase() === userData.username.toLowerCase() ||
        (userData.email && u.email?.toLowerCase() === userData.email.toLowerCase())
    );
    if (exists) return false;

    const tempId = `user-${Date.now()}`;
    const newUser: AppUser = {
      ...userData,
      id: tempId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, newUser]);

    apiMutation("ADD_USER", userData).then((res) => {
      if (res?.success && res.item) {
        setUsers((prev) => prev.map((u) => (u.id === tempId ? res.item : u)));
      }
    });

    const assignedRole = roles.find((r) => r.id === newUser.roleId);
    logAudit(
      "CREATE_USER",
      "AppUser",
      tempId,
      `Created user account "${newUser.username}" (${newUser.fullName}) with role "${assignedRole?.displayName || "Member"}"`
    );
    return true;
  };

  const deleteAppUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    apiMutation("DELETE_USER", { id: userId });
    logAudit(
      "DELETE_USER",
      "AppUser",
      userId,
      `Deleted user account "${target?.username || userId}"`
    );
  };

  const authenticateUser = (usernameOrEmail: string, password: string): AppUser | null => {
    const q = usernameOrEmail.trim().toLowerCase();
    const matched = users.find(
      (u) =>
        (u.username.toLowerCase() === q || u.email?.toLowerCase() === q) &&
        u.password === password
    );
    return matched ?? null;
  };

  // ─── Operational Actions (Direct Database Sync) ─────────────────────────
  const addSite = (site: Omit<Site, "id" | "createdAt">) => {
    const openingBalance = site.openingBalance ? Number(site.openingBalance) : 0;
    const tempId = `site-${Date.now()}`;
    const newSite: Site = {
      ...site,
      openingBalance,
      id: tempId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setSites((prev) => [newSite, ...prev]);

    apiMutation("ADD_SITE", { ...site, openingBalance }).then((res) => {
      if (res?.success && res.item) {
        setSites((prev) => prev.map((s) => (s.id === tempId ? res.item : s)));
      }
    });

    logAudit(
      "CREATE_SITE",
      "Site",
      tempId,
      `Added site "${newSite.name}" for client "${newSite.clientName}" with budget ₹${newSite.estimatedBudget}${newSite.openingBalance ? ` (Opening Balance: ₹${newSite.openingBalance})` : ""}`
    );
  };

  const addVendor = (vendor: Omit<Vendor, "id" | "createdAt">) => {
    const openingBalance = vendor.openingBalance ? Number(vendor.openingBalance) : 0;
    const tempId = `ven-${Date.now()}`;
    const newVendor: Vendor = {
      ...vendor,
      openingBalance,
      id: tempId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setVendors((prev) => [newVendor, ...prev]);

    apiMutation("ADD_VENDOR", { ...vendor, openingBalance }).then((res) => {
      if (res?.success && res.item) {
        setVendors((prev) => prev.map((v) => (v.id === tempId ? res.item : v)));
      }
    });

    logAudit(
      "CREATE_VENDOR",
      "Vendor",
      tempId,
      `Added material vendor "${newVendor.name}" (${newVendor.tradeCategory})${newVendor.openingBalance ? ` (Opening Balance: ₹${newVendor.openingBalance})` : ""}`
    );
  };

  const addWorker = (worker: Omit<Worker, "id" | "createdAt">) => {
    const openingBalance = worker.openingBalance ? Number(worker.openingBalance) : 0;
    const tempId = `w-${Date.now()}`;
    const newWorker: Worker = {
      ...worker,
      openingBalance,
      id: tempId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setWorkers((prev) => [newWorker, ...prev]);

    apiMutation("ADD_WORKER", { ...worker, openingBalance }).then((res) => {
      if (res?.success && res.item) {
        setWorkers((prev) => prev.map((w) => (w.id === tempId ? res.item : w)));
      }
    });

    logAudit(
      "CREATE_WORKER",
      "Worker",
      tempId,
      `Added worker "${newWorker.name}" (${newWorker.trade}) with daily wage ₹${newWorker.defaultDailyWage}${newWorker.openingBalance ? ` (Opening Balance: ₹${newWorker.openingBalance})` : ""}`
    );
  };

  const updateSite = (id: string, updatedFields: Partial<Omit<Site, "id" | "createdAt">>) => {
    setSites((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s))
    );
    apiMutation("UPDATE_SITE", { id, ...updatedFields });
    const existing = sites.find((s) => s.id === id);
    logAudit(
      "UPDATE_SITE",
      "Site",
      id,
      `Updated site "${updatedFields.name || existing?.name || id}" details`
    );
  };

  const deleteSite = (
    id: string,
    forceCascade = false
  ): { success: boolean; message: string; linkedCount: number } => {
    const site = sites.find((s) => s.id === id);
    const purchases = vendorPurchases.filter((p) => p.siteId === id);
    const workLogs = workerWorkLogs.filter((w) => w.siteId === id);
    const incomes = siteIncomes.filter((i) => i.siteId === id);
    const expenses = companyExpenses.filter((e) => e.siteId === id);
    const vendorPays = vendorPayments.filter((vp) => vp.siteId === id);
    const linkedCount =
      purchases.length + workLogs.length + incomes.length + expenses.length + vendorPays.length;

    if (linkedCount > 0 && !forceCascade) {
      return {
        success: false,
        linkedCount,
        message: `Site "${site?.name || id}" is linked to ${purchases.length} purchases, ${workLogs.length} worker wage logs, ${incomes.length} client incomes, and ${expenses.length} overhead expenses.`,
      };
    }

    if (forceCascade) {
      setVendorPurchases((prev) => prev.filter((p) => p.siteId !== id));
      setWorkerWorkLogs((prev) => prev.filter((w) => w.siteId !== id));
      setSiteIncomes((prev) => prev.filter((i) => i.siteId !== id));
      setCompanyExpenses((prev) => prev.filter((e) => e.siteId !== id));
      setVendorPayments((prev) => prev.filter((vp) => vp.siteId !== id));
    }

    setSites((prev) => prev.filter((s) => s.id !== id));
    apiMutation("DELETE_SITE", { id, forceCascade });
    logAudit(
      "DELETE_SITE",
      "Site",
      id,
      `Deleted site "${site?.name || id}"${forceCascade ? ` along with ${linkedCount} cascaded relational records` : ""}`
    );

    return {
      success: true,
      linkedCount,
      message: `Site "${site?.name || id}" successfully deleted.`,
    };
  };

  const updateVendor = (id: string, updatedFields: Partial<Omit<Vendor, "id" | "createdAt">>) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updatedFields } : v))
    );
    apiMutation("UPDATE_VENDOR", { id, ...updatedFields });
    const existing = vendors.find((v) => v.id === id);
    logAudit(
      "UPDATE_VENDOR",
      "Vendor",
      id,
      `Updated vendor "${updatedFields.name || existing?.name || id}" details`
    );
  };

  const deleteVendor = (
    id: string,
    forceCascade = false
  ): { success: boolean; message: string; linkedCount: number } => {
    const ven = vendors.find((v) => v.id === id);
    const purchases = vendorPurchases.filter((p) => p.vendorId === id);
    const payments = vendorPayments.filter((vp) => vp.vendorId === id);
    const linkedCount = purchases.length + payments.length;

    if (linkedCount > 0 && !forceCascade) {
      return {
        success: false,
        linkedCount,
        message: `Vendor "${ven?.name || id}" is linked to ${purchases.length} material bills and ${payments.length} payment disbursements.`,
      };
    }

    if (forceCascade) {
      setVendorPurchases((prev) => prev.filter((p) => p.vendorId !== id));
      setVendorPayments((prev) => prev.filter((vp) => vp.vendorId !== id));
    }

    setVendors((prev) => prev.filter((v) => v.id !== id));
    apiMutation("DELETE_VENDOR", { id, forceCascade });
    logAudit(
      "DELETE_VENDOR",
      "Vendor",
      id,
      `Deleted vendor "${ven?.name || id}"${forceCascade ? ` along with ${linkedCount} linked bills and disbursements` : ""}`
    );

    return {
      success: true,
      linkedCount,
      message: `Vendor "${ven?.name || id}" successfully deleted.`,
    };
  };

  const updateWorker = (id: string, updatedFields: Partial<Omit<Worker, "id" | "createdAt">>) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updatedFields } : w))
    );
    apiMutation("UPDATE_WORKER", { id, ...updatedFields });
    const existing = workers.find((w) => w.id === id);
    logAudit(
      "UPDATE_WORKER",
      "Worker",
      id,
      `Updated worker "${updatedFields.name || existing?.name || id}" details`
    );
  };

  const deleteWorker = (
    id: string,
    forceCascade = false
  ): { success: boolean; message: string; linkedCount: number } => {
    const worker = workers.find((w) => w.id === id);
    const workLogs = workerWorkLogs.filter((w) => w.workerId === id);
    const payments = workerPayments.filter((wp) => wp.workerId === id);
    const linkedCount = workLogs.length + payments.length;

    if (linkedCount > 0 && !forceCascade) {
      return {
        success: false,
        linkedCount,
        message: `Worker "${worker?.name || id}" is linked to ${workLogs.length} daily wage logs and ${payments.length} wage disbursements.`,
      };
    }

    if (forceCascade) {
      setWorkerWorkLogs((prev) => prev.filter((w) => w.workerId !== id));
      setWorkerPayments((prev) => prev.filter((wp) => wp.workerId !== id));
    }

    setWorkers((prev) => prev.filter((w) => w.id !== id));
    apiMutation("DELETE_WORKER", { id, forceCascade });
    logAudit(
      "DELETE_WORKER",
      "Worker",
      id,
      `Deleted worker "${worker?.name || id}"${forceCascade ? ` along with ${linkedCount} linked wage logs and disbursements` : ""}`
    );

    return {
      success: true,
      linkedCount,
      message: `Worker "${worker?.name || id}" successfully deleted.`,
    };
  };

  const recordMaterialPurchase = (purchase: Omit<VendorPurchase, "id" | "createdAt">) => {
    const tempId = `pur-${Date.now()}`;
    const newPurchase: VendorPurchase = {
      ...purchase,
      id: tempId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setVendorPurchases((prev) => [newPurchase, ...prev]);

    apiMutation("ADD_PURCHASE", purchase).then((res) => {
      if (res?.success && res.item) {
        setVendorPurchases((prev) => prev.map((p) => (p.id === tempId ? res.item : p)));
      }
    });

    const ven = vendors.find((v) => v.id === purchase.vendorId);
    const site = sites.find((s) => s.id === purchase.siteId);
    logAudit(
      "PURCHASE_MATERIAL",
      "VendorPurchase",
      tempId,
      `Recorded purchase of ₹${purchase.amount} from "${ven?.name || "Vendor"}" for site "${site?.name || "Site"}" (Voucher: #${purchase.voucherNo || "N/A"})`
    );
  };

  const recordVendorPayment = (payment: Omit<VendorPayment, "id" | "createdAt">) => {
    const tempId = `vp-${Date.now()}`;
    const newPayment: VendorPayment = {
      ...payment,
      id: tempId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setVendorPayments((prev) => [newPayment, ...prev]);

    apiMutation("ADD_VENDOR_PAYMENT", payment).then((res) => {
      if (res?.success && res.item) {
        setVendorPayments((prev) => prev.map((p) => (p.id === tempId ? res.item : p)));
      }
    });

    const ven = vendors.find((v) => v.id === payment.vendorId);
    logAudit(
      "DISBURSE_PAYMENT",
      "VendorPayment",
      tempId,
      `Paid ₹${payment.amount} via ${payment.paymentMode} to vendor "${ven?.name || "Vendor"}" (Voucher: #${payment.voucherNo || "N/A"})`
    );
  };

  const assignWorkerWorkLog = (log: Omit<WorkerWorkLog, "id" | "createdAt">) => {
    const tempId = `wl-${Date.now()}`;
    const newLog: WorkerWorkLog = {
      ...log,
      id: tempId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setWorkerWorkLogs((prev) => [newLog, ...prev]);

    apiMutation("ADD_WORK_LOG", log).then((res) => {
      if (res?.success && res.item) {
        setWorkerWorkLogs((prev) => prev.map((w) => (w.id === tempId ? res.item : w)));
      }
    });

    const worker = workers.find((w) => w.id === log.workerId);
    const site = sites.find((s) => s.id === log.siteId);
    logAudit(
      "WAGE_LOG",
      "WorkerWorkLog",
      tempId,
      `Assigned worker "${worker?.name || "Worker"}" to site "${site?.name || "Site"}" with wage ₹${log.wageAmount}`
    );
  };

  const recordWorkerPayment = (payment: Omit<WorkerPayment, "id" | "createdAt">) => {
    const tempId = `wp-${Date.now()}`;
    const newPayment: WorkerPayment = {
      ...payment,
      id: tempId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setWorkerPayments((prev) => [newPayment, ...prev]);

    apiMutation("ADD_WORKER_PAYMENT", payment).then((res) => {
      if (res?.success && res.item) {
        setWorkerPayments((prev) => prev.map((p) => (p.id === tempId ? res.item : p)));
      }
    });

    const worker = workers.find((w) => w.id === payment.workerId);
    logAudit(
      "DISBURSE_PAYMENT",
      "WorkerPayment",
      tempId,
      `Disbursed ₹${payment.amount} wage via ${payment.paymentMode} to worker "${worker?.name || "Worker"}" (Voucher: #${payment.voucherNo || "N/A"})`
    );
  };

  const recordSiteIncome = (income: Omit<SiteIncome, "id" | "createdAt">) => {
    const tempId = `inc-${Date.now()}`;
    const newIncome: SiteIncome = {
      ...income,
      id: tempId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setSiteIncomes((prev) => [newIncome, ...prev]);

    apiMutation("ADD_SITE_INCOME", income).then((res) => {
      if (res?.success && res.item) {
        setSiteIncomes((prev) => prev.map((i) => (i.id === tempId ? res.item : i)));
      }
    });

    const site = sites.find((s) => s.id === income.siteId);
    logAudit(
      "RECORD_INCOME",
      "SiteIncome",
      tempId,
      `Received ₹${income.amount} client advance via ${income.paymentMode} for site "${site?.name || "Site"}" (Ref: ${income.referenceNo || "N/A"})`
    );
  };

  const recordCompanyExpense = (expense: Omit<CompanyExpense, "id" | "createdAt">) => {
    const tempId = `exp-${Date.now()}`;
    const newExpense: CompanyExpense = {
      ...expense,
      id: tempId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setCompanyExpenses((prev) => [newExpense, ...prev]);

    apiMutation("ADD_EXPENSE", expense).then((res) => {
      if (res?.success && res.item) {
        setCompanyExpenses((prev) => prev.map((e) => (e.id === tempId ? res.item : e)));
      }
    });

    const site = sites.find((s) => s.id === expense.siteId);
    const worker = expense.workerId ? workers.find((w) => w.id === expense.workerId) : null;
    logAudit(
      "RECORD_OVERHEAD",
      "CompanyExpense",
      tempId,
      expense.category === "SALARY_ADVANCE" && worker
        ? `Paid salary advance of ₹${expense.amount} to worker "${worker.name}" (${worker.trade}) via ${expense.paymentMode}`
        : `Recorded overhead expense of ₹${expense.amount} under "${expense.category}" via ${expense.paymentMode}${site ? ` allocated to site "${site.name}"` : " (Central Overhead)"}`
    );
  };

  // ─── Edit & Delete Operational Transactions ──────────────────────────────
  const updateVendorPurchase = (id: string, updates: Partial<Omit<VendorPurchase, "id" | "createdAt">>) => {
    setVendorPurchases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    apiMutation("UPDATE_PURCHASE", { id, ...updates });
    logAudit(
      "UPDATE_PURCHASE",
      "VendorPurchase",
      id,
      `Updated purchase bill #${updates.voucherNo || id} (Amount: ₹${updates.amount ?? "unchanged"})`
    );
  };

  const deleteVendorPurchase = (id: string) => {
    const target = vendorPurchases.find((p) => p.id === id);
    setVendorPurchases((prev) => prev.filter((p) => p.id !== id));
    apiMutation("DELETE_PURCHASE", { id });
    logAudit(
      "DELETE_PURCHASE",
      "VendorPurchase",
      id,
      `Deleted purchase bill of ₹${target?.amount || 0} (Voucher: #${target?.voucherNo || "N/A"})`
    );
  };

  const updateWorkerWorkLog = (id: string, updates: Partial<Omit<WorkerWorkLog, "id" | "createdAt">>) => {
    setWorkerWorkLogs((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
    apiMutation("UPDATE_WORK_LOG", { id, ...updates });
    logAudit(
      "UPDATE_WORK_LOG",
      "WorkerWorkLog",
      id,
      `Updated worker wage log (Wage: ₹${updates.wageAmount ?? "unchanged"})`
    );
  };

  const deleteWorkerWorkLog = (id: string) => {
    const target = workerWorkLogs.find((w) => w.id === id);
    setWorkerWorkLogs((prev) => prev.filter((w) => w.id !== id));
    apiMutation("DELETE_WORK_LOG", { id });
    logAudit(
      "DELETE_WORK_LOG",
      "WorkerWorkLog",
      id,
      `Deleted worker wage log of ₹${target?.wageAmount || 0}`
    );
  };

  const updateCompanyExpense = (id: string, updates: Partial<Omit<CompanyExpense, "id" | "createdAt">>) => {
    setCompanyExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    apiMutation("UPDATE_EXPENSE", { id, ...updates });
    logAudit(
      "UPDATE_EXPENSE",
      "CompanyExpense",
      id,
      `Updated expense record under "${updates.category || "General"}" (Amount: ₹${updates.amount ?? "unchanged"})`
    );
  };

  const deleteCompanyExpense = (id: string) => {
    const target = companyExpenses.find((e) => e.id === id);
    setCompanyExpenses((prev) => prev.filter((e) => e.id !== id));
    apiMutation("DELETE_EXPENSE", { id });
    logAudit(
      "DELETE_EXPENSE",
      "CompanyExpense",
      id,
      `Deleted expense record of ₹${target?.amount || 0} (${target?.category || "Expense"})`
    );
  };

  const updateSiteIncome = (id: string, updates: Partial<Omit<SiteIncome, "id" | "createdAt">>) => {
    setSiteIncomes((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
    apiMutation("UPDATE_SITE_INCOME", { id, ...updates });
    logAudit(
      "UPDATE_SITE_INCOME",
      "SiteIncome",
      id,
      `Updated client inflow of ₹${updates.amount ?? "unchanged"} (Ref: ${updates.referenceNo || "N/A"})`
    );
  };

  const deleteSiteIncome = (id: string) => {
    const target = siteIncomes.find((i) => i.id === id);
    setSiteIncomes((prev) => prev.filter((i) => i.id !== id));
    apiMutation("DELETE_SITE_INCOME", { id });
    logAudit(
      "DELETE_SITE_INCOME",
      "SiteIncome",
      id,
      `Deleted client inflow of ₹${target?.amount || 0} (Ref: ${target?.referenceNo || "N/A"})`
    );
  };

  const updateVendorPayment = (id: string, updates: Partial<Omit<VendorPayment, "id" | "createdAt">>) => {
    setVendorPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    apiMutation("UPDATE_VENDOR_PAYMENT", { id, ...updates });
    logAudit(
      "UPDATE_VENDOR_PAYMENT",
      "VendorPayment",
      id,
      `Updated vendor payment of ₹${updates.amount ?? "unchanged"} (Voucher: #${updates.voucherNo || "N/A"})`
    );
  };

  const deleteVendorPayment = (id: string) => {
    const target = vendorPayments.find((p) => p.id === id);
    setVendorPayments((prev) => prev.filter((p) => p.id !== id));
    apiMutation("DELETE_VENDOR_PAYMENT", { id });
    logAudit(
      "DELETE_VENDOR_PAYMENT",
      "VendorPayment",
      id,
      `Deleted vendor payment of ₹${target?.amount || 0} (Voucher: #${target?.voucherNo || "N/A"})`
    );
  };

  const updateWorkerPayment = (id: string, updates: Partial<Omit<WorkerPayment, "id" | "createdAt">>) => {
    setWorkerPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    apiMutation("UPDATE_WORKER_PAYMENT", { id, ...updates });
    logAudit(
      "UPDATE_WORKER_PAYMENT",
      "WorkerPayment",
      id,
      `Updated worker disbursement of ₹${updates.amount ?? "unchanged"} (Voucher: #${updates.voucherNo || "N/A"})`
    );
  };

  const deleteWorkerPayment = (id: string) => {
    const target = workerPayments.find((p) => p.id === id);
    setWorkerPayments((prev) => prev.filter((p) => p.id !== id));
    apiMutation("DELETE_WORKER_PAYMENT", { id });
    logAudit(
      "DELETE_WORKER_PAYMENT",
      "WorkerPayment",
      id,
      `Deleted worker disbursement of ₹${target?.amount || 0} (Voucher: #${target?.voucherNo || "N/A"})`
    );
  };

  // ─── Salary Slips & Monthly Payroll Management ──────────────────────────
  const getWorkerMonthlySalaryInfo = (workerId: string, monthYear: string) => {
    const worker = workers.find((w) => w.id === workerId);
    const monthlySalary =
      worker?.monthlySalary ||
      (worker?.compensationType === "MONTHLY_SALARY"
        ? worker.defaultDailyWage
        : (worker?.defaultDailyWage || 0) * 30);

    // Sum of advances recorded under SALARY_ADVANCE in companyExpenses for this worker in this month
    const advanceList = companyExpenses.filter(
      (e) =>
        e.category === "SALARY_ADVANCE" &&
        e.workerId === workerId &&
        e.expenseDate.startsWith(monthYear)
    );
    const advanceDeductions = advanceList.reduce((sum, e) => sum + Number(e.amount), 0);
    const netPayableAmount = Math.max(0, monthlySalary - advanceDeductions);

    const existingSlip = salarySlips.find(
      (s) => s.workerId === workerId && s.monthYear === monthYear
    );

    return {
      worker,
      monthlySalary,
      advanceDeductions,
      advanceList,
      netPayableAmount,
      alreadyGenerated: !!existingSlip,
      existingSlip: existingSlip || null,
    };
  };

  const generateSalarySlip = (
    data: Omit<SalarySlip, "id" | "slipNumber" | "createdAt">
  ): { success: boolean; message: string; slip?: SalarySlip } => {
    // Enforcement: Only 1 salary slip per worker per month
    const existing = salarySlips.find(
      (s) => s.workerId === data.workerId && s.monthYear === data.monthYear
    );
    if (existing) {
      return {
        success: false,
        message: `Salary slip for ${data.monthLabel || data.monthYear} has already been generated (Slip #${existing.slipNumber} on ${existing.paymentDate}). Monthly salary slips can only be generated ONCE per month.`,
        slip: existing,
      };
    }

    const slipId = `slip-${Date.now()}`;
    const cleanMonth = data.monthYear.replace("-", "");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const slipNumber = `SLIP-${cleanMonth}-${randomSuffix}`;

    const newSlip: SalarySlip = {
      ...data,
      id: slipId,
      slipNumber,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setSalarySlips((prev) => [newSlip, ...prev]);

    // Record workerPayment so accounting & cash flow ledger reflect the salary settlement
    const newWorkerPayment: WorkerPayment = {
      id: `wp-${Date.now()}`,
      workerId: data.workerId,
      paymentDate: data.paymentDate,
      amount: data.netPayableAmount,
      paymentMode: data.paymentMode,
      voucherNo: slipNumber,
      notes: `Monthly Salary Settlement for ${data.monthLabel || data.monthYear} (Gross: ₹${data.baseSalary}, Advances: ₹${data.advanceDeductions})`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setWorkerPayments((prev) => [newWorkerPayment, ...prev]);

    // Sync salary slip and worker payment to PostgreSQL database
    apiMutation("ADD_SALARY_SLIP", newSlip);
    apiMutation("ADD_WORKER_PAYMENT", newWorkerPayment);

    logAudit(
      "GENERATE_SALARY_SLIP",
      "SalarySlip",
      newSlip.id,
      `Generated single monthly salary slip ${slipNumber} for "${data.workerName}" (${data.monthLabel}): Gross ₹${data.baseSalary} - Advance ₹${data.advanceDeductions} = Net Paid ₹${data.netPayableAmount} via ${data.paymentMode}`
    );

    return {
      success: true,
      message: `Salary slip ${slipNumber} generated successfully.`,
      slip: newSlip,
    };
  };

  const deleteSalarySlip = (slipId: string) => {
    const target = salarySlips.find((s) => s.id === slipId);
    setSalarySlips((prev) => prev.filter((s) => s.id !== slipId));
    apiMutation("DELETE_SALARY_SLIP", { id: slipId });
    logAudit(
      "DELETE_SALARY_SLIP",
      "SalarySlip",
      slipId,
      `Deleted salary slip "${target?.slipNumber || slipId}" for "${target?.workerName || "Worker"}"`
    );
  };

  // ─── Calculated Metrics ─────────────────────────────────────────────────
  const getVendorStats = (vendorId: string) => {
    const ven = vendors.find((v) => v.id === vendorId);
    const openingBalance = Number(ven?.openingBalance || 0);

    const totalPurchased = openingBalance + vendorPurchases
      .filter((p) => p.vendorId === vendorId)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPaid = vendorPayments
      .filter((p) => p.vendorId === vendorId)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalPurchased,
      totalPaid,
      outstandingBalance: totalPurchased - totalPaid,
    };
  };

  const getWorkerStats = (workerId: string) => {
    const worker = workers.find((w) => w.id === workerId);
    const openingBalance = Number(worker?.openingBalance || 0);

    const totalEarned = openingBalance + workerWorkLogs
      .filter((w) => w.workerId === workerId)
      .reduce((sum, w) => sum + Number(w.wageAmount), 0);

    const totalPaid = workerPayments
      .filter((p) => p.workerId === workerId)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalEarned,
      totalPaid,
      outstandingBalance: totalEarned - totalPaid,
    };
  };

  const getSiteStats = (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    const openingBalance = Number(site?.openingBalance || 0);

    const totalIncome = openingBalance + siteIncomes
      .filter((i) => i.siteId === siteId)
      .reduce((sum, i) => sum + Number(i.amount), 0);

    const materialExpense = vendorPurchases
      .filter((p) => p.siteId === siteId)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const laborExpense = workerWorkLogs
      .filter((w) => w.siteId === siteId)
      .reduce((sum, w) => sum + Number(w.wageAmount), 0);

    const miscExpense = companyExpenses
      .filter((e) => e.siteId === siteId)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const totalExpense = materialExpense + laborExpense + miscExpense;

    return {
      totalIncome,
      materialExpense,
      laborExpense,
      miscExpense,
      totalExpense,
      netMargin: totalIncome - totalExpense,
    };
  };

  const getMasterCashFlow = () => {
    const totalSiteOpening = sites.reduce(
      (sum, s) => sum + Number(s.openingBalance || 0),
      0
    );

    const totalCashReceived = totalSiteOpening + siteIncomes.reduce(
      (sum, i) => sum + Number(i.amount),
      0
    );

    const totalVendorCashPaid = vendorPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const totalWorkerCashPaid = workerPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const totalOverheadCashPaid = companyExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    const totalCashOutflow =
      totalVendorCashPaid + totalWorkerCashPaid + totalOverheadCashPaid;

    const currentCashInHand = totalCashReceived - totalCashOutflow;

    const totalVendorOpening = vendors.reduce(
      (sum, v) => sum + Number(v.openingBalance || 0),
      0
    );
    const totalMaterialPurchased = totalVendorOpening + vendorPurchases.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const totalVendorPayables = Math.max(
      0,
      totalMaterialPurchased - totalVendorCashPaid
    );

    const totalWorkerOpening = workers.reduce(
      (sum, w) => sum + Number(w.openingBalance || 0),
      0
    );
    const totalLaborEarned = totalWorkerOpening + workerWorkLogs.reduce(
      (sum, w) => sum + Number(w.wageAmount),
      0
    );
    const totalWorkerPayables = Math.max(
      0,
      totalLaborEarned - totalWorkerCashPaid
    );

    // Bank vs Physical Cash breakdown
    const bankInflow = totalSiteOpening + siteIncomes
      .filter(
        (i) =>
          i.paymentMode === "BANK_TRANSFER" ||
          i.paymentMode === "CHEQUE" ||
          i.paymentMode === "UPI"
      )
      .reduce((s, i) => s + Number(i.amount), 0);
    const bankOutflow =
      vendorPayments
        .filter((p) => p.paymentMode !== "CASH")
        .reduce((s, p) => s + Number(p.amount), 0) +
      workerPayments
        .filter((p) => p.paymentMode !== "CASH")
        .reduce((s, p) => s + Number(p.amount), 0) +
      companyExpenses
        .filter((e) => e.paymentMode !== "CASH")
        .reduce((s, e) => s + Number(e.amount), 0);
    const cashInBank = bankInflow - bankOutflow;

    const physicalInflow = siteIncomes
      .filter((i) => i.paymentMode === "CASH")
      .reduce((s, i) => s + Number(i.amount), 0);
    const physicalOutflow =
      vendorPayments
        .filter((p) => p.paymentMode === "CASH")
        .reduce((s, p) => s + Number(p.amount), 0) +
      workerPayments
        .filter((p) => p.paymentMode === "CASH")
        .reduce((s, p) => s + Number(p.amount), 0) +
      companyExpenses
        .filter((e) => e.paymentMode === "CASH")
        .reduce((s, e) => s + Number(e.amount), 0);
    const cashInPhysicalBox = physicalInflow - physicalOutflow;

    return {
      totalCashReceived,
      totalVendorCashPaid,
      totalWorkerCashPaid,
      totalOverheadCashPaid,
      totalCashOutflow,
      currentCashInHand,
      totalVendorPayables,
      totalWorkerPayables,
      cashInBank,
      cashInPhysicalBox,
    };
  };

  const loadScaleData = (
    siteCount = 100,
    workerCount = 1000,
    vendorCount = 50
  ) => {
    const cities = [
      "Bangalore",
      "Mumbai",
      "Delhi NCR",
      "Hyderabad",
      "Chennai",
      "Pune",
      "Kolkata",
      "Ahmedabad",
      "Jaipur",
      "Lucknow",
    ];
    const sitePrefixes = [
      "Skyline Towers",
      "Grand Horizon",
      "Emerald Bay",
      "Metro Tech Park",
      "Royal Crest",
      "Silver Oaks",
      "Prestige Enclave",
      "Sobha Sapphire",
      "Godrej Woods",
      "DLF Promenade",
    ];
    const clients = [
      "Dr. Arvind Swaminathan",
      "Meera Nambiar",
      "Vikramaditya Singhania",
      "Ananya Deshmukh",
      "Brigade Enterprises",
      "K Raheja Corp",
      "Tata Housing",
      "Mahindra Lifespaces",
      "Shapoorji Pallonji",
      "Oberoi Realty",
    ];

    const newSites: Site[] = [];
    for (let i = 1; i <= siteCount; i++) {
      const prefix = sitePrefixes[i % sitePrefixes.length];
      const city = cities[i % cities.length];
      const client = clients[i % clients.length];
      const status: SiteStatus =
        i % 10 === 0 ? "COMPLETED" : i % 15 === 0 ? "ON_HOLD" : "ACTIVE";
      newSites.push({
        id: `site-${i}`,
        name: `${prefix} - Block ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1
          }`,
        clientName: client,
        location: `${city} Sector ${((i * 7) % 80) + 1}`,
        status,
        estimatedBudget: 2500000 + i * 350000,
        createdAt: "2026-11-01",
      });
    }

    const vendorTrades = [
      "Cement Supplier",
      "Steel & TMT Bars",
      "Ready-Mix Concrete (RMC)",
      "Red Bricks & AAC Blocks",
      "Electrical Cables & Switchgear",
      "Plumbing & Sanitaryware",
      "Hardware & Tools",
      "Timber & Plywood",
      "Paint & Putty",
      "Granite & Marble",
    ];
    const vendorNames = [
      "PMR Infra Supplies",
      "UltraTech Depot",
      "Tata Tiscon Distributors",
      "Apex ReadyMix",
      "Shree Cement Agency",
      "Jindal Steel Point",
      "Kamdhenu Sariya",
      "ACC Trust Cements",
      "Asian Paints Wholesale",
      "Birla White Point",
      "Havells Electricals",
      "Finolex Pipe Hub",
      "Jaquar Fitting Point",
      "Krishna Hardware",
      "Balaji Sand Suppliers",
      "Ganga Aggregate Mining",
      "Maruti Tiles & Stones",
      "Kajaria Ceramics",
      "Greenlam Plywood",
      "Century Ply Traders",
    ];

    const newVendors: Vendor[] = [];
    for (let i = 1; i <= vendorCount; i++) {
      const vName = vendorNames[i % vendorNames.length];
      const vTrade = vendorTrades[i % vendorTrades.length];
      newVendors.push({
        id: `ven-${i}`,
        name: `${vName} (#${i})`,
        phone: `+91 98${Math.floor(10000000 + Math.random() * 89999999)}`,
        tradeCategory: vTrade,
        notes: `Preferred material vendor for ${vTrade}`,
        createdAt: "2026-11-01",
      });
    }

    const firstNames = [
      "Ramesh",
      "Suresh",
      "Ganesh",
      "Mahesh",
      "Rajesh",
      "Mukesh",
      "Dinesh",
      "Naresh",
      "Santosh",
      "Manoj",
      "Anil",
      "Sunil",
      "Vijay",
      "Ajay",
      "Sanjay",
      "Deepak",
      "Prakash",
      "Amit",
      "Sumit",
      "Rahul",
      "Rohit",
      "Vikram",
      "Kiran",
      "Ashok",
      "Pramod",
      "Vinod",
      "Jagdish",
      "Rakesh",
      "Kamlesh",
      "Harish",
    ];
    const lastNames = [
      "Sharma",
      "Verma",
      "Yadav",
      "Kumar",
      "Singh",
      "Paswan",
      "Mondal",
      "Das",
      "Patel",
      "Thakur",
      "Chauhan",
      "Gupta",
      "Mishra",
      "Pandey",
      "Pandit",
      "Rathore",
      "Nayak",
      "Majhi",
      "Khatun",
      "Sahni",
    ];
    const trades = [
      { trade: "Head Mason", wage: 1100 },
      { trade: "Mason Helper", wage: 650 },
      { trade: "Shuttering Carpenter", wage: 950 },
      { trade: "Bar Bender / Steel Fixer", wage: 900 },
      { trade: "Electrician", wage: 1000 },
      { trade: "Plumber", wage: 950 },
      { trade: "Welder / Fabricator", wage: 1050 },
      { trade: "Painter & Polisher", wage: 850 },
      { trade: "Earthwork Laborer", wage: 600 },
      { trade: "Crane & Hoist Operator", wage: 1200 },
    ];

    const newWorkers: Worker[] = [];
    for (let i = 1; i <= workerCount; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      const t = trades[i % trades.length];
      newWorkers.push({
        id: `w-${i}`,
        name: `${fn} ${ln} (#${i})`,
        phone: `+91 91${Math.floor(10000000 + Math.random() * 89999999)}`,
        trade: t.trade,
        defaultDailyWage: t.wage,
        isActive: i % 25 !== 0,
        createdAt: "2026-11-01",
      });
    }

    setSites(newSites);
    setVendors(newVendors);
    setWorkers(newWorkers);
    logAudit(
      "LOAD_SCALE_DATA",
      "System",
      undefined,
      `Loaded enterprise scale dataset: ${siteCount} Sites, ${workerCount} Workers, ${vendorCount} Vendors`
    );
  };

  const clearAllData = () => {
    setSites([]);
    setVendors([]);
    setWorkers([]);
    setVendorPurchases([]);
    setVendorPayments([]);
    setWorkerWorkLogs([]);
    setWorkerPayments([]);
    setSiteIncomes([]);
    setCompanyExpenses([]);
    setAuditLogs([]);
  };

  const exportFullBackupPayload = useCallback(() => {
    return {
      version: "2.4",
      app: "BytBuild ERP",
      companyName,
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser ? `${currentUser.fullName} (${currentUser.username})` : "Owner",
      data: {
        companyName,
        roles,
        users,
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
      },
      stats: {
        sitesCount: sites.length,
        vendorsCount: vendors.length,
        workersCount: workers.length,
        purchasesCount: vendorPurchases.length,
        paymentsCount: vendorPayments.length + workerPayments.length,
        incomesCount: siteIncomes.length,
        expensesCount: companyExpenses.length,
        salarySlipsCount: salarySlips.length,
        auditLogsCount: auditLogs.length,
      },
    };
  }, [
    companyName,
    currentUser,
    roles,
    users,
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
  ]);

  const restoreFullBackupPayload = useCallback(
    (backupJson: any) => {
      try {
        if (!backupJson || !backupJson.data) {
          return { success: false, message: "Invalid backup file: Missing 'data' object." };
        }
        const d = backupJson.data;
        if (d.companyName) setCompanyName(d.companyName);
        if (Array.isArray(d.sites)) setSites(d.sites);
        if (Array.isArray(d.vendors)) setVendors(d.vendors);
        if (Array.isArray(d.workers)) setWorkers(d.workers);
        if (Array.isArray(d.vendorPurchases)) setVendorPurchases(d.vendorPurchases);
        if (Array.isArray(d.vendorPayments)) setVendorPayments(d.vendorPayments);
        if (Array.isArray(d.workerWorkLogs)) setWorkerWorkLogs(d.workerWorkLogs);
        if (Array.isArray(d.workerPayments)) setWorkerPayments(d.workerPayments);
        if (Array.isArray(d.siteIncomes)) setSiteIncomes(d.siteIncomes);
        if (Array.isArray(d.companyExpenses)) setCompanyExpenses(d.companyExpenses);
        if (Array.isArray(d.salarySlips)) setSalarySlips(d.salarySlips);
        if (Array.isArray(d.roles)) setRoles(d.roles);
        if (Array.isArray(d.users)) setUsers(d.users);

        logAudit(
          "RESTORE_BACKUP",
          "SystemBackup",
          undefined,
          `Restored complete ERP database from backup created at ${backupJson.exportedAt || "Unknown date"}`
        );

        return {
          success: true,
          message: `Successfully restored database (${d.sites?.length || 0} sites, ${d.workers?.length || 0} workers, ${d.vendors?.length || 0} vendors).`,
        };
      } catch (err: any) {
        return { success: false, message: `Restore failed: ${err.message}` };
      }
    },
    [
      setCompanyName,
      setSites,
      setVendors,
      setWorkers,
      setVendorPurchases,
      setVendorPayments,
      setWorkerWorkLogs,
      setWorkerPayments,
      setSiteIncomes,
      setCompanyExpenses,
      setRoles,
      setUsers,
      logAudit,
    ]
  );

  return (
    <ConstructionContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        setCurrentUser,
        companyName,
        setCompanyName,
        isDbLoading,
        roles,
        users,
        auditLogs,
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
        generateSalarySlip,
        deleteSalarySlip,
        getWorkerMonthlySalaryInfo,
        canAccessPage,
        createCustomRole,
        updateRolePermissions,
        createAppUser,
        deleteAppUser,
        authenticateUser,
        logAudit,
        addSite,
        updateSite,
        deleteSite,
        addVendor,
        updateVendor,
        deleteVendor,
        addWorker,
        updateWorker,
        deleteWorker,
        recordMaterialPurchase,
        updateVendorPurchase,
        deleteVendorPurchase,
        recordVendorPayment,
        updateVendorPayment,
        deleteVendorPayment,
        assignWorkerWorkLog,
        updateWorkerWorkLog,
        deleteWorkerWorkLog,
        recordWorkerPayment,
        updateWorkerPayment,
        deleteWorkerPayment,
        recordSiteIncome,
        updateSiteIncome,
        deleteSiteIncome,
        recordCompanyExpense,
        updateCompanyExpense,
        deleteCompanyExpense,
        getVendorStats,
        getWorkerStats,
        getSiteStats,
        getMasterCashFlow,
        loadScaleData,
        clearAllData,
        exportFullBackupPayload,
        restoreFullBackupPayload,
      }}
    >
      {children}
    </ConstructionContext.Provider>
  );
}

export function useConstruction() {
  const context = useContext(ConstructionContext);
  if (!context) {
    throw new Error("useConstruction must be used within a ConstructionProvider");
  }
  return context;
}
