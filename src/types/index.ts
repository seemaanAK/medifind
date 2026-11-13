export interface Medicine {
  id: string;
  name: string;
  manufacturer?: string;
  active_ingredients?: Array<Record<string, string>>;
  approved_uses?: string;
  precautions?: string;
  warnings?: string;
  storage_information?: string;
  source_name: string;
  source_url?: string;
  verification_status: 'verified' | 'unverified' | 'incomplete' | 'withdrawn';
  verified_at?: string;
  source_updated_at?: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address?: string;
  state?: string;
  city?: string;
  area?: string;
  pin_code?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  operating_hours?: Record<string, string>;
  source_url?: string;
  verification_status: string;
  verified_at?: string;
  source_updated_at?: string;
  distance_km?: number;
  availability_status?: 'in_stock' | 'out_of_stock' | 'unknown';
}

export interface EmergencyContact {
  id: string;
  display_name: string;
  phone_number: string;
  service_type: string;
  country_code: string;
  state_code?: string;
  region_name?: string;
  coverage_type: 'nationwide' | 'state' | 'region';
  verification_status: 'verified' | 'unverified' | 'expired' | 'withdrawn';
  verification_source_name?: string;
  verification_source_url?: string;
  last_checked_at?: string;
  notes?: string;
  is_active: boolean;
}

export interface FirstAidArticle {
  id: string;
  slug: string;
  title: string;
  topic: string;
  summary?: string;
  content: string;
  source_name: string;
  source_url: string;
  verification_status: 'verified' | 'unverified' | 'withdrawn';
  verified_at?: string;
  is_published: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta?: { page?: number; limit?: number; total?: number };
}

export interface UserProfile {
  id: string;
  display_name?: string;
  phone_e164?: string;
  country_code: string;
  country: string;
  preferred_state?: string;
  preferred_city?: string;
  preferred_language: string;
  notification_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionScheduleRecord {
  id: string;
  user_id: string;
  medicine_id?: string;
  medicine_name: string;
  prescribed_dosage: string;
  prescribed_times: Array<{ time: string; label: string }>;
  start_date?: string;
  end_date?: string;
  prescribed_duration_text?: string;
  prescription_reference?: string;
  clinician_name?: string;
  notes?: string;
  reminder_enabled: boolean;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface FirstAidItemRecord {
  id: string;
  user_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
  storage_notes?: string;
  created_at: string;
  updated_at: string;
}
