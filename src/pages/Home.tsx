import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Pill, Info, HeartPulse, AlertTriangle, PhoneCall, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { MedicalDisclaimer } from '../components/shared/MedicalDisclaimer';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/medicines?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-primary-50/60 to-white py-12 md:py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100/80 text-primary-800 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-primary-700" />
              <span>India's Verified Medicine & Health Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Find Medicines & Nearby Pharmacies with Confidence
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Transparent pharmacy discovery, verified pharmacopoeia drug information, private prescription schedules, and region-aware emergency medical assistance across India.
            </p>

            {/* QUICK SEARCH BAR */}
            <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by medicine name (e.g. Paracetamol, Amoxicillin)…"
                  className="w-full pl-11 pr-4 py-3.5 text-base rounded-xl border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            <div className="pt-2 flex flex-wrap justify-center gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Common searches:</span>
              <button type="button" onClick={() => navigate('/medicines?query=Paracetamol')} className="hover:text-primary-600 underline">Paracetamol</button>
              <span>•</span>
              <button type="button" onClick={() => navigate('/medicines?query=Amoxicillin')} className="hover:text-primary-600 underline">Amoxicillin</button>
              <span>•</span>
              <button type="button" onClick={() => navigate('/medicines?query=Cetirizine')} className="hover:text-primary-600 underline">Cetirizine</button>
              <span>•</span>
              <button type="button" onClick={() => navigate('/medicines?query=ORS')} className="hover:text-primary-600 underline">ORS Powder</button>
            </div>
          </div>
        </div>
      </section>

      {/* EMERGENCY 24/7 HERO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emergency-600 to-emergency-700 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-emergency-800/80 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>Emergency Medical Assistance 24/7</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">National Emergency Response: Dial 112</h2>
            <p className="text-emergency-100 text-sm max-w-xl">
              In life-threatening situations, severe chest pain, breathing difficulties, or critical trauma, immediately dial India's nationwide emergency number 112. Do not delay emergency care.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a
              href="tel:112"
              className="flex items-center justify-center gap-2 bg-white text-emergency-700 hover:bg-emergency-50 px-6 py-3.5 rounded-xl font-bold shadow transition-colors text-base"
              aria-label="Call National Emergency Number 112"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Call 112 Now</span>
            </a>
            <Link
              to="/emergency"
              className="flex items-center justify-center gap-2 bg-emergency-800 hover:bg-emergency-900 text-white px-5 py-3.5 rounded-xl font-medium border border-emergency-500 transition-colors text-sm"
            >
              <span>Regional Helplines</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURE PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Explore MediFind Features</h2>
          <p className="text-sm text-gray-500 mt-1">Integrated healthcare tools designed specifically for Indian users.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Find Medicines & Pharmacies */}
          <Link
            to="/medicines"
            className="group p-6 bg-white rounded-2xl border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                Nearby Pharmacies
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Discover retail pharmacies by browser location or manual PIN-code search with distance calculations and transparent stock verification status.
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-primary-700 inline-flex items-center gap-1 group-hover:underline">
              Find Pharmacies &rarr;
            </span>
          </Link>

          {/* Card 2: Medicine Information */}
          <Link
            to="/medicine-information"
            className="group p-6 bg-white rounded-2xl border border-gray-200 hover:border-medical-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-medical-700 flex items-center justify-center group-hover:bg-medical-600 group-hover:text-white transition-colors">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-medical-700 transition-colors">
                Medicine Information
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Review verified active ingredients, approved uses, warnings, and storage rules sourced from official Indian Pharmacopoeia and CDSCO monographs.
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-medical-700 inline-flex items-center gap-1 group-hover:underline">
              Browse Medicines &rarr;
            </span>
          </Link>

          {/* Card 3: Prescription Schedule */}
          <Link
            to="/schedule"
            className="group p-6 bg-white rounded-2xl border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                Prescription Schedule
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Organize personal reminders strictly from your doctor's written prescription instructions without automated alteration or medical speculation.
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-primary-700 inline-flex items-center gap-1 group-hover:underline">
              Manage Schedule &rarr;
            </span>
          </Link>

          {/* Card 4: First Aid Kit */}
          <Link
            to="/first-aid"
            className="group p-6 bg-white rounded-2xl border border-gray-200 hover:border-medical-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                First-Aid Kit & Care
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Track household first-aid inventory, monitor upcoming expiry dates, and access verified immediate response guidance from Red Cross standards.
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-emerald-700 inline-flex items-center gap-1 group-hover:underline">
              Open First Aid &rarr;
            </span>
          </Link>
        </div>
      </section>

      {/* HEALTHCARE PRINCIPLES & SAFETY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary-600" />
            <span>Built on Healthcare Safety & Transparency Principles</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">No AI Medical Diagnoses</h4>
              <p>MediFind never attempts to diagnose illnesses or prescribe medication from symptoms. We strictly provide sourced reference information.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Honest Availability Status</h4>
              <p>We clearly distinguish confirmed pharmacy stock from unverified availability. No false claims of live inventory are made.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">User Location Privacy</h4>
              <p>Your browser location is only accessed following your explicit request and is never logged or silently tracked.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MANDATORY DISCLAIMER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MedicalDisclaimer />
      </section>
    </div>
  );
}
