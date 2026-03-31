export interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
}

export interface Destination {
  id: string;
  title: string;
  description: string;
  image: string;
  highlights: string[];
  tours: Tour[];
  gallery: string[];
  bestTime: string;
  avgTemp: string;
  currency: string;
  language: string;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  rating: number;
  destinations: string[];
  included: string[];
  itinerary: ItineraryDay[];
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  destination: string;
  travelDate: string;
  guests: number;
  specialRequests: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  bookingDate: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
  status: 'new' | 'read' | 'replied';
}