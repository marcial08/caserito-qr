// models/user.model.ts
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  businessName: string;
  businessType: string;
  acceptedTerms: boolean;
}

// models/business.model.ts
export interface Business {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  primary_color: string;
  secondary_color: string;
  owner_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}