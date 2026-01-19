export interface Category {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  display_order: number;
  cover_image_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  product_count?: number;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string;
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
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_modifier: number;
  is_default: boolean;
  sort_order: number;
}

export interface ProductFormData {
  name: string;
  category_id: string;
  description?: string;
  base_price: number;
  compare_price?: number;
  sku?: string;
  is_available: boolean;
  tags: string[];
  images: File[];
  variants: ProductVariantForm[];
}

export interface ProductVariantForm {
  name: string;
  price_modifier: number;
  is_default: boolean;
}