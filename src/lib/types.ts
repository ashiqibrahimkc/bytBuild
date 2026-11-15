export type UserRole = "OWNER" | "MANAGER" | "ACCOUNTANT" | string;

export type PagePermission =
  | "dashboard"
  | "sites"
  | "vendors"
  | "workers"
  | "salary-slips"
  | "cashflow"
  | "company-expenses"
  | "reports"
  | "audit-logs"
  | "team-roles"
  | "backup";

export interface CustomRole {
  id: string;
  name: string; // e.g. "OWNER", "MANAGER", "ACCOUNTANT", "SUPERVISOR"
  displayName: string;
  description: string;
  permissions: PagePermission[];
  isSystem: boolean;
  createdAt: string;
}

export interface AppUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email?: string;
  roleId: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string; // "PURCHASE_MATERIAL", "WAGE_LOG", "DISBURSE_PAYMENT", "RECORD_INCOME", "RECORD_OVERHEAD", "CREATE_USER", "UPDATE_PERMISSIONS", "CREATE_ROLE"
  entity: string; // "VendorPurchase", "WorkerWorkLog", "VendorPayment", "WorkerPayment", "SiteIncome", "CompanyExpense", "AppUser", "CustomRole", "Site"
  entityId?: string;
  details: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
}

export type PaymentMode = "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE";

export type SiteStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD";

export type ExpenseCategory =
  | "SALARY_ADVANCE"
  | "ROOM_RENT"
  | "PETROL_FUEL"
  | "FUEL_TRAVEL"
  | "OFFICE_OVERHEAD"
  | "FOOD_TEA_REFRESHMENTS"
  | "TEA_REFRESHMENTS"
  | "MACHINERY_RENT"
  | "EQUIPMENT_RENT"
  | "SITE_PERMIT_FEES"
  | "MISCELLANEOUS";

export interface Site {
  id: string;
  name: string;
  clientName: string;
  location: string;
  status: SiteStatus;
  estimatedBudget: number;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  tradeCategory: string; // e.g. Cement, Steel, Bricks
  notes?: string;
  createdAt: string;
}

export interface VendorPurchase {
  id: string;
  vendorId: string;
  siteId: string;
  purchaseDate: string;
  amount: number;
  voucherNo?: string;
  notes?: string;
  createdAt: string;
}

export interface VendorPayment {
  id: string;
  vendorId: string;
  siteId?: string; // Optional site reference
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  voucherNo?: string;
  notes?: string;
  createdAt: string;
}

export type WorkerCompensationType = "DAILY_WAGE" | "MONTHLY_SALARY";

export interface Worker {
  id: string;
  name: string;
  phone: string;
  trade: string; // e.g. Mason, Helper, Carpenter, Supervisor, Engineer
  compensationType?: WorkerCompensationType; // Default: "DAILY_WAGE"
  defaultDailyWage: number; // Daily rate for DAILY_WAGE
  monthlySalary?: number; // Fixed monthly salary for MONTHLY_SALARY
  isActive: boolean;
  createdAt: string;
}

export interface WorkerWorkLog {
  id: string;
  workerId: string;
  siteId: string;
  workDate: string;
  wageAmount: number;
  notes?: string;
  createdAt: string;
}

export interface WorkerPayment {
  id: string;
  workerId: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  voucherNo?: string;
  notes?: string;
  createdAt: string;
}

export interface SalarySlip {
  id: string;
  slipNumber: string; // e.g. "SLIP-202611-001"
  workerId: string;
  workerName: string;
  workerTrade: string;
  monthYear: string; // "YYYY-MM", e.g. "2026-11"
  monthLabel: string; // e.g. "November 2026"
  baseSalary: number; // Monthly gross fixed salary
  advanceDeductions: number; // Deducted advances logged in expenses
  otherDeductions?: number;
  netPayableAmount: number; // baseSalary - advanceDeductions
  paymentMode: PaymentMode;
  paymentDate: string;
  voucherNo?: string;
  notes?: string;
  createdAt: string;
}

export interface SiteIncome {
  id: string;
  siteId: string;
  incomeDate: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  receivedFrom?: string;
  notes?: string;
  createdAt: string;
}

export interface CompanyExpense {
  id: string;
  siteId?: string; // null if general company overhead (e.g. petrol)
  workerId?: string; // If SALARY_ADVANCE, the recipient salaried worker
  category: ExpenseCategory;
  expenseDate: string;
  amount: number;
  paymentMode: PaymentMode;
  voucherNo?: string;
  notes?: string;
  createdAt: string;
}
