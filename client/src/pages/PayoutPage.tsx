import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, FileText, Download, Upload } from "lucide-react";
import { format, isWithinInterval, startOfMonth } from "date-fns";
import { TransactionFilters } from "@/components/TransactionFilters";
import { TransactionExcelUpload } from "@/components/TransactionExcelUpload";
import { PaginationControls } from "@/components/PaginationControls";
import { usePagination } from "@/hooks/usePagination";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

const formatIndianCurrency = (amount: number): string => {
  return amount.toLocaleString('en-IN');
};
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
  const [filters, setFilters] = useState<FilterState>({
      dateRange: {
        from: startOfMonth(new Date()),
        to: new Date(),
      },
    });
  const [isManualDate, setIsManualDate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
  if (isManualDate) return;

  const today = new Date();

  setFilters((prev) => ({
    ...prev,
    dateRange: {
      from: startOfMonth(today),
      to: today,
    },
  }));
}, [isManualDate]);

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

  // Fetch opening payouts based on role
  const { data: openingPayouts = [] } = useQuery({
    queryKey: ['/api/clients/opening-payouts'],
    queryFn: async () => {
      const response = await fetch('/api/clients/opening-payouts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch opening payouts');
      }
      return response.json();
    },
    enabled: !!token
  });

  const filteredPayouts = useMemo(() => {
    if (!payouts || payouts.length === 0) return [];

    return payouts.filter((payout: Transaction) => {
      // Date range filter
      if (filters.dateRange?.from || filters.dateRange?.to) {
        const transactionDate = new Date(payout.processedAt || payout.createdAt);

        // Reset time to start of day for accurate comparison
        const transactionDateOnly = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());

        if (filters.dateRange.from && filters.dateRange.to) {
          const fromDate = new Date(filters.dateRange.from.getFullYear(), filters.dateRange.from.getMonth(), filters.dateRange.from.getDate());
          const toDate = new Date(filters.dateRange.to.getFullYear(), filters.dateRange.to.getMonth(), filters.dateRange.to.getDate());

          if (transactionDateOnly < fromDate || transactionDateOnly > toDate) {
            return false;
          }
        } else if (filters.dateRange.from) {
          const fromDate = new Date(filters.dateRange.from.getFullYear(), filters.dateRange.from.getMonth(), filters.dateRange.from.getDate());
          if (transactionDateOnly < fromDate) return false;
        } else if (filters.dateRange.to) {
          const toDate = new Date(filters.dateRange.to.getFullYear(), filters.dateRange.to.getMonth(), filters.dateRange.to.getDate());
          if (transactionDateOnly > toDate) return false;
        }
      }

      // Client filter
      if (filters.clientId && filters.clientId.trim() !== '') {
        if (!payout.client?.id || String(payout.client.id) !== String(filters.clientId)) {
          return false;
        }
      }

      // Description filter
      if (filters.description && filters.description.trim() !== '') {
        const description = (payout.description || '').toLowerCase();
        const searchTerm = filters.description.toLowerCase().trim();
        if (!description.includes(searchTerm)) {
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

  useEffect(() => {
  if (currentPage > totalPages && totalPages > 0) {
    goToPage(1); // or totalPages
  }
}, [filteredPayouts.length, totalPages, currentPage]);

  // Calculate opening payout total based on role
  const openingPayoutTotal = useMemo(() => {
    return openingPayouts.reduce((sum: number, client: any) => sum + Number(client.opening_payout || 0), 0);
  }, [openingPayouts]);

  const stats = {
    totalPayouts: filteredPayouts.length,
    totalAmount: filteredPayouts.reduce((sum: number, p: Transaction) => sum + Number(p.amount), 0),
    completedPayouts: filteredPayouts.filter((p: Transaction) => p.status === 'completed').length,
    pendingPayouts: filteredPayouts.filter((p: Transaction) => p.status === 'pending').length,
    uniqueClients: new Set(filteredPayouts.map((p: Transaction) => p.client?.id)).size,
    openingPayout: openingPayoutTotal
  };

  const handleFiltersChange = (newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
  setFilters((prev) => {
    const updated =
      typeof newFilters === "function" ? newFilters(prev) : newFilters;

    // 🔥 SAME LOGIC AS OTHER PAGES
    if (updated.dateRange) {
      setIsManualDate(true);
    }

    return updated;
  });
};

    const handleResetFilters = () => {
  const today = new Date();

  setIsManualDate(false);  

  setFilters({
    dateRange: {
      from: startOfMonth(today),
      to: today,
    },
  });
};

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/transactions', { type: 'payout' }] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['/api/transactions', { type: 'payout' }] });
    }, 1000);
    // setShowUpload(false);
  };

  const handleExport = async () => {
    const { utils, writeFile } = await import('xlsx');
    
    const excelData = filteredPayouts.map((payout: Transaction) => ({
      Date: format(new Date(payout.processedAt || payout.createdAt), 'yyyy-MM-dd'),
      Client: payout.client?.user
        ? `${payout.client.user.firstName} ${payout.client.user.lastName}`
        : payout.client?.clientCode || 'Unknown Client',
      Amount: Number(payout.amount),
      Description: payout.description || 'N/A'
    }));

    const worksheet = utils.json_to_sheet(excelData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Payouts');
    
    writeFile(workbook, `payouts_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{pageInfo.title}</h1>
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
          transactionType="Payout"
          onUploadComplete={handleUploadComplete}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opening Payouts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{formatIndianCurrency(stats.openingPayout)}</div>
          </CardContent>
        </Card>
        
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
            <div className="text-2xl font-bold">₹{formatIndianCurrency(stats.totalAmount)}</div>
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
            <CardTitle>Payout Transactions</CardTitle>
            <CardDescription>
              Showing {filteredPayouts.length} of {payouts.length} payout transactions
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">

  {/* DATE RANGE
  <div className="w-full sm:w-auto">
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full sm:w-[250px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {filters.dateRange?.from ? (
            filters.dateRange.to ? (
              <>
                {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                {format(filters.dateRange.to, "LLL dd, y")}
              </>
            ) : (
              format(filters.dateRange.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={filters.dateRange}
          defaultMonth={filters.dateRange?.from}
          onSelect={(range) => {
            if (!range) return;

            setIsManualDate(true);

            setFilters((prev) => ({
              ...prev,
              dateRange: range,
            }));
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  </div> */}

  {/* EXPORT BUTTON */}
  <Button
    onClick={handleExport}
    disabled={filteredPayouts.length === 0}
    className="w-full sm:w-auto"
  >
    <Download className="h-4 w-4 mr-2" />
    Export Excel
  </Button>

</div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading payout transactions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full  min-w-[600px] table-fixed">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[80px]">Date</th>
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[80px]">Client Code</th>
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[120px]">Client</th>
                    <th className="text-right p-2 font-medium whitespace-nowrap w-[120px]">Amount</th>
                    <th className="text-left p-2 font-medium whitespace-nowrap w-[280px]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedPayouts as Transaction[]).map((payout) => (
                    <tr key={payout.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">
                        {format(new Date(payout.processedAt || payout.createdAt), 'MMM dd yyyy')}
                      </td>
                        <td className="p-2 text-sm">
                        {payout.client?.clientCode || 'N/A'}
                      </td>
                      <td className="p-2 text-sm">
                        <div className="truncate">
                          {payout.client?.user
                            ? `${payout.client.user.firstName} ${payout.client.user.lastName}`
                            : payout.client?.clientCode || 'Unknown Client'
                          }
                        </div>
                      </td>
                      <td className="p-2 font-medium text-sm whitespace-nowrap text-right">
                        ₹{formatIndianCurrency(Number(payout.amount))}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground hidden sm:table-cell">
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
            </div>
          )}


        </CardContent>
      </Card>
    </div>
  );
}