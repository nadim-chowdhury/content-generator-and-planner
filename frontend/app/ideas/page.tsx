'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { ideasApi, Idea } from '@/lib/ideas';
import { exportToCSV, exportToText, copyAllToClipboard } from '@/lib/export';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Idea>>({});
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    loadIdeas();
  }, [filter]);

  const loadIdeas = async () => {
    try {
      const data = await ideasApi.getAll(filter || undefined);
      setIdeas(data);
    } catch (err) {
      console.error('Failed to load ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    try {
      await ideasApi.delete(id);
      await loadIdeas();
    } catch (err) {
      alert('Failed to delete idea');
    }
  };

  const handleCopy = (idea: Idea) => {
    const text = `${idea.title}\n\n${idea.description || ''}\n\n${idea.script || ''}\n\n${idea.caption || ''}\n\n${idea.hashtags?.join(' ') || ''}`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleEdit = (idea: Idea) => {
    setEditingId(idea.id);
    setEditForm({
      title: idea.title,
      description: idea.description,
      script: idea.script,
      caption: idea.caption,
      hashtags: idea.hashtags,
      platform: idea.platform,
      niche: idea.niche,
      tone: idea.tone,
      duration: idea.duration,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await ideasApi.update(editingId, editForm);
      setEditingId(null);
      setEditForm({});
      await loadIdeas();
      alert('Idea updated successfully!');
    } catch (err) {
      alert('Failed to update idea');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ideas Library</h1>
          <div className="flex gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Ideas</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="POSTED">Posted</option>
            </select>
            {ideas.length > 0 && (
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Export
              </button>
            )}
          </div>
        </div>

        {ideas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No ideas yet. Generate some from the dashboard!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {idea.title}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                    {idea.platform}
                  </span>
                </div>

                {idea.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {idea.description}
                  </p>
                )}

                {idea.script && (
                  <details className="mb-3">
                    <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Script
                    </summary>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-line">
                      {idea.script}
                    </p>
                  </details>
                )}

                {idea.caption && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>Caption:</strong> {idea.caption}
                  </p>
                )}

                {idea.hashtags && idea.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
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

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(idea)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleEdit(idea)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  {idea.scheduledAt && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(idea.scheduledAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Idea</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Script
                  </label>
                  <textarea
                    value={editForm.script || ''}
                    onChange={(e) => setEditForm({ ...editForm, script: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Caption
                  </label>
                  <textarea
                    value={editForm.caption || ''}
                    onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hashtags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editForm.hashtags?.join(', ') || ''}
                    onChange={(e) => setEditForm({ ...editForm, hashtags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Platform
                    </label>
                    <select
                      value={editForm.platform || ''}
                      onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tone
                    </label>
                    <select
                      value={editForm.tone || ''}
                      onChange={(e) => setEditForm({ ...editForm, tone: e.target.value })}
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
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Export Ideas</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Export {ideas.length} idea{ideas.length !== 1 ? 's' : ''} in your preferred format.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    exportToCSV(ideas);
                    setShowExportModal(false);
                  }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    exportToText(ideas);
                    setShowExportModal(false);
                  }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Export as Text
                </button>
                <button
                  onClick={() => {
                    copyAllToClipboard(ideas);
                    setShowExportModal(false);
                    alert('All ideas copied to clipboard!');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Copy All to Clipboard
                </button>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="mt-4 w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
      )}
    </ProtectedRoute>
  );
}

