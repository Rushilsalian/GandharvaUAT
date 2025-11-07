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

export default function PayoutPage() {
  const { session, token } = useAuth();
  const [filters, setFilters] = useState<FilterState>({});
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();

  const { data: payouts = [], isLoading, error } = useQuery({
    queryKey: ['/api/transactions', { type: 'payout' }],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?type=payout&_t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch payout transactions');
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

  const filteredPayouts = useMemo(() => {
    return payouts.filter((payout: Transaction) => {
      if (filters.dateRange?.from || filters.dateRange?.to) {
        const transactionDate = new Date(payout.processedAt || payout.createdAt);
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

      if (filters.clientId && payout.client?.id !== filters.clientId) {
        return false;
      }

      if (filters.description) {
        const description = payout.description || '';
        if (!description.toLowerCase().includes(filters.description.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [payouts, filters]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedPayouts,
    goToPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({ data: filteredPayouts, itemsPerPage: 10 });

  const stats = {
    totalPayouts: filteredPayouts.length,
    totalAmount: filteredPayouts.reduce((sum: number, p: Transaction) => sum + Number(p.amount), 0),
    completedPayouts: filteredPayouts.filter((p: Transaction) => p.status === 'completed').length,
    pendingPayouts: filteredPayouts.filter((p: Transaction) => p.status === 'pending').length,
    uniqueClients: new Set(filteredPayouts.map((p: Transaction) => p.client?.id)).size
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/transactions', { type: 'payout' }] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['/api/transactions', { type: 'payout' }] });
    }, 1000);
    setShowUpload(false);
  };

  const handleExport = () => {
    const csvData = filteredPayouts.map((payout: Transaction) => ({
      Date: format(new Date(payout.processedAt || payout.createdAt), 'yyyy-MM-dd'),
      Client: payout.client?.user 
        ? `${payout.client.user.firstName} ${payout.client.user.lastName}`
        : payout.client?.clientCode || 'Unknown Client',
      Amount: Number(payout.amount),
      Description: payout.description || 'N/A'
    }));
    
    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map((row: any) => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPageInfo = () => {
    const roleName = session?.roleName || session?.role || 'client';
    if (roleName === 'admin' || roleName === 'Admin') {
      return {
        title: 'Payout Management',
        description: 'Monitor and manage all payout transactions across the platform'
      };
    } else if (roleName === 'leader' || roleName === 'Leader') {
      return {
        title: 'Team Payout Overview',
        description: 'Monitor payout transactions for you and your team clients'
      };
    } else {
      return {
        title: 'My Payouts',
        description: 'View your payout transaction history'
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
            <p className="text-red-600">Error loading payouts: {(error as Error).message}</p>
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

      {showUpload && (session?.roleName === 'admin' || session?.roleName === 'Admin' || session?.roleName === 'leader' || session?.roleName === 'Leader') && (
        <TransactionExcelUpload
          transactionType="Payout"
          onUploadComplete={handleUploadComplete}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayouts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout Amount</CardTitle>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payout Transactions</CardTitle>
            <CardDescription>
              Showing {filteredPayouts.length} of {payouts.length} payout transactions
            </CardDescription>
          </div>
          <Button onClick={handleExport} disabled={filteredPayouts.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading payout transactions...</p>
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
                  {(paginatedPayouts as Transaction[]).map((payout) => (
                    <tr key={payout.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {format(new Date(payout.processedAt || payout.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-2">
                        {payout.client?.user 
                          ? `${payout.client.user.firstName} ${payout.client.user.lastName}`
                          : payout.client?.clientCode || 'Unknown Client'
                        }
                      </td>
                      <td className="p-2 font-medium">
                        ₹{Number(payout.amount).toLocaleString()}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {payout.description || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredPayouts.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  {payouts.length === 0 
                    ? "No payout transactions found."
                    : "No payout transactions match the current filters."
                  }
                </div>
              )}
            </div>
          )}
          
          {filteredPayouts.length > 0 && (
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