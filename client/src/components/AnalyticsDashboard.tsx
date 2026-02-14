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

// Mock data for analytics - removed static fallback data
const clientAcquisitionData: any[] = [];

const investmentFlowData: any[] = [];

const performanceMetrics: any[] = [];

const conversionFunnelData: any[] = [];


function InvestmentFlowAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Flow Analysis</CardTitle>
        <CardDescription>Monthly inflow vs outflow trends</CardDescription>
      </CardHeader>
      <CardContent>
        {investmentFlowData.length > 0 ? (
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
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">No investment flow data available</div>
          </div>
        )}
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
        {performanceMetrics.length > 0 ? (
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
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">No performance data available</div>
          </div>
        )}
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
        {conversionFunnelData.length > 0 ? (
          <>
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
          </>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">No conversion data available</div>
          </div>
        )}
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
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` }
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
    <div className="space-y-2">
      {/* Analytics Header */}
      <div className="flex items-center justify-between mt-2">
        <div>
          <h2 className="text-1xl font-bold tracking-tight">Analytics Dashboard</h2>
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
        {keyMetrics.activeClients > 0 && (
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
        )}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="investment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          {/* <TabsTrigger value="acquisition">Acquisition</TabsTrigger> */}
          <TabsTrigger value="investment">Investment</TabsTrigger>
          {/* <TabsTrigger value="performance">Performance</TabsTrigger> */}
          {/* <TabsTrigger value="conversion">Conversion</TabsTrigger> */}
        </TabsList>

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