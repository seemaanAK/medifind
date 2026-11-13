import { useState, useEffect } from 'react';
import { PhoneCall, AlertTriangle, ShieldCheck, ExternalLink, MapPin, Info } from 'lucide-react';
import { INDIAN_STATES } from '../lib/config';
import { apiClient } from '../lib/api-client';
import { formatDate } from '../utils/dates';
import { LoadingState } from '../components/feedback/LoadingState';
import type { EmergencyContact, ApiResponse } from '../types';

export default function Emergency() {
  const [selectedState, setSelectedState] = useState('');
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContacts() {
      setLoading(true);
      try {
        const res = await apiClient<ApiResponse<EmergencyContact[]>>('/api/emergency-contacts', {
          params: { state: selectedState || undefined },
        });
        setContacts(res.data || []);
      } catch {
        setContacts([]);
      } finally {
        setLoading(false);
      }
    }
    loadContacts();
  }, [selectedState]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HERO BANNER - NATIONWIDE 112 */}
      <div className="bg-gradient-to-r from-emergency-600 via-emergency-700 to-rose-800 rounded-3xl p-6 sm:p-10 text-white shadow-lg space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 bg-emergency-800/80 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>Emergency 24/7 National Dispatch</span>
          </div>
          <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
            Government of India ERSS Integrated
          </span>
        </div>

        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            National Emergency Number: Dial 112
          </h1>
          <p className="text-emergency-100 text-base sm:text-lg leading-relaxed">
            In critical medical emergencies, unconsciousness, severe chest pain, severe bleeding, or trauma, dial 112 immediately.
            The Emergency Response Support System (ERSS) provides single-number police, ambulance, and fire dispatch throughout India.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-4">
          <a
            href="tel:112"
            className="inline-flex items-center gap-3 bg-white text-emergency-700 hover:bg-emergency-50 px-8 py-4 rounded-2xl font-extrabold text-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Call 112 immediately"
          >
            <PhoneCall className="w-6 h-6 animate-pulse" />
            <span>Call 112 Now</span>
          </a>
          <p className="text-xs text-emergency-200">
            Clicking opens your device calling interface. No charges apply.
          </p>
        </div>
      </div>

      {/* REGIONAL HELPLINE SECTION */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Regional & Specialized Helplines</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select your Indian State or Union Territory to view verified health helplines, maternal transport, and anti-poison counseling.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Regions (Nationwide)</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTACT CARDS GRID */}
        {loading ? (
          <LoadingState message="Loading verified emergency contact registry…" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                        {contact.coverage_type === 'nationwide' ? 'All India' : contact.region_name || 'State'}
                      </span>
                      <h3 className="font-bold text-lg text-gray-900 mt-1">{contact.display_name}</h3>
                      <p className="text-xs text-gray-500">{contact.service_type}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Dial Helpline</span>
                      <p className="text-xl font-black text-emergency-600">{contact.phone_number}</p>
                    </div>
                    <a
                      href={`tel:${contact.phone_number.replace(/\s+/g, '')}`}
                      className="p-3 bg-emergency-600 hover:bg-emergency-700 text-white rounded-xl shadow-sm transition-colors"
                      title={`Call ${contact.display_name}`}
                    >
                      <PhoneCall className="w-5 h-5" />
                    </a>
                  </div>

                  {contact.notes && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {contact.notes}
                    </p>
                  )}
                </div>

                {/* VERIFICATION METADATA */}
                <div className="mt-5 pt-3 border-t border-gray-100 text-[11px] text-gray-400 space-y-1">
                  <div className="flex items-center gap-1 text-green-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Source: {contact.verification_source_name}</span>
                  </div>
                  {contact.verification_source_url && (
                    <a
                      href={contact.verification_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Official Source Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <p>Last verified: {formatDate(contact.last_checked_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REGIONAL VERIFICATION NOTICE */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs text-blue-900 space-y-2">
        <h3 className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-700" />
          <span>Regional Emergency Verification Policy</span>
        </h3>
        <p className="leading-relaxed">
          In India, specialized helplines like 108 (Ambulance), 102 (Maternal transport), and 104 (Health advice) operate under state-level health departments.
          MediFind strictly presents regional helplines when their current operational status and regional applicability have been confirmed with state official health missions.
          If a regional number is not confirmed for your specific district, <strong>dial 112</strong> for immediate dispatch.
        </p>
      </div>
    </div>
  );
}
