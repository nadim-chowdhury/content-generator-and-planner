'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, AnalyticsSummary, PlatformPerformance, CategoryPerformance, ContentAnalytics } from '@/lib/analytics';
import { ideasApi, Idea } from '@/lib/ideas';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import PlatformBadge from '@/components/PlatformBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart3, 
  Plus, 
  TrendingUp, 
  Calendar,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [platforms, setPlatforms] = useState<PlatformPerformance[]>([]);
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [analytics, setAnalytics] = useState<ContentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'platforms' | 'categories' | 'records'>('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, platformsData, categoriesData, analyticsData, ideasData] = await Promise.all([
        analyticsApi.getSummary(dateFrom || undefined, dateTo || undefined),
        analyticsApi.getAllPlatformsPerformance(),
        analyticsApi.getAllCategoriesPerformance(),
        analyticsApi.getAll(undefined, undefined, dateFrom || undefined, dateTo || undefined),
        ideasApi.getAll('POSTED'),
      ]);
      setSummary(summaryData);
      setPlatforms(platformsData);
      setCategories(categoriesData);
      setAnalytics(analyticsData);
      setIdeas(ideasData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
              <p className="text-muted-foreground mt-1">
                Track and analyze your content performance
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
                placeholder="From"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
                placeholder="To"
              />
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="platforms">Platform Performance</TabsTrigger>
              <TabsTrigger value="categories">Category Performance</TabsTrigger>
              <TabsTrigger value="records">All Records</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <>
                <TabsContent value="overview" className="space-y-6">
                  {summary && (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Total Posts</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{summary.totalPosts}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Total Reach</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{summary.totalReach.toLocaleString()}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Total Engagement</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{summary.totalEngagement.toLocaleString()}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardDescription>Avg Engagement Rate</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {summary.totalReach > 0
                                ? ((summary.totalEngagement / summary.totalReach) * 100).toFixed(2)
                                : '0.00'}
                              %
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Top Platforms */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Top Platforms
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {summary.platforms
                              .sort((a, b) => b.engagementRate - a.engagementRate)
                              .slice(0, 5)
                              .map((platform) => (
                                <div key={platform.platform} className="flex items-center justify-between p-3 rounded-lg border">
                                  <div className="flex items-center gap-3">
                                    <PlatformBadge platform={platform.platform} size="sm" />
                                    <div>
                                      <div className="font-medium">{platform.platform}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {platform.totalPosts} posts • {platform.avgReach.toLocaleString()} avg reach
                                      </div>
                                    </div>
                                  </div>
                                  <Badge variant={getScoreVariant(platform.engagementRate * 100)}>
                                    {platform.engagementRate.toFixed(1)}%
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Top Categories */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Top Categories</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {summary.categories
                              .sort((a, b) => b.engagementRate - a.engagementRate)
                              .slice(0, 5)
                              .map((category) => (
                                <div key={category.category} className="flex items-center justify-between p-3 rounded-lg border">
                                  <div>
                                    <div className="font-medium">{category.category}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {category.totalPosts} posts • {category.avgEngagement.toLocaleString()} avg engagement
                                    </div>
                                  </div>
                                  <Badge variant={getScoreVariant(category.engagementRate * 100)}>
                                    {category.engagementRate.toFixed(1)}%
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="platforms" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {platforms.map((platform) => (
                          <Card key={platform.platform} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <PlatformBadge platform={platform.platform} size="md" />
                                <Badge variant={getScoreVariant(platform.engagementRate * 100)}>
                                  Engagement: {platform.engagementRate.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Total Posts</div>
                                <div className="font-semibold">{platform.totalPosts}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Avg Reach</div>
                                <div className="font-semibold">{platform.avgReach.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Avg Engagement</div>
                                <div className="font-semibold">{platform.avgEngagement.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Engagement Rate</div>
                                <div className="font-semibold">{platform.engagementRate.toFixed(2)}%</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Total Engagement</div>
                                <div className="font-semibold">{platform.totalEngagement.toLocaleString()}</div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categories.map((category) => (
                          <Card key={category.category} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-semibold">{category.category}</div>
                              <Badge variant={getScoreVariant(category.engagementRate * 100)}>
                                Engagement: {category.engagementRate.toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Total Posts</div>
                                <div className="font-semibold">{category.totalPosts}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Avg Reach</div>
                                <div className="font-semibold">{category.avgReach.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Avg Engagement</div>
                                <div className="font-semibold">{category.avgEngagement.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Engagement Rate</div>
                                <div className="font-semibold">{category.engagementRate.toFixed(2)}%</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Total Engagement</div>
                                <div className="font-semibold">{category.totalEngagement.toLocaleString()}</div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="records">
                  <Card>
                    <CardHeader>
                      <CardTitle>All Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Platform</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Reach</TableHead>
                              <TableHead className="text-right">Engagement</TableHead>
                              <TableHead className="text-right">Rate</TableHead>
                              <TableHead className="text-right">Score</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analytics.map((record) => {
                              const engagementRate =
                                record.reach && record.reach > 0
                                  ? ((record.engagement || 0) / record.reach) * 100
                                  : 0;
                              return (
                                <TableRow key={record.id}>
                                  <TableCell>
                                    <PlatformBadge platform={record.platform} size="sm" />
                                  </TableCell>
                                  <TableCell>{record.category || 'N/A'}</TableCell>
                                  <TableCell className="text-right">{record.reach?.toLocaleString() || 'N/A'}</TableCell>
                                  <TableCell className="text-right">{record.engagement?.toLocaleString() || 'N/A'}</TableCell>
                                  <TableCell className="text-right">{engagementRate.toFixed(2)}%</TableCell>
                                  <TableCell className="text-right">
                                    {record.engagement && record.reach && (
                                      <Badge variant={getScoreVariant((record.engagement / record.reach) * 100)}>
                                        {((record.engagement / record.reach) * 100).toFixed(1)}%
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>{new Date(record.recordedAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>

          {/* Add Analytics Modal */}
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Analytics Record</DialogTitle>
                <DialogDescription>
                  Record performance metrics for your content
                </DialogDescription>
              </DialogHeader>
              <AddAnalyticsForm
                ideas={ideas}
                onClose={() => setShowAddModal(false)}
                onSave={async () => {
                  await loadData();
                  setShowAddModal(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function AddAnalyticsForm({
  ideas,
  onClose,
  onSave,
}: {
  ideas: Idea[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    ideaId: '',
    platform: '',
    category: '',
    reach: '',
    engagement: '',
    likes: '',
    comments: '',
    shares: '',
    views: '',
    clicks: '',
    source: 'MANUAL' as 'MANUAL' | 'API' | 'PREDICTED',
  });

  const handleSubmit = async () => {
    if (!form.ideaId) {
      alert('Please select an idea');
      return;
    }
    try {
      await analyticsApi.create({
        ideaId: form.ideaId,
        platform: form.platform,
        category: form.category || undefined,
        reach: form.reach ? parseInt(form.reach) : undefined,
        engagement: form.engagement ? parseInt(form.engagement) : undefined,
        likes: form.likes ? parseInt(form.likes) : undefined,
        comments: form.comments ? parseInt(form.comments) : undefined,
        shares: form.shares ? parseInt(form.shares) : undefined,
        views: form.views ? parseInt(form.views) : undefined,
        clicks: form.clicks ? parseInt(form.clicks) : undefined,
      });
      onSave();
    } catch (err) {
      alert('Failed to create analytics record');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Platform *</Label>
          <Input
            value={form.platform}
            onChange={(e) => setForm({ ...form, platform: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Idea</Label>
          <Select value={form.ideaId} onValueChange={(value) => setForm({ ...form, ideaId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {ideas.map((idea) => (
                <SelectItem key={idea.id} value={idea.id}>
                  {idea.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Source</Label>
          <Select value={form.source} onValueChange={(value) => setForm({ ...form, source: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MANUAL">Manual</SelectItem>
              <SelectItem value="API">API</SelectItem>
              <SelectItem value="PREDICTED">Predicted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Reach</Label>
          <Input
            type="number"
            value={form.reach}
            onChange={(e) => setForm({ ...form, reach: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Engagement</Label>
          <Input
            type="number"
            value={form.engagement}
            onChange={(e) => setForm({ ...form, engagement: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Views</Label>
          <Input
            type="number"
            value={form.views}
            onChange={(e) => setForm({ ...form, views: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Likes</Label>
          <Input
            type="number"
            value={form.likes}
            onChange={(e) => setForm({ ...form, likes: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Comments</Label>
          <Input
            type="number"
            value={form.comments}
            onChange={(e) => setForm({ ...form, comments: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Shares</Label>
          <Input
            type="number"
            value={form.shares}
            onChange={(e) => setForm({ ...form, shares: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Clicks</Label>
          <Input
            type="number"
            value={form.clicks}
            onChange={(e) => setForm({ ...form, clicks: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Save Record
        </Button>
      </DialogFooter>
    </div>
  );
}
