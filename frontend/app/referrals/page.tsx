'use client';

import { useState, useEffect } from 'react';
import { referralsApi, ReferralStats, LeaderboardEntry } from '@/lib/referrals';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Copy, 
  CheckCircle2,
  Trophy,
  Gift,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [codeData, linkData, statsData, leaderboardData] = await Promise.all([
        referralsApi.getReferralCode(),
        referralsApi.getReferralLink(),
        referralsApi.getReferralStats(),
        referralsApi.getLeaderboard(20),
      ]);

      setReferralCode(codeData.code);
      setReferralLink(linkData.link);
      setStats(statsData);
      setLeaderboard(leaderboardData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'REWARDED') return 'default';
    if (status === 'CONVERTED') return 'secondary';
    return 'outline';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">
              Referral Program
            </h1>
          </div>
          <p className="text-muted-foreground">
            Refer friends and earn credits for every successful referral
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Referral Link Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Your Referral Link
                </CardTitle>
                <CardDescription>
                  Share your referral link to earn credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Referral Code</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={referralCode}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      onClick={() => copyToClipboard(referralCode)}
                      variant="outline"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Referral Link</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={referralLink}
                      readOnly
                    />
                    <Button
                      onClick={() => copyToClipboard(referralLink)}
                      variant="outline"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>How it works:</strong> Share your referral link with friends. When they sign up, you both earn credits!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Stats Section */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Referrals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.totalReferrals}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Converted</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {stats.convertedReferrals}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Pending</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {stats.pendingReferrals}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Credits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {stats.totalCreditsEarned}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Referrals List */}
            {stats && stats.referrals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Credits Earned</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.referrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell>
                            {referral.referredUser ? (
                              <div>
                                <div className="font-medium">
                                  {referral.referredUser.name || 'No name'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {referral.referredUser.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Pending signup</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(referral.status)}>
                              {referral.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {referral.creditsEarned}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(referral.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Referral Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboard.map((entry) => (
                      <div key={entry.userId} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">
                              #{entry.rank}
                            </span>
                          </div>
                          {entry.profileImage ? (
                            <img
                              src={entry.profileImage}
                              alt={entry.name || entry.email}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground">
                                {entry.name?.charAt(0) || entry.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {entry.name || 'No name'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.email}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {entry.totalReferrals} referrals
                          </div>
                          <div className="text-sm text-primary">
                            {entry.totalCredits} credits
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
