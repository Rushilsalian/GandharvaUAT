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

export default function WithdrawalPage() {
  const { session, token } = useAuth();
  const [filters, setFilters] = useState<FilterState>({});
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();

  const { data: withdrawals = [], isLoading, error } = useQuery({
    queryKey: ['/api/transactions', { type: 'withdrawal' }],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?type=withdrawal&_t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch withdrawal transactions');
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

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((withdrawal: Transaction) => {
      if (filters.dateRange?.from || filters.dateRange?.to) {
        const transactionDate = new Date(withdrawal.processedAt || withdrawal.createdAt);
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

      if (filters.clientId && withdrawal.client?.id !== filters.clientId) {
        return false;
      }

      if (filters.description) {
        const description = withdrawal.description || '';
        if (!description.toLowerCase().includes(filters.description.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [withdrawals, filters]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedWithdrawals,
    goToPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({ data: filteredWithdrawals, itemsPerPage: 10 });

  const stats = {
    totalWithdrawals: filteredWithdrawals.length,
    totalAmount: filteredWithdrawals.reduce((sum: number, w: Transaction) => sum + Number(w.amount), 0),
    completedWithdrawals: filteredWithdrawals.filter((w: Transaction) => w.status === 'completed').length,
    pendingWithdrawals: filteredWithdrawals.filter((w: Transaction) => w.status === 'pending').length,
    uniqueClients: new Set(filteredWithdrawals.map((w: Transaction) => w.client?.id)).size
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/transactions', { type: 'withdrawal' }] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['/api/transactions', { type: 'withdrawal' }] });
    }, 1000);
    setShowUpload(false);
  };

  const handleExport = async () => {
    const { utils, writeFile } = await import('xlsx');
    
    const excelData = filteredWithdrawals.map((withdrawal: Transaction) => ({
      Date: format(new Date(withdrawal.processedAt || withdrawal.createdAt), 'yyyy-MM-dd'),
      Client: withdrawal.client?.user 
        ? `${withdrawal.client.user.firstName} ${withdrawal.client.user.lastName}`
        : withdrawal.client?.clientCode || 'Unknown Client',
      Amount: Number(withdrawal.amount),
      Description: withdrawal.description || 'N/A'
    }));

    const worksheet = utils.json_to_sheet(excelData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Withdrawals');
    
    writeFile(workbook, `withdrawals_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const getPageInfo = () => {
    const roleName = session?.roleName || session?.role || 'client';
    if (roleName === 'admin' || roleName === 'Admin') {
      return {
        title: 'Withdrawal Management',
        description: 'Monitor and manage all withdrawal transactions across the platform'
      };
    } else if (roleName === 'leader' || roleName === 'Leader') {
      return {
        title: 'Team Withdrawal Overview',
        description: 'Monitor withdrawal transactions for you and your team clients'
      };
    } else {
      return {
        title: 'My Withdrawals',
        description: 'View your withdrawal transaction history'
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
            <p className="text-red-600">Error loading withdrawals: {(error as Error).message}</p>
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
                File Upload
              </Button>
            ) : undefined
          }
        />
      </div>

      {showUpload && (session?.roleName === 'admin' || session?.roleName === 'Admin' || session?.roleName === 'leader' || session?.roleName === 'Leader') && (
        <TransactionExcelUpload
          transactionType="Withdrawal"
          onUploadComplete={handleUploadComplete}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWithdrawals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawal Amount</CardTitle>
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
            <CardTitle>Withdrawal Transactions</CardTitle>
            <CardDescription>
              Showing {filteredWithdrawals.length} of {withdrawals.length} withdrawal transactions
            </CardDescription>
          </div>
          <Button onClick={handleExport} disabled={filteredWithdrawals.length === 0} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading withdrawal transactions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[600px] table-fixed">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[120px]">Date</th>
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[150px]">Client</th>
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[120px]">Amount</th>
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[200px]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedWithdrawals as Transaction[]).map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">
                        {format(new Date(withdrawal.processedAt || withdrawal.createdAt), 'MMM dd yyyy')}
                      </td>
                      <td className="p-2 text-sm">
                        <div className="truncate">
                        {withdrawal.client?.user 
                          ? `${withdrawal.client.user.firstName} ${withdrawal.client.user.lastName}`
                          : withdrawal.client?.clientCode || 'Unknown Client'
                        }
                        </div>
                      </td>
                      <td className="p-2 font-medium text-sm">
                        ₹{Number(withdrawal.amount).toLocaleString()}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground hidden sm:table-cell">
                        {withdrawal.description || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredWithdrawals.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  {withdrawals.length === 0 
                    ? "No withdrawal transactions found."
                    : "No withdrawal transactions match the current filters."
                  }
                </div>
              )}
              {filteredWithdrawals.length > 0 && (
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