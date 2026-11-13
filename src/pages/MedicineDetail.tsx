import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Pill, ShieldCheck, AlertTriangle, Thermometer, Building, ExternalLink, ArrowLeft, Sparkles, Info } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { formatDate } from '../utils/dates';
import { MedicalDisclaimer } from '../components/shared/MedicalDisclaimer';
import { LoadingState } from '../components/feedback/LoadingState';
import { ErrorState } from '../components/feedback/ErrorState';
import type { Medicine, ApiResponse } from '../types';

export default function MedicineDetail() {
  const { medicineId } = useParams<{ medicineId: string }>();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Optional AI Plain-Language Summarization state
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMedicine() {
      if (!medicineId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient<ApiResponse<Medicine>>(`/api/medicines/${medicineId}`);
        setMedicine(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load medicine monograph.');
      } finally {
        setLoading(false);
      }
    }
    loadMedicine();
  }, [medicineId]);

  const handleGenerateSummary = async () => {
    if (!medicineId) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await apiClient<{ data: any; meta: any }>('/api/ai/summarize-medicine', {
        method: 'POST',
        body: JSON.stringify({ medicineId }),
      });
      setAiSummary(res.data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Educational summary generation unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading verified medicine details…" />;
  if (error || !medicine) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState
          message={error || 'The requested medicine record could not be found or is unavailable.'}
        />
        <div className="mt-6 text-center">
          <Link to="/medicine-information" className="text-primary-600 hover:text-primary-700 font-medium">
            &larr; Back to Medicine Information Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* NAVIGATION BACK */}
      <div>
        <Link
          to="/medicine-information"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Medicine Directory</span>
        </Link>
      </div>

      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
              <span>Verified Indian Pharmacopoeia / CDSCO Reference</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {medicine.name}
            </h1>
            {medicine.manufacturer && (
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-gray-400" />
                <span>Standard / Manufacturer: {medicine.manufacturer}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <Link
              to={`/medicines?query=${encodeURIComponent(medicine.name.split(' ')[0])}`}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Pill className="w-4 h-4" />
              <span>Find Nearby Pharmacies</span>
            </Link>
            <span className="text-[11px] text-gray-400">
              Verified on: {formatDate(medicine.verified_at)}
            </span>
          </div>
        </div>

        {/* ACTIVE INGREDIENTS */}
        {medicine.active_ingredients && medicine.active_ingredients.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Verified Active Ingredients
            </h2>
            <div className="flex flex-wrap gap-2">
              {medicine.active_ingredients.map((ing, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-50 border border-blue-200 text-medical-800 rounded-lg text-xs font-medium"
                >
                  {ing.ingredient} {ing.strength ? `(${ing.strength})` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI EDUCATIONAL SUMMARY CARD (OPTIONAL SERVICE) */}
      <div className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 rounded-2xl border border-emerald-200/60 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900">Plain-Language Educational Overview</h2>
          </div>
          {!aiSummary && (
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={aiLoading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {aiLoading ? 'Analyzing…' : 'Generate Plain-Language Summary'}
            </button>
          )}
        </div>

        {aiError && (
          <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
            {aiError}
          </p>
        )}

        {aiSummary ? (
          <div className="space-y-3 text-sm text-gray-700 bg-white/80 p-4 rounded-xl border border-emerald-100">
            <p className="font-medium text-gray-900">{aiSummary.summary}</p>
            <p className="text-xs text-gray-500 italic">
              Note: This educational summary is source-grounded in verified product literature. It is not personal medical advice.
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-600">
            Click above to review a concise, source-grounded summary of this medicine's approved uses and precautions in simple language.
          </p>
        )}
      </div>

      {/* MONOGRAPH SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* APPROVED USES */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span>Approved Therapeutic Uses</span>
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {medicine.approved_uses || 'Approved uses not explicitly specified in available reference records.'}
          </p>
        </div>

        {/* PRECAUTIONS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-medical-600" />
            <span>Precautions & Usage Guidance</span>
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {medicine.precautions || 'Consult a registered medical practitioner or pharmacist for clinical precautions.'}
          </p>
        </div>

        {/* WARNINGS AND CONTRAINDICATIONS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Warnings & Adverse Reactions</span>
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {medicine.warnings || 'No critical black-box warnings recorded in this monograph.'}
          </p>
        </div>

        {/* STORAGE INSTRUCTIONS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-indigo-600" />
            <span>Storage & Handling Instructions</span>
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {medicine.storage_information || 'Store below 30°C in a dry place protected from direct sunlight and moisture. Keep out of reach of children.'}
          </p>
        </div>
      </div>

      {/* SOURCE ATTRIBUTION FOOTER */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-xs text-gray-600 space-y-2">
        <h3 className="font-semibold text-gray-800">Authoritative Source Attribution</h3>
        <p>
          Information compiled from: <strong>{medicine.source_name}</strong>.
          {medicine.source_url && (
            <a
              href={medicine.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-primary-600 hover:text-primary-800 underline inline-flex items-center gap-1"
            >
              <span>Visit Regulatory Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </p>
        <p className="text-gray-400">
          Source Last Updated: {formatDate(medicine.source_updated_at)} | Internal Verification: {formatDate(medicine.verified_at)}
        </p>
      </div>

      {/* MANDATORY MEDICAL DISCLAIMER */}
      <MedicalDisclaimer />
    </div>
  );
}
