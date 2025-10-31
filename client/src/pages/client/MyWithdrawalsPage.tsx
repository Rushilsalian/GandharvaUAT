import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, DollarSign, FileText, Eye } from "lucide-react";
import { format, isWithinInterval } from "date-fns";
import { TransactionFilters } from "@/components/TransactionFilters";
import { DateRange } from "react-day-picker";

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
  description?: string;
  status?: string;
}

interface MyWithdrawalsPageProps {
  clientId: string; // Client ID passed from parent or auth context
}

export default function MyWithdrawalsPage({ clientId }: MyWithdrawalsPageProps) {
  // Filter state
  const [filters, setFilters] = useState<FilterState>({});

  // Fetch this client's withdrawal transactions only
  const { data: withdrawals = [], isLoading, error } = useQuery({
    queryKey: ['/api/clients', clientId, 'transactions', { type: 'withdrawal' }],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/transactions?type=withdrawal`);
      if (!response.ok) {
        throw new Error('Failed to fetch your withdrawal transactions');
      }
      return response.json();
    },
    enabled: !!clientId,
  });

  // Apply filters to withdrawals
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((withdrawal: Transaction) => {
      // Date range filter
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

      // Description filter
      if (filters.description) {
        const description = withdrawal.description || '';
        if (!description.toLowerCase().includes(filters.description.toLowerCase())) {
          return false;
        }
      }

      // Status filter
      if (filters.status && withdrawal.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [withdrawals, filters]);

  // Calculate withdrawal statistics from filtered data
  const stats = {
    totalWithdrawals: filteredWithdrawals.length,
    totalAmount: filteredWithdrawals.reduce((sum: number, w: Transaction) => sum + Number(w.amount), 0),
    completedWithdrawals: filteredWithdrawals.filter((w: Transaction) => w.status === 'completed').length,
    pendingWithdrawals: filteredWithdrawals.filter((w: Transaction) => w.status === 'pending').length,
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Withdrawals</h1>
          <p className="text-muted-foreground">View and track your withdrawal history</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading your withdrawals: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Withdrawals</h1>
        <p className="text-muted-foreground">
          View and track your withdrawal history with advanced filtering
        </p>
      </div>

      {/* Filters - Client filter hidden */}
      <TransactionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        hideClientFilter={true}
      />

      {/* Withdrawal Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-withdrawals">{stats.totalWithdrawals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawal Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-amount">₹{stats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-withdrawals">{stats.completedWithdrawals}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingWithdrawals} pending</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-processing-rate">
              {stats.totalWithdrawals > 0 
                ? Math.round((stats.completedWithdrawals / stats.totalWithdrawals) * 100)
                : 0
              }%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Withdrawal History</CardTitle>
          <CardDescription>
            Showing {filteredWithdrawals.length} of {withdrawals.length} withdrawal transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading your withdrawals...</div>
          ) : (
            <div className="space-y-4">
              {filteredWithdrawals.map((withdrawal: Transaction) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-withdrawal-${withdrawal.id}`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="font-medium" data-testid={`text-amount-${withdrawal.id}`}>
                        ₹{Number(withdrawal.amount).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-date-${withdrawal.id}`}>
                        {format(new Date(withdrawal.processedAt || withdrawal.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium" data-testid={`text-description-${withdrawal.id}`}>
                        {withdrawal.description || 'Withdrawal Transaction'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {withdrawal.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={withdrawal.status === 'completed' ? 'default' : 
                               withdrawal.status === 'pending' ? 'secondary' : 'destructive'}
                      data-testid={`badge-status-${withdrawal.id}`}
                    >
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </Badge>
                    <Button variant="ghost" size="sm" data-testid={`button-view-${withdrawal.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredWithdrawals.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  {withdrawals.length === 0 
                    ? "You haven't made any withdrawal requests yet."
                    : "No withdrawals match the current filters."
                  }
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}