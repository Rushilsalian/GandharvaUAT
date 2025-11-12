import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface Client {
  id: string;
  clientCode: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface FilterState {
  dateRange?: DateRange;
  clientId?: string;
  description?: string;
}

interface TransactionFiltersProps {
  clients?: Client[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  hideClientFilter?: boolean; // Hide client filter for client users
}

export function TransactionFilters({ clients = [], filters, onFiltersChange, onReset, hideClientFilter = false }: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    onFiltersChange({ ...filters, dateRange });
  };

  const handleClientChange = (clientId: string) => {
    onFiltersChange({ ...filters, clientId: clientId === "all" ? undefined : clientId });
  };

  const handleDescriptionChange = (description: string) => {
    onFiltersChange({ ...filters, description: description.trim() || undefined });
  };



  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.dateRange?.from || filters.dateRange?.to) count++;
    if (filters.clientId && !hideClientFilter) count++;
    if (filters.description) count++;
    return count;
  };

  const selectedClient = clients.find(c => c.id === filters.clientId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="mr-2">{getActiveFiltersCount()}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {getActiveFiltersCount() > 0 && (
              <Button variant="outline" size="sm" onClick={onReset} data-testid="button-reset-filters" className="px-1 gap-0">
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              data-testid="button-toggle-filters"
            >
              {isOpen ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${hideClientFilter ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-date-range"
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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Client Filter - Hidden for client users */}
            {!hideClientFilter && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                <Select
                  value={filters.clientId || "all"}
                  onValueChange={handleClientChange}
                >
                  <SelectTrigger data-testid="select-client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.user 
                          ? `${client.user.firstName} ${client.user.lastName} (${client.clientCode})`
                          : client.clientCode
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Search description..."
                value={filters.description || ""}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                data-testid="input-description"
              />
            </div>


          </div>

          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {filters.dateRange?.from && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Date: {format(filters.dateRange.from, "MMM dd")}
                  {filters.dateRange.to && ` - ${format(filters.dateRange.to, "MMM dd")}`}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleDateRangeChange(undefined)}
                  />
                </Badge>
              )}
              {selectedClient && !hideClientFilter && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Client: {selectedClient.user 
                    ? `${selectedClient.user.firstName} ${selectedClient.user.lastName}`
                    : selectedClient.clientCode
                  }
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleClientChange("all")}
                  />
                </Badge>
              )}
              {filters.description && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Description: "{filters.description}"
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleDescriptionChange("")}
                  />
                </Badge>
              )}

            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}