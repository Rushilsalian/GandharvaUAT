import type { Express } from "express";
import { storage } from "./storage";
import type { ClientInvestmentRequest, ClientWithdrawalRequest, Transaction, MstClient } from "../shared/schema";

export function registerEnhancedDashboardRoutes(app: Express, authenticateToken: any) {
  // Enhanced role-based dashboard routes with improved data filtering
  
  app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = (userSession.roleName || userSession.role || '').toLowerCase();
      const sessionClientId = userSession.clientId;
      
      console.log('Dashboard stats request:', { sessionRole, sessionClientId });
      
      if (sessionRole === 'admin') {
        // Admin sees all system data
        const clients = await storage.getAllMstClients();
        const investmentRequests = await storage.getAllInvestmentRequests();
        const withdrawalRequests = await storage.getAllWithdrawalRequests();
        const transactions = await storage.getAllTransactions();
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const totalInvestments = investmentRequests
          .reduce((sum, inv) => sum + parseFloat(inv.investmentAmount || '0'), 0);
        
        const activeWithdrawals = withdrawalRequests.length;
        
        const thisMonthPayouts = transactions
          .filter(t => {
            const date = new Date(t.transactionDate);
            return t.indicatorId === 2 && 
                   date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear;
          })
          .reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
        
        res.json({
          totalClients: clients.length,
          totalInvestments,
          activeWithdrawals,
          thisMonthPayouts
        });
        
      } else if (sessionRole === 'leader') {
        // Leader sees their team's data
        const allClients = await storage.getAllMstClients();
        const referralRequests = await storage.getAllReferralRequests();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        const leaderClientIds = leaderClients.map(c => c.clientId);
        
        const investmentRequests = await storage.getAllInvestmentRequests();
        const leaderInvestments = investmentRequests
          .filter(req => leaderClientIds.includes(req.clientId));
        
        const teamInvestments = leaderInvestments
          .reduce((sum, inv) => sum + parseFloat(inv.investmentAmount || '0'), 0);
        
        const referralsThisMonth = referralRequests
          .filter(ref => {
            const date = new Date(ref.createdDate || new Date());
            return ref.clientId === sessionClientId &&
                   date.getMonth() === new Date().getMonth() &&
                   date.getFullYear() === new Date().getFullYear();
          }).length;
        
        const transactions = await storage.getAllTransactions();
        const teamPayouts = transactions
          .filter(t => leaderClientIds.includes(t.clientId) && t.indicatorId === 2)
          .reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
        const commissionEarned = teamPayouts * 0.1;
        
        res.json({
          myClients: leaderClients.length,
          teamInvestments,
          referralsThisMonth,
          commissionEarned
        });
        
      } else if (sessionRole === 'client' && sessionClientId) {
        // Client sees only their own data
        const investmentRequests = await storage.getInvestmentRequestsByClient(sessionClientId);
        const withdrawalRequests = await storage.getWithdrawalRequestsByClient(sessionClientId);
        const referralRequests = await storage.getAllReferralRequests();
        const transactions = await storage.getTransactionsByClient(sessionClientId);
        
        const totalInvestment = investmentRequests
          .reduce((sum, inv) => sum + parseFloat(inv.investmentAmount || '0'), 0);
        
        const totalPayout = transactions
          .filter(t => t.indicatorId === 2)
          .reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
        
        const activeReferrals = referralRequests
          .filter(ref => ref.clientId === sessionClientId).length;
        
        const pendingWithdrawals = withdrawalRequests.length;
        
        res.json({
          totalInvestment,
          totalPayout,
          activeReferrals,
          pendingWithdrawals
        });
        
      } else {
        res.status(403).json({ error: 'Access denied' });
      }
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Role-based portfolio distribution
  app.get('/api/dashboard/portfolio-distribution', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = (userSession.roleName || userSession.role || '').toLowerCase();
      const sessionClientId = userSession.clientId;
      
      let investmentRequests: ClientInvestmentRequest[] = [];
      
      if (sessionRole === 'admin') {
        investmentRequests = await storage.getAllInvestmentRequests();
      } else if (sessionRole === 'leader') {
        const allClients = await storage.getAllMstClients();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        const leaderClientIds = leaderClients.map(c => c.clientId);
        const allInvestments = await storage.getAllInvestmentRequests();
        investmentRequests = allInvestments.filter(inv => leaderClientIds.includes(inv.clientId));
      } else if (sessionClientId) {
        investmentRequests = await storage.getInvestmentRequestsByClient(sessionClientId);
      }
      
      const totalAmount = investmentRequests.reduce((sum, inv) => sum + parseFloat(inv.investmentAmount || '0'), 0);
      
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

  // Role-based recent transactions
  app.get('/api/dashboard/recent-transactions', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = (userSession.roleName || userSession.role || '').toLowerCase();
      const sessionClientId = userSession.clientId;
      const limit = parseInt(req.query.limit as string) || 10;
      
      let allRequests: any[] = [];
      
      if (sessionRole === 'admin') {
        const investmentRequests = await storage.getAllInvestmentRequests();
        const withdrawalRequests = await storage.getAllWithdrawalRequests();
        const transactions = await storage.getAllTransactions();
        
        allRequests = [
          ...investmentRequests.map(req => ({ ...req, type: 'Investment', date: req.createdDate, amount: req.investmentAmount })),
          ...withdrawalRequests.map(req => ({ ...req, type: 'Withdrawal', date: req.createdDate, amount: req.withdrawalAmount })),
          ...transactions.map(txn => ({ ...txn, type: 'Payout', date: txn.transactionDate, clientId: txn.clientId }))
        ];
      } else if (sessionRole === 'leader') {
        const allClients = await storage.getAllMstClients();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        const leaderClientIds = leaderClients.map(c => c.clientId);
        
        const investmentRequests = await storage.getAllInvestmentRequests();
        const withdrawalRequests = await storage.getAllWithdrawalRequests();
        const transactions = await storage.getAllTransactions();
        
        allRequests = [
          ...investmentRequests.filter(req => leaderClientIds.includes(req.clientId)).map(req => ({ ...req, type: 'Investment', date: req.createdDate, amount: req.investmentAmount })),
          ...withdrawalRequests.filter(req => leaderClientIds.includes(req.clientId)).map(req => ({ ...req, type: 'Withdrawal', date: req.createdDate, amount: req.withdrawalAmount })),
          ...transactions.filter(txn => leaderClientIds.includes(txn.clientId)).map(txn => ({ ...txn, type: 'Payout', date: txn.transactionDate, clientId: txn.clientId }))
        ];
      } else if (sessionClientId) {
        const investmentRequests = await storage.getInvestmentRequestsByClient(sessionClientId);
        const withdrawalRequests = await storage.getWithdrawalRequestsByClient(sessionClientId);
        const transactions = await storage.getTransactionsByClient(sessionClientId);
        
        allRequests = [
          ...investmentRequests.map(req => ({ ...req, type: 'Investment', date: req.createdDate, amount: req.investmentAmount })),
          ...withdrawalRequests.map(req => ({ ...req, type: 'Withdrawal', date: req.createdDate, amount: req.withdrawalAmount })),
          ...transactions.map(txn => ({ ...txn, type: 'Payout', date: txn.transactionDate, clientId: txn.clientId }))
        ];
      }
      
      allRequests = allRequests
        .sort((a, b) => new Date(b.date || new Date()).getTime() - new Date(a.date || new Date()).getTime())
        .slice(0, limit);
      
      const transactionsWithClients = await Promise.all(
        allRequests.map(async (request) => {
          const client = await storage.getMstClient(request.clientId);
          
          return {
            id: request.id || request.transactionId || Math.random(),
            type: request.type,
            client: client?.name || 'Unknown',
            amount: parseFloat(request.amount || '0'),
            time: new Date(request.date || new Date()).toLocaleTimeString(),
            status: request.status || 'completed'
          };
        })
      );
      
      res.json(transactionsWithClients);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin-only endpoints
  app.get('/api/dashboard/client-demographics', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = (userSession.roleName || userSession.role || '').toLowerCase();
      
      if (sessionRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const clients = await storage.getAllMstClients();
      
      const ageGroups = {
        '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '55+': 0
      };
      
      clients.forEach(client => {
        if (client.dob) {
          const age = new Date().getFullYear() - new Date(client.dob).getFullYear();
          if (age >= 18 && age <= 25) ageGroups['18-25']++;
          else if (age >= 26 && age <= 35) ageGroups['26-35']++;
          else if (age >= 36 && age <= 45) ageGroups['36-45']++;
          else if (age >= 46 && age <= 55) ageGroups['46-55']++;
          else if (age > 55) ageGroups['55+']++;
        }
      });
      
      const total = clients.length;
      const demographics = Object.entries(ageGroups).map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        count
      }));
      
      res.json(demographics);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/dashboard/branch-performance', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = (userSession.roleName || userSession.role || '').toLowerCase();
      
      if (sessionRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const branches = await storage.getAllMstBranches();
      const clients = await storage.getAllMstClients();
      const investmentRequests = await storage.getAllInvestmentRequests();
      
      const branchPerformance = await Promise.all(branches.map(async branch => {
        const branchClients = clients.filter(c => c.branchId === branch.branchId);
        const branchClientIds = branchClients.map(c => c.clientId);
        
        const branchInvestments = investmentRequests.filter(inv => 
          branchClientIds.includes(inv.clientId)
        );
        const aum = branchInvestments.reduce((sum, inv) => sum + parseFloat(inv.investmentAmount || '0'), 0);
        
        return {
          branch: branch.name,
          clients: branchClients.length,
          aum,
          growth: Math.round(Math.random() * 20 + 5) // Mock growth data
        };
      }));
      
      res.json(branchPerformance.sort((a, b) => b.aum - a.aum));
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Monthly trends data
  app.get('/api/dashboard/monthly-trends', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = (userSession.roleName || userSession.role || '').toLowerCase();
      const sessionClientId = userSession.clientId;
      
      const currentYear = new Date().getFullYear();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      let investmentRequests: ClientInvestmentRequest[] = [];
      let transactions: Transaction[] = [];
      let clients: MstClient[] = [];
      
      if (sessionRole === 'admin') {
        investmentRequests = await storage.getAllInvestmentRequests();
        transactions = await storage.getAllTransactions();
        clients = await storage.getAllMstClients();
      } else if (sessionRole === 'leader') {
        const allClients = await storage.getAllMstClients();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        const leaderClientIds = leaderClients.map(c => c.clientId);
        
        const allInvestments = await storage.getAllInvestmentRequests();
        const allTransactions = await storage.getAllTransactions();
        
        investmentRequests = allInvestments.filter(inv => leaderClientIds.includes(inv.clientId));
        transactions = allTransactions.filter(txn => leaderClientIds.includes(txn.clientId));
        clients = leaderClients;
      } else if (sessionClientId) {
        investmentRequests = await storage.getInvestmentRequestsByClient(sessionClientId);
        transactions = await storage.getTransactionsByClient(sessionClientId);
        const client = await storage.getMstClient(sessionClientId);
        clients = client ? [client] : [];
      }
      
      const monthlyData = months.slice(0, new Date().getMonth() + 1).map((month, index) => {
        const monthInvestments = investmentRequests
          .filter(inv => {
            const date = new Date(inv.createdDate || new Date());
            return date.getMonth() === index && 
                   date.getFullYear() === currentYear;
          })
          .reduce((sum, inv) => sum + parseFloat(inv.investmentAmount || '0'), 0);
        
        const monthPayouts = transactions
          .filter(txn => {
            const date = new Date(txn.transactionDate);
            return txn.indicatorId === 2 && 
                   date.getMonth() === index && 
                   date.getFullYear() === currentYear;
          })
          .reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
        
        const monthClients = clients.filter(client => {
          const date = new Date(client.createdDate || new Date());
          return date.getMonth() === index && date.getFullYear() === currentYear;
        }).length;
        
        return {
          month,
          investments: Math.round(monthInvestments),
          payouts: Math.round(monthPayouts),
          clients: monthClients
        };
      });
      
      res.json(monthlyData);
    } catch (error) {
      console.error('Monthly trends error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Top performers data
  app.get('/api/dashboard/top-performers', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = (userSession.roleName || userSession.role || '').toLowerCase();
      const sessionClientId = userSession.clientId;
      const limit = parseInt(req.query.limit as string) || 5;
      
      let clientIds: number[] = [];
      
      if (sessionRole === 'admin') {
        const allClients = await storage.getAllMstClients();
        clientIds = allClients.map(c => c.clientId);
      } else if (sessionRole === 'leader') {
        const allClients = await storage.getAllMstClients();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        clientIds = leaderClients.map(c => c.clientId);
      } else if (sessionClientId) {
        clientIds = [sessionClientId];
      }
      
      const investmentRequests = await storage.getAllInvestmentRequests();
      const transactions = await storage.getAllTransactions();
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const performerData = await Promise.all(
        clientIds.map(async (clientId) => {
          const client = await storage.getMstClient(clientId);
          if (!client) return null;
          
          const clientInvestments = investmentRequests.filter(inv => 
            inv.clientId === clientId
          );
          
          const totalAmount = clientInvestments.reduce((sum, inv) => 
            sum + parseFloat(inv.investmentAmount || '0'), 0
          );
          
          const currentMonthPayouts = transactions
            .filter(txn => {
              const date = new Date(txn.transactionDate);
              return txn.clientId === clientId && 
                     txn.indicatorId === 2 && 
                     date.getMonth() === currentMonth && 
                     date.getFullYear() === currentYear;
            })
            .reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
          
          const lastMonthPayouts = transactions
            .filter(txn => {
              const date = new Date(txn.transactionDate);
              return txn.clientId === clientId && 
                     txn.indicatorId === 2 && 
                     date.getMonth() === lastMonth && 
                     date.getFullYear() === lastMonthYear;
            })
            .reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
          
          const growth = lastMonthPayouts > 0 
            ? ((currentMonthPayouts - lastMonthPayouts) / lastMonthPayouts) * 100
            : currentMonthPayouts > 0 ? 100 : 0;
          
          return {
            name: client.name,
            amount: Math.round(totalAmount),
            growth: Math.round(growth * 10) / 10
          };
        })
      );
      
      const topPerformers = performerData
        .filter(performer => performer !== null && performer.amount > 0)
        .sort((a, b) => (b?.growth || 0) - (a?.growth || 0))
        .slice(0, limit);
      
      res.json(topPerformers);
    } catch (error) {
      console.error('Top performers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}