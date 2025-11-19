import api from './api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  category?: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  views: number;
  likes: number;
  shares: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name?: string;
    profileImage?: string;
  };
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const blogApi = {
  getPublishedPosts: async (page: number = 1, limit: number = 10, category?: string): Promise<BlogPostsResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (category) params.append('category', category);
    const { data } = await api.get<BlogPostsResponse>(`/api/blog/posts?${params.toString()}`);
    return data;
  },

  getPostBySlug: async (slug: string): Promise<BlogPost> => {
    const { data } = await api.get<BlogPost>(`/api/blog/posts/${slug}`);
    return data;
  },

  getCategories: async (): Promise<Array<{ category: string; count: number }>> => {
    const { data } = await api.get<Array<{ category: string; count: number }>>('/api/blog/categories');
    return data;
  },

  createPost: async (post: {
    title: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    category?: string;
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  }): Promise<BlogPost> => {
    const { data } = await api.post<BlogPost>('/api/blog/posts', post);
    return data;
  },

  updatePost: async (postId: string, post: {
    title?: string;
    excerpt?: string;
    content?: string;
    featuredImage?: string;
    category?: string;
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  }): Promise<BlogPost> => {
    const { data } = await api.put<BlogPost>(`/api/blog/posts/${postId}`, post);
    return data;
  },

  getMyPosts: async (): Promise<BlogPost[]> => {
    const { data } = await api.get<BlogPost[]>('/api/blog/my-posts');
    return data;
  },

  deletePost: async (postId: string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(`/api/blog/posts/${postId}`);
    return data;
  },
};


