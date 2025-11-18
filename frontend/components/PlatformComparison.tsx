'use client';

import PlatformBadge from './PlatformBadge';

interface PlatformComparisonProps {
  selectedPlatform?: string;
  onSelect?: (platform: string) => void;
}

const platforms = [
  {
    value: 'YouTube',
    specs: {
      duration: '5-60+ min',
      format: '16:9',
      hashtags: '0-15',
      bestFor: 'Tutorials, Vlogs, Educational',
    },
  },
  {
    value: 'YouTube Shorts',
    specs: {
      duration: '15-60s',
      format: '9:16',
      hashtags: '3-10',
      bestFor: 'Quick Tips, Trends, Viral',
    },
  },
  {
    value: 'TikTok',
    specs: {
      duration: '15-60s',
      format: '9:16',
      hashtags: '3-10',
      bestFor: 'Trending, Challenges, Entertainment',
    },
  },
  {
    value: 'Instagram Reels',
    specs: {
      duration: '15-90s',
      format: '9:16',
      hashtags: '5-10',
      bestFor: 'Trending Audio, Visual Storytelling',
    },
  },
  {
    value: 'Facebook Reels',
    specs: {
      duration: '15-90s',
      format: '9:16',
      hashtags: '3-10',
      bestFor: 'Community Engagement, Relatable',
    },
  },
  {
    value: 'Twitter',
    specs: {
      duration: 'Text/Threads',
      format: '16:9 or 1:1',
      hashtags: '1-2',
      bestFor: 'Timely Content, Conversations',
    },
  },
  {
    value: 'LinkedIn',
    specs: {
      duration: 'Text/Video',
      format: '16:9 or 1:1',
      hashtags: '3-5',
      bestFor: 'Professional, Thought Leadership',
    },
  },
];

export default function PlatformComparison({ selectedPlatform, onSelect }: PlatformComparisonProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Platform Comparison
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Format
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Hashtags
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Best For
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {platforms.map((platform) => (
              <tr
                key={platform.value}
                onClick={() => onSelect?.(platform.value)}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                  selectedPlatform === platform.value
                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                    : ''
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <PlatformBadge platform={platform.value} size="sm" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {platform.specs.duration}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {platform.specs.format}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {platform.specs.hashtags}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {platform.specs.bestFor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


