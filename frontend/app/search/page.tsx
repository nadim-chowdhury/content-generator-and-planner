"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  searchApi,
  SearchResult,
  SearchFilters,
  SavedSearch,
} from "@/lib/search";
import { Idea } from "@/lib/ideas";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    loadFilters();
    loadSavedSearches();
  }, []);

  useEffect(() => {
    if (
      debouncedQuery ||
      selectedPlatforms.length > 0 ||
      selectedTags.length > 0 ||
      selectedStatus.length > 0
    ) {
      performSearch();
    }
  }, [debouncedQuery, selectedPlatforms, selectedTags, selectedStatus]);

  const loadFilters = async () => {
    try {
      const data = await searchApi.getFilters();
      setFilters(data);
    } catch (error) {
      console.error("Failed to load filters:", error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const data = await searchApi.getSavedSearches();
      setSavedSearches(data);
    } catch (error) {
      console.error("Failed to load saved searches:", error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const result = await searchApi.search({
        query: debouncedQuery,
        platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        status: selectedStatus.length > 0 ? selectedStatus : undefined,
        limit: 50,
      });
      setResults(result);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) return;

    try {
      await searchApi.saveSearch(saveSearchName, query, {
        platforms: selectedPlatforms,
        tags: selectedTags,
        status: selectedStatus,
      });
      setShowSaveDialog(false);
      setSaveSearchName("");
      loadSavedSearches();
    } catch (error) {
      console.error("Failed to save search:", error);
    }
  };

  const handleLoadSavedSearch = (saved: SavedSearch) => {
    setQuery(saved.query || "");
    setSelectedPlatforms(saved.filters?.platforms || []);
    setSelectedTags(saved.filters?.tags || []);
    setSelectedStatus(saved.filters?.status || []);
  };

  const handleDeleteSavedSearch = async (searchId: string) => {
    try {
      await searchApi.deleteSavedSearch(searchId);
      loadSavedSearches();
    } catch (error) {
      console.error("Failed to delete saved search:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Search
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Saved Searches
                </h2>
                <div className="space-y-2">
                  {savedSearches.map((saved) => (
                    <div
                      key={saved.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                    >
                      <button
                        onClick={() => handleLoadSavedSearch(saved)}
                        className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex-1 text-left"
                      >
                        {saved.name}
                      </button>
                      <button
                        onClick={() => handleDeleteSavedSearch(saved.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Filters
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-sm text-indigo-600 dark:text-indigo-400"
                >
                  {showFilters ? "Hide" : "Show"}
                </button>
              </div>

              {showFilters && filters && (
                <div className="space-y-4">
                  {/* Platform Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Platforms
                    </label>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {filters.platforms.map((platform) => (
                        <label
                          key={platform}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlatforms.includes(platform)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlatforms([
                                  ...selectedPlatforms,
                                  platform,
                                ]);
                              } else {
                                setSelectedPlatforms(
                                  selectedPlatforms.filter(
                                    (p) => p !== platform
                                  )
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {platform}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <div className="space-y-1">
                      {filters.statuses.map((status) => (
                        <label
                          key={status}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStatus.includes(status)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStatus([...selectedStatus, status]);
                              } else {
                                setSelectedStatus(
                                  selectedStatus.filter((s) => s !== status)
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {status}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Tags Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {filters.tags.slice(0, 20).map((tag) => (
                        <label
                          key={tag}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTags([...selectedTags, tag]);
                              } else {
                                setSelectedTags(
                                  selectedTags.filter((t) => t !== tag)
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {tag}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ideas, folders..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Results */}
            {loading && (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                Searching...
              </div>
            )}

            {!loading && results && (
              <div>
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Found {results.total} ideas, {results.folders.length} folders
                </div>

                {/* Ideas Results */}
                {results.ideas.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Ideas
                    </h2>
                    {results.ideas.map((idea: Idea) => (
                      <Link
                        key={idea.id}
                        href={`/ideas/${idea.id}`}
                        className="block bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {idea.title}
                        </h3>
                        {idea.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {idea.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{idea.platform}</span>
                          <span>{idea.niche}</span>
                          <span>{idea.status}</span>
                          {idea.folder && (
                            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                              {idea.folder.name}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Folders Results */}
                {results.folders.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Folders
                    </h2>
                    {results.folders.map((folder) => (
                      <Link
                        key={folder.id}
                        href={`/ideas?folder=${folder.id}`}
                        className="block bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {folder.name}
                        </h3>
                        {folder.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {folder.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}

                {results.ideas.length === 0 && results.folders.length === 0 && (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Save Search Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Save Search
              </h2>
              <input
                type="text"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder="Search name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSearch}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveSearchName("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



