'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
            AI-Powered Content Idea Generator
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Generate unlimited content ideas for TikTok, YouTube, Instagram, and more.
            Plan your content calendar and never run out of ideas again.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="bg-indigo-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-indigo-700"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-3 rounded-md text-lg font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              AI-Powered Generation
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Generate 10 unique content ideas in seconds using advanced AI. Tailored to your niche, platform, and tone.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Content Planner
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Schedule your ideas on a calendar. Plan weeks or months ahead and never miss a posting day.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Idea Library
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Save, organize, and manage all your content ideas in one place. Edit, copy, and export anytime.
            </p>
          </div>
        </div>

        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Perfect for Content Creators
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Whether you're a YouTuber, TikTok creator, Instagram influencer, or social media manager,
            we've got you covered.
          </p>
        </div>
      </div>
    </div>
  );
}
