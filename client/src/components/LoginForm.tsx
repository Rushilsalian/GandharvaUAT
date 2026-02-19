import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { url } from "inspector";

interface LoginFormProps {
  onLogin?: (email: string, password: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validation 1: Check username length
      if (email.length < 10) {
        setError("Username must be at least 10 characters long");
        return;
      }

      // Validation 2: Check if username exists in mst_user
      const userExistsResponse = await fetch('/api/check-user-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email })
      });
      const userExistsData = await userExistsResponse.json();
      
      if (!userExistsData.exists) {
        setError("Username not found in system");
        return;
      }

      // Validation 3: Check if username is unique (not associated with multiple users)
      if (userExistsData.count > 1) {
        setError("Multiple accounts found with this username. Please contact Admin");
        return;
      }

      console.log("Login attempted with:", { email, password: "***" });
      await onLogin?.(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{ background: "linear-gradient(135deg, #170372ff, #1533a6 50%, #f15a24)" }}
    >

      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-3">
            <img
              src="/icons/Gandharva.png"
              className="object-contain"
              style={{ width: "60%" }}
            />
          </div>
          {/* <CardTitle className="login text-2xl text-center font-semibold">
            Welcome to Gandharva
          </CardTitle> */}
          <CardDescription className="text-center">
            Enter your credentials to access your investment portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">

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
                className="focus:border-[#f15a24] focus:border-[1px] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" data-testid="label-password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="focus:border-[#f15a24] focus:border-[1px] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
            <div className="text-end mt-0" style={{ marginTop: '0px' }}>
              <Link href="/forgot-password">
                <Button variant="ghost" className="p-0 text-sm text-red-600 hover:text-red-700" data-testid="link-forgot-password">
                  Forgot password?
                </Button>
              </Link>
            </div>
          </form>

          {/* <Separator className="my-4" /> */}


        </CardContent>
      </Card>
    </div>
  );
}