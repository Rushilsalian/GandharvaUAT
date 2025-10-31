import { apiClient } from './apiClient';

export interface DashboardStats {
  // Admin stats
  totalClients?: number;
  totalInvestments?: number;
  activeWithdrawals?: number;
  thisMonthPayouts?: number;
  
  // Leader stats
  myClients?: number;
  teamInvestments?: number;
  referralsThisMonth?: number;
  commissionEarned?: number;
  
  // Client stats
  totalInvestment?: number;
  totalPayout?: number;
  activeReferrals?: number;
  pendingWithdrawals?: number;
}

export interface TrendData {
  month: string;
  value: number;
}

export interface DashboardTrends {
  // Admin trends
  clientTrend?: TrendData[];
  investmentTrend?: TrendData[];
  
  // Leader trends
  teamTrend?: TrendData[];
  referralTrend?: TrendData[];
  
  // Client trends
  clientInvestmentTrend?: TrendData[];
  payoutTrend?: TrendData[];
}

export const dashboardApi = {
  async getStats(userRole: string, clientId?: number): Promise<DashboardStats> {
    const params: Record<string, string> = { userRole };
    if (clientId) {
      params.clientId = clientId.toString();
    }
    
    const response = await apiClient.get('/dashboard/stats', params);
    return response;
  },

  async getTrends(userRole: string, clientId?: number): Promise<DashboardTrends> {
    const params: Record<string, string> = { userRole };
    if (clientId) {
      params.clientId = clientId.toString();
    }
    
    const response = await apiClient.get('/dashboard/trends', params);
    return response;
  }
};