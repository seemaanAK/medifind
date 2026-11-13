import { useState, useEffect, useCallback } from 'react';
import { HeartPulse, Plus, AlertTriangle, ShieldCheck, Calendar, Trash2, Edit2 } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { formatDate, getExpiryStatus } from '../utils/dates';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from '../components/feedback/LoadingState';
import { EmptyState } from '../components/feedback/EmptyState';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import type { FirstAidItemRecord, FirstAidArticle, ApiResponse } from '../types';

export default function FirstAid() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inventory' | 'education'>('inventory');

  // INVENTORY STATE
  const [items, setItems] = useState<FirstAidItemRecord[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'expiring-soon' | 'expired'>('all');

  // FORM MODAL STATE
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FirstAidItemRecord | null>(null);
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formUnit, setFormUnit] = useState('item');
  const [formExpiry, setFormExpiry] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // DELETE CONFIRMATION STATE
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // EDUCATIONAL ARTICLES STATE
  const [articles, setArticles] = useState<FirstAidArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<FirstAidArticle | null>(null);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);

  const loadInventory = useCallback(() => {
    setInventoryLoading(true);
    setInventoryRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const res = await apiClient<ApiResponse<FirstAidItemRecord[]>>('/api/first-aid/items');
        if (!ignore) setItems(res.data || []);
      } catch {
        // In guest mode, load local storage items if any
        const local = localStorage.getItem('medifind_local_first_aid');
        if (!ignore) {
          if (local) {
            try { setItems(JSON.parse(local)); } catch { setItems([]); }
          } else {
            setItems([]);
          }
        }
      } finally {
        if (!ignore) setInventoryLoading(false);
      }

      try {
        const res = await apiClient<ApiResponse<FirstAidArticle[]>>('/api/first-aid/articles');
        if (!ignore) {
          setArticles(res.data || []);
          if (res.data && res.data.length > 0) {
            setSelectedArticle(res.data[0]);
          }
        }
      } catch {
        if (!ignore) setArticles([]);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [inventoryRefreshKey]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormQty('1');
    setFormUnit('item');
    setFormExpiry('');
    setFormNotes('');
    setFormError(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (item: FirstAidItemRecord) => {
    setEditingItem(item);
    setFormName(item.item_name);
    setFormQty(String(item.quantity));
    setFormUnit(item.unit);
    setFormExpiry(item.expiry_date || '');
    setFormNotes(item.storage_notes || '');
    setFormError(null);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const qty = parseFloat(formQty);
    if (isNaN(qty) || qty < 0) {
      setFormError('Please enter a valid, non-negative quantity.');
      return;
    }

    setFormSubmitting(true);
    const payload = {
      item_name: formName.trim(),
      quantity: qty,
      unit: formUnit.trim(),
      expiry_date: formExpiry || null,
      storage_notes: formNotes.trim() || undefined,
    };

    try {
      if (editingItem) {
        await apiClient(`/api/first-aid/items/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/first-aid/items', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowFormModal(false);
      loadInventory();
    } catch {
      // Local fallback if running in standalone guest mode
      const now = new Date().toISOString();
      if (editingItem) {
        const updated = items.map((it) => it.id === editingItem.id ? { ...it, ...payload, updated_at: now } : it);
        setItems(updated as FirstAidItemRecord[]);
        localStorage.setItem('medifind_local_first_aid', JSON.stringify(updated));
      } else {
        const newItem: FirstAidItemRecord = {
          id: String(Date.now()),
          user_id: user?.id || 'demo-user',
          item_name: payload.item_name,
          quantity: payload.quantity,
          unit: payload.unit,
          expiry_date: payload.expiry_date || undefined,
          storage_notes: payload.storage_notes,
          created_at: now,
          updated_at: now,
        };
        const updated = [...items, newItem];
        setItems(updated);
        localStorage.setItem('medifind_local_first_aid', JSON.stringify(updated));
      }
      setShowFormModal(false);
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await apiClient(`/api/first-aid/items/${deletingId}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
    const updated = items.filter((it) => it.id !== deletingId);
    setItems(updated);
    localStorage.setItem('medifind_local_first_aid', JSON.stringify(updated));
    setDeletingId(null);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const status = getExpiryStatus(item.expiry_date);
    if (filter === 'expired') return status === 'expired';
    if (filter === 'expiring-soon') return status === 'expiring-soon';
    return true;
  });

  const expiredCount = items.filter((it) => getExpiryStatus(it.expiry_date) === 'expired').length;
  const expiringSoonCount = items.filter((it) => getExpiryStatus(it.expiry_date) === 'expiring-soon').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold uppercase tracking-wider mb-1">
            <HeartPulse className="w-4 h-4" />
            <span>Household Medical Readiness</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">First-Aid Kit & Care Guidance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal supply inventory, track expiry dates, and review verified Red Cross first-aid procedures.
          </p>
        </div>

        {/* TAB TOGGLE */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'inventory' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Kit Inventory ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('education')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'education' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            First-Aid Guidance ({articles.length})
          </button>
        </div>
      </div>

      {/* CRITICAL EMERGENCY ESCALATION ALERT */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-red-900 space-y-1">
          <p className="font-bold">Life-Threatening Emergency Notice:</p>
          <p className="text-xs text-red-800 leading-relaxed">
            First aid is for immediate stabilization of minor everyday conditions. For heavy uncontrolled bleeding, severe burns, suspected fractures, chemical poisoning, chest pain, or breathing failure, <strong>dial 112 immediately</strong>. Do not attempt invasive procedures or delay emergency transport.
          </p>
        </div>
      </div>

      {/* TAB 1: KIT INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* INVENTORY ACTIONS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Supplies ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('expiring-soon')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === 'expiring-soon' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Expiring Soon ({expiringSoonCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('expired')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === 'expired' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100'
                }`}
              >
                Expired Supplies ({expiredCount})
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First-Aid Item</span>
            </button>
          </div>

          {/* INVENTORY ITEMS LIST */}
          {inventoryLoading ? (
            <LoadingState message="Loading your first-aid kit inventory…" />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="No first-aid items found"
              description="Keep your household safe by adding bandages, antiseptic solution, ORS packets, and sterile gauze."
              action={
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Add Your First Item
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const expiryStatus = getExpiryStatus(item.expiry_date);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-gray-900">{item.item_name}</h3>
                        {expiryStatus === 'expired' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            Expired
                          </span>
                        ) : expiryStatus === 'expiring-soon' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            Expiring Soon
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900">{item.quantity}</span>
                        <span className="text-xs text-gray-500 font-medium">{item.unit}</span>
                      </div>

                      {item.expiry_date ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>Expiry: <strong>{formatDate(item.expiry_date)}</strong></span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No expiry date specified</p>
                      )}

                      {item.storage_notes && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          {item.storage_notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        className="p-1.5 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EDUCATIONAL ARTICLES */}
      {activeTab === 'education' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Educational Topics</h2>
            <div className="space-y-2">
              {articles.map((art) => (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => setSelectedArticle(art)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedArticle?.id === art.id
                      ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">{art.topic}</span>
                  <h3 className="font-bold text-sm text-gray-900 mt-1">{art.title}</h3>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedArticle ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{selectedArticle.topic}</span>
                  <h2 className="text-2xl font-extrabold text-gray-900 mt-1">{selectedArticle.title}</h2>
                  {selectedArticle.summary && (
                    <p className="text-sm text-gray-600 mt-2 font-medium">{selectedArticle.summary}</p>
                  )}
                </div>

                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed border-t border-b border-gray-100 py-6">
                  {selectedArticle.content}
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-green-700 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified Source: {selectedArticle.source_name}</span>
                  </div>
                  <p>Verified on: {formatDate(selectedArticle.verified_at)}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
                Select an educational article to review step-by-step guidance.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT ITEM MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              {editingItem ? 'Edit First-Aid Item' : 'Add First-Aid Item'}
            </h3>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sterile Gauze Pads, Antiseptic Solution"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Unit</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="item">item(s)</option>
                    <option value="box">box</option>
                    <option value="roll">roll</option>
                    <option value="bottle">bottle</option>
                    <option value="ml">ml</option>
                    <option value="tablets">tablets</option>
                    <option value="sachets">sachets</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Storage Notes (optional)</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Store in bathroom medicine cabinet"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {formSubmitting ? 'Saving…' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        title="Remove First-Aid Item"
        description="Are you sure you want to remove this item from your first-aid kit inventory?"
        confirmLabel="Remove Item"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
