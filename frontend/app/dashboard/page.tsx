'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { ideasApi, Idea, IdeaStats, GenerateIdeasDto } from '@/lib/ideas';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import IdeaCard from '@/components/IdeaCard';
import PlatformSelector from '@/components/PlatformSelector';
import LanguageSelector from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Lightbulb, Calendar, Clock, X } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<IdeaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);
  const [formData, setFormData] = useState({
    niche: '',
    platform: 'TikTok',
    tone: 'motivational',
    count: 10,
    additionalContext: '',
    language: 'en',
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await ideasApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.niche.trim()) return;

    setGenerating(true);
    try {
      const generateDto: GenerateIdeasDto = {
        niche: formData.niche,
        platform: formData.platform,
        tone: formData.tone,
        count: formData.count,
        additionalContext: formData.additionalContext || undefined,
        language: formData.language,
      };
      const ideas = await ideasApi.generate(generateDto);
      setGeneratedIdeas(ideas);
      await loadStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate ideas');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveIdea = async (idea: Idea) => {
    try {
      await ideasApi.create(idea);
      alert('Idea saved!');
      await loadStats();
    } catch (err) {
      alert('Failed to save idea');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Generate and manage your content ideas
            </p>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Ideas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Saved</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.saved}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Scheduled</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.scheduled}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Today Generated</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayGenerated}</div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Idea Generator Form */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle>Generate Content Ideas</CardTitle>
              </div>
              <CardDescription>
                Create AI-powered content ideas tailored to your niche and platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="niche">Niche</Label>
                  <Input
                    id="niche"
                    type="text"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    placeholder="e.g., Fitness, Cooking, Tech Reviews"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <PlatformSelector
                      value={formData.platform}
                      onChange={(platform) => setFormData({ ...formData, platform })}
                      showInfo={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Select
                      value={formData.tone}
                      onValueChange={(value) => setFormData({ ...formData, tone: value })}
                    >
                      <SelectTrigger id="tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motivational">Motivational</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="entertaining">Entertaining</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="trendy">Trendy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="count">Number of Ideas (10-30)</Label>
                    <Input
                      id="count"
                      type="number"
                      min="10"
                      max="30"
                      value={formData.count}
                      onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <LanguageSelector
                      value={formData.language}
                      onChange={(language) => setFormData({ ...formData, language })}
                      showPopular={true}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Additional Context (Optional)</Label>
                  <Textarea
                    id="context"
                    value={formData.additionalContext}
                    onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
                    rows={3}
                    placeholder="Any specific requirements, target audience, or additional context..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={generating} size="lg">
                  {generating ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Generating {formData.count} Ideas...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate {formData.count} Ideas
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Generated Ideas */}
          {generatedIdeas.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      Generated Ideas ({generatedIdeas.length})
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Review and save your favorite ideas
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGeneratedIdeas([])}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {generatedIdeas.map((idea, idx) => (
                    <IdeaCard
                      key={idea.id || idx}
                      idea={idea}
                      onSave={handleSaveIdea}
                      showActions={true}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
