'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import TwoFactorSetup from '@/components/TwoFactorSetup';

export default function SecuritySettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sessionsData, activitiesData] = await Promise.all([
        authApi.getSessions(),
        authApi.getLoginActivities(50),
      ]);
      setSessions(sessionsData);
      setActivities(activitiesData);
      setTwoFactorEnabled(user?.twoFactorEnabled || false);
    } catch (err) {
      console.error('Failed to load security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return;
    }

    try {
      await authApi.disable2FA();
      setTwoFactorEnabled(false);
      updateUser({ twoFactorEnabled: false });
      alert('2FA disabled successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) {
      return;
    }

    try {
      await authApi.revokeSession(sessionId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to revoke all other sessions? You will be logged out from all other devices.')) {
      return;
    }

    try {
      await authApi.revokeAllSessions();
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to revoke sessions');
    }
  };

  const getDeviceInfo = (session: any) => {
    if (session.deviceInfo) {
      return session.deviceInfo;
    }
    if (session.userAgent) {
      // Simple device detection from user agent
      const ua = session.userAgent.toLowerCase();
      if (ua.includes('mobile')) return 'Mobile Device';
      if (ua.includes('tablet')) return 'Tablet';
      return 'Desktop';
    }
    return 'Unknown Device';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Security Settings
          </h1>

          {/* Two-Factor Authentication */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Two-Factor Authentication
            </h2>

            {twoFactorEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      2FA is enabled
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your account is protected with two-factor authentication
                    </p>
                  </div>
                  <button
                    onClick={handleDisable2FA}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Disable
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add an extra layer of security to your account
                </p>
                {show2FASetup ? (
                  <TwoFactorSetup
                    onComplete={() => {
                      setShow2FASetup(false);
                      setTwoFactorEnabled(true);
                      updateUser({ twoFactorEnabled: true });
                      loadData();
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setShow2FASetup(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    Enable 2FA
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Active Sessions
              </h2>
              {sessions.length > 1 && (
                <button
                  onClick={handleRevokeAllSessions}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Revoke All Other Sessions
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No active sessions
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getDeviceInfo(session)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {session.ipAddress && `IP: ${session.ipAddress}`}
                        {session.ipAddress && session.userAgent && ' • '}
                        {session.userAgent && session.userAgent.substring(0, 50)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Last active: {new Date(session.lastActivity || session.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="ml-4 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Login Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Login Activity
            </h2>

            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading activity...
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No login activity
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Device
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {activities.map((activity) => (
                      <tr key={activity.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(activity.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {activity.loginType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {activity.success ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Success
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {activity.deviceInfo || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {activity.ipAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


