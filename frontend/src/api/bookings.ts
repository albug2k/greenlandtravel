// src/api/bookings.ts
import api from '../utils/api';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Booking {
  id: number;
  booking_reference: string;
  user_id: number;
  tour_id?: number | null;
  package_id?: number | null;
  destination: string;
  travel_date: string;
  return_date?: string | null;
  guests: number;
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded';
  total_price: number;
  created_at: string;
  // optional expanded relations returned by getById
  tour?: Record<string, unknown>;
  package?: Record<string, unknown>;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  currency: string;
  created_at: string;
}

export interface CreateBookingData {
  destination: string;
  travel_date: string;          // YYYY-MM-DD
  return_date?: string;         // YYYY-MM-DD
  guests: number;
  special_requests?: string;
  tour_id?: number;
  package_id?: number;
}

export interface CreatePaymentData {
  amount: number;
  payment_method: string;       // credit_card | paypal | stripe | bank_transfer
}

export interface PriceCalculationData {
  destination: string;
  guests: number;
  tour_id?: number;
  package_id?: number;
  travel_date?: string;
}

export interface PriceCalculationResult {
  success: boolean;
  total_price: number;
  base_price?: number;
  guests?: number;
  breakdown?: Record<string, number>;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const bookingsAPI = {
  /** Create a new booking (JWT required) */
  create: async (bookingData: CreateBookingData): Promise<Booking> => {
    const response = await api.post('/bookings', bookingData);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  /** Get all bookings for the authenticated user (JWT required) */
  getUserBookings: async (params?: {
    status?: string;
    payment_status?: string;
  }): Promise<Booking[]> => {
    const response = await api.get('/bookings', { params });
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  /** Get a single booking by ID (JWT required, must belong to user) */
  getById: async (id: string | number): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  /** Cancel a booking (JWT required) */
  cancel: async (id: string | number): Promise<{ message: string }> => {
    const response = await api.put(`/bookings/${id}/cancel`);
    if (response.data?.success) {
      return { message: response.data.message };
    }
    return response.data;
  },

  /** Get upcoming bookings for the authenticated user (JWT required) */
  getUpcoming: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings/upcoming');
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  /** Calculate total price before creating a booking (no auth required) */
  calculatePrice: async (
    data: PriceCalculationData
  ): Promise<PriceCalculationResult> => {
    const response = await api.post('/bookings/calculate-price', data);
    return response.data;
  },

  /** Get available booking dates for a destination (no auth required) */
  getAvailableDates: async (
    destinationId: string | number
  ): Promise<{ available_dates: string[]; next_available: string | null }> => {
    const response = await api.get(`/bookings/available-dates/${destinationId}`);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  /** Record a payment against a booking (JWT required) */
  createPayment: async (
    bookingId: string | number,
    paymentData: CreatePaymentData
  ): Promise<Payment> => {
    const response = await api.post(`/bookings/${bookingId}/payments`, paymentData);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  /** Get all payments for a booking (JWT required) */
  getPayments: async (bookingId: string | number): Promise<Payment[]> => {
    const response = await api.get(`/bookings/${bookingId}/payments`);
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },
};