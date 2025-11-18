import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, FileText, Download, Upload } from "lucide-react";
import { format, isWithinInterval } from "date-fns";
import { TransactionFilters } from "@/components/TransactionFilters";
import { TransactionExcelUpload } from "@/components/TransactionExcelUpload";
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

export default function ClosurePage() {
  const { session, token } = useAuth();
  const [filters, setFilters] = useState<FilterState>({});
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();

  const { data: closures = [], isLoading, error } = useQuery({
    queryKey: ['/api/transactions', { type: 'closure' }],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?type=closure&_t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch closure transactions');
      }
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    enabled: !!token
  });

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

  const filteredClosures = useMemo(() => {
    return closures.filter((closure: Transaction) => {
      if (filters.dateRange?.from || filters.dateRange?.to) {
        const transactionDate = new Date(closure.processedAt || closure.createdAt);
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

      if (filters.clientId && closure.client?.id !== filters.clientId) {
        return false;
      }

      if (filters.description) {
        const description = closure.description || '';
        if (!description.toLowerCase().includes(filters.description.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [closures, filters]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedClosures,
    goToPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({ data: filteredClosures, itemsPerPage: 10 });

  const stats = {
    totalClosures: filteredClosures.length,
    totalAmount: filteredClosures.reduce((sum: number, c: Transaction) => sum + Number(c.amount), 0),
    completedClosures: filteredClosures.filter((c: Transaction) => c.status === 'completed').length,
    pendingClosures: filteredClosures.filter((c: Transaction) => c.status === 'pending').length,
    uniqueClients: new Set(filteredClosures.map((c: Transaction) => c.client?.id)).size
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/transactions', { type: 'closure' }] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['/api/transactions', { type: 'closure' }] });
    }, 1000);
    setShowUpload(false);
  };

  const handleExport = () => {
    const csvData = filteredClosures.map((closure: Transaction) => ({
      Date: format(new Date(closure.processedAt || closure.createdAt), 'yyyy-MM-dd'),
      Client: closure.client?.user
        ? `${closure.client.user.firstName} ${closure.client.user.lastName}`
        : closure.client?.clientCode || 'Unknown Client',
      Amount: Number(closure.amount),
      Description: closure.description || 'N/A'
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map((row: any) => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `closures_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPageInfo = () => {
    const roleName = session?.roleName || session?.role || 'client';
    if (roleName === 'admin' || roleName === 'Admin') {
      return {
        title: 'Closure Management',
        description: 'Monitor and manage all closure transactions across the platform'
      };
    } else if (roleName === 'leader' || roleName === 'Leader') {
      return {
        title: 'Team Closure Overview',
        description: 'Monitor closure transactions for you and your team clients'
      };
    } else {
      return {
        title: 'My Closures',
        description: 'View your closure transaction history'
      };
    }
  };

  const pageInfo = getPageInfo();

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{pageInfo.title}</h1>
          <p className="text-muted-foreground">{pageInfo.description}</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading closures: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{pageInfo.title}</h1>
        <p className="text-muted-foreground">
          {pageInfo.description}
        </p>
      </div>

      <div className="w-full">
        <TransactionFilters
          clients={clients}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
          excelUploadButton={
            (session?.roleName === 'admin' || session?.roleName === 'Admin' || session?.roleName === 'leader' || session?.roleName === 'Leader') ? (
              <Button onClick={() => setShowUpload(!showUpload)} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Excel Upload
              </Button>
            ) : undefined
          }
        />
      </div>

      {showUpload && (session?.roleName === 'admin' || session?.roleName === 'Admin' || session?.roleName === 'leader' || session?.roleName === 'Leader') && (
        <TransactionExcelUpload
          transactionType="Closure"
          onUploadComplete={handleUploadComplete}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Closures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClosures}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Closure Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueClients}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div>
            <CardTitle>Closure Transactions</CardTitle>
            <CardDescription>
              Showing {filteredClosures.length} of {closures.length} closure transactions
            </CardDescription>
          </div>
          <Button onClick={handleExport} disabled={filteredClosures.length === 0} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading closure transactions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[600px] table-fixed">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[120px]">Date</th>
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[200px]">Client</th>
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[120px]">Amount</th>
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[200px]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedClosures as Transaction[]).map((closure) => (
                    <tr key={closure.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">
                        {format(new Date(closure.processedAt || closure.createdAt), 'MMM dd')}
                      </td>
                      <td className="p-2 text-sm">
                          <div className="truncate">
                        {closure.client?.user
                          ? `${closure.client.user.firstName} ${closure.client.user.lastName}`
                          : closure.client?.clientCode || 'Unknown Client'
                        }
                        </div>
                      </td>
                      <td className="p-2 font-medium text-sm">
                        ₹{Number(closure.amount).toLocaleString()}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground hidden sm:table-cell">
                        {closure.description || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredClosures.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  {closures.length === 0
                    ? "No closure transactions found."
                    : "No closure transactions match the current filters."
                  }
                </div>
              )}
              {filteredClosures.length > 0 && (
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}