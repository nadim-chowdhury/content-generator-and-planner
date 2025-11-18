'use client';

interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const platformIcons: Record<string, string> = {
  'YouTube': '📺',
  'YouTube Shorts': '🎬',
  'TikTok': '🎵',
  'Instagram Reels': '📸',
  'Facebook Reels': '👥',
  'Twitter': '🐦',
  'LinkedIn': '💼',
  'Instagram': '📷',
  'Facebook': '👤',
  'Threads': '🧵',
  'Pinterest': '📌',
  'Reddit': '🤖',
  'Quora': '❓',
};

const platformColors: Record<string, string> = {
  'YouTube': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'YouTube Shorts': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'TikTok': 'bg-black text-white dark:bg-gray-800 dark:text-white',
  'Instagram Reels': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  'Facebook Reels': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Twitter': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'LinkedIn': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Instagram': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  'Facebook': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Threads': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  'Pinterest': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Reddit': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Quora': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-2',
};

export default function PlatformBadge({ platform, size = 'sm', showIcon = true }: PlatformBadgeProps) {
  const icon = platformIcons[platform] || '📱';
  const colorClass = platformColors[platform] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  const sizeClass = sizeClasses[size];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${colorClass} ${sizeClass}`}>
      {showIcon && <span>{icon}</span>}
      <span>{platform}</span>
    </span>
  );
}


