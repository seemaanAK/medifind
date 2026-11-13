import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Info, ArrowRight } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { formatDate } from '../utils/dates';
import { MedicalDisclaimer } from '../components/shared/MedicalDisclaimer';
import { LoadingState } from '../components/feedback/LoadingState';
import { EmptyState } from '../components/feedback/EmptyState';
import type { Medicine, ApiResponse } from '../types';

export default function MedicineInformation() {
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMedicines() {
      setLoading(true);
      try {
        const res = await apiClient<ApiResponse<Medicine[]>>('/api/medicines', {
          params: { query: query.trim() || 'tablets' },
        });
        setMedicines(res.data || []);
      } catch {
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMedicines();
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center gap-2 text-primary-700 text-sm font-semibold uppercase tracking-wider mb-1">
          <Info className="w-4 h-4" />
          <span>Clinical & Pharmacopoeia Reference</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Medicine Information Library</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-3xl">
          Search verified Indian Pharmacopoeia (IP) and CDSCO product monographs, active ingredients, therapeutic indications, precautions, and official storage conditions.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search verified medicine records by generic name, ingredient, or standard…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
          />
        </div>
      </div>

      {/* MEDICINE MONOGRAPH CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Verified Drug Monographs</h2>
          <span className="text-xs text-gray-500">{medicines.length} monographs indexed</span>
        </div>

        {loading ? (
          <LoadingState message="Loading verified medicine monographs…" />
        ) : medicines.length === 0 ? (
          <EmptyState
            title="No matching medicine monographs found"
            description="Try searching by generic name (e.g. Paracetamol, Amoxicillin, Cetirizine, ORS)."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map((med) => (
              <div
                key={med.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-primary-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-gray-900">{med.name}</h3>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {med.verification_status}
                    </span>
                  </div>

                  {med.manufacturer && (
                    <p className="text-xs text-gray-500">Standard: {med.manufacturer}</p>
                  )}

                  {med.active_ingredients && med.active_ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {med.active_ingredients.map((ing, i) => (
                        <span key={i} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                          {ing.ingredient}
                        </span>
                      ))}
                    </div>
                  )}

                  {med.approved_uses && (
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      <strong className="text-gray-700">Approved Uses:</strong> {med.approved_uses}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Verified: {formatDate(med.verified_at)}</span>
                  <Link
                    to={`/medicines/${med.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                  >
                    <span>Full Monograph</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MEDICAL DISCLAIMER */}
      <MedicalDisclaimer />
    </div>
  );
}
