"use client";

import { useState } from "react";
import {
  plannerApi,
  PostingTimeSuggestion,
  CalendarAutofillResult,
} from "@/lib/planner";
import PlatformBadge from "./PlatformBadge";

interface AutomatedSchedulingProps {
  platform?: string;
  niche?: string;
  ideaId?: string;
  onTimeSelected?: (suggestion: PostingTimeSuggestion) => void;
}

export default function AutomatedScheduling({
  platform,
  niche,
  ideaId,
  onTimeSelected,
}: AutomatedSchedulingProps) {
  const [suggestions, setSuggestions] = useState<PostingTimeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [daysAhead, setDaysAhead] = useState(7);

  const loadSuggestions = async () => {
    if (!platform || !niche) return;

    try {
      setLoading(true);
      const data = await plannerApi.getOptimalPostingTimes(
        platform,
        niche,
        timezone,
        daysAhead
      );
      setSuggestions(data);
    } catch (err) {
      console.error("Failed to load suggestions:", err);
      alert("Failed to load posting time suggestions");
    } finally {
      setLoading(false);
    }
  };

  const loadBestTimeForIdea = async () => {
    if (!ideaId) return;

    try {
      setLoading(true);
      const suggestion = await plannerApi.getBestTimeForIdea(ideaId, timezone);
      if (suggestion) {
        setSuggestions([suggestion]);
      }
    } catch (err) {
      console.error("Failed to load best time:", err);
      alert("Failed to load best posting time");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTime = (suggestion: PostingTimeSuggestion) => {
    if (onTimeSelected) {
      onTimeSelected(suggestion);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Timezone
          </label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="America/New_York"
          />
        </div>
        {!ideaId && (
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Days Ahead
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={daysAhead}
              onChange={(e) => setDaysAhead(parseInt(e.target.value) || 7)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}
        <button
          onClick={ideaId ? loadBestTimeForIdea : loadSuggestions}
          disabled={loading || (!platform && !niche && !ideaId)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Loading..."
            : ideaId
            ? "Get Best Time"
            : "Get Suggestions"}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Suggested Posting Times
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {suggestion.dayOfWeek}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(suggestion.date).toLocaleDateString()}
                      </span>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {suggestion.time}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          suggestion.score >= 80
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : suggestion.score >= 60
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        Score: {suggestion.score}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          suggestion.expectedEngagement === "High"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : suggestion.expectedEngagement === "Medium"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {suggestion.expectedEngagement} Engagement
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {suggestion.reason}
                    </p>
                  </div>
                  {onTimeSelected && (
                    <button
                      onClick={() => handleSelectTime(suggestion)}
                      className="ml-4 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                    >
                      Use This Time
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
