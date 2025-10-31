import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileX, DollarSign, FileText, Eye } from "lucide-react";
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

interface MyClosuresPageProps {
  clientId: string;
}

export default function MyClosuresPage({ clientId }: MyClosuresPageProps) {
  const [filters, setFilters] = useState<FilterState>({});

  const { data: closures = [], isLoading, error } = useQuery({
    queryKey: ['/api/clients', clientId, 'transactions', { type: 'closure' }],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/transactions?type=closure`);
      if (!response.ok) {
        throw new Error('Failed to fetch your closure transactions');
      }
      return response.json();
    },
    enabled: !!clientId,
  });

  const filteredClosures = useMemo(() => {
    return closures.filter((closure: Transaction) => {
      // Date range filter
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

      if (filters.description) {
        const description = closure.description || '';
        if (!description.toLowerCase().includes(filters.description.toLowerCase())) {
          return false;
        }
      }

      if (filters.status && closure.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [closures, filters]);

  const stats = {
    totalClosures: filteredClosures.length,
    totalAmount: filteredClosures.reduce((sum: number, closure: Transaction) => sum + Number(closure.amount), 0),
    completedClosures: filteredClosures.filter((closure: Transaction) => closure.status === 'completed').length,
    pendingClosures: filteredClosures.filter((closure: Transaction) => closure.status === 'pending').length,
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
          <h1 className="text-3xl font-bold tracking-tight">My Account Closures</h1>
          <p className="text-muted-foreground">View and track your account closure history</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading your closures: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Account Closures</h1>
        <p className="text-muted-foreground">
          View and track your account closure history with advanced filtering
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
            <CardTitle className="text-sm font-medium">Total Closures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-closures">{stats.totalClosures}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Closure Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-amount">₹{stats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-closures">{stats.completedClosures}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingClosures} pending</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closure Rate</CardTitle>
            <FileX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-closure-rate">
              {stats.totalClosures > 0 
                ? Math.round((stats.completedClosures / stats.totalClosures) * 100)
                : 0
              }%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Account Closure History</CardTitle>
          <CardDescription>
            Showing {filteredClosures.length} of {closures.length} closure transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading your closures...</div>
          ) : (
            <div className="space-y-4">
              {filteredClosures.map((closure: Transaction) => (
                <div key={closure.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-closure-${closure.id}`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="font-medium" data-testid={`text-amount-${closure.id}`}>
                        ₹{Number(closure.amount).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-date-${closure.id}`}>
                        {format(new Date(closure.processedAt || closure.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium" data-testid={`text-description-${closure.id}`}>
                        {closure.description || 'Account Closure'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {closure.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={closure.status === 'completed' ? 'default' : 
                               closure.status === 'pending' ? 'secondary' : 'destructive'}
                      data-testid={`badge-status-${closure.id}`}
                    >
                      {closure.status.charAt(0).toUpperCase() + closure.status.slice(1)}
                    </Badge>
                    <Button variant="ghost" size="sm" data-testid={`button-view-${closure.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredClosures.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  {closures.length === 0 
                    ? "You haven't closed any accounts yet."
                    : "No closures match the current filters."
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