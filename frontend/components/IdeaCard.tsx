'use client';

import { useState } from 'react';
import { Idea } from '@/lib/ideas';
import { ideasApi } from '@/lib/ideas';
import { analyticsApi } from '@/lib/analytics';
import PlatformBadge from './PlatformBadge';
import LanguageBadge from './LanguageBadge';

interface IdeaCardProps {
  idea: Idea;
  onSave?: (idea: Idea) => void;
  onEdit?: (idea: Idea) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  showActions?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

export default function IdeaCard({ 
  idea, 
  onSave, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onArchive,
  onUnarchive,
  showActions = true,
  selected = false,
  onSelect,
  showCheckbox = false,
}: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<{ reach?: number; engagement?: number; reasoning?: string } | null>(null);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(idea);
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getViralScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const isRTL = idea.language === 'ar';

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border transition-shadow ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800' : 'border-gray-200 dark:border-gray-700'
      } hover:shadow-lg`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        {showCheckbox && onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(idea.id, e.target.checked)}
            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {idea.title}
          </h3>
          {idea.folder && (
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: idea.folder.color ? `${idea.folder.color}20` : undefined,
                  color: idea.folder.color || undefined,
                }}
              >
                {idea.folder.icon && <span className="mr-1">{idea.folder.icon}</span>}
                {idea.folder.name}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <PlatformBadge platform={idea.platform} size="sm" />
            <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
              {idea.niche}
            </span>
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
              {idea.tone}
            </span>
            {idea.viralScore !== undefined && idea.viralScore !== null && (
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getViralScoreColor(idea.viralScore)}`}>
                Viral: {idea.viralScore}/100
              </span>
            )}
            {idea.duration && (
              <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full">
                {formatDuration(idea.duration)}
              </span>
            )}
            {idea.language && idea.language !== 'en' && (
              <LanguageBadge languageCode={idea.language} size="sm" />
            )}
          </div>
        </div>
        {showActions && (
          <div className="flex flex-wrap gap-2 ml-4">
            {onSave && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(idea)}
                className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
              >
                Edit
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(idea.id)}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              >
                Duplicate
              </button>
            )}
            {idea.status === 'ARCHIVED' ? (
              onUnarchive && (
                <button
                  onClick={() => onUnarchive(idea.id)}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                >
                  Unarchive
                </button>
              )
            ) : (
              onArchive && (
                <button
                  onClick={() => onArchive(idea.id)}
                  className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
                >
                  Archive
                </button>
              )
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(idea.id)}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {idea.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {idea.description}
        </p>
      )}

      {/* Hook */}
      {idea.hook && (
        <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            🎣 Hook:
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {idea.hook}
          </p>
        </div>
      )}

      {/* Expandable Content */}
      {expanded && (
        <div className="space-y-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Script */}
          {idea.script && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                Script
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {idea.script}
              </p>
            </div>
          )}

          {/* Caption */}
          {idea.caption && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                Caption
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {idea.caption}
              </p>
            </div>
          )}

          {/* Hashtags */}
          {idea.hashtags && idea.hashtags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                Hashtags
              </p>
              <div className="flex flex-wrap gap-1">
                {idea.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Category Tags */}
          {idea.categoryTags && idea.categoryTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                Category Tags
              </p>
              <div className="flex flex-wrap gap-1">
                {idea.categoryTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Thumbnail Suggestion */}
          {idea.thumbnailSuggestion && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                Thumbnail Suggestion
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                {idea.thumbnailSuggestion}
              </p>
            </div>
          )}

          {/* Platform Optimization */}
          {idea.platformOptimization && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                Platform Optimization
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {idea.platformOptimization}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Predictions */}
      {prediction && (
        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded">
          <div className="text-xs font-semibold text-indigo-800 dark:text-indigo-200 mb-2">AI Predictions</div>
          {prediction.reach && (
            <div className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">
              📊 Reach Potential: {prediction.reach.toLocaleString()}
            </div>
          )}
          {prediction.engagement && (
            <div className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">
              💬 Engagement Prediction: {prediction.engagement.toLocaleString()}
            </div>
          )}
          {prediction.reasoning && (
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 italic">
              {prediction.reasoning}
            </div>
          )}
        </div>
      )}

      {/* Prediction Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={async () => {
            setPredicting(true);
            try {
              const result = await analyticsApi.predictReach(idea.id);
              setPrediction({ ...prediction, reach: result.reach, reasoning: result.reasoning });
            } catch (err) {
              alert('Failed to predict reach');
            } finally {
              setPredicting(false);
            }
          }}
          disabled={predicting}
          className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {predicting ? 'Predicting...' : '📊 Predict Reach'}
        </button>
        <button
          onClick={async () => {
            setPredicting(true);
            try {
              const result = await analyticsApi.predictEngagement(idea.id);
              setPrediction({ ...prediction, engagement: result.engagement, reasoning: result.reasoning });
            } catch (err) {
              alert('Failed to predict engagement');
            } finally {
              setPredicting(false);
            }
          }}
          disabled={predicting}
          className="text-xs bg-pink-600 text-white px-3 py-1 rounded hover:bg-pink-700 disabled:opacity-50"
        >
          {predicting ? 'Predicting...' : '💬 Predict Engagement'}
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>
    </div>
  );
}

