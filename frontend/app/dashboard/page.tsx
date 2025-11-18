'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { ideasApi, Idea, IdeaStats } from '@/lib/ideas';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

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
      const ideas = await ideasApi.generate(formData);
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

        {/* Generate Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Generate Ideas
          </h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Niche
              </label>
              <input
                type="text"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                placeholder="e.g., fitness, tech, cooking"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option>TikTok</option>
                  <option>YouTube</option>
                  <option>Instagram</option>
                  <option>Twitter</option>
                  <option>Facebook</option>
                  <option>LinkedIn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tone
                </label>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option>motivational</option>
                  <option>humorous</option>
                  <option>educational</option>
                  <option>entertaining</option>
                  <option>inspirational</option>
                  <option>casual</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={generating}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate 10 Ideas'}
            </button>
          </form>
        </div>

        {/* Generated Ideas */}
        {generatedIdeas.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Generated Ideas ({generatedIdeas.length})
            </h2>
            <div className="space-y-4">
              {generatedIdeas.map((idea, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {idea.title}
                    </h3>
                    <button
                      onClick={() => handleSaveIdea(idea)}
                      className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Save
                    </button>
                  </div>
                  {idea.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {idea.description}
                    </p>
                  )}
                  {idea.script && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-line">
                      {idea.script}
                    </div>
                  )}
                  {idea.caption && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {idea.caption}
                    </p>
                  )}
                  {idea.hashtags && idea.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {idea.hashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
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

