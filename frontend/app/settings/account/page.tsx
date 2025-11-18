'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hardDelete, setHardDelete] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmDelete !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authApi.deleteAccount(password || undefined, hardDelete);
      clearAuth();
      alert('Your account has been deleted successfully.');
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await authApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Account Settings
          </h1>

          {/* GDPR Data Export */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Data (GDPR)
            </h2>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Export Your Data
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Download a copy of all your personal data in JSON format. This includes your profile,
                  ideas, tasks, analytics, and all other data associated with your account.
                </p>
              </div>

              <button
                onClick={handleExportData}
                disabled={exporting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? 'Exporting...' : 'Export My Data'}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
              Danger Zone
            </h2>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Delete Account (GDPR Compliant)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  You have the right to request deletion of your account and personal data (GDPR Article 17).
                  By default, we anonymize your data to comply with legal requirements. You can choose
                  permanent deletion, but this may violate data retention laws.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> We recommend exporting your data before deletion. 
                    Account deletion is irreversible.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                  Delete Account
                </h3>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>GDPR Notice:</strong> By default, your data will be anonymized (soft delete)
                      to comply with legal and business requirements. Personal identifiers will be removed,
                      but some anonymized data may be retained for legal/audit purposes.
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hardDelete}
                        onChange={(e) => setHardDelete(e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Permanent deletion</strong> - Remove all data completely (may violate data retention laws)
                      </span>
                    </label>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone. This will {hardDelete ? 'permanently delete' : 'anonymize'} your account
                    and all associated data.
                  </p>

                  <div>
                    <label htmlFor="delete-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter your password to confirm (if you have one)
                    </label>
                    <input
                      id="delete-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Your password (optional for social logins)"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type <span className="font-mono font-bold">DELETE</span> to confirm
                    </label>
                    <input
                      id="confirm-delete"
                      type="text"
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                      placeholder="DELETE"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setPassword('');
                      setConfirmDelete('');
                      setHardDelete(false);
                      setError('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading || confirmDelete !== 'DELETE'}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
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

