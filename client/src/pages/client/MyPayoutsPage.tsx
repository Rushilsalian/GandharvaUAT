import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, FileText, Eye } from "lucide-react";
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

interface MyPayoutsPageProps {
  clientId: string;
}

export default function MyPayoutsPage({ clientId }: MyPayoutsPageProps) {
  const [filters, setFilters] = useState<FilterState>({});

  const { data: payouts = [], isLoading, error } = useQuery({
    queryKey: ['/api/clients', clientId, 'transactions', { type: 'payout' }],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/transactions?type=payout`);
      if (!response.ok) {
        throw new Error('Failed to fetch your payout transactions');
      }
      return response.json();
    },
    enabled: !!clientId,
  });

  const filteredPayouts = useMemo(() => {
    return payouts.filter((payout: Transaction) => {
      // Date range filter
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

      if (filters.description) {
        const description = payout.description || '';
        if (!description.toLowerCase().includes(filters.description.toLowerCase())) {
          return false;
        }
      }

      if (filters.status && payout.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [payouts, filters]);

  const stats = {
    totalPayouts: filteredPayouts.length,
    totalAmount: filteredPayouts.reduce((sum: number, payout: Transaction) => sum + Number(payout.amount), 0),
    completedPayouts: filteredPayouts.filter((payout: Transaction) => payout.status === 'completed').length,
    pendingPayouts: filteredPayouts.filter((payout: Transaction) => payout.status === 'pending').length,
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
          <h1 className="text-3xl font-bold tracking-tight">My Payouts</h1>
          <p className="text-muted-foreground">View and track your payout history</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading your payouts: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Payouts</h1>
        <p className="text-muted-foreground">
          View and track your payout history with advanced filtering
        </p>
      </div>

      <TransactionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        hideClientFilter={true}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-payouts">{stats.totalPayouts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-amount">₹{stats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-payouts">{stats.completedPayouts}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingPayouts} pending</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-earnings-rate">
              {stats.totalPayouts > 0 
                ? Math.round((stats.completedPayouts / stats.totalPayouts) * 100)
                : 0
              }%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Payout History</CardTitle>
          <CardDescription>
            Showing {filteredPayouts.length} of {payouts.length} payout transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading your payouts...</div>
          ) : (
            <div className="space-y-4">
              {filteredPayouts.map((payout: Transaction) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-payout-${payout.id}`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="font-medium" data-testid={`text-amount-${payout.id}`}>
                        ₹{Number(payout.amount).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-date-${payout.id}`}>
                        {format(new Date(payout.processedAt || payout.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium" data-testid={`text-description-${payout.id}`}>
                        {payout.description || 'Payout Transaction'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {payout.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={payout.status === 'completed' ? 'default' : 
                               payout.status === 'pending' ? 'secondary' : 'destructive'}
                      data-testid={`badge-status-${payout.id}`}
                    >
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </Badge>
                    <Button variant="ghost" size="sm" data-testid={`button-view-${payout.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredPayouts.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  {payouts.length === 0 
                    ? "You haven't received any payouts yet."
                    : "No payouts match the current filters."
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