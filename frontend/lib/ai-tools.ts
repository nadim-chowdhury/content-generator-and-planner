import api from './api';

// Script Generator
export interface ScriptGeneratorDto {
  topic: string;
  type: 'SHORT' | 'LONG';
  platform?: string;
  tone?: string;
  targetDuration?: number;
  additionalContext?: string;
  language?: string;
}

export interface ScriptResult {
  hook: string;
  script: string;
  keyPoints: string[];
  cta: string;
}

// Rewrite Tool
export interface RewriteDto {
  content: string;
  style?: string;
  targetAudience?: string;
  platform?: string;
  additionalInstructions?: string;
  language?: string;
}

export interface RewriteResult {
  rewritten: string;
  improvements: string[];
  wordCount: number;
}

// Idea Elaboration
export interface ElaborateIdeaDto {
  idea: string;
  platform?: string;
  niche?: string;
  additionalContext?: string;
  language?: string;
}

export interface ElaborateIdeaResult {
  expandedIdea: string;
  keyPoints: string[];
  contentStructure: string;
  hashtags: string[];
  estimatedDuration?: number;
}

// Title Optimization
export interface OptimizeTitleDto {
  title: string;
  platform?: string;
  niche?: string;
  variations?: number;
  additionalContext?: string;
  language?: string;
}

export interface OptimizeTitleResult {
  variations: string[];
  analysis: string;
  recommendations: string;
}

// Calendar Auto-fill
export interface CalendarAutofillDto {
  platform: string;
  niche: string;
  startDate: string;
  endDate: string;
  postsPerWeek?: number;
  tone?: string;
  additionalContext?: string;
  language?: string;
}

export interface CalendarAutofillResult {
  calendar: Array<{
    date: string;
    title: string;
    description: string;
    type: string;
    hashtags: string[];
  }>;
  strategy: string;
  themes: string[];
}

// Competitor Analysis
export interface CompetitorAnalysisDto {
  niche: string;
  platform?: string;
  competitors?: string[];
  language?: string;
}

export interface CompetitorAnalysisResult {
  topCompetitors: Array<{
    name: string;
    strengths: string[];
    contentStrategy: string;
    engagementRate: string;
  }>;
  trends: string[];
  opportunities: string[];
  bestPractices: string[];
  gaps: string[];
}

// Niche Research
export interface NicheResearchDto {
  niche: string;
  platform?: string;
  additionalContext?: string;
  language?: string;
}

export interface NicheResearchResult {
  nicheOverview: string;
  targetAudience: string;
  contentTypes: string[];
  trendingTopics: string[];
  hashtags: string[];
  competitors: string[];
  opportunities: string[];
  challenges: string[];
  growthPotential: string;
  monetization: string;
}

// Trending Topics
export interface TrendingTopicsDto {
  niche: string;
  platform?: string;
  count?: number;
  timeFrame?: 'daily' | 'weekly' | 'monthly';
  language?: string;
}

export interface TrendingTopicsResult {
  topics: Array<{
    title: string;
    description: string;
    trendScore: number;
    hashtags: string[];
    contentIdeas: string[];
    whyTrending: string;
  }>;
  overallTrends: string;
}

// Audience Persona
export interface AudiencePersonaDto {
  niche: string;
  platform?: string;
  additionalContext?: string;
  language?: string;
}

export interface AudiencePersonaResult {
  persona: {
    name: string;
    age: string;
    gender: string;
    location: string;
    interests: string[];
    painPoints: string[];
    goals: string[];
    contentPreferences: string[];
    activePlatforms: string[];
    engagementPatterns: string;
    values: string[];
    buyingBehavior: string;
  };
  contentStrategy: string;
  messaging: string;
}

// Viral Score Predictor
export interface ViralScoreDto {
  title: string;
  description?: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
  platform: string;
  niche?: string;
  language?: string;
}

export interface ViralScoreResult {
  viralScore: number;
  breakdown: {
    titleScore: number;
    hookScore: number;
    contentScore: number;
    hashtagScore: number;
    platformOptimization: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  trendAlignment: number;
  engagementPotential: number;
}

export const aiToolsApi = {
  // Script Generator
  generateScript: async (dto: ScriptGeneratorDto): Promise<ScriptResult> => {
    const { data } = await api.post<ScriptResult>('/api/ai-tools/script-generator', dto);
    return data;
  },

  // Rewrite Tool
  rewriteContent: async (dto: RewriteDto): Promise<RewriteResult> => {
    const { data } = await api.post<RewriteResult>('/api/ai-tools/rewrite', dto);
    return data;
  },

  // Idea Elaboration
  elaborateIdea: async (dto: ElaborateIdeaDto): Promise<ElaborateIdeaResult> => {
    const { data } = await api.post<ElaborateIdeaResult>('/api/ai-tools/elaborate-idea', dto);
    return data;
  },

  // Title Optimization
  optimizeTitle: async (dto: OptimizeTitleDto): Promise<OptimizeTitleResult> => {
    const { data } = await api.post<OptimizeTitleResult>('/api/ai-tools/optimize-title', dto);
    return data;
  },

  // Calendar Auto-fill
  autofillCalendar: async (dto: CalendarAutofillDto): Promise<CalendarAutofillResult> => {
    const { data } = await api.post<CalendarAutofillResult>('/api/ai-tools/calendar-autofill', dto);
    return data;
  },

  // Competitor Analysis
  analyzeCompetitors: async (dto: CompetitorAnalysisDto): Promise<CompetitorAnalysisResult> => {
    const { data } = await api.post<CompetitorAnalysisResult>('/api/ai-tools/competitor-analysis', dto);
    return data;
  },

  // Niche Research
  researchNiche: async (dto: NicheResearchDto): Promise<NicheResearchResult> => {
    const { data } = await api.post<NicheResearchResult>('/api/ai-tools/niche-research', dto);
    return data;
  },

  // Trending Topics
  generateTrendingTopics: async (dto: TrendingTopicsDto): Promise<TrendingTopicsResult> => {
    const { data } = await api.post<TrendingTopicsResult>('/api/ai-tools/trending-topics', dto);
    return data;
  },

  // Audience Persona
  buildAudiencePersona: async (dto: AudiencePersonaDto): Promise<AudiencePersonaResult> => {
    const { data } = await api.post<AudiencePersonaResult>('/api/ai-tools/audience-persona', dto);
    return data;
  },

  // Viral Score Predictor
  predictViralScore: async (dto: ViralScoreDto): Promise<ViralScoreResult> => {
    const { data } = await api.post<ViralScoreResult>('/api/ai-tools/viral-score', dto);
    return data;
  },
};

