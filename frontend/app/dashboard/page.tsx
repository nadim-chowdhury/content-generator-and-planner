'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { ideasApi, Idea, IdeaStats, GenerateIdeasDto } from '@/lib/ideas';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import IdeaCard from '@/components/IdeaCard';
import PlatformSelector from '@/components/PlatformSelector';
import LanguageSelector from '@/components/LanguageSelector';

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
      await loadStats(); // Refresh stats
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
      {loading ? (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Dashboard
            </h1>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Ideas</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Saved</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.saved}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.scheduled}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Today</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.todayGenerated}
                  </div>
                </div>
              </div>
            )}

            {/* Idea Generator Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Generate Content Ideas
              </h2>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Niche
                  </label>
                  <input
                    type="text"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Fitness, Cooking, Tech Reviews"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <PlatformSelector
                    value={formData.platform}
                    onChange={(platform) => setFormData({ ...formData, platform })}
                    showInfo={true}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tone
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="motivational">Motivational</option>
                      <option value="humorous">Humorous</option>
                      <option value="educational">Educational</option>
                      <option value="entertaining">Entertaining</option>
                      <option value="inspirational">Inspirational</option>
                      <option value="casual">Casual</option>
                      <option value="professional">Professional</option>
                      <option value="trendy">Trendy</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Ideas (10-30)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="30"
                      value={formData.count}
                      onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <LanguageSelector
                    value={formData.language}
                    onChange={(language) => setFormData({ ...formData, language })}
                    showPopular={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    value={formData.additionalContext}
                    onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Any specific requirements, target audience, or additional context..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generating ? `Generating ${formData.count} Ideas...` : `Generate ${formData.count} Ideas`}
                </button>
              </form>
            </div>

            {/* Generated Ideas */}
            {generatedIdeas.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Generated Ideas ({generatedIdeas.length})
                  </h2>
                  <button
                    onClick={() => setGeneratedIdeas([])}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Clear All
                  </button>
                </div>
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
              </div>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
