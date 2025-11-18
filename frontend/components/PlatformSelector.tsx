'use client';

import { useState } from 'react';
import PlatformBadge from './PlatformBadge';
import PlatformInfo from './PlatformInfo';

interface PlatformSelectorProps {
  value: string;
  onChange: (platform: string) => void;
  showInfo?: boolean;
}

const platforms = [
  { value: 'YouTube', label: 'YouTube', description: 'Long-form video content' },
  { value: 'YouTube Shorts', label: 'YouTube Shorts', description: 'Short vertical videos' },
  { value: 'TikTok', label: 'TikTok', description: 'Short-form viral content' },
  { value: 'Instagram Reels', label: 'Instagram Reels', description: 'Short vertical videos' },
  { value: 'Facebook Reels', label: 'Facebook Reels', description: 'Short vertical videos' },
  { value: 'Twitter', label: 'Twitter/X', description: 'Text and short clips' },
  { value: 'LinkedIn', label: 'LinkedIn', description: 'Professional content' },
];

export default function PlatformSelector({ value, onChange, showInfo = true }: PlatformSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Platform
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <PlatformBadge platform={value} size="sm" />
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-96 overflow-auto">
              {platforms.map((platform) => (
                <button
                  key={platform.value}
                  type="button"
                  onClick={() => {
                    onChange(platform.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                    value === platform.value ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={platform.value} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {platform.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {platform.description}
                      </p>
                    </div>
                  </div>
                  {value === platform.value && (
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {showInfo && <PlatformInfo platform={value} />}
    </div>
  );
}

