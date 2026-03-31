//src/api/tours.ts
import api from '../utils/api';

export interface Tour {
  id: string;
  name: string;
  title: string;
  description: string;
  itinerary: string[];
  duration: string;
  groupSize: string;
  price: number;
  discountedPrice?: number;
  rating: number;
  reviews: number;
  destinations: string[];
  included: string[];
  excluded: string[];
  itineraryDetails: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  featured: boolean;
  popular: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTourData {
  name: string;
  title: string;
  description: string;
  itinerary: string[];
  duration: string;
  groupSize: string;
  price: number;
  discountedPrice?: number;
  destinations: string[];
  included: string[];
  excluded: string[];
  itineraryDetails: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  featured?: boolean;
  popular?: boolean;
  images?: string[];
}

export interface UpdateTourData extends Partial<CreateTourData> {}

export const toursAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    duration?: string;
    destination?: string;
    featured?: boolean;
    popular?: boolean;
  }): Promise<{ tours: Tour[]; total: number; pages: number }> => {
    const response = await api.get('/tours', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Tour> => {
    const response = await api.get(`/tours/${id}`);
    return response.data;
  },

  create: async (tourData: CreateTourData): Promise<Tour> => {
    const response = await api.post('/tours', tourData);
    return response.data;
  },

  update: async (id: string, tourData: UpdateTourData): Promise<Tour> => {
    const response = await api.put(`/tours/${id}`, tourData);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/tours/${id}`);
    return response.data;
  },

  getFeatured: async (): Promise<Tour[]> => {
    const response = await api.get('/tours/featured');
    return response.data;
  },

  getPopular: async (): Promise<Tour[]> => {
    const response = await api.get('/tours/popular');
    return response.data;
  },

  search: async (query: string): Promise<Tour[]> => {
    const response = await api.get('/tours/search', { params: { q: query } });
    return response.data;
  },

  getByDestination: async (destinationId: string): Promise<Tour[]> => {
    const response = await api.get(`/tours/destination/${destinationId}`);
    return response.data;
  },

  getReviews: async (tourId: string): Promise<any[]> => {
    const response = await api.get(`/tours/${tourId}/reviews`);
    return response.data;
  }
};