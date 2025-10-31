import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function PaymentCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transaction_id');
    const transactionNo = urlParams.get('transaction_no');
    const amount = urlParams.get('amount');
    const paymentStatus = urlParams.get('status');

    if (paymentStatus === 'SUCCESS' && transactionId && transactionNo) {
      setStatus('success');
      setPaymentData({ transactionId, transactionNo, amount });
      
      // Auto-submit investment request
      const investmentData = JSON.parse(localStorage.getItem('pendingInvestment') || '{}');
      if (investmentData.amount) {
        apiClient.post('/requests/investment', {
          amount: parseFloat(investmentData.amount),
          investmentRemark: investmentData.investmentRemark || 'Investment',
          transactionId,
          transactionNo
        }).then(() => {
          localStorage.removeItem('pendingInvestment');
        }).catch(err => {
          console.error('Investment request failed:', err);
        });
      }
    } else {
      setStatus('failed');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && "Processing Payment..."}
            {status === 'success' && (
              <>
                <CheckCircle className="text-green-500" />
                Payment Successful
              </>
            )}
            {status === 'failed' && (
              <>
                <XCircle className="text-red-500" />
                Payment Failed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'success' && paymentData && (
            <div className="space-y-2">
              <p>Transaction ID: {paymentData.transactionId}</p>
              <p>Transaction No: {paymentData.transactionNo}</p>
              <p>Amount: ₹{paymentData.amount}</p>
              <p className="text-sm text-muted-foreground">
                Your investment request has been submitted successfully.
                You will receive an email receipt shortly.
              </p>
            </div>
          )}
          
          {status === 'failed' && (
            <p className="text-red-500">
              Payment was not successful. Please try again.
            </p>
          )}
          
          <Button 
            onClick={() => window.location.href = '/investment-request'}
            className="w-full"
          >
            {status === 'success' ? 'Back to Investments' : 'Try Again'}
          </Button>
          
          {status === 'success' && (
            <div className="mt-4 p-4 bg-green-50 rounded border">
              <p className="text-green-700 text-sm">
                ✅ Investment request submitted successfully!
                <br />📧 Email receipt sent to your registered email.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}