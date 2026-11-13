import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Clock, Trash2, Edit2, CheckCircle2, XCircle, Bell, Shield } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { formatDate, formatTime } from '../utils/dates';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/feedback/LoadingState';
import { EmptyState } from '../components/feedback/EmptyState';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import type { PrescriptionScheduleRecord, ApiResponse } from '../types';

export default function Schedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<PrescriptionScheduleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // FORM MODAL STATE
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PrescriptionScheduleRecord | null>(null);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState<Array<{ time: string; label: string }>>([{ time: '09:00', label: 'Morning' }]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationText, setDurationText] = useState('');
  const [clinicianName, setClinicianName] = useState('');
  const [prescriptionRef, setPrescriptionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // DELETE STATE
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // DAILY DOSE EVENTS LOG (in-memory / local)
  const [doseStatusMap, setDoseStatusMap] = useState<Record<string, 'pending' | 'taken' | 'skipped'>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSchedules = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        const res = await apiClient<ApiResponse<PrescriptionScheduleRecord[]>>('/api/schedules');
        if (!ignore) setSchedules(res.data || []);
      } catch {
        // Local fallback
        const local = localStorage.getItem('medifind_local_schedules');
        if (!ignore) {
          if (local) {
            try { setSchedules(JSON.parse(local)); } catch { setSchedules([]); }
          } else {
            setSchedules([]);
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setMedicineName('');
    setDosage('');
    setTimes([{ time: '09:00', label: 'Morning' }]);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setDurationText('');
    setClinicianName('');
    setPrescriptionRef('');
    setNotes('');
    setReminderEnabled(false);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (s: PrescriptionScheduleRecord) => {
    setEditingSchedule(s);
    setMedicineName(s.medicine_name);
    setDosage(s.prescribed_dosage);
    setTimes(s.prescribed_times && s.prescribed_times.length > 0 ? s.prescribed_times : [{ time: '09:00', label: 'Morning' }]);
    setStartDate(s.start_date || '');
    setEndDate(s.end_date || '');
    setDurationText(s.prescribed_duration_text || '');
    setClinicianName(s.clinician_name || '');
    setPrescriptionRef(s.prescription_reference || '');
    setNotes(s.notes || '');
    setReminderEnabled(s.reminder_enabled);
    setFormError(null);
    setShowModal(true);
  };

  const addTimeSlot = () => {
    if (times.length < 6) {
      setTimes([...times, { time: '21:00', label: 'Night' }]);
    }
  };

  const removeTimeSlot = (idx: number) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== idx));
    }
  };

  const updateTimeSlot = (idx: number, field: 'time' | 'label', val: string) => {
    const updated = [...times];
    updated[idx][field] = val;
    setTimes(updated);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setFormError('Prescription end date cannot be earlier than start date.');
      return;
    }

    setSubmitting(true);
    const payload = {
      medicine_name: medicineName.trim(),
      prescribed_dosage: dosage.trim(),
      prescribed_times: times,
      start_date: startDate || null,
      end_date: endDate || null,
      prescribed_duration_text: durationText.trim() || undefined,
      clinician_name: clinicianName.trim() || undefined,
      prescription_reference: prescriptionRef.trim() || undefined,
      notes: notes.trim() || undefined,
      reminder_enabled: reminderEnabled,
      status: 'active' as const,
    };

    try {
      if (editingSchedule) {
        await apiClient(`/api/schedules/${editingSchedule.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/schedules', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      loadSchedules();
    } catch {
      // Local fallback
      const now = new Date().toISOString();
      if (editingSchedule) {
        const updated = schedules.map((s) => s.id === editingSchedule.id ? { ...s, ...payload, updated_at: now } : s);
        setSchedules(updated as PrescriptionScheduleRecord[]);
        localStorage.setItem('medifind_local_schedules', JSON.stringify(updated));
      } else {
        const newRecord: PrescriptionScheduleRecord = {
          id: String(Date.now()),
          user_id: user?.id || 'demo-user',
          ...payload,
          start_date: payload.start_date || undefined,
          end_date: payload.end_date || undefined,
          created_at: now,
          updated_at: now,
        };
        const updated = [...schedules, newRecord];
        setSchedules(updated);
        localStorage.setItem('medifind_local_schedules', JSON.stringify(updated));
      }
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await apiClient(`/api/schedules/${deletingId}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
    const updated = schedules.filter((s) => s.id !== deletingId);
    setSchedules(updated);
    localStorage.setItem('medifind_local_schedules', JSON.stringify(updated));
    setDeletingId(null);
  };

  const handleRecordDose = (key: string, status: 'taken' | 'skipped') => {
    setDoseStatusMap((prev) => ({
      ...prev,
      [key]: prev[key] === status ? 'pending' : status,
    }));
  };

  const requestBrowserNotification = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
    setReminderEnabled(!reminderEnabled);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary-700 text-sm font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Private Health Organizer</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Prescription Schedule & Reminders</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-3xl">
            Maintain daily dose reminders strictly entered from your doctor's written prescription.
            MediFind never modifies dosages, invents frequencies, or calculates clinical adherence scores.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Prescription Schedule</span>
        </button>
      </div>

      {/* TODAY'S DOSES HERO SECTION */}
      <div className="bg-gradient-to-r from-primary-50 to-emerald-50 rounded-2xl border border-primary-200/70 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <span>Today's Prescribed Doses</span>
          </h2>
          <span className="text-xs text-gray-500 font-medium">Asia/Kolkata (IST)</span>
        </div>

        {schedules.length === 0 ? (
          <p className="text-xs text-gray-500">
            No active prescription schedules recorded. Add a prescription above to view today's scheduled administration times.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.flatMap((s) =>
              (s.prescribed_times || []).map((t, idx) => {
                const key = `${s.id}-${t.time}-${idx}`;
                const status = doseStatusMap[key] || 'pending';

                return (
                  <div
                    key={key}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-primary-700 bg-primary-100/60 px-2 py-0.5 rounded">
                        {formatTime(t.time)} • {t.label}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900">{s.medicine_name}</h4>
                      <p className="text-xs text-gray-500">{s.prescribed_dosage}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRecordDose(key, 'taken')}
                        className={`p-2 rounded-lg transition-colors ${
                          status === 'taken'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 hover:bg-green-50 text-gray-500 hover:text-green-700'
                        }`}
                        title="Mark dose as taken"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRecordDose(key, 'skipped')}
                        className={`p-2 rounded-lg transition-colors ${
                          status === 'skipped'
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 hover:bg-amber-50 text-gray-500 hover:text-amber-700'
                        }`}
                        title="Mark dose as skipped"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ALL SAVED PRESCRIPTION SCHEDULES */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Your Prescription Records</h2>

        {loading ? (
          <LoadingState message="Loading your prescription schedules…" />
        ) : schedules.length === 0 ? (
          <EmptyState
            title="No prescription schedules saved yet"
            description="Enter the exact instructions from your doctor's written prescription to organize dose reminders."
            action={
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold"
              >
                Add Prescription Schedule
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-gray-900">{s.medicine_name}</h3>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {s.status}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
                    <p className="font-semibold text-gray-900">
                      Prescribed Dosage: <span className="font-normal text-gray-700">{s.prescribed_dosage}</span>
                    </p>
                    {s.clinician_name && (
                      <p className="text-gray-500">Prescribing Doctor: {s.clinician_name}</p>
                    )}
                    {s.prescription_reference && (
                      <p className="text-gray-400 text-[11px]">Rx Ref: {s.prescription_reference}</p>
                    )}
                  </div>

                  {/* TIMED SCHEDULE */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Scheduled Times:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {s.prescribed_times.map((t, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-primary-50 text-primary-800 border border-primary-200 rounded-lg text-xs font-semibold">
                          {formatTime(t.time)} ({t.label})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* DATES */}
                  {(s.start_date || s.end_date) && (
                    <div className="text-xs text-gray-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {s.start_date ? formatDate(s.start_date) : 'Start'} &rarr; {s.end_date ? formatDate(s.end_date) : 'Ongoing'}
                      </span>
                    </div>
                  )}

                  {s.notes && (
                    <p className="text-xs text-gray-600 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      Notes: {s.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    {s.reminder_enabled ? (
                      <span className="text-green-700 font-medium flex items-center gap-1">
                        <Bell className="w-3.5 h-3.5" /> Reminders On
                      </span>
                    ) : (
                      'Reminders Off'
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 text-gray-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit Schedule"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(s.id)}
                      className="p-1.5 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD / EDIT SCHEDULE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl my-8">
            <h3 className="text-lg font-bold text-gray-900">
              {editingSchedule ? 'Edit Prescription Schedule' : 'New Prescription Schedule'}
            </h3>
            <p className="text-xs text-gray-500">
              Enter details strictly from your doctor's written prescription. Do not invent or estimate dosages.
            </p>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Medicine Name *</label>
                <input
                  type="text"
                  required
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g. Paracetamol 500mg, Amoxicillin 500mg"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Prescribed Dosage as Written *</label>
                <input
                  type="text"
                  required
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 1 tablet after meals, 5 ml twice daily"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* TIME SLOTS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-700">Administration Times *</label>
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="text-xs text-primary-700 font-semibold hover:underline"
                  >
                    + Add Time
                  </button>
                </div>
                {times.map((t, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="time"
                      required
                      value={t.time}
                      onChange={(e) => updateTimeSlot(idx, 'time', e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      required
                      value={t.label}
                      onChange={(e) => updateTimeSlot(idx, 'label', e.target.value)}
                      placeholder="e.g. Morning, Night"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    {times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(idx)}
                        className="text-red-600 hover:text-red-800 text-sm font-bold px-2"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Prescribing Doctor (optional)</label>
                <input
                  type="text"
                  value={clinicianName}
                  onChange={(e) => setClinicianName(e.target.value)}
                  placeholder="e.g. Dr. A. Sharma (MBBS, MD)"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Prescription Ref / Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Take with warm water after breakfast"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reminderCheckbox"
                  checked={reminderEnabled}
                  onChange={requestBrowserNotification}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="reminderCheckbox" className="text-xs text-gray-700 font-medium">
                  Enable device reminders for this medicine
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {submitting ? 'Saving…' : 'Save Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        title="Delete Prescription Schedule"
        description="Are you sure you want to permanently delete this prescription schedule record?"
        confirmLabel="Delete Record"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
