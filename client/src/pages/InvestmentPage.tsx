import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo ,useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Users, FileText, Eye, Download, Upload } from "lucide-react";
import { format, isWithinInterval,startOfMonth } from "date-fns";
import { TransactionFilters } from "@/components/TransactionFilters";
import { InvestmentExcelUpload } from "@/components/InvestmentExcelUpload";
import { PaginationControls } from "@/components/PaginationControls";
import { usePagination } from "@/hooks/usePagination";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
 
// Utility function to format numbers in Indian lakh format
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

export default function InvestmentPage() {
  const { session, token } = useAuth();
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
  dateRange: {
    from: startOfMonth(new Date()),
    to: new Date(),
  },
});
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();
  const [isManualDate, setIsManualDate] = useState(false);

 useEffect(() => {
  if (isManualDate) return; // 🔥 DO NOT override user selection

  const today = new Date();

  setFilters((prev) => ({
    ...prev,
    dateRange: {
      from: startOfMonth(today),
      to: today,
    },
  }));
}, [isManualDate]);


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

  // Fetch opening investments based on role
  const { data: openingInvestments = [] } = useQuery({
    queryKey: ['/api/clients/opening-investments'],
    queryFn: async () => {
      const response = await fetch('/api/clients/opening-investments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch opening investments');
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

    useEffect(() => {
  if (currentPage > totalPages && totalPages > 0) {
    goToPage(1); // or totalPages (both fine)
  }
}, [filteredInvestments.length, totalPages, currentPage]);

  // Calculate opening investment total based on role
  const openingInvestmentTotal = useMemo(() => {
    return openingInvestments.reduce((sum: number, client: any) => sum + Number(client.opening_investment || 0), 0);
  }, [openingInvestments]);

  // Calculate investment statistics from filtered data
  const stats = {
    totalInvestments: filteredInvestments.length,
    totalAmount: filteredInvestments.reduce((sum: number, inv: Transaction) => sum + Number(inv.amount), 0),
    completedInvestments: filteredInvestments.filter((inv: Transaction) => inv.status === 'completed').length,
    pendingInvestments: filteredInvestments.filter((inv: Transaction) => inv.status === 'pending').length,
    uniqueClients: new Set(filteredInvestments.map((inv: Transaction) => inv.client?.id)).size,
    openingInvestment: openingInvestmentTotal
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
  const today = new Date();

  setFilters({
    dateRange: {
      from: startOfMonth(today),
      to: today,
    },
  });
};

  const handleUploadComplete = () => {
    console.log('=== UPLOAD COMPLETE CALLBACK TRIGGERED ===');
    // Refresh the investments data after upload
    queryClient.invalidateQueries({ queryKey: ['/api/transactions', { type: 'investment' }] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    // Force a refetch after a short delay to ensure data is processed
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['/api/transactions', { type: 'investment' }] });
    }, 1000);
    // Don't automatically hide upload section - let user see the results
    // setShowUpload(false);
  };

  const handleExport = async () => {
    const { utils, writeFile } = await import('xlsx');
    
    const excelData = filteredInvestments.map((investment: Transaction) => ({
      Date: format(new Date(investment.processedAt || investment.createdAt), 'yyyy-MM-dd'),
      Client: investment.client?.user
        ? `${investment.client.user.firstName} ${investment.client.user.lastName}`
        : investment.client?.clientCode || 'Unknown Client',
      Amount: Number(investment.amount),
      Description: investment.description || 'N/A'
    }));

    const worksheet = utils.json_to_sheet(excelData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Investments');
    
    writeFile(workbook, `investments_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{pageInfo.title}</h1>
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
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{pageInfo.title}</h1>
        <p className="text-muted-foreground">
          {pageInfo.description}
        </p>
      </div>

      {/* Filters */}
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

      {/* Excel Upload Section */}
      {showUpload && (session?.roleName === 'admin' || session?.roleName === 'Admin' || session?.roleName === 'leader' || session?.roleName === 'Leader') && (
        <InvestmentExcelUpload
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Investment Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opening Investments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{formatIndianCurrency(stats.openingInvestment)}</div>
          </CardContent>
        </Card>
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
            <div className="text-2xl font-bold">₹{formatIndianCurrency(stats.totalAmount)}</div>
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
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div>
  <CardTitle>Investment Transactions</CardTitle>
  <CardDescription>
    Showing {filteredInvestments.length} of {investments.length} investment transactions
  </CardDescription>
</div>

<div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">

  {/* DATE RANGE PICKER */}
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
          initialFocus
          mode="range"
          defaultMonth={filters.dateRange?.from}
          selected={filters.dateRange}
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
  </div>

  {/* EXPORT BUTTON */}
  <Button
    onClick={handleExport}
    disabled={filteredInvestments.length === 0}
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
              <p>Loading investment transactions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[600px] table-fixed">
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
                  {(paginatedInvestments as Transaction[]).map((investment) => (
                    <tr key={investment.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 whitespace-nowrap text-sm">
                        {format(new Date(investment.processedAt || investment.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-2 text-sm">
                        {investment.client?.clientCode || 'N/A'}
                      </td>
                      <td className="p-2 text-sm">
                        <div className="truncate">
                          {investment.client?.user
                            ? `${investment.client.user.firstName} ${investment.client.user.lastName}`
                            : investment.client?.clientCode || 'Unknown Client'
                          }
                        </div>
                      </td>
                      <td className="p-2 font-medium text-sm whitespace-nowrap text-right">
                        ₹{formatIndianCurrency(Number(investment.amount))}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground hidden sm:table-cell">
                        {/* <div className="max-w-[280px] truncate"> */}
                          {investment.description || 'N/A'}
                        {/* </div> */}
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
            </div>
          )}


        </CardContent>
      </Card>
    </div>
  );
}