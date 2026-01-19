export interface QRCode {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  qr_color: string;
  logo_enabled: boolean;
  scan_count: number;
  last_scanned?: Date;
  created_at: Date;
  url?: string;
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