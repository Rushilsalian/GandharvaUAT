import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

interface LoginFormProps {
  onLogin?: (email: string, password: string) => void;
  onSignup?: (email: string, password: string, name: string) => void;
}

export function LoginForm({ onLogin, onSignup }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      if (isSignup) {
        if (!name.trim()) {
          throw new Error("Name is required");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        console.log("Signup attempted with:", { name, email, password: "***" });
        await onSignup?.(email, password, name);
      } else {
        console.log("Login attempted with:", { email, password: "***" });
        await onLogin?.(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pb-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-primary font-semibold">
            {isSignup ? "Join Gandharva" : "Welcome to Gandharva"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignup 
              ? "Create your account to start your investment journey"
              : "Enter your credentials to access your investment portfolio"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-1">
                <Label htmlFor="name" data-testid="label-name">Full Name</Label>
                <Input
                  id="name"
                  data-testid="input-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="email" data-testid="label-email">Email or Mobile</Label>
              <Input
                id="email"
                data-testid="input-email"
                type="text"
                placeholder="Enter your email or mobile number"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password" data-testid="label-password">Password</Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
              data-testid={isSignup ? "button-signup" : "button-login"}
            >
              {isLoading ? (isSignup ? "Signing Up..." : "Signing In...") : (isSignup ? "Sign Up" : "Sign In")}
            </Button>
            <div className="text-end mt-0" style={{marginTop:'0px'}}>
            {!isSignup && (
              <Link href="/forgot-password">
                <Button variant="ghost" className="p-0 text-sm text-red-600 hover:text-red-700" data-testid="link-forgot-password">
                  Forgot password?
                </Button>
              </Link>
            )}</div>
          </form>

          <Separator className="my-4" />
          
          <div className="text-center text-primary space-y-1">
            <Button 
              variant="ghost" 
              className="p-0 h-auto text-sm" 
              onClick={() => setIsSignup(!isSignup)}
              data-testid="toggle-signup"
            >
              {isSignup 
                ? "Already have an account? Sign In" 
                : "Don't have an account? Sign Up"
              }
            </Button>
            
            {/* {!isSignup && (
              <Link href="/forgot-password">
                <Button variant="ghost" className="p-0 h-auto text-sm" data-testid="link-forgot-password">
                  Forgot your password?
                </Button>
              </Link>
            )} */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}