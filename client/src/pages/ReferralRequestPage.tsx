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

export default function ReferralRequestPage() {
  const [formData, setFormData] = useState({
    refereeName: "",
    refereePhone: ""
  });

  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  const fetchReferrals = async () => {
    try {
      const response = await apiClient.get('/requests/referral');
      console.log('Fetched referrals response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      setReferrals(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      setReferrals([]);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Validation
    if (!formData.refereeName.trim()) {
      setError('Referee name is required');
      setLoading(false);
      return;
    }
    
    if (!formData.refereePhone.trim()) {
      setError('Referee phone is required');
      setLoading(false);
      return;
    }
    
    try {
      const response = await apiClient.post('/requests/referral', {
        refereeName: formData.refereeName.trim(),
        refereePhone: formData.refereePhone.trim()
      });
      
      setFormData({ refereeName: "", refereePhone: "" });
      setSuccess('Referral request submitted successfully!');
      await fetchReferrals();
    } catch (error: any) {
      console.error('Error submitting referral:', error);
      setError(error.message || 'Failed to submit referral request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const columns: any[] = [
    { key: "date", label: "Date", render: (value: string) => value ? new Date(value).toLocaleDateString() : 'N/A' },
    { key: "client", label: "Client Name", render: (client: any) => client ? `${client.name}` : 'N/A', exportValue: (row: any) => row.client ? row.client.name : 'N/A' },
    { key: "name", label: "Referee Name" },
    { key: "mobile", label: "Mobile" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Referral Request</h1>
        <p className="text-muted-foreground">Refer someone to our platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Details</CardTitle>
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
              <Label htmlFor="refereeName">Referee Name *</Label>
              <Input
                id="refereeName"
                placeholder="Enter referee's full name"
                value={formData.refereeName}
                onChange={(e) => setFormData({ ...formData, refereeName: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="refereePhone">Referee Phone *</Label>
              <Input
                id="refereePhone"
                placeholder="Enter referee's phone number"
                value={formData.refereePhone}
                onChange={(e) => setFormData({ ...formData, refereePhone: e.target.value })}
                required
              />
            </div>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Referral'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DataTable
        title="Referral Requests"
        description="Your submitted referral requests"
        columns={columns}
        data={referrals}
        searchable={true}
        filterable={true}
        exportable={true}
      />
    </div>
  );
}