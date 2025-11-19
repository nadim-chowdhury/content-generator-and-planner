"use client";

interface LanguageBadgeProps {
  languageCode: string;
  size?: "sm" | "md" | "lg";
  showNativeName?: boolean;
}

const languageInfo: Record<
  string,
  { name: string; nativeName: string; flag?: string; rtl?: boolean }
> = {
  en: { name: "English", nativeName: "English", flag: "🇬🇧" },
  bn: { name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  hi: { name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  ar: { name: "Arabic", nativeName: "العربية", flag: "🇸🇦", rtl: true },
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  fr: { name: "French", nativeName: "Français", flag: "🇫🇷" },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  pt: { name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  ru: { name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  ko: { name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  zh: { name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  it: { name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  tr: { name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  vi: { name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  th: { name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  id: { name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  nl: { name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  pl: { name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  uk: { name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
};

const sizeClasses = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-2 py-1",
  lg: "text-base px-3 py-2",
};

export default function LanguageBadge({
  languageCode,
  size = "sm",
  showNativeName = false,
}: LanguageBadgeProps) {
  const lang = languageInfo[languageCode] || {
    name: languageCode.toUpperCase(),
    nativeName: languageCode,
    flag: "🌐",
  };
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 ${sizeClass}`}
    >
      {lang.flag && <span>{lang.flag}</span>}
      <span>{showNativeName ? lang.nativeName : lang.name}</span>
      {lang.rtl && (
        <span className="text-xs" title="Right-to-Left language">
          ↔️
        </span>
      )}
    </span>
  );
}
