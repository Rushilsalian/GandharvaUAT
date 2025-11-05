import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Target, 
  Calendar, Activity, Award, AlertCircle, CheckCircle,
  ArrowUpRight, ArrowDownRight, Wallet, CreditCard
} from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/dashboardApi";
import { useSession } from "@/hooks/useSession";

interface EnhancedDashboardProps {
  userRole: "admin" | "leader" | "client";
}

interface MonthlyData {
  month: string;
  investments: number;
  payouts: number;
  clients: number;
}

interface TopPerformer {
  name: string;
  amount: number;
  growth: number;
}



function QuickStatsCard({ title, value, change, icon: Icon, color = "blue" }: any) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center text-xs">
                {change > 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={change > 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(change)}%
                </span>
              </div>
            )}
          </div>
          <Icon className={`h-8 w-8 text-${color}-500`} />
        </div>
      </CardContent>
    </Card>
  );
}


function MonthlyTrends() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/monthly-trends', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMonthlyData(data);
        }
      } catch (error) {
        console.error('Failed to fetch monthly trends:', error);
      }
    };
    fetchData();
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Performance</CardTitle>
        <CardDescription>Investments vs Payouts trend</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="investments" 
              stackId="1" 
              stroke="#8884d8" 
              fill="#8884d8" 
              name="Investments"
            />
            <Area 
              type="monotone" 
              dataKey="payouts" 
              stackId="1" 
              stroke="#82ca9d" 
              fill="#82ca9d" 
              name="Payouts"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function TopPerformers() {
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }
        
        const response = await fetch('/api/dashboard/top-performers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTopPerformers(data || []);
        } else {
          console.error('Failed to fetch top performers:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch top performers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
        <CardDescription>Highest investment growth this month</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : topPerformers.length > 0 ? (
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{performer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{performer.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className={performer.growth >= 0 ? "text-green-600" : "text-red-600"}>
                  {performer.growth >= 0 ? '+' : ''}{performer.growth}%
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">No top performers data available</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface Activity {
  type: string;
  user: string;
  amount: number;
  time: string;
}

function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/recent-transactions?limit=5', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setActivities(data.map((txn: any) => ({
            type: txn.type.toLowerCase(),
            user: txn.client,
            amount: txn.amount,
            time: txn.time
          })));
        }
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "investment": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "withdrawal": return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "payout": return <DollarSign className="h-4 w-4 text-blue-500" />;
      case "referral": return <Users className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest transactions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading activities...</div>
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.user}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.type} {activity.amount > 0 && `₹${activity.amount.toLocaleString()}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">No recent activity</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// function GoalsProgress() {
//   const goals = [
//     { title: "Monthly Target", current: 750000, target: 1000000, color: "blue" },
//     { title: "New Clients", current: 35, target: 50, color: "green" },
//     { title: "Referrals", current: 12, target: 20, color: "purple" }
//   ];

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Goals & Targets</CardTitle>
//         <CardDescription>Progress towards monthly objectives</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-6">
//           {goals.map((goal, index) => {
//             const progress = (goal.current / goal.target) * 100;
//             return (
//               <div key={index} className="space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span className="font-medium">{goal.title}</span>
//                   <span className="text-muted-foreground">
//                     {typeof goal.current === 'number' && goal.current > 1000 
//                       ? `₹${goal.current.toLocaleString()}` 
//                       : goal.current} / {typeof goal.target === 'number' && goal.target > 1000 
//                       ? `₹${goal.target.toLocaleString()}` 
//                       : goal.target}
//                   </span>
//                 </div>
//                 <Progress value={progress} className="h-2" />
//                 <div className="text-xs text-muted-foreground">
//                   {progress.toFixed(1)}% complete
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

interface AlertsNotificationsProps {
  userRole: "admin" | "leader" | "client";
}

function AlertsNotifications({ userRole }: AlertsNotificationsProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`/api/dashboard/alerts?userRole=${userRole}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAlerts(data);
        }
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [userRole]);

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'high') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (severity === 'medium') return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    if (type === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-blue-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts & Notifications</CardTitle>
        <CardDescription>Important updates and system alerts</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-muted-foreground">Loading alerts...</div>
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center space-x-2">
                {getAlertIcon(alert.type, alert.severity)}
                <span className="text-sm">{alert.message}</span>
                {alert.count && (
                  <Badge variant="secondary" className="ml-auto">
                    {alert.count}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-muted-foreground">No alerts at this time</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EnhancedDashboard({ userRole }: EnhancedDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [quickStats, setQuickStats] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/dashboard/stats?userRole=${userRole}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          let stats = [];
          
          if (userRole === 'admin') {
            stats = [
              { title: "Total Clients", value: data.totalClients || 0, change: 8.2, icon: Users },
              { title: "Total Investments", value: `₹${(data.totalInvestments / 100000).toFixed(1)}L`, change: 12.5, icon: Wallet },
              { title: "Active Withdrawals", value: data.activeWithdrawals || 0, change: -2.1, icon: TrendingDown },
              { title: "Monthly Payouts", value: `₹${(data.thisMonthPayouts / 100000).toFixed(1)}L`, change: 15.3, icon: DollarSign }
            ];
          } else if (userRole === 'leader') {
            stats = [
              { title: "My Clients", value: data.myClients || 0, change: 6.8, icon: Users },
              { title: "Team Investments", value: `₹${(data.teamInvestments / 100000).toFixed(1)}L`, change: 10.2, icon: Wallet },
              { title: "Referrals", value: data.referralsThisMonth || 0, change: 12.0, icon: Target },
              { title: "Commission", value: `₹${(data.commissionEarned / 100000).toFixed(1)}L`, change: 18.5, icon: Award }
            ];
          } else {
            stats = [
              { title: "Total Investment", value: `₹${(data.totalInvestment / 100000).toFixed(1)}L`, change: 0, icon: CreditCard },
              { title: "Total Payout", value: `₹${(data.totalPayout / 100000).toFixed(1)}L`, change: 5.8, icon: TrendingUp },
              { title: "Active Referrals", value: data.activeReferrals || 0, change: 0, icon: Users },
              { title: "Pending Withdrawals", value: data.pendingWithdrawals || 0, change: 0, icon: TrendingDown }
            ];
          }
          setQuickStats(stats as any);
        }
      } catch (error) {
        console.error('Failed to fetch quick stats:', error);
      }
    };
    
    const fetchMonthlyData = async () => {
      try {
        const response = await fetch('/api/dashboard/monthly-trends', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMonthlyData(data);
        }
      } catch (error) {
        console.error('Failed to fetch monthly data:', error);
      }
    };
    
    fetchStats();
    fetchMonthlyData();
  }, [userRole]);
  
  const getQuickStats = () => quickStats;

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {getQuickStats().map((stat, index) => (
          <QuickStatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <MonthlyTrends />
            <TopPerformers />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Growth</CardTitle>
                <CardDescription>Monthly client acquisition</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="clients" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* <GoalsProgress /> */}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">+12.5%</div>
                <p className="text-sm text-muted-foreground">Average annual return</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Risk Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">Medium</div>
                <p className="text-sm text-muted-foreground">Portfolio risk level</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Diversification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">85%</div>
                <p className="text-sm text-muted-foreground">Portfolio balance</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <RecentActivity />
            <AlertsNotifications userRole={userRole} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}