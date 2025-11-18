import api from './api';

export interface Idea {
  id: string;
  title: string;
  description?: string;
  hook?: string;
  script?: string;
  caption?: string;
  hashtags?: string[];
  categoryTags?: string[];
  customTags?: string[];
  platform: string;
  niche: string;
  tone: string;
  language?: string;
  duration?: number;
  scheduledAt?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'POSTED' | 'ARCHIVED';
  viralScore?: number;
  thumbnailSuggestion?: string;
  platformOptimization?: string;
  folderId?: string;
  folder?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GenerateIdeasDto {
  niche: string;
  platform: string;
  tone: string;
  count?: number; // 10-30
  contentLength?: string;
  contentFrequency?: string;
  additionalContext?: string;
  language?: string;
}

export interface IdeaStats {
  total: number;
  saved: number;
  scheduled: number;
  todayGenerated: number;
}

export const ideasApi = {
  generate: async (dto: GenerateIdeasDto): Promise<Idea[]> => {
    const { data } = await api.post<Idea[]>('/api/ideas/generate', dto);
    return data;
  },

  getAll: async (
    status?: string,
    platform?: string,
    search?: string,
    language?: string,
    createdAtFrom?: string,
    createdAtTo?: string,
    scheduledAtFrom?: string,
    scheduledAtTo?: string,
    viralScoreMin?: number,
    viralScoreMax?: number,
    tags?: string,
    folderId?: string,
  ): Promise<Idea[]> => {
    const params: any = {};
    if (status) params.status = status;
    if (platform) params.platform = platform;
    if (search) params.search = search;
    if (language) params.language = language;
    if (createdAtFrom) params.createdAtFrom = createdAtFrom;
    if (createdAtTo) params.createdAtTo = createdAtTo;
    if (scheduledAtFrom) params.scheduledAtFrom = scheduledAtFrom;
    if (scheduledAtTo) params.scheduledAtTo = scheduledAtTo;
    if (viralScoreMin !== undefined) params.viralScoreMin = viralScoreMin;
    if (viralScoreMax !== undefined) params.viralScoreMax = viralScoreMax;
    if (tags) params.tags = tags;
    if (folderId) params.folderId = folderId;
    const { data } = await api.get<Idea[]>('/api/ideas', { params });
    return data;
  },

  getOne: async (id: string): Promise<Idea> => {
    const { data } = await api.get<Idea>(`/api/ideas/${id}`);
    return data;
  },

  create: async (idea: Partial<Idea>): Promise<Idea> => {
    const { data } = await api.post<Idea>('/api/ideas', idea);
    return data;
  },

  update: async (id: string, updates: Partial<Idea>): Promise<Idea> => {
    const { data } = await api.patch<Idea>(`/api/ideas/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/ideas/${id}`);
  },

  getStats: async (): Promise<IdeaStats> => {
    const { data } = await api.get<IdeaStats>('/api/ideas/stats');
    return data;
  },

  getSupportedLanguages: async (): Promise<{ languages: Array<{ code: string; name: string; nativeName: string; rtl: boolean }>; default: string }> => {
    const { data } = await api.get('/api/ideas/languages');
    return data;
  },

  // Duplicate
  duplicate: async (id: string, newTitle?: string, folderId?: string): Promise<Idea> => {
    const { data } = await api.post<Idea>(`/api/ideas/${id}/duplicate`, { newTitle, folderId });
    return data;
  },

  // Archive/Unarchive
  archive: async (id: string): Promise<Idea> => {
    const { data } = await api.patch<Idea>(`/api/ideas/${id}/archive`);
    return data;
  },

  unarchive: async (id: string): Promise<Idea> => {
    const { data } = await api.patch<Idea>(`/api/ideas/${id}/unarchive`);
    return data;
  },

  // Bulk Operations
  bulkOperations: async (ideaIds: string[], operation: 'DELETE' | 'ARCHIVE' | 'UNARCHIVE' | 'MOVE' | 'EXPORT', folderId?: string, exportFormat?: 'json' | 'csv' | 'text'): Promise<any> => {
    const { data } = await api.post('/api/ideas/bulk', { ideaIds, operation, folderId, exportFormat });
    return data;
  },

  // Folders
  createFolder: async (folder: { name: string; description?: string; color?: string; icon?: string }): Promise<any> => {
    const { data } = await api.post('/api/ideas/folders', folder);
    return data;
  },

  getFolders: async (): Promise<any[]> => {
    const { data } = await api.get('/api/ideas/folders');
    return data;
  },

  updateFolder: async (id: string, folder: { name?: string; description?: string; color?: string; icon?: string }): Promise<any> => {
    const { data } = await api.put(`/api/ideas/folders/${id}`, folder);
    return data;
  },

  deleteFolder: async (id: string): Promise<void> => {
    await api.delete(`/api/ideas/folders/${id}`);
  },

  // Tags
  getAllTags: async (): Promise<string[]> => {
    const { data } = await api.get('/api/ideas/tags/all');
    return data;
  },
};

