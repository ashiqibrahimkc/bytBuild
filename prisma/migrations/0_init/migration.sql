-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MANAGER', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "WorkerCompensationType" AS ENUM ('DAILY_WAGE', 'MONTHLY_SALARY');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SALARY_ADVANCE', 'ROOM_RENT', 'PETROL_FUEL', 'FUEL_TRAVEL', 'OFFICE_OVERHEAD', 'FOOD_TEA_REFRESHMENTS', 'TEA_REFRESHMENTS', 'MACHINERY_RENT', 'EQUIPMENT_RENT', 'SITE_PERMIT_FEES', 'MISCELLANEOUS', 'OUTSIDE_LABOR');

-- CreateTable
CREATE TABLE "CustomRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "location" TEXT,
    "status" "SiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "estimatedBudget" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "tradeCategory" TEXT,
    "notes" TEXT,
    "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPurchase" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "voucherNo" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "siteId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'CASH',
    "voucherNo" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "trade" TEXT,
    "compensationType" "WorkerCompensationType" NOT NULL DEFAULT 'DAILY_WAGE',
    "defaultDailyWage" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "monthlySalary" DECIMAL(10,2),
    "openingBalance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerWorkLog" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wageAmount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerWorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerPayment" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'CASH',
    "voucherNo" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteIncome" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "incomeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'BANK_TRANSFER',
    "referenceNo" TEXT,
    "receivedFrom" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyExpense" (
    "id" TEXT NOT NULL,
    "siteId" TEXT,
    "workerId" TEXT,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'MISCELLANEOUS',
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'CASH',
    "voucherNo" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalarySlip" (
    "id" TEXT NOT NULL,
    "slipNumber" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "workerName" TEXT NOT NULL,
    "workerTrade" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "monthLabel" TEXT NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "advanceDeductions" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "otherDeductions" DECIMAL(10,2),
    "netPayableAmount" DECIMAL(10,2) NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'BANK_TRANSFER',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voucherNo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalarySlip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_name_key" ON "CustomRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_username_key" ON "AppUser"("username");

-- CreateIndex
CREATE INDEX "AppUser_roleId_idx" ON "AppUser"("roleId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "VendorPurchase_siteId_idx" ON "VendorPurchase"("siteId");

-- CreateIndex
CREATE INDEX "VendorPurchase_vendorId_idx" ON "VendorPurchase"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPayment_vendorId_idx" ON "VendorPayment"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPayment_siteId_idx" ON "VendorPayment"("siteId");

-- CreateIndex
CREATE INDEX "WorkerWorkLog_workerId_idx" ON "WorkerWorkLog"("workerId");

-- CreateIndex
CREATE INDEX "WorkerWorkLog_siteId_idx" ON "WorkerWorkLog"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerWorkLog_workerId_siteId_workDate_key" ON "WorkerWorkLog"("workerId", "siteId", "workDate");

-- CreateIndex
CREATE INDEX "WorkerPayment_workerId_idx" ON "WorkerPayment"("workerId");

-- CreateIndex
CREATE INDEX "SiteIncome_siteId_idx" ON "SiteIncome"("siteId");

-- CreateIndex
CREATE INDEX "CompanyExpense_siteId_idx" ON "CompanyExpense"("siteId");

-- CreateIndex
CREATE INDEX "CompanyExpense_workerId_idx" ON "CompanyExpense"("workerId");

-- CreateIndex
CREATE INDEX "CompanyExpense_expenseDate_idx" ON "CompanyExpense"("expenseDate");

-- CreateIndex
CREATE UNIQUE INDEX "SalarySlip_slipNumber_key" ON "SalarySlip"("slipNumber");

-- CreateIndex
CREATE INDEX "SalarySlip_workerId_idx" ON "SalarySlip"("workerId");

-- CreateIndex
CREATE INDEX "SalarySlip_monthYear_idx" ON "SalarySlip"("monthYear");

-- AddForeignKey
ALTER TABLE "AppUser" ADD CONSTRAINT "AppUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CustomRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPurchase" ADD CONSTRAINT "VendorPurchase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPurchase" ADD CONSTRAINT "VendorPurchase_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPurchase" ADD CONSTRAINT "VendorPurchase_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerWorkLog" ADD CONSTRAINT "WorkerWorkLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerWorkLog" ADD CONSTRAINT "WorkerWorkLog_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerWorkLog" ADD CONSTRAINT "WorkerWorkLog_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPayment" ADD CONSTRAINT "WorkerPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerPayment" ADD CONSTRAINT "WorkerPayment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteIncome" ADD CONSTRAINT "SiteIncome_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteIncome" ADD CONSTRAINT "SiteIncome_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyExpense" ADD CONSTRAINT "CompanyExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyExpense" ADD CONSTRAINT "CompanyExpense_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyExpense" ADD CONSTRAINT "CompanyExpense_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

