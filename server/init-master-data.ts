import { db } from "./db";
import { 
  mstRole, 
  mstUser, 
  mstBranch, 
  mstClient, 
  mstIndicator,
  mstModule,
  mstRoleRight,
  transaction,
  clientInvestmentRequest
} from "@shared/schema";

export async function initializeMasterData() {
  try {
    console.log("Initializing master data...");

    // Check if roles already exist
    const existingRoles = await db.select().from(mstRole).limit(1);
    if (existingRoles.length > 0) {
      console.log("Master data already exists, skipping initialization");
      return;
    }

    // Create default roles
    await db.insert(mstRole).values({
      name: "Admin",
      isActive: 1,
      createdById: 1,
      createdByUser: "system",
      createdDate: new Date(),
    });

    await db.insert(mstRole).values({
      name: "Manager",
      isActive: 1,
      createdById: 1,
      createdByUser: "system",
      createdDate: new Date(),
    });

    await db.insert(mstRole).values({
      name: "Client",
      isActive: 1,
      createdById: 1,
      createdByUser: "system",
      createdDate: new Date(),
    });

    // Get created roles
    const roles = await db.select().from(mstRole).orderBy(mstRole.roleId);
    const adminRole = roles.find(r => r.name === "Admin")!;
    const managerRole = roles.find(r => r.name === "Manager")!;
    const clientRole = roles.find(r => r.name === "Client")!;

    // Create default branch
    await db.insert(mstBranch).values({
      name: "Main Branch",
      address: "123 Business District",
      city: "Mumbai",
      pincode: 400001,
      isActive: 1,
      createdById: 1,
      createdByUser: "system",
      createdDate: new Date(),
    });

    const branches = await db.select().from(mstBranch).limit(1);
    const mainBranch = branches[0];

    // Create default admin user
    await db.insert(mstUser).values({
      userName: "admin",
      password: "admin123",
      email: "admin@gandharva.com",
      mobile: "9876543210",
      roleId: adminRole.roleId,
      isActive: 1,
      createdById: 1,
      createdByUser: "system",
      createdDate: new Date(),
    });

    const users = await db.select().from(mstUser).limit(1);
    const adminUser = users[0];

    // Create default indicators
    const indicators = [
      { name: "Investment", isActive: 1, createdById: adminUser.userId, createdByUser: "admin", createdDate: new Date() },
      { name: "Withdrawal", isActive: 1, createdById: adminUser.userId, createdByUser: "admin", createdDate: new Date() },
      { name: "Payout", isActive: 1, createdById: adminUser.userId, createdByUser: "admin", createdDate: new Date() },
      { name: "Closure", isActive: 1, createdById: adminUser.userId, createdByUser: "admin", createdDate: new Date() },
    ];

    await db.insert(mstIndicator).values(indicators);

    // Create default modules
    const modules = [
      { name: "Dashboard", tableName: null, icon: "dashboard", seqNo: 1, isActive: 1, createdById: adminUser.userId, createdByUser: "admin", createdDate: new Date() },
      { name: "Users", tableName: "mst_user", icon: "users", seqNo: 2, isActive: 1, createdById: adminUser.userId, createdByUser: "admin", createdDate: new Date() },
      { name: "Clients", tableName: "mst_client", icon: "clients", seqNo: 3, isActive: 1, createdById: adminUser.userId, createdByUser: "admin", createdDate: new Date() },
      { name: "Transactions", tableName: "transaction", icon: "transactions", seqNo: 4, isActive: 1, createdById: adminUser.userId, createdByUser: "admin", createdDate: new Date() },
      { name: "Reports", tableName: null, icon: "reports", seqNo: 5, isActive: 1, createdById: adminUser.userId, createdByUser: "admin", createdDate: new Date() },
    ];

    await db.insert(mstModule).values(modules);
    const createdModules = await db.select().from(mstModule);

    // Create role rights for admin (full access)
    const adminRoleRights = createdModules.map(module => ({
      roleId: adminRole.roleId,
      moduleId: module.moduleId,
      accessRead: 1,
      accessWrite: 1,
      accessUpdate: 1,
      accessDelete: 1,
      accessExport: 1,
    }));

    await db.insert(mstRoleRight).values(adminRoleRights);

    // Create role rights for manager (limited access)
    const managerRoleRights = createdModules.map(module => ({
      roleId: managerRole.roleId,
      moduleId: module.moduleId,
      accessRead: 1,
      accessWrite: module.name !== "Users" ? 1 : 0, // No user creation for managers
      accessUpdate: 1,
      accessDelete: 0, // No delete access
      accessExport: 1,
    }));

    await db.insert(mstRoleRight).values(managerRoleRights);

    // Create role rights for client (read-only access to limited modules)
    const clientModules = createdModules.filter(m => ["Dashboard", "Transactions"].includes(m.name));
    const clientRoleRights = clientModules.map(module => ({
      roleId: clientRole.roleId,
      moduleId: module.moduleId,
      accessRead: 1,
      accessWrite: 0,
      accessUpdate: 0,
      accessDelete: 0,
      accessExport: 0,
    }));

    await db.insert(mstRoleRight).values(clientRoleRights);

    // Create sample client and transactions for demo purposes
    await db.insert(mstClient).values({
      code: "CL001",
      name: "John Doe",
      mobile: "9876543211",
      email: "john@example.com",
      dob: new Date("1990-01-01"),
      panNo: "ABCDE1234F",
      aadhaarNo: "123456789012",
      branch: "Main Branch",
      branchId: mainBranch.branchId,
      address: "123 Main Street, City",
      city: "Mumbai",
      pincode: "400001",
      isActive: 1,
      createdById: adminUser.userId,
      createdByUser: "admin",
      createdDate: new Date(),
    });

    const clients = await db.select().from(mstClient).limit(1);
    const sampleClient = clients[0];

    // Create client user
    await db.insert(mstUser).values({
      userName: "John Doe",
      password: "client123",
      email: "john@example.com",
      mobile: "9876543211",
      roleId: clientRole.roleId,
      clientId: sampleClient.clientId,
      isActive: 1,
      createdById: adminUser.userId,
      createdByUser: "admin",
      createdDate: new Date(),
    });

    // Get created indicators
    const createdIndicators = await db.select().from(mstIndicator);
    const investmentIndicator = createdIndicators.find(i => i.name === "Investment")!;
    const payoutIndicator = createdIndicators.find(i => i.name === "Payout")!;
    const withdrawalIndicator = createdIndicators.find(i => i.name === "Withdrawal")!;

    // Create sample transactions
    const sampleTransactions = [
      {
        transactionDate: new Date("2024-01-15"),
        clientId: sampleClient.clientId,
        indicatorId: investmentIndicator.indicatorId,
        amount: "50000.00",
        remark: "Initial investment",
        createdById: adminUser.userId,
        createdByUser: "admin",
        createdDate: new Date("2024-01-15")
      },
      {
        transactionDate: new Date("2024-02-15"),
        clientId: sampleClient.clientId,
        indicatorId: payoutIndicator.indicatorId,
        amount: "2500.00",
        remark: "Monthly payout",
        createdById: adminUser.userId,
        createdByUser: "admin",
        createdDate: new Date("2024-02-15")
      },
      {
        transactionDate: new Date("2024-03-15"),
        clientId: sampleClient.clientId,
        indicatorId: payoutIndicator.indicatorId,
        amount: "2500.00",
        remark: "Monthly payout",
        createdById: adminUser.userId,
        createdByUser: "admin",
        createdDate: new Date("2024-03-15")
      },
      {
        transactionDate: new Date("2024-04-15"),
        clientId: sampleClient.clientId,
        indicatorId: investmentIndicator.indicatorId,
        amount: "25000.00",
        remark: "Additional investment",
        createdById: adminUser.userId,
        createdByUser: "admin",
        createdDate: new Date("2024-04-15")
      },
      {
        transactionDate: new Date("2024-05-15"),
        clientId: sampleClient.clientId,
        indicatorId: payoutIndicator.indicatorId,
        amount: "3750.00",
        remark: "Monthly payout",
        createdById: adminUser.userId,
        createdByUser: "admin",
        createdDate: new Date("2024-05-15")
      },
      {
        transactionDate: new Date("2024-06-15"),
        clientId: sampleClient.clientId,
        indicatorId: withdrawalIndicator.indicatorId,
        amount: "10000.00",
        remark: "Partial withdrawal",
        createdById: adminUser.userId,
        createdByUser: "admin",
        createdDate: new Date("2024-06-15")
      }
    ];

    await db.insert(transaction).values(sampleTransactions);

    // Create sample investment requests
    const sampleInvestmentRequests = [
      {
        clientId: sampleClient.clientId,
        investmentDate: new Date("2024-01-15"),
        investmentAmount: "50000.00",
        investmentRemark: "Initial investment request",
        transactionId: "TXN001",
        transactionNo: "INV001",
        createdById: adminUser.userId,
        createdByUser: "admin",
        createdDate: new Date("2024-01-15")
      },
      {
        clientId: sampleClient.clientId,
        investmentDate: new Date("2024-04-15"),
        investmentAmount: "25000.00",
        investmentRemark: "Additional investment request",
        transactionId: "TXN002",
        transactionNo: "INV002",
        createdById: adminUser.userId,
        createdByUser: "admin",
        createdDate: new Date("2024-04-15")
      }
    ];

    await db.insert(clientInvestmentRequest).values(sampleInvestmentRequests);

    console.log("Master data initialized successfully!");
    console.log(`Created roles: ${adminRole.name}, ${managerRole.name}, ${clientRole.name}`);
    console.log(`Created branch: ${mainBranch.name}`);
    console.log(`Created admin user: ${adminUser.userName}`);
    console.log(`Created sample client: ${sampleClient.name}`);
    console.log(`Created ${indicators.length} indicators`);
    console.log(`Created ${modules.length} modules`);
    console.log(`Created ${sampleTransactions.length} sample transactions`);
    console.log(`Created ${sampleInvestmentRequests.length} sample investment requests`);

  } catch (error) {
    console.error("Error initializing master data:", error);
    throw error;
  }
}