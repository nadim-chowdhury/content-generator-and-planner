'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { billingApi, SubscriptionStatus, Invoice, UsageStats } from '@/lib/billing';
import { notificationsApi } from '@/lib/notifications';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  TrendingUp, 
  Bell, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BillingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);
  const [recentBillingNotifications, setRecentBillingNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusData, invoicesData, usageData, notificationsData] = await Promise.all([
        billingApi.getStatus(),
        billingApi.getInvoices(10),
        billingApi.getUsageStats(),
        notificationsApi.getNotifications(10).catch(() => []),
      ]);
      setStatus(statusData);
      setInvoices(invoicesData);
      setUsage(usageData);
      
      if (notificationsData && Array.isArray(notificationsData)) {
        const billingNotifs = notificationsData.filter((n: any) => 
          n.category === 'SYSTEM' && 
          (n.title?.includes('Subscription') || 
           n.title?.includes('Payment') || 
           n.title?.includes('Trial'))
        );
        setRecentBillingNotifications(billingNotifs.slice(0, 5));
      }
      
      if (statusData.plan !== user?.plan) {
        updateUser({ plan: statusData.plan });
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    router.push('/pricing');
  };

  const handleManage = async () => {
    setProcessing(true);
    try {
      const { url } = await billingApi.createPortalSession();
      window.location.href = url; // Stripe portal URL - external redirect
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to open billing portal');
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      await billingApi.cancelSubscription(cancelAtPeriodEnd);
      setShowCancelConfirm(false);
      await loadData();
      alert(cancelAtPeriodEnd ? 'Subscription will be cancelled at the end of the billing period' : 'Subscription cancelled');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel subscription');
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isPro = user?.plan === 'PRO' || user?.plan === 'AGENCY';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
            <p className="text-muted-foreground mt-1">
              Manage your subscription and billing information
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subscription Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold mb-2">
                        {status?.plan || 'Free'}
                      </div>
                      {status?.onTrial && status?.trialEndsAt && (
                        <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 mb-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                            Free trial ends on {formatDate(status.trialEndsAt)}
                          </AlertDescription>
                        </Alert>
                      )}
                      {status?.cancelAtPeriodEnd && status?.currentPeriodEnd && (
                        <Alert variant="destructive" className="mb-2">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            Cancels on {formatDate(status.currentPeriodEnd)}
                          </AlertDescription>
                        </Alert>
                      )}
                      {status?.active && !status?.onTrial && !status?.cancelAtPeriodEnd && status?.currentPeriodEnd && (
                        <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <AlertDescription className="text-green-800 dark:text-green-200">
                            Active until {formatDate(status.currentPeriodEnd)}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {!isPro && (
                        <Button onClick={handleUpgrade}>
                          Upgrade
                        </Button>
                      )}
                      {isPro && !status?.cancelAtPeriodEnd && (
                        <>
                          <Button variant="outline" onClick={handleManage} disabled={processing}>
                            {processing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Opening...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Manage Subscription
                              </>
                            )}
                          </Button>
                          <Button variant="destructive" onClick={() => setShowCancelConfirm(true)}>
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Statistics */}
              {usage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Usage Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Daily AI Generations</div>
                        <div className="text-2xl font-bold">
                          {usage.dailyGenerations}
                          {usage.isUnlimited ? '' : ` / ${usage.dailyLimit}`}
                        </div>
                      </div>
                      {!usage.isUnlimited && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Remaining Today</div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {usage.remaining}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Plan</div>
                        <div className="text-2xl font-bold">{usage.plan}</div>
                      </div>
                    </div>
                    {!usage.isUnlimited && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Usage</span>
                          <span>{((usage.dailyGenerations / (usage.dailyLimit || 1)) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={(usage.dailyGenerations / (usage.dailyLimit || 1)) * 100} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recent Billing Notifications */}
              {recentBillingNotifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Recent Billing Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentBillingNotifications.map((notification) => (
                        <Alert
                          key={notification.id}
                          className={cn(
                            notification.read ? 'bg-muted/50' : 'bg-primary/5 border-primary/50'
                          )}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1">
                              <div className="font-semibold mb-1">{notification.title}</div>
                              <div className="text-sm text-muted-foreground">{notification.message}</div>
                              <div className="text-xs text-muted-foreground mt-2">
                                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                            {!notification.read && (
                              <div className="ml-4 w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No invoices found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>{formatDate(invoice.created)}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  invoice.status === 'paid'
                                    ? 'default'
                                    : invoice.status === 'open'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {invoice.hostedInvoiceUrl && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-4 h-4 mr-1" />
                                      View
                                    </a>
                                  </Button>
                                )}
                                {invoice.invoicePdf && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                                      <FileText className="w-4 h-4 mr-1" />
                                      PDF
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cancel Confirmation Dialog */}
          <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Subscription</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel your subscription?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cancelAtPeriodEnd"
                    checked={cancelAtPeriodEnd}
                    onCheckedChange={(checked) => setCancelAtPeriodEnd(checked as boolean)}
                  />
                  <Label htmlFor="cancelAtPeriodEnd" className="cursor-pointer">
                    Cancel at end of billing period (recommended)
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
                  Keep Subscription
                </Button>
                <Button variant="destructive" onClick={handleCancel} disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Subscription'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  );
}
