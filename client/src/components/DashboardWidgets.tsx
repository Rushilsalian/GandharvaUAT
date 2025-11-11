import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { 
  Calendar, Clock, MapPin, Phone, Mail, Star, 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  IndianRupee, Users2, Building2, CreditCard
} from "lucide-react";

// Branch Performance Widget
function BranchPerformanceWidget() {
  const [branchData, setBranchData] = useState<Array<{
    branch: string;
    clients: number;
    aum: number;
    growth: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/branch-performance', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setBranchData(data);
        }
      } catch (error) {
        console.error('Failed to fetch branch performance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Branch Performance
        </CardTitle>
        <CardDescription>Top performing branches</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {branchData.map((branch, index) => (
              <div key={branch.branch} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{branch.branch}</p>
                    <p className="text-sm text-muted-foreground">
                      {branch.clients} clients • ₹{(branch.aum / 1000000).toFixed(1)}M AUM
                    </p>
                  </div>
                </div>
                <Badge variant={branch.growth > 15 ? "default" : "secondary"}>
                  +{branch.growth}%
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Transaction Timeline Widget
function TransactionTimelineWidget() {
  const [transactions, setTransactions] = useState<Array<{
    id: string;
    type: string;
    client: string;
    amount: number;
    time: string;
    status?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/recent-transactions?limit=5', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error('Failed to fetch recent transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "text-green-600 bg-green-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "failed": return "text-red-600 bg-red-100";
      default: return "text-green-600 bg-green-100";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Investment": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "Withdrawal": return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "Payout": return <IndianRupee className="h-4 w-4 text-blue-600" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
        <CardDescription>Latest activity updates</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-shrink-0">
                  {getTypeIcon(txn.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{txn.client}</p>
                    <span className="text-sm text-muted-foreground">{txn.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground">
                      {txn.type} • ₹{txn.amount.toLocaleString()}
                    </p>
                    <Badge className={`text-xs ${getStatusColor(txn.status)}`}>
                      {txn.status || 'Completed'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// KYC Status Widget
function KYCStatusWidget() {
  const [kycStats, setKycStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/kyc-status', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setKycStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch KYC status:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const verificationRate = kycStats.total > 0 ? (kycStats.verified / kycStats.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          KYC Status Overview
        </CardTitle>
        <CardDescription>Client verification status</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{verificationRate.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground">Verification Rate</span>
            </div>
            
            <Progress value={verificationRate} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-green-50">
                <div className="text-lg font-bold text-green-600">{kycStats.verified}</div>
                <div className="text-xs text-green-600">Verified</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50">
                <div className="text-lg font-bold text-yellow-600">{kycStats.pending}</div>
                <div className="text-xs text-yellow-600">Pending</div>
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-red-50">
              <div className="text-lg font-bold text-red-600">{kycStats.rejected}</div>
              <div className="text-xs text-red-600">Rejected</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Monthly Revenue Widget
function MonthlyRevenueWidget() {
  const [revenueData, setRevenueData] = useState<Array<{
    source: string;
    amount: number;
    percentage: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/revenue-breakdown', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setRevenueData(data);
        }
      } catch (error) {
        console.error('Failed to fetch revenue breakdown:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Revenue Breakdown
        </CardTitle>
        <CardDescription>This month's revenue sources</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold">₹{(totalRevenue / 100000).toFixed(1)}L</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            
            {revenueData.map((item, index) => (
              <div key={item.source} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.source}</span>
                  <span className="font-medium">₹{(item.amount / 1000).toFixed(0)}K</span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Risk Assessment Widget
function RiskAssessmentWidget() {
  const [riskMetrics, setRiskMetrics] = useState<Array<{
    metric: string;
    value: number;
    status: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/risk-metrics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setRiskMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch risk metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRiskColor = (status: string) => {
    switch (status) {
      case "low": return "text-green-600 bg-green-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "high": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Risk Assessment
        </CardTitle>
        <CardDescription>Portfolio risk analysis</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {riskMetrics.map((risk, index) => (
              <div key={risk.metric} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{risk.metric}</p>
                  <p className="text-xs text-muted-foreground">{risk.value}%</p>
                </div>
                <Badge className={`${getRiskColor(risk.status)} border-0`}>
                  {risk.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardWidgetsProps {
  userRole: "admin" | "leader" | "client";
}

export function DashboardWidgets({ userRole }: DashboardWidgetsProps) {
  const { session } = useAuth();

  // Admin widgets - Full system access
  const AdminWidgets = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <BranchPerformanceWidget />
      <TransactionTimelineWidget />
      <KYCStatusWidget />
      <MonthlyRevenueWidget />
      <RiskAssessmentWidget />
    </div>
  );

  // Leader widgets - Team and client data
  const LeaderWidgets = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-2">
      <TransactionTimelineWidget />
      <RiskAssessmentWidget />
      {/* Team-specific widgets could be added here */}
    </div>
  );

  // Client widgets - Personal data only
  const ClientWidgets = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <TransactionTimelineWidget />
      <RiskAssessmentWidget />
    </div>
  );

  // Render widgets based on role
  switch (userRole) {
    case 'admin':
      return <AdminWidgets />;
    case 'leader':
      return <LeaderWidgets />;
    case 'client':
    default:
      return <ClientWidgets />;
  }
}