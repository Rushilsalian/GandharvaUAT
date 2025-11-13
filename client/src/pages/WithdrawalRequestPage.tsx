import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

export default function WithdrawalRequestPage() {
  const { session } = useAuth();
  const [formData, setFormData] = useState({
    amount: "",
    reason: ""
  });

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/requests/withdrawal');
      console.log('Fetched withdrawal requests response:', response);
      setRequests(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Validation
    if (!formData.amount.trim()) {
      setError('Amount is required');
      setLoading(false);
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }
    
    if (!formData.reason.trim()) {
      setError('Reason is required');
      setLoading(false);
      return;
    }
    
    try {
      const response = await apiClient.post('/requests/withdrawal', {
        amount: amount,
        reason: formData.reason.trim()
      });
      
      setFormData({ amount: "", reason: "" });
      setSuccess('Withdrawal request submitted successfully!');
      await fetchRequests();
    } catch (error: any) {
      console.error('Error submitting withdrawal request:', error);
      setError(error.message || 'Failed to submit withdrawal request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Role-based columns
  const getColumns = () => {
    const roleName = session?.roleName || session?.role;
    const baseColumns: any[] = [
      { key: "date", label: "Date", render: (value: string) => value ? new Date(value).toLocaleDateString() : 'N/A' },
      { key: "amount", label: "Amount", render: (value: number) => `₹${value.toLocaleString()}` },
      { key: "reason", label: "Reason" }
    ];

    // Add client column for all roles to show who made the request
    baseColumns.splice(1, 0, {
      key: "client",
      label: "Client",
      render: (client: any) => client ? `${client.name} (${client.code})` : 'N/A',
      exportValue: (row: any) => row.client ? `${row.client.name} (${row.client.code})` : 'N/A'
    });

    return baseColumns;
  };

  // Role-based form visibility
  const canSubmitRequest = () => {
    const roleName = session?.roleName || session?.role;
    return roleName === 'client' || roleName === 'Client' || roleName === 'admin' || roleName === 'Admin';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Withdrawal Request</h1>
        <p className="text-muted-foreground">
          {canSubmitRequest() ? 'Submit a new withdrawal request' : 'View withdrawal requests'}
        </p>
      </div>

      {canSubmitRequest() && (
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="Enter withdrawal amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for withdrawal"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </div>
              
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        title="Withdrawal Requests"
        description="Withdrawal requests"
        columns={getColumns()}
        data={requests}
        searchable={true}
        filterable={true}
        exportable={true}
      />
    </div>
  );
}