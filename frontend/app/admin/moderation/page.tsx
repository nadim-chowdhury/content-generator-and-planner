'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';

export default function ContentModerationPage() {
  const [activeTab, setActiveTab] = useState<'flagged' | 'blacklist'>('flagged');
  const [flaggedIdeas, setFlaggedIdeas] = useState<any[]>([]);
  const [blacklistKeywords, setBlacklistKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [newKeyword, setNewKeyword] = useState({ keyword: '', category: 'GENERAL', severity: 'MEDIUM', action: 'FLAG' });
  const [reviewingFlag, setReviewingFlag] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'BLOCKED' | 'IGNORED' | 'DELETED'>('BLOCKED');

  useEffect(() => {
    loadData();
  }, [activeTab, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      if (activeTab === 'flagged') {
        const data = await adminApi.getFlaggedIdeas(page, 20);
        setFlaggedIdeas(data.flags);
        setTotal(data.pagination.total);
      } else {
        const data = await adminApi.getBlacklistKeywords(page, 50);
        setBlacklistKeywords(data.keywords);
        setTotal(data.pagination.total);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewFlag = async (flagId: string) => {
    try {
      await adminApi.reviewFlag(flagId, reviewAction);
      alert(`Flag reviewed: ${reviewAction}`);
      setReviewingFlag(null);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to review flag');
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.keyword.trim()) {
      alert('Please enter a keyword');
      return;
    }

    try {
      await adminApi.addBlacklistKeyword(newKeyword.keyword, newKeyword.category, newKeyword.severity, newKeyword.action);
      setNewKeyword({ keyword: '', category: 'GENERAL', severity: 'MEDIUM', action: 'FLAG' });
      await loadData();
      alert('Keyword added successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add keyword');
    }
  };

  const handleDeleteKeyword = async (keywordId: string) => {
    if (!confirm('Are you sure you want to delete this keyword?')) {
      return;
    }

    try {
      await adminApi.deleteBlacklistKeyword(keywordId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete keyword');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['ADMIN']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Content Moderation
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
                    setActiveTab('flagged');
                    setPage(1);
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'flagged'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Flagged Ideas
                </button>
                <button
                  onClick={() => {
                    setActiveTab('blacklist');
                    setPage(1);
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'blacklist'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Blacklist Keywords
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
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            ) : (
              <>
                {/* Flagged Ideas */}
                {activeTab === 'flagged' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Idea
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Reason
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {flaggedIdeas.map((flag) => (
                          <tr key={flag.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {flag.ideaTitle}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {flag.userEmail}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {flag.reason}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                {flag.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {flag.reviewed ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Reviewed ({flag.action})
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {!flag.reviewed && (
                                <button
                                  onClick={() => setReviewingFlag(flag.id)}
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                >
                                  Review
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
                          Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} flags
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setPage(p => p + 1)}
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

                {/* Blacklist Keywords */}
                {activeTab === 'blacklist' && (
                  <>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Add Keyword
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                          type="text"
                          placeholder="Keyword"
                          value={newKeyword.keyword}
                          onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                        <select
                          value={newKeyword.category}
                          onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                        >
                          <option value="GENERAL">General</option>
                          <option value="SPAM">Spam</option>
                          <option value="ABUSIVE">Abusive</option>
                          <option value="INAPPROPRIATE">Inappropriate</option>
                          <option value="COPYRIGHT">Copyright</option>
                        </select>
                        <select
                          value={newKeyword.severity}
                          onChange={(e) => setNewKeyword({ ...newKeyword, severity: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                        <button
                          onClick={handleAddKeyword}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Add Keyword
                        </button>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Keyword
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Severity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {blacklistKeywords.map((keyword) => (
                            <tr key={keyword.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {keyword.keyword}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                  {keyword.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  keyword.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  keyword.severity === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  keyword.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                  {keyword.severity}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {keyword.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {keyword.enabled ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Enabled
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                    Disabled
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleDeleteKeyword(keyword.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Review Flag Modal */}
            {reviewingFlag && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Review Flag
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Action
                      </label>
                      <select
                        value={reviewAction}
                        onChange={(e) => setReviewAction(e.target.value as 'BLOCKED' | 'IGNORED' | 'DELETED')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                      >
                        <option value="BLOCKED">Block</option>
                        <option value="IGNORED">Ignore</option>
                        <option value="DELETED">Delete</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      onClick={() => setReviewingFlag(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReviewFlag(reviewingFlag)}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      Confirm
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


