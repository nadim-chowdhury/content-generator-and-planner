"use client";

import { useState, useEffect } from "react";
import { affiliatesApi, AffiliateDashboard } from "@/lib/affiliates";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Copy,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Wallet,
  CreditCard,
} from "lucide-react";

export default function AffiliatesPage() {
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null);
  const [affiliateLink, setAffiliateLink] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      try {
        const [dashboardData, linkData] = await Promise.all([
          affiliatesApi.getDashboard(),
          affiliatesApi.getAffiliateLink(),
        ]);
        setDashboard(dashboardData);
        setAffiliateLink(linkData.link);
      } catch (err: any) {
        if (err.response?.status === 400) {
          setDashboard(null);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      await affiliatesApi.applyForAffiliate();
      alert("Affiliate application submitted! Please wait for admin approval.");
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to apply for affiliate");
    }
  };

  const handleRequestPayout = async () => {
    if (!paymentMethod || !paymentDetails) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const result = await affiliatesApi.requestPayout(
        paymentMethod,
        paymentDetails
      );
      alert(
        `Payout requested successfully! Amount: $${result.amount.toFixed(2)}`
      );
      setShowPayoutModal(false);
      setPaymentMethod("");
      setPaymentDetails("");
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to request payout");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (status === "PAID" || status === "COMPLETED") return "default";
    if (status === "APPROVED" || status === "PROCESSING") return "secondary";
    if (status === "PENDING") return "outline";
    return "destructive";
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">
                Affiliate Program
              </h1>
            </div>
            <p className="text-muted-foreground">
              Earn commissions by promoting GenPlan
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !dashboard ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h2 className="text-xl font-semibold mb-4">
                  Become an Affiliate
                </h2>
                <p className="text-muted-foreground mb-6">
                  Join our affiliate program and earn commissions for every
                  referral that subscribes!
                </p>
                <Button onClick={handleApply}>
                  Apply to Become an Affiliate
                </Button>
              </CardContent>
            </Card>
          ) : !dashboard.approved ? (
            <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <div className="font-semibold mb-1">Application Pending</div>
                <div>
                  Your affiliate application is pending approval. You&apos;ll be able
                  to access your dashboard once approved.
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Affiliate Link */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Your Affiliate Link
                  </CardTitle>
                  <CardDescription>
                    Share this link to earn commissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input type="text" value={affiliateLink} readOnly />
                    <Button
                      onClick={() => copyToClipboard(affiliateLink)}
                      variant="outline"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Share this link to earn commissions when users sign up and
                    subscribe!
                  </p>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Earned</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(dashboard.stats.totalEarned)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Paid</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(dashboard.stats.totalPaid)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Available</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {formatCurrency(dashboard.stats.availableForPayout)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Commissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {dashboard.stats.totalCommissions}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Request Payout Button */}
              {dashboard.stats.availableForPayout > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          Available for Payout
                        </h3>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(dashboard.stats.availableForPayout)}
                        </p>
                      </div>
                      <Button onClick={() => setShowPayoutModal(true)}>
                        <Wallet className="w-4 h-4 mr-2" />
                        Request Payout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Commissions */}
              <Card>
                <CardHeader>
                  <CardTitle>Commissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>{commission.orderId || "N/A"}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(commission.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusVariant(commission.status)}
                            >
                              {commission.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(commission.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Payouts */}
              {dashboard.payouts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payout History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Requested</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboard.payouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell className="font-medium">
                              {formatCurrency(payout.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(payout.status)}>
                                {payout.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {payout.paymentMethod || "N/A"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(payout.requestedAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Payout Modal */}
          <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
                <DialogDescription>
                  Enter your payment details to request a payout
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="Stripe">Stripe</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Details *</Label>
                  <Textarea
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder="Enter your payment account details (e.g., PayPal email, bank account)"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPayoutModal(false);
                    setPaymentMethod("");
                    setPaymentDetails("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleRequestPayout}>Request Payout</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  );
}
