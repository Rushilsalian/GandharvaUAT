import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset link");
      setMessage(data.message);
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setResetUrl(data.resetUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4"
    style={{ background: "linear-gradient(135deg, #170372ff, #1533a6 50%, #f15a24)" }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-primary items-center">
          <CardTitle>Forgot Your Password</CardTitle>
          <span className="text-sm text-muted-foreground text-center">
            Enter the email address to receive the password reset link.
          </span>
        </CardHeader>
        <CardContent>
          
          {message && <div className="text-green-600 mb-2">{message}</div>}
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {resetToken && (
            <div className="bg-blue-50 p-3 rounded mb-4">
              <p className="text-sm text-blue-800 mb-2">Reset Token:</p>
              <code className="text-xs bg-blue-100 p-1 rounded block mb-2">{resetToken}</code>
              <button 
                onClick={() => setLocation(resetUrl)}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Click here to reset password
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="focus:border-[#f15a24] focus:border-[1px] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Sending..." : "Request reset link"}
            </Button>
            <Button variant="link" onClick={() => setLocation("/")} className="text-primary w-full pt-0">
              Back to Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
