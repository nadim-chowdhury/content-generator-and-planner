'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import TwoFactorSetup from '@/components/TwoFactorSetup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Smartphone, 
  Monitor, 
  LogIn, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      const ua = session.userAgent.toLowerCase();
      if (ua.includes('mobile')) return 'Mobile Device';
      if (ua.includes('tablet')) return 'Tablet';
      return 'Desktop';
    }
    return 'Unknown Device';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account security and active sessions
            </p>
          </div>

          <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {twoFactorEnabled ? (
                  <div className="space-y-4">
                    <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">2FA is enabled</div>
                            <div className="text-sm">Your account is protected with two-factor authentication</div>
                          </div>
                          <Button variant="destructive" size="sm" onClick={handleDisable2FA}>
                            Disable
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                      <Button onClick={() => setShow2FASetup(true)}>
                        <Shield className="w-4 h-4 mr-2" />
                        Enable 2FA
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-primary" />
                      Active Sessions
                    </CardTitle>
                    <CardDescription>
                      Manage devices that are currently signed in
                    </CardDescription>
                  </div>
                  {sessions.length > 1 && (
                    <Button variant="destructive" size="sm" onClick={handleRevokeAllSessions}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Revoke All Other Sessions
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active sessions
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <Card key={session.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Monitor className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{getDeviceInfo(session)}</span>
                              {session.id === sessions[0]?.id && (
                                <Badge variant="secondary" className="text-xs">Current</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {session.ipAddress && <div>IP: {session.ipAddress}</div>}
                              {session.userAgent && (
                                <div className="truncate max-w-md">
                                  {session.userAgent.substring(0, 80)}...
                                </div>
                              )}
                              <div>
                                Last active: {new Date(session.lastActivity || session.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {sessions.length > 1 && session.id !== sessions[0]?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeSession(session.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Login Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-primary" />
                  Login Activity
                </CardTitle>
                <CardDescription>
                  Recent login attempts and authentication events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No login activity
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            {new Date(activity.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {activity.loginType}
                          </TableCell>
                          <TableCell>
                            {activity.success ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="w-3 h-3" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {activity.deviceInfo || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {activity.ipAddress || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
