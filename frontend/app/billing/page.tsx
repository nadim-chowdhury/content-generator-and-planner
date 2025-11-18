'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { billingApi, SubscriptionStatus, Invoice, UsageStats } from '@/lib/billing';
import { notificationsApi } from '@/lib/notifications';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

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
        notificationsApi.getNotifications(10).catch(() => []), // Get recent notifications
      ]);
      setStatus(statusData);
      setInvoices(invoicesData);
      setUsage(usageData);
      
      // Filter billing-related notifications
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
      window.location.href = url;
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Billing & Subscription</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subscription Status */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Current Plan</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {status?.plan || 'Free'}
                    </div>
                    {status?.onTrial && status?.trialEndsAt && (
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">
                        Free trial ends on {formatDate(status.trialEndsAt)}
                      </div>
                    )}
                    {status?.cancelAtPeriodEnd && status?.currentPeriodEnd && (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Cancels on {formatDate(status.currentPeriodEnd)}
                      </div>
                    )}
                    {status?.active && !status?.onTrial && !status?.cancelAtPeriodEnd && status?.currentPeriodEnd && (
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Active until {formatDate(status.currentPeriodEnd)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {!isPro && (
                      <button
                        onClick={handleUpgrade}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Upgrade
                      </button>
                    )}
                    {isPro && !status?.cancelAtPeriodEnd && (
                      <>
                        <button
                          onClick={handleManage}
                          disabled={processing}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                          {processing ? 'Opening...' : 'Manage Subscription'}
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(true)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              {usage && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Usage Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Daily AI Generations</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {usage.dailyGenerations}
                        {usage.isUnlimited ? '' : ` / ${usage.dailyLimit}`}
                      </div>
                    </div>
                    {!usage.isUnlimited && (
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Remaining Today</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {usage.remaining}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Plan</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{usage.plan}</div>
                    </div>
                  </div>
                  {!usage.isUnlimited && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${((usage.dailyGenerations / (usage.dailyLimit || 1)) * 100).toFixed(0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Billing Notifications */}
              {recentBillingNotifications.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Billing Updates</h2>
                  <div className="space-y-3">
                    {recentBillingNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border ${
                          notification.read
                            ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="ml-4 w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Invoices</h2>
                {invoices.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">No invoices found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatDate(invoice.created)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  invoice.status === 'paid'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : invoice.status === 'open'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {invoice.hostedInvoiceUrl && (
                                <a
                                  href={invoice.hostedInvoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                  View
                                </a>
                              )}
                              {invoice.invoicePdf && (
                                <a
                                  href={invoice.invoicePdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-4 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                  Download PDF
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancel Confirmation Modal */}
          {showCancelConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cancel Subscription</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to cancel your subscription?
                </p>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={cancelAtPeriodEnd}
                      onChange={(e) => setCancelAtPeriodEnd(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Cancel at end of billing period (recommended)
                    </span>
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Keep Subscription
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? 'Cancelling...' : 'Cancel Subscription'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
