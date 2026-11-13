import { z } from 'zod';
import { store } from '../data/store.js';
import { CONFIG } from '../config/index.js';

export interface Medicine {
  id: string;
  external_source?: string;
  external_id?: string;
  name: string;
  normalized_name?: string;
  manufacturer?: string;
  active_ingredients?: Array<{ ingredient: string; strength: string }>;
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

export interface MedicineSearchResult {
  data: Medicine[];
  total: number;
  source: string;
  provider: string;
  isConfigured: boolean;
}

export interface MedicineDataProvider {
  readonly name: string;
  isConfigured(): boolean;
  search(query: string, page?: number, limit?: number): Promise<MedicineSearchResult>;
  getById(id: string): Promise<Medicine | null>;
}

/**
 * CdscoIpMedicineProvider
 * Authoritative Indian regulatory drug database using CDSCO & Indian Pharmacopoeia monographs.
 * Does NOT generate medical advice, calculate dosages, or recommend substitutes.
 */
export class CdscoIpMedicineProvider implements MedicineDataProvider {
  readonly name = 'cdsco_ip';

  isConfigured(): boolean {
    return true;
  }

  async search(query: string, page = 1, limit = 20): Promise<MedicineSearchResult> {
    const normalized = query.trim().toLowerCase();

    const matches = store.medicines.filter((m) =>
      m.normalized_name.includes(normalized) ||
      m.name.toLowerCase().includes(normalized) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(normalized)) ||
      (m.active_ingredients && m.active_ingredients.some((ing) => ing.ingredient.toLowerCase().includes(normalized)))
    );

    const total = matches.length;
    const startIndex = (page - 1) * limit;
    const paginated = matches.slice(startIndex, startIndex + limit);

    return {
      data: paginated as Medicine[],
      total,
      source: 'Central Drugs Standard Control Organisation (CDSCO) / Indian Pharmacopoeia (IP)',
      provider: this.name,
      isConfigured: true,
    };
  }

  async getById(id: string): Promise<Medicine | null> {
    const medicine = store.medicines.find((m) => m.id === id || m.external_id === id);
    return (medicine as Medicine) ?? null;
  }
}

const externalMedicineItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturer: z.string().optional(),
  active_ingredients: z.array(z.object({ ingredient: z.string(), strength: z.string() })).optional(),
  approved_uses: z.string().optional(),
  precautions: z.string().optional(),
  warnings: z.string().optional(),
  storage_information: z.string().optional(),
  source_name: z.string(),
  source_url: z.string().optional(),
  verification_status: z.enum(['verified', 'unverified', 'incomplete', 'withdrawn']).default('unverified'),
  verified_at: z.string().optional(),
});

const externalMedicineResponseSchema = z.object({
  data: z.array(externalMedicineItemSchema),
  total: z.number().optional(),
  source: z.string().optional(),
});

/**
 * ExternalMedicineProvider
 * Connects to an external authenticated drug regulatory database or approved FHIR/REST endpoint.
 * Requires MEDICINE_DATA_PROVIDER_BASE_URL and optional MEDICINE_DATA_PROVIDER_API_KEY.
 */
export class ExternalMedicineProvider implements MedicineDataProvider {
  readonly name = 'external';

  constructor(
    private readonly apiKey: string = '',
    private readonly baseUrl: string = ''
  ) {}

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.baseUrl.startsWith('http'));
  }

  async search(query: string, page = 1, limit = 20): Promise<MedicineSearchResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'External medicine data provider is selected but MEDICINE_DATA_PROVIDER_BASE_URL is not configured.'
      );
    }

    const url = new URL('/medicines', this.baseUrl);
    url.searchParams.set('query', query);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url.toString(), { headers, signal: controller.signal });
      if (!res.ok) {
        throw new Error(`External medicine data provider responded with status ${res.status}`);
      }

      const json = await res.json();
      const parsed = externalMedicineResponseSchema.parse(json);

      return {
        data: parsed.data,
        total: parsed.total ?? parsed.data.length,
        source: parsed.source ?? 'External Verified Medicine Reference API',
        provider: this.name,
        isConfigured: true,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async getById(id: string): Promise<Medicine | null> {
    if (!this.isConfigured()) {
      throw new Error('External medicine data provider is not configured.');
    }

    const url = new URL(`/medicines/${encodeURIComponent(id)}`, this.baseUrl);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const res = await fetch(url.toString(), { headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`External medicine provider responded with status ${res.status}`);

    const json = await res.json();
    return externalMedicineItemSchema.parse(json.data ?? json);
  }
}

/**
 * Medicine Data Provider Factory
 */
export function getMedicineDataProvider(): MedicineDataProvider {
  if (CONFIG.medicineDataProvider === 'external') {
    return new ExternalMedicineProvider(CONFIG.medicineDataProviderApiKey, CONFIG.medicineDataProviderBaseUrl);
  }
  return new CdscoIpMedicineProvider();
}
