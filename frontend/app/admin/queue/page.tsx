"use client";

import { useState, useEffect } from "react";
import { queueApi, QueueStats } from "@/lib/queue";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGuard from "@/components/RoleGuard";

export default function QueueManagementPage() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setError("");
      const data = await queueApi.getQueueStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load queue stats");
    } finally {
      setLoading(false);
    }
  };

  const QueueCard = ({
    title,
    stats: queueStats,
  }: {
    title: string;
    stats: QueueStats[keyof QueueStats];
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Waiting
          </p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {queueStats.waiting || 0}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Active
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {queueStats.active || 0}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Completed
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {queueStats.completed || 0}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Failed
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {queueStats.failed || 0}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Delayed
          </p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {queueStats.delayed || 0}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Queue Management
              </h1>
              <a
                href="/admin/dashboard"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
              >
                Back to Dashboard
              </a>
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
                  Loading queue stats...
                </p>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                <QueueCard
                  title="Posting Reminders"
                  stats={stats.postingReminders}
                />
                <QueueCard title="Quota Reset" stats={stats.quotaReset} />
                <QueueCard
                  title="Batch Generations"
                  stats={stats.batchGenerations}
                />
                <QueueCard
                  title="Analytics Aggregation"
                  stats={stats.analytics}
                />
                <QueueCard title="Email" stats={stats.email} />
                <QueueCard
                  title="Trial Expiration"
                  stats={stats.trialExpiration}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No queue stats available
                </p>
              </div>
            )}
          </div>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
