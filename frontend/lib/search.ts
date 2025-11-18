import api from './api';
import { Idea } from './ideas';

export interface SearchResult {
  ideas: Idea[];
  folders: Array<{
    id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }>;
  total: number;
}

export interface SearchFilters {
  platforms: string[];
  statuses: string[];
  tags: string[];
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query?: string;
  filters?: {
    platforms?: string[];
    tags?: string[];
    status?: string[];
  };
  teamId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchOptions {
  query?: string;
  teamId?: string;
  platforms?: string[];
  tags?: string[];
  status?: string[];
  limit?: number;
  offset?: number;
}

export const searchApi = {
  search: async (options: SearchOptions): Promise<SearchResult> => {
    const params = new URLSearchParams();
    if (options.query) params.append('q', options.query);
    if (options.teamId) params.append('teamId', options.teamId);
    if (options.platforms?.length) params.append('platforms', options.platforms.join(','));
    if (options.tags?.length) params.append('tags', options.tags.join(','));
    if (options.status?.length) params.append('status', options.status.join(','));
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const { data } = await api.get<SearchResult>(`/api/search?${params.toString()}`);
    return data;
  },

  getFilters: async (teamId?: string): Promise<SearchFilters> => {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    const { data } = await api.get<SearchFilters>(`/api/search/filters?${params.toString()}`);
    return data;
  },

  saveSearch: async (name: string, query?: string, filters?: any, teamId?: string): Promise<SavedSearch> => {
    const { data } = await api.post<SavedSearch>('/api/search/save', {
      name,
      query,
      filters,
      teamId,
    });
    return data;
  },

  getSavedSearches: async (teamId?: string): Promise<SavedSearch[]> => {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    const { data } = await api.get<SavedSearch[]>(`/api/search/saved?${params.toString()}`);
    return data;
  },

  deleteSavedSearch: async (searchId: string): Promise<void> => {
    await api.delete(`/api/search/saved/${searchId}`);
  },
};

