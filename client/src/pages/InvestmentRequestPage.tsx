import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { Smartphone, Building2, CreditCard } from "lucide-react";



export default function InvestmentRequestPage() {
  const [formData, setFormData] = useState({
    amount: "",
    investmentRemark: ""
  });

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/requests/investment');
      console.log('Investment requests response:', response);
      setRequests(response || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handlePayment = async (method: string) => {
    if (!formData.amount) return;
    
    setLoading(true);
    try {
      localStorage.setItem('pendingInvestment', JSON.stringify({...formData, paymentMethod: method}));
      
      // For local testing, redirect directly to mock gateway
      const mockUrl = `http://localhost:8080/test-payment-mock.html?` +
        `merchant_id=test_merchant&` +
        `order_id=INV${Date.now()}&` +
        `amount=${formData.amount}&` +
        `currency=INR&` +
        `payment_method=${method}&` +
        `return_url=${window.location.origin}/payment-callback&` +
        `cancel_url=${window.location.origin}/investment-request`;
      
      console.log('Redirecting to mock gateway:', mockUrl);
      window.location.href = mockUrl;
    } catch (error) {
      console.error('Payment redirect failed:', error);
      alert('Payment redirect failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoading(false);
    }
  };

  // Handle payment callback (called from payment success page)
  const handlePaymentCallback = async (paymentData: any) => {
    try {
      await apiClient.post('/requests/investment', {
        amount: parseFloat(formData.amount),
        investmentRemark: formData.investmentRemark,
        transactionId: paymentData.transactionId,
        transactionNo: paymentData.transactionNo
      });
      
      setFormData({ amount: "", investmentRemark: "" });
      fetchRequests();
    } catch (error) {
      console.error('Investment request failed:', error);
    }
  };

  const columns = [
    { key: "date", label: "Date" },
    { key: "amount", label: "Amount", render: (value: number) => `₹${value.toLocaleString()}` },
    { key: "investmentRemark", label: "Remark" },
    { key: "transactionNo", label: "Transaction No" },
    { key: "status", label: "Status", render: () => (
      <Badge variant="default">Completed</Badge>
    )}
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investment Request</h1>
        <p className="text-muted-foreground">Submit investment request</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Investment Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter investment amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="investmentRemark">Investment Remark</Label>
              <Textarea
                id="investmentRemark"
                placeholder="Enter investment details or remarks"
                value={formData.investmentRemark}
                onChange={(e) => setFormData({ ...formData, investmentRemark: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  onClick={() => handlePayment('upi')} 
                  disabled={loading || !formData.amount}
                  variant="outline"
                  className="flex flex-col items-center gap-2 p-4 h-20 bg-white border-2 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-700">UPI</span>
                    <div className="w-0 h-0 border-l-4 border-l-orange-500 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    <div className="w-0 h-0 border-l-4 border-l-green-500 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    <div className="w-0 h-0 border-l-4 border-l-blue-500 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                  </div>
                  <span className="text-xs text-gray-500">UNIFIED PAYMENTS INTERFACE</span>
                </Button>
                <Button 
                  onClick={() => handlePayment('netbanking')} 
                  disabled={loading || !formData.amount}
                  variant="outline"
                  className="flex flex-col items-center gap-2 p-4 h-20 bg-white border-2 hover:bg-gray-50"
                >
                  <span className="text-2xl font-bold text-blue-600">NET</span>
                  <span className="text-lg font-bold text-blue-600 -mt-2">Banking</span>
                </Button>
                <Button 
                  onClick={() => handlePayment('card')} 
                  disabled={loading || !formData.amount}
                  variant="outline"
                  className="flex flex-col items-center gap-2 p-4 h-20 bg-white border-2 hover:bg-gray-50"
                >
                  <div className="flex gap-1">
                    <div className="w-8 h-5 bg-blue-600 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <div className="w-8 h-5 bg-red-500 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MC</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Debit/Credit Card</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Investment Requests"
        description="Your submitted investment requests"
        columns={columns}
        data={requests}
        searchable={true}
        filterable={true}
        exportable={true}
      />
    </div>
  );
}