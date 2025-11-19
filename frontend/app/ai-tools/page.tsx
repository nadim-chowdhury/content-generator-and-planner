'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  aiToolsApi,
  ScriptGeneratorDto,
  RewriteDto,
  ElaborateIdeaDto,
  OptimizeTitleDto,
  CalendarAutofillDto,
  CompetitorAnalysisDto,
  NicheResearchDto,
  TrendingTopicsDto,
  AudiencePersonaDto,
  ViralScoreDto,
  ScriptResult,
  RewriteResult,
  ElaborateIdeaResult,
  OptimizeTitleResult,
  CalendarAutofillResult,
  CompetitorAnalysisResult,
  NicheResearchResult,
  TrendingTopicsResult,
  AudiencePersonaResult,
  ViralScoreResult,
} from '@/lib/ai-tools';
import LanguageSelector from '@/components/LanguageSelector';
import PlatformSelector from '@/components/PlatformSelector';

type ToolType =
  | 'script-generator'
  | 'rewrite'
  | 'elaborate-idea'
  | 'optimize-title'
  | 'calendar-autofill'
  | 'competitor-analysis'
  | 'niche-research'
  | 'trending-topics'
  | 'audience-persona'
  | 'viral-score';

const tools: Array<{ id: ToolType; name: string; icon: string; description: string }> = [
  { id: 'script-generator', name: 'Script Generator', icon: '📝', description: 'Generate short or long-form video scripts' },
  { id: 'rewrite', name: 'Rewriting Tool', icon: '✍️', description: 'Rewrite and improve your content' },
  { id: 'elaborate-idea', name: 'Idea Elaboration', icon: '💡', description: 'Expand and develop your content ideas' },
  { id: 'optimize-title', name: 'Title Optimization', icon: '🎯', description: 'Generate optimized title variations' },
  { id: 'calendar-autofill', name: 'Calendar Auto-fill', icon: '📅', description: 'Auto-generate content calendar' },
  { id: 'competitor-analysis', name: 'Competitor Analysis', icon: '🔍', description: 'Analyze competitors in your niche' },
  { id: 'niche-research', name: 'Niche Research', icon: '📊', description: 'Research and analyze your niche' },
  { id: 'trending-topics', name: 'Trending Topics', icon: '🔥', description: 'Discover trending topics in your niche' },
  { id: 'audience-persona', name: 'Audience Persona', icon: '👥', description: 'Build detailed audience personas' },
  { id: 'viral-score', name: 'Viral Score Predictor', icon: '📈', description: 'Predict viral potential (0-100)' },
];

