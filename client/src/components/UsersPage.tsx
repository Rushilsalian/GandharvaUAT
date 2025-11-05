import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, UserCheck, Loader2, Edit, Search } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  mobile?: string | null;
  firstName: string;
  lastName: string;
  role: string;
  branchId?: string | null;
  isActive?: boolean | null;
  createdAt: Date | null;
}

export function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [password, setPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Fetch users from API
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });

  // Filter only active users and apply search
  const filteredUsers = users.filter((user: User) => {
    if (!user.isActive) return false;
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.mobile?.includes(searchTerm) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      resetForm();
    },
    onError: (error: Error) => {
      alert(error.message);
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...userData }: any) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      resetForm();
    },
    onError: (error: Error) => {
      alert(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userData = {
      ...formData,
      password: password || 'defaultpass123'
    };
    
    if (isEditing && formData.id) {
      updateUserMutation.mutate({ id: formData.id, ...userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const resetForm = () => {
    setFormData({});
    setPassword("");
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const handleEdit = (user: User) => {
    setFormData(user);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:justify-between md:items-center">
        <div>
          <h1 className="md:text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage active user accounts across the platform
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="mt-2" onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2 " />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                {isEditing ? 'Edit User' : 'Add New User'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ""}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ""}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userMobile">Mobile Number</Label>
                <Input
                  id="userMobile"
                  value={formData.mobile || ""}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userPassword">Password {!isEditing && '*'}</Label>
                <Input
                  id="userPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isEditing}
                  placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userRole">Role *</Label>
                <Select 
                  value={formData.role || ""} 
                  onValueChange={(value) => setFormData({...formData, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="leader">Leader</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                >
                  {(createUserMutation.isPending || updateUserMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {isEditing ? 'Update User' : 'Add User'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Users List */}
      <Card className="hover-elevate">
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Directory ({filteredUsers.length})
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Error loading users: {(error as Error).message}
            </div>
          ) : (
            <div className="space-y-4">
              <ScrollArea className="h-[500px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Actions</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>{user.firstName} {user.lastName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>{user.mobile || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : user.role === "leader" ? "secondary" : "outline"}>
                            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }) : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm
                      ? "No users found matching your search."
                      : "No users found."}
                  </div>
                )}
              </ScrollArea>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} entries
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}