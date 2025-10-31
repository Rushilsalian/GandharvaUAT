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

interface MyInvestmentsPageProps {
  clientId: string; // Client ID passed from parent or auth context
}

export default function MyInvestmentsPage({ clientId }: MyInvestmentsPageProps) {
  // Filter state (no clientId filter needed since we only show this client's data)
  const [filters, setFilters] = useState<FilterState>({});

  // Fetch this client's investment transactions only
  const { data: investments = [], isLoading, error } = useQuery({
    queryKey: ['/api/clients', clientId, 'transactions', { type: 'investment' }],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/transactions?type=investment`);
      if (!response.ok) {
        throw new Error('Failed to fetch your investment transactions');
      }
      return response.json();
    },
    enabled: !!clientId, // Only run query if clientId is available
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

      // Description filter
      if (filters.description) {
        const description = investment.description || '';
        if (!description.toLowerCase().includes(filters.description.toLowerCase())) {
          return false;
        }
      }

      // Status filter
      if (filters.status && investment.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [investments, filters]);

  // Calculate investment statistics from filtered data
  const stats = {
    totalInvestments: filteredInvestments.length,
    totalAmount: filteredInvestments.reduce((sum: number, investment: Transaction) => sum + Number(investment.amount), 0),
    completedInvestments: filteredInvestments.filter((investment: Transaction) => investment.status === 'completed').length,
    pendingInvestments: filteredInvestments.filter((investment: Transaction) => investment.status === 'pending').length,
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
          <h1 className="text-3xl font-bold tracking-tight">My Investments</h1>
          <p className="text-muted-foreground">View and track your investment history</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading your investments: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Investments</h1>
        <p className="text-muted-foreground">
          View and track your investment history with advanced filtering
        </p>
      </div>

      {/* Filters - Client filter hidden */}
      <TransactionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        hideClientFilter={true}
      />

      {/* Investment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-investments">{stats.totalInvestments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment Amount</CardTitle>
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
            <div className="text-2xl font-bold" data-testid="text-completed-investments">{stats.completedInvestments}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingInvestments} pending</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-success-rate">
              {stats.totalInvestments > 0 
                ? Math.round((stats.completedInvestments / stats.totalInvestments) * 100)
                : 0
              }%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Investment History</CardTitle>
          <CardDescription>
            Showing {filteredInvestments.length} of {investments.length} investment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading your investments...</div>
          ) : (
            <div className="space-y-4">
              {filteredInvestments.map((investment: Transaction) => (
                <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-investment-${investment.id}`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="font-medium" data-testid={`text-amount-${investment.id}`}>
                        ₹{Number(investment.amount).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-date-${investment.id}`}>
                        {format(new Date(investment.processedAt || investment.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium" data-testid={`text-description-${investment.id}`}>
                        {investment.description || 'Investment Transaction'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {investment.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={investment.status === 'completed' ? 'default' : 
                               investment.status === 'pending' ? 'secondary' : 'destructive'}
                      data-testid={`badge-status-${investment.id}`}
                    >
                      {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                    </Badge>
                    <Button variant="ghost" size="sm" data-testid={`button-view-${investment.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredInvestments.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  {investments.length === 0 
                    ? "You haven't made any investments yet."
                    : "No investments match the current filters."
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