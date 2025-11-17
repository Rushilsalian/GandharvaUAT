import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Building2, CreditCard } from "lucide-react";



export default function InvestmentRequestPage() {
  const { toast } = useToast();
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

  const handlePayment = async () => {
    if (!formData.amount) return;
    
    setLoading(true);
    try {
      // Create Razorpay order
      const orderResponse = await apiClient.post('/payment/razorpay/create-order', {
        amount: parseFloat(formData.amount)
      });
      
      const { orderId, amount, currency, keyId } = orderResponse;
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: 'Gandharva Investment',
          description: 'Investment Request',
          order_id: orderId,
          handler: async (response: any) => {
            try {
              // Verify payment
              const verifyResponse = await apiClient.post('/payment/razorpay/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              
              if (verifyResponse.success) {
                // Create investment request
                await handlePaymentCallback({
                  transactionId: response.razorpay_payment_id,
                  transactionNo: response.razorpay_order_id,
                  amount: verifyResponse.amount
                });
                toast({
                  title: "Payment Successful!",
                  description: "Investment request created successfully.",
                  variant: "default"
                });
              } else {
                toast({
                  title: "Payment Failed",
                  description: "Payment verification failed!",
                  variant: "destructive"
                });
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast({
                title: "Payment Failed",
                description: "Payment verification failed!",
                variant: "destructive"
              });
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: 'User',
            email: 'user@example.com'
          },
          theme: {
            color: '#3399cc'
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            }
          }
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      
      document.body.appendChild(script);
    } catch (error) {
      console.error('Payment initiation failed:', error);
      toast({
        title: "Payment Failed",
        description: `Payment initiation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
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

  const columns: any[] = [
    { key: "date", label: "Date", render: (value: string) => {
      const date = new Date(value);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }},
    { key: "client", label: "Client Name", render: (client: any) => client ? `${client.name}` : 'N/A', exportValue: (row: any) => row.client ? row.client.name : 'N/A' },
    { key: "amount", label: "Amount", render: (value: number) => `₹${value.toLocaleString()}` },
    { key: "investmentRemark", label: "Reason" },
    { key: "transactionNo", label: "Transaction No" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Investment Request</h1>
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
                className="amount-imput"
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
            
            <div className="sspace-y-4 items-center justify-center mt-1">
              <Button 
                onClick={handlePayment} 
                disabled={loading || !formData.amount}
                className=" bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {loading ? 'Processing...' : `Pay ₹${formData.amount || '0'} with Razorpay`}
              </Button>
              <div className="text-center text-sm text-gray-500 mt-1">
                Secure payment powered by Razorpay
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