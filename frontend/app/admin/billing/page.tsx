"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { adminApi, SubscriptionWithUser, Invoice } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGuard from "@/components/RoleGuard";

export default function AdminBillingPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    "subscriptions" | "invoices" | "refunds"
  >("subscriptions");
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>(
    []
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refundPaymentIntentId, setRefundPaymentIntentId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [cancelingUserId, setCancelingUserId] = useState<string | null>(null);
  const [cancelImmediately, setCancelImmediately] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      if (activeTab === "subscriptions") {
        const data = await adminApi.getAllSubscriptions(page, 20);
        setSubscriptions(data.subscriptions);
        setTotal(data.pagination.total);
      } else if (activeTab === "invoices") {
        const data = await adminApi.getAllInvoices(page, 20);
        setInvoices(data.invoices);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!refundPaymentIntentId) {
      alert("Please enter a payment intent ID");
      return;
    }

    try {
      const amount = refundAmount ? parseFloat(refundAmount) : undefined;
      const result = await adminApi.processRefund(
        refundPaymentIntentId,
        amount,
        refundReason || undefined
      );
      alert(`Refund processed successfully! Refund ID: ${result.id}`);
      setRefundPaymentIntentId("");
      setRefundAmount("");
      setRefundReason("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process refund");
    }
  };

  const handleCancelSubscription = async (userId: string) => {
    if (
      !confirm(
        `Are you sure you want to ${
          cancelImmediately ? "immediately cancel" : "cancel at period end"
        } this subscription?`
      )
    ) {
      return;
    }

    try {
      await adminApi.cancelUserSubscription(userId, cancelImmediately);
      alert("Subscription canceled successfully");
      setCancelingUserId(null);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel subscription");
    }
  };

  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Billing Management
              </h1>
              <a
                href="/admin/dashboard"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
              >
                Back to Dashboard
              </a>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => {
                    setActiveTab("subscriptions");
                    setPage(1);
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "subscriptions"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Subscriptions
                </button>
                <button
                  onClick={() => {
                    setActiveTab("invoices");
                    setPage(1);
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "invoices"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Invoices
                </button>
                <button
                  onClick={() => {
                    setActiveTab("refunds");
                    setPage(1);
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "refunds"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Refunds
                </button>
              </nav>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Loading...
                </p>
              </div>
            ) : (
              <>
                {/* Subscriptions Tab */}
                {activeTab === "subscriptions" && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Period
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {subscriptions.map((item) => (
                          <tr key={item.user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.user.name || "No name"}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {item.user.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.subscription?.plan === "AGENCY"
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                    : item.subscription?.plan === "PRO"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                }`}
                              >
                                {item.subscription?.plan || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.subscription ? (
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    item.subscription.status === "active"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : item.subscription.status === "canceled"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  }`}
                                >
                                  {item.subscription.status}
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  No subscription
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.subscription
                                ? formatCurrency(
                                    item.subscription.amount,
                                    item.subscription.currency
                                  )
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {item.subscription ? (
                                <div>
                                  <div>
                                    {formatDate(
                                      item.subscription.currentPeriodStart
                                    )}
                                  </div>
                                  <div className="text-xs">
                                    to{" "}
                                    {formatDate(
                                      item.subscription.currentPeriodEnd
                                    )}
                                  </div>
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {item.subscription &&
                                item.subscription.status === "active" && (
                                  <button
                                    onClick={() => {
                                      setCancelingUserId(item.user.id);
                                      setCancelImmediately(false);
                                    }}
                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                  >
                                    Cancel
                                  </button>
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {total > 0 && (
                      <div className="px-6 py-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          Showing {(page - 1) * 20 + 1} to{" "}
                          {Math.min(page * 20, total)} of {total} subscriptions
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page * 20 >= total}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Invoices Tab */}
                {activeTab === "invoices" && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {invoice.number || invoice.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {invoice.user ? (
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {invoice.user.name || "No name"}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {invoice.user.email}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Unknown</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  invoice.paid
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : invoice.status === "open"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(invoice.created)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {invoice.hostedInvoiceUrl && (
                                <a
                                  href={invoice.hostedInvoiceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                >
                                  View
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Refunds Tab */}
                {activeTab === "refunds" && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Process Refund
                    </h2>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Payment Intent ID *
                        </label>
                        <input
                          type="text"
                          value={refundPaymentIntentId}
                          onChange={(e) =>
                            setRefundPaymentIntentId(e.target.value)
                          }
                          placeholder="pi_..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Amount (optional - leave empty for full refund)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reason (optional)
                        </label>
                        <select
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select reason</option>
                          <option value="duplicate">Duplicate</option>
                          <option value="fraudulent">Fraudulent</option>
                          <option value="requested_by_customer">
                            Requested by Customer
                          </option>
                        </select>
                      </div>
                      <button
                        onClick={handleProcessRefund}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Process Refund
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Cancel Subscription Modal */}
            {cancelingUserId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Cancel Subscription
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={cancelImmediately}
                          onChange={(e) =>
                            setCancelImmediately(e.target.checked)
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Cancel immediately (otherwise cancels at period end)
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setCancelingUserId(null);
                        setCancelImmediately(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCancelSubscription(cancelingUserId)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      Confirm Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
