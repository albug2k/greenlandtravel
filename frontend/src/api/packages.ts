// src/api/packages.ts
import api from '../utils/api';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface PackageFeature {
  id: number;
  text: string;
  icon?: string;
}

export interface PackageItineraryItem {
  day: number;
  title: string;
  description?: string;
}

export interface Package {
  id: number;
  title: string;
  slug: string;
  image_url?: string;
  description?: string;
  duration?: string;
  group_size?: string;
  base_price: number;
  discount_price?: number;
  rating: number;
  reviews: number;
  featured: boolean;
  popular: boolean;
  category?: string;
  difficulty?: string;
  season?: string;
  destinations: string[];    // parsed from comma-separated IDs by backend
  tags: string[];            // parsed from comma-separated tags by backend
  features: PackageFeature[];
  itinerary: PackageItineraryItem[];
  // Only present when fetched by ID (get_package route adds this)
  destinations_data?: DestinationSummary[];
}

export interface DestinationSummary {
  id: number;
  title: string;
  slug?: string;
  location?: string;
  country?: string;
  image_url?: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const packagesAPI = {
  /** Get all packages with optional filters and pagination */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    difficulty?: string;
    season?: string;
    featured?: boolean;
    popular?: boolean;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{ packages: Package[]; total: number; pages: number }> => {
    try {
      const response = await api.get('/packages', { params });
      const data = response.data;

      // Handle paginated envelope: { success, data: { items, total, pages } }
      if (data?.success && data?.data?.items) {
        return {
          packages: data.data.items,
          total: data.data.total ?? data.data.items.length,
          pages: data.data.pages ?? 1,
        };
      }
      // Handle flat array: { success, data: [...] }
      if (data?.success && Array.isArray(data?.data)) {
        return { packages: data.data, total: data.data.length, pages: 1 };
      }
      return { packages: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('Error in packagesAPI.getAll:', error);
      throw error;
    }
  },

  /** Get a single package by numeric ID (includes destinations_data) */
  getById: async (id: string | number): Promise<Package> => {
    const response = await api.get(`/packages/${id}`);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  /** Get a single package by slug */
  getBySlug: async (slug: string): Promise<Package> => {
    const response = await api.get(`/packages/slug/${slug}`);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  /** Get featured packages (up to 6, ordered by rating desc) */
  getFeatured: async (): Promise<Package[]> => {
    try {
      const response = await api.get('/packages/featured');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching featured packages:', error);
      return [];
    }
  },

  /** Get distinct category values */
  getCategories: async (): Promise<string[]> => {
    try {
      const response = await api.get('/packages/categories');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      console.error('Error fetching package categories:', error);
      return [];
    }
  },
};