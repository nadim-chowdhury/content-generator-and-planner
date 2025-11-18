'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { billingApi, SubscriptionStatus } from '@/lib/billing';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function BillingPage() {
  const { user, updateUser } = useAuthStore();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await billingApi.getStatus();
      setStatus(data);
      if (data.plan !== user?.plan) {
        updateUser({ plan: data.plan });
      }
    } catch (err) {
      console.error('Failed to load billing status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      const { url } = await billingApi.createCheckout();
      window.location.href = url;
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create checkout session');
      setProcessing(false);
    }
  };

  const handleManage = async () => {
    setProcessing(true);
    try {
      const { url } = await billingApi.createPortal();
      window.location.href = url;
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to open billing portal');
      setProcessing(false);
    }
  };

  const isPro = user?.plan === 'PRO' || user?.plan === 'AGENCY';

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Billing</h1>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Current Plan
          </h2>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.plan || 'FREE'}
              </div>
              {status?.active && status.currentPeriodEnd && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Renews on {new Date(status.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
            {isPro ? (
              <button
                onClick={handleManage}
                disabled={processing}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {processing ? 'Loading...' : 'Manage Subscription'}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={processing}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Upgrade to Pro'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${!isPro ? 'border-2 border-indigo-500' : ''}`}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Free</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">$0<span className="text-lg">/month</span></div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>✓ 5 idea generations per day</li>
              <li>✓ Save ideas to library</li>
              <li>✓ Basic export</li>
              <li>✗ Calendar scheduling</li>
              <li>✗ Unlimited generations</li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${isPro ? 'border-2 border-indigo-500' : ''}`}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Pro</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">$10<span className="text-lg">/month</span></div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>✓ Unlimited idea generations</li>
              <li>✓ Save ideas to library</li>
              <li>✓ Calendar scheduling</li>
              <li>✓ CSV export</li>
              <li>✓ Custom templates</li>
            </ul>
            {!isPro && (
              <button
                onClick={handleUpgrade}
                disabled={processing}
                className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Upgrade Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
      )}
    </ProtectedRoute>
  );
}

