export interface QRCode {
  id:  number;
  name: string;
  slug: string;
  qr_color: string;
  logo_enabled: boolean;
  scan_count: number;
  last_scanned?: string | Date;
  url?: string;
  created_at?: Date;
  updated_at?: Date;
  type?: 'general' | 'table'; 
  table_number?: number; 
  location?: string; 
  business_id?: string;
  qr_image_url?: string;
}

export interface PlanLimits {
  max_qr_codes: number;
  numeric?: {
    max_qr_codes: number;
  };
  [key: string]: any;
}

export interface QRConfig {
  name: string;
  qr_color?: string;
  logo_enabled?: boolean;
}

export interface QRScanAnalytics {
  id: string;
  business_id: string;
  qr_id?: string;
  session_id: string;
  device_type: string;
  view_count: number;
  product_views: Record<string, number>;
  time_spent_seconds: number;
  accessed_at: Date;
}