import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting production database seed...");

  // 1. Create or ensure System Roles
  const ownerRole = await prisma.customRole.upsert({
    where: { name: "OWNER" },
    update: {
      description: "Company Owner with full system and financial authority",
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
    },
    create: {
      name: "OWNER",
      description: "Company Owner with full system and financial authority",
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
    },
  });

  const managerRole = await prisma.customRole.upsert({
    where: { name: "MANAGER" },
    update: {
      description: "Site Project Manager with site and worker supervision permissions",
      permissions: ["dashboard", "sites", "vendors", "workers", "company-expenses", "reports"],
      isSystem: true,
    },
    create: {
      name: "MANAGER",
      description: "Site Project Manager with site and worker supervision permissions",
      permissions: ["dashboard", "sites", "vendors", "workers", "company-expenses", "reports"],
      isSystem: true,
    },
  });

  const accountantRole = await prisma.customRole.upsert({
    where: { name: "ACCOUNTANT" },
    update: {
      description: "Head Accountant with financial records, cash flow, and salary slip access",
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
    },
    create: {
      name: "ACCOUNTANT",
      description: "Head Accountant with financial records, cash flow, and salary slip access",
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
    },
  });

  console.log("✅ Roles created/verified: OWNER, MANAGER, ACCOUNTANT");

  // 2. Create or ensure Owner User in AppUser
  const ownerUser = await prisma.appUser.upsert({
    where: { username: "abc@gmail.com" },
    update: {
      email: "abc@gmail.com",
      fullName: "Owner",
      password: "abc123",
      roleId: ownerRole.id,
      isActive: true,
    },
    create: {
      username: "abc@gmail.com",
      email: "abc@gmail.com",
      fullName: "Owner",
      password: "abc123",
      roleId: ownerRole.id,
      isActive: true,
    },
  });

  // Also ensure User model record for relational foreign keys
  await prisma.user.upsert({
    where: { email: "abc@gmail.com" },
    update: {
      fullName: "Owner",
      role: "OWNER",
    },
    create: {
      email: "abc@gmail.com",
      fullName: "Owner",
      role: "OWNER",
    },
  });

  console.log(`✅ Owner account seeded successfully:`);
  console.log(`   - Username: ${ownerUser.username}`);
  console.log(`   - Email:    ${ownerUser.email}`);
  console.log(`   - Role:     OWNER (All access granted)`);

  // 3. Create initial Audit Log entry
  await prisma.auditLog.create({
    data: {
      action: "DATABASE_INITIALIZATION",
      entity: "AppUser",
      entityId: ownerUser.id,
      details: "Production database seeded with Owner credentials (abc@gmail.com) with full administrative access.",
      actorName: "System Seed",
      actorRole: "OWNER",
    },
  });

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

