import {
  // New table types
  type MstUser,
  type InsertMstUser,
  type MstBranch,
  type InsertMstBranch,
  type MstClient,
  type InsertMstClient,
  type MstRole,
  type InsertMstRole,
  type MstModule,
  type InsertMstModule,
  type MstRoleRight,
  type InsertMstRoleRight,
  type MstIndicator,
  type InsertMstIndicator,
  type Transaction,
  type InsertTransaction,
  type ClientInvestmentRequest,
  type InsertClientInvestmentRequest,
  type ClientWithdrawalRequest,
  type InsertClientWithdrawalRequest,
  type ClientReferralRequest,
  type InsertClientReferralRequest,
  // Legacy types
  type User,
  type InsertUser,
  type Branch,
  type InsertBranch,
  type Client,
  type InsertClient,
  type LegacyTransaction,
  type InsertLegacyTransaction,
  type Portfolio,
  type InsertPortfolio,
  // New table schemas
  mstUser,
  mstBranch,
  mstClient,
  mstRole,
  mstModule,
  mstRoleRight,
  mstIndicator,
  transaction,
  clientInvestmentRequest,
  clientWithdrawalRequest,
  clientReferralRequest,
  // Legacy table schemas
  users,
  branches,
  clients,
  transactions,
  portfolios,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { initializeMasterData } from "./init-master-data";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // New Master Tables
  // Roles
  getMstRole(id: number): Promise<MstRole | undefined>;
  createMstRole(role: InsertMstRole): Promise<MstRole>;
  updateMstRole(id: number, role: Partial<InsertMstRole>): Promise<MstRole | undefined>;
  getAllMstRoles(): Promise<MstRole[]>;

  // Users (new)
  getMstUser(id: number): Promise<MstUser | undefined>;
  getMstUserByEmail(email: string): Promise<MstUser | undefined>;
  getMstUserByMobile(mobile: string): Promise<MstUser | undefined>;
  createMstUser(user: InsertMstUser): Promise<MstUser>;
  updateMstUser(id: number, user: Partial<InsertMstUser>): Promise<MstUser | undefined>;
  getAllMstUsers(): Promise<MstUser[]>;

  // Branches (new)
  getMstBranch(id: number): Promise<MstBranch | undefined>;
  createMstBranch(branch: InsertMstBranch): Promise<MstBranch>;
  updateMstBranch(id: number, branch: Partial<InsertMstBranch>): Promise<MstBranch | undefined>;
  getAllMstBranches(): Promise<MstBranch[]>;

  // Clients (new)
  getMstClient(id: number): Promise<MstClient | undefined>;
  getMstClientByCode(code: string): Promise<MstClient | undefined>;
  createMstClient(client: InsertMstClient): Promise<MstClient>;
  updateMstClient(id: number, client: Partial<InsertMstClient>): Promise<MstClient | undefined>;
  getAllMstClients(): Promise<MstClient[]>;

  // Modules
  getMstModule(id: number): Promise<MstModule | undefined>;
  createMstModule(module: InsertMstModule): Promise<MstModule>;
  updateMstModule(id: number, module: Partial<InsertMstModule>): Promise<MstModule | undefined>;
  getAllMstModules(): Promise<MstModule[]>;

  // Role Rights
  getMstRoleRight(id: number): Promise<MstRoleRight | undefined>;
  getMstRoleRightsByRole(roleId: number): Promise<MstRoleRight[]>;
  createMstRoleRight(roleRight: InsertMstRoleRight): Promise<MstRoleRight>;
  updateMstRoleRight(id: number, roleRight: Partial<InsertMstRoleRight>): Promise<MstRoleRight | undefined>;
  getAllMstRoleRights(): Promise<MstRoleRight[]>;

  // Indicators
  getMstIndicator(id: number): Promise<MstIndicator | undefined>;
  createMstIndicator(indicator: InsertMstIndicator): Promise<MstIndicator>;
  updateMstIndicator(id: number, indicator: Partial<InsertMstIndicator>): Promise<MstIndicator | undefined>;
  getAllMstIndicators(): Promise<MstIndicator[]>;

  // Transactions (new)
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByClient(clientId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<Transaction[]>;

  // Client Investment Requests
  getClientInvestmentRequest(id: number): Promise<ClientInvestmentRequest | undefined>;
  getClientInvestmentRequestsByClient(clientId: number): Promise<ClientInvestmentRequest[]>;
  getInvestmentRequestsByClient(clientId: number): Promise<ClientInvestmentRequest[]>;
  createClientInvestmentRequest(request: InsertClientInvestmentRequest): Promise<ClientInvestmentRequest>;
  getAllClientInvestmentRequests(): Promise<ClientInvestmentRequest[]>;
  getAllInvestmentRequests(): Promise<ClientInvestmentRequest[]>;

  // Client Withdrawal Requests
  getClientWithdrawalRequest(id: number): Promise<ClientWithdrawalRequest | undefined>;
  getClientWithdrawalRequestsByClient(clientId: number): Promise<ClientWithdrawalRequest[]>;
  getWithdrawalRequestsByClient(clientId: number): Promise<ClientWithdrawalRequest[]>;
  createClientWithdrawalRequest(request: InsertClientWithdrawalRequest): Promise<ClientWithdrawalRequest>;
  getAllClientWithdrawalRequests(): Promise<ClientWithdrawalRequest[]>;
  getAllWithdrawalRequests(): Promise<ClientWithdrawalRequest[]>;

  // Client Referral Requests
  getClientReferralRequest(id: number): Promise<ClientReferralRequest | undefined>;
  getClientReferralRequestsByClient(clientId: number): Promise<ClientReferralRequest[]>;
  createClientReferralRequest(request: InsertClientReferralRequest): Promise<ClientReferralRequest>;
  getAllClientReferralRequests(): Promise<ClientReferralRequest[]>;
  getAllReferralRequests(): Promise<ClientReferralRequest[]>;

  // Legacy Tables (for backward compatibility)
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Branches
  getBranch(id: string): Promise<Branch | undefined>;
  getBranchByCode(code: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined>;
  getAllBranches(): Promise<Branch[]>;

  // Clients
  getClient(id: string): Promise<Client | undefined>;
  getClientByUserId(userId: string): Promise<Client | undefined>;
  getClientByCode(clientCode: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;

  // Legacy Transactions
  getLegacyTransaction(id: string): Promise<LegacyTransaction | undefined>;
  getLegacyTransactionsByClient(clientId: string): Promise<LegacyTransaction[]>;
  createLegacyTransaction(transaction: InsertLegacyTransaction): Promise<LegacyTransaction>;
  updateLegacyTransaction(id: string, transaction: Partial<InsertLegacyTransaction>): Promise<LegacyTransaction | undefined>;
  getAllLegacyTransactions(): Promise<LegacyTransaction[]>;

  // Portfolio
  getPortfolio(id: string): Promise<Portfolio | undefined>;
  getPortfolioByClient(clientId: string): Promise<Portfolio[]>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: string, portfolio: Partial<InsertPortfolio>): Promise<Portfolio | undefined>;
  getAllPortfolios(): Promise<Portfolio[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize master data
    this.initializeMasterData();
  }

  private async initializeMasterData() {
    try {
      await initializeMasterData();
    } catch (error) {
      console.error("Failed to initialize master data:", error);
    }
  }

  // New Master Tables Implementation
  // Roles
  async getMstRole(id: number): Promise<MstRole | undefined> {
    const [role] = await db.select().from(mstRole).where(eq(mstRole.roleId, id));
    return role || undefined;
  }

  async createMstRole(roleData: InsertMstRole): Promise<MstRole> {
    await db.insert(mstRole).values(roleData);
    const [role] = await db.select().from(mstRole).where(eq(mstRole.name, roleData.name));
    return role;
  }

  async updateMstRole(id: number, roleData: Partial<InsertMstRole>): Promise<MstRole | undefined> {
    await db.update(mstRole).set(roleData).where(eq(mstRole.roleId, id));
    const [role] = await db.select().from(mstRole).where(eq(mstRole.roleId, id));
    return role || undefined;
  }

  async getAllMstRoles(): Promise<MstRole[]> {
    return db.select().from(mstRole);
  }

  // Users (new)
  async getMstUser(id: number): Promise<MstUser | undefined> {
    const [user] = await db.select().from(mstUser).where(eq(mstUser.userId, id));
    return user || undefined;
  }

  async getMstUserByEmail(email: string): Promise<MstUser | undefined> {
    const [user] = await db.select().from(mstUser).where(eq(mstUser.email, email));
    return user || undefined;
  }

  async getMstUserByMobile(mobile: string): Promise<MstUser | undefined> {
    const [user] = await db.select().from(mstUser).where(eq(mstUser.mobile, mobile));
    return user || undefined;
  }

  async createMstUser(userData: InsertMstUser): Promise<MstUser> {
    await db.insert(mstUser).values(userData);
    const [user] = await db.select().from(mstUser).where(eq(mstUser.userName, userData.userName));
    return user;
  }

  async updateMstUser(id: number, userData: Partial<InsertMstUser>): Promise<MstUser | undefined> {
    await db.update(mstUser).set(userData).where(eq(mstUser.userId, id));
    const [user] = await db.select().from(mstUser).where(eq(mstUser.userId, id));
    return user || undefined;
  }

  async getAllMstUsers(): Promise<MstUser[]> {
    return db.select().from(mstUser);
  }

  // Branches (new)
  async getMstBranch(id: number): Promise<MstBranch | undefined> {
    const [branch] = await db.select().from(mstBranch).where(eq(mstBranch.branchId, id));
    return branch || undefined;
  }

  async createMstBranch(branchData: InsertMstBranch): Promise<MstBranch> {
    await db.insert(mstBranch).values(branchData);
    const [branch] = await db.select().from(mstBranch).where(eq(mstBranch.name, branchData.name));
    return branch;
  }

  async updateMstBranch(id: number, branchData: Partial<InsertMstBranch>): Promise<MstBranch | undefined> {
    await db.update(mstBranch).set(branchData).where(eq(mstBranch.branchId, id));
    const [branch] = await db.select().from(mstBranch).where(eq(mstBranch.branchId, id));
    return branch || undefined;
  }

  async getAllMstBranches(): Promise<MstBranch[]> {
    return db.select().from(mstBranch);
  }

  // Clients (new)
  async getMstClient(id: number): Promise<MstClient | undefined> {
    const [client] = await db.select().from(mstClient).where(eq(mstClient.clientId, id));
    return client || undefined;
  }

  async getMstClientByCode(code: string): Promise<MstClient | undefined> {
    const [client] = await db.select().from(mstClient).where(eq(mstClient.code, code));
    return client || undefined;
  }

  async createMstClient(clientData: InsertMstClient): Promise<MstClient> {
    await db.insert(mstClient).values(clientData);
    const [client] = await db.select().from(mstClient).where(eq(mstClient.code, clientData.code));
    return client;
  }

  async updateMstClient(id: number, clientData: Partial<InsertMstClient>): Promise<MstClient | undefined> {
    await db.update(mstClient).set(clientData).where(eq(mstClient.clientId, id));
    const [client] = await db.select().from(mstClient).where(eq(mstClient.clientId, id));
    return client || undefined;
  }

  async getAllMstClients(): Promise<MstClient[]> {
    return db.select().from(mstClient);
  }

  // Modules
  async getMstModule(id: number): Promise<MstModule | undefined> {
    const [module] = await db.select().from(mstModule).where(eq(mstModule.moduleId, id));
    return module || undefined;
  }

  async createMstModule(moduleData: InsertMstModule): Promise<MstModule> {
    await db.insert(mstModule).values(moduleData);
    const [module] = await db.select().from(mstModule).where(eq(mstModule.name, moduleData.name));
    return module;
  }

  async updateMstModule(id: number, moduleData: Partial<InsertMstModule>): Promise<MstModule | undefined> {
    await db.update(mstModule).set(moduleData).where(eq(mstModule.moduleId, id));
    const [module] = await db.select().from(mstModule).where(eq(mstModule.moduleId, id));
    return module || undefined;
  }

  async getAllMstModules(): Promise<MstModule[]> {
    return db.select().from(mstModule);
  }

  // Role Rights
  async getMstRoleRight(id: number): Promise<MstRoleRight | undefined> {
    const [roleRight] = await db.select().from(mstRoleRight).where(eq(mstRoleRight.roleRightId, id));
    return roleRight || undefined;
  }

  async getMstRoleRightsByRole(roleId: number): Promise<MstRoleRight[]> {
    return db.select().from(mstRoleRight).where(eq(mstRoleRight.roleId, roleId));
  }

  async createMstRoleRight(roleRightData: InsertMstRoleRight): Promise<MstRoleRight> {
    await db.insert(mstRoleRight).values(roleRightData);
    const [roleRight] = await db.select().from(mstRoleRight).where(and(eq(mstRoleRight.roleId, roleRightData.roleId), eq(mstRoleRight.moduleId, roleRightData.moduleId)));
    return roleRight;
  }

  async updateMstRoleRight(id: number, roleRightData: Partial<InsertMstRoleRight>): Promise<MstRoleRight | undefined> {
    await db.update(mstRoleRight).set(roleRightData).where(eq(mstRoleRight.roleRightId, id));
    const [roleRight] = await db.select().from(mstRoleRight).where(eq(mstRoleRight.roleRightId, id));
    return roleRight || undefined;
  }

  async getAllMstRoleRights(): Promise<MstRoleRight[]> {
    return db.select().from(mstRoleRight);
  }

  // Indicators
  async getMstIndicator(id: number): Promise<MstIndicator | undefined> {
    const [indicator] = await db.select().from(mstIndicator).where(eq(mstIndicator.indicatorId, id));
    return indicator || undefined;
  }

  async createMstIndicator(indicatorData: InsertMstIndicator): Promise<MstIndicator> {
    await db.insert(mstIndicator).values(indicatorData);
    const [indicator] = await db.select().from(mstIndicator).where(eq(mstIndicator.name, indicatorData.name));
    return indicator;
  }

  async updateMstIndicator(id: number, indicatorData: Partial<InsertMstIndicator>): Promise<MstIndicator | undefined> {
    await db.update(mstIndicator).set(indicatorData).where(eq(mstIndicator.indicatorId, id));
    const [indicator] = await db.select().from(mstIndicator).where(eq(mstIndicator.indicatorId, id));
    return indicator || undefined;
  }

  async getAllMstIndicators(): Promise<MstIndicator[]> {
    return db.select().from(mstIndicator);
  }

  // Transactions (new)
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [txn] = await db.select().from(transaction).where(eq(transaction.transactionId, id));
    return txn || undefined;
  }

  async getTransactionsByClient(clientId: number): Promise<Transaction[]> {
    return db.select().from(transaction).where(eq(transaction.clientId, clientId));
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    await db.insert(transaction).values(transactionData);
    const [txn] = await db.select().from(transaction).where(and(eq(transaction.clientId, transactionData.clientId), eq(transaction.amount, transactionData.amount))).orderBy(desc(transaction.transactionId)).limit(1);
    return txn;
  }

  async updateTransaction(id: number, transactionData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    await db.update(transaction).set(transactionData).where(eq(transaction.transactionId, id));
    const [txn] = await db.select().from(transaction).where(eq(transaction.transactionId, id));
    return txn || undefined;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return db.select().from(transaction);
  }

  // Legacy transaction methods for compatibility
  async getLegacyTransaction(id: string): Promise<LegacyTransaction | undefined> {
    const [txn] = await db.select().from(transactions).where(eq(transactions.id, id));
    return txn || undefined;
  }

  async getLegacyTransactionsByClient(clientId: string): Promise<LegacyTransaction[]> {
    return db.select().from(transactions).where(eq(transactions.clientId, clientId));
  }

  async createLegacyTransaction(transactionData: InsertLegacyTransaction): Promise<LegacyTransaction> {
    await db.insert(transactions).values({
      ...transactionData,
      method: transactionData.method || 'bank_transfer',
    });
    const [txn] = await db.select().from(transactions).where(and(eq(transactions.clientId, transactionData.clientId), eq(transactions.amount, transactionData.amount))).orderBy(desc(transactions.createdAt)).limit(1);
    return txn;
  }

  async updateLegacyTransaction(id: string, transactionData: Partial<InsertLegacyTransaction>): Promise<LegacyTransaction | undefined> {
    await db.update(transactions).set(transactionData).where(eq(transactions.id, id));
    const [txn] = await db.select().from(transactions).where(eq(transactions.id, id));
    return txn || undefined;
  }

  async getAllLegacyTransactions(): Promise<LegacyTransaction[]> {
    return db.select().from(transactions);
  }

  // Client Investment Requests
  async getClientInvestmentRequest(id: number): Promise<ClientInvestmentRequest | undefined> {
    const [request] = await db.select().from(clientInvestmentRequest).where(eq(clientInvestmentRequest.clientInvestmentRequestId, id));
    return request || undefined;
  }

  async getClientInvestmentRequestsByClient(clientId: number): Promise<ClientInvestmentRequest[]> {
    return db.select().from(clientInvestmentRequest).where(eq(clientInvestmentRequest.clientId, clientId));
  }

  async createClientInvestmentRequest(requestData: InsertClientInvestmentRequest): Promise<ClientInvestmentRequest> {
    await db.insert(clientInvestmentRequest).values(requestData);
    const [request] = await db.select().from(clientInvestmentRequest).where(eq(clientInvestmentRequest.transactionId, requestData.transactionId));
    return request;
  }

  async getAllClientInvestmentRequests(): Promise<ClientInvestmentRequest[]> {
    return db.select().from(clientInvestmentRequest);
  }

  async getInvestmentRequestsByClient(clientId: number): Promise<ClientInvestmentRequest[]> {
    return this.getClientInvestmentRequestsByClient(clientId);
  }

  async getAllInvestmentRequests(): Promise<ClientInvestmentRequest[]> {
    return this.getAllClientInvestmentRequests();
  }

  // Client Withdrawal Requests
  async getClientWithdrawalRequest(id: number): Promise<ClientWithdrawalRequest | undefined> {
    const [request] = await db.select().from(clientWithdrawalRequest).where(eq(clientWithdrawalRequest.clientWithdrawalRequestId, id));
    return request || undefined;
  }

  async getClientWithdrawalRequestsByClient(clientId: number): Promise<ClientWithdrawalRequest[]> {
    return db.select().from(clientWithdrawalRequest).where(eq(clientWithdrawalRequest.clientId, clientId));
  }

  async createClientWithdrawalRequest(requestData: InsertClientWithdrawalRequest): Promise<ClientWithdrawalRequest> {
    await db.insert(clientWithdrawalRequest).values(requestData);
    const [request] = await db.select().from(clientWithdrawalRequest).where(and(eq(clientWithdrawalRequest.clientId, requestData.clientId), eq(clientWithdrawalRequest.withdrawalAmount, requestData.withdrawalAmount))).orderBy(desc(clientWithdrawalRequest.clientWithdrawalRequestId)).limit(1);
    return request;
  }

  async getAllClientWithdrawalRequests(): Promise<ClientWithdrawalRequest[]> {
    return db.select().from(clientWithdrawalRequest);
  }

  async getWithdrawalRequestsByClient(clientId: number): Promise<ClientWithdrawalRequest[]> {
    return this.getClientWithdrawalRequestsByClient(clientId);
  }

  async getAllWithdrawalRequests(): Promise<ClientWithdrawalRequest[]> {
    return this.getAllClientWithdrawalRequests();
  }

  // Client Referral Requests
  async getClientReferralRequest(id: number): Promise<ClientReferralRequest | undefined> {
    const [request] = await db.select().from(clientReferralRequest).where(eq(clientReferralRequest.clientReferralRequestId, id));
    return request || undefined;
  }

  async getClientReferralRequestsByClient(clientId: number): Promise<ClientReferralRequest[]> {
    return db.select().from(clientReferralRequest).where(eq(clientReferralRequest.clientId, clientId));
  }

  async createClientReferralRequest(requestData: InsertClientReferralRequest): Promise<ClientReferralRequest> {
    await db.insert(clientReferralRequest).values(requestData);
    const [request] = await db.select().from(clientReferralRequest).where(and(eq(clientReferralRequest.clientId, requestData.clientId), eq(clientReferralRequest.mobile, requestData.mobile))).orderBy(desc(clientReferralRequest.clientReferralRequestId)).limit(1);
    return request;
  }

  async getAllClientReferralRequests(): Promise<ClientReferralRequest[]> {
    return db.select().from(clientReferralRequest);
  }

  async getAllReferralRequests(): Promise<ClientReferralRequest[]> {
    return this.getAllClientReferralRequests();
  }

  private async initializeMockData() {
    // Legacy mock data initialization disabled - using mst_* tables instead
    console.log("Legacy mock data initialization skipped - using master tables");
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.mobile, mobile));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    await db.insert(users).values(userData);
    const [user] = await db.select().from(users).where(eq(users.email, userData.email));
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    await db.update(users).set(userData).where(eq(users.id, id));
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Branches
  async getBranch(id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch || undefined;
  }

  async getBranchByCode(code: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.code, code));
    return branch || undefined;
  }

  async createBranch(branchData: InsertBranch): Promise<Branch> {
    await db.insert(branches).values(branchData);
    const [branch] = await db.select().from(branches).where(eq(branches.code, branchData.code));
    return branch;
  }

  async updateBranch(id: string, branchData: Partial<InsertBranch>): Promise<Branch | undefined> {
    await db.update(branches).set(branchData).where(eq(branches.id, id));
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch || undefined;
  }

  async getAllBranches(): Promise<Branch[]> {
    return db.select().from(branches);
  }

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientByUserId(userId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId));
    return client || undefined;
  }

  async getClientByCode(clientCode: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.clientCode, clientCode));
    return client || undefined;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    await db.insert(clients).values(clientData);
    const [client] = await db.select().from(clients).where(eq(clients.clientCode, clientData.clientCode));
    return client;
  }

  async updateClient(id: string, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    await db.update(clients).set(clientData).where(eq(clients.id, id));
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getAllClients(): Promise<Client[]> {
    return db.select().from(clients);
  }



  // Portfolios
  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, id));
    return portfolio || undefined;
  }

  async getPortfolioByClient(clientId: string): Promise<Portfolio[]> {
    return db.select().from(portfolios).where(eq(portfolios.clientId, clientId));
  }

  async createPortfolio(portfolioData: InsertPortfolio): Promise<Portfolio> {
    await db.insert(portfolios).values(portfolioData);
    const [portfolio] = await db.select().from(portfolios).where(and(eq(portfolios.clientId, portfolioData.clientId), eq(portfolios.instrumentName, portfolioData.instrumentName))).orderBy(desc(portfolios.updatedAt)).limit(1);
    return portfolio;
  }

  async updatePortfolio(id: string, portfolioData: Partial<InsertPortfolio>): Promise<Portfolio | undefined> {
    await db.update(portfolios).set(portfolioData).where(eq(portfolios.id, id));
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, id));
    return portfolio || undefined;
  }

  async getAllPortfolios(): Promise<Portfolio[]> {
    return db.select().from(portfolios);
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private branches: Map<string, Branch>;
  private clients: Map<string, Client>;
  private transactions: Map<string, Transaction>;
  private portfolios: Map<string, Portfolio>;
  
  // New master table storage
  private mstUsers: Map<number, MstUser> = new Map();
  private mstBranches: Map<number, MstBranch> = new Map();
  private mstClients: Map<number, MstClient> = new Map();
  private mstRoles: Map<number, MstRole> = new Map();
  private mstModules: Map<number, MstModule> = new Map();
  private mstRoleRights: Map<number, MstRoleRight> = new Map();
  private mstIndicators: Map<number, MstIndicator> = new Map();
  private newTransactions: Map<number, Transaction> = new Map();
  private investmentRequests: Map<number, ClientInvestmentRequest> = new Map();
  private withdrawalRequests: Map<number, ClientWithdrawalRequest> = new Map();
  private referralRequests: Map<number, ClientReferralRequest> = new Map();

  constructor() {
    this.users = new Map();
    this.branches = new Map();
    this.clients = new Map();
    this.transactions = new Map();
    this.portfolios = new Map();

    // Initialize with some mock data
    this.initializeMockData();
  }

  private async initializeMockData() {
    // Create mock branches
    const mainBranch = await this.createBranch({
      name: "Main Branch",
      code: "MB001",
      address: "123 Business District, City",
      phone: "+91-9876543210",
      email: "main@gandharva.com",
      manager: "John Manager",
    });

    // Create mock users
    const adminUser = await this.createUser({
      email: "admin@gandharva.com",
      mobile: "9876543210",
      password: "admin123",
      role: "admin",
      firstName: "Admin",
      lastName: "User",
      branchId: mainBranch.id,
      isActive: 1,
    });

    const leaderUser = await this.createUser({
      email: "leader@gandharva.com",
      mobile: "9876543211",
      password: "leader123",
      role: "leader",
      firstName: "Leader",
      lastName: "User",
      branchId: mainBranch.id,
      isActive: 1,
    });

    const clientUser = await this.createUser({
      email: "client@gandharva.com",
      mobile: "9876543212",
      password: "client123",
      role: "client",
      firstName: "John",
      lastName: "Client",
      branchId: mainBranch.id,
      isActive: 1,
    });

    // Create mock client profile
    const mockClient = await this.createClient({
      userId: clientUser.id,
      clientCode: "CL001",
      panNumber: "XXXXX0001X",
      aadharNumber: "123456789012",
      address: "456 Client Street, City",
      kycStatus: "verified",
      totalInvestment: "50000.00",
      currentValue: "52500.00",
    });

    // Mock transactions creation disabled for MemStorage
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.mobile === mobile,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      mobile: insertUser.mobile || null,
      branchId: insertUser.branchId || null,
      isActive: insertUser.isActive ?? 1,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(
    id: string,
    updateUser: Partial<InsertUser>,
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updateUser };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Branch methods
  async getBranch(id: string): Promise<Branch | undefined> {
    return this.branches.get(id);
  }

  async getBranchByCode(code: string): Promise<Branch | undefined> {
    return Array.from(this.branches.values()).find(
      (branch) => branch.code === code,
    );
  }

  async createBranch(insertBranch: InsertBranch): Promise<Branch> {
    const id = randomUUID();
    const branch: Branch = {
      ...insertBranch,
      phone: insertBranch.phone || null,
      email: insertBranch.email || null,
      manager: insertBranch.manager || null,
      id,
      createdAt: new Date(),
    };
    this.branches.set(id, branch);
    return branch;
  }

  async updateBranch(
    id: string,
    updateBranch: Partial<InsertBranch>,
  ): Promise<Branch | undefined> {
    const branch = this.branches.get(id);
    if (!branch) return undefined;
    const updated = { ...branch, ...updateBranch };
    this.branches.set(id, updated);
    return updated;
  }

  async getAllBranches(): Promise<Branch[]> {
    return Array.from(this.branches.values());
  }

  // Client methods
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByUserId(userId: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.userId === userId,
    );
  }

  async getClientByCode(clientCode: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.clientCode === clientCode,
    );
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      ...insertClient,
      panNumber: insertClient.panNumber || null,
      aadharNumber: insertClient.aadharNumber || null,
      dateOfBirth: insertClient.dateOfBirth || null,
      address: insertClient.address || null,
      nomineeDetails: insertClient.nomineeDetails || null,
      bankDetails: insertClient.bankDetails || null,
      kycStatus: insertClient.kycStatus || "pending",
      totalInvestment: insertClient.totalInvestment || "0",
      currentValue: insertClient.currentValue || "0",
      id,
      createdAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(
    id: string,
    updateClient: Partial<InsertClient>,
  ): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    const updated = { ...client, ...updateClient };
    this.clients.set(id, updated);
    return updated;
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.newTransactions.get(id);
  }

  async getTransactionsByClient(clientId: number): Promise<Transaction[]> {
    return Array.from(this.newTransactions.values()).filter(
      (txn) => txn.clientId === clientId,
    );
  }

  async createTransaction(
    insertTransaction: InsertTransaction,
  ): Promise<Transaction> {
    const id = parseInt(randomUUID().replace(/-/g, '').substring(0, 8), 16);
    const transaction: Transaction = {
      ...insertTransaction,
      transactionId: id,
      remark: insertTransaction.remark || null,
    };
    this.newTransactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(
    id: number,
    updateTransaction: Partial<InsertTransaction>,
  ): Promise<Transaction | undefined> {
    const transaction = this.newTransactions.get(id);
    if (!transaction) return undefined;
    const updated = { ...transaction, ...updateTransaction };
    this.newTransactions.set(id, updated);
    return updated;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.newTransactions.values());
  }

  // Portfolio methods
  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }

  async getPortfolioByClient(clientId: string): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values()).filter(
      (portfolio) => portfolio.clientId === clientId,
    );
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const id = randomUUID();
    const portfolio: Portfolio = {
      ...insertPortfolio,
      quantity: insertPortfolio.quantity || null,
      currentPrice: insertPortfolio.currentPrice || null,
      currentValue: insertPortfolio.currentValue || null,
      gainLoss: insertPortfolio.gainLoss || null,
      gainLossPercentage: insertPortfolio.gainLossPercentage || null,
      id,
      updatedAt: new Date(),
    };
    this.portfolios.set(id, portfolio);
    return portfolio;
  }

  async updatePortfolio(
    id: string,
    updatePortfolio: Partial<InsertPortfolio>,
  ): Promise<Portfolio | undefined> {
    const portfolio = this.portfolios.get(id);
    if (!portfolio) return undefined;
    const updated = { ...portfolio, ...updatePortfolio, updatedAt: new Date() };
    this.portfolios.set(id, updated);
    return updated;
  }

  async getAllPortfolios(): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values());
  }

  // New master table methods - simplified implementation for MemStorage
  // Master table methods - not implemented in MemStorage
  async getMstRole(id: number): Promise<MstRole | undefined> { throw new Error('Not implemented in MemStorage'); }
  async createMstRole(role: InsertMstRole): Promise<MstRole> { throw new Error('Not implemented in MemStorage'); }
  async updateMstRole(id: number, role: Partial<InsertMstRole>): Promise<MstRole | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getAllMstRoles(): Promise<MstRole[]> { throw new Error('Not implemented in MemStorage'); }
  async getMstUser(id: number): Promise<MstUser | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getMstUserByEmail(email: string): Promise<MstUser | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getMstUserByMobile(mobile: string): Promise<MstUser | undefined> { throw new Error('Not implemented in MemStorage'); }
  async createMstUser(user: InsertMstUser): Promise<MstUser> { throw new Error('Not implemented in MemStorage'); }
  async updateMstUser(id: number, user: Partial<InsertMstUser>): Promise<MstUser | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getAllMstUsers(): Promise<MstUser[]> { throw new Error('Not implemented in MemStorage'); }
  async getMstBranch(id: number): Promise<MstBranch | undefined> { throw new Error('Not implemented in MemStorage'); }
  async createMstBranch(branch: InsertMstBranch): Promise<MstBranch> { throw new Error('Not implemented in MemStorage'); }
  async updateMstBranch(id: number, branch: Partial<InsertMstBranch>): Promise<MstBranch | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getAllMstBranches(): Promise<MstBranch[]> { throw new Error('Not implemented in MemStorage'); }
  async getMstClient(id: number): Promise<MstClient | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getMstClientByCode(code: string): Promise<MstClient | undefined> { throw new Error('Not implemented in MemStorage'); }
  async createMstClient(client: InsertMstClient): Promise<MstClient> { throw new Error('Not implemented in MemStorage'); }
  async updateMstClient(id: number, client: Partial<InsertMstClient>): Promise<MstClient | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getAllMstClients(): Promise<MstClient[]> { throw new Error('Not implemented in MemStorage'); }
  async getMstModule(id: number): Promise<MstModule | undefined> { throw new Error('Not implemented in MemStorage'); }
  async createMstModule(module: InsertMstModule): Promise<MstModule> { throw new Error('Not implemented in MemStorage'); }
  async updateMstModule(id: number, module: Partial<InsertMstModule>): Promise<MstModule | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getAllMstModules(): Promise<MstModule[]> { throw new Error('Not implemented in MemStorage'); }
  async getMstRoleRight(id: number): Promise<MstRoleRight | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getMstRoleRightsByRole(roleId: number): Promise<MstRoleRight[]> { throw new Error('Not implemented in MemStorage'); }
  async createMstRoleRight(roleRight: InsertMstRoleRight): Promise<MstRoleRight> { throw new Error('Not implemented in MemStorage'); }
  async updateMstRoleRight(id: number, roleRight: Partial<InsertMstRoleRight>): Promise<MstRoleRight | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getAllMstRoleRights(): Promise<MstRoleRight[]> { throw new Error('Not implemented in MemStorage'); }
  async getMstIndicator(id: number): Promise<MstIndicator | undefined> { throw new Error('Not implemented in MemStorage'); }
  async createMstIndicator(indicator: InsertMstIndicator): Promise<MstIndicator> { throw new Error('Not implemented in MemStorage'); }
  async updateMstIndicator(id: number, indicator: Partial<InsertMstIndicator>): Promise<MstIndicator | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getAllMstIndicators(): Promise<MstIndicator[]> { throw new Error('Not implemented in MemStorage'); }
  async getClientInvestmentRequest(id: number): Promise<ClientInvestmentRequest | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getClientInvestmentRequestsByClient(clientId: number): Promise<ClientInvestmentRequest[]> { throw new Error('Not implemented in MemStorage'); }
  async getInvestmentRequestsByClient(clientId: number): Promise<ClientInvestmentRequest[]> { throw new Error('Not implemented in MemStorage'); }
  async createClientInvestmentRequest(request: InsertClientInvestmentRequest): Promise<ClientInvestmentRequest> { throw new Error('Not implemented in MemStorage'); }
  async getAllClientInvestmentRequests(): Promise<ClientInvestmentRequest[]> { throw new Error('Not implemented in MemStorage'); }
  async getAllInvestmentRequests(): Promise<ClientInvestmentRequest[]> { throw new Error('Not implemented in MemStorage'); }
  async getClientWithdrawalRequest(id: number): Promise<ClientWithdrawalRequest | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getClientWithdrawalRequestsByClient(clientId: number): Promise<ClientWithdrawalRequest[]> { throw new Error('Not implemented in MemStorage'); }
  async getWithdrawalRequestsByClient(clientId: number): Promise<ClientWithdrawalRequest[]> { throw new Error('Not implemented in MemStorage'); }
  async createClientWithdrawalRequest(request: InsertClientWithdrawalRequest): Promise<ClientWithdrawalRequest> { throw new Error('Not implemented in MemStorage'); }
  async getAllClientWithdrawalRequests(): Promise<ClientWithdrawalRequest[]> { throw new Error('Not implemented in MemStorage'); }
  async getAllWithdrawalRequests(): Promise<ClientWithdrawalRequest[]> { throw new Error('Not implemented in MemStorage'); }
  async getClientReferralRequest(id: number): Promise<ClientReferralRequest | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getClientReferralRequestsByClient(clientId: number): Promise<ClientReferralRequest[]> { throw new Error('Not implemented in MemStorage'); }
  async createClientReferralRequest(request: InsertClientReferralRequest): Promise<ClientReferralRequest> { throw new Error('Not implemented in MemStorage'); }
  async getAllClientReferralRequests(): Promise<ClientReferralRequest[]> { throw new Error('Not implemented in MemStorage'); }
  async getAllReferralRequests(): Promise<ClientReferralRequest[]> { throw new Error('Not implemented in MemStorage'); }
  
  async getLegacyTransaction(id: string): Promise<LegacyTransaction | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getLegacyTransactionsByClient(clientId: string): Promise<LegacyTransaction[]> { throw new Error('Not implemented in MemStorage'); }
  async createLegacyTransaction(transaction: InsertLegacyTransaction): Promise<LegacyTransaction> { throw new Error('Not implemented in MemStorage'); }
  async updateLegacyTransaction(id: string, transaction: Partial<InsertLegacyTransaction>): Promise<LegacyTransaction | undefined> { throw new Error('Not implemented in MemStorage'); }
  async getAllLegacyTransactions(): Promise<LegacyTransaction[]> { throw new Error('Not implemented in MemStorage'); }
}

export const storage = new DatabaseStorage();
