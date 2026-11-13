import { APP_CONFIG } from './config';
import { supabase } from './supabase';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...customConfig } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${APP_CONFIG.apiBaseUrl}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Add auth token if available from Supabase session or fallback demo
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch {
      // Supabase session retrieval failed, continue
    }
  }

  // If no Supabase token, check localStorage for demo user session
  if (!headers.Authorization) {
    const demoToken = localStorage.getItem('medifind_demo_token');
    if (demoToken) {
      headers.Authorization = `Bearer ${demoToken}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error?.message || `Request failed with status ${response.status}`;
      const code = data?.error?.code || 'HTTP_ERROR';
      throw new ApiError(message, code, data?.error?.details);
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error occurred. Please check your connection.',
      'NETWORK_ERROR'
    );
  }
}
