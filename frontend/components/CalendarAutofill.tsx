'use client';

import { useState } from 'react';
import { plannerApi, CalendarAutofillResult } from '@/lib/planner';
import { ideasApi, Idea } from '@/lib/ideas';

interface CalendarAutofillProps {
  currentMonth: number;
  currentYear: number;
  onAutofillComplete?: (result: CalendarAutofillResult) => void;
}

export default function CalendarAutofill({
  currentMonth,
  currentYear,
  onAutofillComplete,
}: CalendarAutofillProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<CalendarAutofillResult['suggestions']>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [options, setOptions] = useState({
    minViralScore: 60,
    platforms: [] as string[],
    maxPostsPerDay: 3,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);

  const loadAvailablePlatforms = async () => {
    try {
      const ideas = await ideasApi.getAll('DRAFT');
      const platforms = Array.from(new Set(ideas.map(i => i.platform)));
      setAvailablePlatforms(platforms);
    } catch (err) {
      console.error('Failed to load platforms:', err);
    }
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      const suggestions = await plannerApi.previewAutofill(currentMonth, currentYear, options);
      setPreview(suggestions);
      setShowPreview(true);
    } catch (err) {
      console.error('Failed to preview autofill:', err);
      alert('Failed to preview autofill');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = async () => {
    if (!confirm(`This will schedule ${preview.length} ideas. Continue?`)) return;

    try {
      setLoading(true);
      const result = await plannerApi.autofillCalendar(currentMonth, currentYear, options);
      setShowPreview(false);
      if (onAutofillComplete) {
        onAutofillComplete(result);
      }
      alert(`Successfully scheduled ${result.scheduled} ideas!`);
    } catch (err) {
      console.error('Failed to autofill:', err);
      alert('Failed to autofill calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Auto-Fill Monthly Calendar
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Minimum Viral Score
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={options.minViralScore}
            onChange={(e) => setOptions({ ...options, minViralScore: parseInt(e.target.value) || 60 })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Posts Per Day
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={options.maxPostsPerDay}
            onChange={(e) => setOptions({ ...options, maxPostsPerDay: parseInt(e.target.value) || 3 })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Timezone
          </label>
          <input
            type="text"
            value={options.timezone}
            onChange={(e) => setOptions({ ...options, timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="America/New_York"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadAvailablePlatforms}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Load Platforms
          </button>
          <button
            onClick={handlePreview}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Preview Autofill'}
          </button>
        </div>

        {showPreview && preview.length > 0 && (
          <div className="mt-4">
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded">
              <p className="text-sm text-indigo-800 dark:text-indigo-200">
                Preview: {preview.length} ideas will be scheduled
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
              {preview.slice(0, 10).map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{suggestion.title}</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {new Date(suggestion.scheduledAt).toLocaleString()}
                  </div>
                </div>
              ))}
              {preview.length > 10 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ... and {preview.length - 10} more
                </p>
              )}
            </div>
            <button
              onClick={handleAutofill}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Apply Autofill'}
            </button>
          </div>
        )}

        {showPreview && preview.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              No ideas found matching the criteria. Try lowering the minimum viral score or check if you have unscheduled ideas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

