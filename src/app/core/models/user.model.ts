export interface User {
  id: string;
  business_id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
  permissions: {
    menu: boolean;
    analytics: boolean;
    billing: boolean;
    settings: boolean;
  };
  last_login?: Date;
  created_at: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  business_name: string;
  business_type: 'restaurant' | 'cafe' | 'bar' | 'food_truck';
}