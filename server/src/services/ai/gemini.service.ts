import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../../config/index.js';
import { z } from 'zod';

const medicineSummarySchema = z.object({
  medicine_name: z.string(),
  summary: z.string(),
  approved_uses: z.string().nullable(),
  precautions: z.string().nullable(),
  warnings: z.string().nullable(),
  storage_information: z.string().nullable(),
  verification_status: z.enum(['verified', 'incomplete', 'unverified']),
  source_name: z.string(),
  source_url: z.string().nullable(),
  insufficient_information: z.boolean(),
});

export type MedicineSummaryOutput = z.infer<typeof medicineSummarySchema>;

export class AIService {
  private client: GoogleGenAI | null = null;

  constructor() {
    if (CONFIG.geminiApiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });
      } catch (err) {
        console.warn('[AIService] Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  get isConfigured(): boolean {
    return Boolean(this.client);
  }

  async summarizeMedicine(sourceRecord: {
    name: string;
    manufacturer?: string;
    approved_uses?: string;
    precautions?: string;
    warnings?: string;
    storage_information?: string;
    source_name: string;
    source_url?: string;
    verification_status: string;
  }): Promise<MedicineSummaryOutput> {
    if (!this.client) {
      // Return direct source extraction when AI is not configured
      return {
        medicine_name: sourceRecord.name,
        summary: sourceRecord.approved_uses || 'Approved product information from official regulatory source.',
        approved_uses: sourceRecord.approved_uses || null,
        precautions: sourceRecord.precautions || null,
        warnings: sourceRecord.warnings || null,
        storage_information: sourceRecord.storage_information || null,
        verification_status: (sourceRecord.verification_status as any) || 'verified',
        source_name: sourceRecord.source_name,
        source_url: sourceRecord.source_url || null,
        insufficient_information: false,
      };
    }

    const systemPrompt = `You are MediFind's healthcare information summarization assistant.
You provide limited, source-grounded educational explanations for a medicine information application serving users in India.
You are not a doctor, diagnostic system, or prescribing service.

CORE RULES:
1. Never diagnose disease from symptoms.
2. Never prescribe, recommend, or select a medicine for a condition.
3. Never invent a dosage, administration frequency, treatment duration, or route.
4. Never recommend medication substitutions or generic equivalents.
5. Use ONLY the authoritative source material explicitly provided.
6. Preserve source attribution and verification status.
7. Return strictly valid JSON matching the required schema.`;

    const userPrompt = `Summarize the following verified medicine reference record for general educational clarity:
Medicine: ${sourceRecord.name}
Manufacturer: ${sourceRecord.manufacturer || 'N/A'}
Approved Uses: ${sourceRecord.approved_uses || 'N/A'}
Precautions: ${sourceRecord.precautions || 'N/A'}
Warnings: ${sourceRecord.warnings || 'N/A'}
Storage: ${sourceRecord.storage_information || 'N/A'}
Source: ${sourceRecord.source_name} (${sourceRecord.source_url || 'N/A'})
Verification Status: ${sourceRecord.verification_status}`;

    try {
      const response = await this.client.models.generateContent({
        model: CONFIG.geminiModel,
        contents: [
          { role: 'system', parts: [{ text: systemPrompt }] },
          { role: 'user', parts: [{ text: userPrompt }] }
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '';
      const parsed = JSON.parse(responseText);
      return medicineSummarySchema.parse(parsed);
    } catch (err) {
      console.warn('[AIService] AI generation failed, falling back to source record:', err);
      return {
        medicine_name: sourceRecord.name,
        summary: sourceRecord.approved_uses || 'Information sourced directly from official pharmacopoeia record.',
        approved_uses: sourceRecord.approved_uses || null,
        precautions: sourceRecord.precautions || null,
        warnings: sourceRecord.warnings || null,
        storage_information: sourceRecord.storage_information || null,
        verification_status: (sourceRecord.verification_status as any) || 'verified',
        source_name: sourceRecord.source_name,
        source_url: sourceRecord.source_url || null,
        insufficient_information: false,
      };
    }
  }
}

export const aiService = new AIService();
