import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from "recharts";
import { 
  Activity, Wifi, WifiOff, RefreshCw, Bell, 
  TrendingUp, TrendingDown, Users, DollarSign,
  AlertCircle, CheckCircle, Clock, Zap
} from "lucide-react";
import { useEffect, useState } from "react";

// Real-time data simulation
const generateRealTimeData = () => ({
  timestamp: new Date().toLocaleTimeString(),
  activeUsers: Math.floor(Math.random() * 50) + 150,
  transactions: Math.floor(Math.random() * 10) + 5,
  revenue: Math.floor(Math.random() * 50000) + 100000,
  systemLoad: Math.floor(Math.random() * 30) + 40
});

const generateMarketData = () => ({
  timestamp: new Date().toLocaleTimeString(),
  nifty: 19500 + (Math.random() - 0.5) * 200,
  sensex: 65000 + (Math.random() - 0.5) * 800,
  bankNifty: 43000 + (Math.random() - 0.5) * 400
});

interface RealTimeMetric {
  label: string;
  value: number;
  change: number;
  status: "up" | "down" | "stable";
  icon: React.ComponentType<any>;
}

function LiveMetricCard({ metric }: { metric: RealTimeMetric }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "up": return "text-green-600 bg-green-100";
      case "down": return "text-red-600 bg-red-100";
      default: return "text-blue-600 bg-blue-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up": return <TrendingUp className="h-3 w-3" />;
      case "down": return <TrendingDown className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-2 right-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <metric.icon className="h-5 w-5 text-muted-foreground" />
          <Badge className={`${getStatusColor(metric.status)} border-0 text-xs`}>
            {getStatusIcon(metric.status)}
            <span className="ml-1">{Math.abs(metric.change).toFixed(1)}%</span>
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
          <p className="text-2xl font-bold">{metric.value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveTransactionFeed() {
  const [transactions, setTransactions] = useState([
    { id: 1, type: "Investment", client: "John Doe", amount: 150000, time: "10:30:45" },
    { id: 2, type: "Withdrawal", client: "Jane Smith", amount: 75000, time: "10:29:12" },
    { id: 3, type: "Payout", client: "Mike Johnson", amount: 25000, time: "10:28:33" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTransaction = {
        id: Date.now(),
        type: ["Investment", "Withdrawal", "Payout"][Math.floor(Math.random() * 3)],
        client: ["Alice Brown", "Bob Wilson", "Carol Davis", "David Lee"][Math.floor(Math.random() * 4)],
        amount: Math.floor(Math.random() * 200000) + 10000,
        time: new Date().toLocaleTimeString()
      };
      
      setTransactions(prev => [newTransaction, ...prev.slice(0, 4)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Investment": return "text-green-600 bg-green-100";
      case "Withdrawal": return "text-red-600 bg-red-100";
      case "Payout": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Transaction Feed
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto" />
        </CardTitle>
        <CardDescription>Real-time transaction updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg border animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <Badge className={`${getTypeColor(txn.type)} border-0 text-xs`}>
                  {txn.type}
                </Badge>
                <div>
                  <p className="font-medium text-sm">{txn.client}</p>
                  <p className="text-xs text-muted-foreground">₹{txn.amount.toLocaleString()}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{txn.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LiveMarketData() {
  const [marketData, setMarketData] = useState([generateMarketData()]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const newData = [...prev, generateMarketData()];
        return newData.slice(-20); // Keep last 20 data points
      });
    }, 3000);

    // Simulate connection status
    const connectionInterval = setInterval(() => {
      setIsConnected(Math.random() > 0.1); // 90% uptime
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(connectionInterval);
    };
  }, []);

  const latestData = marketData[marketData.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600" />
          )}
          Live Market Data
          <Badge variant={isConnected ? "default" : "destructive"} className="ml-auto">
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
        <CardDescription>Real-time market indices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">NIFTY 50</p>
            <p className="text-lg font-bold">{latestData?.nifty.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">SENSEX</p>
            <p className="text-lg font-bold">{latestData?.sensex.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">BANK NIFTY</p>
            <p className="text-lg font-bold">{latestData?.bankNifty.toFixed(2)}</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={marketData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" hide />
            <YAxis hide />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="nifty" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={false}
              name="NIFTY"
            />
            <Line 
              type="monotone" 
              dataKey="sensex" 
              stroke="#82ca9d" 
              strokeWidth={2}
              dot={false}
              name="SENSEX"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function SystemHealthMonitor() {
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 45,
    memory: 62,
    disk: 78,
    network: 23
  });

  const [alerts, setAlerts] = useState([
    { id: 1, type: "warning", message: "High memory usage detected", time: "2 min ago" },
    { id: 2, type: "info", message: "System backup completed", time: "15 min ago" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics({
        cpu: Math.max(0, Math.min(100, systemMetrics.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, systemMetrics.memory + (Math.random() - 0.5) * 8)),
        disk: Math.max(0, Math.min(100, systemMetrics.disk + (Math.random() - 0.5) * 2)),
        network: Math.max(0, Math.min(100, systemMetrics.network + (Math.random() - 0.5) * 15))
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [systemMetrics]);

  const getHealthColor = (value: number) => {
    if (value > 80) return "text-red-600";
    if (value > 60) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          System Health
        </CardTitle>
        <CardDescription>Real-time system monitoring</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(systemMetrics).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="capitalize font-medium">{key}</span>
                <span className={getHealthColor(value)}>{value.toFixed(1)}%</span>
              </div>
              <Progress value={value} className="h-2" />
            </div>
          ))}
        </div>
        
        <div className="mt-6 space-y-2">
          <h4 className="font-medium text-sm">Recent Alerts</h4>
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center gap-2 text-xs">
              {alert.type === "warning" ? (
                <AlertCircle className="h-3 w-3 text-yellow-600" />
              ) : (
                <CheckCircle className="h-3 w-3 text-blue-600" />
              )}
              <span className="flex-1">{alert.message}</span>
              <span className="text-muted-foreground">{alert.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RealTimeDashboard() {
  const [realTimeData, setRealTimeData] = useState(generateRealTimeData());
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setRealTimeData(generateRealTimeData());
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const liveMetrics: RealTimeMetric[] = [
    {
      label: "Active Users",
      value: realTimeData.activeUsers,
      change: Math.random() * 10 - 5,
      status: Math.random() > 0.5 ? "up" : "down",
      icon: Users
    },
    {
      label: "Transactions/min",
      value: realTimeData.transactions,
      change: Math.random() * 15 - 7.5,
      status: Math.random() > 0.3 ? "up" : "down",
      icon: Activity
    },
    {
      label: "Revenue Today",
      value: realTimeData.revenue,
      change: Math.random() * 8 - 4,
      status: "up",
      icon: DollarSign
    },
    {
      label: "System Load",
      value: realTimeData.systemLoad,
      change: Math.random() * 5 - 2.5,
      status: realTimeData.systemLoad > 70 ? "down" : "stable",
      icon: Zap
    }
  ];

  return (
    <div className="space-y-6">
      {/* Real-time Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Real-Time Dashboard</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isLive ? 'Live' : 'Paused'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </Button>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {liveMetrics.map((metric, index) => (
          <LiveMetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Real-time Components */}
      <div className="grid gap-6 md:grid-cols-2">
        <LiveTransactionFeed />
        <LiveMarketData />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SystemHealthMonitor />
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Real-time system performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={[realTimeData]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="systemLoad" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}