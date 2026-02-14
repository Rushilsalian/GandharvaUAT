import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { dashboardApi, type DashboardTrends } from "@/lib/dashboardApi";
import { useSession } from "@/hooks/useSession";

interface TrendData {
  month: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  description?: string;
  data: TrendData[];
  dataKey?: string;
  color?: string;
}

export function TrendChart({ 
  title, 
  description, 
  data, 
  dataKey = "value", 
  color = "hsl(var(--chart-1))" 
}: TrendChartProps) {
  return (
    <Card className="hover-elevate">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="fill-muted-foreground"
              fontSize={12}
            />
            <YAxis 
              className="fill-muted-foreground"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface DashboardChartsProps {
  userRole: "admin" | "leader" | "client";
}

export function DashboardCharts({ userRole }: DashboardChartsProps) {
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/monthly-trends', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTrends({ 
            clientTrend: data.map((d: any) => ({ month: d.month, value: d.clients })),
            investmentTrend: data.map((d: any) => ({ month: d.month, value: d.investments })),
            teamTrend: data.map((d: any) => ({ month: d.month, value: d.investments })),
            referralTrend: data.map((d: any) => ({ month: d.month, value: d.clients })),
            clientInvestmentTrend: data.map((d: any) => ({ month: d.month, value: d.investments })),
            payoutTrend: data.map((d: any) => ({ month: d.month, value: d.payouts }))
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [userRole, session?.clientId]);

  const getChartsForRole = () => {
    if (loading) {
      return [];
    }
    
    if (userRole === "admin" && trends) {
      const charts = [];
      if (trends.clientTrend && trends.clientTrend.some(d => d.value > 0)) {
        charts.push({
          title: "New Clients Trend",
          description: "Monthly new client acquisitions",
          data: trends.clientTrend,
          color: "hsl(var(--chart-1))"
        });
      }
      if (trends.investmentTrend && trends.investmentTrend.some(d => d.value > 0)) {
        charts.push({
          title: "Investment Trend",
          description: "Monthly investment volume in ₹",
          data: trends.investmentTrend,
          color: "hsl(var(--chart-2))"
        });
      }
      return charts;
    }
    
    if (userRole === "leader" && trends) {
      const charts = [];
      if (trends.teamTrend && trends.teamTrend.some(d => d.value > 0)) {
        charts.push({
          title: "Team Performance",
          description: "Monthly team investment performance",
          data: trends.teamTrend,
          color: "hsl(var(--chart-2))"
        });
      }
      if (trends.referralTrend && trends.referralTrend.some(d => d.value > 0)) {
        charts.push({
          title: "Referral Trend",
          description: "Monthly referrals brought in",
          data: trends.referralTrend,
          color: "hsl(var(--chart-1))"
        });
      }
      return charts;
    }
    
    // Client charts
    if (userRole === "client" && trends) {
      const charts = [];
      if (trends.investmentTrend && trends.investmentTrend.some(d => d.value > 0)) {
        charts.push({
          title: "Investment Growth",
          description: "Your investment growth over time",
          data: trends.investmentTrend,
          color: "hsl(var(--chart-2))"
        });
      }
      if (trends.payoutTrend && trends.payoutTrend.some(d => d.value > 0)) {
        charts.push({
          title: "Payout History",
          description: "Monthly payouts received",
          data: trends.payoutTrend,
          color: "hsl(var(--chart-1))"
        });
      }
      return charts;
    }

    return [];
  };

  const charts = getChartsForRole();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {charts.map((chart, index) => (
        <TrendChart
          key={`${chart.title}-${index}`}
          title={chart.title}
          description={chart.description}
          data={chart.data}
          color={chart.color}
        />
      ))}
    </div>
  );
}