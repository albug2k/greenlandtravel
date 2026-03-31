// src/api/blogs.ts
import api from '../utils/api';

export interface Blog {
  id: number | string;
  title: string;
  content: string;
  excerpt: string;
  image_url: string;
  thumbnail_url?: string | null;
  author: string;
  author_avatar?: string | null;
  category: string;
  read_time: string;
  tags: string[];
  slug: string;
  views: number;
  published: boolean;
  image?: string; // For compatibility
  date?: string; // For compatibility
  readTime?: string; // For compatibility
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBlogData {
  title: string;
  content: string;
  excerpt: string;
  image: string;
  author: string;
  readTime: string;
  category: string;
  tags: string[];
  featured?: boolean;
}

export interface UpdateBlogData extends Partial<CreateBlogData> {}

export const blogsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    featured?: boolean;
  }): Promise<{ blogs: Blog[]; total: number; pages: number }> => {
    try {
      const response = await api.get('/blogs', { params });
      console.log('Raw API response:', response.data); // Debug log
      
      // Handle your backend response structure: { data: { items: [...], has_next, has_prev } }
      if (response.data && response.data.data && response.data.data.items) {
        const items = response.data.data.items;
        return {
          blogs: items,
          total: items.length,
          pages: response.data.data.has_next ? Math.ceil(items.length / (params?.limit || 10)) + 1 : 1
        };
      }
      
      // If response has data property that's an array
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return {
          blogs: response.data.data,
          total: response.data.data.length,
          pages: Math.ceil(response.data.data.length / (params?.limit || 10))
        };
      }
      
      // If response is directly an array
      if (Array.isArray(response.data)) {
        return {
          blogs: response.data,
          total: response.data.length,
          pages: Math.ceil(response.data.length / (params?.limit || 10))
        };
      }
      
      console.error('Unexpected API response structure:', response.data);
      return { blogs: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Blog> => {
    const response = await api.get(`/blogs/${id}`);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Blog> => {
    const response = await api.get(`/blogs/slug/${slug}`);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  getFeatured: async (): Promise<Blog[]> => {
    const response = await api.get('/blogs/featured');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  getLatest: async (): Promise<Blog[]> => {
    const response = await api.get('/blogs/latest');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/blogs/categories');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  getAuthors: async (): Promise<string[]> => {
    const response = await api.get('/blogs/authors');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  create: async (blogData: CreateBlogData): Promise<Blog> => {
    const response = await api.post('/blogs', blogData);
    return response.data;
  },

  update: async (id: string, blogData: UpdateBlogData): Promise<Blog> => {
    const response = await api.put(`/blogs/${id}`, blogData);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/blogs/${id}`);
    return response.data;
  }
};