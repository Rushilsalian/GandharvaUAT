import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, UserCheck, Calendar, Edit2, Save, X, Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsModal({ user, isOpen, onClose }: UserDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editData, setEditData] = useState<{
    firstName?: string;
    email?: string;
    mobile?: string;
    role?: string;
    password?: string;
  }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditData({});
      setShowPassword(false);
    }
  }, [isOpen, user?.id]);

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest('PUT', `/api/users/${user?.id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User details updated successfully",
      });
      setIsEditing(false);
      // Force a small delay before closing to ensure cache invalidation completes
      setTimeout(() => {
        onClose();
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user details",
        variant: "destructive",
      });
    }
  });

  if (!user) return null;

  const startEditing = () => {
    setEditData({
      firstName: `${user.firstName || ''}${(() => {
        const cleanLastName = user.lastName?.replace(/undefined/g, '').trim();
        return cleanLastName ? ` ${cleanLastName}` : '';
      })()}`,
      email: user.email || '',
      mobile: user.mobile || '',
      role: user.role || '',
      password: '' // Start with empty password for editing
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const nameParts = editData.firstName?.trim().split(' ') || [];
    const updates = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: editData.email,
      mobile: editData.mobile,
      role: editData.role,
      password: editData.password || undefined // Send raw password, backend will handle hashing
    };
    // Remove password from updates if it's empty (keep existing password)
    if (!editData.password) {
      delete updates.password;
    }
    updateMutation.mutate(updates);
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
    setShowPassword(false);
  };

  const formatDate = (date: Date | null | string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mt-3">
            <DialogTitle className="flex items-center gap-2">
              {/* <User className="h-5 w-5" /> */}
              User Details - {(() => {
                const cleanLastName = user.lastName?.replace(/undefined/g, '').trim();
                const firstName = user.firstName || '';
                const lastName = cleanLastName || '';
                return `${firstName}${lastName ? ` ${lastName}` : ''}`;
              })()}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 mx-4">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                {isEditing ? (
                  <Input
                    value={editData.firstName || ''}
                    onChange={(e) => setEditData((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1"
                    readOnly
                  />
                ) : (
                  <p className="text-sm">{(() => {
                    const cleanLastName = user.lastName?.replace(/undefined/g, '').trim();
                    const firstName = user.firstName || '';
                    const lastName = cleanLastName || '';
                    return `${firstName}${lastName ? ` ${lastName}` : ''}`;
                  })()}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                    readOnly
                  />
                ) : (
                  <p className="text-sm">{user.email}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Mobile</Label>
                {isEditing ? (
                  <Input
                    value={editData.mobile || ''}
                    onChange={(e) => setEditData((prev) => ({ ...prev, mobile: e.target.value }))}
                    className="mt-1"
                    readOnly
                  />
                ) : (
                  <p className="text-sm">{user.mobile || 'N/A'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                {isEditing ? (
                  <Select
                    value={editData.role || ''}
                    onValueChange={(value) => setEditData((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select user role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="leader">Leader</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={user.role === "admin" ? "default" : user.role === "leader" ? "secondary" : "outline"}>
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </Badge>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                {isEditing ? (
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={editData.password || ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, password: e.target.value }))}
                      className="pr-10"
                      placeholder="Enter new password"
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
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-mono break-all">
                      {showPassword ? (user.password || 'Not set') : '••••••••'}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={`${user.isActive ? 'text-green-800' : 'text-red-800'} bg-transparent border-none shadow-none`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}