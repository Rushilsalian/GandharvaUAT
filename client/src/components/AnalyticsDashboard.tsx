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
  { month: "Jan", organic: 45, referral: 23, marketing: 12, total: 80 },
  { month: "Feb", organic: 52, referral: 28, marketing: 15, total: 95 },
  { month: "Mar", organic: 48, referral: 32, marketing: 18, total: 98 },
  { month: "Apr", organic: 61, referral: 35, marketing: 22, total: 118 },
  { month: "May", organic: 58, referral: 41, marketing: 25, total: 124 },
  { month: "Jun", organic: 65, referral: 38, marketing: 28, total: 131 }
];

const investmentFlowData = [
  { month: "Jan", inflow: 2500000, outflow: 450000, net: 2050000 },
  { month: "Feb", inflow: 2800000, outflow: 520000, net: 2280000 },
  { month: "Mar", inflow: 3200000, outflow: 480000, net: 2720000 },
  { month: "Apr", inflow: 3500000, outflow: 650000, net: 2850000 },
  { month: "May", inflow: 3800000, outflow: 720000, net: 3080000 },
  { month: "Jun", inflow: 4100000, outflow: 580000, net: 3520000 }
];

const clientSegmentData = [
  { segment: "HNI", clients: 45, aum: 15000000, avgTicket: 333333 },
  { segment: "Affluent", clients: 156, aum: 12500000, avgTicket: 80128 },
  { segment: "Mass Market", clients: 789, aum: 8900000, avgTicket: 11280 },
  { segment: "Emerging", clients: 234, aum: 2100000, avgTicket: 8974 }
];

const performanceMetrics = [
  { metric: "Client Satisfaction", value: 92, benchmark: 85 },
  { metric: "Portfolio Performance", value: 88, benchmark: 82 },
  { metric: "Service Quality", value: 94, benchmark: 88 },
  { metric: "Digital Adoption", value: 76, benchmark: 70 },
  { metric: "Risk Management", value: 89, benchmark: 85 },
  { metric: "Compliance Score", value: 96, benchmark: 90 }
];

const conversionFunnelData = [
  { name: "Leads", value: 1000, fill: "#8884d8" },
  { name: "Qualified", value: 650, fill: "#83a6ed" },
  { name: "Proposals", value: 420, fill: "#8dd1e1" },
  { name: "Negotiations", value: 280, fill: "#82ca9d" },
  { name: "Closed", value: 180, fill: "#a4de6c" }
];

const portfolioTreemapData = [
  { name: "Equity", size: 4500000, children: [
    { name: "Large Cap", size: 2700000 },
    { name: "Mid Cap", size: 1350000 },
    { name: "Small Cap", size: 450000 }
  ]},
  { name: "Debt", size: 3000000, children: [
    { name: "Government", size: 1800000 },
    { name: "Corporate", size: 900000 },
    { name: "Municipal", size: 300000 }
  ]},
  { name: "Alternative", size: 1500000, children: [
    { name: "Real Estate", size: 750000 },
    { name: "Commodities", size: 450000 },
    { name: "Crypto", size: 300000 }
  ]}
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
            <Tooltip formatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
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

function ClientSegmentAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Segment Analysis</CardTitle>
        <CardDescription>AUM distribution across client segments</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart data={clientSegmentData}>
            <CartesianGrid />
            <XAxis 
              type="number" 
              dataKey="clients" 
              name="Clients"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis 
              type="number" 
              dataKey="aum" 
              name="AUM"
              tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value, name) => {
                if (name === "AUM") return `₹${(value / 1000000).toFixed(1)}M`;
                if (name === "Avg Ticket") return `₹${(value / 1000).toFixed(0)}K`;
                return value;
              }}
            />
            <Scatter 
              name="Segments" 
              dataKey="aum" 
              fill="#8884d8"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {clientSegmentData.map((segment) => (
            <div key={segment.segment} className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="font-medium">{segment.segment}</span>
              <div className="text-right">
                <div className="text-sm font-medium">{segment.clients} clients</div>
                <div className="text-xs text-muted-foreground">
                  ₹{(segment.avgTicket / 1000).toFixed(0)}K avg
                </div>
              </div>
            </div>
          ))}
        </div>
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
  
  useEffect(() => {
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
            avgReturn: 14.8, // This would come from performance calculation
            goalAchievement: 87 // This would come from goal tracking
          });
        }
      } catch (error) {
        console.error('Failed to fetch key metrics:', error);
      }
    };
    fetchKeyMetrics();
  }, []);
  
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
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total AUM</p>
                <p className="text-2xl font-bold">₹{(keyMetrics.totalAUM / 10000000).toFixed(1)}Cr</p>
                <p className="text-xs text-green-600">+12.5% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold">{keyMetrics.activeClients.toLocaleString()}</p>
                <p className="text-xs text-green-600">+8.2% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg. Return</p>
                <p className="text-2xl font-bold">{keyMetrics.avgReturn}%</p>
                <p className="text-xs text-green-600">+2.1% from benchmark</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Goal Achievement</p>
                <p className="text-2xl font-bold">{keyMetrics.goalAchievement}%</p>
                <p className="text-xs text-yellow-600">Target: 90%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="acquisition" className="space-y-4">
        <TabsList>
          <TabsTrigger value="acquisition">Client Acquisition</TabsTrigger>
          <TabsTrigger value="investment">Investment Flow</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
        </TabsList>

        <TabsContent value="acquisition" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ClientAcquisitionAnalytics />
            <ClientSegmentAnalytics />
          </div>
        </TabsContent>

        <TabsContent value="investment" className="space-y-4">
          <InvestmentFlowAnalytics />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceRadarChart />
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <ConversionFunnelChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}