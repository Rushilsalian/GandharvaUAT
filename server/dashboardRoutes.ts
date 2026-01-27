import type { Express } from "express";
import { storage } from "./storage";

export function registerDashboardRoutes(app: Express, authenticateToken: any, checkLoggedIn: any) {
  // Enhanced Dashboard API endpoints - role-based access with dynamic data
  app.get('/api/dashboard/stats', checkLoggedIn, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = (userSession.roleName || userSession.role || '').toLowerCase();
      const sessionClientId = userSession.clientId;
      
      console.log('Dashboard stats request:', { sessionRole, sessionClientId, userSession });
      
      if (sessionRole === 'admin') {
        // Admin stats from all tables
        const clients = await storage.getAllMstClients();
        const investmentRequests = await storage.getAllInvestmentRequests();
        const withdrawalRequests = await storage.getAllWithdrawalRequests();
        const transactions = await storage.getAllTransactions();
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Calculate total investments from client_investment_request + opening amounts
        const totalInvestments = investmentRequests
          .filter(req => req.status === 'approved')
          .reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
        
        // Add opening investments from mst_client
        const openingInvestments = clients
          .reduce((sum, client) => sum + parseFloat(client.openingInvestment || '0'), 0);
        
        const totalInvestmentsWithOpening = totalInvestments + openingInvestments;
        
        // Calculate active withdrawals from client_withdrawal_request + opening withdrawals
        const activeWithdrawals = withdrawalRequests
          .filter(req => req.status === 'pending' || req.status === 'processing').length;
        
        // Add opening withdrawals from mst_client
        const openingWithdrawals = clients
          .reduce((sum, client) => sum + parseFloat(client.openingWithdrawl || '0'), 0);
        
        const totalWithdrawalsWithOpening = activeWithdrawals + openingWithdrawals;
        
        // Calculate this month payouts from transaction table + opening payouts
        const thisMonthPayouts = transactions
          .filter(t => {
            const date = new Date(t.transactionDate);
            return t.indicatorId === 2 && 
                   date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear;
          })
          .reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
        
        // Add opening payouts from mst_client
        const openingPayouts = clients
          .reduce((sum, client) => sum + parseFloat(client.openingPayout || '0'), 0);
        
        const totalPayoutsWithOpening = thisMonthPayouts + openingPayouts;
        
        res.json({
          totalClients: clients.length,
          totalInvestments: totalInvestmentsWithOpening,
          activeWithdrawals: totalWithdrawalsWithOpening,
          thisMonthPayouts: totalPayoutsWithOpening
        });
      } else if (sessionRole === 'leader' || sessionRole === 'Leader') {
        // Leader stats from referral data
        const allClients = await storage.getAllMstClients();
        const referralRequests = await storage.getAllReferralRequests();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        const leaderClientIds = leaderClients.map(c => c.clientId);
        
        // Get investment requests for leader's clients
        const investmentRequests = await storage.getAllInvestmentRequests();
        const leaderInvestments = investmentRequests
          .filter(req => leaderClientIds.includes(req.clientId) && req.status === 'approved');
        
        const teamInvestments = leaderInvestments
          .reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
        
        // Add opening investments from leader's clients
        const leaderOpeningInvestments = leaderClients
          .reduce((sum, client) => sum + parseFloat(client.openingInvestment || '0'), 0);
        
        const totalTeamInvestments = teamInvestments + leaderOpeningInvestments;
        
        // Calculate referrals this month
        const referralsThisMonth = referralRequests
          .filter(ref => {
            const date = new Date(ref.createdDate || new Date());
            return ref.referrerId === sessionClientId &&
                   date.getMonth() === new Date().getMonth() &&
                   date.getFullYear() === new Date().getFullYear();
          }).length;
        
        // Calculate commission (10% of team payouts + opening payouts)
        const transactions = await storage.getAllTransactions();
        const teamPayouts = transactions
          .filter(t => leaderClientIds.includes(t.clientId) && t.indicatorId === 2)
          .reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
        
        // Add opening payouts from leader's clients
        const leaderOpeningPayouts = leaderClients
          .reduce((sum, client) => sum + parseFloat(client.openingPayout || '0'), 0);
        
        const totalTeamPayouts = teamPayouts + leaderOpeningPayouts;
        const commissionEarned = totalTeamPayouts * 0.1;
        
        res.json({
          myClients: leaderClients.length,
          teamInvestments: totalTeamInvestments,
          referralsThisMonth,
          commissionEarned
        });
      } else if ((sessionRole === 'client' || sessionRole === 'Client') && sessionClientId) {
        // Client stats from their own data
        const investmentRequests = await storage.getInvestmentRequestsByClient(sessionClientId);
        const withdrawalRequests = await storage.getWithdrawalRequestsByClient(sessionClientId);
        const referralRequests = await storage.getAllReferralRequests();
        const transactions = await storage.getTransactionsByClient(sessionClientId);
        
        // Calculate total investment from approved requests + opening investment
        const totalInvestment = investmentRequests
          .filter(req => req.status === 'approved')
          .reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
        
        // Get client data to add opening amounts
        const clientData = await storage.getMstClient(sessionClientId);
        const openingInvestment = parseFloat(clientData?.openingInvestment || '0');
        const totalInvestmentWithOpening = totalInvestment + openingInvestment;
        
        // Calculate total payout from transactions + opening payout
        const totalPayout = transactions
          .filter(t => t.indicatorId === 2)
          .reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
        
        const openingPayout = parseFloat(clientData?.openingPayout || '0');
        const totalPayoutWithOpening = totalPayout + openingPayout;
        
        // Count active referrals
        const activeReferrals = referralRequests
          .filter(ref => ref.referrerId === sessionClientId && ref.status === 'active').length;
        
        // Count pending withdrawals + opening withdrawals
        const pendingWithdrawals = withdrawalRequests
          .filter(req => req.status === 'pending' || req.status === 'processing').length;
        
        const openingWithdrawal = parseFloat(clientData?.openingWithdrawl || '0');
        const totalWithdrawalsWithOpening = pendingWithdrawals + openingWithdrawal;
        
        res.json({
          totalInvestment: totalInvestmentWithOpening,
          totalPayout: totalPayoutWithOpening,
          activeReferrals,
          pendingWithdrawals: totalWithdrawalsWithOpening
        });
      } else {
        res.status(403).json({ error: 'Access denied' });
      }
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Portfolio distribution endpoint - using dynamic investment data
  app.get('/api/dashboard/portfolio-distribution', checkLoggedIn, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = userSession.roleName || userSession.role;
      const sessionClientId = userSession.clientId;
      
      let investmentRequests = [];
      
      if (sessionRole === 'admin' || sessionRole === 'Admin') {
        investmentRequests = await storage.getAllInvestmentRequests();
      } else if (sessionRole === 'leader' || sessionRole === 'Leader') {
        const allClients = await storage.getAllMstClients();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        const leaderClientIds = leaderClients.map(c => c.clientId);
        const allInvestments = await storage.getAllInvestmentRequests();
        investmentRequests = allInvestments.filter(inv => leaderClientIds.includes(inv.clientId));
      } else if (sessionClientId) {
        investmentRequests = await storage.getInvestmentRequestsByClient(sessionClientId);
      }
      
      // Only consider approved investments + opening investments
      const approvedInvestments = investmentRequests.filter(inv => inv.status === 'approved');
      const totalAmount = approvedInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
      
      // Add opening investments based on role
      let openingInvestmentTotal = 0;
      if (sessionRole === 'admin' || sessionRole === 'Admin') {
        const allClients = await storage.getAllMstClients();
        openingInvestmentTotal = allClients.reduce((sum, client) => sum + parseFloat(client.openingInvestment || '0'), 0);
      } else if (sessionRole === 'leader' || sessionRole === 'Leader') {
        const allClients = await storage.getAllMstClients();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        openingInvestmentTotal = leaderClients.reduce((sum, client) => sum + parseFloat(client.openingInvestment || '0'), 0);
      } else if (sessionClientId) {
        const clientData = await storage.getMstClient(sessionClientId);
        openingInvestmentTotal = parseFloat(clientData?.openingInvestment || '0');
      }
      
      const totalAmountWithOpening = totalAmount + openingInvestmentTotal;
      
      // Calculate distribution based on actual investment amounts + opening amounts
      const distribution = [
        { name: "Equity", value: Math.floor(totalAmountWithOpening * 0.45), amount: Math.floor(totalAmountWithOpening * 0.45) },
        { name: "Mutual Funds", value: Math.floor(totalAmountWithOpening * 0.30), amount: Math.floor(totalAmountWithOpening * 0.30) },
        { name: "Bonds", value: Math.floor(totalAmountWithOpening * 0.15), amount: Math.floor(totalAmountWithOpening * 0.15) },
        { name: "FD", value: Math.floor(totalAmountWithOpening * 0.10), amount: Math.floor(totalAmountWithOpening * 0.10) }
      ];
      
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Client demographics endpoint - using dynamic data from mst_client
  app.get('/api/dashboard/client-demographics', checkLoggedIn, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = userSession.roleName || userSession.role;
      
      if (sessionRole !== 'admin' && sessionRole !== 'Admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const clients = await storage.getAllMstClients();
      
      // Calculate age demographics from actual client data
      const ageGroups = {
        '18-25': 0,
        '26-35': 0,
        '36-45': 0,
        '46-55': 0,
        '55+': 0
      };
      
      clients.forEach(client => {
        if (client.dateOfBirth) {
          const age = new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear();
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

  // Branch performance endpoint - using dynamic data from mst_branch and related tables
  app.get('/api/dashboard/branch-performance', checkLoggedIn, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = userSession.roleName || userSession.role;
      
      if (sessionRole !== 'admin' && sessionRole !== 'Admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const branches = await storage.getAllMstBranches();
      const clients = await storage.getAllMstClients();
      const investmentRequests = await storage.getAllInvestmentRequests();
      
      const branchPerformance = await Promise.all(branches.map(async branch => {
        const branchClients = clients.filter(c => c.branchId === branch.branchId);
        const branchClientIds = branchClients.map(c => c.clientId);
        
        // Calculate AUM from approved investment requests + opening investments
        const branchInvestments = investmentRequests.filter(inv => 
          branchClientIds.includes(inv.clientId) && inv.status === 'approved'
        );
        const aum = branchInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
        
        // Add opening investments for branch clients
        const branchOpeningInvestments = branchClients
          .reduce((sum, client) => sum + parseFloat(client.openingInvestment || '0'), 0);
        
        const totalAum = aum + branchOpeningInvestments;
        
        // Calculate growth based on last 3 months vs previous 3 months
        const currentDate = new Date();
        const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
        const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
        
        const recentInvestments = branchInvestments.filter(inv => {
          const date = new Date(inv.createdDate || new Date());
          return date >= threeMonthsAgo;
        }).reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
        
        const previousInvestments = branchInvestments.filter(inv => {
          const date = new Date(inv.createdDate || new Date());
          return date >= sixMonthsAgo && date < threeMonthsAgo;
        }).reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
        
        const growth = previousInvestments > 0 ? 
          ((recentInvestments - previousInvestments) / previousInvestments) * 100 : 0;
        
        return {
          branch: branch.name,
          clients: branchClients.length,
          aum: totalAum,
          growth: Math.round(growth * 10) / 10
        };
      }));
      
      res.json(branchPerformance.sort((a, b) => b.aum - a.aum));
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Recent transactions endpoint - using dynamic data from all request tables
  app.get('/api/dashboard/recent-transactions', checkLoggedIn, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = userSession.roleName || userSession.role;
      const sessionClientId = userSession.clientId;
      const limit = parseInt(req.query.limit as string) || 10;
      
      let allRequests = [];
      
      if (sessionRole === 'admin' || sessionRole === 'Admin') {
        // Get all requests from all tables
        const investmentRequests = await storage.getAllInvestmentRequests();
        const withdrawalRequests = await storage.getAllWithdrawalRequests();
        const referralRequests = await storage.getAllReferralRequests();
        const transactions = await storage.getAllTransactions();
        
        // Combine all requests with type information
        allRequests = [
          ...investmentRequests.map(req => ({ ...req, type: 'Investment', date: req.createdDate })),
          ...withdrawalRequests.map(req => ({ ...req, type: 'Withdrawal', date: req.createdDate })),
          ...referralRequests.map(req => ({ ...req, type: 'Referral', date: req.createdDate, amount: '0' })),
          ...transactions.map(txn => ({ ...txn, type: txn.indicatorId === 2 ? 'Payout' : 'Transaction', date: txn.transactionDate, clientId: txn.clientId }))
        ];
      } else if (sessionRole === 'leader' || sessionRole === 'Leader') {
        const allClients = await storage.getAllMstClients();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        const leaderClientIds = leaderClients.map(c => c.clientId);
        
        const investmentRequests = await storage.getAllInvestmentRequests();
        const withdrawalRequests = await storage.getAllWithdrawalRequests();
        const transactions = await storage.getAllTransactions();
        
        allRequests = [
          ...investmentRequests.filter(req => leaderClientIds.includes(req.clientId)).map(req => ({ ...req, type: 'Investment', date: req.createdDate })),
          ...withdrawalRequests.filter(req => leaderClientIds.includes(req.clientId)).map(req => ({ ...req, type: 'Withdrawal', date: req.createdDate })),
          ...transactions.filter(txn => leaderClientIds.includes(txn.clientId)).map(txn => ({ ...txn, type: 'Payout', date: txn.transactionDate, clientId: txn.clientId }))
        ];
      } else if (sessionClientId) {
        const investmentRequests = await storage.getInvestmentRequestsByClient(sessionClientId);
        const withdrawalRequests = await storage.getWithdrawalRequestsByClient(sessionClientId);
        const transactions = await storage.getTransactionsByClient(sessionClientId);
        
        allRequests = [
          ...investmentRequests.map(req => ({ ...req, type: 'Investment', date: req.createdDate })),
          ...withdrawalRequests.map(req => ({ ...req, type: 'Withdrawal', date: req.createdDate })),
          ...transactions.map(txn => ({ ...txn, type: 'Payout', date: txn.transactionDate, clientId: txn.clientId }))
        ];
      }
      
      // Sort by date and limit results
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

  // Monthly trends endpoint - using dynamic data from request tables
  app.get('/api/dashboard/monthly-trends', checkLoggedIn, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = userSession.roleName || userSession.role;
      const sessionClientId = userSession.clientId;
      const months = parseInt(req.query.months as string) || 6;
      
      let investmentRequests = [];
      let transactions = [];
      let clientIds = [];
      
      if (sessionRole === 'admin' || sessionRole === 'Admin') {
        investmentRequests = await storage.getAllInvestmentRequests();
        transactions = await storage.getAllTransactions();
        const clients = await storage.getAllMstClients();
        clientIds = clients.map(c => c.clientId);
      } else if (sessionRole === 'leader' || sessionRole === 'Leader') {
        const allClients = await storage.getAllMstClients();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        clientIds = leaderClients.map(c => c.clientId);
        
        const allInvestments = await storage.getAllInvestmentRequests();
        const allTransactions = await storage.getAllTransactions();
        investmentRequests = allInvestments.filter(inv => clientIds.includes(inv.clientId));
        transactions = allTransactions.filter(t => clientIds.includes(t.clientId));
      } else if (sessionClientId) {
        investmentRequests = await storage.getInvestmentRequestsByClient(sessionClientId);
        transactions = await storage.getTransactionsByClient(sessionClientId);
        clientIds = [sessionClientId];
      }
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      
      const trends = [];
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
        
        // Get investments for this month from investment requests
        const monthInvestments = investmentRequests.filter(inv => {
          const invDate = new Date(inv.createdDate || new Date());
          return invDate >= date && invDate < nextMonth && inv.status === 'approved';
        });
        
        // Get payouts for this month from transactions
        const monthPayouts = transactions.filter(t => {
          const txnDate = new Date(t.transactionDate);
          return txnDate >= date && txnDate < nextMonth && t.indicatorId === 2;
        });
        
        // Count unique clients who had activity this month
        const activeClientIds = new Set([
          ...monthInvestments.map(inv => inv.clientId),
          ...monthPayouts.map(t => t.clientId)
        ]);
        
        const investments = monthInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
        const payouts = monthPayouts.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        // Add opening amounts for the first month only to avoid double counting
        let openingInvestmentAmount = 0;
        let openingPayoutAmount = 0;
        if (i === months - 1) { // Only add opening amounts to the first month
          if (sessionRole === 'admin' || sessionRole === 'Admin') {
            const allClients = await storage.getAllMstClients();
            openingInvestmentAmount = allClients.reduce((sum, client) => sum + parseFloat(client.openingInvestment || '0'), 0);
            openingPayoutAmount = allClients.reduce((sum, client) => sum + parseFloat(client.openingPayout || '0'), 0);
          } else if (sessionRole === 'leader' || sessionRole === 'Leader') {
            const allClients = await storage.getAllMstClients();
            const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
            openingInvestmentAmount = leaderClients.reduce((sum, client) => sum + parseFloat(client.openingInvestment || '0'), 0);
            openingPayoutAmount = leaderClients.reduce((sum, client) => sum + parseFloat(client.openingPayout || '0'), 0);
          } else if (sessionClientId) {
            const clientData = await storage.getMstClient(sessionClientId);
            openingInvestmentAmount = parseFloat(clientData?.openingInvestment || '0');
            openingPayoutAmount = parseFloat(clientData?.openingPayout || '0');
          }
        }
        
        trends.push({
          month: monthNames[date.getMonth()],
          investments: Math.round(investments + (i === months - 1 ? openingInvestmentAmount : 0)),
          payouts: Math.round(payouts + (i === months - 1 ? openingPayoutAmount : 0)),
          clients: activeClientIds.size
        });
      }
      
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Investment performance endpoint - using dynamic data from investment and transaction tables
  app.get('/api/dashboard/investment-performance', checkLoggedIn, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = userSession.roleName || userSession.role;
      const sessionClientId = userSession.clientId;
      
      let investmentRequests = [];
      let transactions = [];
      
      if (sessionRole === 'admin' || sessionRole === 'Admin') {
        investmentRequests = await storage.getAllInvestmentRequests();
        transactions = await storage.getAllTransactions();
      } else if (sessionRole === 'leader' || sessionRole === 'Leader') {
        const allClients = await storage.getAllMstClients();
        const leaderClients = allClients.filter(c => c.referenceId === sessionClientId);
        const leaderClientIds = leaderClients.map(c => c.clientId);
        
        const allInvestments = await storage.getAllInvestmentRequests();
        const allTransactions = await storage.getAllTransactions();
        investmentRequests = allInvestments.filter(inv => leaderClientIds.includes(inv.clientId));
        transactions = allTransactions.filter(t => leaderClientIds.includes(t.clientId));
      } else if (sessionClientId) {
        investmentRequests = await storage.getInvestmentRequestsByClient(sessionClientId);
        transactions = await storage.getTransactionsByClient(sessionClientId);
      }
      
      const approvedInvestments = investmentRequests.filter(inv => inv.status === 'approved');
      const payouts = transactions.filter(t => t.indicatorId === 2);
      
      const totalInvested = approvedInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
      const totalPayouts = payouts.reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
      
      // Calculate returns for different periods
      const currentDate = new Date();
      const periods = [
        { name: '1M', months: 1 },
        { name: '3M', months: 3 },
        { name: '6M', months: 6 },
        { name: '1Y', months: 12 }
      ];
      
      const performanceData = periods.map(period => {
        const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - period.months, 1);
        
        const periodInvestments = approvedInvestments.filter(inv => {
          const date = new Date(inv.createdDate || new Date());
          return date >= periodStart;
        }).reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
        
        const periodPayouts = payouts.filter(payout => {
          const date = new Date(payout.transactionDate);
          return date >= periodStart;
        }).reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
        
        const returnPercentage = periodInvestments > 0 ? 
          ((periodPayouts / periodInvestments) * 100) : 0;
        
        return {
          period: period.name,
          return: Math.round(returnPercentage * 10) / 10,
          benchmark: Math.round((returnPercentage * 0.8) * 10) / 10 // Benchmark as 80% of actual return
        };
      });
      
      res.json(performanceData);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // KYC status endpoint - using dynamic data from mst_client
  app.get('/api/dashboard/kyc-status', checkLoggedIn, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = userSession.roleName || userSession.role;
      
      if (sessionRole !== 'admin' && sessionRole !== 'Admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const clients = await storage.getAllMstClients();
      
      // Count KYC status from actual client data
      const kycStatus = {
        verified: 0,
        pending: 0,
        rejected: 0
      };
      
      clients.forEach(client => {
        // Assuming KYC status is stored in client.kycStatus or client.status
        const status = client.kycStatus || client.status || 'pending';
        if (status === 'verified' || status === 'approved' || status === 'active') {
          kycStatus.verified++;
        } else if (status === 'rejected' || status === 'inactive') {
          kycStatus.rejected++;
        } else {
          kycStatus.pending++;
        }
      });
      
      res.json({
        total: clients.length,
        ...kycStatus
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Revenue breakdown endpoint - using dynamic data from transaction table
  app.get('/api/dashboard/revenue-breakdown', checkLoggedIn, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const sessionRole = userSession.roleName || userSession.role;
      
      if (sessionRole !== 'admin' && sessionRole !== 'Admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const transactions = await storage.getAllTransactions();
      const investmentRequests = await storage.getAllInvestmentRequests();
      
      // Calculate revenue from different sources
      const payouts = transactions.filter(t => t.indicatorId === 2);
      const totalPayouts = payouts.reduce((sum, payout) => sum + parseFloat(payout.amount), 0);
      
      const approvedInvestments = investmentRequests.filter(inv => inv.status === 'approved');
      const totalInvestments = approvedInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
      
      // Calculate different fee types based on actual data
      const managementFee = totalInvestments * 0.02; // 2% management fee
      const performanceFee = totalPayouts * 0.15; // 15% performance fee
      const advisoryFee = totalInvestments * 0.005; // 0.5% advisory fee
      const otherIncome = (totalPayouts - totalInvestments) * 0.05; // 5% of profits
      
      const totalRevenue = managementFee + performanceFee + advisoryFee + Math.max(0, otherIncome);
      
      const revenueData = [
        { 
          source: "Management Fee", 
          amount: Math.floor(managementFee), 
          percentage: totalRevenue > 0 ? Math.round((managementFee / totalRevenue) * 100) : 0 
        },
        { 
          source: "Performance Fee", 
          amount: Math.floor(performanceFee), 
          percentage: totalRevenue > 0 ? Math.round((performanceFee / totalRevenue) * 100) : 0 
        },
        { 
          source: "Advisory Fee", 
          amount: Math.floor(advisoryFee), 
          percentage: totalRevenue > 0 ? Math.round((advisoryFee / totalRevenue) * 100) : 0 
        },
        { 
          source: "Other Income", 
          amount: Math.floor(Math.max(0, otherIncome)), 
          percentage: totalRevenue > 0 ? Math.round((Math.max(0, otherIncome) / totalRevenue) * 100) : 0 
        }
      ];
      
      res.json(revenueData);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Risk metrics endpoint
  app.get('/api/dashboard/risk-metrics', checkLoggedIn, async (req, res) => {
    try {
      const riskMetrics = [
        { metric: "Portfolio Volatility", value: 12.5, status: "low" },
        { metric: "Concentration Risk", value: 25.8, status: "medium" },
        { metric: "Credit Risk", value: 8.2, status: "low" },
        { metric: "Liquidity Risk", value: 35.6, status: "high" }
      ];
      
      res.json(riskMetrics);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}