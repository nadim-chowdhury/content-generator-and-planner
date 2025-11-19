"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import PlatformComparison from "@/components/PlatformComparison";
import PlatformInfo from "@/components/PlatformInfo";
import PlatformBadge from "@/components/PlatformBadge";

const platforms = [
  "YouTube",
  "YouTube Shorts",
  "TikTok",
  "Instagram Reels",
  "Facebook Reels",
  "Twitter",
  "LinkedIn",
];

export default function PlatformsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Platform Guide
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <PlatformComparison
              selectedPlatform={selectedPlatform}
              onSelect={setSelectedPlatform}
            />

            {selectedPlatform && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Platform Details
                </h2>
                <div className="mb-4">
                  <PlatformBadge platform={selectedPlatform} size="lg" />
                </div>
                <PlatformInfo platform={selectedPlatform} />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Supported Platforms
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {platforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatform(platform)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPlatform === platform
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                >
                  <div className="text-center">
                    <PlatformBadge platform={platform} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
