"use client";

import { useState, useEffect } from "react";
import {
  infrastructureApi,
  Backup,
  BackupStats,
  BaseBackup,
  DdosStats,
} from "@/lib/infrastructure";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGuard from "@/components/RoleGuard";

export default function InfrastructurePage() {
  const [activeTab, setActiveTab] = useState<"ddos" | "backups" | "pitr">(
    "backups"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // DDOS Stats
  const [ddosStats, setDdosStats] = useState<DdosStats | null>(null);

  // Backup Stats
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [creatingBackup, setCreatingBackup] = useState(false);

  // PITR Stats
  const [baseBackups, setBaseBackups] = useState<BaseBackup[]>([]);
  const [walStats, setWalStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "ddos") {
        const stats = await infrastructureApi.getDdosStats();
        setDdosStats(stats);
      } else if (activeTab === "backups") {
        const [backupsList, stats] = await Promise.all([
          infrastructureApi.listBackups(),
          infrastructureApi.getBackupStats(),
        ]);
        setBackups(backupsList);
        setBackupStats(stats);
      } else if (activeTab === "pitr") {
        const [baseBackupsList, walStatsData] = await Promise.all([
          infrastructureApi.listBaseBackups(),
          infrastructureApi.getWalArchiveStats(),
        ]);
        setBaseBackups(baseBackupsList);
        setWalStats(walStatsData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async (
    type: "daily" | "weekly" | "monthly" | "manual" = "manual"
  ) => {
    if (!confirm(`Create ${type} backup?`)) return;

    setCreatingBackup(true);
    setError("");
    try {
      await infrastructureApi.createBackup(type);
      await loadData();
      alert("Backup created successfully!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create backup");
    } finally {
      setCreatingBackup(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Infrastructure Management
            </h1>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-8">
                {(["ddos", "backups", "pitr"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                  >
                    {tab === "ddos"
                      ? "DDOS Protection"
                      : tab === "pitr"
                      ? "PITR"
                      : "Backups"}
                  </button>
                ))}
              </nav>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                {/* DDOS Protection Tab */}
                {activeTab === "ddos" && ddosStats && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      DDOS Protection Statistics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Active Blocks
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {ddosStats.activeBlocks}
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Tracked IPs
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {ddosStats.trackedIPs}
                        </div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Suspicious IPs
                        </div>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {ddosStats.suspiciousIPs}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        DDOS protection is active and monitoring all incoming
                        requests.
                      </p>
                      <p>
                        Rate limits: 100 requests/minute, 1000 requests/hour per
                        IP
                      </p>
                    </div>
                  </div>
                )}

                {/* Backups Tab */}
                {activeTab === "backups" && (
                  <div className="space-y-6">
                    {/* Backup Stats */}
                    {backupStats && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold">
                            Backup Statistics
                          </h2>
                          <button
                            onClick={() => handleCreateBackup("manual")}
                            disabled={creatingBackup}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {creatingBackup ? "Creating..." : "Create Backup"}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Total Backups
                            </div>
                            <div className="text-2xl font-bold">
                              {backupStats.totalBackups}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Total Size
                            </div>
                            <div className="text-2xl font-bold">
                              {formatBytes(backupStats.totalSize)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Daily
                            </div>
                            <div className="text-2xl font-bold">
                              {backupStats.dailyBackups}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Weekly
                            </div>
                            <div className="text-2xl font-bold">
                              {backupStats.weeklyBackups}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Backup List */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold">
                          Backup History
                        </h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Filename
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Size
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Created
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {backups.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-6 py-4 text-center text-gray-500"
                                >
                                  No backups found
                                </td>
                              </tr>
                            ) : (
                              backups.map((backup) => (
                                <tr key={backup.filename}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {backup.filename}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      {backup.type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {formatBytes(backup.size)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(backup.createdAt)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* PITR Tab */}
                {activeTab === "pitr" && (
                  <div className="space-y-6">
                    {/* WAL Stats */}
                    {walStats && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold">
                            WAL Archive Statistics
                          </h2>
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  "Create base backup? This may take a while."
                                )
                              ) {
                                setLoading(true);
                                try {
                                  await infrastructureApi.createBaseBackup();
                                  await loadData();
                                  alert("Base backup created successfully!");
                                } catch (err: any) {
                                  setError(
                                    err.response?.data?.message ||
                                      "Failed to create base backup"
                                  );
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Create Base Backup
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Total WAL Files
                            </div>
                            <div className="text-2xl font-bold">
                              {walStats.totalFiles}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Total Size
                            </div>
                            <div className="text-2xl font-bold">
                              {formatBytes(walStats.totalSize)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Base Backups */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold">Base Backups</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Path
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Created
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                WAL Location
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Size
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {baseBackups.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-6 py-4 text-center text-gray-500"
                                >
                                  No base backups found
                                </td>
                              </tr>
                            ) : (
                              baseBackups.map((backup, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 text-sm font-medium">
                                    {backup.path}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(backup.timestamp)}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {backup.walLocation}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {formatBytes(backup.size)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
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
