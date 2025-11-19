"use client";

import { useState, useEffect } from "react";
import { authApi, Session } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await authApi.getSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session?")) {
      return;
    }

    try {
      setRevoking(sessionId);
      await authApi.revokeSession(sessionId);
      await loadSessions();

      // If current session was revoked, logout
      const currentSession = sessions.find(
        (s) => s.isCurrent && s.id === sessionId
      );
      if (currentSession) {
        clearAuth();
        router.push("/login");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to revoke session");
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (
      !confirm(
        "Are you sure you want to revoke all other sessions? You will be logged out from all devices except this one."
      )
    ) {
      return;
    }

    try {
      setRevoking("all");
      await authApi.revokeAllSessions();
      await loadSessions();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to revoke sessions");
    } finally {
      setRevoking(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleString();
  };

  const getDeviceInfo = (session: Session) => {
    if (session.deviceInfo) return session.deviceInfo;
    if (session.userAgent) {
      // Simple user agent parsing
      const ua = session.userAgent;
      if (ua.includes("Chrome")) return "Chrome Browser";
      if (ua.includes("Firefox")) return "Firefox Browser";
      if (ua.includes("Safari")) return "Safari Browser";
      if (ua.includes("Edge")) return "Edge Browser";
      return "Unknown Device";
    }
    return "Unknown Device";
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Active Sessions</h1>
            <div className="text-center py-8">Loading sessions...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Active Sessions</h1>
            <p className="text-gray-600">
              Manage your active sessions. Revoke any session you don't
              recognize.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="font-semibold">
                  Your Sessions ({sessions.length})
                </h2>
                <p className="text-sm text-gray-600">
                  All active sessions across your devices
                </p>
              </div>
              {sessions.length > 1 && (
                <button
                  onClick={handleRevokeAllSessions}
                  disabled={revoking === "all"}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {revoking === "all"
                    ? "Revoking..."
                    : "Revoke All Other Sessions"}
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-200">
              {sessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No active sessions found.
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      session.isCurrent
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {getDeviceInfo(session)}
                            {session.isCurrent && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                Current Session
                              </span>
                            )}
                          </h3>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {session.ipAddress && (
                            <div>
                              <span className="font-medium">IP Address:</span>{" "}
                              {session.ipAddress}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Last Active:</span>{" "}
                            {formatDate(session.lastUsedAt)}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>{" "}
                            {formatDate(session.createdAt)}
                          </div>
                          {session.expiresAt && (
                            <div>
                              <span className="font-medium">Expires:</span>{" "}
                              {formatDate(session.expiresAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revoking === session.id}
                          className="ml-4 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {revoking === session.id ? "Revoking..." : "Revoke"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">
              Security Tips
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Review all active sessions regularly</li>
              <li>Revoke sessions from devices you no longer use</li>
              <li>
                If you see an unfamiliar session, revoke it immediately and
                change your password
              </li>
              <li>
                Use strong, unique passwords and enable 2FA for better security
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
