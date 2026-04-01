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
  excelUploadButton?: React.ReactNode; // Excel upload button to show before Show Filters
}

export function TransactionFilters({ clients = [], filters, onFiltersChange, onReset, hideClientFilter = false, excelUploadButton }: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

const handleDateRangeChange = (dateRange: DateRange | undefined) => {
  onFiltersChange({
    ...filters,
    dateRange
  });
};

  const handleClientChange = (clientId: string) => {
  onFiltersChange(prev => {
    const updated = { ...prev };

    if (clientId === "all") {
      delete updated.clientId;   // 🔥 force remove
    } else {
      updated.clientId = clientId;
    }

    return updated;
  });
};

  const handleDescriptionChange = (description: string) => {
    onFiltersChange({ ...filters, description: description.trim() || undefined });
  };



  const getActiveFiltersCount = () => {
    let count = 0;
   // if (filters.dateRange?.from || filters.dateRange?.to) count++;
    if (filters.clientId && !hideClientFilter) count++;
    if (filters.description) count++;
    return count;
  };

  // Sort clients alphabetically and filter by search
  const sortedAndFilteredClients = clients
    .sort((a, b) => {
      const nameA = a.user ? `${a.user.firstName} ${a.user.lastName}` : a.clientCode;
      const nameB = b.user ? `${b.user.firstName} ${b.user.lastName}` : b.clientCode;
      return nameA.localeCompare(nameB);
    })
    .filter(client => {
      if (!clientSearch) return true;
      const searchTerm = clientSearch.toLowerCase();
      const clientName = client.user 
        ? `${client.user.firstName} ${client.user.lastName} ${client.clientCode}`.toLowerCase()
        : client.clientCode.toLowerCase();
      return clientName.includes(searchTerm);
    });

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
          <div className="flex items-center gap-4">
            {excelUploadButton}
            {getActiveFiltersCount() > 0 && (
              <Button variant="outline" size="sm" 
                onClick={() => { 
                setClientSearch("");  
                onFiltersChange({
                  ...filters, // 🔥 KEEP EXISTING (dateRange stays)
                  clientId: undefined,
                  description: undefined
                });
              }} data-testid="button-reset-filters" className="px-1 gap-0">
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
                  mode="range"
                  selected={filters.dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />

                <div className="p-2 border-t flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDateRangeChange(undefined)}
                  >
                    Clear
                  </Button>
                </div>
              </PopoverContent>

              </Popover>
            </div>

            {/* Client Filter - Hidden for client users */}
            {!hideClientFilter && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                <Select
                  key={filters.clientId ?? "all"}
                  value={filters.clientId ?? "all"}
                  onValueChange={handleClientChange}
                >
                  <SelectTrigger data-testid="select-client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search clients..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="h-8"
                        onKeyDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <SelectItem value="all">All Clients</SelectItem>
                    {sortedAndFilteredClients.map((client) => (
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
              {/* {filters.dateRange?.from && (
  <Badge variant="outline" className="flex items-center gap-1">
    Date: {format(filters.dateRange.from, "MMM dd")}
    {filters.dateRange.to && ` - ${format(filters.dateRange.to, "MMM dd")}`}
    <X 
      className="h-3 w-3 ml-1 cursor-pointer" 
      onClick={() => handleDateRangeChange(undefined)}
    />
  </Badge>
)} */}
                {typeof filters.clientId === "string" && !hideClientFilter && (
                    <Badge variant="outline" className="flex items-center gap-1">
                  Client: {
                  clients.find(c => c.id === filters.clientId)?.user
                    ? `${clients.find(c => c.id === filters.clientId)?.user?.firstName} ${clients.find(c => c.id === filters.clientId)?.user?.lastName}`
                    : clients.find(c => c.id === filters.clientId)?.clientCode
                }
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      setClientSearch("");
                      handleClientChange("all");
                    }}
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