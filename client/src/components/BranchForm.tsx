import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  manager?: string | null;
  createdAt: Date | null;
}

export function BranchForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Branch>>({});

  // Fetch branches from API
  const { data: branches = [], isLoading, error } = useQuery({
    queryKey: ['/api/branches'],
    queryFn: async () => {
      const response = await fetch('/api/branches');
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      return response.json();
    }
  });

  // Create branch mutation
  const createBranchMutation = useMutation({
    mutationFn: async (branchData: Partial<Branch>) => {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create branch');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      setFormData({});
      setIsEditing(false);
    },
    onError: (error: Error) => {
      alert(error.message);
    }
  });

  // Update branch mutation
  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, ...branchData }: Partial<Branch> & { id: string }) => {
      const response = await fetch(`/api/branches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update branch');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      setFormData({});
      setIsEditing(false);
    },
    onError: (error: Error) => {
      alert(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && formData.id) {
      updateBranchMutation.mutate(formData as Branch & { id: string });
    } else {
      createBranchMutation.mutate(formData);
    }
  };

  const handleEdit = (branch: Branch) => {
    setFormData(branch);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this branch?')) {
      // Note: Delete API endpoint would need to be implemented
      console.log("Branch delete functionality - API endpoint needed:", id);
      alert('Delete functionality will be implemented when DELETE API endpoint is added');
    }
  };

  const columns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "address", label: "Address" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "manager", label: "Manager" },
    {
      key: "actions",
      label: "Actions",
      exportable: false,
      render: (_: any, row: Branch) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
            data-testid={`button-edit-${row.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            data-testid={`button-delete-${row.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];


  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading application: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Branch Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? "Edit Branch" : "Add New Branch"}
          </CardTitle>
          <CardDescription>
            Manage branch information and locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                data-testid="input-branch-code"
                value={formData.code || ""}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                data-testid="input-branch-name"
                value={formData.name || ""}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                data-testid="input-branch-address"
                value={formData.address || ""}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Manager</Label>
              <Input
                id="manager"
                data-testid="input-branch-manager"
                value={formData.manager || ""}
                onChange={(e) => setFormData({...formData, manager: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-branch-email"
                value={formData.email || ""}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                data-testid="input-branch-phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <Button 
                type="submit" 
                data-testid="button-save-branch"
                disabled={createBranchMutation.isPending || updateBranchMutation.isPending}
              >
                {(createBranchMutation.isPending || updateBranchMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {isEditing ? "Update Branch" : "Add Branch"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2"
                  onClick={() => {
                    setFormData({});
                    setIsEditing(false);
                  }}
                  data-testid="button-cancel-branch"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Branches List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="mt-2">Loading branches...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading branches: {(error as Error).message}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle>Branch Directory</CardTitle>
            <CardDescription>Manage all branch locations and information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {columns.map((column) => (
                      <th key={column.key} className="text-left p-2 font-medium">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch: Branch, index: number) => (
                    <tr key={branch.id} className="border-b hover:bg-muted/50">
                      {columns.map((column) => (
                        <td key={column.key} className="p-2">
                          {column.render ? column.render(branch[column.key as keyof Branch], branch) : (branch[column.key as keyof Branch] || 'N/A')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {branches.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No branches found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}