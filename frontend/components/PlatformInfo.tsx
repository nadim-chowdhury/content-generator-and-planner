"use client";

interface PlatformInfoProps {
  platform: string;
}

const platformInfo: Record<
  string,
  {
    optimalDuration?: { min: number; max: number; recommended: number };
    aspectRatio?: string;
    maxCaptionLength?: number;
    hashtagCount?: { min: number; max: number; recommended: number };
    contentType?: string[];
    bestPractices?: string[];
  }
> = {
  YouTube: {
    optimalDuration: { min: 300, max: 3600, recommended: 600 },
    aspectRatio: "16:9",
    maxCaptionLength: 5000,
    hashtagCount: { min: 3, max: 10, recommended: 5 },
    contentType: ["tutorials", "vlogs", "educational", "reviews"],
    bestPractices: [
      "detailed descriptions",
      "timestamps/chapters",
      "strong CTAs",
      "high-quality visuals",
    ],
  },
  "YouTube Shorts": {
    optimalDuration: { min: 15, max: 60, recommended: 30 },
    aspectRatio: "9:16",
    maxCaptionLength: 100,
    hashtagCount: { min: 5, max: 15, recommended: 7 },
    contentType: [
      "quick tips",
      "challenges",
      "viral trends",
      "behind-the-scenes",
    ],
    bestPractices: [
      "quick hooks",
      "trending sounds",
      "#Shorts hashtag",
      "vertical format",
    ],
  },
  TikTok: {
    optimalDuration: { min: 15, max: 60, recommended: 30 },
    aspectRatio: "9:16",
    maxCaptionLength: 2200,
    hashtagCount: { min: 5, max: 15, recommended: 7 },
    contentType: [
      "quick tips",
      "challenges",
      "viral trends",
      "behind-the-scenes",
    ],
    bestPractices: [
      "quick hooks",
      "trending sounds",
      "trending hashtags",
      "vertical format",
    ],
  },
  "Instagram Reels": {
    optimalDuration: { min: 15, max: 90, recommended: 30 },
    aspectRatio: "9:16",
    maxCaptionLength: 2200,
    hashtagCount: { min: 5, max: 10, recommended: 7 },
    contentType: ["trending audio", "visual storytelling", "engagement"],
    bestPractices: [
      "trending audio",
      "visual descriptions",
      "5-10 hashtags",
      "engagement optimization",
    ],
  },
  "Facebook Reels": {
    optimalDuration: { min: 15, max: 90, recommended: 30 },
    aspectRatio: "9:16",
    maxCaptionLength: 5000,
    hashtagCount: { min: 5, max: 10, recommended: 7 },
    contentType: [
      "community engagement",
      "relatable content",
      "shareable moments",
    ],
    bestPractices: [
      "community engagement",
      "relatable content",
      "Facebook-specific hashtags",
      "vertical format",
    ],
  },
  Twitter: {
    optimalDuration: { min: 0, max: 140, recommended: 0 },
    aspectRatio: "16:9 or 1:1",
    maxCaptionLength: 280,
    hashtagCount: { min: 0, max: 2, recommended: 1 },
    contentType: ["timely content", "conversational", "threads", "short clips"],
    bestPractices: [
      "timely content",
      "conversational tone",
      "1-2 hashtags",
      "thread format for longer content",
    ],
  },
  LinkedIn: {
    optimalDuration: { min: 0, max: 600, recommended: 120 },
    aspectRatio: "16:9 or 1:1",
    maxCaptionLength: 3000,
    hashtagCount: { min: 3, max: 5, recommended: 4 },
    contentType: ["professional content", "thought leadership", "B2B focus"],
    bestPractices: [
      "professional tone",
      "industry-specific hashtags",
      "3-5 hashtags",
      "comments and shares",
    ],
  },
};

export default function PlatformInfo({ platform }: PlatformInfoProps) {
  const info = platformInfo[platform];

  if (!info) {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-sm">
      <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
        📱 {platform} Recommendations:
      </p>
      <div className="space-y-1 text-blue-800 dark:text-blue-300">
        {info.optimalDuration && (
          <p>
            ⏱️ Duration: {info.optimalDuration.recommended}s (optimal:{" "}
            {info.optimalDuration.min}s-{info.optimalDuration.max}s)
          </p>
        )}
        {info.aspectRatio && <p>📐 Aspect Ratio: {info.aspectRatio}</p>}
        {info.hashtagCount && (
          <p>
            #️⃣ Hashtags: {info.hashtagCount.recommended} recommended (
            {info.hashtagCount.min}-{info.hashtagCount.max})
          </p>
        )}
        {info.contentType && info.contentType.length > 0 && (
          <p>📝 Best for: {info.contentType.join(", ")}</p>
        )}
      </div>
    </div>
  );
}