export default function AiToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Form states for each tool
  const [scriptForm, setScriptForm] = useState<ScriptGeneratorDto>({
    topic: '',
    type: 'SHORT',
    language: 'en',
  });
  const [rewriteForm, setRewriteForm] = useState<RewriteDto>({
    content: '',
    language: 'en',
  });
  const [elaborateForm, setElaborateForm] = useState<ElaborateIdeaDto>({
    idea: '',
    language: 'en',
  });
  const [optimizeForm, setOptimizeForm] = useState<OptimizeTitleDto>({
    title: '',
    variations: 5,
    language: 'en',
  });
  const [calendarForm, setCalendarForm] = useState<CalendarAutofillDto>({
    platform: 'TikTok',
    niche: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    postsPerWeek: 5,
    language: 'en',
  });
  const [competitorForm, setCompetitorForm] = useState<CompetitorAnalysisDto>({
    niche: '',
    language: 'en',
  });
  const [nicheForm, setNicheForm] = useState<NicheResearchDto>({
    niche: '',
    language: 'en',
  });
  const [trendingForm, setTrendingForm] = useState<TrendingTopicsDto>({
    niche: '',
    count: 10,
    timeFrame: 'weekly',
    language: 'en',
  });
  const [personaForm, setPersonaForm] = useState<AudiencePersonaDto>({
    niche: '',
    language: 'en',
  });
  const [viralForm, setViralForm] = useState<ViralScoreDto>({
    title: '',
    platform: 'TikTok',
    language: 'en',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTool) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let response: any;
      switch (activeTool) {
        case 'script-generator':
          response = await aiToolsApi.generateScript(scriptForm);
          break;
        case 'rewrite':
          response = await aiToolsApi.rewriteContent(rewriteForm);
          break;
        case 'elaborate-idea':
          response = await aiToolsApi.elaborateIdea(elaborateForm);
          break;
        case 'optimize-title':
          response = await aiToolsApi.optimizeTitle(optimizeForm);
          break;
        case 'calendar-autofill':
          response = await aiToolsApi.autofillCalendar(calendarForm);
          break;
        case 'competitor-analysis':
          response = await aiToolsApi.analyzeCompetitors(competitorForm);
          break;
        case 'niche-research':
          response = await aiToolsApi.researchNiche(nicheForm);
          break;
        case 'trending-topics':
          response = await aiToolsApi.generateTrendingTopics(trendingForm);
          break;
        case 'audience-persona':
          response = await aiToolsApi.buildAudiencePersona(personaForm);
          break;
        case 'viral-score':
          response = await aiToolsApi.predictViralScore(viralForm);
          break;
      }
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (!activeTool) return null;

    switch (activeTool) {
      case 'script-generator':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Topic *
              </label>
              <textarea
                value={scriptForm.topic}
                onChange={(e) => setScriptForm({ ...scriptForm, topic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Script Type *
                </label>
                <select
                  value={scriptForm.type}
                  onChange={(e) => setScriptForm({ ...scriptForm, type: e.target.value as 'SHORT' | 'LONG' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="SHORT">Short (15-60s)</option>
                  <option value="LONG">Long (5+ min)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Duration (seconds)
                </label>
                <input
                  type="number"
                  value={scriptForm.targetDuration || ''}
                  onChange={(e) => setScriptForm({ ...scriptForm, targetDuration: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <PlatformSelector
              value={scriptForm.platform || 'TikTok'}
              onChange={(platform) => setScriptForm({ ...scriptForm, platform })}
              showInfo={false}
            />
            <LanguageSelector
              value={scriptForm.language || 'en'}
              onChange={(language) => setScriptForm({ ...scriptForm, language })}
              showPopular={true}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Context
              </label>
              <textarea
                value={scriptForm.additionalContext || ''}
                onChange={(e) => setScriptForm({ ...scriptForm, additionalContext: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={2}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Script'}
            </button>
          </form>
        );

      case 'rewrite':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content to Rewrite *
              </label>
              <textarea
                value={rewriteForm.content}
                onChange={(e) => setRewriteForm({ ...rewriteForm, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={6}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Style
                </label>
                <input
                  type="text"
                  value={rewriteForm.style || ''}
                  onChange={(e) => setRewriteForm({ ...rewriteForm, style: e.target.value })}
                  placeholder="e.g., casual, professional, humorous"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <PlatformSelector
                value={rewriteForm.platform || 'TikTok'}
                onChange={(platform) => setRewriteForm({ ...rewriteForm, platform })}
                showInfo={false}
              />
            </div>
            <LanguageSelector
              value={rewriteForm.language || 'en'}
              onChange={(language) => setRewriteForm({ ...rewriteForm, language })}
              showPopular={true}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Instructions
              </label>
              <textarea
                value={rewriteForm.additionalInstructions || ''}
                onChange={(e) => setRewriteForm({ ...rewriteForm, additionalInstructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={2}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Rewriting...' : 'Rewrite Content'}
            </button>
          </form>
        );

      case 'elaborate-idea':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Idea to Elaborate *
              </label>
              <textarea
                value={elaborateForm.idea}
                onChange={(e) => setElaborateForm({ ...elaborateForm, idea: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PlatformSelector
                value={elaborateForm.platform || 'TikTok'}
                onChange={(platform) => setElaborateForm({ ...elaborateForm, platform })}
                showInfo={false}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Niche
                </label>
                <input
                  type="text"
                  value={elaborateForm.niche || ''}
                  onChange={(e) => setElaborateForm({ ...elaborateForm, niche: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <LanguageSelector
              value={elaborateForm.language || 'en'}
              onChange={(language) => setElaborateForm({ ...elaborateForm, language })}
              showPopular={true}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Context
              </label>
              <textarea
                value={elaborateForm.additionalContext || ''}
                onChange={(e) => setElaborateForm({ ...elaborateForm, additionalContext: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={2}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Elaborating...' : 'Elaborate Idea'}
            </button>
          </form>
        );

      case 'optimize-title':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title to Optimize *
              </label>
              <input
                type="text"
                value={optimizeForm.title}
                onChange={(e) => setOptimizeForm({ ...optimizeForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PlatformSelector
                value={optimizeForm.platform || 'TikTok'}
                onChange={(platform) => setOptimizeForm({ ...optimizeForm, platform })}
                showInfo={false}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of Variations
                </label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={optimizeForm.variations || 5}
                  onChange={(e) => setOptimizeForm({ ...optimizeForm, variations: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <LanguageSelector
              value={optimizeForm.language || 'en'}
              onChange={(language) => setOptimizeForm({ ...optimizeForm, language })}
              showPopular={true}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Optimizing...' : 'Optimize Title'}
            </button>
          </form>
        );

      case 'calendar-autofill':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <PlatformSelector
                value={calendarForm.platform}
                onChange={(platform) => setCalendarForm({ ...calendarForm, platform })}
                showInfo={false}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Niche *
                </label>
                <input
                  type="text"
                  value={calendarForm.niche}
                  onChange={(e) => setCalendarForm({ ...calendarForm, niche: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={calendarForm.startDate}
                  onChange={(e) => setCalendarForm({ ...calendarForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={calendarForm.endDate}
                  onChange={(e) => setCalendarForm({ ...calendarForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Posts per Week
                </label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={calendarForm.postsPerWeek || 5}
                  onChange={(e) => setCalendarForm({ ...calendarForm, postsPerWeek: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <LanguageSelector
              value={calendarForm.language || 'en'}
              onChange={(language) => setCalendarForm({ ...calendarForm, language })}
              showPopular={true}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Generating Calendar...' : 'Generate Calendar'}
            </button>
          </form>
        );

      case 'competitor-analysis':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Niche *
              </label>
              <input
                type="text"
                value={competitorForm.niche}
                onChange={(e) => setCompetitorForm({ ...competitorForm, niche: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>
            <PlatformSelector
              value={competitorForm.platform || 'TikTok'}
              onChange={(platform) => setCompetitorForm({ ...competitorForm, platform })}
              showInfo={false}
            />
            <LanguageSelector
              value={competitorForm.language || 'en'}
              onChange={(language) => setCompetitorForm({ ...competitorForm, language })}
              showPopular={true}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze Competitors'}
            </button>
          </form>
        );

      case 'niche-research':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Niche *
              </label>
              <input
                type="text"
                value={nicheForm.niche}
                onChange={(e) => setNicheForm({ ...nicheForm, niche: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>
            <PlatformSelector
              value={nicheForm.platform || 'TikTok'}
              onChange={(platform) => setNicheForm({ ...nicheForm, platform })}
              showInfo={false}
            />
            <LanguageSelector
              value={nicheForm.language || 'en'}
              onChange={(language) => setNicheForm({ ...nicheForm, language })}
              showPopular={true}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Researching...' : 'Research Niche'}
            </button>
          </form>
        );

      case 'trending-topics':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Niche *
              </label>
              <input
                type="text"
                value={trendingForm.niche}
                onChange={(e) => setTrendingForm({ ...trendingForm, niche: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PlatformSelector
                value={trendingForm.platform || 'TikTok'}
                onChange={(platform) => setTrendingForm({ ...trendingForm, platform })}
                showInfo={false}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Frame
                </label>
                <select
                  value={trendingForm.timeFrame || 'weekly'}
                  onChange={(e) => setTrendingForm({ ...trendingForm, timeFrame: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Topics
              </label>
              <input
                type="number"
                min={5}
                max={20}
                value={trendingForm.count || 10}
                onChange={(e) => setTrendingForm({ ...trendingForm, count: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <LanguageSelector
              value={trendingForm.language || 'en'}
              onChange={(language) => setTrendingForm({ ...trendingForm, language })}
              showPopular={true}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Trending Topics'}
            </button>
          </form>
        );

      case 'audience-persona':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Niche *
              </label>
              <input
                type="text"
                value={personaForm.niche}
                onChange={(e) => setPersonaForm({ ...personaForm, niche: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>
            <PlatformSelector
              value={personaForm.platform || 'TikTok'}
              onChange={(platform) => setPersonaForm({ ...personaForm, platform })}
              showInfo={false}
            />
            <LanguageSelector
              value={personaForm.language || 'en'}
              onChange={(language) => setPersonaForm({ ...personaForm, language })}
              showPopular={true}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Building Persona...' : 'Build Audience Persona'}
            </button>
          </form>
        );

      case 'viral-score':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={viralForm.title}
                onChange={(e) => setViralForm({ ...viralForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={viralForm.description || ''}
                onChange={(e) => setViralForm({ ...viralForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hook
              </label>
              <textarea
                value={viralForm.hook || ''}
                onChange={(e) => setViralForm({ ...viralForm, hook: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PlatformSelector
                value={viralForm.platform}
                onChange={(platform) => setViralForm({ ...viralForm, platform })}
                showInfo={false}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Niche
                </label>
                <input
                  type="text"
                  value={viralForm.niche || ''}
                  onChange={(e) => setViralForm({ ...viralForm, niche: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <LanguageSelector
              value={viralForm.language || 'en'}
              onChange={(language) => setViralForm({ ...viralForm, language })}
              showPopular={true}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Predicting...' : 'Predict Viral Score'}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  const renderResult = () => {
    if (!result || !activeTool) return null;

    return (
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Result</h3>
        <div className="space-y-4">
          {activeTool === 'viral-score' && (
            <div>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  {(result as ViralScoreResult).viralScore}/100
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Viral Score</div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Title Score</div>
                  <div className="text-lg font-semibold">{result.breakdown.titleScore}/100</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Hook Score</div>
                  <div className="text-lg font-semibold">{result.breakdown.hookScore}/100</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Content Score</div>
                  <div className="text-lg font-semibold">{result.breakdown.contentScore}/100</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Hashtag Score</div>
                  <div className="text-lg font-semibold">{result.breakdown.hashtagScore}/100</div>
                </div>
              </div>
              {result.strengths && result.strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Strengths</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.recommendations && result.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.recommendations.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300">{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Advanced AI Tools</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Tools Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tools</h2>
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveTool(tool.id);
                        setResult(null);
                        setError('');
                      }}
                      className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                        activeTool === tool.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tool.icon}</span>
                        <div>
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{tool.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTool ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {tools.find((t) => t.id === activeTool)?.name}
                  </h2>
                  {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}
                  {renderForm()}
                  {renderResult()}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Select a tool from the sidebar to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}



