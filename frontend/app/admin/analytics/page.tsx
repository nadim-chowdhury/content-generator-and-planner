'use client';

import { useEffect, useState } from 'react';
import { adminAnalyticsApi, BusinessAnalyticsSummary } from '@/lib/admin-analytics';
import { adminApi } from '@/lib/admin';
import Navbar from '@/components/Navbar';
import AdminRoute from '@/components/AdminRoute';

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<BusinessAnalyticsSummary | null>(null);
  const [dau, setDau] = useState<number>(0);
  const [mau, setMau] = useState<number>(0);
  const [dauTrend, setDauTrend] = useState<Array<{ date: string; count: number }>>([]);
  const [mauTrend, setMauTrend] = useState<Array<{ month: string; count: number }>>([]);
  const [ltv, setLtv] = useState<any>(null);
  const [socialMetrics, setSocialMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, dauData, mauData, dauTrendData, mauTrendData, ltvData, socialData] = await Promise.all([
        adminAnalyticsApi.getBusinessAnalytics(days),
        adminApi.getDailyActiveUsers(),
        adminApi.getMonthlyActiveUsers(),
        adminApi.getDailyActiveUsersTrend(30),
        adminApi.getMonthlyActiveUsersTrend(12),
        adminApi.getLTV(),
        adminApi.getSocialSharingMetrics(30),
      ]);
      setSummary(summaryData);
      setDau(dauData.count);
      setMau(mauData.count);
      setDauTrend(dauTrendData);
      setMauTrend(mauTrendData);
      setLtv(ltvData);
      setSocialMetrics(socialData);
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
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Daily Active Users</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {dau.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">DAU</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Active Users</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {mau.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">MAU</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Recurring Revenue</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(summary.mrr)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">MRR</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average LTV</div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {ltv ? formatCurrency(ltv.averageLTV) : '$0'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lifetime Value</div>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Social Shares</div>
                  <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {socialMetrics?.totalShares?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 30 days</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Users</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.activeUsers.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    of {summary.totalUsers.toLocaleString()} total
                  </div>
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

              {/* DAU Trend */}
              {dauTrend.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Daily Active Users Trend</h2>
                  <div className="h-64 flex items-end gap-1">
                    {dauTrend.map((day, idx) => {
                      const maxCount = Math.max(...dauTrend.map(d => d.count), 1);
                      const height = (day.count / maxCount) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-blue-600 hover:bg-blue-700 rounded-t transition-colors cursor-pointer"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${day.date}: ${day.count} users`}
                          />
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MAU Trend */}
              {mauTrend.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Monthly Active Users Trend</h2>
                  <div className="h-64 flex items-end gap-2">
                    {mauTrend.map((month, idx) => {
                      const maxCount = Math.max(...mauTrend.map(m => m.count), 1);
                      const height = (month.count / maxCount) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-purple-600 hover:bg-purple-700 rounded-t transition-colors cursor-pointer"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${month.month}: ${month.count} users`}
                          />
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                            {month.month}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LTV Breakdown */}
              {ltv && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Lifetime Value (LTV)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Average LTV</p>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(ltv.averageLTV)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Median LTV</p>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(ltv.medianLTV)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total LTV</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(ltv.totalLTV)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">By Plan</p>
                      <div className="text-sm text-gray-900 dark:text-white mt-2">
                        <div>Pro: {formatCurrency(ltv.byPlan?.PRO || 0)}</div>
                        <div>Agency: {formatCurrency(ltv.byPlan?.AGENCY || 0)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Sharing Metrics */}
              {socialMetrics && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Social Sharing Metrics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Shares by Platform</h3>
                      <div className="space-y-2">
                        {socialMetrics.sharesByPlatform?.map((platform: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{platform.platform}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{platform.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Top Shared Ideas</h3>
                      <div className="space-y-2">
                        {socialMetrics.topSharedIdeas?.slice(0, 5).map((idea: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{idea.title}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{idea.shares} shares</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

