import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase Configuration
  SUPABASE_URL: z.string().optional().default(''),
  VITE_SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional().default(''),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional().default(''),

  // Google Gemini AI Configuration
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  // Pharmacy Provider Configuration
  PHARMACY_PROVIDER: z.enum(['internal', 'external']).default('internal'),
  PHARMACY_PROVIDER_API_KEY: z.string().optional().default(''),
  PHARMACY_PROVIDER_BASE_URL: z.string().optional().default(''),

  // Medicine Data Provider Configuration
  MEDICINE_DATA_PROVIDER: z.enum(['cdsco_ip', 'external']).default('cdsco_ip'),
  MEDICINE_DATA_PROVIDER_API_KEY: z.string().optional().default(''),
  MEDICINE_DATA_PROVIDER_BASE_URL: z.string().optional().default(''),

  // Security, CORS & Rate Limiting
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('60').transform((val) => parseInt(val, 10)),

  // Emergency Verification
  EMERGENCY_CONTACT_VERIFICATION_MAX_AGE_DAYS: z.string().default('365').transform((val) => parseInt(val, 10)),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('[Config Error] Invalid environment configuration:');
  console.error(parsedEnv.error.format());
  throw new Error('Environment configuration validation failed. Please check your .env file.');
}

const env = parsedEnv.data;

export const CONFIG = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  supabaseUrl: env.SUPABASE_URL || env.VITE_SUPABASE_URL,
  supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY,
  geminiApiKey: env.GEMINI_API_KEY,
  geminiModel: env.GEMINI_MODEL,

  // Providers
  pharmacyProvider: env.PHARMACY_PROVIDER,
  pharmacyProviderApiKey: env.PHARMACY_PROVIDER_API_KEY,
  pharmacyProviderBaseUrl: env.PHARMACY_PROVIDER_BASE_URL,

  medicineDataProvider: env.MEDICINE_DATA_PROVIDER,
  medicineDataProviderApiKey: env.MEDICINE_DATA_PROVIDER_API_KEY,
  medicineDataProviderBaseUrl: env.MEDICINE_DATA_PROVIDER_BASE_URL,

  corsOrigins: env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  emergencyMaxAgeDays: env.EMERGENCY_CONTACT_VERIFICATION_MAX_AGE_DAYS,
};
