import api from './api';

export const sharingApi = {
  getIdeaImageUrl: (ideaId: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${baseUrl}/api/sharing/idea/${ideaId}/image`;
  },

  generateContentCard: async (data: {
    title: string;
    content: string;
    platform?: string;
    author?: string;
  }): Promise<Blob> => {
    const response = await api.post('/api/sharing/content-card', data, {
      responseType: 'blob',
    });
    return response.data;
  },
};

