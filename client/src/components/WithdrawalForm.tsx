import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";

interface WithdrawalRequest {
  id: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestDate: string;
  requestNumber: string;
}

export function WithdrawalForm() {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  //todo: remove mock functionality - replace with real withdrawal requests
  const [requests, setRequests] = useState<WithdrawalRequest[]>([
    {
      id: "1",
      amount: 25000,
      reason: "Medical emergency",
      status: "approved",
      requestDate: "2024-01-10",
      requestNumber: "WR001234"
    },
    {
      id: "2", 
      amount: 15000,
      reason: "Education expenses",
      status: "pending",
      requestDate: "2024-01-15",
      requestNumber: "WR001235"
    }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newRequest: WithdrawalRequest = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        reason,
        status: "pending",
        requestDate: new Date().toISOString().split('T')[0],
        requestNumber: `WR${Date.now().toString().slice(-6)}`
      };
      
      setRequests([newRequest, ...requests]);
      setAmount("");
      setReason("");
      setIsSubmitting(false);
      
      console.log("Withdrawal request submitted:", newRequest);
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4 text-chart-2" />;
      case "rejected": return <XCircle className="h-4 w-4 text-chart-3" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "approved": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Withdrawal Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Request Withdrawal
          </CardTitle>
          <CardDescription>
            Submit a withdrawal request from your investment portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                data-testid="input-withdrawal-amount"
                type="number"
                placeholder="Enter withdrawal amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1000"
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum withdrawal amount: ₹1,000
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Withdrawal</Label>
              <Textarea
                id="reason"
                data-testid="input-withdrawal-reason"
                placeholder="Please provide reason for this withdrawal request"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              data-testid="button-submit-withdrawal"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Your Withdrawal Requests</CardTitle>
          <CardDescription>
            Track the status of your withdrawal requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No withdrawal requests found
              </p>
            ) : (
              requests.map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`withdrawal-request-${request.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">₹{request.amount.toLocaleString()}</span>
                      <Badge variant={getStatusVariant(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Request #: {request.requestNumber}</span>
                      <span>Date: {request.requestDate}</span>
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