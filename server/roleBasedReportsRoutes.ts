import type { Express } from "express";
import { storage } from "./storage";

export function registerRoleBasedReportsRoutes(app: Express, authenticateToken: any) {
  // Role-based reports endpoint
  app.get('/api/reports/role-based', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const roleName = userSession.roleName || userSession.role || 'client';
      const sessionClientId = userSession.clientId;
      const sessionUserId = userSession.userId;

      console.log('Role-based reports request:', { roleName, sessionClientId, sessionUserId });

      let reportData: any = {};

      if (roleName === 'admin' || roleName === 'Admin') {
        // Admin can see everyone's data
        const allTransactions = await storage.getAllTransactions();
        const allClients = await storage.getAllMstClients();
        const allUsers = await storage.getAllMstUsers();

        // Get client details with user info
        const clientsWithUsers = await Promise.all(
          allClients.map(async (client) => {
            const user = allUsers.find(u => u.clientId === client.clientId);
            const clientTransactions = allTransactions.filter(t => t.clientId === client.clientId);
            
            const investments = clientTransactions.filter(t => t.indicatorId === 1);
            const withdrawals = clientTransactions.filter(t => t.indicatorId === 3);
            const payouts = clientTransactions.filter(t => t.indicatorId === 2);
            const closures = clientTransactions.filter(t => t.indicatorId === 4);

            return {
              clientId: client.clientId,
              clientCode: client.code,
              clientName: client.name,
              email: user?.email || client.email,
              mobile: user?.mobile || client.mobile,
              totalInvestment: investments.reduce((sum, t) => sum + parseFloat(t.amount), 0),
              totalWithdrawal: withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0),
              totalPayout: payouts.reduce((sum, t) => sum + parseFloat(t.amount), 0),
              totalClosure: closures.reduce((sum, t) => sum + parseFloat(t.amount), 0),
              transactionCount: clientTransactions.length,
              lastTransactionDate: clientTransactions.length > 0 
                ? new Date(Math.max(...clientTransactions.map(t => new Date(t.transactionDate).getTime())))
                : null
            };
          })
        );

        reportData = {
          role: 'admin',
          summary: {
            totalClients: allClients.length,
            totalTransactions: allTransactions.length,
            totalInvestmentAmount: allTransactions.filter(t => t.indicatorId === 1).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            totalWithdrawalAmount: allTransactions.filter(t => t.indicatorId === 3).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            totalPayoutAmount: allTransactions.filter(t => t.indicatorId === 2).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            totalClosureAmount: allTransactions.filter(t => t.indicatorId === 4).reduce((sum, t) => sum + parseFloat(t.amount), 0)
          },
          clients: clientsWithUsers,
          transactions: await Promise.all(
            allTransactions.map(async (transaction) => {
              const client = allClients.find(c => c.clientId === transaction.clientId);
              const typeMap = { 1: 'Investment', 2: 'Payout', 3: 'Withdrawal', 4: 'Closure' };
              return {
                transactionId: transaction.transactionId,
                date: transaction.transactionDate,
                clientCode: client?.code || 'Unknown',
                clientName: client?.name || 'Unknown',
                type: typeMap[transaction.indicatorId as keyof typeof typeMap] || 'Other',
                amount: parseFloat(transaction.amount),
                remark: transaction.remark
              };
            })
          )
        };

      } else if (roleName === 'leader' || roleName === 'Leader') {
        // Leader can see their own data and their clients' data
        const allClients = await storage.getAllMstClients();
        const allTransactions = await storage.getAllTransactions();
        const allUsers = await storage.getAllMstUsers();

        // Find leader's client record
        const leaderClient = sessionClientId ? await storage.getMstClient(sessionClientId) : null;
        
        // Get clients under this leader (using referenceId)
        const leaderClients = allClients.filter(c => 
          c.referenceId === sessionClientId || c.clientId === sessionClientId
        );

        const leaderClientIds = leaderClients.map(c => c.clientId);
        const leaderTransactions = allTransactions.filter(t => leaderClientIds.includes(t.clientId));

        const clientsWithUsers = await Promise.all(
          leaderClients.map(async (client) => {
            const user = allUsers.find(u => u.clientId === client.clientId);
            const clientTransactions = leaderTransactions.filter(t => t.clientId === client.clientId);
            
            const investments = clientTransactions.filter(t => t.indicatorId === 1);
            const withdrawals = clientTransactions.filter(t => t.indicatorId === 3);
            const payouts = clientTransactions.filter(t => t.indicatorId === 2);
            const closures = clientTransactions.filter(t => t.indicatorId === 4);

            return {
              clientId: client.clientId,
              clientCode: client.code,
              clientName: client.name,
              email: user?.email || client.email,
              mobile: user?.mobile || client.mobile,
              totalInvestment: investments.reduce((sum, t) => sum + parseFloat(t.amount), 0),
              totalWithdrawal: withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0),
              totalPayout: payouts.reduce((sum, t) => sum + parseFloat(t.amount), 0),
              totalClosure: closures.reduce((sum, t) => sum + parseFloat(t.amount), 0),
              transactionCount: clientTransactions.length,
              lastTransactionDate: clientTransactions.length > 0 
                ? new Date(Math.max(...clientTransactions.map(t => new Date(t.transactionDate).getTime())))
                : null
            };
          })
        );

        reportData = {
          role: 'leader',
          summary: {
            myClients: leaderClients.length,
            totalTransactions: leaderTransactions.length,
            totalInvestmentAmount: leaderTransactions.filter(t => t.indicatorId === 1).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            totalWithdrawalAmount: leaderTransactions.filter(t => t.indicatorId === 3).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            totalPayoutAmount: leaderTransactions.filter(t => t.indicatorId === 2).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            totalClosureAmount: leaderTransactions.filter(t => t.indicatorId === 4).reduce((sum, t) => sum + parseFloat(t.amount), 0)
          },
          clients: clientsWithUsers,
          transactions: await Promise.all(
            leaderTransactions.map(async (transaction) => {
              const client = leaderClients.find(c => c.clientId === transaction.clientId);
              const typeMap = { 1: 'Investment', 2: 'Payout', 3: 'Withdrawal', 4: 'Closure' };
              return {
                transactionId: transaction.transactionId,
                date: transaction.transactionDate,
                clientCode: client?.code || 'Unknown',
                clientName: client?.name || 'Unknown',
                type: typeMap[transaction.indicatorId as keyof typeof typeMap] || 'Other',
                amount: parseFloat(transaction.amount),
                remark: transaction.remark
              };
            })
          )
        };

      } else if (roleName === 'client' || roleName === 'Client') {
        // Client can see only their own data
        if (!sessionClientId) {
          return res.status(400).json({ error: 'Client ID not found in session' });
        }

        const clientTransactions = await storage.getTransactionsByClient(sessionClientId);
        const client = await storage.getMstClient(sessionClientId);
        const allUsers = await storage.getAllMstUsers();
        const user = allUsers.find(u => u.clientId === sessionClientId);

        const investments = clientTransactions.filter(t => t.indicatorId === 1);
        const withdrawals = clientTransactions.filter(t => t.indicatorId === 3);
        const payouts = clientTransactions.filter(t => t.indicatorId === 2);
        const closures = clientTransactions.filter(t => t.indicatorId === 4);

        reportData = {
          role: 'client',
          summary: {
            totalInvestment: investments.reduce((sum, t) => sum + parseFloat(t.amount), 0),
            totalWithdrawal: withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0),
            totalPayout: payouts.reduce((sum, t) => sum + parseFloat(t.amount), 0),
            totalClosure: closures.reduce((sum, t) => sum + parseFloat(t.amount), 0),
            transactionCount: clientTransactions.length,
            netPosition: investments.reduce((sum, t) => sum + parseFloat(t.amount), 0) - 
                        withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0)
          },
          clientInfo: {
            clientId: client?.clientId,
            clientCode: client?.code,
            clientName: client?.name,
            email: user?.email || client?.email,
            mobile: user?.mobile || client?.mobile
          },
          transactions: clientTransactions.map(transaction => {
            const typeMap = { 1: 'Investment', 2: 'Payout', 3: 'Withdrawal', 4: 'Closure' };
            return {
              transactionId: transaction.transactionId,
              date: transaction.transactionDate,
              type: typeMap[transaction.indicatorId as keyof typeof typeMap] || 'Other',
              amount: parseFloat(transaction.amount),
              remark: transaction.remark
            };
          })
        };
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(reportData);
    } catch (error) {
      console.error('Role-based reports error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Enhanced analytics endpoint
  app.get('/api/reports/analytics', authenticateToken, async (req, res) => {
    try {
      const userSession = (req as any).user;
      const roleName = userSession.roleName || userSession.role || 'client';
      const sessionClientId = userSession.clientId;

      let analyticsData: any = {};

      if (roleName === 'admin' || roleName === 'Admin') {
        const allTransactions = await storage.getAllTransactions();
        const allClients = await storage.getAllMstClients();

        // Monthly trends
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
          const month = new Date().getMonth() - 11 + i;
          const year = new Date().getFullYear() + Math.floor(month / 12);
          const adjustedMonth = ((month % 12) + 12) % 12;
          
          const monthTransactions = allTransactions.filter(t => {
            const tDate = new Date(t.transactionDate);
            return tDate.getMonth() === adjustedMonth && tDate.getFullYear() === year;
          });

          return {
            month: new Date(year, adjustedMonth).toLocaleDateString('en-US', { month: 'short' }),
            investments: monthTransactions.filter(t => t.indicatorId === 1).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            withdrawals: monthTransactions.filter(t => t.indicatorId === 3).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            payouts: monthTransactions.filter(t => t.indicatorId === 2).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            newClients: allClients.filter(c => {
              const cDate = new Date(c.createdDate);
              return cDate.getMonth() === adjustedMonth && cDate.getFullYear() === year;
            }).length
          };
        });

        // Top clients by investment
        const clientInvestments = allClients.map(client => {
          const clientTransactions = allTransactions.filter(t => t.clientId === client.clientId);
          const totalInvestment = clientTransactions.filter(t => t.indicatorId === 1).reduce((sum, t) => sum + parseFloat(t.amount), 0);
          return {
            clientCode: client.code,
            clientName: client.name,
            totalInvestment
          };
        }).sort((a, b) => b.totalInvestment - a.totalInvestment).slice(0, 10);

        analyticsData = {
          monthlyTrends: monthlyData,
          topClients: clientInvestments,
          transactionTypeDistribution: [
            { type: 'Investment', count: allTransactions.filter(t => t.indicatorId === 1).length },
            { type: 'Withdrawal', count: allTransactions.filter(t => t.indicatorId === 3).length },
            { type: 'Payout', count: allTransactions.filter(t => t.indicatorId === 2).length },
            { type: 'Closure', count: allTransactions.filter(t => t.indicatorId === 4).length }
          ]
        };

      } else if (roleName === 'leader' || roleName === 'Leader') {
        const allClients = await storage.getAllMstClients();
        const allTransactions = await storage.getAllTransactions();
        
        const leaderClients = allClients.filter(c => 
          c.referenceId === sessionClientId || c.clientId === sessionClientId
        );
        const leaderClientIds = leaderClients.map(c => c.clientId);
        const leaderTransactions = allTransactions.filter(t => leaderClientIds.includes(t.clientId));

        // Monthly performance
        const monthlyData = Array.from({ length: 6 }, (_, i) => {
          const month = new Date().getMonth() - 5 + i;
          const year = new Date().getFullYear() + Math.floor(month / 12);
          const adjustedMonth = ((month % 12) + 12) % 12;
          
          const monthTransactions = leaderTransactions.filter(t => {
            const tDate = new Date(t.transactionDate);
            return tDate.getMonth() === adjustedMonth && tDate.getFullYear() === year;
          });

          return {
            month: new Date(year, adjustedMonth).toLocaleDateString('en-US', { month: 'short' }),
            investments: monthTransactions.filter(t => t.indicatorId === 1).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            payouts: monthTransactions.filter(t => t.indicatorId === 2).reduce((sum, t) => sum + parseFloat(t.amount), 0)
          };
        });

        analyticsData = {
          monthlyPerformance: monthlyData,
          clientPerformance: leaderClients.map(client => {
            const clientTransactions = leaderTransactions.filter(t => t.clientId === client.clientId);
            return {
              clientCode: client.code,
              clientName: client.name,
              totalInvestment: clientTransactions.filter(t => t.indicatorId === 1).reduce((sum, t) => sum + parseFloat(t.amount), 0),
              totalPayout: clientTransactions.filter(t => t.indicatorId === 2).reduce((sum, t) => sum + parseFloat(t.amount), 0)
            };
          })
        };

      } else if (roleName === 'client' || roleName === 'Client') {
        if (!sessionClientId) {
          return res.status(400).json({ error: 'Client ID not found in session' });
        }

        const clientTransactions = await storage.getTransactionsByClient(sessionClientId);

        // Monthly investment growth
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
          const month = new Date().getMonth() - 11 + i;
          const year = new Date().getFullYear() + Math.floor(month / 12);
          const adjustedMonth = ((month % 12) + 12) % 12;
          
          const monthTransactions = clientTransactions.filter(t => {
            const tDate = new Date(t.transactionDate);
            return tDate.getMonth() <= adjustedMonth && tDate.getFullYear() <= year;
          });

          return {
            month: new Date(year, adjustedMonth).toLocaleDateString('en-US', { month: 'short' }),
            cumulativeInvestment: monthTransactions.filter(t => t.indicatorId === 1).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            cumulativePayout: monthTransactions.filter(t => t.indicatorId === 2).reduce((sum, t) => sum + parseFloat(t.amount), 0)
          };
        });

        analyticsData = {
          investmentGrowth: monthlyData,
          transactionBreakdown: [
            { type: 'Investment', count: clientTransactions.filter(t => t.indicatorId === 1).length },
            { type: 'Withdrawal', count: clientTransactions.filter(t => t.indicatorId === 3).length },
            { type: 'Payout', count: clientTransactions.filter(t => t.indicatorId === 2).length },
            { type: 'Closure', count: clientTransactions.filter(t => t.indicatorId === 4).length }
          ]
        };
      }

      res.json(analyticsData);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}