// src/api/destinations.ts
import api from '../utils/api';

export interface Destination {
  id: string;
  name?: string;
  title: string;
  slug?: string;
  description: string;
  image?: string;
  image_url?: string;
  thumbnail_url?: string | null;
  highlights?: string[] | Array<{ text: string; icon?: string }>;
  bestTime?: string;
  best_time?: string;
  avgTemp?: string;
  avg_temp?: string;
  currency?: string;
  language?: string;
  country?: string;
  continent?: string;
  location?: string;
  popular?: boolean;
  featured?: boolean;
  toursCount?: number;
  tours_count?: number;
  gallery?: string[] | Array<{ image_url: string; caption?: string }>;
  createdAt?: string;
  updatedAt?: string;
  base_price?: number;
  basePrice?: number;
  visa_info?: string;
  visaInfo?: string;
  views?: number;
  active?: boolean;
}

export interface CreateDestinationData {
  name: string;
  title: string;
  description: string;
  image: string;
  highlights: string[];
  bestTime: string;
  avgTemp: string;
  currency: string;
  language: string;
  country: string;
  continent: string;
  popular?: boolean;
  featured?: boolean;
  gallery?: string[];
}

export interface UpdateDestinationData extends Partial<CreateDestinationData> {}

export const destinationsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    continent?: string;
    popular?: boolean;
    featured?: boolean;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
  }): Promise<{ destinations: Destination[]; total: number; pages: number }> => {
    try {
      const response = await api.get('/destinations', { params });
      console.log('Destinations API response:', response.data);
      
      // Handle different response structures
      if (response.data && response.data.success && response.data.data) {
        if (Array.isArray(response.data.data)) {
          return {
            destinations: response.data.data,
            total: response.data.data.length,
            pages: Math.ceil(response.data.data.length / (params?.limit || 12))
          };
        }
        if (response.data.data.items) {
          return {
            destinations: response.data.data.items,
            total: response.data.data.total || response.data.data.items.length,
            pages: response.data.data.pages || Math.ceil(response.data.data.items.length / (params?.limit || 12))
          };
        }
      }
      
      if (response.data && response.data.destinations) {
        return response.data;
      }
      
      if (Array.isArray(response.data)) {
        return {
          destinations: response.data,
          total: response.data.length,
          pages: Math.ceil(response.data.length / (params?.limit || 12))
        };
      }
      
      return { destinations: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('Error in destinationsAPI.getAll:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Destination> => {
    const response = await api.get(`/destinations/${id}`);
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Destination> => {
    const response = await api.get(`/destinations/slug/${slug}`);
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  create: async (destinationData: CreateDestinationData): Promise<Destination> => {
    const response = await api.post('/destinations', destinationData);
    return response.data;
  },

  update: async (id: string, destinationData: UpdateDestinationData): Promise<Destination> => {
    const response = await api.put(`/destinations/${id}`, destinationData);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/destinations/${id}`);
    return response.data;
  },

  getPopular: async (): Promise<Destination[]> => {
    const response = await api.get('/destinations/popular');
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  getFeatured: async (): Promise<Destination[]> => {
    const response = await api.get('/destinations/featured');
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  search: async (query: string): Promise<Destination[]> => {
    const response = await api.get('/destinations/search', { params: { q: query } });
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  getContinents: async (): Promise<string[]> => {
    try {
      const response = await api.get('/destinations/continents');
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching continents:', error);
      return [];
    }
  }
};