"use client";

import { useEffect, useState } from "react";
import { billingApi, PlansResponse, PlanType } from "@/lib/billing";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Sparkles,
  Crown,
  Building2,
  Loader2,
  Gift,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const [plans, setPlans] = useState<PlansResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [lifetimeKey, setLifetimeKey] = useState("");
  const [lifetimeLoading, setLifetimeLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponValid, setCouponValid] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await billingApi.getPlans();
      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planType: PlanType) => {
    try {
      setCheckoutLoading(planType);
      const { url } = await billingApi.createCheckout(
        planType,
        couponValid?.id || couponCode || undefined
      );
      window.location.href = url; // Stripe checkout URL - external redirect
    } catch (err: any) {
      console.error("Failed to create checkout:", err);
      alert(err.response?.data?.message || "Failed to create checkout session");
      setCheckoutLoading(null);
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      alert("Please enter a coupon code");
      return;
    }

    try {
      setValidatingCoupon(true);
      const validation = await billingApi.validateCoupon(couponCode);
      setCouponValid(validation);
      alert(
        `Coupon "${validation.name || couponCode}" is valid! ${
          validation.percentOff ? `${validation.percentOff}% off` : ""
        }`
      );
    } catch (err: any) {
      setCouponValid(null);
      alert(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleActivateLifetime = async () => {
    if (!lifetimeKey.trim()) {
      alert("Please enter a license key");
      return;
    }

    try {
      setLifetimeLoading(true);
      await billingApi.activateLifetime(lifetimeKey);
      alert("Lifetime deal activated successfully!");
      setLifetimeKey("");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Failed to activate lifetime deal:", err);
      alert(err.response?.data?.message || "Failed to activate lifetime deal");
    } finally {
      setLifetimeLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isCurrentPlan = (plan: string) => {
    return user?.plan === plan;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!plans) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex items-center justify-center min-h-[60vh]">
            <Alert variant="destructive">
              <AlertDescription>Failed to load plans</AlertDescription>
            </Alert>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Select the perfect plan for your content creation needs
            </p>

            {/* Coupon Code Input */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1"
                />
                <Button
                  onClick={handleValidateCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                >
                  {validatingCoupon ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4 mr-2" />
                      Apply
                    </>
                  )}
                </Button>
              </div>
              {couponValid && (
                <Alert className="mt-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Coupon "{couponValid.name || couponCode}" applied!{" "}
                    {couponValid.percentOff
                      ? `${couponValid.percentOff}% off`
                      : ""}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Free Plan */}
            <Card>
              <CardHeader>
                <CardTitle>{plans.free.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">
                    {formatPrice(plans.free.price)}
                  </span>
                </div>
                {isCurrentPlan(plans.free.plan) && (
                  <Badge className="mt-2">Current Plan</Badge>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plans.free.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isCurrentPlan(plans.free.plan)}
                >
                  {isCurrentPlan(plans.free.plan)
                    ? "Current Plan"
                    : "Get Started"}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Monthly */}
            <Card
              className={cn(
                "border-primary/50 relative",
                plans.proMonthly.planType && "border-2"
              )}
            >
              {plans.proMonthly.planType && (
                <Badge className="absolute top-4 right-4">Popular</Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {plans.proMonthly.name}
                </CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">
                    {formatPrice(plans.proMonthly.price)}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    /{plans.proMonthly.interval}
                  </span>
                </div>
                {isCurrentPlan(plans.proMonthly.plan) && (
                  <Badge className="mt-2">Current Plan</Badge>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plans.proMonthly.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() =>
                    plans.proMonthly.planType &&
                    handleCheckout(plans.proMonthly.planType)
                  }
                  disabled={
                    isCurrentPlan(plans.proMonthly.plan) ||
                    checkoutLoading === plans.proMonthly.planType
                  }
                >
                  {checkoutLoading === plans.proMonthly.planType ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan(plans.proMonthly.plan) ? (
                    "Current Plan"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Yearly */}
            <Card className="relative">
              {plans.proYearly.savings && (
                <Badge className="absolute top-4 right-4 bg-green-600">
                  Save {plans.proYearly.savings}
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  {plans.proYearly.name}
                </CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">
                    {formatPrice(plans.proYearly.price)}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    /{plans.proYearly.interval}
                  </span>
                </div>
                {plans.proYearly.pricePerMonth && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatPrice(plans.proYearly.pricePerMonth)}/month
                  </div>
                )}
                {isCurrentPlan(plans.proYearly.plan) && (
                  <Badge className="mt-2">Current Plan</Badge>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plans.proYearly.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() =>
                    plans.proYearly.planType &&
                    handleCheckout(plans.proYearly.planType)
                  }
                  disabled={
                    isCurrentPlan(plans.proYearly.plan) ||
                    checkoutLoading === plans.proYearly.planType
                  }
                >
                  {checkoutLoading === plans.proYearly.planType ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan(plans.proYearly.plan) ? (
                    "Current Plan"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Agency */}
            <Card className="border-purple-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {plans.agency.name}
                </CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">
                    {formatPrice(plans.agency.price)}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    /{plans.agency.interval}
                  </span>
                </div>
                {isCurrentPlan(plans.agency.plan) && (
                  <Badge className="mt-2">Current Plan</Badge>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plans.agency.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() =>
                    plans.agency.planType &&
                    handleCheckout(plans.agency.planType)
                  }
                  disabled={
                    isCurrentPlan(plans.agency.plan) ||
                    checkoutLoading === plans.agency.planType
                  }
                >
                  {checkoutLoading === plans.agency.planType ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan(plans.agency.plan) ? (
                    "Current Plan"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Lifetime Deal Section */}
          <Card className="bg-linear-to-r from-primary to-purple-600 text-primary-foreground border-0">
            <CardHeader>
              <CardTitle className="text-3xl text-center mb-2 flex items-center justify-center gap-2">
                <Gift className="w-8 h-8" />
                {plans.lifetime.name}
              </CardTitle>
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {formatPrice(plans.lifetime.price)}
                </div>
                <CardDescription className="text-primary-foreground/80">
                  {plans.lifetime.note}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-3">Features:</h3>
                  <ul className="space-y-2">
                    {plans.lifetime.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-300 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Activate Your License:</h3>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      value={lifetimeKey}
                      onChange={(e) => setLifetimeKey(e.target.value)}
                      placeholder="Enter your AppSumo license key"
                      className="bg-background/90 text-foreground"
                    />
                    <Button
                      onClick={handleActivateLifetime}
                      disabled={lifetimeLoading || !lifetimeKey.trim()}
                      className="w-full bg-background text-primary hover:bg-background/90"
                    >
                      {lifetimeLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Activating...
                        </>
                      ) : (
                        "Activate License"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
