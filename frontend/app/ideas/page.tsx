'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { ideasApi, Idea } from '@/lib/ideas';
import { exportToCSV, exportToText, copyAllToClipboard, exportToPDF, exportToGoogleSheets, exportToNotion } from '@/lib/export';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import IdeaCard from '@/components/IdeaCard';
import PlatformBadge from '@/components/PlatformBadge';
import LanguageBadge from '@/components/LanguageBadge';
import FolderManager from '@/components/FolderManager';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Idea>>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [availableFolders, setAvailableFolders] = useState<any[]>([]);
  
  // Date filters
  const [createdAtFrom, setCreatedAtFrom] = useState<string>('');
  const [createdAtTo, setCreatedAtTo] = useState<string>('');
  const [scheduledAtFrom, setScheduledAtFrom] = useState<string>('');
  const [scheduledAtTo, setScheduledAtTo] = useState<string>('');
  
  // Viral score filters
  const [viralScoreMin, setViralScoreMin] = useState<number | undefined>(undefined);
  const [viralScoreMax, setViralScoreMax] = useState<number | undefined>(undefined);
  
  // Show advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadIdeas();
    loadTags();
    loadFolders();
  }, [filter, platformFilter, languageFilter, folderFilter, searchQuery, tagFilter, createdAtFrom, createdAtTo, scheduledAtFrom, scheduledAtTo, viralScoreMin, viralScoreMax]);

  const loadIdeas = async () => {
    try {
      const params: any = {};
      if (filter) params.status = filter;
      if (platformFilter) params.platform = platformFilter;
      if (languageFilter) params.language = languageFilter;
      if (folderFilter !== null) params.folderId = folderFilter;
      if (searchQuery) params.search = searchQuery;
      if (tagFilter.length > 0) params.tags = tagFilter.join(',');
      
      const data = await ideasApi.getAll(
        filter || undefined,
        platformFilter || undefined,
        searchQuery || undefined,
        languageFilter || undefined
      );
      
      // Filter by folder and tags on client side if needed
      let filteredData = data;
      if (folderFilter !== null) {
        filteredData = filteredData.filter(idea => 
          folderFilter === 'null' ? !idea.folderId : idea.folderId === folderFilter
        );
      }
      if (tagFilter.length > 0) {
        filteredData = filteredData.filter(idea => {
          const ideaTags = [...(idea.categoryTags || []), ...(idea.customTags || [])];
          return tagFilter.some(tag => ideaTags.includes(tag));
        });
      }
      
      setIdeas(filteredData);
    } catch (err) {
      console.error('Failed to load ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await ideasApi.getAllTags();
      setAllTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const loadFolders = async () => {
    try {
      const folders = await ideasApi.getFolders();
      setAvailableFolders(folders);
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  };

  const handleSelectIdea = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIdeas);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIdeas(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIdeas.size === ideas.length) {
      setSelectedIdeas(new Set());
    } else {
      setSelectedIdeas(new Set(ideas.map(idea => idea.id)));
    }
  };

  const handleBulkOperation = async (operation: 'DELETE' | 'ARCHIVE' | 'UNARCHIVE' | 'MOVE' | 'EXPORT', folderId?: string, exportFormat?: 'json' | 'csv' | 'text') => {
    if (selectedIdeas.size === 0) {
      alert('Please select at least one idea');
      return;
    }

    if (operation === 'DELETE' && !confirm(`Are you sure you want to delete ${selectedIdeas.size} idea(s)?`)) {
      return;
    }

    try {
      if (operation === 'EXPORT') {
        const selectedIdeasList = ideas.filter(idea => selectedIdeas.has(idea.id));
        if (exportFormat === 'csv') {
          exportToCSV(selectedIdeasList);
        } else if (exportFormat === 'text') {
          exportToText(selectedIdeasList);
        } else {
          const dataStr = JSON.stringify(selectedIdeasList, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ideas-${new Date().toISOString()}.json`;
          link.click();
        }
        setSelectedIdeas(new Set());
        setBulkMode(false);
        return;
      }

      await ideasApi.bulkOperations(
        Array.from(selectedIdeas),
        operation,
        folderId,
        exportFormat
      );
      
      setSelectedIdeas(new Set());
      setBulkMode(false);
      setShowBulkMoveModal(false);
      await loadIdeas();
      alert(`${selectedIdeas.size} idea(s) ${operation.toLowerCase()}d successfully`);
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${operation.toLowerCase()} ideas`);
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

  const handleDuplicate = async (id: string) => {
    try {
      await ideasApi.duplicate(id);
      await loadIdeas();
      alert('Idea duplicated successfully!');
    } catch (err) {
      alert('Failed to duplicate idea');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await ideasApi.archive(id);
      await loadIdeas();
      alert('Idea archived successfully!');
    } catch (err) {
      alert('Failed to archive idea');
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await ideasApi.unarchive(id);
      await loadIdeas();
      alert('Idea unarchived successfully!');
    } catch (err) {
      alert('Failed to unarchive idea');
    }
  };

  const handleEdit = (idea: Idea) => {
    setEditingId(idea.id);
    setEditForm({
      title: idea.title,
      description: idea.description,
      hook: idea.hook,
      script: idea.script,
      caption: idea.caption,
      hashtags: idea.hashtags,
      categoryTags: idea.categoryTags,
      customTags: idea.customTags,
      platform: idea.platform,
      niche: idea.niche,
      tone: idea.tone,
      duration: idea.duration,
      viralScore: idea.viralScore,
      thumbnailSuggestion: idea.thumbnailSuggestion,
      platformOptimization: idea.platformOptimization,
      language: idea.language,
      folderId: idea.folderId,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await ideasApi.update(editingId, editForm);
      setEditingId(null);
      setEditForm({});
      await loadIdeas();
      await loadTags();
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sticky top-4">
                  <FolderManager
                    onFolderSelect={(folderId) => setFolderFilter(folderId)}
                    selectedFolderId={folderFilter}
                    onFolderCreated={() => {
                      loadFolders();
                      loadIdeas();
                    }}
                  />
                  
                  {/* Tags Filter */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tags</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {allTags.map((tag) => (
                        <label key={tag} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tagFilter.includes(tag)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTagFilter([...tagFilter, tag]);
                              } else {
                                setTagFilter(tagFilter.filter(t => t !== tag));
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{tag}</span>
                        </label>
                      ))}
                      {allTags.length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">No tags yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ideas Library</h1>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setBulkMode(!bulkMode);
                          if (bulkMode) {
                            setSelectedIdeas(new Set());
                          }
                        }}
                        className={`px-4 py-2 rounded-md ${
                          bulkMode
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {bulkMode ? 'Cancel Selection' : 'Select Multiple'}
                      </button>
                      {ideas.length > 0 && (
                        <button
                          onClick={() => setShowExportModal(true)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Export All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bulk Operations Toolbar */}
                  {bulkMode && selectedIdeas.size > 0 && (
                    <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                          {selectedIdeas.size} idea(s) selected
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBulkOperation('ARCHIVE')}
                            className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => handleBulkOperation('UNARCHIVE')}
                            className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Unarchive
                          </button>
                          <button
                            onClick={() => setShowBulkMoveModal(true)}
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Move
                          </button>
                          <button
                            onClick={() => {
                              const format = prompt('Export format (json/csv/text):', 'json');
                              if (format && ['json', 'csv', 'text'].includes(format)) {
                                handleBulkOperation('EXPORT', undefined, format as 'json' | 'csv' | 'text');
                              }
                            }}
                            className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Export
                          </button>
                          <button
                            onClick={() => handleBulkOperation('DELETE')}
                            className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Filters */}
                  <div className="space-y-4 mb-4">
                    {/* Basic Filters Row */}
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          placeholder="Search ideas..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="POSTED">Posted</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                      <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">All Platforms</option>
                        <option value="YouTube">YouTube</option>
                        <option value="YouTube Shorts">YouTube Shorts</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Instagram Reels">Instagram Reels</option>
                        <option value="Facebook Reels">Facebook Reels</option>
                        <option value="Twitter">Twitter/X</option>
                        <option value="LinkedIn">LinkedIn</option>
                      </select>
                      <select
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">All Languages</option>
                        <option value="en">English</option>
                        <option value="bn">Bengali</option>
                        <option value="hi">Hindi</option>
                        <option value="ar">Arabic</option>
                        <option value="es">Spanish</option>
                      </select>
                      <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                      </button>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Advanced Filters</h3>
                        
                        {/* Date Range Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Created Date From
                            </label>
                            <input
                              type="date"
                              value={createdAtFrom}
                              onChange={(e) => setCreatedAtFrom(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Created Date To
                            </label>
                            <input
                              type="date"
                              value={createdAtTo}
                              onChange={(e) => setCreatedAtTo(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Scheduled Date From
                            </label>
                            <input
                              type="date"
                              value={scheduledAtFrom}
                              onChange={(e) => setScheduledAtFrom(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Scheduled Date To
                            </label>
                            <input
                              type="date"
                              value={scheduledAtTo}
                              onChange={(e) => setScheduledAtTo(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                        </div>

                        {/* Viral Score Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Viral Score Min (0-100)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={viralScoreMin || ''}
                              onChange={(e) => setViralScoreMin(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Viral Score Max (0-100)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={viralScoreMax || ''}
                              onChange={(e) => setViralScoreMax(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                              placeholder="100"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                        </div>

                        {/* Clear Filters Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setCreatedAtFrom('');
                              setCreatedAtTo('');
                              setScheduledAtFrom('');
                              setScheduledAtTo('');
                              setViralScoreMin(undefined);
                              setViralScoreMax(undefined);
                            }}
                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          >
                            Clear Date & Score Filters
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Select All */}
                  {bulkMode && ideas.length > 0 && (
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedIdeas.size === ideas.length && ideas.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Select All ({ideas.length})
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Platform & Language Stats */}
                {ideas.length > 0 && (
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                      <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Ideas by Platform
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {['YouTube', 'YouTube Shorts', 'TikTok', 'Instagram Reels', 'Facebook Reels', 'Twitter', 'LinkedIn'].map((platform) => {
                          const count = ideas.filter((idea) => idea.platform === platform).length;
                          if (count === 0) return null;
                          return (
                            <div
                              key={platform}
                              className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-700 rounded-full"
                            >
                              <PlatformBadge platform={platform} size="sm" />
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                      <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Ideas by Language
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(ideas.map((idea) => idea.language).filter(Boolean))).map((langCode) => {
                          const count = ideas.filter((idea) => idea.language === langCode).length;
                          if (!langCode || count === 0) return null;
                          return (
                            <div
                              key={langCode}
                              className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-700 rounded-full"
                            >
                              <LanguageBadge languageCode={langCode} size="sm" />
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {ideas.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">No ideas yet. Generate some from the dashboard!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ideas.map((idea) => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onArchive={handleArchive}
                        onUnarchive={handleUnarchive}
                        showActions={true}
                        selected={selectedIdeas.has(idea.id)}
                        onSelect={handleSelectIdea}
                        showCheckbox={bulkMode}
                      />
                    ))}
                  </div>
                )}

                {/* Edit Modal */}
                {editingId && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Idea</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={editForm.title || ''}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
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
                            Hook
                          </label>
                          <textarea
                            value={editForm.hook || ''}
                            onChange={(e) => setEditForm({ ...editForm, hook: e.target.value })}
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
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Hashtags (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={editForm.hashtags?.join(', ') || ''}
                              onChange={(e) => setEditForm({ ...editForm, hashtags: e.target.value.split(',').map(t => t.trim().replace(/^#/, '')).filter(t => t) })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Custom Tags (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={editForm.customTags?.join(', ') || ''}
                              onChange={(e) => setEditForm({ ...editForm, customTags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
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
                              <option>YouTube Shorts</option>
                              <option>Instagram</option>
                              <option>Instagram Reels</option>
                              <option>Facebook</option>
                              <option>Facebook Reels</option>
                              <option>Twitter</option>
                              <option>LinkedIn</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Niche
                            </label>
                            <input
                              type="text"
                              value={editForm.niche || ''}
                              onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
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
                              <option>professional</option>
                              <option>trendy</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Duration (seconds)
                            </label>
                            <input
                              type="number"
                              value={editForm.duration || ''}
                              onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || undefined })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Viral Score (0-100)
                            </label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={editForm.viralScore || ''}
                                onChange={(e) => setEditForm({ ...editForm, viralScore: parseInt(e.target.value) || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Folder
                            </label>
                            <select
                              value={editForm.folderId || ''}
                              onChange={(e) => setEditForm({ ...editForm, folderId: e.target.value || undefined })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="">No Folder</option>
                              {availableFolders.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                  {folder.icon || '📁'} {folder.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Thumbnail Suggestion
                          </label>
                          <textarea
                            value={editForm.thumbnailSuggestion || ''}
                            onChange={(e) => setEditForm({ ...editForm, thumbnailSuggestion: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Platform Optimization Notes
                          </label>
                          <textarea
                            value={editForm.platformOptimization || ''}
                            onChange={(e) => setEditForm({ ...editForm, platformOptimization: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={2}
                          />
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

                {/* Bulk Move Modal */}
                {showBulkMoveModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Move {selectedIdeas.size} Idea(s)
                      </h2>
                      <div className="space-y-4">
                        <select
                          value={''}
                          onChange={(e) => {
                            const folderId = e.target.value || undefined;
                            handleBulkOperation('MOVE', folderId);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">No Folder (Root)</option>
                          {availableFolders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.icon || '📁'} {folder.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowBulkMoveModal(false)}
                          className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Modal */}
                {showExportModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                          <span>📊</span>
                          <span>Export as CSV</span>
                        </button>
                        <button
                          onClick={async () => {
                            await exportToPDF(ideas);
                            setShowExportModal(false);
                          }}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
                        >
                          <span>📄</span>
                          <span>Export as PDF</span>
                        </button>
                        <button
                          onClick={async () => {
                            await exportToGoogleSheets(ideas);
                            setShowExportModal(false);
                          }}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <span>📊</span>
                          <span>Export to Google Sheets</span>
                        </button>
                        <button
                          onClick={async () => {
                            await exportToNotion(ideas);
                            setShowExportModal(false);
                          }}
                          className="w-full px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-md hover:bg-gray-900 dark:hover:bg-gray-600 flex items-center justify-center gap-2"
                        >
                          <span>📝</span>
                          <span>Export to Notion</span>
                        </button>
                        <button
                          onClick={() => {
                            exportToText(ideas);
                            setShowExportModal(false);
                          }}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                          <span>📄</span>
                          <span>Export as Text</span>
                        </button>
                        <button
                          onClick={() => {
                            const dataStr = JSON.stringify(ideas, null, 2);
                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `ideas-${new Date().toISOString()}.json`;
                            link.click();
                            setShowExportModal(false);
                          }}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                          <span>📦</span>
                          <span>Export as JSON</span>
                        </button>
                        <button
                          onClick={() => {
                            copyAllToClipboard(ideas);
                            setShowExportModal(false);
                            alert('All ideas copied to clipboard!');
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                        >
                          <span>📋</span>
                          <span>Copy All to Clipboard</span>
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
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
