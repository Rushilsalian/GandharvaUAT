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
      return [
        { 
          title: "Total Clients", 
          value: stats.totalClients || 0, 
          change: 12.5, 
          icon: Users, 
          trend: "up" as const 
        },
        { 
          title: "Total Investments", 
          value: stats.totalInvestments || 0, 
          change: 8.2, 
          icon: TrendingUp, 
          trend: "up" as const 
        },
        { 
          title: "Active Withdrawals", 
          value: stats.activeWithdrawals || 0, 
          change: -2.1, 
          icon: TrendingDown, 
          trend: "down" as const 
        },
        { 
          title: "This Month Payouts", 
          value: stats.thisMonthPayouts || 0, 
          change: 15.3, 
          icon: DollarSign, 
          trend: "up" as const 
        },
      ];
    }
    
    if (userRole === "leader" && stats) {
      return [
        { 
          title: "My Clients", 
          value: stats.myClients || 0, 
          change: 5.7, 
          icon: Users, 
          trend: "up" as const 
        },
        { 
          title: "Team Investments", 
          value: stats.teamInvestments || 0, 
          change: 12.1, 
          icon: TrendingUp, 
          trend: "up" as const 
        },
        { 
          title: "Referrals This Month", 
          value: stats.referralsThisMonth || 0, 
          change: 14.3, 
          icon: Users, 
          trend: "up" as const 
        },
        { 
          title: "Commission Earned", 
          value: stats.commissionEarned || 0, 
          change: 9.8, 
          icon: DollarSign, 
          trend: "up" as const 
        },
      ];
    }
    
    // Client stats
    if (userRole === "client" && stats) {
      return [
        { 
          title: "Total Investment", 
          value: stats.totalInvestment || 0, 
          change: 0, 
          icon: TrendingUp, 
          trend: "neutral" as const 
        },
        { 
          title: "Total Payout", 
          value: stats.totalPayout || 0, 
          change: 0, 
          icon: DollarSign, 
          trend: "neutral" as const 
        },
        { 
          title: "Active Referrals", 
          value: stats.activeReferrals || 0, 
          change: 0, 
          icon: Users, 
          trend: "neutral" as const 
        },
        { 
          title: "Pending Withdrawals", 
          value: stats.pendingWithdrawals || 0, 
          change: 0, 
          icon: TrendingDown, 
          trend: "neutral" as const 
        },
      ];
    }

    // Loading state - show role-appropriate titles
    const loadingStats = {
      admin: [
        { title: "Total Clients", value: 0, icon: Users, trend: "neutral" as const },
        { title: "Total Investments", value: 0, icon: TrendingUp, trend: "neutral" as const },
        { title: "Active Withdrawals", value: 0, icon: TrendingDown, trend: "neutral" as const },
        { title: "This Month Payouts", value: 0, icon: DollarSign, trend: "neutral" as const },
      ],
      leader: [
        { title: "My Clients", value: 0, icon: Users, trend: "neutral" as const },
        { title: "Team Investments", value: 0, icon: TrendingUp, trend: "neutral" as const },
        { title: "Referrals This Month", value: 0, icon: Users, trend: "neutral" as const },
        { title: "Commission Earned", value: 0, icon: DollarSign, trend: "neutral" as const },
      ],
      client: [
        { title: "Total Investment", value: 0, icon: TrendingUp, trend: "neutral" as const },
        { title: "Total Payout", value: 0, icon: DollarSign, trend: "neutral" as const },
        { title: "Active Referrals", value: 0, icon: Users, trend: "neutral" as const },
        { title: "Pending Withdrawals", value: 0, icon: TrendingDown, trend: "neutral" as const },
      ]
    };
    
    return loadingStats[userRole] || loadingStats.client;
  };

  const roleStats = getStatsForRole();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {roleStats.map((stat, index) => (
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