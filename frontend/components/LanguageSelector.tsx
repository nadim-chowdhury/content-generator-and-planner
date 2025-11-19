"use client";

import { useState, useEffect } from "react";
import LanguageBadge from "./LanguageBadge";
import { ideasApi } from "@/lib/ideas";

interface LanguageSelectorProps {
  value: string;
  onChange: (languageCode: string) => void;
  showPopular?: boolean;
}

interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
}

const popularLanguages = [
  "en",
  "bn",
  "hi",
  "ar",
  "es",
  "fr",
  "de",
  "pt",
  "ru",
  "ja",
  "ko",
  "zh",
];

export default function LanguageSelector({
  value,
  onChange,
  showPopular = true,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const response = await ideasApi.getSupportedLanguages();
      setLanguages(response.languages || []);
    } catch (err) {
      console.error("Failed to load languages:", err);
      // Fallback to default languages
      setLanguages([
        { code: "en", name: "English", nativeName: "English", rtl: false },
        { code: "bn", name: "Bengali", nativeName: "বাংলা", rtl: false },
        { code: "hi", name: "Hindi", nativeName: "हिन्दी", rtl: false },
        { code: "ar", name: "Arabic", nativeName: "العربية", rtl: true },
        { code: "es", name: "Spanish", nativeName: "Español", rtl: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const popularLangs = languages.filter((lang) =>
    popularLanguages.includes(lang.code)
  );
  const otherLangs = languages.filter(
    (lang) => !popularLanguages.includes(lang.code)
  );

  const selectedLang = languages.find((lang) => lang.code === value);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Language
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {selectedLang ? (
              <LanguageBadge
                languageCode={selectedLang.code}
                size="sm"
                showNativeName={true}
              />
            ) : (
              <span>Select Language</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && !loading && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-96 overflow-auto">
              {showPopular && popularLangs.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Popular Languages
                    </p>
                  </div>
                  {popularLangs.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onChange(lang.code);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                        value === lang.code
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <LanguageBadge
                          languageCode={lang.code}
                          size="sm"
                          showNativeName={true}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {lang.name}
                          </p>
                          {lang.rtl && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Right-to-Left (RTL)
                            </p>
                          )}
                        </div>
                      </div>
                      {value === lang.code && (
                        <svg
                          className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </>
              )}
              {otherLangs.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      More Languages
                    </p>
                  </div>
                  {otherLangs.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onChange(lang.code);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                        value === lang.code
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <LanguageBadge
                          languageCode={lang.code}
                          size="sm"
                          showNativeName={true}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {lang.name}
                          </p>
                          {lang.rtl && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Right-to-Left (RTL)
                            </p>
                          )}
                        </div>
                      </div>
                      {value === lang.code && (
                        <svg
                          className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>
      {selectedLang && selectedLang.rtl && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          ⚠️ This language uses right-to-left (RTL) script. Content will be
          formatted accordingly.
        </p>
      )}
    </div>
  );
}
