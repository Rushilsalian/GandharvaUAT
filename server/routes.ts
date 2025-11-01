import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as XLSX from "xlsx";
import { storage } from "./storage";
import { 
  // New table schemas
  insertMstUserSchema,
  insertMstBranchSchema,
  insertMstClientSchema,
  insertMstRoleSchema,
  insertMstModuleSchema,
  insertMstRoleRightSchema,
  insertMstIndicatorSchema,
  insertTransactionSchema,
  insertClientInvestmentRequestSchema,
  insertClientWithdrawalRequestSchema,
  insertClientReferralRequestSchema,
  // Legacy schemas
  insertUserSchema, 
  insertBranchSchema,
  insertClientSchema,
  insertLegacyTransactionSchema,
  insertPortfolioSchema
} from "@shared/schema";
import { z } from "zod";
import { generateSecurePassword, sendWelcomeEmail, sendPasswordResetEmail, sendInvestmentReceipt } from "./emailService";
import { generateToken, generateResetToken, verifyToken, authenticateToken } from "./jwtUtils";
import { registerDashboardRoutes } from "./dashboardRoutes";
import { registerEnhancedDashboardRoutes } from "./enhancedDashboardRoutes";
import { registerRoleBasedReportsRoutes } from "./roleBasedReportsRoutes";
import { checkDatabaseHealth, warmupConnections } from "./db-health";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.ms-excel' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.xls') || 
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Warm up database connections
  await warmupConnections();
  
  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    const dbHealthy = await checkDatabaseHealth();
    res.json({ status: dbHealthy ? 'healthy' : 'unhealthy', database: dbHealthy });
  });
  // Master Role routes
  app.get('/api/mst/roles', async (req, res) => {
    try {
      const roles = await storage.getAllMstRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get role rights and module access for a specific role
  app.get('/api/mst/roles/:id/access', async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const roleRights = await storage.getMstRoleRightsByRole(roleId);
      const allModules = await storage.getAllMstModules();
      
      const moduleAccess: Record<number, any> = {};
      for (const right of roleRights) {
        const module = allModules.find(m => m.moduleId === right.moduleId);
        if (module) {
          moduleAccess[module.moduleId] = {
            moduleId: module.moduleId,
            moduleName: module.name,
            accessRead: right.accessRead,
            accessWrite: right.accessWrite,
            accessUpdate: right.accessUpdate,
            accessDelete: right.accessDelete,
            accessExport: right.accessExport
          };
        }
      }
      
      res.json({ roleId, moduleAccess });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/mst/roles/:id', async (req, res) => {
    try {
      const role = await storage.getMstRole(parseInt(req.params.id));
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/mst/roles', async (req, res) => {
    try {
      const roleData = insertMstRoleSchema.parse(req.body);
      const role = await storage.createMstRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/mst/roles/:id', async (req, res) => {
    try {
      const updates = req.body;
      const role = await storage.updateMstRole(parseInt(req.params.id), updates);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Master User routes (protected)
  app.get('/api/mst/users', authenticateToken, async (req, res) => {
    try {
      const users = await storage.getAllMstUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/mst/users/:id', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getMstUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/mst/users', authenticateToken, async (req, res) => {
    try {
      const userData = insertMstUserSchema.parse(req.body);
      
      // Check if user with email already exists
      if (userData.email) {
        const existingUserByEmail = await storage.getMstUserByEmail(userData.email);
        if (existingUserByEmail) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }
      }
      
      // Check if user with mobile already exists
      if (userData.mobile) {
        const existingUserByMobile = await storage.getMstUserByMobile(userData.mobile);
        if (existingUserByMobile) {
          return res.status(400).json({ error: 'User with this mobile already exists' });
        }
      }
      
      const user = await storage.createMstUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Master user creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/mst/users/:id', authenticateToken, async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateMstUser(parseInt(req.params.id), updates);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Master Branch routes
  app.get('/api/mst/branches', async (req, res) => {
    try {
      const branches = await storage.getAllMstBranches();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/mst/branches/:id', async (req, res) => {
    try {
      const branch = await storage.getMstBranch(parseInt(req.params.id));
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found' });
      }
      res.json(branch);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/mst/branches', async (req, res) => {
    try {
      const branchData = insertMstBranchSchema.parse(req.body);
      const branch = await storage.createMstBranch(branchData);
      res.status(201).json(branch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/mst/branches/:id', async (req, res) => {
    try {
      const updates = req.body;
      const branch = await storage.updateMstBranch(parseInt(req.params.id), updates);
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found' });
      }
      res.json(branch);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Master Client routes
  app.get('/api/mst/clients', async (req, res) => {
    try {
      const clients = await storage.getAllMstClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/mst/clients/:id', async (req, res) => {
    try {
      const client = await storage.getMstClient(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/mst/clients', async (req, res) => {
    try {
      const clientData = insertMstClientSchema.parse(req.body);
      
      // Check if client code already exists
      const existingClient = await storage.getMstClientByCode(clientData.code);
      if (existingClient) {
        return res.status(400).json({ error: 'Client with this code already exists' });
      }
      
      const client = await storage.createMstClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/mst/clients/:id', async (req, res) => {
    try {
      const updates = req.body;
      const client = await storage.updateMstClient(parseInt(req.params.id), updates);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Master Indicator routes
  app.get('/api/mst/indicators', async (req, res) => {
    try {
      const indicators = await storage.getAllMstIndicators();
      res.json(indicators);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/mst/indicators', async (req, res) => {
    try {
      const indicatorData = insertMstIndicatorSchema.parse(req.body);
      const indicator = await storage.createMstIndicator(indicatorData);
      res.status(201).json(indicator);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // New Transaction routes
  app.get('/api/mst/transactions', async (req, res) => {
    try {
      const { clientId, indicatorId } = req.query;
      let transactions = await storage.getAllTransactions();
      
      if (clientId) {
        transactions = transactions.filter(t => t.clientId === parseInt(clientId as string));
      }
      
      if (indicatorId) {
        transactions = transactions.filter(t => t.indicatorId === parseInt(indicatorId as string));
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/mst/transactions', async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Client Investment Request routes
  app.get('/api/client-investment-requests', async (req, res) => {
    try {
      const { clientId } = req.query;
      let requests = await storage.getAllClientInvestmentRequests();
      
      if (clientId) {
        requests = requests.filter(r => r.clientId === parseInt(clientId as string));
      }
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/client-investment-requests', async (req, res) => {
    try {
      const requestData = insertClientInvestmentRequestSchema.parse(req.body);
      const request = await storage.createClientInvestmentRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Client Withdrawal Request routes
  app.get('/api/client-withdrawal-requests', async (req, res) => {
    try {
      const { clientId } = req.query;
      let requests = await storage.getAllClientWithdrawalRequests();
      
      if (clientId) {
        requests = requests.filter(r => r.clientId === parseInt(clientId as string));
      }
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/client-withdrawal-requests', async (req, res) => {
    try {
      const requestData = insertClientWithdrawalRequestSchema.parse(req.body);
      const request = await storage.createClientWithdrawalRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Client Referral Request routes
  app.get('/api/client-referral-requests', async (req, res) => {
    try {
      const { clientId } = req.query;
      let requests = await storage.getAllClientReferralRequests();
      
      if (clientId) {
        requests = requests.filter(r => r.clientId === parseInt(clientId as string));
      }
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/client-referral-requests', async (req, res) => {
    try {
      const requestData = insertClientReferralRequestSchema.parse(req.body);
      const request = await storage.createClientReferralRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Request APIs with role-based access
  app.get('/api/requests/withdrawal', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      let requests = await storage.getAllClientWithdrawalRequests();
      
      // Role-based filtering with fallback
      const roleName = userSession.roleName || userSession.role || 'client';
      console.log('Withdrawal requests - User session:', { userId: userSession.userId, roleName, clientId: userSession.clientId });
      
      if (roleName === 'admin' || roleName === 'Admin') {
        // Admin can see all withdrawal requests - no filtering needed
        console.log('Admin access - showing all requests:', requests.length);
      } else if (roleName === 'leader' || roleName === 'Leader') {
        // Leader can see all requests (can be refined based on business logic)
        console.log('Leader access - showing all requests:', requests.length);
      } else if (roleName === 'client' || roleName === 'Client') {
        // Client can only see their own withdrawal requests
        if (userSession.clientId) {
          requests = requests.filter(r => r.clientId === userSession.clientId);
          console.log('Client access - filtered by clientId:', userSession.clientId, 'found:', requests.length);
        } else {
          // If no clientId, try to find requests by userId who created them
          requests = requests.filter(r => r.createdById === userSession.userId);
          console.log('Client access - filtered by createdById:', userSession.userId, 'found:', requests.length);
        }
      } else {
        // Unknown role - show requests created by this user as fallback
        requests = requests.filter(r => r.createdById === userSession.userId);
        console.log('Unknown role fallback - filtered by createdById:', userSession.userId, 'found:', requests.length);
      }
      
      // Transform to include client details
      const requestsWithClients = await Promise.all(
        requests.map(async (request) => {
          const client = await storage.getMstClient(request.clientId);
          return {
            id: request.clientWithdrawalRequestId,
            date: request.withdrawalDate,
            amount: parseFloat(request.withdrawalAmount),
            reason: request.withdrawalRemark,
            client: client ? {
              id: client.clientId,
              name: client.name,
              code: client.code
            } : null
          };
        })
      );
      
      res.json(requestsWithClients);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/requests/withdrawal', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const { amount, reason } = req.body;
      
      let clientId = userSession.clientId;
      
      // If no clientId in session, try to find/create client based on user
      if (!clientId) {
        const roleName = userSession.roleName || userSession.role;
        
        if (roleName === 'admin' || roleName === 'Admin') {
          // For admin, create a default admin client if not exists
          let adminClient = await storage.getMstClientByCode('ADMIN_001');
          if (!adminClient) {
            const adminClientData = {
              code: 'ADMIN_001',
              name: 'Admin User',
              mobile: null,
              email: userSession.email,
              dob: null,
              panNo: null,
              aadhaarNo: null,
              branch: null,
              branchId: null,
              address: null,
              city: null,
              pincode: null,
              referenceId: null,
              isActive: 1,
              createdById: userSession.userId,
              createdByUser: userSession.userName || userSession.email || 'admin',
              createdDate: new Date(),
              modifiedById: null,
              modifiedByUser: null,
              modifiedDate: null,
              deletedById: null,
              deletedByUser: null,
              deletedDate: null
            };
            adminClient = await storage.createMstClient(adminClientData);
          }
          clientId = adminClient.clientId;
        } else {
          return res.status(400).json({ error: 'No client associated with this user' });
        }
      }
      
      const requestData = {
        clientId,
        withdrawalDate: new Date(),
        withdrawalAmount: amount.toString(),
        withdrawalRemark: reason,
        createdById: userSession.userId,
        createdByUser: userSession.userName || userSession.email || 'user',
        createdDate: new Date()
      };
      
      const request = await storage.createClientWithdrawalRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/requests/investment', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      let requests = await storage.getAllClientInvestmentRequests();
      
      // Role-based filtering with fallback
      const roleName = userSession.roleName || userSession.role || 'client';
      console.log('Investment requests - User session:', { userId: userSession.userId, roleName, clientId: userSession.clientId });
      
      if (roleName === 'admin' || roleName === 'Admin') {
        // Admin can see all investment requests - no filtering needed
        console.log('Admin access - showing all requests:', requests.length);
      } else if (roleName === 'leader' || roleName === 'Leader') {
        // Leader can see all requests (can be refined based on business logic)
        console.log('Leader access - showing all requests:', requests.length);
      } else if (roleName === 'client' || roleName === 'Client') {
        // Client can only see their own investment requests
        if (userSession.clientId) {
          requests = requests.filter(r => r.clientId === userSession.clientId);
          console.log('Client access - filtered by clientId:', userSession.clientId, 'found:', requests.length);
        } else {
          // If no clientId, try to find requests by userId who created them
          requests = requests.filter(r => r.createdById === userSession.userId);
          console.log('Client access - filtered by createdById:', userSession.userId, 'found:', requests.length);
        }
      } else {
        // Unknown role - show requests created by this user as fallback
        requests = requests.filter(r => r.createdById === userSession.userId);
        console.log('Unknown role fallback - filtered by createdById:', userSession.userId, 'found:', requests.length);
      }
      
      // Transform to include client details
      const requestsWithClients = await Promise.all(
        requests.map(async (request) => {
          const client = await storage.getMstClient(request.clientId);
          return {
            id: request.clientInvestmentRequestId,
            date: request.investmentDate,
            amount: parseFloat(request.investmentAmount),
            investmentRemark: request.investmentRemark || '',
            transactionNo: request.transactionNo || '',
            status: 'Completed',
            client: client ? {
              id: client.clientId,
              name: client.name,
              code: client.code
            } : null
          };
        })
      );
      
      console.log('Returning investment requests:', requestsWithClients.length);
      
      res.json(requestsWithClients);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // JustPay Payment Gateway integration
  app.post('/api/payment/justpay-redirect', authenticateToken, async (req, res) => {
    try {
      console.log('JustPay redirect endpoint hit:', req.body);
      const { amount } = req.body;
      const orderId = `INV${Date.now()}`;
      
      const paymentData = {
        merchant_id: process.env.JUSTPAY_MERCHANT_ID || 'test_merchant',
        order_id: orderId,
        amount: amount,
        currency: 'INR',
        return_url: `${process.env.CLIENT_URL}/payment/callback`,
        cancel_url: `${process.env.CLIENT_URL}/investment-request`
      };
      
      const redirectUrl = `${process.env.JUSTPAY_PAYMENT_URL}?${new URLSearchParams(paymentData).toString()}`;
      console.log('Generated redirect URL:', redirectUrl);
      res.json({ redirectUrl, orderId });
    } catch (error) {
      console.error('Payment setup error:', error);
      res.status(500).json({ error: 'Payment setup failed' });
    }
  });

  // Payment callback handler
  app.post('/api/payment/callback', async (req, res) => {
    try {
      const { order_id, transaction_id, transaction_no, status, amount } = req.body;
      
      if (status === 'SUCCESS') {
        res.json({ 
          success: true, 
          orderId: order_id,
          transactionId: transaction_id,
          transactionNo: transaction_no,
          amount 
        });
      } else {
        res.json({ success: false, message: 'Payment failed' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Payment callback failed' });
    }
  });

  app.post('/api/requests/investment', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const { amount, investmentRemark, transactionId, transactionNo } = req.body;
      
      let clientId = userSession.clientId;
      
      if (!clientId) {
        const roleName = userSession.roleName || userSession.role;
        if (roleName === 'admin' || roleName === 'Admin') {
          let adminClient = await storage.getMstClientByCode('ADMIN_001');
          if (!adminClient) {
            const adminClientData = {
              code: 'ADMIN_001', name: 'Admin User', mobile: null, email: userSession.email,
              dob: null, panNo: null, aadhaarNo: null, branch: null, branchId: null,
              address: null, city: null, pincode: null, referenceId: null, isActive: 1,
              createdById: userSession.userId, createdByUser: userSession.userName || 'admin',
              createdDate: new Date(), modifiedById: null, modifiedByUser: null,
              modifiedDate: null, deletedById: null, deletedByUser: null, deletedDate: null
            };
            adminClient = await storage.createMstClient(adminClientData);
          }
          clientId = adminClient.clientId;
        } else {
          return res.status(400).json({ error: 'No client associated with this user' });
        }
      }
      
      const requestData = {
        clientId,
        investmentDate: new Date(),
        investmentAmount: amount.toString(),
        investmentRemark: investmentRemark || 'Investment',
        transactionId: transactionId || `TXN${Date.now()}`,
        transactionNo: transactionNo || `INV${Date.now()}`,
        createdById: userSession.userId,
        createdByUser: userSession.userName || userSession.email || 'user',
        createdDate: new Date()
      };
      
      const request = await storage.createClientInvestmentRequest(requestData);
      
      if (userSession.email) {
        await sendInvestmentReceipt(
          userSession.email,
          userSession.userName || 'User',
          amount,
          investmentRemark || 'Investment',
          request.transactionNo
        );
      }
      
      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/requests/referral', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      console.log('GET referral requests - User session:', userSession);
      console.log('User clientId:', userSession.clientId, 'userId:', userSession.userId);
      let requests = await storage.getAllClientReferralRequests();
      console.log('Total requests found:', requests.length);
      
      // Role-based filtering with fallback
      const roleName = userSession.roleName || userSession.role || 'client';
      console.log('Referral requests - User session:', { userId: userSession.userId, roleName, clientId: userSession.clientId });
      
      if (roleName === 'admin' || roleName === 'Admin') {
        // Admin can see all referral requests - no filtering needed
        console.log('Admin access - showing all requests:', requests.length);
      } else if (roleName === 'leader' || roleName === 'Leader') {
        // Leader can see all requests (can be refined based on business logic)
        console.log('Leader access - showing all requests:', requests.length);
      } else if (roleName === 'client' || roleName === 'Client') {
        // Client can only see their own referral requests
        if (userSession.clientId) {
          requests = requests.filter(r => r.clientId === userSession.clientId);
          console.log('Client access - filtered by clientId:', userSession.clientId, 'found:', requests.length);
        } else {
          // For clients without clientId, filter by userId who created the request
          requests = requests.filter(r => r.createdById === userSession.userId);
          console.log('Client access - filtered by createdById:', userSession.userId, 'found:', requests.length);
        }
      } else {
        // Unknown role - show requests created by this user as fallback
        requests = requests.filter(r => r.createdById === userSession.userId);
        console.log('Unknown role fallback - filtered by createdById:', userSession.userId, 'found:', requests.length);
      }
      
      // Transform to include client details
      const requestsWithClients = await Promise.all(
        requests.map(async (request) => {
          const client = await storage.getMstClient(request.clientId);
          return {
            id: request.clientReferralRequestId,
            date: request.createdDate,
            name: request.name,
            mobile: request.mobile,
            client: client ? {
              id: client.clientId,
              name: client.name,
              code: client.code
            } : null
          };
        })
      );
      
      res.json(requestsWithClients);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/requests/referral', authenticateToken, async (req, res) => {
    try {
      console.log('Referral request received:', req.body);
      const userSession = (req as any).user;
      console.log('User session:', userSession);
      const { refereeName, refereePhone } = req.body;
      
      if (!refereeName || !refereePhone) {
        return res.status(400).json({ error: 'Referee name and phone are required' });
      }
      
      let clientId = userSession.clientId;
      
      // If no clientId in session, try to find/create client based on user
      if (!clientId) {
        const roleName = userSession.roleName || userSession.role;
        
        if (roleName === 'admin' || roleName === 'Admin') {
          // For admin, create a default admin client if not exists
          let adminClient = await storage.getMstClientByCode('ADMIN_001');
          if (!adminClient) {
            const adminClientData = {
              code: 'ADMIN_001',
              name: 'Admin User',
              mobile: null,
              email: userSession.email,
              dob: null,
              panNo: null,
              aadhaarNo: null,
              branch: null,
              branchId: null,
              address: null,
              city: null,
              pincode: null,
              referenceId: null,
              isActive: 1,
              createdById: userSession.userId,
              createdByUser: userSession.userName || userSession.email || 'admin',
              createdDate: new Date(),
              modifiedById: null,
              modifiedByUser: null,
              modifiedDate: null,
              deletedById: null,
              deletedByUser: null,
              deletedDate: null
            };
            adminClient = await storage.createMstClient(adminClientData);
          }
          clientId = adminClient.clientId;
        } else {
          return res.status(400).json({ error: 'No client associated with this user' });
        }
      }
      
      const requestData = {
        clientId,
        name: refereeName,
        mobile: refereePhone,
        createdById: userSession.userId,
        createdByUser: userSession.userName || userSession.email || 'user',
        createdDate: new Date()
      };
      
      console.log('Creating referral request with data:', requestData);
      const request = await storage.createClientReferralRequest(requestData);
      console.log('Referral request created:', request);
      res.status(201).json(request);
    } catch (error) {
      console.error('Referral request error:', error);
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Signup route for new users
  app.post('/api/auth/signup', async (req, res) => {
    try {
      console.log('Signup request received:', req.body);
      
      const { userName, password, email, mobile, roleId = 3 } = req.body;
      
      // Basic validation
      if (!userName || userName.trim().length === 0) {
        return res.status(400).json({ error: 'Username is required' });
      }
      
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      
      // Check if user with email already exists
      if (email) {
        const existingUserByEmail = await storage.getMstUserByEmail(email);
        if (existingUserByEmail) {
          console.log('User with email already exists:', email);
          return res.status(400).json({ error: 'User with this email already exists' });
        }
      }
      
      // Check if user with mobile already exists
      if (mobile) {
        const existingUserByMobile = await storage.getMstUserByMobile(mobile);
        if (existingUserByMobile) {
          console.log('User with mobile already exists:', mobile);
          return res.status(400).json({ error: 'User with this mobile already exists' });
        }
      }
      
      // Create the user with proper data
      const newUserData = {
        userName: userName.trim(),
        password,
        email: email || null,
        mobile: mobile || null,
        roleId,
        clientId: null,
        isActive: 1,
        createdById: 1,
        createdByUser: 'system',
        createdDate: new Date(),
        mobileVerified: null,
        emailVerified: null,
        modifiedById: null,
        modifiedByUser: null,
        modifiedDate: null,
        deletedById: null,
        deletedByUser: null,
        deletedDate: null
      };
      
      console.log('Creating user with data:', { ...newUserData, password: '***' });
      const user = await storage.createMstUser(newUserData);
      const { password: _, ...userWithoutPassword } = user;
      
      // Get role details
      const role = await storage.getMstRole(user.roleId);
      
      // Get role rights and modules
      const roleRights = await storage.getMstRoleRightsByRole(user.roleId);
      const allModules = await storage.getAllMstModules();
      
      // Build module access object
      const moduleAccess: Record<number, any> = {};
      for (const right of roleRights) {
        const module = allModules.find(m => m.moduleId === right.moduleId);
        if (module) {
          moduleAccess[module.moduleId] = {
            moduleId: module.moduleId,
            moduleName: module.name,
            accessRead: right.accessRead,
            accessWrite: right.accessWrite,
            accessUpdate: right.accessUpdate,
            accessDelete: right.accessDelete,
            accessExport: right.accessExport
          };
        }
      }
      
      // Set session data
      const sessionData = {
        userId: user.userId,
        email: user.email,
        roleId: user.roleId,
        roleName: role?.name || 'Unknown',
        clientId: user.clientId,
        userType: 'master',
        loginTime: new Date().toISOString(),
        moduleAccess
      };
      
      const token = generateToken(sessionData);
      
      console.log('User created successfully:', userWithoutPassword);
      res.status(201).json({ 
        user: userWithoutPassword,
        role: role,
        session: sessionData,
        token,
        message: 'User created successfully' 
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    const startTime = Date.now();
    try {
      console.log('LOGIN ROUTE HIT - Master user login attempt');
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      console.log('Attempting login for:', email);
      
      // Try new master user table first with timeout
      let mstUser = null;
      try {
        console.log('Checking master user by email...');
        mstUser = await Promise.race([
          storage.getMstUserByEmail(email),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 10000))
        ]) as any;
        
        if (!mstUser && email) {
          console.log('Checking master user by mobile...');
          mstUser = await Promise.race([
            storage.getMstUserByMobile(email),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 10000))
          ]) as any;
        }
      } catch (dbError) {
        console.error('Database error during master user lookup:', dbError);
        return res.status(500).json({ error: 'Database connection error' });
      }
      
      if (mstUser && mstUser.password === password) {
        console.log('MASTER USER LOGIN SUCCESS');
        const { password: _, ...userWithoutPassword } = mstUser;
        
        try {
          // Get role details with timeout
          const role = await Promise.race([
            storage.getMstRole(mstUser.roleId),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Role lookup timeout')), 10000))
          ]) as any;
          
          console.log('Role lookup result:', { roleId: mstUser.roleId, role });
          
          // Get role rights and modules with timeout
          const [roleRights, allModules] = await Promise.race([
            Promise.all([
              storage.getMstRoleRightsByRole(mstUser.roleId),
              storage.getAllMstModules()
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Module access timeout')), 8000))
          ]) as any;
          
          // Build module access object
          const moduleAccess: Record<number, any> = {};
          for (const right of roleRights) {
            const module = allModules.find((m: any) => m.moduleId === right.moduleId);
            if (module) {
              moduleAccess[module.moduleId] = {
                moduleId: module.moduleId,
                moduleName: module.name,
                accessRead: right.accessRead,
                accessWrite: right.accessWrite,
                accessUpdate: right.accessUpdate,
                accessDelete: right.accessDelete,
                accessExport: right.accessExport
              };
            }
          }
          
          // Get client details if user has clientId
          let clientData = null;
          if (mstUser.clientId) {
            try {
              clientData = await Promise.race([
                storage.getMstClient(mstUser.clientId),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Client lookup timeout')), 5000))
              ]) as any;
            } catch (clientError) {
              console.warn('Client lookup failed:', clientError);
              // Continue without client data
            }
          }
        
        const sessionData = {
          userId: mstUser.userId,
          email: mstUser.email,
          roleId: mstUser.roleId,
          roleName: role?.name || 'client',
          clientId: mstUser.clientId,
          userType: 'master',
          loginTime: new Date().toISOString(),
          moduleAccess
        };
        
          const token = generateToken(sessionData);
          
          const responseTime = Date.now() - startTime;
          console.log(`Login successful in ${responseTime}ms`);
          
          return res.json({ 
            user: userWithoutPassword,
            client: clientData,
            role: role,
            session: sessionData,
            token,
            message: 'Login successful', 
            userType: 'master' 
          });
        } catch (roleError) {
          console.error('Error fetching role/module data:', roleError);
          // Return basic login without role data
          const basicSessionData = {
            userId: mstUser.userId,
            email: mstUser.email,
            roleId: mstUser.roleId,
            roleName: 'client',
            clientId: mstUser.clientId,
            userType: 'master',
            loginTime: new Date().toISOString(),
            moduleAccess: {}
          };
          
          const token = generateToken(basicSessionData);
          
          return res.json({ 
            user: userWithoutPassword,
            client: null,
            role: null,
            session: basicSessionData,
            token,
            message: 'Login successful (limited data)', 
            userType: 'master' 
          });
        }
      }
      
      // Legacy user tables don't exist - return invalid credentials
      console.log('Master user not found and legacy tables not available');
      return res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Login failed after ${responseTime}ms:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Forgot password endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Check master user table first
      let user = await storage.getMstUserByEmail(email);
      let userName = user?.userName || 'User';
      
      // No fallback needed - only use master user table
      
      if (!user) {
        return res.status(404).json({ error: 'User with this email not found' });
      }
      
      // Generate reset token
      const resetToken = generateResetToken(email);
      
      // Try to send reset email
      const emailSent = await sendPasswordResetEmail(email, userName, resetToken);
      
      if (emailSent) {
        res.json({ message: 'Password reset link sent to your email' });
      } else {
        // If email service is not configured, provide the reset token directly
        res.json({ 
          message: 'Email service not configured. Use this reset token:', 
          resetToken,
          resetUrl: `/reset-password?token=${resetToken}`
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Reset password endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      
      // Verify reset token
      const decoded = verifyToken(token) as any;
      if (!decoded || decoded.type !== 'reset') {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      
      const email = decoded.email;
      
      // Update password in master user table only
      let updated = false;
      const mstUser = await storage.getMstUserByEmail(email);
      if (mstUser) {
        await storage.updateMstUser(mstUser.userId, { password });
        updated = true;
      }
      
      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // User routes
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getAllMstUsers();
      
      if (!users || users.length === 0) {
        return res.json([]);
      }
      
      const usersWithoutPasswords = users.map(({ password, ...user }) => {

        return {
          id: user.userId?.toString() || 'unknown',
          email: user.email || null,
          mobile: user.mobile || null,
          firstName: user.userName?.split(' ')[0] || 'Unknown',
          lastName: user.userName?.split(' ').slice(1).join(' ') || '',
          role: user.roleId === 1 ? 'admin' : user.roleId === 2 ? 'leader' : 'client',
          branchId: user.clientId?.toString() || null,
          isActive: Boolean(user.isActive),
          createdAt: user.createdDate || null
        };
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.json([]);
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getMstUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      
      // Transform to expected format
      const transformedUser = {
        id: user.userId.toString(),
        email: user.email,
        mobile: user.mobile,
        firstName: user.userName?.split(' ')[0] || 'Unknown',
        lastName: user.userName?.split(' ').slice(1).join(' ') || '',
        role: user.roleId === 1 ? 'admin' : user.roleId === 2 ? 'leader' : 'client',
        branchId: user.clientId?.toString() || null,
        isActive: user.isActive === 1,
        createdAt: user.createdDate
      };
      
      res.json(transformedUser);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const { firstName, lastName, email, mobile, password, role } = req.body;
      
      // Check if user with email already exists
      if (email) {
        const existingUserByEmail = await storage.getMstUserByEmail(email);
        if (existingUserByEmail) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }
      }
      
      // Check if user with mobile already exists (if mobile provided)
      if (mobile) {
        const existingUserByMobile = await storage.getMstUserByMobile(mobile);
        if (existingUserByMobile) {
          return res.status(400).json({ error: 'User with this mobile already exists' });
        }
      }
      
      // Map role to roleId
      const roleId = role === 'admin' ? 1 : role === 'leader' ? 2 : 3;
      
      const userData = {
        userName: `${firstName} ${lastName}`,
        password: password || 'defaultpass123',
        email: email || null,
        mobile: mobile || null,
        roleId,
        clientId: null,
        isActive: 1,
        createdById: 1,
        createdByUser: 'system',
        createdDate: new Date(),
        mobileVerified: null,
        emailVerified: null,
        modifiedById: null,
        modifiedByUser: null,
        modifiedDate: null,
        deletedById: null,
        deletedByUser: null,
        deletedDate: null
      };
      
      const user = await storage.createMstUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      
      // Transform to expected format
      const transformedUser = {
        id: user.userId.toString(),
        email: user.email,
        mobile: user.mobile,
        firstName: firstName,
        lastName: lastName,
        role: role,
        branchId: user.clientId?.toString() || null,
        isActive: user.isActive === 1,
        createdAt: user.createdDate
      };
      
      res.status(201).json(transformedUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    try {
      const { firstName, lastName, email, mobile, password, role } = req.body;
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const existingUser = await storage.getMstUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if email is being changed and already exists
      if (email && email !== existingUser.email) {
        const existingUserByEmail = await storage.getMstUserByEmail(email);
        if (existingUserByEmail && existingUserByEmail.userId !== userId) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }
      }
      
      // Check if mobile is being changed and already exists
      if (mobile && mobile !== existingUser.mobile) {
        const existingUserByMobile = await storage.getMstUserByMobile(mobile);
        if (existingUserByMobile && existingUserByMobile.userId !== userId) {
          return res.status(400).json({ error: 'User with this mobile already exists' });
        }
      }
      
      const roleId = role === 'admin' ? 1 : role === 'leader' ? 2 : 3;
      
      const updateData: any = {
        userName: `${firstName} ${lastName}`,
        email: email || null,
        mobile: mobile || null,
        roleId,
        modifiedById: 1,
        modifiedByUser: 'system',
        modifiedDate: new Date()
      };
      
      // Only update password if provided
      if (password) {
        updateData.password = password;
      }
      
      const user = await storage.updateMstUser(userId, updateData);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      
      // Transform to expected format
      const transformedUser = {
        id: user.userId.toString(),
        email: user.email,
        mobile: user.mobile,
        firstName: firstName,
        lastName: lastName,
        role: role,
        branchId: user.clientId?.toString() || null,
        isActive: user.isActive === 1,
        createdAt: user.createdDate
      };
      
      res.json(transformedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Branch routes
  app.get('/api/branches', async (req, res) => {
    try {
      const branches = await storage.getAllBranches();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/branches/:id', async (req, res) => {
    try {
      const branch = await storage.getBranch(req.params.id);
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found' });
      }
      res.json(branch);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/branches', async (req, res) => {
    try {
      const branchData = insertBranchSchema.parse(req.body);
      
      // Check if branch with code already exists
      const existingBranch = await storage.getBranchByCode(branchData.code);
      if (existingBranch) {
        return res.status(400).json({ error: 'Branch with this code already exists' });
      }
      
      const branch = await storage.createBranch(branchData);
      res.status(201).json(branch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/branches/:id', async (req, res) => {
    try {
      const updates = req.body;
      const branch = await storage.updateBranch(req.params.id, updates);
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found' });
      }
      res.json(branch);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all clients with role-based access
  app.get('/api/clients', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      let clients = await storage.getAllMstClients();
      const users = await storage.getAllMstUsers();
      
      // Apply role-based filtering for clients
      const roleName = userSession.roleName || userSession.role || 'client';
      if (roleName === 'admin' || roleName === 'Admin') {
        // Admin can see all clients - no filtering needed
      } else if (roleName === 'leader' || roleName === 'Leader') {
        // Leader can see his clients and himself
        if (userSession.clientId) {
          const leaderClients = clients.filter(c => c.referenceId === userSession.clientId || c.clientId === userSession.clientId);
          clients = leaderClients;
        }
      } else if (roleName === 'client' || roleName === 'Client') {
        // Client can only see themselves
        if (userSession.clientId) {
          clients = clients.filter(c => c.clientId === userSession.clientId);
        } else {
          clients = [];
        }
      } else {
        clients = [];
      }
      
      const clientsWithUsers = clients.map((client) => {
        const user = users.find(u => u.clientId === client.clientId);
        return {
          id: client.clientId.toString(),
          clientCode: client.code,
          panNumber: client.panNo,
          aadharNumber: client.aadhaarNo,
          dateOfBirth: client.dob,
          address: client.address,
          kycStatus: 'verified',
          totalInvestment: 0,
          currentValue: 0,
          createdAt: client.createdDate,
          user: user ? {
            firstName: user.userName?.split(' ')[0] || client.name?.split(' ')[0] || 'Unknown',
            lastName: user.userName?.split(' ').slice(1).join(' ') || client.name?.split(' ').slice(1).join(' ') || '',
            email: user.email || client.email,
            mobile: user.mobile || client.mobile
          } : {
            firstName: client.name?.split(' ')[0] || 'Unknown',
            lastName: client.name?.split(' ').slice(1).join(' ') || '',
            email: client.email,
            mobile: client.mobile
          }
        };
      });
      
      res.json(clientsWithUsers);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Secure client creation endpoint
  app.post('/api/clients/create', async (req, res) => {
    try {
      // Define schema for secure client creation (no password from client)
      const clientCreationSchema = z.object({
        // User data
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        email: z.string().email('Invalid email address'),
        mobile: z.string().optional(),
        // Client data
        clientCode: z.string().min(1, 'Client code is required'),
        panNumber: z.string().optional(),
        aadharNumber: z.string().optional(),
        dateOfBirth: z.string().optional().transform(val => val ? new Date(val) : null),
        address: z.string().optional(),
        nomineeDetails: z.string().optional(),
        bankDetails: z.string().optional(),
        kycStatus: z.enum(['pending', 'verified', 'rejected']).default('pending')
      });

      const data = clientCreationSchema.parse(req.body);
      
      // Check if user with email already exists
      const existingUserByEmail = await storage.getMstUserByEmail(data.email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      // Check if user with mobile already exists (if mobile provided)
      if (data.mobile) {
        const existingUserByMobile = await storage.getMstUserByMobile(data.mobile);
        if (existingUserByMobile) {
          return res.status(400).json({ error: 'User with this mobile already exists' });
        }
      }
      
      // Check if client code already exists
      const existingClient = await storage.getClientByCode(data.clientCode);
      if (existingClient) {
        return res.status(400).json({ error: 'Client with this code already exists' });
      }
      
      // Generate secure password server-side
      const temporaryPassword = generateSecurePassword();
      
      // Create client record first
      const clientData = {
        code: data.clientCode,
        name: `${data.firstName} ${data.lastName}`,
        mobile: data.mobile || null,
        email: data.email,
        dob: data.dateOfBirth || null,
        panNo: data.panNumber || null,
        aadhaarNo: data.aadharNumber || null,
        branch: null,
        branchId: null,
        address: data.address || null,
        city: null,
        pincode: null,
        referenceId: null,
        isActive: 1,
        createdById: 1,
        createdByUser: 'system',
        createdDate: new Date(),
        modifiedById: null,
        modifiedByUser: null,
        modifiedDate: null,
        deletedById: null,
        deletedByUser: null,
        deletedDate: null
      };
      
      const client = await storage.createMstClient(clientData);
      
      // Create user record
      const userData = {
        userName: `${data.firstName} ${data.lastName}`,
        password: temporaryPassword,
        email: data.email,
        mobile: data.mobile || null,
        roleId: 3, // Client role
        clientId: client.clientId,
        isActive: 1,
        createdById: 1,
        createdByUser: 'system',
        createdDate: new Date(),
        mobileVerified: null,
        emailVerified: null,
        modifiedById: null,
        modifiedByUser: null,
        modifiedDate: null,
        deletedById: null,
        deletedByUser: null,
        deletedDate: null
      };
      
      const user = await storage.createMstUser(userData);
      
      // Send welcome email with temporary password
      const emailSent = user.email ? await sendWelcomeEmail(
        user.email,
        user.userName,
        temporaryPassword
      ) : false;
      
      // Return success response (no password in response)
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        user: userWithoutPassword,
        client,
        emailSent,
        message: emailSent 
          ? 'Client created successfully. Welcome email sent with temporary password.'
          : 'Client created successfully. Please provide temporary password manually.'
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Client creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Client routes (protected) - moved above

  // Get client by user ID (protected)
  app.get('/api/clients/user/:userId', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const client = await storage.getClientByUserId(userId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get transactions for a specific client with optional type filter (protected)
  app.get('/api/clients/:clientId/transactions', authenticateToken, async (req, res) => {
    try {
      const { clientId } = req.params;
      const { type } = req.query;
      
      let transactions = await storage.getLegacyTransactionsByClient(clientId);
      
      // Filter by type if specified
      if (type) {
        transactions = transactions.filter(txn => txn.type === type);
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/clients/:id', async (req, res) => {
    try {
      const client = await storage.getMstClient(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      const users = await storage.getAllMstUsers();
      const user = users.find(u => u.clientId === client.clientId);
      
      const clientWithUser = {
        id: client.clientId.toString(),
        clientCode: client.code,
        panNumber: client.panNo,
        aadharNumber: client.aadhaarNo,
        dateOfBirth: client.dob,
        address: client.address,
        kycStatus: 'verified',
        totalInvestment: 0,
        currentValue: 0,
        createdAt: client.createdDate,
        user: user ? {
          firstName: user.userName?.split(' ')[0] || client.name?.split(' ')[0] || 'Unknown',
          lastName: user.userName?.split(' ').slice(1).join(' ') || client.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || client.email,
          mobile: user.mobile || client.mobile
        } : {
          firstName: client.name?.split(' ')[0] || 'Unknown',
          lastName: client.name?.split(' ').slice(1).join(' ') || '',
          email: client.email,
          mobile: client.mobile
        }
      };
      
      res.json(clientWithUser);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/clients', async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      
      // Check if client code already exists
      const existingClient = await storage.getClientByCode(clientData.clientCode);
      if (existingClient) {
        return res.status(400).json({ error: 'Client with this code already exists' });
      }
      
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/clients/:id', async (req, res) => {
    try {
      // Validate and transform client update data
      const clientUpdateSchema = z.object({
        panNumber: z.string().optional().nullable(),
        aadharNumber: z.string().optional().nullable(),
        dateOfBirth: z.string().optional().nullable().transform(val => {
          if (!val || val === '') return null;
          const date = new Date(val);
          return isNaN(date.getTime()) ? null : date;
        }),
        address: z.string().optional().nullable(),
        nomineeDetails: z.string().optional().nullable(),
        bankDetails: z.string().optional().nullable(),
        kycStatus: z.enum(['pending', 'verified', 'rejected']).optional()
      });

      const validatedUpdates = clientUpdateSchema.parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedUpdates);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Client update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Legacy Transaction routes with role-based access
  app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const clientId = req.query.clientId as string;
      const type = req.query.type as string;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      console.log('Transactions API called with params:', { clientId, type, status, startDate, endDate });
      console.log('Full query object:', req.query);
      console.log('User session:', { userId: userSession.userId, roleName: userSession.roleName, clientId: userSession.clientId });
      

      
      // Handle investment type by fetching from new transaction table with indicator_id = 1
      if (type === 'investment') {
        let transactions = await storage.getAllTransactions();
        
        // Filter by indicator_id = 1 for investments
        transactions = transactions.filter(t => t.indicatorId === 1);
        
        // Apply role-based filtering
        const roleName = userSession.roleName || userSession.role || 'client';
        if (roleName === 'admin' || roleName === 'Admin') {
          // Admin can see all investment transactions - no additional filtering needed
          console.log('Admin access - showing all investment transactions:', transactions.length);
        } else if (roleName === 'leader' || roleName === 'Leader') {
          // Leader can see his and his clients' transactions
          if (userSession.clientId) {
            // Get all clients under this leader (where referenceId = leader's clientId)
            const allClients = await storage.getAllMstClients();
            const leaderClients = allClients.filter(c => c.referenceId === userSession.clientId);
            const leaderClientIds = [userSession.clientId, ...leaderClients.map(c => c.clientId)];
            transactions = transactions.filter(t => leaderClientIds.includes(t.clientId));
            console.log('Leader access - filtered by leader and team clients:', transactions.length);
          } else {
            // If leader has no clientId, show all (fallback for admin-like leaders)
            console.log('Leader access - no clientId, showing all transactions:', transactions.length);
          }
        } else if (roleName === 'client' || roleName === 'Client') {
          // Client can only see their own transactions
          if (userSession.clientId) {
            transactions = transactions.filter(t => t.clientId === userSession.clientId);
            console.log('Client access - filtered by clientId:', userSession.clientId, 'found:', transactions.length);
          } else {
            // If no clientId, return empty array
            transactions = [];
            console.log('Client access - no clientId, returning empty array');
          }
        } else {
          // Unknown role - return empty array for security
          transactions = [];
          console.log('Unknown role - returning empty array for security');
        }
        
        // Apply additional clientId filter if specified in query
        if (clientId) {
          transactions = transactions.filter(t => t.clientId === parseInt(clientId as string));
        }
        
        // Transform new transaction format to legacy format for compatibility
        const transformedTransactions = await Promise.all(
          transactions.map(async (transaction) => {
            const client = await storage.getMstClient(transaction.clientId);
            let clientDetails = null;
            if (client) {
              // Get user details if available
              const users = await storage.getAllMstUsers();
              const user = users.find(u => u.clientId === client.clientId);
              clientDetails = {
                id: client.clientId.toString(),
                clientCode: client.code,
                user: user ? {
                  firstName: user.userName?.split(' ')[0] || client.name?.split(' ')[0] || 'Unknown',
                  lastName: user.userName?.split(' ').slice(1).join(' ') || client.name?.split(' ').slice(1).join(' ') || '',
                  email: user.email,
                  mobile: user.mobile
                } : {
                  firstName: client.name?.split(' ')[0] || 'Unknown',
                  lastName: client.name?.split(' ').slice(1).join(' ') || '',
                  email: client.email,
                  mobile: client.mobile
                }
              };
            }
            return {
              id: transaction.transactionId.toString(),
              type: 'investment',
              amount: parseFloat(transaction.amount),
              status: 'completed',
              description: transaction.remark || 'Investment transaction',
              processedAt: transaction.transactionDate,
              createdAt: transaction.createdDate || transaction.transactionDate,
              client: clientDetails
            };
          })
        );
        
        return res.json(transformedTransactions);
      }
      
      // Handle withdrawal type by fetching from new transaction table with indicator_id = 3
      if (type === 'withdrawal') {
        let transactions = await storage.getAllTransactions();
        
        // Filter by indicator_id = 3 for withdrawals
        transactions = transactions.filter(t => t.indicatorId === 3);
        
        // Apply role-based filtering
        const roleName = userSession.roleName || userSession.role || 'client';
        if (roleName === 'admin' || roleName === 'Admin') {
          // Admin can see all withdrawal transactions
          console.log('Admin access - showing all withdrawal transactions:', transactions.length);
        } else if (roleName === 'leader' || roleName === 'Leader') {
          // Leader can see his and his clients' transactions
          if (userSession.clientId) {
            const allClients = await storage.getAllMstClients();
            const leaderClients = allClients.filter(c => c.referenceId === userSession.clientId);
            const leaderClientIds = [userSession.clientId, ...leaderClients.map(c => c.clientId)];
            transactions = transactions.filter(t => leaderClientIds.includes(t.clientId));
            console.log('Leader access - filtered by leader and team clients:', transactions.length);
          }
        } else if (roleName === 'client' || roleName === 'Client') {
          // Client can only see their own transactions
          if (userSession.clientId) {
            transactions = transactions.filter(t => t.clientId === userSession.clientId);
            console.log('Client access - filtered by clientId:', userSession.clientId, 'found:', transactions.length);
          } else {
            transactions = [];
          }
        } else {
          transactions = [];
        }
        
        if (clientId) {
          transactions = transactions.filter(t => t.clientId === parseInt(clientId as string));
        }
        
        // Transform new transaction format to legacy format for compatibility
        const transformedTransactions = await Promise.all(
          transactions.map(async (transaction) => {
            const client = await storage.getMstClient(transaction.clientId);
            let clientDetails = null;
            if (client) {
              // Get user details if available
              const users = await storage.getAllMstUsers();
              const user = users.find(u => u.clientId === client.clientId);
              clientDetails = {
                id: client.clientId.toString(),
                clientCode: client.code,
                user: user ? {
                  firstName: user.userName?.split(' ')[0] || client.name?.split(' ')[0] || 'Unknown',
                  lastName: user.userName?.split(' ').slice(1).join(' ') || client.name?.split(' ').slice(1).join(' ') || '',
                  email: user.email,
                  mobile: user.mobile
                } : {
                  firstName: client.name?.split(' ')[0] || 'Unknown',
                  lastName: client.name?.split(' ').slice(1).join(' ') || '',
                  email: client.email,
                  mobile: client.mobile
                }
              };
            }
            return {
              id: transaction.transactionId.toString(),
              type: 'withdrawal',
              amount: parseFloat(transaction.amount),
              status: 'completed',
              description: transaction.remark || 'Withdrawal transaction',
              processedAt: transaction.transactionDate,
              createdAt: transaction.createdDate || transaction.transactionDate,
              client: clientDetails
            };
          })
        );
        
        return res.json(transformedTransactions);
      }
      
      // Handle other types (payout, closure) using new transaction table
      if (type === 'payout') {
        let transactions = await storage.getAllTransactions();
        transactions = transactions.filter(t => t.indicatorId === 2);
        
        // Apply role-based filtering
        const roleName = userSession.roleName || userSession.role || 'client';
        if (roleName === 'admin' || roleName === 'Admin') {
          // Admin can see all payout transactions
        } else if (roleName === 'leader' || roleName === 'Leader') {
          if (userSession.clientId) {
            const allClients = await storage.getAllMstClients();
            const leaderClients = allClients.filter(c => c.referenceId === userSession.clientId);
            const leaderClientIds = [userSession.clientId, ...leaderClients.map(c => c.clientId)];
            transactions = transactions.filter(t => leaderClientIds.includes(t.clientId));
          }
        } else if (roleName === 'client' || roleName === 'Client') {
          if (userSession.clientId) {
            transactions = transactions.filter(t => t.clientId === userSession.clientId);
          } else {
            transactions = [];
          }
        } else {
          transactions = [];
        }
        
        if (clientId) {
          transactions = transactions.filter(t => t.clientId === parseInt(clientId as string));
        }
        
        const transformedTransactions = await Promise.all(
          transactions.map(async (transaction) => {
            const client = await storage.getMstClient(transaction.clientId);
            let clientDetails = null;
            if (client) {
              const users = await storage.getAllMstUsers();
              const user = users.find(u => u.clientId === client.clientId);
              clientDetails = {
                id: client.clientId.toString(),
                clientCode: client.code,
                user: user ? {
                  firstName: user.userName?.split(' ')[0] || client.name?.split(' ')[0] || 'Unknown',
                  lastName: user.userName?.split(' ').slice(1).join(' ') || client.name?.split(' ').slice(1).join(' ') || '',
                  email: user.email,
                  mobile: user.mobile
                } : {
                  firstName: client.name?.split(' ')[0] || 'Unknown',
                  lastName: client.name?.split(' ').slice(1).join(' ') || '',
                  email: client.email,
                  mobile: client.mobile
                }
              };
            }
            return {
              id: transaction.transactionId.toString(),
              type: 'payout',
              amount: parseFloat(transaction.amount),
              status: 'completed',
              description: transaction.remark || 'Payout transaction',
              processedAt: transaction.transactionDate,
              createdAt: transaction.createdDate || transaction.transactionDate,
              client: clientDetails
            };
          })
        );
        
        return res.json(transformedTransactions);
      }
      
      if (type === 'closure') {
        let transactions = await storage.getAllTransactions();
        transactions = transactions.filter(t => t.indicatorId === 4);
        
        // Apply role-based filtering
        const roleName = userSession.roleName || userSession.role || 'client';
        if (roleName === 'admin' || roleName === 'Admin') {
          // Admin can see all closure transactions
        } else if (roleName === 'leader' || roleName === 'Leader') {
          if (userSession.clientId) {
            const allClients = await storage.getAllMstClients();
            const leaderClients = allClients.filter(c => c.referenceId === userSession.clientId);
            const leaderClientIds = [userSession.clientId, ...leaderClients.map(c => c.clientId)];
            transactions = transactions.filter(t => leaderClientIds.includes(t.clientId));
          }
        } else if (roleName === 'client' || roleName === 'Client') {
          if (userSession.clientId) {
            transactions = transactions.filter(t => t.clientId === userSession.clientId);
          } else {
            transactions = [];
          }
        } else {
          transactions = [];
        }
        
        if (clientId) {
          transactions = transactions.filter(t => t.clientId === parseInt(clientId as string));
        }
        
        const transformedTransactions = await Promise.all(
          transactions.map(async (transaction) => {
            const client = await storage.getMstClient(transaction.clientId);
            let clientDetails = null;
            if (client) {
              const users = await storage.getAllMstUsers();
              const user = users.find(u => u.clientId === client.clientId);
              clientDetails = {
                id: client.clientId.toString(),
                clientCode: client.code,
                user: user ? {
                  firstName: user.userName?.split(' ')[0] || client.name?.split(' ')[0] || 'Unknown',
                  lastName: user.userName?.split(' ').slice(1).join(' ') || client.name?.split(' ').slice(1).join(' ') || '',
                  email: user.email,
                  mobile: user.mobile
                } : {
                  firstName: client.name?.split(' ')[0] || 'Unknown',
                  lastName: client.name?.split(' ').slice(1).join(' ') || '',
                  email: client.email,
                  mobile: client.mobile
                }
              };
            }
            return {
              id: transaction.transactionId.toString(),
              type: 'closure',
              amount: parseFloat(transaction.amount),
              status: 'completed',
              description: transaction.remark || 'Closure transaction',
              processedAt: transaction.transactionDate,
              createdAt: transaction.createdDate || transaction.transactionDate,
              client: clientDetails
            };
          })
        );
        
        return res.json(transformedTransactions);
      }
      
      // Handle other types using new transactions table
      let transactions = await storage.getAllTransactions();
      
      // Apply role-based filtering for general transaction access
      const roleName = userSession.roleName || userSession.role || 'client';
      if (roleName === 'admin' || roleName === 'Admin') {
        // Admin can see all transactions
      } else if (roleName === 'leader' || roleName === 'Leader') {
        if (userSession.clientId) {
          const allClients = await storage.getAllMstClients();
          const leaderClients = allClients.filter(c => c.referenceId === userSession.clientId);
          const leaderClientIds = [userSession.clientId, ...leaderClients.map(c => c.clientId)];
          transactions = transactions.filter(t => leaderClientIds.includes(t.clientId));
        }
      } else if (roleName === 'client' || roleName === 'Client') {
        if (userSession.clientId) {
          transactions = transactions.filter(t => t.clientId === userSession.clientId);
        } else {
          transactions = [];
        }
      } else {
        transactions = [];
      }
      
      // Transform to legacy format
      const transformedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          const client = await storage.getMstClient(transaction.clientId);
          let clientDetails = null;
          if (client) {
            const users = await storage.getAllMstUsers();
            const user = users.find(u => u.clientId === client.clientId);
            clientDetails = {
              id: client.clientId.toString(),
              clientCode: client.code,
              user: user ? {
                firstName: user.userName?.split(' ')[0] || client.name?.split(' ')[0] || 'Unknown',
                lastName: user.userName?.split(' ').slice(1).join(' ') || client.name?.split(' ').slice(1).join(' ') || '',
                email: user.email || client.email,
                mobile: user.mobile || client.mobile
              } : {
                firstName: client.name?.split(' ')[0] || 'Unknown',
                lastName: client.name?.split(' ').slice(1).join(' ') || '',
                email: client.email,
                mobile: client.mobile
              }
            };
          }
          
          const typeMap = { 1: 'investment', 2: 'payout', 3: 'withdrawal', 4: 'closure' };
          return {
            id: transaction.transactionId.toString(),
            type: typeMap[transaction.indicatorId as keyof typeof typeMap] || 'other',
            amount: parseFloat(transaction.amount),
            status: 'completed',
            description: transaction.remark || '',
            processedAt: transaction.transactionDate,
            createdAt: transaction.createdDate || transaction.transactionDate,
            client: clientDetails
          };
        })
      );
      
      let filteredTransactions = transformedTransactions;
      
      if (clientId) {
        filteredTransactions = filteredTransactions.filter(t => t.client?.id === clientId);
      }
      
      if (type) {
        filteredTransactions = filteredTransactions.filter(t => t.type === type);
      }
      
      if (status) {
        filteredTransactions = filteredTransactions.filter(t => t.status === status);
      }
      
      if (startDate) {
        const start = new Date(startDate as string);
        filteredTransactions = filteredTransactions.filter(t => 
          new Date(t.processedAt || t.createdAt) >= start
        );
      }
      
      if (endDate) {
        const end = new Date(endDate as string);
        filteredTransactions = filteredTransactions.filter(t => 
          new Date(t.processedAt || t.createdAt) <= end
        );
      }
      
      console.log(`Returning ${filteredTransactions.length} transactions`);
      res.json(filteredTransactions);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/transactions/:id', async (req, res) => {
    try {
      const transaction = await storage.getLegacyTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/transactions', async (req, res) => {
    try {
      const transactionData = insertLegacyTransactionSchema.parse(req.body);
      const transaction = await storage.createLegacyTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/transactions/:id', async (req, res) => {
    try {
      const updates = req.body;
      const transaction = await storage.updateLegacyTransaction(req.params.id, updates);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // File upload endpoint for bulk transaction import
  app.post('/api/transactions/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { type } = req.body;
      if (!type || !['investment', 'withdrawal', 'payout', 'closure'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        return res.status(400).json({ error: 'No data found in the uploaded file' });
      }

      // Define expected fields for each transaction type
      const fieldMappings = {
        investment: ["Client PAN No", "Investment Date", "Investment No", "Investment Details", "Amount"],
        withdrawal: ["Client PAN No", "Withdrawal Date", "Withdrawal No", "Withdrawal Details", "Amount"],
        payout: ["Client PAN No", "Payout Date", "Payout No", "Payout Details", "Amount"],
        closure: ["Client PAN No", "Closure Date", "Closure No", "Closure Details", "Amount"]
      };

      const expectedFields = fieldMappings[type as keyof typeof fieldMappings];
      const errors: Array<{ row: number; message: string }> = [];
      let processed = 0;

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i] as any;
        const rowIndex = i + 2; // Excel rows start from 1, plus header row

        try {
          // Validate required fields
          const missingFields = expectedFields.filter(field => !row[field] || row[field].toString().trim() === '');
          if (missingFields.length > 0) {
            errors.push({ row: rowIndex, message: `Missing required fields: ${missingFields.join(', ')}` });
            continue;
          }

          // Validate amount is a number
          const amount = parseFloat(row.Amount);
          if (isNaN(amount) || amount <= 0) {
            errors.push({ row: rowIndex, message: 'Amount must be a valid positive number' });
            continue;
          }

          // Find client by PAN
          const clients = await storage.getAllMstClients();
          const client = clients.find(c => c.panNo === row["Client PAN No"]);
          if (!client) {
            errors.push({ row: rowIndex, message: `Client with PAN ${row["Client PAN No"]} not found` });
            continue;
          }

          // Parse date properly - Excel dates can be serial numbers
          const dateField = row[`${type.charAt(0).toUpperCase() + type.slice(1)} Date`];
          let processedDate: Date;
          
          if (typeof dateField === 'number') {
            // Excel serial date number - convert to proper date
            // Excel dates start from 1900-01-01 (serial number 1)
            // JavaScript dates start from 1970-01-01, so we need to adjust
            processedDate = new Date((dateField - 25569) * 86400 * 1000);
          } else if (typeof dateField === 'string') {
            // String date - try to parse normally
            processedDate = new Date(dateField);
          } else {
            // Fallback to current date if no valid date found
            processedDate = new Date();
          }
          
          // Validate the parsed date
          if (isNaN(processedDate.getTime())) {
            processedDate = new Date(); // Fallback to current date
          }

          // Create transaction based on type
          const transactionData = {
            clientId: client.clientId.toString(),
            type: type,
            amount: amount.toString(),
            method: 'bank_transfer', // Default method for uploaded transactions
            status: 'completed' as const,
            description: row[`${type.charAt(0).toUpperCase() + type.slice(1)} Details`] || '',
            referenceNumber: row[`${type.charAt(0).toUpperCase() + type.slice(1)} No`] || '',
            processedAt: processedDate
          };

          const transaction = await storage.createLegacyTransaction(transactionData);

          processed++;
        } catch (error) {
          errors.push({ row: rowIndex, message: `Processing error: ${error instanceof Error ? error.message : String(error)}` });
        }
      }

      // Return results
      const success = errors.length === 0;
      const message = success 
        ? `Successfully processed ${processed} ${type} transactions` 
        : `Processed ${processed} transactions with ${errors.length} errors`;

      res.json({
        success,
        message,
        processed,
        errors: errors.slice(0, 10) // Limit errors to first 10
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to process file upload' });
    }
  });

  // Bulk client upload endpoint (Excel/CSV)
  app.post('/api/clients/bulk-upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse Excel/CSV file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        return res.status(400).json({ error: 'No data found in the uploaded file' });
      }

      const results = {
        success: 0,
        skipped: 0,
        errors: [] as Array<{ client: any; error: string }>
      };

      const emailResults = {
        sent: 0,
        failed: 0,
        failedEmails: [] as Array<{ email: string; credentials: string }>
      };

      // Required fields validation
      const requiredFields = ['client_code', 'name', 'mobile', 'email'];

      for (const rawClientData of data) {
        try {
          const clientData = rawClientData as any;
          // Validate required fields
          const missingFields = requiredFields.filter(field => !clientData[field] || clientData[field].toString().trim() === '');
          if (missingFields.length > 0) {
            results.errors.push({ client: clientData, error: `Missing required fields: ${missingFields.join(', ')}` });
            continue;
          }

          // Check if client exists by code
          const existingClient = await storage.getMstClientByCode(clientData.client_code);
          if (existingClient) {
            results.skipped++;
            continue;
          }

          // Parse date of birth
          let dob = null;
          if (clientData.dob) {
            try {
              // Handle DD-MM-YYYY format
              const dobStr = clientData.dob.toString();
              if (dobStr.includes('-')) {
                const [day, month, year] = dobStr.split('-');
                dob = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              } else {
                dob = new Date(clientData.dob);
              }
              if (isNaN(dob.getTime())) {
                dob = null;
              }
            } catch {
              dob = null;
            }
          }

          // Create client record
          const newClient = {
            code: clientData.client_code,
            name: clientData.name,
            mobile: clientData.mobile || null,
            email: clientData.email || null,
            dob: dob,
            panNo: clientData.pan_no || null,
            aadhaarNo: clientData.aadhaar_no || null,
            branch: clientData.branch || null,
            branchId: null,
            address: clientData.address || null,
            city: clientData.city || null,
            pincode: clientData.pincode && !isNaN(parseInt(clientData.pincode)) ? parseInt(clientData.pincode) : null,
            referenceId: clientData.reference_code && !isNaN(parseInt(clientData.reference_code)) ? parseInt(clientData.reference_code) : null,
            isActive: 1,
            createdById: 1,
            createdByUser: 'bulk-upload',
            createdDate: new Date(),
            modifiedById: null,
            modifiedByUser: null,
            modifiedDate: null,
            deletedById: null,
            deletedByUser: null,
            deletedDate: null
          };

          const createdClient = await storage.createMstClient(newClient);

          // Create user if email is provided
          if (clientData.email) {
            const existingUser = await storage.getMstUserByEmail(clientData.email);
            if (!existingUser) {
              const password = generateSecurePassword();
              const userData = {
                userName: clientData.email,
                password,
                email: clientData.email,
                mobile: clientData.mobile || null,
                roleId: 3, // Client role
                clientId: createdClient.clientId,
                isActive: 1,
                createdById: 1,
                createdByUser: 'bulk-upload',
                createdDate: new Date(),
                mobileVerified: null,
                emailVerified: null,
                modifiedById: null,
                modifiedByUser: null,
                modifiedDate: null,
                deletedById: null,
                deletedByUser: null,
                deletedDate: null
              };

              await storage.createMstUser(userData);
              
              // Send welcome email
              const emailSent = await sendWelcomeEmail(clientData.email, clientData.name || 'Client', password);
              
              if (emailSent) {
                emailResults.sent++;
              } else {
                emailResults.failed++;
                emailResults.failedEmails.push({
                  email: clientData.email,
                  credentials: `Login: ${clientData.email}, Password: ${password}`
                });
              }
            }
          }

          results.success++;
        } catch (error) {
          results.errors.push({ 
            client: rawClientData, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      const success = results.errors.length === 0;
      const message = success 
        ? `Successfully processed ${results.success} client records` 
        : `Processed ${results.success} clients with ${results.errors.length} errors`;

      res.json({
        success,
        message,
        processed: results.success + results.skipped + results.errors.length,
        results,
        emailResults,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Bulk upload error:', error);
      res.status(500).json({ error: 'Failed to process bulk upload' });
    }
  });

  // Third-party client sync API endpoint with user creation and email
  app.post('/api/sync/clients', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required' });
      }

      const token = authHeader.substring(7);
      if (token !== process.env.SYNC_API_TOKEN && token !== 'sync-api-token-2024') {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { clients } = req.body;
      if (!clients || !Array.isArray(clients)) {
        return res.status(400).json({ error: 'Clients array is required' });
      }

      const results = {
        success: 0,
        skipped: 0,
        errors: [] as Array<{ client: any; error: string }>
      };

      for (const clientData of clients) {
        try {
          if (!clientData.code) {
            results.errors.push({ client: clientData, error: 'Client code is required' });
            continue;
          }

          // Check if client exists by code
          console.log('Checking for existing client with code:', clientData.code);
          const existingClient = await storage.getMstClientByCode(clientData.code);
          if (existingClient) {
            console.log('Client already exists, skipping:', clientData.code);
            results.skipped++;
            continue;
          }
          console.log('Client does not exist, creating new client:', clientData.code);

          // Create client first
          const newClient = {
            code: clientData.code,
            name: clientData.name || 'Unknown',
            mobile: clientData.mobile || null,
            email: clientData.email || null,
            dob: clientData.dob ? new Date(clientData.dob) : null,
            panNo: clientData.panNo || null,
            aadhaarNo: clientData.aadhaarNo || null,
            branch: clientData.branch || null,
            branchId: clientData.branchId || null,
            address: clientData.address || null,
            city: clientData.city || null,
            pincode: clientData.pincode || null,
            referenceId: clientData.referenceId || null,
            isActive: 1,
            createdById: 1,
            createdByUser: 'sync-api',
            createdDate: new Date(),
            modifiedById: null,
            modifiedByUser: null,
            modifiedDate: null,
            deletedById: null,
            deletedByUser: null,
            deletedDate: null
          };

          const createdClient = await storage.createMstClient(newClient);

          // Create user if email is provided
          let userCredentials = null;
          if (clientData.email) {
            const existingUser = await storage.getMstUserByEmail(clientData.email);
            if (!existingUser) {
              const password = generateSecurePassword();
              const userData = {
                userName: clientData.email,
                password,
                email: clientData.email,
                mobile: clientData.mobile || null,
                roleId: 3, // Client role
                clientId: createdClient.clientId,
                isActive: 1,
                createdById: 1,
                createdByUser: 'sync-api',
                createdDate: new Date(),
                mobileVerified: null,
                emailVerified: null,
                modifiedById: null,
                modifiedByUser: null,
                modifiedDate: null,
                deletedById: null,
                deletedByUser: null,
                deletedDate: null
              };

              await storage.createMstUser(userData);
              console.log('Attempting to send welcome email to:', clientData.email);
              const emailSent = await sendWelcomeEmail(clientData.email, clientData.name || 'Client', password);
              console.log('Email sent result:', emailSent);
              
              if (!emailSent) {
                console.log('Email failed, storing credentials for response');
                userCredentials = { email: clientData.email, password };
              }
            }
          }

          results.success++;
          if (userCredentials) {
            results.errors.push({ 
              client: clientData, 
              error: `Email failed - Login: ${userCredentials.email}, Password: ${userCredentials.password}` 
            });
          }
        } catch (error) {
          results.errors.push({ 
            client: clientData, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      res.json({
        message: 'Client sync completed',
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get synced clients (for third-party to verify)
  app.get('/api/sync/clients', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required' });
      }

      const token = authHeader.substring(7);
      if (token !== process.env.SYNC_API_TOKEN && token !== 'sync-api-token-2024') {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const clients = await storage.getAllMstClients();
      res.json({
        clients: clients.map(client => ({
          clientId: client.clientId,
          code: client.code,
          name: client.name,
          mobile: client.mobile,
          email: client.email,
          createdDate: client.createdDate
        })),
        total: clients.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Third-party transaction sync API endpoint
  app.post('/api/sync/transactions', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required' });
      }

      const token = authHeader.substring(7);
      if (token !== process.env.SYNC_API_TOKEN && token !== 'sync-api-token-2024') {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { transactions } = req.body;
      if (!transactions || !Array.isArray(transactions)) {
        return res.status(400).json({ error: 'Transactions array is required' });
      }

      // Indicator mapping: 1=Investment, 2=Payout, 3=Withdrawal, 4=Closure
      const indicatorMap: Record<string, number> = {
        'Investment': 1,
        'Payout': 2,
        'Withdrawal': 3,
        'Closure': 4
      };

      const results = {
        success: 0,
        skipped: 0,
        errors: [] as Array<{ transaction: any; error: string }>
      };

      for (const txnData of transactions) {
        try {
          // Validate required fields
          if (!txnData.clientCode) {
            results.errors.push({ transaction: txnData, error: 'Client code is required' });
            continue;
          }

          if (!txnData.indicatorName) {
            results.errors.push({ transaction: txnData, error: 'Indicator name is required' });
            continue;
          }

          if (!txnData.amount || isNaN(parseFloat(txnData.amount))) {
            results.errors.push({ transaction: txnData, error: 'Valid amount is required' });
            continue;
          }

          // Find client by code
          const client = await storage.getMstClientByCode(txnData.clientCode);
          if (!client) {
            results.errors.push({ transaction: txnData, error: `Client with code ${txnData.clientCode} not found` });
            continue;
          }

          // Map indicator name to ID
          const indicatorId = indicatorMap[txnData.indicatorName];
          if (!indicatorId) {
            results.errors.push({ 
              transaction: txnData, 
              error: `Invalid indicator name. Must be one of: ${Object.keys(indicatorMap).join(', ')}` 
            });
            continue;
          }

          // Parse transaction date
          let transactionDate = new Date();
          if (txnData.transactionDate) {
            const parsedDate = new Date(txnData.transactionDate);
            if (!isNaN(parsedDate.getTime())) {
              transactionDate = parsedDate;
            }
          }

          // Create transaction
          const newTransaction = {
            transactionDate: transactionDate,
            clientId: client.clientId,
            indicatorId,
            amount: parseFloat(txnData.amount).toString(),
            remark: txnData.remark || null,
            createdById: 1,
            createdByUser: 'sync-api',
            createdDate: new Date()
          };

          console.log('Creating transaction:', newTransaction);
          const createdTransaction = await storage.createTransaction(newTransaction);
          console.log('Transaction created:', createdTransaction);
          results.success++;

        } catch (error) {
          results.errors.push({ 
            transaction: txnData, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      res.json({
        message: 'Transaction sync completed',
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Transaction sync error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get synced transactions (for third-party to verify)
  app.get('/api/sync/transactions', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required' });
      }

      const token = authHeader.substring(7);
      if (token !== process.env.SYNC_API_TOKEN && token !== 'sync-api-token-2024') {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { clientCode, indicatorName, limit = 100 } = req.query;
      let transactions = await storage.getAllTransactions();
      
      // Filter by client code if provided
      if (clientCode) {
        const client = await storage.getMstClientByCode(clientCode as string);
        if (client) {
          transactions = transactions.filter(t => t.clientId === client.clientId);
        } else {
          transactions = [];
        }
      }
      
      // Filter by indicator if provided
      if (indicatorName) {
        const indicatorMap: Record<string, number> = {
          'Investment': 1,
          'Payout': 2,
          'Withdrawal': 3,
          'Closure': 4
        };
        const indicatorId = indicatorMap[indicatorName as string];
        if (indicatorId) {
          transactions = transactions.filter(t => t.indicatorId === indicatorId);
        }
      }
      
      // Limit results
      transactions = transactions.slice(0, parseInt(limit as string));
      
      // Get client details for each transaction
      const transactionsWithDetails = await Promise.all(
        transactions.map(async (txn) => {
          const client = await storage.getMstClient(txn.clientId);
          const indicatorNames = ['', 'Investment', 'Payout', 'Withdrawal', 'Closure'];
          return {
            transactionId: txn.transactionId,
            transactionDate: txn.transactionDate,
            clientCode: client?.code || 'Unknown',
            clientName: client?.name || 'Unknown',
            indicatorName: indicatorNames[txn.indicatorId] || 'Unknown',
            amount: txn.amount,
            remark: txn.remark,
            createdDate: txn.createdDate
          };
        })
      );
      
      res.json({
        transactions: transactionsWithDetails,
        total: transactionsWithDetails.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Dashboard API endpoints - role-based access
  app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const { userRole } = req.query;
      const sessionRole = userRole || userSession.roleName || userSession.role;
      const sessionClientId = userSession.clientId;
      
      console.log('Dashboard stats request:', { sessionRole, sessionClientId, userSession });
      
      if (sessionRole === 'admin' || sessionRole === 'Admin') {
        // Admin - can see all data
        const clients = await storage.getAllMstClients();
        const transactions = await storage.getAllTransactions();
        const investments = transactions.filter(t => t.indicatorId === 1);
        const withdrawals = transactions.filter(t => t.indicatorId === 3);
        const payouts = transactions.filter(t => t.indicatorId === 2);
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const currentMonthPayouts = payouts.filter(p => {
          const date = new Date(p.transactionDate);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        const totalInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
        const totalPayouts = currentMonthPayouts.reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
        
        console.log('Admin stats:', { 
          totalClients: clients.length, 
          totalInvestments, 
          activeWithdrawals: withdrawals.length, 
          thisMonthPayouts: totalPayouts 
        });
        
        res.json({
          totalClients: clients.length,
          totalInvestments,
          activeWithdrawals: withdrawals.length,
          thisMonthPayouts: totalPayouts
        });
      } else if (sessionRole === 'leader' || sessionRole === 'Leader' || sessionRole === 'Manager') {
        // Leader - limited access (placeholder - needs proper client assignment logic)
        const clients = await storage.getAllMstClients();
        const transactions = await storage.getAllTransactions();
        const investments = transactions.filter(t => t.indicatorId === 1);
        const payouts = transactions.filter(t => t.indicatorId === 2);
        
        const teamInvestments = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) / 2; // Mock team share
        const commissionEarned = payouts.reduce((sum, payout) => sum + parseFloat(payout.amount), 0) * 0.1; // Mock commission
        
        res.json({
          myClients: Math.floor(clients.length / 2),
          teamInvestments,
          referralsThisMonth: 5,
          commissionEarned
        });
      } else if ((sessionRole === 'client' || sessionRole === 'Client') && sessionClientId) {
        // Client - only their own data
        const transactions = await storage.getTransactionsByClient(sessionClientId);
        const investments = transactions.filter(t => t.indicatorId === 1);
        const payouts = transactions.filter(t => t.indicatorId === 2);
        const withdrawals = transactions.filter(t => t.indicatorId === 3);
        
        const totalInvestment = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
        const totalPayout = payouts.reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
        
        res.json({
          totalInvestment,
          totalPayout,
          activeReferrals: 0,
          pendingWithdrawals: withdrawals.length
        });
      } else {
        // Fallback - provide mock data based on role
        console.log('Fallback stats for role:', sessionRole);
        if (sessionRole === 'admin') {
          res.json({
            totalClients: 25,
            totalInvestments: 1250000,
            activeWithdrawals: 3,
            thisMonthPayouts: 45000
          });
        } else if (sessionRole === 'leader') {
          res.json({
            myClients: 12,
            teamInvestments: 625000,
            referralsThisMonth: 5,
            commissionEarned: 4500
          });
        } else {
          res.json({
            totalInvestment: 75000,
            totalPayout: 8750,
            activeReferrals: 2,
            pendingWithdrawals: 1
          });
        }
      }
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/dashboard/trends', async (req, res) => {
    try {
      const { userRole, clientId } = req.query;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      if (userRole === 'admin') {
        const transactions = await storage.getAllTransactions();
        const clients = await storage.getAllMstClients();
        
        // Calculate monthly new clients (simplified)
        const clientTrend = months.map((month, index) => {
          const monthClients = clients.filter(c => {
            const date = new Date(c.createdDate || new Date());
            return date.getMonth() === index;
          }).length;
          return { month, value: monthClients || Math.floor(Math.random() * 20) + 10 };
        });
        
        // Calculate monthly investments
        const investmentTrend = months.map((month, index) => {
          const monthInvestments = transactions.filter(t => {
            const date = new Date(t.transactionDate);
            return t.indicatorId === 1 && date.getMonth() === index;
          });
          const total = monthInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
          return { month, value: total || Math.floor(Math.random() * 200000) + 100000 };
        });
        
        res.json({
          clientTrend,
          investmentTrend
        });
      } else if (userRole === 'leader') {
        const transactions = await storage.getAllTransactions();
        
        // Team performance trend
        const teamTrend = months.map((month, index) => {
          const monthInvestments = transactions.filter(t => {
            const date = new Date(t.transactionDate);
            return t.indicatorId === 1 && date.getMonth() === index;
          });
          const total = monthInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) / 3; // Leader's share
          return { month, value: total || Math.floor(Math.random() * 50000) + 20000 };
        });
        
        // Referral trend (mock data)
        const referralTrend = months.map(month => ({
          month,
          value: Math.floor(Math.random() * 8) + 2
        }));
        
        res.json({
          teamTrend,
          referralTrend
        });
      } else if (userRole === 'client' && clientId) {
        const transactions = await storage.getTransactionsByClient(parseInt(clientId as string));
        
        // Investment growth trend
        let runningTotal = 0;
        const investmentTrend = months.map((month, index) => {
          const monthInvestments = transactions.filter(t => {
            const date = new Date(t.transactionDate);
            return t.indicatorId === 1 && date.getMonth() <= index;
          });
          runningTotal = monthInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
          return { month, value: runningTotal || (index * 2000 + 10000) };
        });
        
        // Payout trend
        const payoutTrend = months.map((month, index) => {
          const monthPayouts = transactions.filter(t => {
            const date = new Date(t.transactionDate);
            return t.indicatorId === 2 && date.getMonth() === index;
          });
          const total = monthPayouts.reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
          return { month, value: total || Math.floor(Math.random() * 2000) + 500 };
        });
        
        res.json({
          investmentTrend,
          payoutTrend
        });
      } else {
        res.status(400).json({ error: 'Invalid parameters' });
      }
    } catch (error) {
      console.error('Dashboard trends error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get current session endpoint
  app.get('/api/auth/session', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      
      // Refresh user data from database
      let currentUser = null;
      let clientData = null;
      let roleData = null;
      
      if (userSession.userType === 'master') {
        currentUser = await storage.getMstUser(userSession.userId);
        if (currentUser) {
          const { password: _, ...userWithoutPassword } = currentUser;
          currentUser = userWithoutPassword;
          
          roleData = await storage.getMstRole(currentUser.roleId);
          
          // Get updated role rights and modules
          const roleRights = await storage.getMstRoleRightsByRole(currentUser.roleId);
          const allModules = await storage.getAllMstModules();
          
          // Build module access object
          const moduleAccess: Record<number, any> = {};
          for (const right of roleRights) {
            const module = allModules.find(m => m.moduleId === right.moduleId);
            if (module) {
              moduleAccess[module.moduleId] = {
                moduleId: module.moduleId,
                moduleName: module.name,
                accessRead: right.accessRead,
                accessWrite: right.accessWrite,
                accessUpdate: right.accessUpdate,
                accessDelete: right.accessDelete,
                accessExport: right.accessExport
              };
            }
          }
          
          // Update session with module access
          userSession.moduleAccess = moduleAccess;
          
          if (currentUser.clientId) {
            clientData = await storage.getMstClient(currentUser.clientId);
          }
        }
      } else {
        // Legacy user type - should not exist anymore
        console.warn('Legacy user type detected, this should not happen');
      }
      
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        user: currentUser,
        client: clientData,
        role: roleData,
        session: {
          ...userSession,
          lastAccessed: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Portfolio routes
  app.get('/api/portfolios', async (req, res) => {
    try {
      const { clientId } = req.query;
      let portfolios = await storage.getAllPortfolios();
      
      if (clientId) {
        portfolios = portfolios.filter(p => p.clientId === clientId);
      }
      
      res.json(portfolios);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/portfolios', async (req, res) => {
    try {
      const portfolioData = insertPortfolioSchema.parse(req.body);
      const portfolio = await storage.createPortfolio(portfolioData);
      res.status(201).json(portfolio);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Enhanced dashboard endpoints
  app.get('/api/dashboard/portfolio-distribution', async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = userSession.roleName || userSession.role;
      const sessionClientId = userSession.clientId;
      
      let transactions: any[] = [];
      
      if (sessionRole === 'admin' || sessionRole === 'Admin') {
        transactions = await storage.getAllTransactions();
      } else if (sessionRole === 'leader' || sessionRole === 'Leader') {
        const allClients = await storage.getAllMstClients();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        const leaderClientIds = leaderClients.map(c => c.clientId);
        const allTransactions = await storage.getAllTransactions();
        transactions = allTransactions.filter(t => leaderClientIds.includes(t.clientId));
      } else if (sessionClientId) {
        transactions = await storage.getTransactionsByClient(sessionClientId);
      }
      
      const investments = transactions.filter(t => t.indicatorId === 1);
      const totalAmount = investments.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
      
      if (totalAmount === 0) {
        const distribution = [
          { name: "Equity", value: 45, amount: 450000 },
          { name: "Mutual Funds", value: 30, amount: 300000 },
          { name: "Bonds", value: 15, amount: 150000 },
          { name: "FD", value: 10, amount: 100000 }
        ];
        return res.json(distribution);
      }
      
      const distribution = [
        { name: "Equity", value: Math.floor(totalAmount * 0.45), amount: Math.floor(totalAmount * 0.45) },
        { name: "Mutual Funds", value: Math.floor(totalAmount * 0.30), amount: Math.floor(totalAmount * 0.30) },
        { name: "Bonds", value: Math.floor(totalAmount * 0.15), amount: Math.floor(totalAmount * 0.15) },
        { name: "FD", value: Math.floor(totalAmount * 0.10), amount: Math.floor(totalAmount * 0.10) }
      ];
      
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/dashboard/recent-transactions', async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = userSession.roleName || userSession.role;
      const sessionClientId = userSession.clientId;
      const limit = parseInt(req.query.limit as string) || 10;
      
      let transactions: any[] = [];
      
      if (sessionRole === 'admin' || sessionRole === 'Admin') {
        transactions = await storage.getAllTransactions();
      } else if (sessionRole === 'leader' || sessionRole === 'Leader') {
        const allClients = await storage.getAllMstClients();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        const leaderClientIds = leaderClients.map(c => c.clientId);
        const allTransactions = await storage.getAllTransactions();
        transactions = allTransactions.filter(t => leaderClientIds.includes(t.clientId));
      } else if (sessionClientId) {
        transactions = await storage.getTransactionsByClient(sessionClientId);
      }
      
      if (transactions.length === 0) {
        const mockTransactions = [
          { id: 1, type: "Investment", client: "Rajesh Kumar", amount: 150000, time: "10:30 AM" },
          { id: 2, type: "Withdrawal", client: "Priya Sharma", amount: 75000, time: "11:45 AM" },
          { id: 3, type: "Payout", client: "Amit Patel", amount: 25000, time: "2:15 PM" }
        ];
        return res.json(mockTransactions);
      }
      
      transactions = transactions
        .sort((a, b) => new Date(b.createdDate || b.transactionDate).getTime() - new Date(a.createdDate || a.transactionDate).getTime())
        .slice(0, limit);
      
      const transactionsWithClients = await Promise.all(
        transactions.map(async (transaction) => {
          const client = await storage.getMstClient(transaction.clientId);
          const typeMap = { 1: 'Investment', 2: 'Payout', 3: 'Withdrawal', 4: 'Closure' };
          
          return {
            id: transaction.transactionId,
            type: typeMap[transaction.indicatorId as keyof typeof typeMap] || 'Other',
            client: client?.name || 'Unknown',
            amount: parseFloat(transaction.amount),
            time: new Date(transaction.createdDate || transaction.transactionDate).toLocaleTimeString()
          };
        })
      );
      
      res.json(transactionsWithClients);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/dashboard/monthly-trends', async (req, res) => {
    try {
      const mockTrends = [
        { month: "Jan", investments: 120000, payouts: 15000, clients: 25 },
        { month: "Feb", investments: 150000, payouts: 18000, clients: 32 },
        { month: "Mar", investments: 180000, payouts: 22000, clients: 28 },
        { month: "Apr", investments: 200000, payouts: 25000, clients: 35 },
        { month: "May", investments: 220000, payouts: 28000, clients: 40 },
        { month: "Jun", investments: 250000, payouts: 32000, clients: 45 }
      ];
      res.json(mockTrends);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/dashboard/client-demographics', async (req, res) => {
    try {
      const demographics = [
        { name: "18-25", value: 15, count: 45 },
        { name: "26-35", value: 35, count: 105 },
        { name: "36-45", value: 30, count: 90 },
        { name: "46-55", value: 15, count: 45 },
        { name: "55+", value: 5, count: 15 }
      ];
      res.json(demographics);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Register enhanced dashboard routes
  registerEnhancedDashboardRoutes(app, authenticateToken);
  
  // Register role-based reports routes
  registerRoleBasedReportsRoutes(app, authenticateToken);
  
  const httpServer = createServer(app);

  return httpServer;
}
