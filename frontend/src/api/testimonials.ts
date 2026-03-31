// src/api/testimonials.ts
import api from '../utils/api';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Testimonial {
  id: number;
  user_id?: number;
  name: string;
  role?: string;
  company?: string;
  content: string;
  rating: number;
  avatar_url?: string;
  featured: boolean;
  verified: boolean;
  destination?: string;
  tour_package?: string;
  created_at: string;
}

export interface CreateTestimonialData {
  name: string;
  content: string;
  rating: number;               // 1–5
  role?: string;
  company?: string;
  destination?: string;
  tour_package?: string;
}

export interface TestimonialStats {
  average_rating: number;
  total_count: number;
  rating_distribution: Array<{ rating: number; count: number }>;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const testimonialsAPI = {
  /** Get all verified testimonials with optional filters + pagination */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    min_rating?: number;
    destination?: string;
    package?: string;
    featured?: boolean;
    sort_by?: 'created_at' | 'rating' | 'random';
    sort_order?: 'asc' | 'desc';
  }): Promise<{ testimonials: Testimonial[]; total: number; pages: number }> => {
    try {
      const response = await api.get('/testimonials', { params });
      const data = response.data;

      // Paginated envelope: { success, data: { items, total, pages } }
      if (data?.success && data?.data?.items) {
        return {
          testimonials: data.data.items,
          total: data.data.total ?? data.data.items.length,
          pages: data.data.pages ?? 1,
        };
      }
      // Flat array: { success, data: [...] }
      if (data?.success && Array.isArray(data?.data)) {
        return { testimonials: data.data, total: data.data.length, pages: 1 };
      }
      return { testimonials: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('Error in testimonialsAPI.getAll:', error);
      throw error;
    }
  },

  /** Get featured + verified testimonials (up to 6, ordered by rating desc) */
  getFeatured: async (): Promise<Testimonial[]> => {
    try {
      const response = await api.get('/testimonials/featured');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching featured testimonials:', error);
      return [];
    }
  },

  /** Get aggregate stats — average rating, total count, distribution */
  getStats: async (): Promise<TestimonialStats | null> => {
    try {
      const response = await api.get('/testimonials/stats');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching testimonial stats:', error);
      return null;
    }
  },

  /** Submit a new testimonial — JWT required, starts as unverified */
  create: async (data: CreateTestimonialData): Promise<Testimonial> => {
    const response = await api.post('/testimonials', data);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },
};