"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  settingsApi,
  WorkspaceSettings,
  UpdateWorkspaceSettingsDto,
} from "@/lib/settings";
import Navbar from "@/components/Navbar";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (teamId) {
      loadSettings();
    }
  }, [teamId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getWorkspaceSettings(teamId);
      setSettings(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load workspace settings"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updates: Partial<UpdateWorkspaceSettingsDto>) => {
    if (!settings) return;

    try {
      setSaving(true);
      setError("");
      setSuccess(false);
      const updated = await settingsApi.updateWorkspaceSettings(
        teamId,
        updates
      );
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading workspace settings...</div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-red-600 dark:text-red-400">
            {error || "Settings not found"}
          </div>
        </div>
      </div>
    );
  }

  const scheduleDays = settings.defaultPostingSchedule?.days || [];
  const scheduleTimes = settings.defaultPostingSchedule?.times || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Workspace Settings
          </h1>
          <button
            onClick={() => router.back()}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded mb-6">
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* Brand Identity */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Brand Identity
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={settings.brandName || ""}
                  onChange={(e) => handleSave({ brandName: e.target.value })}
                  placeholder="Your brand name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Colors
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Primary
                    </label>
                    <input
                      type="color"
                      value={settings.brandColors?.primary || "#667eea"}
                      onChange={(e) =>
                        handleSave({
                          brandColors: {
                            ...settings.brandColors,
                            primary: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Secondary
                    </label>
                    <input
                      type="color"
                      value={settings.brandColors?.secondary || "#764ba2"}
                      onChange={(e) =>
                        handleSave({
                          brandColors: {
                            ...settings.brandColors,
                            secondary: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Accent
                    </label>
                    <input
                      type="color"
                      value={settings.brandColors?.accent || "#f093fb"}
                      onChange={(e) =>
                        handleSave({
                          brandColors: {
                            ...settings.brandColors,
                            accent: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-700"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Logo URL
                </label>
                <input
                  type="url"
                  value={settings.brandLogo || ""}
                  onChange={(e) => handleSave({ brandLogo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Font
                </label>
                <input
                  type="text"
                  value={settings.brandFont || ""}
                  onChange={(e) => handleSave({ brandFont: e.target.value })}
                  placeholder="Arial, sans-serif"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* Default Posting Schedule */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Default Posting Schedule
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Timezone
                </label>
                <select
                  value={settings.defaultTimeZone}
                  onChange={(e) =>
                    handleSave({ defaultTimeZone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posting Days
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayLower = day.toLowerCase();
                    const isSelected = scheduleDays.includes(dayLower);
                    return (
                      <label
                        key={day}
                        className="flex items-center justify-center p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        style={{
                          backgroundColor: isSelected
                            ? "rgba(99, 102, 241, 0.1)"
                            : "transparent",
                          borderColor: isSelected ? "#6366f1" : undefined,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...scheduleDays, dayLower]
                              : scheduleDays.filter((d) => d !== dayLower);
                            handleSave({
                              defaultPostingSchedule: {
                                ...settings.defaultPostingSchedule,
                                days: newDays,
                              },
                            });
                          }}
                          className="sr-only"
                        />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {day.slice(0, 3)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posting Times
                </label>
                <div className="flex flex-wrap gap-2">
                  {scheduleTimes.map((time, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...scheduleTimes];
                          newTimes[index] = e.target.value;
                          handleSave({
                            defaultPostingSchedule: {
                              ...settings.defaultPostingSchedule,
                              times: newTimes,
                            },
                          });
                        }}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => {
                          const newTimes = scheduleTimes.filter(
                            (_, i) => i !== index
                          );
                          handleSave({
                            defaultPostingSchedule: {
                              ...settings.defaultPostingSchedule,
                              times: newTimes,
                            },
                          });
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      handleSave({
                        defaultPostingSchedule: {
                          ...settings.defaultPostingSchedule,
                          times: [...scheduleTimes, "09:00"],
                        },
                      });
                    }}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    + Add Time
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Team Permissions */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Team Permissions
            </h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowViewersToComment}
                  onChange={(e) =>
                    handleSave({ allowViewersToComment: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Allow viewers to comment
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowEditorsToSchedule}
                  onChange={(e) =>
                    handleSave({ allowEditorsToSchedule: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Allow editors to schedule content
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowEditorsToPublish}
                  onChange={(e) =>
                    handleSave({ allowEditorsToPublish: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Allow editors to publish content
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireApprovalForPublishing}
                  onChange={(e) =>
                    handleSave({
                      requireApprovalForPublishing: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Require approval before publishing
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoScheduleEnabled}
                  onChange={(e) =>
                    handleSave({ autoScheduleEnabled: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable auto-scheduling
                </span>
              </label>
            </div>
          </section>

          {/* Content Guidelines */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Content Guidelines
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Guidelines
                </label>
                <textarea
                  value={settings.contentGuidelines || ""}
                  onChange={(e) =>
                    handleSave({ contentGuidelines: e.target.value })
                  }
                  placeholder="Enter content guidelines for your team..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hashtag Policy
                </label>
                <textarea
                  value={settings.hashtagPolicy || ""}
                  onChange={(e) =>
                    handleSave({ hashtagPolicy: e.target.value })
                  }
                  placeholder="Enter hashtag usage policy..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
