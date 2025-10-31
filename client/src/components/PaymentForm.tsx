import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, CheckCircle, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentRecord {
  id: string;
  amount: number;
  method: "netbanking" | "upi";
  status: "completed" | "pending" | "failed";
  date: string;
  receiptNumber: string;
}

export function PaymentForm() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  //todo: remove mock functionality - replace with real payment records
  const [payments, setPayments] = useState<PaymentRecord[]>([
    {
      id: "1",
      amount: 50000,
      method: "netbanking",
      status: "completed",
      date: "2024-01-12",
      receiptNumber: "RCP001234"
    },
    {
      id: "2",
      amount: 25000,
      method: "upi",
      status: "pending",
      date: "2024-01-15",
      receiptNumber: "RCP001235"
    }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const newPayment: PaymentRecord = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        method: method as "netbanking" | "upi",
        status: "completed",
        date: new Date().toISOString().split('T')[0],
        receiptNumber: `RCP${Date.now().toString().slice(-6)}`
      };
      
      setPayments([newPayment, ...payments]);
      setAmount("");
      setMethod("");
      setIsProcessing(false);
      
      console.log("Payment processed:", newPayment);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-chart-2" />;
      case "failed": return <CheckCircle className="h-4 w-4 text-chart-3" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "completed": return "default";
      case "failed": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Make Investment Payment
          </CardTitle>
          <CardDescription>
            Invest using Net Banking or UPI for instant portfolio updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="investment-amount">Investment Amount (₹)</Label>
              <Input
                id="investment-amount"
                data-testid="input-investment-amount"
                type="number"
                placeholder="Enter investment amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="5000"
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum investment amount: ₹5,000
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={method} onValueChange={setMethod} required>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue placeholder="Choose payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="netbanking">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Net Banking
                    </div>
                  </SelectItem>
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      UPI
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              disabled={isProcessing}
              data-testid="button-submit-payment"
              className="w-full"
            >
              {isProcessing ? "Processing Payment..." : "Proceed to Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Your recent investment payments and receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No payment history found
              </p>
            ) : (
              payments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`payment-record-${payment.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">₹{payment.amount.toLocaleString()}</span>
                      <Badge variant={getStatusVariant(payment.status)}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1 capitalize">{payment.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {payment.method === "netbanking" ? (
                        <CreditCard className="h-3 w-3" />
                      ) : (
                        <Smartphone className="h-3 w-3" />
                      )}
                      <span className="capitalize">{payment.method}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Receipt #: {payment.receiptNumber}</span>
                      <span>Date: {payment.date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}