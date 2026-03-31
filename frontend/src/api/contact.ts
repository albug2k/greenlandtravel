// src/api/contact.ts
import api from '../utils/api';

export interface ContactMessage {
  id:            number;
  name:          string;
  email:         string;
  subject?:      string;
  message:       string;
  read:          boolean;
  replied:       boolean;
  reply_message: string | null;
  category:      string;
  created_at:    string;
}

export interface CreateContactData {
  name:      string;
  email:     string;
  subject?:  string;
  message:   string;
  category?: 'general' | 'booking' | 'support' | 'feedback';
}

export const contactAPI = {
  /** Submit a contact form — no auth required.
   *  Trailing slash is required: Flask blueprint is registered at /api/contact
   *  and the route is @contact_bp.route('/'), so the full path is /contact/  */
  submit: async (data: CreateContactData): Promise<ContactMessage> => {
    const res = await api.post('/contact/', data);
    return res.data?.data ?? res.data;
  },

  /** Get all messages — admin JWT required */
  getAll: async (params?: {
    read?:     boolean;
    replied?:  boolean;
    category?: string;
    per_page?: number;
  }): Promise<{ items: ContactMessage[]; total: number; unread_count: number }> => {
    const res = await api.get('/contact/', { params: { per_page: 100, ...params } });
    const body = res.data?.data ?? res.data;
    // handle both flat array (old) and paginated object (new)
    if (Array.isArray(body)) {
      return { items: body, total: body.length, unread_count: 0 };
    }
    return {
      items:        body?.items        ?? [],
      total:        body?.total        ?? 0,
      unread_count: body?.unread_count ?? 0,
    };
  },

  /** Get single message — admin JWT required. Also auto-marks it read. */
  getById: async (id: number): Promise<ContactMessage> => {
    const res = await api.get(`/contact/${id}`);
    return res.data?.data ?? res.data;
  },

  /** Mark read/unread */
  markRead: async (id: number, read = true): Promise<void> => {
    await api.put(`/contact/${id}/mark-read`, { read });
  },

  /** Send a reply — admin JWT required */
  reply: async (id: number, reply_message: string): Promise<ContactMessage> => {
    const res = await api.post(`/contact/${id}/reply`, { reply_message });
    return res.data?.data ?? res.data;
  },

  /** Delete a message — admin JWT required */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/contact/${id}`);
  },
};