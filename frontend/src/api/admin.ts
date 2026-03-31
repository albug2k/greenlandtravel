// src/api/admin.ts
// Route mapping:
//   GET  /admin/stats
//   GET  /admin/users                    PUT  /admin/users/:id           DELETE /admin/users/:id
//   GET  /admin/destinations             POST /admin/destinations
//     PUT  /admin/destinations/:id       DELETE /admin/destinations/:id
//   GET  /admin/blogs                    POST /admin/blogs
//     PUT  /admin/blogs/:id              DELETE /admin/blogs/:id
//   GET  /admin/gallery                  POST /admin/gallery
//     PUT  /admin/gallery/:id            DELETE /admin/gallery/:id
//   GET  /admin/packages (via public)    POST /admin/packages
//     PUT  /admin/packages/:id           DELETE /admin/packages/:id
//   GET  /testimonials          PUT  /testimonials/:id/verify  PUT /testimonials/:id/feature
//   GET  /admin/bookings        PUT  /admin/bookings/:id/update-status

import api from '../utils/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  users: number;
  destinations: number;
  packages: number;
  blogs: number;
  gallery_items: number;
  bookings: number;
  recent_bookings: AdminBooking[];
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface AdminDestination {
  id: number;
  title: string;
  slug: string;
  image_url?: string;
  description: string;
  location: string;
  country?: string;
  continent?: string;
  best_time?: string;
  avg_temp?: string;
  currency?: string;
  language?: string;
  base_price: number;
  featured: boolean;
  popular: boolean;
  active: boolean;
  views: number;
  tours_count?: number;
}

export interface AdminPackage {
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
}

export interface AdminBlog {
  id: number;
  title: string;
  slug: string;
  image_url?: string;
  excerpt?: string;
  content: string;
  author?: string;
  category?: string;
  read_time?: string;
  date?: string;
  published_at: string;
  published: boolean;
  featured: boolean;
  views: number;
  tags: string[];
}

export interface AdminGallery {
  id: number;
  title: string;
  slug: string;
  location?: string;
  country?: string;
  category?: string;
  description?: string;
  featured: boolean;
  images: Array<{ id: number; image_url: string; caption?: string }>;
  created_at: string;
}

