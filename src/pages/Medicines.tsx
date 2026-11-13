import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Navigation, Phone, ExternalLink, Clock, AlertCircle, RefreshCw, CheckCircle, Info } from 'lucide-react';
import { useLocationPermission } from '../hooks/useLocationPermission';
import { INDIAN_STATES } from '../lib/config';
import { apiClient } from '../lib/api-client';
import { formatDistance } from '../utils/location';
import { MedicalDisclaimer } from '../components/shared/MedicalDisclaimer';
import { LoadingState } from '../components/feedback/LoadingState';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import type { Pharmacy, Medicine, ApiResponse } from '../types';

export default function Medicines() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const { state: locState, coordinates, error: locError, requestLocation, clearLocation } = useLocationPermission();

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [matchedMedicines, setMatchedMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshListings = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchResults() {
      try {
        // 1. Fetch matching medicines if query provided
        if (query.trim()) {
          try {
            const medRes = await apiClient<ApiResponse<Medicine[]>>('/api/medicines', {
              params: { query: query.trim() },
            });
            if (!ignore) setMatchedMedicines(medRes.data || []);
          } catch {
            if (!ignore) setMatchedMedicines([]);
          }
        } else {
          if (!ignore) setMatchedMedicines([]);
        }

        // 2. Fetch pharmacies
        const params: Record<string, string | number | undefined> = {
          query: query.trim() || undefined,
          state: selectedState || undefined,
          city: city.trim() || undefined,
          pinCode: pinCode.trim() || undefined,
        };

        if (coordinates) {
          params.latitude = coordinates.latitude;
          params.longitude = coordinates.longitude;
          params.radiusKm = 25;
        }

        const pharmRes = await apiClient<ApiResponse<Pharmacy[]>>('/api/pharmacies/search', { params });
        if (!ignore) setPharmacies(pharmRes.data || []);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to search pharmacies.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchResults();
    return () => {
      ignore = true;
    };
  }, [query, selectedState, city, pinCode, coordinates, refreshKey]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearchParams(query.trim() ? { query: query.trim() } : {});
    setRefreshKey((k) => k + 1);
  };

  const handleUseMyLocation = () => {
    setShowLocationModal(true);
  };

  const confirmLocationRequest = () => {
    setShowLocationModal(false);
    requestLocation();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* PAGE HEADER */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Find Medicines & Nearby Pharmacies</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search for medicines by brand or generic name, and locate licensed retail pharmacies across Indian states.
        </p>
      </div>

      {/* SEARCH AND LOCATION CONTROLS */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter medicine name (e.g. Paracetamol, Amoxicillin)…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium sm:text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>

        {/* LOCATION FILTERS */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search Location:</span>

            {/* Use My Location Action */}
            {coordinates ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-800 rounded-full text-xs font-medium">
                <Navigation className="w-3.5 h-3.5 text-green-600" />
                <span>GPS Location Active</span>
                <button
                  type="button"
                  onClick={clearLocation}
                  className="ml-1 text-green-600 hover:text-green-900 font-bold"
                  title="Clear GPS Location"
                >
                  &times;
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locState === 'requesting'}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-medium transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-primary-600" />
                <span>{locState === 'requesting' ? 'Locating…' : 'Use My Current Location'}</span>
              </button>
            )}

            {/* Manual Location Selectors */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All States</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (e.g. Mumbai)"
              className="w-28 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
            />

            <input
              type="text"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="PIN (6 digits)"
              maxLength={6}
              className="w-24 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
            />

            {(selectedState || city || pinCode) && (
              <button
                type="button"
                onClick={() => { setSelectedState(''); setCity(''); setPinCode(''); }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Reset filters
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={refreshListings}
            className="text-xs text-primary-700 hover:text-primary-800 flex items-center gap-1 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh listings</span>
          </button>
        </div>

        {/* Location Notice / Error */}
        {locError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{locError}</span>
          </div>
        )}
      </div>

      {/* MATCHED MEDICINE DIRECTORY QUICK CARD */}
      {matchedMedicines.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary-600" />
            <span>Verified Medicine Information Records</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedMedicines.map((med) => (
              <div key={med.id} className="bg-white border border-primary-200 rounded-xl p-4 shadow-sm hover:border-primary-400 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{med.name}</h3>
                    {med.manufacturer && <p className="text-xs text-gray-500">{med.manufacturer}</p>}
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {med.verification_status}
                  </span>
                </div>
                {med.approved_uses && (
                  <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                    <strong className="text-gray-700">Uses:</strong> {med.approved_uses}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                  <span className="text-gray-400">Source: {med.source_name}</span>
                  <Link
                    to={`/medicines/${med.id}`}
                    className="font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                  >
                    View Verified Monograph &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHARMACY RESULTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {coordinates ? 'Nearby Licensed Pharmacies' : 'Pharmacies Directory'}
          </h2>
          <span className="text-xs text-gray-500">
            {pharmacies.length} {pharmacies.length === 1 ? 'pharmacy' : 'pharmacies'} found
          </span>
        </div>

        {loading ? (
          <LoadingState message="Searching verified pharmacies…" />
        ) : error ? (
          <ErrorState message={error} onRetry={refreshListings} />
        ) : pharmacies.length === 0 ? (
          <EmptyState
            title="No pharmacies found matching your location filters"
            description="Try selecting a different state, clearing the PIN code, or expanding your search."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pharmacies.map((pharmacy) => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pharmacy.name} ${pharmacy.address || ''} ${pharmacy.city || ''}`)}`;

              return (
                <div
                  key={pharmacy.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-gray-900">{pharmacy.name}</h3>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Licensed
                      </span>
                    </div>

                    {pharmacy.address && (
                      <p className="text-xs text-gray-600 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span>
                          {pharmacy.address}
                          {pharmacy.city && `, ${pharmacy.city}`}
                          {pharmacy.pin_code && ` - ${pharmacy.pin_code}`}
                        </span>
                      </p>
                    )}

                    {pharmacy.distance_km !== undefined && (
                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{formatDistance(pharmacy.distance_km)}</span>
                      </div>
                    )}

                    {/* AVAILABILITY HONEST STATUS BADGE */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                        <Info className="w-3.5 h-3.5 text-gray-500" />
                        <span>Availability Status:</span>
                        <span className="font-semibold text-gray-900">
                          {pharmacy.availability_status === 'in_stock'
                            ? 'Stock Confirmed'
                            : pharmacy.availability_status === 'out_of_stock'
                            ? 'Out of Stock'
                            : 'Availability not verified'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {pharmacy.availability_status === 'unknown'
                          ? 'Live inventory not connected for this retailer. Call pharmacy to verify current stock.'
                          : 'Inventory status sourced from participating pharmacy system.'}
                      </p>
                    </div>

                    {/* OPERATING HOURS */}
                    {pharmacy.operating_hours && (
                      <div className="text-xs text-gray-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>
                          {pharmacy.operating_hours.all_days || pharmacy.operating_hours.monday || 'Standard Retail Hours'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ACTION LINKS */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    {pharmacy.phone ? (
                      <a
                        href={`tel:${pharmacy.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{pharmacy.phone}</span>
                      </a>
                    ) : (
                      <span className="text-gray-400">Phone not listed</span>
                    )}

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-primary-600 font-medium"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXPLICIT GEOLOCATION PERMISSION EXPLANATION MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto">
              <Navigation className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Use Your Browser Location?</h3>
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              MediFind uses your coordinates strictly to calculate straight-line distances to nearby licensed pharmacies.
              Your coordinates stay in memory and are <strong>never stored, logged, or shared</strong> for tracking.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLocationRequest}
                className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Allow Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCLAIMER */}
      <MedicalDisclaimer />
    </div>
  );
}
