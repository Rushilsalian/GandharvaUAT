import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, MapPin, CreditCard, FileText, Calendar, Edit2, Save, X } from "lucide-react";
import { useState } from "react";
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Client {
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
  isActive: {
    type: string;
    data: number[];
  } | boolean;
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

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientDetailsModal({ client, isOpen, onClose }: ClientDetailsModalProps) {
  // Move all hooks before any conditional returns
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    panNo?: string;
    aadhaarNo?: string;
    dob?: string;
    address?: string;
    city?: string;
    pincode?: string | number;
  }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Reset editing state when modal closes or client changes
  React.useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditData({});
    }
  }, [isOpen, client?.clientId]);

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest('PUT', `/api/mst/clients/${client?.clientId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mst/clients'] });
      toast({
        title: "Success",
        description: "Client details updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client details",
        variant: "destructive",
      });
    }
  });
  
  if (!client) return null;

  // Initialize edit data when client changes or edit mode starts
  const startEditing = () => {
    setEditData({
      panNo: client.panNo || '',
      aadhaarNo: client.aadhaarNo || '',
      dob: client.dob ? new Date(client.dob).toISOString().split('T')[0] : '',
      address: client.address || '',
      city: client.city || '',
      pincode: client.pincode || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const updates = {
      ...editData,
      dob: editData.dob ? new Date(editData.dob) : null
    };
    updateMutation.mutate(updates);
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
  };





  const formatDate = (date: Date | null | string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Remove investment calculations as they're not available in this data structure

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-client-details">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Details - {client.name}
            </DialogTitle>

          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-sm" data-testid="text-name">{client.name}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm" data-testid="text-email">{client.email || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                  <p className="text-sm" data-testid="text-mobile">{client.mobile || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.dob || ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, dob: e.target.value }))}
                      data-testid="input-dob"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm" data-testid="text-dob">{formatDate(client.dob || null)}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  {isEditing ? (
                    <Textarea
                      value={editData.address || ''}
                      onChange={(e) => setEditData((prev) => ({ ...prev, address: e.target.value }))}
                      data-testid="input-address"
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm" data-testid="text-address">{client.address || 'N/A'}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">City</p>
                  <p className="text-sm" data-testid="text-city">{client.city || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pincode</p>
                  <p className="text-sm" data-testid="text-pincode">{client.pincode || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">PAN Number</Label>
                {isEditing ? (
                  <Input
                    value={editData.panNo || ''}
                    onChange={(e) => setEditData((prev) => ({ ...prev, panNo: e.target.value }))}
                    data-testid="input-pan"
                    className="mt-1 font-mono"
                    placeholder="Enter PAN number"
                  />
                ) : (
                  <p className="text-sm font-mono" data-testid="text-pan">{client.panNo || 'N/A'}</p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Aadhaar Number</Label>
                {isEditing ? (
                  <Input
                    value={editData.aadhaarNo || ''}
                    onChange={(e) => setEditData((prev) => ({ ...prev, aadhaarNo: e.target.value }))}
                    data-testid="input-aadhar"
                    className="mt-1 font-mono"
                    placeholder="Enter Aadhaar number"
                  />
                ) : (
                  <p className="text-sm font-mono" data-testid="text-aadhar">{client.aadhaarNo || 'N/A'}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={typeof client.isActive === 'object' && client.isActive.data[0] === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} data-testid="badge-status">
                  {typeof client.isActive === 'object' && client.isActive.data[0] === 1 ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p className="text-sm" data-testid="text-created-by">{client.createdByUser || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <p className="text-sm" data-testid="text-created-date">{formatDate(client.createdDate)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Branch</p>
                <p className="text-sm" data-testid="text-branch">{client.branch || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reference ID</p>
                <p className="text-sm" data-testid="text-reference-id">{client.referenceId || 'N/A'}</p>
              </div>
              
              {client.modifiedDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Modified</p>
                  <p className="text-sm" data-testid="text-modified-date">{formatDate(client.modifiedDate)}</p>
                  <p className="text-xs text-muted-foreground">by {client.modifiedByUser}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}