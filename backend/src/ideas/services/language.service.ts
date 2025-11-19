import { Injectable } from '@nestjs/common';

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean; // Right-to-left script
}

@Injectable()
export class LanguageService {
  private supportedLanguages: LanguageInfo[] = [
    { code: 'en', name: 'English', nativeName: 'English', rtl: false },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', rtl: false },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
    { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false },
    { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false },
    { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', rtl: false },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', rtl: false },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', rtl: false },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', rtl: false },
  ];

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageInfo[] {
    return this.supportedLanguages;
  }

  /**
   * Get language info by code
   */
  getLanguageInfo(code: string): LanguageInfo | null {
    return this.supportedLanguages.find((lang) => lang.code === code) || null;
  }

  /**
   * Check if language is supported
   */
  isSupported(code: string): boolean {
    return this.supportedLanguages.some((lang) => lang.code === code);
  }

  /**
   * Get language name for OpenAI prompt
   */
  getLanguageNameForAI(code: string): string {
    const lang = this.getLanguageInfo(code);
    if (!lang) return 'English';
    return lang.name;
  }

  /**
   * Get language instruction for OpenAI
   */
  getLanguageInstruction(code: string): string {
    const lang = this.getLanguageInfo(code);
    if (!lang) return 'Generate all content in English.';
    
    const rtlNote = lang.rtl ? ' Note: This language uses right-to-left (RTL) script.' : '';
    return `Generate ALL content (titles, descriptions, hooks, scripts, captions, hashtags, category tags, thumbnail suggestions, and platform optimization notes) in ${lang.name} (${lang.nativeName}).${rtlNote} Ensure all text is culturally appropriate and uses natural, native expressions.`;
  }

  /**
   * Get default language
   */
  getDefaultLanguage(): string {
    return 'en';
  }
}



