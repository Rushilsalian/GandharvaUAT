import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientDetailsModal } from "./ClientDetailsModal";
import { format } from "date-fns";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  exportValue?: (row: any) => string | number;
  exportable?: boolean;
}

interface DataTableProps {
  title: string;
  description?: string;
  columns: Column[];
  data: any[];
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  onViewDetails?: (row: any) => void;
}

// Export function for CSV download
const exportToCSV = (title: string, columns: Column[], data: any[]) => {
  // Filter out non-exportable columns (like actions)
  const exportableColumns = columns.filter(col => col.exportable !== false && col.key !== 'actions');
  
  const headers = exportableColumns.map(col => col.label);
  const csvData = data.map(row => 
    exportableColumns.map(col => {
      // Use custom export value if provided
      if (col.exportValue) {
        return col.exportValue(row);
      }
      
      // Get the raw value
      const value = row[col.key];
      
      // Handle different value types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle dates
      if (value instanceof Date) {
        return format(value, 'yyyy-MM-dd');
      }
      
      // Handle numbers (preserve formatting)
      if (typeof value === 'number') {
        return value;
      }
      
      // Convert everything else to string
      return String(value);
    })
  );

  const csvContent = [headers, ...csvData].map(row => 
    row.map((field: any) => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export function DataTable({ 
  title, 
  description, 
  columns, 
  data, 
  searchable = true,
  filterable = false,
  exportable = false,
  onViewDetails 
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValue, setFilterValue] = useState("");

  const filteredData = (data || []).filter(row => {
    const matchesSearch = !searchTerm || Object.values(row).some(value => {
      if (value && typeof value === 'object') {
        return Object.values(value).some(nestedValue => 
          String(nestedValue).toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
    const matchesFilter = !filterValue || filterValue === "all" || row.status === filterValue;
    return matchesSearch && matchesFilter;
  });

  return (
    <Card className="hover-elevate">
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            {exportable && (
              <Button 
                variant="outline" 
                size="sm" 
                data-testid="button-export"
                onClick={() => exportToCSV(title, columns, filteredData)}
                disabled={filteredData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
        
        {(searchable || filterable) && (
          <div className="flex gap-2 mt-4">
            {searchable && (
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search"
                />
              </div>
            )}
            {filterable && (
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger className="w-48" data-testid="select-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th key={column.key} className="text-left p-2 font-medium text-muted-foreground">
                    {column.label}
                  </th>
                ))}
                {onViewDetails && (
                  <th className="text-left p-2 font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={row.id || index} className="border-b hover-elevate">
                  {columns.map((column) => (
                    <td key={column.key} className="p-2" data-testid={`cell-${column.key}-${index}`}>
                      {column.render ? column.render(row[column.key], row) : (row[column.key] || "-")}
                    </td>
                  ))}
                  {onViewDetails && (
                    <td className="p-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-view-${index}`}
                        onClick={() => onViewDetails(row)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No data found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized tables for different data types
export function TransactionTable({ transactions }: { transactions: any[] }) {
  const columns: Column[] = [
    { key: "date", label: "Date" },
    { key: "clientName", label: "Client" },
    { 
      key: "type", 
      label: "Type", 
      render: (value) => (
        <Badge variant={value === "investment" ? "default" : value === "payout" ? "secondary" : "outline"}>
          {value}
        </Badge>
      ),
      exportValue: (row) => row.type
    },
    { 
      key: "amount", 
      label: "Amount", 
      render: (value) => `₹${value.toLocaleString()}`,
      exportValue: (row) => row.amount
    },
    { 
      key: "status", 
      label: "Status", 
      render: (value) => (
        <Badge variant={value === "completed" ? "default" : value === "pending" ? "secondary" : "destructive"}>
          {value}
        </Badge>
      ),
      exportValue: (row) => row.status
    }
  ];

  return (
    <DataTable
      title="Recent Transactions"
      description="Latest investment and payout activities"
      columns={columns}
      data={transactions}
      searchable={true}
      filterable={true}
      exportable={true}
    />
  );
}

export function ClientTable({ clients }: { clients: any[] }) {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleViewDetails = (client: any) => {
    setSelectedClient(client);
    setShowDetails(true);
  };

  const columns: Column[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "mobile", label: "Mobile" },
    { key: "branch", label: "Branch" },
    { 
      key: "totalInvestment", 
      label: "Investment", 
      render: (value) => `₹${value.toLocaleString()}`,
      exportValue: (row) => row.totalInvestment
    },
    { key: "joinDate", label: "Joined" }
  ];

  return (
    <>
      <DataTable
        title="Client Directory"
        description="Manage client information and portfolios"
        columns={columns}
        data={clients}
        searchable={true}
        exportable={true}
        onViewDetails={handleViewDetails}
      />
      <ClientDetailsModal
        client={selectedClient}
        open={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
}