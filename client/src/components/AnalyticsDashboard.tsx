import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap, FunnelChart, Funnel, LabelList
} from "recharts";
import { 
  BarChart3, PieChart, TrendingUp, Users, Target, 
  Calendar, Filter, Download, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// Mock data for analytics
const clientAcquisitionData = [
  { month: "Jan", organic: 0, referral: 0, marketing: 0, total: 0 },
  { month: "Feb", organic: 0, referral: 0, marketing: 0, total: 0 },
  { month: "Mar", organic: 0, referral: 0, marketing: 0, total: 0 },
  { month: "Apr", organic: 0, referral: 0, marketing: 0, total: 0 },
  { month: "May", organic: 0, referral: 0, marketing: 0, total: 0 },
  { month: "Jun", organic: 0, referral: 0, marketing: 0, total: 0 }
];

const investmentFlowData = [
  { month: "Jan", inflow: 0, outflow: 0, net: 0 },
  { month: "Feb", inflow: 0, outflow: 0, net: 0 },
  { month: "Mar", inflow: 0, outflow: 0, net: 0 },
  { month: "Apr", inflow: 0, outflow: 0, net: 0 },
  { month: "May", inflow: 0, outflow: 0, net: 0 },
  { month: "Jun", inflow: 0, outflow: 0, net: 0 }
];

const performanceMetrics = [
  { metric: "Client Satisfaction", value: 0, benchmark: 0 },
  { metric: "Portfolio Performance", value: 0, benchmark: 0 },
  { metric: "Service Quality", value: 0, benchmark: 0 },
  { metric: "Digital Adoption", value: 0, benchmark: 0 },
  { metric: "Risk Management", value: 0, benchmark: 0 },
  { metric: "Compliance Score", value: 0, benchmark: 0 }
];

const conversionFunnelData = [
  { name: "Leads", value: 0, fill: "#8884d8" },
  { name: "Qualified", value: 0, fill: "#83a6ed" },
  { name: "Proposals", value: 0, fill: "#8dd1e1" },
  { name: "Negotiations", value: 0, fill: "#82ca9d" },
  { name: "Closed", value: 0, fill: "#a4de6c" }
];

function ClientAcquisitionAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Acquisition Analysis</CardTitle>
        <CardDescription>Multi-channel acquisition trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={clientAcquisitionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="organic" stackId="a" fill="#8884d8" name="Organic" />
            <Bar dataKey="referral" stackId="a" fill="#82ca9d" name="Referral" />
            <Bar dataKey="marketing" stackId="a" fill="#ffc658" name="Marketing" />
            <Line type="monotone" dataKey="total" stroke="#ff7300" strokeWidth={3} name="Total" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function InvestmentFlowAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Flow Analysis</CardTitle>
        <CardDescription>Monthly inflow vs outflow trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={investmentFlowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${(Number(value) / 100000).toFixed(1)}L`} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="inflow" 
              fill="#8884d8" 
              stroke="#8884d8" 
              fillOpacity={0.6}
              name="Inflow"
            />
            <Area 
              type="monotone" 
              dataKey="outflow" 
              fill="#82ca9d" 
              stroke="#82ca9d" 
              fillOpacity={0.6}
              name="Outflow"
            />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke="#ff7300" 
              strokeWidth={3}
              name="Net Flow"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function PerformanceRadarChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Radar</CardTitle>
        <CardDescription>Key performance indicators vs benchmarks</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={performanceMetrics}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
            />
            <Radar
              name="Actual"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="Benchmark"
              dataKey="benchmark"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ConversionFunnelChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Conversion Funnel</CardTitle>
        <CardDescription>Lead to client conversion analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <FunnelChart>
            <Tooltip />
            <Funnel
              dataKey="value"
              data={conversionFunnelData}
              isAnimationActive
            >
              <LabelList position="center" fill="#fff" stroke="none" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {conversionFunnelData.map((stage, index) => {
            const conversionRate = index > 0 
              ? ((stage.value / conversionFunnelData[index - 1].value) * 100).toFixed(1)
              : "100.0";
            return (
              <div key={stage.name} className="flex justify-between items-center">
                <span className="text-sm font-medium">{stage.name}</span>
                <div className="text-right">
                  <span className="text-sm">{stage.value}</span>
                  <Badge variant="outline" className="ml-2">
                    {conversionRate}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [keyMetrics, setKeyMetrics] = useState({
    totalAUM: 0,
    activeClients: 0,
    avgReturn: 0,
    goalAchievement: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchKeyMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard/stats?userRole=admin', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setKeyMetrics({
          totalAUM: data.totalInvestments || 0,
          activeClients: data.totalClients || 0,
          avgReturn: 14.8,
          goalAchievement: 87
        });
      }
    } catch (error) {
      console.error('Failed to fetch key metrics:', error);
    }
  };
  
  useEffect(() => {
    fetchKeyMetrics();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchKeyMetrics();
    setIsRefreshing(false);
  };

  const handleExport = () => {
    const exportData = {
      keyMetrics,
      clientAcquisition: clientAcquisitionData,
      investmentFlow: investmentFlowData,
      performance: performanceMetrics,
      conversionFunnel: conversionFunnelData,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive business intelligence and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">     
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold">{keyMetrics.activeClients.toLocaleString()}</p>
                <div className="flex items-center text-xs">
                  <span className="text-green-500">+8.2%</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="acquisition" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
          <TabsTrigger value="investment">Investment</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
        </TabsList>

        <TabsContent value="acquisition" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ClientAcquisitionAnalytics />
          </div>
        </TabsContent>

        <TabsContent value="investment" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1">
            <InvestmentFlowAnalytics />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1">
            <PerformanceRadarChart />
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1">
            <ConversionFunnelChart />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}