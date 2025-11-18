'use client';

import { useState, useEffect } from 'react';
import { affiliatesApi, AffiliateDashboard } from '@/lib/affiliates';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AffiliatesPage() {
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null);
  const [affiliateLink, setAffiliateLink] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if user is affiliate
      try {
        const [dashboardData, linkData] = await Promise.all([
          affiliatesApi.getDashboard(),
          affiliatesApi.getAffiliateLink(),
        ]);
        setDashboard(dashboardData);
        setAffiliateLink(linkData.link);
      } catch (err: any) {
        if (err.response?.status === 400) {
          // User is not an affiliate, show apply button
          setDashboard(null);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      await affiliatesApi.applyForAffiliate();
      alert('Affiliate application submitted! Please wait for admin approval.');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to apply for affiliate');
    }
  };

  const handleRequestPayout = async () => {
    if (!paymentMethod || !paymentDetails) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const result = await affiliatesApi.requestPayout(paymentMethod, paymentDetails);
      alert(`Payout requested successfully! Amount: $${result.amount.toFixed(2)}`);
      setShowPayoutModal(false);
      setPaymentMethod('');
      setPaymentDetails('');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to request payout');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Affiliate Dashboard
          </h1>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          ) : !dashboard ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Become an Affiliate
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Join our affiliate program and earn commissions for every referral that subscribes!
              </p>
              <button
                onClick={handleApply}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Apply to Become an Affiliate
              </button>
            </div>
          ) : !dashboard.approved ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                Application Pending
              </h2>
              <p className="text-yellow-800 dark:text-yellow-300">
                Your affiliate application is pending approval. You'll be able to access your dashboard once approved.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Affiliate Link */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Your Affiliate Link
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={affiliateLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(affiliateLink)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Share this link to earn commissions when users sign up and subscribe!
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Earned</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(dashboard.stats.totalEarned)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Paid</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(dashboard.stats.totalPaid)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available</p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(dashboard.stats.availableForPayout)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Commissions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {dashboard.stats.totalCommissions}
                  </p>
                </div>
              </div>

              {/* Request Payout Button */}
              {dashboard.stats.availableForPayout > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Available for Payout
                      </h3>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                        {formatCurrency(dashboard.stats.availableForPayout)}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPayoutModal(true)}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Request Payout
                    </button>
                  </div>
                </div>
              )}

              {/* Commissions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Commissions
                  </h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Order ID
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
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {dashboard.commissions.map((commission) => (
                      <tr key={commission.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {commission.orderId || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(commission.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            commission.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            commission.status === 'APPROVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            commission.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(commission.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payouts */}
              {dashboard.payouts.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Payout History
                    </h2>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Requested
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {dashboard.payouts.map((payout) => (
                        <tr key={payout.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(payout.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payout.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              payout.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              payout.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {payout.paymentMethod || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(payout.requestedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payout Modal */}
          {showPayoutModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Request Payout
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select method</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Stripe">Stripe</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Details *
                    </label>
                    <textarea
                      value={paymentDetails}
                      onChange={(e) => setPaymentDetails(e.target.value)}
                      placeholder="Enter your payment account details (e.g., PayPal email, bank account)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowPayoutModal(false);
                      setPaymentMethod('');
                      setPaymentDetails('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestPayout}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Request Payout
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

