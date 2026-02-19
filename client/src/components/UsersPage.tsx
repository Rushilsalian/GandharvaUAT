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
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, UserCheck, Loader2, Edit, Search, Eye, EyeOff, Lock } from "lucide-react";
import { UserDetailsModal } from "./UserDetailsModal";
import { queryClient } from "@/lib/queryClient";

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim());
};

const validateMobile = (mobile: string): boolean => {
  return /^[6-9]\d{9}$/.test(mobile);
};

interface User {
  id: string;
  email: string;
  mobile?: string | null;
  firstName: string;
  lastName: string;
  role: string;
  password?: string | null;
  branchId?: string | null;
  isActive?: boolean | null;
  createdAt: Date | null;
}

interface UserFormData extends Partial<User> {
  password?: string;
}

export function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({});
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState<{email?: string; mobile?: string}>({});
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
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

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

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
      // Check if error is about mobile or email and set appropriate field
      if (error.message.toLowerCase().includes('mobile')) {
        setErrors({ ...errors, mobile: error.message });
      } else {
        setErrors({ ...errors, email: error.message });
      }
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
      // Check if error is about mobile or email and set appropriate field
      if (error.message.toLowerCase().includes('mobile')) {
        setErrors({ ...errors, mobile: error.message });
      } else {
        setErrors({ ...errors, email: error.message });
      }
    }
  });

  // Hash password function
  const hashPassword = (password: string): string => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: {email?: string; mobile?: string} = {};
    
    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    if (formData.mobile && !validateMobile(formData.mobile)) {
      newErrors.mobile = 'Mobile must be 10 digits starting with 6-9';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const userData: UserFormData = { ...formData };
    
    // Only include password if it's provided
    if (password) {
      userData.password = hashPassword(password);
    } else if (!isEditing) {
      // For new users, set default password if none provided
      userData.password = hashPassword('defaultpass123');
    }

    if (isEditing && formData.id) {
      updateUserMutation.mutate({ id: formData.id, ...userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const resetForm = () => {
    setFormData({});
    setPassword("");
    setShowPassword(false);
    setErrors({});
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  // Check if email exists
  const checkEmailExists = async (email: string) => {
    try {
      const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        console.error('Email check failed:', response.status, response.statusText);
        return false; // Assume email doesn't exist if check fails
      }
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false; // Assume email doesn't exist if check fails
    }
  };

  // Check if mobile exists
  const checkMobileExists = async (mobile: string) => {
    try {
      const response = await fetch(`/api/users/check-mobile?mobile=${encodeURIComponent(mobile)}`);
      if (!response.ok) {
        console.error('Mobile check failed:', response.status, response.statusText);
        return false;
      }
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking mobile:', error);
      return false;
    }
  };

  const handleMobileBlur = async () => {
    if (!formData.mobile) return;
    
    if (!validateMobile(formData.mobile)) {
      setErrors({ ...errors, mobile: 'Mobile must be 10 digits starting with 6-9' });
      return;
    }

    // Skip check if editing and mobile hasn't changed
    if (isEditing && users.find((u: User) => u.id === formData.id)?.mobile === formData.mobile) {
      return;
    }

    setIsCheckingMobile(true);
    const exists = await checkMobileExists(formData.mobile);
    setIsCheckingMobile(false);

    if (exists) {
      setErrors({ ...errors, mobile: 'Mobile number already exists' });
    }
  };

  const handleEmailBlur = async () => {
    if (!formData.email || !validateEmail(formData.email)) {
      setErrors({ ...errors, email: 'Invalid email format' });
      return;
    }

    // Skip check if editing and email hasn't changed
    if (isEditing && users.find((u: User) => u.id === formData.id)?.email === formData.email) {
      return;
    }

    setIsCheckingEmail(true);
    const exists = await checkEmailExists(formData.email);
    setIsCheckingEmail(false);

    if (exists) {
      setErrors({ ...errors, email: 'Email already exists' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">User Management</h1>
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
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.firstName || ""}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  onBlur={handleEmailBlur}
                  className={errors.email ? "border-red-500" : ""}
                  disabled={isCheckingEmail}
                  required
                />
                {isCheckingEmail && <p className="text-sm text-blue-500">Checking email...</p>}
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="userMobile">Mobile Number</Label>
                <Input
                  id="userMobile"
                  value={formData.mobile || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, mobile: value });
                    if (errors.mobile) setErrors({ ...errors, mobile: undefined });
                  }}
                  onBlur={handleMobileBlur}
                  className={errors.mobile ? "border-red-500" : ""}
                  disabled={isCheckingMobile}
                  placeholder="10 digits starting with 6-9"
                  maxLength={10}
                />
                {isCheckingMobile && <p className="text-sm text-blue-500">Checking mobile...</p>}
                {errors.mobile && <p className="text-sm text-red-500">{errors.mobile}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="userPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password {!isEditing && '*'}
                </Label>
                <div className="relative">
                  <Input
                    id="userPassword"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isEditing}
                    placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userRole">Role *</Label>
                <Select
                  value={formData.role || ""}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
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
            <div className="space-y-4 w-full">
              <div className="overflow-x-auto">
                {/* <ScrollArea className="h-[550px] w-full"> */}
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[100px]">Actions</TableHead>
                        <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[150px]">Name</TableHead>
                        <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[200px]">Email</TableHead>
                        <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[120px]">Mobile</TableHead>
                        <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[180px]">Password</TableHead>
                        <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[100px]">Role</TableHead>
                        <TableHead className="text-left p-2 font-medium whitespace-nowrap w-[160px]">Created Date & Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentUsers.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Button
                              className="icon-border"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="truncate max-w-[180px]">
                              {user.firstName?.charAt(0).toUpperCase() + user.firstName?.slice(1)}{user.lastName && user.lastName.trim() ? ` ${user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1)}` : ''}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="truncate max-w-[180px]">
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="truncate max-w-[100px]">
                              {user.mobile || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono truncate max-w-[140px]">
                                {showPassword ? (user.password || 'Not set') : '••••••••'}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-3 w-3 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : user.role === "leader" ? "secondary" : "outline"}  className="md:w-fit md:min-w-0 md:px-1.5 md:py-0.5" >
                              {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.createdAt ? new Date(user.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true
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
                          {getVisiblePages().map((page, index) => (
                            <PaginationItem key={index}>
                              {page === '...' ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  onClick={() => handlePageChange(page as number)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              )}
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
                {/* </ScrollArea> */}
              </div>


            </div>
          )}
        </CardContent>
      </Card>

      {isDetailsModalOpen && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}