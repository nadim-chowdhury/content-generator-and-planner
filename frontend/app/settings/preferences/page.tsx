'use client';

import { useState, useEffect } from 'react';
import { settingsApi, UserSettings, UpdateUserSettingsDto } from '@/lib/settings';
import { SocialPlatform } from '@/lib/settings';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Globe, 
  Palette, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Languages,
  Clock,
  Monitor
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'TWITTER', label: 'Twitter' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'THREADS', label: 'Threads' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'REDDIT', label: 'Reddit' },
  { value: 'QUORA', label: 'Quora' },
  { value: 'PINTEREST', label: 'Pinterest' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'YOUTUBE', label: 'YouTube' },
];

export default function PreferencesSettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getUserSettings();
      setSettings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updates: Partial<UpdateUserSettingsDto>) => {
    if (!settings) return;

    try {
      setSaving(true);
      setError('');
      setSuccess(false);
      const updated = await settingsApi.updateUserSettings(updates);
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!settings) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Settings not found'}</AlertDescription>
            </Alert>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">User Preferences</h1>
            <p className="text-muted-foreground mt-1">
              Customize your GenPlan experience
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Settings saved successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Language & Localization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Language & Localization
                </CardTitle>
                <CardDescription>
                  Configure language, timezone, and date/time formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => handleSave({ language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => handleSave({ timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Input
                      type="text"
                      value={settings.dateFormat}
                      onChange={(e) => handleSave({ dateFormat: e.target.value })}
                      placeholder="MM/DD/YYYY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Format</Label>
                    <Select
                      value={settings.timeFormat}
                      onValueChange={(value) => handleSave({ timeFormat: value as '12h' | '24h' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferred Platforms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Preferred Platforms
                </CardTitle>
                <CardDescription>
                  Select your preferred social media platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {PLATFORMS.map((platform) => {
                    const isSelected = settings.preferredPlatforms.includes(platform.value);
                    return (
                      <label
                        key={platform.value}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded-md transition-colors"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const newPlatforms = checked
                              ? [...settings.preferredPlatforms, platform.value]
                              : settings.preferredPlatforms.filter((p) => p !== platform.value);
                            handleSave({ preferredPlatforms: newPlatforms });
                          }}
                        />
                        <span className="text-sm">{platform.label}</span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* AI Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Settings
                </CardTitle>
                <CardDescription>
                  Customize AI content generation preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>AI Tone</Label>
                  <Select
                    value={settings.aiTone}
                    onValueChange={(value) =>
                      handleSave({ aiTone: value as UserSettings['aiTone'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>AI Style</Label>
                  <Select
                    value={settings.aiStyle}
                    onValueChange={(value) =>
                      handleSave({ aiStyle: value as UserSettings['aiStyle'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="engaging">Engaging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>AI Personality (Optional)</Label>
                  <Textarea
                    value={settings.aiPersonality || ''}
                    onChange={(e) => handleSave({ aiPersonality: e.target.value })}
                    placeholder="Describe the personality you want AI content to have..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Content Length: {settings.aiMaxLength} characters</Label>
                  <Slider
                    value={[settings.aiMaxLength]}
                    onValueChange={(value) => handleSave({ aiMaxLength: value[0] })}
                    min={50}
                    max={2000}
                    step={50}
                    className="w-full"
                  />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={settings.aiIncludeHashtags}
                      onCheckedChange={(checked) => handleSave({ aiIncludeHashtags: checked as boolean })}
                    />
                    <span className="text-sm">Include hashtags in AI-generated content</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={settings.aiIncludeEmojis}
                      onCheckedChange={(checked) => handleSave({ aiIncludeEmojis: checked as boolean })}
                    />
                    <span className="text-sm">Include emojis in AI-generated content</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) => handleSave({ theme: value as 'light' | 'dark' | 'auto' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