export interface AdminTestimonial {
  id: number;
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

export interface AdminBooking {
  id: number;
  booking_reference: string;
  user_id: number;
  destination: string;
  travel_date: string;
  return_date?: string;
  guests: number;
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded';
  total_price: number;
  created_at: string;
}

// ── Response unwrappers ───────────────────────────────────────────────────────

const unwrap = (res: any) => {
  if (res.data?.success && res.data?.data !== undefined) return res.data.data;
  return res.data;
};

const unwrapList = (res: any): any[] => {
  const d = unwrap(res);
  if (Array.isArray(d)) return d;
  if (d?.items) return d.items;
  return [];
};

// ── API ───────────────────────────────────────────────────────────────────────

export const adminAPI = {

  // ── Stats ──────────────────────────────────────────────────────────────────
  getStats: async (): Promise<AdminStats> => {
    const res = await api.get('/admin/stats');
    return unwrap(res);
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  getUsers: async (): Promise<AdminUser[]> => {
    const res = await api.get('/admin/users');
    return unwrapList(res);
  },
  updateUser: async (id: number, data: {
    name?: string; email?: string; phone?: string;
    is_active?: boolean; is_admin?: boolean;
    avatar_url?: string; password?: string;
  }): Promise<AdminUser> => {
    const res = await api.put(`/admin/users/${id}`, data);
    return unwrap(res);
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  // ── Destinations ───────────────────────────────────────────────────────────
  getDestinations: async (): Promise<AdminDestination[]> => {
    // Uses new GET /admin/destinations — returns ALL destinations (no active=True filter)
    const res = await api.get('/admin/destinations', { params: { per_page: 200 } });
    const outer = res.data?.data ?? res.data;
    if (Array.isArray(outer)) return outer;
    if (Array.isArray(outer?.items)) return outer.items;
    return [];
  },
    createDestination: async (data: Partial<AdminDestination>): Promise<AdminDestination> => {
    const res = await api.post('/admin/destinations', data);
    return unwrap(res);
  },
  updateDestination: async (id: number, data: Partial<AdminDestination>): Promise<AdminDestination> => {
    const res = await api.put(`/admin/destinations/${id}`, data);
    return unwrap(res);
  },
  deleteDestination: async (id: number): Promise<void> => {
    await api.delete(`/admin/destinations/${id}`);
    // Note: backend soft-deletes (sets active=False) rather than hard deletes
  },

  // ── Packages ───────────────────────────────────────────────────────────────
  getPackages: async (): Promise<AdminPackage[]> => {
    // Try /packages first, then /packages/ (Flask strict_slashes can cause redirects)
    let res;
    try {
      res = await api.get('/packages', { params: { limit: 200, per_page: 200 } });
    } catch (err: any) {
      // If /packages fails, try with trailing slash
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        res = await api.get('/packages/', { params: { limit: 200, per_page: 200 } });
      } else {
        throw err;
      }
    }
    const outer = res.data?.data ?? res.data;
    if (Array.isArray(outer)) return outer;
    if (Array.isArray(outer?.items)) return outer.items;
    return [];
  },
  createPackage: async (data: Partial<AdminPackage>): Promise<AdminPackage> => {
    const res = await api.post('/admin/packages', data);
    return unwrap(res);
  },
  updatePackage: async (id: number, data: Partial<AdminPackage>): Promise<AdminPackage> => {
    const res = await api.put(`/admin/packages/${id}`, data);
    return unwrap(res);
  },
  deletePackage: async (id: number): Promise<void> => {
    await api.delete(`/admin/packages/${id}`);
  },

  // ── Blogs ──────────────────────────────────────────────────────────────────
  getBlogs: async (): Promise<AdminBlog[]> => {
    // Uses new GET /admin/blogs — returns ALL blogs including unpublished drafts
    const res = await api.get('/admin/blogs', { params: { per_page: 200 } });
    const outer = res.data?.data ?? res.data;
    if (Array.isArray(outer)) return outer;
    if (Array.isArray(outer?.items)) return outer.items;
    return [];
  },
    createBlog: async (data: Partial<AdminBlog>): Promise<AdminBlog> => {
    const res = await api.post('/admin/blogs', data);
    return unwrap(res);
  },
  updateBlog: async (id: number, data: Partial<AdminBlog>): Promise<AdminBlog> => {
    const res = await api.put(`/admin/blogs/${id}`, data);
    return unwrap(res);
  },
  deleteBlog: async (id: number): Promise<void> => {
    await api.delete(`/admin/blogs/${id}`);
  },

  // ── Gallery ────────────────────────────────────────────────────────────────
  getGallery: async (): Promise<AdminGallery[]> => {
    // Uses new GET /admin/gallery — returns ALL gallery items
    const res = await api.get('/admin/gallery', { params: { per_page: 200 } });
    const outer = res.data?.data ?? res.data;
    if (Array.isArray(outer)) return outer;
    if (Array.isArray(outer?.items)) return outer.items;
    return [];
  },
    createGallery: async (data: Partial<AdminGallery>): Promise<AdminGallery> => {
    const res = await api.post('/admin/gallery', data);
    return unwrap(res);
  },
  updateGallery: async (id: number, data: Partial<AdminGallery>): Promise<AdminGallery> => {
    const res = await api.put(`/admin/gallery/${id}`, data);
    return unwrap(res);
  },
  deleteGallery: async (id: number): Promise<void> => {
    await api.delete(`/admin/gallery/${id}`);
  },

  // ── Testimonials (verify/feature only — no admin create) ──────────────────
  getTestimonials: async (): Promise<AdminTestimonial[]> => {
    // Admin needs ALL testimonials including unverified - pass verified=false if backend supports it
    let res;
    try {
      res = await api.get('/testimonials', { params: { limit: 200, per_page: 200 } });
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        res = await api.get('/testimonials/', { params: { limit: 200, per_page: 200 } });
      } else {
        throw err;
      }
    }
    const outer = res.data?.data ?? res.data;
    if (Array.isArray(outer)) return outer;
    if (Array.isArray(outer?.items)) return outer.items;
    return [];
  },
  verifyTestimonial: async (id: number): Promise<void> => {
    await api.put(`/testimonials/${id}/verify`);
  },
  featureTestimonial: async (id: number): Promise<void> => {
    await api.put(`/testimonials/${id}/feature`);
  },

  // ── Bookings ───────────────────────────────────────────────────────────────
  getBookings: async (params?: {
    status?: string;
    payment_status?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ items: AdminBooking[]; total: number; pages: number; page: number }> => {
    const res = await api.get('/admin/bookings', { params });
    const d = unwrap(res);
    if (d?.items) return { items: d.items, total: d.total ?? d.items.length, pages: d.pages ?? 1, page: d.page ?? 1 };
    return { items: Array.isArray(d) ? d : [], total: 0, pages: 1, page: 1 };
  },
  updateBookingStatus: async (id: number, status: string): Promise<AdminBooking> => {
    const res = await api.put(`/admin/bookings/${id}/update-status`, { status });
    return unwrap(res);
  },
};