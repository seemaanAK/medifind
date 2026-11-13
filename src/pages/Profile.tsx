import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, LogOut, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api-client';
import { INDIAN_STATES } from '../lib/config';
import { validateIndianPhone, normalizeIndianPhone } from '../utils/phone';
import { LoadingState } from '../components/feedback/LoadingState';
import type { UserProfile, ApiResponse } from '../types';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [language, setLanguage] = useState('en');
  const [smsReminders, setSmsReminders] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await apiClient<ApiResponse<UserProfile>>('/api/profile');
        if (res.data) {
          setProfile(res.data);
          setDisplayName(res.data.display_name || '');
          setPhone(res.data.phone_e164 || '');
          setSelectedState(res.data.preferred_state || '');
          setCity(res.data.preferred_city || '');
          setLanguage(res.data.preferred_language || 'en');
          const prefs = (res.data.notification_preferences || {}) as Record<string, boolean>;
          setSmsReminders(Boolean(prefs.sms_reminders));
        }
      } catch {
        // Fallback demo profile
        const local = localStorage.getItem('medifind_demo_profile');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            setProfile(parsed);
            setDisplayName(parsed.display_name || '');
            setPhone(parsed.phone_e164 || '');
            setSelectedState(parsed.preferred_state || '');
            setCity(parsed.preferred_city || '');
          } catch {
            // No profile
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    // Validate phone if provided
    let normalizedPhone: string | null = null;
    if (phone.trim()) {
      if (!validateIndianPhone(phone.trim())) {
        setErrorMsg('Please enter a valid 10-digit Indian mobile number (e.g. +91 98765 43210).');
        return;
      }
      normalizedPhone = normalizeIndianPhone(phone.trim());
    }

    setSaving(true);
    const payload = {
      display_name: displayName.trim() || undefined,
      phone_e164: normalizedPhone || undefined,
      preferred_state: selectedState || undefined,
      preferred_city: city.trim() || undefined,
      preferred_language: language,
      notification_preferences: {
        sms_reminders: smsReminders,
      },
    };

    try {
      const res = await apiClient<ApiResponse<UserProfile>>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setProfile(res.data);
      setSuccessMsg('Your profile preferences have been updated successfully.');
    } catch {
      // Local fallback save
      const fallback: UserProfile = {
        id: user?.id || 'demo-user',
        country_code: '+91',
        country: 'IN',
        preferred_language: language,
        display_name: displayName,
        phone_e164: normalizedPhone || undefined,
        preferred_state: selectedState,
        preferred_city: city,
        notification_preferences: { sms_reminders: smsReminders },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(fallback);
      localStorage.setItem('medifind_demo_profile', JSON.stringify(fallback));
      setSuccessMsg('Profile updated.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('medifind_demo_token');
    localStorage.removeItem('medifind_demo_user');
    await signOut();
    navigate('/');
  };

  if (loading) return <LoadingState message="Loading your account profile…" />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary-700 text-sm font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Account & Regional Settings</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal preferences, preferred state for emergency contacts, and contact numbers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:text-red-700 rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* FEEDBACK ALERTS */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 text-sm text-green-800" role="alert">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-800" role="alert">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PROFILE FORM */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="displayName" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Indian Mobile Number (+91)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Validated against Indian numbering plan (E.164 standard).</p>
            </div>

            <div>
              <label htmlFor="state" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Preferred State / UT
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  id="state"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="city" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Preferred City
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru, Delhi, Chennai"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Account Email: <strong className="text-gray-800">{user?.email || 'Demonstration Mode Session'}</strong>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving changes…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* PRIVACY ASSURANCE */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-xs text-gray-600 space-y-2">
        <h3 className="font-bold text-gray-800">Healthcare Privacy Assurance</h3>
        <p>
          MediFind isolates your prescription reminders and personal first-aid inventory from public access.
          Your private health data is never sold, indexed, or used for targeted advertising.
        </p>
      </div>
    </div>
  );
}
