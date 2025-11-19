"use client";

import { useEffect, useState } from "react";
import {
  userAnalyticsApi,
  UserAnalyticsSummary,
  DailyGenerationCount,
  ViralScoreProgression,
  IdeasByStatus,
  IdeasByPlatform,
} from "@/lib/user-analytics";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import PlatformBadge from "@/components/PlatformBadge";

export default function UserAnalyticsPage() {
  const [summary, setSummary] = useState<UserAnalyticsSummary | null>(null);
  const [ideasByStatus, setIdeasByStatus] = useState<IdeasByStatus | null>(
    null
  );
  const [ideasByPlatform, setIdeasByPlatform] = useState<IdeasByPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, statusData, platformData] = await Promise.all([
        userAnalyticsApi.getSummary(days),
        userAnalyticsApi.getIdeasByStatus(),
        userAnalyticsApi.getIdeasByPlatform(),
      ]);
      setSummary(summaryData);
      setIdeasByStatus(statusData);
      setIdeasByPlatform(platformData);
    } catch (err) {
      console.error("Failed to load user analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Analytics
            </h1>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Days:
              </label>
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
              <div className="text-gray-600 dark:text-gray-400">
                Loading analytics...
              </div>
            </div>
          ) : (
            summary && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Ideas
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.totalIdeas}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Saved Ideas
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.savedIdeas}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Scheduled Posts
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.scheduledPosts}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Posted Content
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.postedContent}
                    </div>
                  </div>
                </div>

                {/* Viral Score Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Average Viral Score
                    </div>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        summary.avgViralScore
                      )}`}
                    >
                      {summary.avgViralScore.toFixed(1)}/100
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Max Viral Score
                    </div>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        summary.maxViralScore
                      )}`}
                    >
                      {summary.maxViralScore}/100
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Generations
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {summary.totalGenerations}
                    </div>
                  </div>
                </div>

                {/* Daily Idea Generation Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Daily Idea Generation Count
                  </h2>
                  <div className="h-64 flex items-end gap-1">
                    {summary.dailyGenerations.map((day, idx) => {
                      const maxCount = Math.max(
                        ...summary.dailyGenerations.map((d) => d.count),
                        1
                      );
                      const height = (day.count / maxCount) * 100;
                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center"
                        >
                          <div
                            className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-t transition-colors cursor-pointer"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${new Date(
                              day.date
                            ).toLocaleDateString()}: ${day.count} ideas`}
                          />
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                            {new Date(day.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Total:{" "}
                    {summary.dailyGenerations.reduce(
                      (sum, d) => sum + d.count,
                      0
                    )}{" "}
                    ideas generated
                  </div>
                </div>

                {/* Viral Score Progression Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Viral Score Progression
                  </h2>
                  <div className="h-64 relative">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 800 200"
                      preserveAspectRatio="none"
                    >
                      {/* Grid lines */}
                      {[0, 25, 50, 75, 100].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={200 - y * 2}
                          x2="800"
                          y2={200 - y * 2}
                          stroke="currentColor"
                          strokeWidth="0.5"
                          className="text-gray-300 dark:text-gray-700"
                        />
                      ))}
                      {/* Average score line */}
                      {summary.viralScoreProgression.filter((d) => d.count > 0)
                        .length > 0 && (
                        <polyline
                          points={summary.viralScoreProgression
                            .filter((d) => d.count > 0)
                            .map((d, idx, arr) => {
                              const x = (idx / (arr.length - 1 || 1)) * 800;
                              const y = 200 - d.avgScore * 2;
                              return `${x},${y}`;
                            })
                            .join(" ")}
                          fill="none"
                          stroke="#6366F1"
                          strokeWidth="2"
                        />
                      )}
                      {/* Max score line */}
                      {summary.viralScoreProgression.filter((d) => d.count > 0)
                        .length > 0 && (
                        <polyline
                          points={summary.viralScoreProgression
                            .filter((d) => d.count > 0)
                            .map((d, idx, arr) => {
                              const x = (idx / (arr.length - 1 || 1)) * 800;
                              const y = 200 - d.maxScore * 2;
                              return `${x},${y}`;
                            })
                            .join(" ")}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      )}
                    </svg>
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      {summary.viralScoreProgression
                        .filter(
                          (_, idx) =>
                            idx %
                              Math.ceil(
                                summary.viralScoreProgression.length / 10
                              ) ===
                            0
                        )
                        .map((d, idx) => (
                          <span key={idx}>
                            {new Date(d.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-indigo-600"></div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Average Score
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-green-500 border-dashed border-t-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Max Score
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Ideas with scores:{" "}
                    {summary.viralScoreProgression.reduce(
                      (sum, d) => sum + d.count,
                      0
                    )}
                  </div>
                </div>

                {/* Ideas by Status */}
                {ideasByStatus && (
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Ideas by Status
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {ideasByStatus.draft}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Draft
                        </div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                          {ideasByStatus.scheduled}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          Scheduled
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded">
                        <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                          {ideasByStatus.posted}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Posted
                        </div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
                          {ideasByStatus.archived}
                        </div>
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">
                          Archived
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ideas by Platform */}
                {ideasByPlatform.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Ideas by Platform
                    </h2>
                    <div className="space-y-3">
                      {ideasByPlatform
                        .sort((a, b) => b.count - a.count)
                        .map((item) => {
                          const percentage = ideasByStatus
                            ? (item.count / ideasByStatus.total) * 100
                            : 0;
                          return (
                            <div key={item.platform}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <PlatformBadge
                                    platform={item.platform}
                                    size="sm"
                                  />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.count} ideas
                                  </span>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
