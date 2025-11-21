import { sql, relations } from "drizzle-orm";
import { mysqlTable, text, varchar, decimal, timestamp, int, boolean, tinyint, date, bigint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Master Role table
export const mstRole = mysqlTable("mst_role", {
  roleId: int("role_id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: tinyint("is_active").notNull(),
  createdById: int("created_by_id").notNull(),
  createdByUser: varchar("created_by_user", { length: 50 }).notNull(),
  createdDate: timestamp("created_date").notNull(),
  modifiedById: int("modified_by_id"),
  modifiedByUser: varchar("modified_by_user", { length: 50 }),
  modifiedDate: timestamp("modified_date"),
  deletedById: int("deleted_by_id"),
  deletedByUser: varchar("deleted_by_user", { length: 50 }),
  deletedDate: timestamp("deleted_date"),
});

// Master User table
export const mstUser = mysqlTable("mst_user", {
  userId: int("user_id").primaryKey().autoincrement(),
  userName: varchar("user_name", { length: 100 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 20 }),
  mobileVerified: timestamp("mobile_verified"),
  email: varchar("email", { length: 50 }),
  emailVerified: timestamp("email_verified"),
  roleId: int("role_id").notNull(),
  clientId: int("client_id"),
  isActive: tinyint("is_active").notNull(),
  createdById: int("created_by_id").notNull(),
  createdByUser: varchar("created_by_user", { length: 50 }).notNull(),
  createdDate: timestamp("created_date").notNull(),
  modifiedById: int("modified_by_id"),
  modifiedByUser: varchar("modified_by_user", { length: 50 }),
  modifiedDate: timestamp("modified_date"),
  deletedById: int("deleted_by_id"),
  deletedByUser: varchar("deleted_by_user", { length: 50 }),
  deletedDate: timestamp("deleted_date"),
});

// Master Branch table
export const mstBranch = mysqlTable("mst_branch", {
  branchId: int("branch_id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  address: varchar("address", { length: 100 }),
  city: varchar("city", { length: 50 }),
  pincode: int("pincode"),
  isActive: tinyint("is_active").notNull(),
  createdById: int("created_by_id").notNull(),
  createdByUser: varchar("created_by_user", { length: 50 }).notNull(),
  createdDate: timestamp("created_date").notNull(),
  modifiedById: int("modified_by_id"),
  modifiedByUser: varchar("modified_by_user", { length: 50 }),
  modifiedDate: timestamp("modified_date"),
  deletedById: int("deleted_by_id"),
  deletedByUser: varchar("deleted_by_user", { length: 50 }),
  deletedDate: timestamp("deleted_date"),
});

// Master Client table
export const mstClient = mysqlTable("mst_client", {
  clientId: int("client_id").primaryKey().autoincrement(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  mobile: varchar("mobile", { length: 20 }),
  email: varchar("email", { length: 50 }),
  dob: date("dob"),
  panNo: varchar("pan_no", { length: 10 }),
  aadhaarNo: varchar("aadhaar_no", { length: 15 }),
  branch: varchar("branch", { length: 20 }),
  branchId: int("branch_id"),
  address: varchar("address", { length: 200 }),
  city: varchar("city", { length: 50 }),
  pincode: int("pincode"),
  referenceId: int("reference_id"),
  isActive: tinyint("is_active").notNull(),
  createdById: int("created_by_id").notNull(),
  createdByUser: varchar("created_by_user", { length: 50 }).notNull(),
  createdDate: timestamp("created_date").notNull(),
  modifiedById: int("modified_by_id"),
  modifiedByUser: varchar("modified_by_user", { length: 50 }),
  modifiedDate: timestamp("modified_date"),
  deletedById: int("deleted_by_id"),
  deletedByUser: varchar("deleted_by_user", { length: 50 }),
  deletedDate: timestamp("deleted_date"),
});

// Master Module table
export const mstModule = mysqlTable("mst_module", {
  moduleId: int("module_id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  parentModuleId: int("parent_module_id"),
  tableName: varchar("table_name", { length: 50 }),
  icon: varchar("icon", { length: 50 }),
  seqNo: int("seq_no"),
  isActive: tinyint("is_active").notNull(),
  createdById: int("created_by_id").notNull(),
  createdByUser: varchar("created_by_user", { length: 50 }).notNull(),
  createdDate: timestamp("created_date").notNull(),
  modifiedById: int("modified_by_id"),
  modifiedByUser: varchar("modified_by_user", { length: 50 }),
  modifiedDate: timestamp("modified_date"),
  deletedById: int("deleted_by_id"),
  deletedByUser: varchar("deleted_by_user", { length: 50 }),
  deletedDate: timestamp("deleted_date"),
});

// Master Role Right table
export const mstRoleRight = mysqlTable("mst_role_right", {
  roleRightId: int("role_right_id").primaryKey().autoincrement(),
  roleId: int("role_id").notNull(),
  moduleId: int("module_id").notNull(),
  accessRead: int("access_read").notNull(),
  accessWrite: int("access_write").notNull(),
  accessUpdate: int("access_update").notNull(),
  accessDelete: int("access_delete").notNull(),
  accessExport: int("access_export").notNull(),
});

// Master Indicator table
export const mstIndicator = mysqlTable("mst_indicator", {
  indicatorId: int("indicator_id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: tinyint("is_active").notNull(),
  createdById: int("created_by_id").notNull(),
  createdByUser: varchar("created_by_user", { length: 50 }).notNull(),
  createdDate: timestamp("created_date").notNull(),
  modifiedById: int("modified_by_id"),
  modifiedByUser: varchar("modified_by_user", { length: 50 }),
  modifiedDate: timestamp("modified_date"),
  deletedById: int("deleted_by_id"),
  deletedByUser: varchar("deleted_by_user", { length: 50 }),
  deletedDate: timestamp("deleted_date"),
});

// Transaction table
export const transaction = mysqlTable("transaction", {
  transactionId: bigint("transaction_id", { mode: "number" }).primaryKey().autoincrement(),
  transactionDate: date("transaction_date").notNull(),
  clientId: int("client_id").notNull(),
  indicatorId: int("indicator_id").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  remark: varchar("remark", { length: 50 }),
  guiid: varchar("guiid", { length: 200 }),
  createdById: int("created_by_id").notNull(),
  createdByUser: varchar("created_by_user", { length: 50 }).notNull(),
  createdDate: timestamp("created_date").notNull(),
});

// Client Investment Request table
export const clientInvestmentRequest = mysqlTable("client_investment_request", {
  clientInvestmentRequestId: int("client_investment_request_id").primaryKey().autoincrement(),
  clientId: int("client_id").notNull(),
  investmentDate: date("investment_date").notNull(),
  investmentAmount: decimal("investment_amount", { precision: 18, scale: 2 }).notNull(),
  investmentRemark: varchar("investment_remark", { length: 100 }),
  transactionId: varchar("transaction_id", { length: 100 }).notNull(),
  transactionNo: varchar("transaction_no", { length: 100 }).notNull(),
  createdById: int("created_by_id").notNull(),
  createdByUser: varchar("created_by_user", { length: 50 }).notNull(),
  createdDate: timestamp("created_date").notNull(),
});

// Client Withdrawal Request table
export const clientWithdrawalRequest = mysqlTable("client_withdrawal_request", {
  clientWithdrawalRequestId: int("client_withdrawal_request_id").primaryKey().autoincrement(),
  clientId: int("client_id").notNull(),
  withdrawalDate: date("withdrawal_date").notNull(),
  withdrawalAmount: decimal("withdrawal_amount", { precision: 18, scale: 2 }).notNull(),
  withdrawalRemark: varchar("withdrawal_remark", { length: 500 }),
  createdById: int("created_by_id").notNull(),
  createdByUser: varchar("created_by_user", { length: 50 }).notNull(),
  createdDate: timestamp("created_date").notNull(),
});

// Client Referral Request table
export const clientReferralRequest = mysqlTable("client_referral_request", {
  clientReferralRequestId: int("client_referral_request_id").primaryKey().autoincrement(),
  clientId: int("client_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  mobile: varchar("mobile", { length: 20 }).notNull(),
  createdById: int("created_by_id").notNull(),
  createdByUser: varchar("created_by_user", { length: 50 }).notNull(),
  createdDate: timestamp("created_date").notNull(),
});

// Branches table
export const branches = mysqlTable("branches", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  manager: text("manager"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table with roles
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: text("email").notNull().unique(),
  mobile: text("mobile").unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'admin', 'leader', 'client'
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  branchId: varchar("branch_id", { length: 36 }).references(() => branches.id),
  isActive: tinyint("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients table (extends users)
export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  clientCode: text("client_code").notNull().unique(),
  panNumber: text("pan_number"),
  aadharNumber: text("aadhar_number"),
  dateOfBirth: timestamp("date_of_birth"),
  address: text("address"),
  nomineeDetails: text("nominee_details"),
  bankDetails: text("bank_details"),
  kycStatus: text("kyc_status").default('pending'), // 'pending', 'verified', 'rejected'
  totalInvestment: decimal("total_investment", { precision: 15, scale: 2 }).default('0'),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table
export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  type: text("type").notNull(), // 'investment', 'withdrawal', 'payout', 'closure'
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  method: text("method").notNull(), // 'cash', 'bank_transfer', 'upi', 'cheque'
  status: text("status").notNull().default('pending'), // 'pending', 'completed', 'failed', 'cancelled'
  description: text("description"),
  referenceNumber: text("reference_number"),
  processedBy: varchar("processed_by", { length: 36 }).references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolio table for client investments
export const portfolios = mysqlTable("portfolios", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  instrumentType: text("instrument_type").notNull(), // 'equity', 'mutual_fund', 'bond', 'fd'
  instrumentName: text("instrument_name").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 4 }),
  purchasePrice: decimal("purchase_price", { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 15, scale: 2 }),
  totalInvested: decimal("total_invested", { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }),
  gainLoss: decimal("gain_loss", { precision: 15, scale: 2 }),
  gainLossPercentage: decimal("gain_loss_percentage", { precision: 5, scale: 2 }),
  purchaseDate: timestamp("purchase_date").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for new tables
export const insertMstRoleSchema = createInsertSchema(mstRole).omit({ roleId: true });
export const insertMstUserSchema = createInsertSchema(mstUser).omit({ userId: true });
export const insertMstBranchSchema = createInsertSchema(mstBranch).omit({ branchId: true });
export const insertMstClientSchema = createInsertSchema(mstClient).omit({ clientId: true });
export const insertMstModuleSchema = createInsertSchema(mstModule).omit({ moduleId: true });
export const insertMstRoleRightSchema = createInsertSchema(mstRoleRight).omit({ roleRightId: true });
export const insertMstIndicatorSchema = createInsertSchema(mstIndicator).omit({ indicatorId: true });
export const insertTransactionSchema = createInsertSchema(transaction).omit({ transactionId: true });
export const insertClientInvestmentRequestSchema = createInsertSchema(clientInvestmentRequest).omit({ clientInvestmentRequestId: true });
export const insertClientWithdrawalRequestSchema = createInsertSchema(clientWithdrawalRequest).omit({ clientWithdrawalRequestId: true });
export const insertClientReferralRequestSchema = createInsertSchema(clientReferralRequest).omit({ clientReferralRequestId: true });

// Legacy insert schemas
export const insertBranchSchema = createInsertSchema(branches).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertLegacyTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true, processedAt: true });
export const insertPortfolioSchema = createInsertSchema(portfolios).omit({ id: true, updatedAt: true });

// Relations for new tables
export const mstUserRelations = relations(mstUser, ({ one, many }) => ({
  role: one(mstRole, {
    fields: [mstUser.roleId],
    references: [mstRole.roleId],
  }),
  client: one(mstClient, {
    fields: [mstUser.clientId],
    references: [mstClient.clientId],
  }),
  createdTransactions: many(transaction, { relationName: "createdBy" }),
  createdInvestmentRequests: many(clientInvestmentRequest, { relationName: "createdBy" }),
  createdWithdrawalRequests: many(clientWithdrawalRequest, { relationName: "createdBy" }),
  createdReferralRequests: many(clientReferralRequest, { relationName: "createdBy" }),
}));

export const mstRoleRelations = relations(mstRole, ({ many }) => ({
  users: many(mstUser),
  roleRights: many(mstRoleRight),
}));

export const mstBranchRelations = relations(mstBranch, ({ many }) => ({
  clients: many(mstClient),
}));

export const mstClientRelations = relations(mstClient, ({ one, many }) => ({
  branch: one(mstBranch, {
    fields: [mstClient.branchId],
    references: [mstBranch.branchId],
  }),
  user: one(mstUser, {
    fields: [mstClient.clientId],
    references: [mstUser.clientId],
  }),
  transactions: many(transaction),
  investmentRequests: many(clientInvestmentRequest),
  withdrawalRequests: many(clientWithdrawalRequest),
  referralRequests: many(clientReferralRequest),
}));

export const mstModuleRelations = relations(mstModule, ({ one, many }) => ({
  parentModule: one(mstModule, {
    fields: [mstModule.parentModuleId],
    references: [mstModule.moduleId],
  }),
  childModules: many(mstModule, { relationName: "parentModule" }),
  roleRights: many(mstRoleRight),
}));

export const mstRoleRightRelations = relations(mstRoleRight, ({ one }) => ({
  role: one(mstRole, {
    fields: [mstRoleRight.roleId],
    references: [mstRole.roleId],
  }),
  module: one(mstModule, {
    fields: [mstRoleRight.moduleId],
    references: [mstModule.moduleId],
  }),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
  client: one(mstClient, {
    fields: [transaction.clientId],
    references: [mstClient.clientId],
  }),
  indicator: one(mstIndicator, {
    fields: [transaction.indicatorId],
    references: [mstIndicator.indicatorId],
  }),
}));

export const clientInvestmentRequestRelations = relations(clientInvestmentRequest, ({ one }) => ({
  client: one(mstClient, {
    fields: [clientInvestmentRequest.clientId],
    references: [mstClient.clientId],
  }),
}));

export const clientWithdrawalRequestRelations = relations(clientWithdrawalRequest, ({ one }) => ({
  client: one(mstClient, {
    fields: [clientWithdrawalRequest.clientId],
    references: [mstClient.clientId],
  }),
}));

export const clientReferralRequestRelations = relations(clientReferralRequest, ({ one }) => ({
  client: one(mstClient, {
    fields: [clientReferralRequest.clientId],
    references: [mstClient.clientId],
  }),
}));

// Legacy relations
export const branchesRelations = relations(branches, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  client: one(clients),
  processedTransactions: many(transactions, { relationName: "processedBy" }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  portfolios: many(portfolios),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  client: one(clients, {
    fields: [transactions.clientId],
    references: [clients.id],
  }),
  processedByUser: one(users, {
    fields: [transactions.processedBy],
    references: [users.id],
    relationName: "processedBy",
  }),
}));

export const portfoliosRelations = relations(portfolios, ({ one }) => ({
  client: one(clients, {
    fields: [portfolios.clientId],
    references: [clients.id],
  }),
}));

// Types for new tables
export type MstRole = typeof mstRole.$inferSelect;
export type InsertMstRole = z.infer<typeof insertMstRoleSchema>;
export type MstUser = typeof mstUser.$inferSelect;
export type InsertMstUser = z.infer<typeof insertMstUserSchema>;
export type MstBranch = typeof mstBranch.$inferSelect;
export type InsertMstBranch = z.infer<typeof insertMstBranchSchema>;
export type MstClient = typeof mstClient.$inferSelect;
export type InsertMstClient = z.infer<typeof insertMstClientSchema>;
export type MstModule = typeof mstModule.$inferSelect;
export type InsertMstModule = z.infer<typeof insertMstModuleSchema>;
export type MstRoleRight = typeof mstRoleRight.$inferSelect;
export type InsertMstRoleRight = z.infer<typeof insertMstRoleRightSchema>;
export type MstIndicator = typeof mstIndicator.$inferSelect;
export type InsertMstIndicator = z.infer<typeof insertMstIndicatorSchema>;
export type Transaction = typeof transaction.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type ClientInvestmentRequest = typeof clientInvestmentRequest.$inferSelect;
export type InsertClientInvestmentRequest = z.infer<typeof insertClientInvestmentRequestSchema>;
export type ClientWithdrawalRequest = typeof clientWithdrawalRequest.$inferSelect;
export type InsertClientWithdrawalRequest = z.infer<typeof insertClientWithdrawalRequestSchema>;
export type ClientReferralRequest = typeof clientReferralRequest.$inferSelect;
export type InsertClientReferralRequest = z.infer<typeof insertClientReferralRequestSchema>;

// Content Management tables
export const contentCategories = mysqlTable("content_categories", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: tinyint("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentItems = mysqlTable("content_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  categoryId: varchar("category_id", { length: 36 }).references(() => contentCategories.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  content: text("content"),
  mediaType: varchar("media_type", { length: 20 }).notNull(), // 'image', 'video', 'text'
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  displayOrder: int("display_order").default(0),
  isActive: tinyint("is_active").default(1),
  isPublished: tinyint("is_published").default(0),
  publishedAt: timestamp("published_at"),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const offers = mysqlTable("offers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  mediaType: varchar("media_type", { length: 20 }).default('image'),
  mediaUrl: text("media_url"),
  linkUrl: text("link_url"),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  displayOrder: int("display_order").default(0),
  isActive: tinyint("is_active").default(1),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for content management
export const insertContentCategorySchema = createInsertSchema(contentCategories).omit({ id: true, createdAt: true });
export const insertContentItemSchema = createInsertSchema(contentItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOfferSchema = createInsertSchema(offers).omit({ id: true, createdAt: true, updatedAt: true });

// Relations for content management
export const contentCategoriesRelations = relations(contentCategories, ({ many }) => ({
  contentItems: many(contentItems),
}));

export const contentItemsRelations = relations(contentItems, ({ one }) => ({
  category: one(contentCategories, {
    fields: [contentItems.categoryId],
    references: [contentCategories.id],
  }),
  creator: one(users, {
    fields: [contentItems.createdBy],
    references: [users.id],
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  creator: one(users, {
    fields: [offers.createdBy],
    references: [users.id],
  }),
}));

// Content management types
export type ContentCategory = typeof contentCategories.$inferSelect;
export type InsertContentCategory = z.infer<typeof insertContentCategorySchema>;
export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;

// Legacy types
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type LegacyTransaction = typeof transactions.$inferSelect;
export type InsertLegacyTransaction = z.infer<typeof insertLegacyTransactionSchema>;
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
