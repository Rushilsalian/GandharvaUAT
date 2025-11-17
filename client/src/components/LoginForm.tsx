import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { url } from "inspector";

interface LoginFormProps {
  onLogin?: (email: string, password: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
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
          <div className="flex justify-center">
            <img
              src="/icons/Gandharva.png"
              className="object-contain"
              style={{ width: "60%" }}
            />
          </div><br></br>
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