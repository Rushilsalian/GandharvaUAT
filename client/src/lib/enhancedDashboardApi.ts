import { apiClient } from './apiClient';

// Enhanced Dashboard Data Types
export interface PortfolioDistribution {
  name: string;
  value: number;
  amount: number;
  percentage: number;
}

export interface ClientDemographics {
  ageGroup: string;
  count: number;
  percentage: number;
}

export interface BranchPerformance {
  branchId: number;
  branchName: string;
  clientCount: number;
  aum: number;
  growth: number;
  location: string;
}

export interface TransactionActivity {
  transactionId: string;
  type: 'investment' | 'withdrawal' | 'payout' | 'closure';
  clientName: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'processing';
  timestamp: string;
}

export interface KYCStatus {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  verificationRate: number;
}

export interface RevenueBreakdown {
  source: string;
  amount: number;
  percentage: number;
}

export interface RiskMetrics {
  metric: string;
  value: number;
  status: 'low' | 'medium' | 'high';
  threshold: number;
}

export interface InvestmentPerformance {
  period: string;
  return: number;
  benchmark: number;
  alpha: number;
}

export interface TopPerformer {
  clientId: number;
  clientName: string;
  totalInvestment: number;
  currentValue: number;
  growth: number;
  rank: number;
}

export interface MonthlyTrend {
  month: string;
  investments: number;
  payouts: number;
  clients: number;
  revenue: number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  transactionsPerMinute: number;
  revenueToday: number;
  systemLoad: number;
  timestamp: string;
}

export interface MarketData {
  index: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>;
}

export interface ClientSegment {
  segment: string;
  clientCount: number;
  aum: number;
  averageTicketSize: number;
  growthRate: number;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  conversionRate: number;
}

// Enhanced Dashboard API
export const enhancedDashboardApi = {
  // Portfolio & Investment APIs
  async getPortfolioDistribution(): Promise<PortfolioDistribution[]> {
    return await apiClient.get('/dashboard/portfolio-distribution');
  },

  async getInvestmentPerformance(): Promise<InvestmentPerformance[]> {
    return await apiClient.get('/dashboard/investment-performance');
  },

  async getTopPerformers(limit: number = 10): Promise<TopPerformer[]> {
    return await apiClient.get('/dashboard/top-performers', { limit: limit.toString() });
  },

  // Client & Demographics APIs
  async getClientDemographics(): Promise<ClientDemographics[]> {
    return await apiClient.get('/dashboard/client-demographics');
  },

  async getClientSegments(): Promise<ClientSegment[]> {
    return await apiClient.get('/dashboard/client-segments');
  },

  async getKYCStatus(): Promise<KYCStatus> {
    return await apiClient.get('/dashboard/kyc-status');
  },

  // Branch & Performance APIs
  async getBranchPerformance(): Promise<BranchPerformance[]> {
    return await apiClient.get('/dashboard/branch-performance');
  },

  async getMonthlyTrends(months: number = 12): Promise<MonthlyTrend[]> {
    return await apiClient.get('/dashboard/monthly-trends', { months: months.toString() });
  },

  // Transaction & Activity APIs
  async getRecentTransactions(limit: number = 20): Promise<TransactionActivity[]> {
    return await apiClient.get('/dashboard/recent-transactions', { limit: limit.toString() });
  },

  async getLiveTransactionFeed(): Promise<TransactionActivity[]> {
    return await apiClient.get('/dashboard/live-transactions');
  },

  // Revenue & Financial APIs
  async getRevenueBreakdown(period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<RevenueBreakdown[]> {
    return await apiClient.get('/dashboard/revenue-breakdown', { period });
  },

  // Risk & Compliance APIs
  async getRiskMetrics(clientId?: number): Promise<RiskMetrics[]> {
    const params = clientId ? { clientId: clientId.toString() } : {};
    return await apiClient.get('/dashboard/risk-metrics', params);
  },

  // Real-time APIs
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    return await apiClient.get('/dashboard/realtime-metrics');
  },

  async getMarketData(): Promise<MarketData[]> {
    return await apiClient.get('/dashboard/market-data');
  },

  async getSystemHealth(): Promise<SystemHealth> {
    return await apiClient.get('/dashboard/system-health');
  },

  // Analytics APIs
  async getConversionFunnel(): Promise<ConversionFunnel[]> {
    return await apiClient.get('/dashboard/conversion-funnel');
  },

  async getClientAcquisitionTrends(months: number = 6): Promise<any[]> {
    return await apiClient.get('/dashboard/client-acquisition', { months: months.toString() });
  },

  async getInvestmentFlowAnalysis(months: number = 6): Promise<any[]> {
    return await apiClient.get('/dashboard/investment-flow', { months: months.toString() });
  },

  // Utility APIs
  async exportDashboardData(format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<Blob> {
    const response = await fetch('/api/dashboard/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ format })
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return await response.blob();
  },

  async refreshDashboardCache(): Promise<void> {
    await apiClient.post('/dashboard/refresh-cache', {});
  },

  // Notification & Alert APIs
  async getDashboardAlerts(): Promise<any[]> {
    return await apiClient.get('/dashboard/alerts');
  },

  async markAlertAsRead(alertId: string): Promise<void> {
    await apiClient.post(`/dashboard/alerts/${alertId}/read`, {});
  },

  // Custom Dashboard APIs
  async saveDashboardLayout(layout: any): Promise<void> {
    await apiClient.post('/dashboard/save-layout', { layout });
  },

  async getDashboardLayout(userId: number): Promise<any> {
    return await apiClient.get('/dashboard/layout', { userId: userId.toString() });
  },

  // Subscription for real-time updates
  subscribeToRealTimeUpdates(callback: (data: any) => void): () => void {
    // WebSocket connection for real-time updates
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL || 'ws://localhost:3001'}/dashboard-updates`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Return cleanup function
    return () => {
      ws.close();
    };
  }
};

// Helper functions for data formatting
export const dashboardHelpers = {
  formatCurrency: (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString()}`;
  },

  formatPercentage: (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
  },

  formatNumber: (value: number): string => {
    return value.toLocaleString();
  },

  getGrowthColor: (growth: number): string => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  },

  getRiskColor: (risk: 'low' | 'medium' | 'high'): string => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  },

  getStatusColor: (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
};