"use client";

import { useEffect, useState } from "react";
import {
  notificationsApi,
  Notification,
  NotificationPreferences,
} from "@/lib/notifications";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    loadData();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [unreadOnly]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadNotifications(), loadPreferences()]);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.getAll(unreadOnly);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const loadPreferences = async () => {
    try {
      const data = await notificationsApi.getPreferences();
      setPreferences(data);
    } catch (err) {
      console.error("Failed to load preferences:", err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      await loadNotifications();
    } catch (err) {
      alert("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      await loadNotifications();
    } catch (err) {
      alert("Failed to mark all notifications as read");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      await loadNotifications();
    } catch (err) {
      alert("Failed to delete notification");
    }
  };

  const handleUpdatePreferences = async () => {
    if (!preferences) return;
    try {
      await notificationsApi.updatePreferences(preferences);
      setShowPreferences(false);
      alert("Preferences updated successfully!");
    } catch (err) {
      alert("Failed to update preferences");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "UPCOMING_CONTENT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "TASK_REMINDER":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "DEADLINE_ALERT":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "SYSTEM":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "ACHIEVEMENT":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {unreadCount} unread notification
                  {unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`px-4 py-2 rounded-md ${
                  unreadOnly
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {unreadOnly ? "Show All" : "Unread Only"}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Settings
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600 dark:text-gray-400">
                Loading notifications...
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600 dark:text-gray-400">
                {unreadOnly ? "No unread notifications" : "No notifications"}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow ${
                    !notification.read ? "border-l-4 border-indigo-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                            notification.category
                          )}`}
                        >
                          {notification.category.replace("_", " ")}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preferences Modal */}
          {showPreferences && preferences && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Notification Channels
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">
                          Email Notifications
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.emailEnabled}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              emailEnabled: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">
                          Push Notifications
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.pushEnabled}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              pushEnabled: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">
                          In-App Notifications
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.inAppEnabled}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              inAppEnabled: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Notification Types
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">
                          Upcoming Content Alerts
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.upcomingContentAlerts}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              upcomingContentAlerts: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">
                          Task Reminders
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.taskReminders}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              taskReminders: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">
                          Deadline Alerts
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.deadlineAlerts}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              deadlineAlerts: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">
                          System Notifications
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.systemNotifications}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              systemNotifications: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">
                          Achievement Alerts
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.achievementAlerts}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              achievementAlerts: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Email Reminder Hours
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Send email reminders this many hours before deadlines
                      (comma-separated):
                    </p>
                    <input
                      type="text"
                      value={preferences.emailReminderHours.join(", ")}
                      onChange={(e) => {
                        const hours = e.target.value
                          .split(",")
                          .map((h) => parseInt(h.trim()))
                          .filter((h) => !isNaN(h));
                        setPreferences({
                          ...preferences,
                          emailReminderHours: hours,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="24, 2"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => {
                      setShowPreferences(false);
                      loadPreferences();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePreferences}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Save Preferences
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
