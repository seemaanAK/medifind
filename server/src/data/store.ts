import { SEED_EMERGENCY_CONTACTS, SEED_MEDICINES, SEED_PHARMACIES, SEED_FIRST_AID_ARTICLES } from './seedData.js';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from '../config/index.js';

export interface ProfileRecord {
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

export interface PrescriptionRecord {
  id: string;
  user_id: string;
  medicine_id?: string;
  medicine_name: string;
  prescribed_dosage: string;
  prescribed_times: Array<{ time: string; label: string }>;
  start_date?: string | null;
  end_date?: string | null;
  prescribed_duration_text?: string;
  prescription_reference?: string;
  clinician_name?: string;
  notes?: string;
  reminder_enabled: boolean;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface DoseEventRecord {
  id: string;
  user_id: string;
  schedule_id: string;
  scheduled_at: string;
  status: 'pending' | 'taken' | 'skipped';
  recorded_at?: string;
  created_at: string;
}

export interface FirstAidRecord {
  id: string;
  user_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  expiry_date?: string | null;
  storage_notes?: string;
  created_at: string;
  updated_at: string;
}

class DataStore {
  private supabase: SupabaseClient | null = null;
  private isConnected = false;

  // In-memory collections
  public medicines = [...SEED_MEDICINES];
  public pharmacies = [...SEED_PHARMACIES];
  public emergencyContacts = [...SEED_EMERGENCY_CONTACTS];
  public firstAidArticles = [...SEED_FIRST_AID_ARTICLES];
  public profiles: Map<string, ProfileRecord> = new Map();
  public prescriptionSchedules: Map<string, PrescriptionRecord> = new Map();
  public doseEvents: Map<string, DoseEventRecord> = new Map();
  public firstAidItems: Map<string, FirstAidRecord> = new Map();

  constructor() {
    if (CONFIG.supabaseUrl && CONFIG.supabaseKey) {
      try {
        this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
        this.isConnected = true;
      } catch (err) {
        console.warn('[DataStore] Failed to initialize Supabase client, using in-memory store:', err);
      }
    }
  }

  get hasSupabase(): boolean {
    return this.isConnected && this.supabase !== null;
  }

  getSupabaseClient(): SupabaseClient | null {
    return this.supabase;
  }
}

export const store = new DataStore();
