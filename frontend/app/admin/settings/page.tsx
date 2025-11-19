'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';

export default function PlatformSettingsPage() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'quotas' | 'stripe' | 'api-keys'>('tokens');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quotaSettings, setQuotaSettings] = useState<any>({});
  const [stripeSettings, setStripeSettings] = useState<any>({});

  useEffect(() => {
    loadSettings();
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');

      if (activeTab === 'tokens') {
        const data = await adminApi.getAiTokenUsage();
        setSettings(data);
      } else if (activeTab === 'quotas') {
        const data = await adminApi.getQuotaSettings();
        setQuotaSettings(data);
        setSettings(data);
      } else if (activeTab === 'stripe') {
        const data = await adminApi.getStripeProductIds();
        setStripeSettings(data);
        setSettings(data);
      } else if (activeTab === 'api-keys') {
        const data = await adminApi.getApiKeysStatus();
        setSettings(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuota = async (plan: 'free' | 'pro' | 'agency', field: 'dailyGenerations' | 'monthlyGenerations', value: number) => {
    try {
      const updates = { [field]: value };
      await adminApi.updateQuotaSettings(plan, updates);
      await loadSettings();
      alert('Quota settings updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update quota settings');
    }
  };

  const formatNumber = (num: number) => {
    if (num === -1) return 'Unlimited';
    return num.toLocaleString();
  };

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['ADMIN']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Platform Settings
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
                {(['tokens', 'quotas', 'stripe', 'api-keys'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.replace('-', ' ')}
                  </button>
                ))}
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
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
              </div>
            ) : (
              <>
                {/* AI Token Usage */}
                {activeTab === 'tokens' && settings && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      AI Token Usage
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Used</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {settings.totalUsed?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          of {settings.totalLimit?.toLocaleString() || 0} tokens
                        </p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                            className="bg-indigo-600 h-2.5 rounded-full"
                            style={{ width: `${Math.min(settings.usagePercentage || 0, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Month</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {settings.currentMonth?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          of {settings.monthlyLimit?.toLocaleString() || 0} tokens
                        </p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${Math.min(settings.monthlyUsagePercentage || 0, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quotas */}
                {activeTab === 'quotas' && settings && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Quota Settings
                    </h2>
                    <div className="space-y-6">
                      {(['free', 'pro', 'agency'] as const).map((plan) => (
                        <div key={plan} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                            {plan} Plan
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Daily Generations
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={settings[plan]?.dailyGenerations === -1 ? '' : settings[plan]?.dailyGenerations || 0}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? -1 : parseInt(e.target.value, 10);
                                    setQuotaSettings({
                                      ...quotaSettings,
                                      [plan]: { ...settings[plan], dailyGenerations: value },
                                    });
                                  }}
                                  placeholder="Unlimited"
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                                />
                                <button
                                  onClick={() => handleUpdateQuota(plan, 'dailyGenerations', quotaSettings[plan]?.dailyGenerations || 0)}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                  Update
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Monthly Generations
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={settings[plan]?.monthlyGenerations === -1 ? '' : settings[plan]?.monthlyGenerations || 0}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? -1 : parseInt(e.target.value, 10);
                                    setQuotaSettings({
                                      ...quotaSettings,
                                      [plan]: { ...settings[plan], monthlyGenerations: value },
                                    });
                                  }}
                                  placeholder="Unlimited"
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                                />
                                <button
                                  onClick={() => handleUpdateQuota(plan, 'monthlyGenerations', quotaSettings[plan]?.monthlyGenerations || 0)}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                  Update
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stripe Product IDs */}
                {activeTab === 'stripe' && settings && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Stripe Product IDs
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Pro Monthly Price ID
                        </label>
                        <input
                          type="text"
                          value={stripeSettings.proMonthlyPriceId || ''}
                          onChange={(e) => setStripeSettings({ ...stripeSettings, proMonthlyPriceId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Pro Yearly Price ID
                        </label>
                        <input
                          type="text"
                          value={stripeSettings.proYearlyPriceId || ''}
                          onChange={(e) => setStripeSettings({ ...stripeSettings, proYearlyPriceId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Agency Price ID
                        </label>
                        <input
                          type="text"
                          value={stripeSettings.agencyPriceId || ''}
                          onChange={(e) => setStripeSettings({ ...stripeSettings, agencyPriceId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await adminApi.updateStripeProductIds(stripeSettings);
                            alert('Stripe product IDs updated (requires environment variable update)');
                          } catch (err: any) {
                            alert(err.response?.data?.message || 'Failed to update');
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Update Stripe IDs
                      </button>
                    </div>
                  </div>
                )}

                {/* API Keys */}
                {activeTab === 'api-keys' && settings && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      API Keys Status
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          OpenAI API Key
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {settings.openai || 'Not configured'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Stripe Secret Key
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {settings.stripe || 'Not configured'}
                        </p>
                      </div>
                      {settings.hasOtherKeys && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Other API keys are configured (Google, Facebook, GitHub, etc.)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}


