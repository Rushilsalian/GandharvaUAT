import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Users, FileText, Eye, Download, Upload } from "lucide-react";
import { format, isWithinInterval } from "date-fns";
import { TransactionFilters } from "@/components/TransactionFilters";
import { InvestmentExcelUpload } from "@/components/InvestmentExcelUpload";
import { PaginationControls } from "@/components/PaginationControls";
import { usePagination } from "@/hooks/usePagination";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  processedAt?: Date;
  createdAt: Date;
  client?: {
    id: string;
    clientCode: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface FilterState {
  dateRange?: DateRange;
  clientId?: string;
  description?: string;
}

export default function InvestmentPage() {
  const { session, token } = useAuth();
  // Filter state
  const [filters, setFilters] = useState<FilterState>({});
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();

  // Fetch investment transactions only
  const { data: investments = [], isLoading, error } = useQuery({
    queryKey: ['/api/transactions', { type: 'investment' }],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?type=investment&_t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch investment transactions');
      }
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    enabled: !!token
  });

  // Fetch clients for filter dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      return response.json();
    },
    enabled: !!token
  });

  // Apply filters to investments
  const filteredInvestments = useMemo(() => {
    return investments.filter((investment: Transaction) => {
      // Date range filter
      if (filters.dateRange?.from || filters.dateRange?.to) {
        const transactionDate = new Date(investment.processedAt || investment.createdAt);
        if (filters.dateRange.from && filters.dateRange.to) {
          if (!isWithinInterval(transactionDate, {
            start: filters.dateRange.from,
            end: filters.dateRange.to
          })) {
            return false;
          }
        } else if (filters.dateRange.from) {
          if (transactionDate < filters.dateRange.from) return false;
        } else if (filters.dateRange.to) {
          if (transactionDate > filters.dateRange.to) return false;
        }
      }

      // Client filter
      if (filters.clientId && investment.client?.id !== filters.clientId) {
        return false;
      }

      // Description filter
      if (filters.description) {
        const description = investment.description || '';
        if (!description.toLowerCase().includes(filters.description.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [investments, filters]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedInvestments,
    goToPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({ data: filteredInvestments, itemsPerPage: 10 });

  // Calculate investment statistics from filtered data
  const stats = {
    totalInvestments: filteredInvestments.length,
    totalAmount: filteredInvestments.reduce((sum: number, inv: Transaction) => sum + Number(inv.amount), 0),
    completedInvestments: filteredInvestments.filter((inv: Transaction) => inv.status === 'completed').length,
    pendingInvestments: filteredInvestments.filter((inv: Transaction) => inv.status === 'pending').length,
    uniqueClients: new Set(filteredInvestments.map((inv: Transaction) => inv.client?.id)).size
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleUploadComplete = () => {
    // Refresh the investments data after upload
    queryClient.invalidateQueries({ queryKey: ['/api/transactions', { type: 'investment' }] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    // Force a refetch after a short delay to ensure data is processed
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['/api/transactions', { type: 'investment' }] });
    }, 1000);
    setShowUpload(false);
  };

  const handleExport = () => {
    const csvData = filteredInvestments.map((investment: Transaction) => ({
      Date: format(new Date(investment.processedAt || investment.createdAt), 'yyyy-MM-dd'),
      Client: investment.client?.user 
        ? `${investment.client.user.firstName} ${investment.client.user.lastName}`
        : investment.client?.clientCode || 'Unknown Client',
      Amount: Number(investment.amount),
      Description: investment.description || 'N/A'
    }));
    
    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map((row: any) => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get role-based page title and description
  const getPageInfo = () => {
    const roleName = session?.roleName || session?.role || 'client';
    if (roleName === 'admin' || roleName === 'Admin') {
      return {
        title: 'Investment Management',
        description: 'Monitor and manage all investment transactions across the platform'
      };
    } else if (roleName === 'leader' || roleName === 'Leader') {
      return {
        title: 'Team Investment Overview',
        description: 'Monitor investment transactions for you and your team clients'
      };
    } else {
      return {
        title: 'My Investments',
        description: 'View your investment transaction history'
      };
    }
  };

  const pageInfo = getPageInfo();

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageInfo.title}</h1>
          <p className="text-muted-foreground">{pageInfo.description}</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading investments: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{pageInfo.title}</h1>
        <p className="text-muted-foreground">
          {pageInfo.description}
        </p>
      </div>

      {/* Filters and Upload */}
      <div className="flex justify-between items-end gap-4">
        <div className="flex-1">
          <TransactionFilters
            clients={clients}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        </div>
        {(session?.roleName === 'admin' || session?.roleName === 'Admin' || session?.roleName === 'leader' || session?.roleName === 'Leader') && (
          <Button onClick={() => setShowUpload(!showUpload)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Excel Upload
          </Button>
        )}
      </div>

      {/* Excel Upload Section */}
      {showUpload && (session?.roleName === 'admin' || session?.roleName === 'Admin' || session?.roleName === 'leader' || session?.roleName === 'Leader') && (
        <InvestmentExcelUpload
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Investment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvestments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueClients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Investment Transactions</CardTitle>
            <CardDescription>
              Showing {filteredInvestments.length} of {investments.length} investment transactions
            </CardDescription>
          </div>
          <Button onClick={handleExport} disabled={filteredInvestments.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading investment transactions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Date</th>
                    <th className="text-left p-2 font-medium">Client</th>
                    <th className="text-left p-2 font-medium">Amount</th>
                    <th className="text-left p-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedInvestments as Transaction[]).map((investment) => (
                    <tr key={investment.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {format(new Date(investment.processedAt || investment.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-2">
                        {investment.client?.user 
                          ? `${investment.client.user.firstName} ${investment.client.user.lastName}`
                          : investment.client?.clientCode || 'Unknown Client'
                        }
                      </td>
                      <td className="p-2 font-medium">
                        ₹{Number(investment.amount).toLocaleString()}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {investment.description || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredInvestments.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  {investments.length === 0 
                    ? "No investment transactions found."
                    : "No investment transactions match the current filters."
                  }
                </div>
              )}
            </div>
          )}
          
          {filteredInvestments.length > 0 && (
            <div className="mt-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}