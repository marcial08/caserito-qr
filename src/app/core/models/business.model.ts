export interface Business {
  id: string;
  name: string;
  slug: string;
  business_type: 'restaurant' | 'cafe' | 'bar' | 'food_truck';
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  logo_url?: string;
  cover_url?: string;
  timezone: string;
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BusinessFormData {
  name: string;
  business_type: 'restaurant' | 'cafe' | 'bar' | 'food_truck';
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  timezone: string;
  currency: string;
}