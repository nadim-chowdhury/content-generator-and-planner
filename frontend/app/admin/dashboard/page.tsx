'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { adminApi, AdminStats } from '@/lib/admin';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['ADMIN']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Admin Dashboard
            </h1>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading stats...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.users.total}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Free Users</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.users.free}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pro Users</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.users.pro}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Agency Users</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.users.agency}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin Users</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.users.admin}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Verified Users</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.users.verified}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Ideas</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.ideas.total}</p>
                </div>
              </div>
            ) : null}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="/admin/users"
                  className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-center"
                >
                  Manage Users
                </a>
                <a
                  href="/admin/teams"
                  className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-center"
                >
                  Manage Teams
                </a>
              </div>
            </div>
          </div>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}

