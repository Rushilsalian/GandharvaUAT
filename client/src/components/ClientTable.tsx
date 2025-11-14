import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Eye, Loader2, Plus, Edit } from "lucide-react";
import { ClientDetailsModal } from "./ClientDetailsModal";

interface SyncedClient {
  clientId: number;
  code: string;
  name: string;
  mobile?: string | null;
  email?: string | null;
  dob?: string | null;
  panNo?: string | null;
  aadhaarNo?: string | null;
  branch?: string | null;
  branchId?: number | null;
  address?: string | null;
  city?: string | null;
  pincode?: number | null;
  referenceId?: number | null;
  isActive:
    | {
        type: string;
        data: number[];
      }
    | boolean;
  createdById?: number | null;
  createdByUser?: string | null;
  createdDate: string;
  modifiedById?: number | null;
  modifiedByUser?: string | null;
  modifiedDate?: string | null;
  deletedById?: number | null;
  deletedByUser?: string | null;
  deletedDate?: string | null;
}

export function ClientTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<SyncedClient | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const {
    data: syncedClients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/mst/clients"],
    queryFn: async () => {
      const response = await fetch("/api/mst/clients", {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch synced clients");
      }
      return response.json();
    },
  });

  const filteredClients = syncedClients.filter((client: SyncedClient) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      client.code.toLowerCase().includes(searchLower) ||
      client.name.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.mobile?.includes(searchTerm)
    );
  });

  const totalPages = Math.ceil(filteredClients.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const formatDate = (date: Date | null | string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">
            Error loading clients: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover-elevate">
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>Client Directory</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading clients...</span>
            </div>
          ) : (
           <div className="space-y-4 w-full">
              <div className="overflow-x-auto">
              {/* <ScrollArea className="h-[500px] w-full"> */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[100px]">Actions</TableHead>
                      <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[150px]">Name</TableHead>
                      <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[200px]">Email</TableHead>
                      <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[120px]">Mobile</TableHead>
                      <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[130px]">Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentClients.map((client: SyncedClient) => (
                      <TableRow key={client.clientId}>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedClient(client);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>{client.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.email || "N/A"}
                        </TableCell>
                        <TableCell>{client.mobile || "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(client.createdDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm
                      ? "No clients found matching your search."
                      : "No clients found."}
                  </div>
                )}
              {/* </ScrollArea> */}

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of {filteredClients.length} entries
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isEditModalOpen && selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedClient(null);
          }}
        />
      )}
    </>
  );
}
