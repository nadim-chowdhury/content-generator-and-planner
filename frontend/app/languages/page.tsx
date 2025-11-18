'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import LanguageBadge from '@/components/LanguageBadge';
import { ideasApi } from '@/lib/ideas';

interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const response = await ideasApi.getSupportedLanguages();
      setLanguages(response.languages || []);
    } catch (err) {
      console.error('Failed to load languages:', err);
    } finally {
      setLoading(false);
    }
  };

  const popularLanguages = ['en', 'bn', 'hi', 'ar', 'es'];
  const popularLangs = languages.filter((lang) => popularLanguages.includes(lang.code));
  const otherLangs = languages.filter((lang) => !popularLanguages.includes(lang.code));

  const selectedLang = languages.find((lang) => lang.code === selectedLanguage);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 dark:text-gray-400">Loading languages...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Supported Languages
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Language List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Popular Languages */}
              {popularLangs.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Popular Languages
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {popularLangs.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedLanguage(lang.code === selectedLanguage ? '' : lang.code)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedLanguage === lang.code
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <LanguageBadge languageCode={lang.code} size="md" showNativeName={true} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {lang.name}
                            </p>
                            {lang.rtl && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Right-to-Left (RTL)
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* More Languages */}
              {otherLangs.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    More Languages
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {otherLangs.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedLanguage(lang.code === selectedLanguage ? '' : lang.code)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedLanguage === lang.code
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <LanguageBadge languageCode={lang.code} size="sm" showNativeName={true} />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {lang.name}
                            </p>
                            {lang.rtl && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                RTL
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Language Details */}
            {selectedLang && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Language Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <LanguageBadge languageCode={selectedLang.code} size="lg" showNativeName={true} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Language Code</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedLang.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">English Name</p>
                    <p className="text-gray-900 dark:text-white">{selectedLang.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Native Name</p>
                    <p className="text-gray-900 dark:text-white">{selectedLang.nativeName}</p>
                  </div>
                  {selectedLang.rtl && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        ⚠️ Right-to-Left (RTL) Language
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Content generated in this language will be formatted for right-to-left reading.
                      </p>
                    </div>
                  )}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      📝 Content Generation
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      All generated content (titles, descriptions, hooks, scripts, captions, hashtags, etc.) will be in {selectedLang.name} ({selectedLang.nativeName}).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


