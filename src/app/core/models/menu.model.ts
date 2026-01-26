export interface Product {
  id: number;  
  business_id: string;
  category_id: number; 
  name: string;
  description?: string;
  base_price: number;
  compare_price?: number;
  cost_price?: number;
  sku?: string;
  is_available: boolean;
  tags: string[];
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  currency: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  category?: Category;
}

export interface ProductImage {
  id: number;  
  entity_id?: number | undefined
  product_id: number; 
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
   file?: File; 
}

export interface ProductVariant {
  id: number;  
  product_id: number; 
  name: string;
  price_modifier: number;
  is_default: boolean;
  sort_order: number;
}

export interface Category {
  id?: number; 
  business_id: string;
  name: string;
  description?: string;
  display_order: number;
  cover_image_url?: string; 
  is_active: boolean;
  created_at?: Date; 
  updated_at?: Date;
  product_count?: number;
  gallery?: any[]; 
  
}