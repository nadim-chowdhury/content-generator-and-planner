'use client';

import { useEffect, useState } from 'react';
import { adminAnalyticsApi, BusinessAnalyticsSummary } from '@/lib/admin-analytics';
import Navbar from '@/components/Navbar';
import AdminRoute from '@/components/AdminRoute';

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<BusinessAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminAnalyticsApi.getBusinessAnalytics(days);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load business analytics:', err);
      alert('Failed to load analytics. Make sure you have admin access.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRateColor = (rate: number, isPositive: boolean = false) => {
    if (isPositive) {
      if (rate >= 5) return 'text-green-600 dark:text-green-400';
      if (rate >= 2) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    } else {
      if (rate <= 2) return 'text-green-600 dark:text-green-400';
      if (rate <= 5) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Analytics</h1>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Time Period:</label>
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 180 days</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600 dark:text-gray-400">Loading analytics...</div>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Users</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.activeUsers.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    of {summary.totalUsers.toLocaleString()} total
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Recurring Revenue</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(summary.mrr)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">MRR</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Annual Recurring Revenue</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(summary.arr)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">ARR</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</div>
                  <div className={`text-2xl font-bold ${getRateColor(summary.conversionRate, true)}`}>
                    {summary.conversionRate.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Free → Pro</div>
                </div>
              </div>

              {/* Churn and Conversion */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Churn Rate</div>
                  <div className={`text-3xl font-bold ${getRateColor(summary.churnRate)}`}>
                    {summary.churnRate.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {summary.recentChurns} users downgraded in last {days} days
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recent Conversions</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {summary.recentConversions}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Users upgraded in last {days} days
                  </div>
                </div>
              </div>

              {/* Daily Signups Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Daily Signups</h2>
                <div className="h-64 flex items-end gap-1">
                  {summary.dailySignups.map((day, idx) => {
                    const maxCount = Math.max(...summary.dailySignups.map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-t transition-colors cursor-pointer"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${new Date(day.date).toLocaleDateString()}: ${day.count} signups`}
                        />
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Total: {summary.dailySignups.reduce((sum, d) => sum + d.count, 0)} signups
                </div>
              </div>

              {/* Plan Distribution */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Plan Distribution</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.planDistribution.free}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Free</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {summary.totalUsers > 0
                        ? ((summary.planDistribution.free / summary.totalUsers) * 100).toFixed(1)
                        : '0'}
                      %
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                      {summary.planDistribution.pro}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Pro</div>
                    <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                      {summary.totalUsers > 0
                        ? ((summary.planDistribution.pro / summary.totalUsers) * 100).toFixed(1)
                        : '0'}
                      %
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                      {summary.planDistribution.agency}
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Agency</div>
                    <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                      {summary.totalUsers > 0
                        ? ((summary.planDistribution.agency / summary.totalUsers) * 100).toFixed(1)
                        : '0'}
                      %
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Niches Trending */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top Niches Trending</h2>
                <div className="space-y-3">
                  {summary.topNiches.map((niche, idx) => {
                    const maxCount = Math.max(...summary.topNiches.map(n => n.count), 1);
                    const width = (niche.count / maxCount) * 100;
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              #{idx + 1} {niche.niche}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {niche.count} ideas
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {niche.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400">Failed to load analytics</div>
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}

