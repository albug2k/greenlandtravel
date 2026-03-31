// src/api/gallery.ts
import api from '../utils/api';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface GalleryImage {
  id: number;
  image_url: string;
  caption?: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  slug: string;
  location?: string;
  country?: string;
  category?: string;
  description?: string;
  featured: boolean;
  images: GalleryImage[];
  created_at: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const galleryAPI = {
  /** Get all gallery items with optional filters */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    location?: string;
    country?: string;
    featured?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{ items: GalleryItem[]; total: number; pages: number }> => {
    try {
      const response = await api.get('/gallery', { params });
      const data = response.data;

      // Handle paginated envelope: { success, data: { items, total, pages } }
      if (data?.success && data?.data?.items) {
        return {
          items: data.data.items,
          total: data.data.total ?? data.data.items.length,
          pages: data.data.pages ?? 1,
        };
      }
      // Handle flat array envelope: { success, data: [...] }
      if (data?.success && Array.isArray(data?.data)) {
        return { items: data.data, total: data.data.length, pages: 1 };
      }
      // Fallback
      return { items: [], total: 0, pages: 0 };
    } catch (error) {
      console.error('Error in galleryAPI.getAll:', error);
      throw error;
    }
  },

  /** Get a single gallery item by numeric ID */
  getById: async (id: string | number): Promise<GalleryItem> => {
    const response = await api.get(`/gallery/${id}`);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  /** Get a single gallery item by slug */
  getBySlug: async (slug: string): Promise<GalleryItem> => {
    const response = await api.get(`/gallery/slug/${slug}`);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  /** Get featured gallery items (up to 12) */
  getFeatured: async (): Promise<GalleryItem[]> => {
    try {
      const response = await api.get('/gallery/featured');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching featured gallery:', error);
      return [];
    }
  },

  /** Get distinct categories */
  getCategories: async (): Promise<string[]> => {
    try {
      const response = await api.get('/gallery/categories');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      console.error('Error fetching gallery categories:', error);
      return [];
    }
  },

  /** Get distinct locations */
  getLocations: async (): Promise<string[]> => {
    try {
      const response = await api.get('/gallery/locations');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      console.error('Error fetching gallery locations:', error);
      return [];
    }
  },
};