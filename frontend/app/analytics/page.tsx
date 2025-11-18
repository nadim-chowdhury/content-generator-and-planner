'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, AnalyticsSummary, PlatformPerformance, CategoryPerformance, ContentAnalytics } from '@/lib/analytics';
import { ideasApi, Idea } from '@/lib/ideas';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import PlatformBadge from '@/components/PlatformBadge';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [platforms, setPlatforms] = useState<PlatformPerformance[]>([]);
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [analytics, setAnalytics] = useState<ContentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'platforms' | 'categories' | 'records'>('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, platformsData, categoriesData, analyticsData, ideasData] = await Promise.all([
        analyticsApi.getSummary(dateFrom || undefined, dateTo || undefined),
        analyticsApi.getAllPlatformsPerformance(),
        analyticsApi.getAllCategoriesPerformance(),
        analyticsApi.getAll(undefined, undefined, dateFrom || undefined, dateTo || undefined),
        ideasApi.getAll('POSTED'),
      ]);
      setSummary(summaryData);
      setPlatforms(platformsData);
      setCategories(categoriesData);
      setAnalytics(analyticsData);
      setIdeas(ideasData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="To"
              />
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                + Add Record
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'platforms', label: 'Platform Performance' },
              { id: 'categories', label: 'Category Performance' },
              { id: 'records', label: 'All Records' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-4 py-2 font-medium ${
                  selectedTab === tab.id
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600 dark:text-gray-400">Loading analytics...</div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {selectedTab === 'overview' && summary && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Posts</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalPosts}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Reach</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {summary.totalReach.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Engagement</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {summary.totalEngagement.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Engagement Rate</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {summary.totalReach > 0
                          ? ((summary.totalEngagement / summary.totalReach) * 100).toFixed(2)
                          : '0.00'}
                        %
                      </div>
                    </div>
                  </div>

                  {/* Top Platforms */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top Platforms</h2>
                    <div className="space-y-3">
                      {summary.platforms
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 5)
                        .map((platform) => (
                          <div key={platform.platform} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <PlatformBadge platform={platform.platform} size="sm" />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{platform.platform}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {platform.totalPosts} posts • {platform.avgReach.toLocaleString()} avg reach
                                </div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full ${getScoreBgColor(platform.score)}`}>
                              <span className={`font-semibold ${getScoreColor(platform.score)}`}>
                                {platform.score}/100
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Top Categories */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top Categories</h2>
                    <div className="space-y-3">
                      {summary.categories
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 5)
                        .map((category) => (
                          <div key={category.category} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{category.category}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {category.totalPosts} posts • {category.avgEngagement.toLocaleString()} avg engagement
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full ${getScoreBgColor(category.score)}`}>
                              <span className={`font-semibold ${getScoreColor(category.score)}`}>
                                {category.score}/100
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Platforms Tab */}
              {selectedTab === 'platforms' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Platform Performance</h2>
                  <div className="space-y-4">
                    {platforms.map((platform) => (
                      <div key={platform.platform} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <PlatformBadge platform={platform.platform} size="md" />
                            <div className={`px-3 py-1 rounded-full ${getScoreBgColor(platform.score)}`}>
                              <span className={`font-semibold ${getScoreColor(platform.score)}`}>
                                Score: {platform.score}/100
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Total Posts</div>
                            <div className="font-semibold text-gray-900 dark:text-white">{platform.totalPosts}</div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Avg Reach</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {platform.avgReach.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Avg Engagement</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {platform.avgEngagement.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Engagement Rate</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {platform.avgEngagementRate.toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Total Engagement</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {platform.totalEngagement.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Tab */}
              {selectedTab === 'categories' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Category Performance</h2>
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category.category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-gray-900 dark:text-white">{category.category}</div>
                          <div className={`px-3 py-1 rounded-full ${getScoreBgColor(category.score)}`}>
                            <span className={`font-semibold ${getScoreColor(category.score)}`}>
                              Score: {category.score}/100
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Total Posts</div>
                            <div className="font-semibold text-gray-900 dark:text-white">{category.totalPosts}</div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Avg Reach</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {category.avgReach.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Avg Engagement</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {category.avgEngagement.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Engagement Rate</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {category.avgEngagementRate.toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Total Engagement</div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {category.totalEngagement.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Records Tab */}
              {selectedTab === 'records' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">All Records</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Platform
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Category
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Reach
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Engagement
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Rate
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Score
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.map((record) => {
                          const engagementRate =
                            record.reach && record.reach > 0
                              ? ((record.engagement || 0) / record.reach) * 100
                              : 0;
                          return (
                            <tr key={record.id} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-3 px-4">
                                <PlatformBadge platform={record.platform} size="sm" />
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                {record.category || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-right text-sm text-gray-900 dark:text-white">
                                {record.reach?.toLocaleString() || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-right text-sm text-gray-900 dark:text-white">
                                {record.engagement?.toLocaleString() || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-right text-sm text-gray-900 dark:text-white">
                                {engagementRate.toFixed(2)}%
                              </td>
                              <td className="py-3 px-4 text-right">
                                {record.platformScore && (
                                  <span className={`font-semibold ${getScoreColor(record.platformScore)}`}>
                                    {record.platformScore}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                {new Date(record.recordedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Add Analytics Modal */}
          {showAddModal && (
            <AddAnalyticsModal
              ideas={ideas}
              onClose={() => setShowAddModal(false)}
              onSave={async () => {
                await loadData();
                setShowAddModal(false);
              }}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function AddAnalyticsModal({
  ideas,
  onClose,
  onSave,
}: {
  ideas: Idea[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    ideaId: '',
    platform: '',
    category: '',
    niche: '',
    reach: '',
    impressions: '',
    engagement: '',
    likes: '',
    comments: '',
    shares: '',
    views: '',
    clicks: '',
    saves: '',
    postedAt: '',
    source: 'MANUAL' as 'MANUAL' | 'API' | 'PREDICTED',
    notes: '',
  });

  const handleSubmit = async () => {
    try {
      await analyticsApi.create({
        ideaId: form.ideaId || undefined,
        platform: form.platform,
        category: form.category || undefined,
        niche: form.niche || undefined,
        reach: form.reach ? parseInt(form.reach) : undefined,
        impressions: form.impressions ? parseInt(form.impressions) : undefined,
        engagement: form.engagement ? parseInt(form.engagement) : undefined,
        likes: form.likes ? parseInt(form.likes) : undefined,
        comments: form.comments ? parseInt(form.comments) : undefined,
        shares: form.shares ? parseInt(form.shares) : undefined,
        views: form.views ? parseInt(form.views) : undefined,
        clicks: form.clicks ? parseInt(form.clicks) : undefined,
        saves: form.saves ? parseInt(form.saves) : undefined,
        postedAt: form.postedAt || undefined,
        source: form.source,
        notes: form.notes || undefined,
      });
      onSave();
    } catch (err) {
      alert('Failed to create analytics record');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Analytics Record</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform *</label>
              <input
                type="text"
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Idea</label>
              <select
                value={form.ideaId}
                onChange={(e) => setForm({ ...form, ideaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">None</option>
                {ideas.map((idea) => (
                  <option key={idea.id} value={idea.id}>
                    {idea.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="MANUAL">Manual</option>
                <option value="API">API</option>
                <option value="PREDICTED">Predicted</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reach</label>
              <input
                type="number"
                value={form.reach}
                onChange={(e) => setForm({ ...form, reach: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Engagement</label>
              <input
                type="number"
                value={form.engagement}
                onChange={(e) => setForm({ ...form, engagement: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Impressions</label>
              <input
                type="number"
                value={form.impressions}
                onChange={(e) => setForm({ ...form, impressions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Likes</label>
              <input
                type="number"
                value={form.likes}
                onChange={(e) => setForm({ ...form, likes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comments</label>
              <input
                type="number"
                value={form.comments}
                onChange={(e) => setForm({ ...form, comments: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shares</label>
              <input
                type="number"
                value={form.shares}
                onChange={(e) => setForm({ ...form, shares: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Views</label>
              <input
                type="number"
                value={form.views}
                onChange={(e) => setForm({ ...form, views: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Posted At</label>
            <input
              type="datetime-local"
              value={form.postedAt}
              onChange={(e) => setForm({ ...form, postedAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

