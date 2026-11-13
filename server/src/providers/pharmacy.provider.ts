import { z } from 'zod';
import { store } from '../data/store.js';
import { CONFIG } from '../config/index.js';

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

export interface PharmacySearchParams {
  query?: string;
  state?: string;
  city?: string;
  area?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
  medicineId?: string;
}

export interface PharmacySearchResult {
  data: Pharmacy[];
  total: number;
  source: string;
  provider: string;
  isConfigured: boolean;
}

export interface PharmacyProvider {
  readonly name: string;
  isConfigured(): boolean;
  search(params: PharmacySearchParams): Promise<PharmacySearchResult>;
  getById(id: string): Promise<Pharmacy | null>;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * InternalPharmacyProvider
 * Serves verified licensed pharmacy records from internal verified repository / database.
 * Does NOT invent live availability, distances, or stock levels.
 */
export class InternalPharmacyProvider implements PharmacyProvider {
  readonly name = 'internal';

  isConfigured(): boolean {
    return true;
  }

  async search(params: PharmacySearchParams): Promise<PharmacySearchResult> {
    const { query, state, city, area, pinCode, latitude, longitude, radiusKm = 50, page = 1, limit = 20 } = params;
    const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

    let results = store.pharmacies.map((pharmacy) => {
      let distanceKm: number | undefined;
      if (hasCoords && pharmacy.latitude && pharmacy.longitude) {
        distanceKm = Math.round(haversineDistance(latitude, longitude, pharmacy.latitude, pharmacy.longitude) * 10) / 10;
      }
      return {
        ...pharmacy,
        distance_km: distanceKm,
        availability_status: 'unknown' as const, // We do not fabricate live retail stock
      };
    });

    if (state) {
      results = results.filter((p) => p.state?.toLowerCase() === state.toLowerCase());
    }
    if (city) {
      results = results.filter((p) => p.city?.toLowerCase().includes(city.toLowerCase()));
    }
    if (area) {
      results = results.filter(
        (p) => p.area?.toLowerCase().includes(area.toLowerCase()) || p.address?.toLowerCase().includes(area.toLowerCase())
      );
    }
    if (pinCode) {
      results = results.filter((p) => p.pin_code === pinCode);
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q));
    }

    if (hasCoords) {
      results = results.filter((p) => p.distance_km === undefined || p.distance_km <= radiusKm);
      results.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    }

    const total = results.length;
    const startIndex = (page - 1) * limit;
    const paginated = results.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      total,
      source: 'Central Licensing Authority & Retail Drug Directory, CDSCO',
      provider: this.name,
      isConfigured: true,
    };
  }

  async getById(id: string): Promise<Pharmacy | null> {
    const pharmacy = store.pharmacies.find((p) => p.id === id || p.external_id === id);
    if (!pharmacy) return null;
    return {
      ...pharmacy,
      availability_status: 'unknown',
    };
  }
}

const externalPharmacyItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  pin_code: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  operating_hours: z.record(z.string(), z.string()).optional(),
  source_url: z.string().optional(),
  verification_status: z.string().default('unverified'),
  distance_km: z.number().optional(),
  availability_status: z.enum(['in_stock', 'out_of_stock', 'unknown']).default('unknown'),
});

const externalPharmacyResponseSchema = z.object({
  data: z.array(externalPharmacyItemSchema),
  total: z.number().optional(),
  source: z.string().optional(),
});

/**
 * ExternalPharmacyProvider
 * Connects to a licensed third-party pharmacy or government health API endpoint.
 * Requires PHARMACY_PROVIDER_BASE_URL and optional PHARMACY_PROVIDER_API_KEY.
 */
export class ExternalPharmacyProvider implements PharmacyProvider {
  readonly name = 'external';

  constructor(
    private readonly apiKey: string = '',
    private readonly baseUrl: string = ''
  ) {}

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.baseUrl.startsWith('http'));
  }

  async search(params: PharmacySearchParams): Promise<PharmacySearchResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'External pharmacy provider is selected but PHARMACY_PROVIDER_BASE_URL is not configured.'
      );
    }

    const url = new URL('/pharmacies/search', this.baseUrl);
    if (params.query) url.searchParams.set('query', params.query);
    if (params.state) url.searchParams.set('state', params.state);
    if (params.city) url.searchParams.set('city', params.city);
    if (params.area) url.searchParams.set('area', params.area);
    if (params.pinCode) url.searchParams.set('pinCode', params.pinCode);
    if (params.latitude !== undefined) url.searchParams.set('latitude', String(params.latitude));
    if (params.longitude !== undefined) url.searchParams.set('longitude', String(params.longitude));
    if (params.radiusKm !== undefined) url.searchParams.set('radiusKm', String(params.radiusKm));
    if (params.page !== undefined) url.searchParams.set('page', String(params.page));
    if (params.limit !== undefined) url.searchParams.set('limit', String(params.limit));

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['X-API-Key'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url.toString(), {
        headers,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`External pharmacy provider responded with status ${res.status}`);
      }

      const json = await res.json();
      const parsed = externalPharmacyResponseSchema.parse(json);

      return {
        data: parsed.data,
        total: parsed.total ?? parsed.data.length,
        source: parsed.source ?? 'External Licensed Pharmacy API',
        provider: this.name,
        isConfigured: true,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async getById(id: string): Promise<Pharmacy | null> {
    if (!this.isConfigured()) {
      throw new Error('External pharmacy provider is not configured.');
    }

    const url = new URL(`/pharmacies/${encodeURIComponent(id)}`, this.baseUrl);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const res = await fetch(url.toString(), { headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`External pharmacy provider responded with status ${res.status}`);

    const json = await res.json();
    return externalPharmacyItemSchema.parse(json.data ?? json);
  }
}

/**
 * Pharmacy Provider Factory
 */
export function getPharmacyProvider(): PharmacyProvider {
  if (CONFIG.pharmacyProvider === 'external') {
    return new ExternalPharmacyProvider(CONFIG.pharmacyProviderApiKey, CONFIG.pharmacyProviderBaseUrl);
  }
  return new InternalPharmacyProvider();
}
