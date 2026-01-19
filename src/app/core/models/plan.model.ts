export interface Plan {
  id: string;
  name: 'basic' | 'professional' | 'enterprise' | 'lifetime';
  title: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: PlanFeature[];
  limits: PlanLimits;
  is_popular?: boolean;
}

export interface PlanFeature {
  name: string;
  enabled: boolean;
  tooltip?: string;
}

// Separar límites numéricos de características booleanas
export interface PlanLimits {
  numeric: NumericLimits;
  features: PlanFeatures;
}

export interface NumericLimits {
  max_categories: number;
  max_products: number;
  max_qr_codes: number;
  max_staff_users: number;
  analytics_days: number;
}

export interface PlanFeatures {
  custom_domain: boolean;
  remove_branding: boolean;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_type: 'basic' | 'professional' | 'enterprise' | 'lifetime';
  status: 'active' | 'past_due' | 'canceled' | 'expired';
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  payment_method: 'stripe' | 'paypal' | 'manual';
  lifetime_key?: string;
}