import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardApi, type DashboardStats as DashboardStatsType } from "@/lib/dashboardApi";
import { useSession } from "@/hooks/useSession";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
}

function StatCard({ title, value, change, icon: Icon, trend = "neutral", loading }: StatCardProps) {
  const formatValue = (val: string | number) => {
    if (loading) return "...";
    if (typeof val === "number") {
      if (val > 100000) {
        return `₹${(val / 100000).toFixed(1)}L`;
      } else if (val > 1000) {
        return `₹${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\\s+/g, '-')}`}>
          {formatValue(value)}
        </div>
        {change !== undefined && !loading && (
          <div className="flex items-center text-xs text-muted-foreground">
            {trend === "up" && <ArrowUpRight className="h-3 w-3 mr-1 text-chart-2" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3 mr-1 text-chart-3" />}
            <span className={trend === "up" ? "text-chart-2" : trend === "down" ? "text-chart-3" : ""}>
              {change > 0 ? "+" : ""}{change.toFixed(1)}%
            </span>
            <span className="ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  userRole: "admin" | "leader" | "client";
}

export function DashboardStats({ userRole }: DashboardStatsProps) {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const clientId = session?.clientId || undefined;
        console.log('Fetching stats for:', { userRole, clientId, session });
        const data = await dashboardApi.getStats(userRole, clientId);
        console.log('Received stats data:', data);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userRole, session?.clientId]);

  const getStatsForRole = () => {
    if (userRole === "admin" && stats) {
      const adminStats = [];
      if (stats.totalClients && stats.totalClients > 0) {
        adminStats.push({ 
          title: "Total Clients", 
          value: stats.totalClients, 
          change: 12.5, 
          icon: Users, 
          trend: "up" as const 
        });
      }
      if (stats.totalInvestments && stats.totalInvestments > 0) {
        adminStats.push({ 
          title: "Total Investments", 
          value: stats.totalInvestments, 
          change: 8.2, 
          icon: TrendingUp, 
          trend: "up" as const 
        });
      }
      if (stats.activeWithdrawals && stats.activeWithdrawals > 0) {
        adminStats.push({ 
          title: "Active Withdrawals", 
          value: stats.activeWithdrawals, 
          change: -2.1, 
          icon: TrendingDown, 
          trend: "down" as const 
        });
      }
      if (stats.thisMonthPayouts && stats.thisMonthPayouts > 0) {
        adminStats.push({ 
          title: "This Month Payouts", 
          value: stats.thisMonthPayouts, 
          change: 15.3, 
          icon: DollarSign, 
          trend: "up" as const 
        });
      }
      return adminStats;
    }
    
    if (userRole === "leader" && stats) {
      const leaderStats = [];
      if (stats.myClients && stats.myClients > 0) {
        leaderStats.push({ 
          title: "My Clients", 
          value: stats.myClients, 
          change: 5.7, 
          icon: Users, 
          trend: "up" as const 
        });
      }
      if (stats.teamInvestments && stats.teamInvestments > 0) {
        leaderStats.push({ 
          title: "Team Investments", 
          value: stats.teamInvestments, 
          change: 12.1, 
          icon: TrendingUp, 
          trend: "up" as const 
        });
      }
      if (stats.referralsThisMonth && stats.referralsThisMonth > 0) {
        leaderStats.push({ 
          title: "Referrals This Month", 
          value: stats.referralsThisMonth, 
          change: 14.3, 
          icon: Users, 
          trend: "up" as const 
        });
      }
      if (stats.commissionEarned && stats.commissionEarned > 0) {
        leaderStats.push({ 
          title: "Commission Earned", 
          value: stats.commissionEarned, 
          change: 9.8, 
          icon: DollarSign, 
          trend: "up" as const 
        });
      }
      return leaderStats;
    }
    
    // Client stats
    if (userRole === "client" && stats) {
      const clientStats = [];
      if (stats.totalInvestment && stats.totalInvestment > 0) {
        clientStats.push({ 
          title: "Total Investment", 
          value: stats.totalInvestment, 
          change: 0, 
          icon: TrendingUp, 
          trend: "neutral" as const 
        });
      }
      if (stats.totalPayout && stats.totalPayout > 0) {
        clientStats.push({ 
          title: "Total Payout", 
          value: stats.totalPayout, 
          change: 0, 
          icon: DollarSign, 
          trend: "neutral" as const 
        });
      }
      if (stats.activeReferrals && stats.activeReferrals > 0) {
        clientStats.push({ 
          title: "Active Referrals", 
          value: stats.activeReferrals, 
          change: 0, 
          icon: Users, 
          trend: "neutral" as const 
        });
      }
      if (stats.pendingWithdrawals && stats.pendingWithdrawals > 0) {
        clientStats.push({ 
          title: "Pending Withdrawals", 
          value: stats.pendingWithdrawals, 
          change: 0, 
          icon: TrendingDown, 
          trend: "neutral" as const 
        });
      }
      return clientStats;
    }

    return [];
  };

  const roleStats = getStatsForRole();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {roleStats.length > 0 && roleStats.map((stat, index) => (
        <StatCard
          key={`${stat.title}-${index}`}
          title={stat.title}
          value={stat.value}
          change={stat.change !== 0 ? stat.change : undefined}
          icon={stat.icon}
          trend={stat.trend}
          loading={loading}
        />
      ))}
    </div>
  );
}