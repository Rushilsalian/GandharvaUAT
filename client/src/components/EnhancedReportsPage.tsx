import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Download, 
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface RoleBasedReportData {
  role: string;
  summary: any;
  clients?: any[];
  transactions: any[];
  clientInfo?: any;
}

interface AnalyticsData {
  monthlyTrends?: any[];
  topClients?: any[];
  transactionTypeDistribution?: any[];
  monthlyPerformance?: any[];
  clientPerformance?: any[];
  investmentGrowth?: any[];
  transactionBreakdown?: any[];
}

export default function EnhancedReportsPage() {
  const { token, user, session } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [transactionPage, setTransactionPage] = useState(1);
  const [clientPage, setClientPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch role-based report data
  const { data: reportData, isLoading: reportLoading } = useQuery<RoleBasedReportData>({
    queryKey: ['/api/reports/role-based', token],
    queryFn: async () => {
      const response = await fetch('/api/reports/role-based', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      return response.json();
    },
    enabled: !!token,
    staleTime: 30000
  });

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/reports/analytics', token],
    queryFn: async () => {
      const response = await fetch('/api/reports/analytics', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      return response.json();
    },
    enabled: !!token,
    staleTime: 30000
  });

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvData = data.map(row => 
      headers.map(header => `"${row[header] || ''}"`).join(',')
    );
    
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderAdminOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.summary.totalClients || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(reportData?.summary.totalInvestmentAmount || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(reportData?.summary.totalPayoutAmount || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.summary.totalTransactions || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends Chart */}
      {analyticsData?.monthlyTrends && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Investment and payout trends over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="investments" stroke="#8884d8" name="Investments" />
                <Line type="monotone" dataKey="payouts" stroke="#82ca9d" name="Payouts" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Clients */}
      {analyticsData?.topClients && (
        <Card>
          <CardHeader>
            <CardTitle>Top Clients by Investment</CardTitle>
            <CardDescription>Highest investing clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.topClients.slice(0, 5).map((client, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{client.clientName}</span>
                    {/* <span className="text-sm text-muted-foreground ml-2">({client.clientCode})</span> */}
                  </div>
                  <span className="font-bold">₹{client.totalInvestment.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderLeaderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.summary.myClients || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Investments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(reportData?.summary.totalInvestmentAmount || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(reportData?.summary.totalPayoutAmount || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.summary.totalTransactions || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      {analyticsData?.monthlyPerformance && (
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Monthly performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="investments" fill="#8884d8" name="Investments" />
                <Bar dataKey="payouts" fill="#82ca9d" name="Payouts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderClientOverview = () => (
    <div className="space-y-6">
      {/* Client Info */}
      {reportData?.clientInfo && (
        <Card>
          <CardHeader>
            <CardTitle>My Account Summary</CardTitle>
            <CardDescription>Your investment portfolio overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Client Code:</strong> {reportData.clientInfo.clientCode}</p>
                <p><strong>Name:</strong> {reportData.clientInfo.clientName}</p>
                <p><strong>Email:</strong> {reportData.clientInfo.email}</p>
              </div>
              <div>
                <p><strong>Mobile:</strong> {reportData.clientInfo.mobile}</p>
                <p><strong>Total Transactions:</strong> {reportData.summary.transactionCount}</p>
                <p><strong>Net Position:</strong> ₹{(reportData.summary.netPosition || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{(reportData?.summary.totalInvestment || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{(reportData?.summary.totalPayout || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{(reportData?.summary.totalWithdrawal || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Closure</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{(reportData?.summary.totalClosure || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Position</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(reportData?.summary.netPosition || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{(reportData?.summary.netPosition || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Growth Chart */}
      {analyticsData?.investmentGrowth && (
        <Card>
          <CardHeader>
            <CardTitle>Investment Growth</CardTitle>
            <CardDescription>Your investment and payout history</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.investmentGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="cumulativeInvestment" stroke="#8884d8" name="Cumulative Investment" />
                <Line type="monotone" dataKey="cumulativePayout" stroke="#82ca9d" name="Cumulative Payout" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTransactionsTable = () => {
    const transactions = reportData?.transactions || [];
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const startIndex = (transactionPage - 1) * itemsPerPage;
    const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {transactions.length} transactions found
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => exportToCSV(transactions, 'transactions')}
              disabled={!transactions.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Date</th>
                  {reportData?.role !== 'client' && <th className="text-left p-2 font-medium">Client</th>}
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-left p-2 font-medium">Amount</th>
                  <th className="text-left p-2 font-medium">Remark</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((transaction, index) => (
                  <tr key={startIndex + index} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </td>
                    {reportData?.role !== 'client' && (
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{transaction.clientName}</div>
                          {/* <div className="text-sm text-muted-foreground">({transaction.clientCode})</div> */}
                        </div>
                      </td>
                    )}
                    <td className="p-2">
                      <Badge variant={
                        transaction.type === 'Investment' ? 'default' : 
                        transaction.type === 'Payout' ? 'secondary' : 'outline'
                      }>
                        {transaction.type}
                      </Badge>
                    </td>
                    <td className="p-2 font-medium">
                      ₹{transaction.amount.toLocaleString()}
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {transaction.remark || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!transactions.length && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found.
              </div>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, transactions.length)} of {transactions.length} transactions
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTransactionPage(prev => Math.max(prev - 1, 1))}
                  disabled={transactionPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {transactionPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTransactionPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={transactionPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderClientsTable = () => {
    if (reportData?.role === 'client' || !reportData?.clients) return null;

    const clients = reportData.clients;
    const totalPages = Math.ceil(clients.length / itemsPerPage);
    const startIndex = (clientPage - 1) * itemsPerPage;
    const paginatedClients = clients.slice(startIndex, startIndex + itemsPerPage);

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Client Summary</CardTitle>
              <CardDescription>
                {clients.length} clients found
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => exportToCSV(clients, 'clients')}
              disabled={!clients.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Client</th>
                  <th className="text-left p-2 font-medium">Contact</th>
                  <th className="text-left p-2 font-medium">Investment</th>
                  <th className="text-left p-2 font-medium">Payout</th>
                  <th className="text-left p-2 font-medium">Withdrawal</th>
                  <th className="text-left p-2 font-medium">Closure</th>
                  <th className="text-left p-2 font-medium">Transactions</th>
                  <th className="text-left p-2 font-medium">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((client, index) => (
                  <tr key={startIndex + index} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{client.clientName}</div>
                        {/* <div className="text-sm text-muted-foreground">({client.clientCode})</div> */}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        <div>{client.email}</div>
                        <div className="text-muted-foreground">{client.mobile}</div>
                      </div>
                    </td>
                    <td className="p-2 font-medium text-green-600">
                      ₹{client.totalInvestment.toLocaleString()}
                    </td>
                    <td className="p-2 font-medium text-blue-600">
                      ₹{client.totalPayout.toLocaleString()}
                    </td>
                    <td className="p-2 font-medium text-yellow-600">
                      ₹{client.totalWithdrawal.toLocaleString()}
                    </td>
                    <td className="p-2 font-medium text-red-600">
                      ₹{client.totalClosure.toLocaleString()}
                    </td>
                    <td className="p-2">
                      {client.transactionCount}
                    </td>
                    <td className="p-2 text-sm">
                      {client.lastTransactionDate 
                        ? format(new Date(client.lastTransactionDate), 'MMM dd, yyyy')
                        : 'No transactions'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, clients.length)} of {clients.length} clients
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClientPage(prev => Math.max(prev - 1, 1))}
                  disabled={clientPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {clientPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClientPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={clientPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (reportLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enhanced Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics and reporting dashboard
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          {reportData?.role !== 'client' && <TabsTrigger value="clients">Clients</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {reportData?.role === 'admin' && renderAdminOverview()}
          {reportData?.role === 'leader' && renderLeaderOverview()}
          {reportData?.role === 'client' && renderClientOverview()}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {renderTransactionsTable()}
        </TabsContent>

        {reportData?.role !== 'client' && (
          <TabsContent value="clients" className="space-y-6">
            {renderClientsTable()}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}