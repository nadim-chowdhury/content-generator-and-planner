"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";
import ProtectedRoute from "@/components/ProtectedRoute";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import MagicLinkLogin from "@/components/MagicLinkLogin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Mail, Lock, KeyRound } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"password" | "magic">(
    "password"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (token) {
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    }
  }, [token, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user, token, refreshToken } = await authApi.login(
        email,
        password,
        twoFactorToken || undefined
      );
      setAuth(user, token, refreshToken);
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);

      // Check if 2FA is required
      if (errorMessage.includes("2FA") || errorMessage.includes("two-factor")) {
        setShow2FA(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't render if already authenticated (will redirect)
  if (token) {
    return null;
  }

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <Link href="/">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                </Link>
              </div>
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your GenPlan account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loginMethod === "password" ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required={!show2FA}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  {show2FA && (
                    <div className="space-y-2">
                      <Label htmlFor="2fa-token">
                        Two-Factor Authentication Code
                      </Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="2fa-token"
                          type="text"
                          maxLength={6}
                          required
                          value={twoFactorToken}
                          onChange={(e) =>
                            setTwoFactorToken(e.target.value.replace(/\D/g, ""))
                          }
                          className="pl-10 text-center text-xl tracking-widest"
                          placeholder="000000"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center">
                    <Button variant="link" className="px-0" asChild>
                      <Link href="/auth/forgot-password">Forgot password?</Link>
                    </Button>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              ) : (
                <MagicLinkLogin />
              )}

              {loginMethod === "password" && <SocialLoginButtons />}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="text-center mb-0">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() =>
                    setLoginMethod(
                      loginMethod === "password" ? "magic" : "password"
                    )
                  }
                  className="w-full"
                >
                  {loginMethod === "password"
                    ? "Use magic link instead"
                    : "Use password instead"}
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Button variant="link" className="px-0" asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
