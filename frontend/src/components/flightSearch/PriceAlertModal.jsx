import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Plane,
  TrendingDown,
  Mail,
  Clock,
  Sparkles,
  ShieldCheck,
  Pause,
  Play,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import {
  fetchPriceAlertsApi,
  createPriceAlertApi,
  updatePriceAlertApi,
  deletePriceAlertApi
} from '../../api/apiService';

const NAVY = 'bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8]';
const PRIMARY_BTN =
  'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.98]';
const INPUT =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100 sm:py-2.5 sm:text-sm';
const LABEL = 'mb-1.5 block text-xs font-bold text-slate-700';

const INITIAL_MOCK_ALERTS = [
  {
    alertId: 1,
    originCode: 'CMB',
    originCity: 'Colombo',
    destinationCode: 'SIN',
    destinationCity: 'Singapore',
    targetPrice: 380,
    cabinClass: 'ECONOMY',
    frequency: 'INSTANT',
    status: 'ACTIVE',
    userEmail: 'passenger@skylineair.com',
    createdAt: new Date().toISOString()
  },
  {
    alertId: 2,
    originCode: 'CMB',
    originCity: 'Colombo',
    destinationCode: 'JFK',
    destinationCity: 'New York',
    targetPrice: 750,
    cabinClass: 'ECONOMY',
    frequency: 'DAILY',
    status: 'ACTIVE',
    userEmail: 'passenger@skylineair.com',
    createdAt: new Date().toISOString()
  }
];

export default function PriceAlertModal({
  isOpen,
  onClose,
  searchCriteria,
  lowestPrice = 450,
  user,
  originAirport,
  destAirport
}) {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'list'
  const [alerts, setAlerts] = useState(INITIAL_MOCK_ALERTS);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [editingAlert, setEditingAlert] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const originCode = searchCriteria?.origin || 'CMB';
  const destCode = searchCriteria?.destination || 'SIN';
  const originCity = originAirport?.city || 'Colombo';
  const destCity = destAirport?.city || 'Destination';
  const cabin = searchCriteria?.cabinClass || 'ECONOMY';

  // Form state for creating a new alert
  const [newAlert, setNewAlert] = useState({
    targetPrice: Math.max(50, Math.round(lowestPrice * 0.85)), // 15% lower than current price by default
    cabinClass: cabin,
    frequency: 'INSTANT', // 'INSTANT', 'DAILY', 'WEEKLY'
    email: user?.email || 'passenger@skylineair.com'
  });

  // Fetch saved alerts from SQL backend or localStorage
  const loadAlerts = async () => {
    setLoading(true);
    try {
      const email = user?.email || newAlert.email;
      let data = [];
      if (email) {
        data = await fetchPriceAlertsApi(email);
      }
      if (!Array.isArray(data) || data.length === 0) {
        data = await fetchPriceAlertsApi();
      }
      if (Array.isArray(data) && data.length > 0) {
        setAlerts(data);
      } else {
        const stored = localStorage.getItem('skyline_price_alerts');
        if (stored) {
          setAlerts(JSON.parse(stored));
        }
      }
    } catch (err) {
      console.warn('Backend price alerts notice:', err.message);
      const stored = localStorage.getItem('skyline_price_alerts');
      if (stored) {
        setAlerts(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
      setNewAlert((prev) => ({
        ...prev,
        targetPrice: Math.max(50, Math.round(lowestPrice * 0.85)),
        cabinClass: cabin,
        email: user?.email || prev.email || 'passenger@skylineair.com'
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, searchCriteria, lowestPrice, user]);

  const showToast = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

  // CREATE (C)
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!newAlert.targetPrice || Number(newAlert.targetPrice) <= 0) {
      showToast('error', 'Please enter a valid positive target price.');
      return;
    }
    if (!newAlert.email || !newAlert.email.includes('@')) {
      showToast('error', 'Please enter a valid notification email.');
      return;
    }

    const payload = {
      userId: user?.userId || user?.rawId || user?.id || null,
      userEmail: newAlert.email.trim(),
      originCode: originCode || 'CMB',
      originCity: originCity || 'Colombo',
      destinationCode: destCode || 'SIN',
      destinationCity: destCity || 'Singapore',
      targetPrice: Number(newAlert.targetPrice),
      cabinClass: newAlert.cabinClass || 'ECONOMY',
      frequency: newAlert.frequency || 'INSTANT',
      status: 'ACTIVE'
    };

    let createdItem = { ...payload, alertId: Date.now() };

    try {
      const res = await createPriceAlertApi(payload);
      if (res && res.alertId) {
        createdItem = res;
      }
      showToast('success', `Price alert successfully stored in the SQL database for ${originCode} → ${destCode}!`);
    } catch (err) {
      console.warn('Saved alert locally:', err.message);
      showToast('success', `Price alert saved for ${originCode} → ${destCode}!`);
    }

    const updated = [createdItem, ...alerts];
    setAlerts(updated);
    localStorage.setItem('skyline_price_alerts', JSON.stringify(updated));
    setActiveTab('list');
  };

  // UPDATE (U)
  const handleUpdateAlert = async (e) => {
    e.preventDefault();
    if (!editingAlert) return;

    const id = editingAlert.alertId;
    const payload = {
      targetPrice: Number(editingAlert.targetPrice),
      cabinClass: editingAlert.cabinClass,
      frequency: editingAlert.frequency,
      status: editingAlert.status || 'ACTIVE',
      userEmail: editingAlert.userEmail
    };

    try {
      await updatePriceAlertApi(id, payload);
      showToast('success', 'Price alert updated successfully in database!');
    } catch (err) {
      console.warn('Updated alert locally:', err.message);
      showToast('success', 'Price alert updated successfully!');
    }

    const updated = alerts.map((a) => (a.alertId === id ? { ...a, ...payload } : a));
    setAlerts(updated);
    localStorage.setItem('skyline_price_alerts', JSON.stringify(updated));
    setEditingAlert(null);
  };

  // TOGGLE STATUS (U)
  const handleToggleStatus = async (alert) => {
    const nextStatus = alert.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const id = alert.alertId;

    try {
      await updatePriceAlertApi(id, { ...alert, status: nextStatus });
    } catch (err) {
      console.warn('Updated status locally:', err.message);
    }

    const updated = alerts.map((a) => (a.alertId === id ? { ...a, status: nextStatus } : a));
    setAlerts(updated);
    localStorage.setItem('skyline_price_alerts', JSON.stringify(updated));
    showToast('success', `Alert for ${alert.originCode} → ${alert.destinationCode} is now ${nextStatus.toLowerCase()}.`);
  };

  // DELETE (D)
  const handleDeleteAlert = async (alert) => {
    const id = alert.alertId;
    try {
      await deletePriceAlertApi(id);
      showToast('success', 'Price alert removed from database.');
    } catch (err) {
      console.warn('Deleted alert locally:', err.message);
      showToast('success', 'Price alert removed.');
    }

    const updated = alerts.filter((a) => a.alertId !== id);
    setAlerts(updated);
    localStorage.setItem('skyline_price_alerts', JSON.stringify(updated));
    setDeleteTarget(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:rounded-[1.75rem]">
        
        {/* Header */}
        <div className={`relative shrink-0 overflow-hidden ${NAVY} px-5 pb-4 pt-3 text-white sm:px-6 sm:pt-5`}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/30 sm:hidden" />
          
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-200">
                <Bell className="h-3.5 w-3.5" />
                Flight Search Smart Tracker
              </div>
              <h3 className="mt-1 flex items-center gap-2 text-lg font-extrabold leading-tight sm:text-xl">
                <span>Flight Price Alerts & Saved Searches</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="mt-4 flex gap-1 rounded-xl bg-white/10 p-1 text-xs font-bold backdrop-blur">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                activeTab === 'create' ? 'bg-white text-[#0a1230] shadow-sm' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              Set New Alert
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                activeTab === 'list' ? 'bg-white text-[#0a1230] shadow-sm' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              My Saved Alerts ({alerts.length})
            </button>
          </div>
        </div>

        {/* Toast feedback */}
        {feedback.text && (
          <div
            className={`mx-5 mt-3 flex items-center gap-2 rounded-xl p-3 text-xs font-bold sm:mx-6 ${
              feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {feedback.type === 'error' ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span className="flex-1">{feedback.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          
          {/* ================= TAB 1: CREATE ALERT (C) ================= */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateAlert} className="space-y-4">
              {/* Route Summary Card */}
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-xl font-black text-slate-900">{originCode}</span>
                      <span className="block text-[11px] font-semibold text-slate-500">{originCity}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Plane className="h-4 w-4 text-blue-600 rotate-45" />
                      <span className="text-[10px] font-bold text-slate-400">Direct / 1 Stop</span>
                    </div>
                    <div>
                      <span className="text-xl font-black text-slate-900">{destCode}</span>
                      <span className="block text-[11px] font-semibold text-slate-500">{destCity}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-400">Current Lowest</span>
                    <div className="text-lg font-black text-blue-700">${lowestPrice}</div>
                  </div>
                </div>
              </div>

              {/* Target Price input */}
              <div>
                <label className="block">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={LABEL}>Target Price Threshold ($) *</span>
                    <span className="text-[11px] font-bold text-blue-600">
                      Alert triggers when fare drops below this amount
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min={10}
                      value={newAlert.targetPrice}
                      onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                      className={`${INPUT} pl-8 text-lg font-black text-blue-700`}
                      placeholder="e.g. 400"
                      required
                    />
                  </div>
                </label>

                {/* Quick discount presets */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Quick presets:</span>
                  {[
                    { label: '-10% ($' + Math.round(lowestPrice * 0.9) + ')', val: Math.round(lowestPrice * 0.9) },
                    { label: '-20% ($' + Math.round(lowestPrice * 0.8) + ')', val: Math.round(lowestPrice * 0.8) },
                    { label: '-30% ($' + Math.round(lowestPrice * 0.7) + ')', val: Math.round(lowestPrice * 0.7) }
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setNewAlert({ ...newAlert, targetPrice: p.val })}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cabin class & Frequency */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={LABEL}>Cabin Class Preference</span>
                  <select
                    value={newAlert.cabinClass}
                    onChange={(e) => setNewAlert({ ...newAlert, cabinClass: e.target.value })}
                    className={INPUT}
                  >
                    <option value="ECONOMY">Economy Class</option>
                    <option value="BUSINESS">Business Class</option>
                    <option value="FIRST">First Class</option>
                  </select>
                </label>

                <label className="block">
                  <span className={LABEL}>Notification Frequency</span>
                  <select
                    value={newAlert.frequency}
                    onChange={(e) => setNewAlert({ ...newAlert, frequency: e.target.value })}
                    className={INPUT}
                  >
                    <option value="INSTANT">⚡ Instant Alert (Price Drop)</option>
                    <option value="DAILY">📅 Daily Price Digest</option>
                    <option value="WEEKLY">📊 Weekly Trends Summary</option>
                  </select>
                </label>
              </div>

              {/* Notification email */}
              <label className="block">
                <span className={LABEL}>Notification Email *</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={newAlert.email}
                    onChange={(e) => setNewAlert({ ...newAlert, email: e.target.value })}
                    placeholder="your-email@example.com"
                    className={`${INPUT} pl-10`}
                    required
                  />
                </div>
              </label>

              <button
                type="submit"
                className={`w-full rounded-xl py-3.5 text-sm font-extrabold shadow-lg ${PRIMARY_BTN}`}
              >
                🔔 Activate Flight Price Alert
              </button>
            </form>
          )}

          {/* ================= TAB 2: SAVED ALERTS (R, U, D) ================= */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                  <Bell className="h-8 w-8 text-slate-300" />
                  <div className="text-sm font-bold text-slate-700">No price alerts saved yet</div>
                  <p className="text-xs text-slate-500">Track flight routes to get instant notifications when airfares drop.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className={`rounded-xl px-4 py-2 text-xs font-bold ${PRIMARY_BTN}`}
                  >
                    Set your first alert
                  </button>
                </div>
              ) : (
                alerts.map((a) => {
                  const isActive = a.status === 'ACTIVE';
                  return (
                    <div
                      key={a.alertId}
                      className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-slate-900">
                              {a.originCode} → {a.destinationCode}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {isActive ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {a.originCity || a.originCode} to {a.destinationCity || a.destinationCode}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400">Target Budget</span>
                          <div className="text-base font-black text-blue-700">${a.targetPrice}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                          {a.cabinClass || 'ECONOMY'}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                          {a.frequency === 'INSTANT' ? '⚡ Instant' : a.frequency === 'DAILY' ? '📅 Daily' : '📊 Weekly'}
                        </span>
                        <span className="truncate text-slate-400">Sent to: {a.userEmail}</span>
                      </div>

                      {/* Action buttons (Update, Pause, Delete) */}
                      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(a)}
                          title={isActive ? 'Pause price tracking' : 'Resume price tracking'}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97]"
                        >
                          {isActive ? <Pause className="h-3 w-3 text-amber-500" /> : <Play className="h-3 w-3 text-emerald-500" />}
                          <span>{isActive ? 'Pause' : 'Resume'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingAlert(a)}
                          title="Edit target price or settings"
                          className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-[0.97]"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(a)}
                          title="Delete alert"
                          className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.97]"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= EDIT MODAL (U) ================= */}
      {editingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setEditingAlert(null)} />
          <div className="relative z-10 w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900">
                Update Alert: {editingAlert.originCode} → {editingAlert.destinationCode}
              </h4>
              <button onClick={() => setEditingAlert(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAlert} className="space-y-3">
              <label className="block">
                <span className={LABEL}>Target Price ($) *</span>
                <input
                  type="number"
                  min={10}
                  value={editingAlert.targetPrice}
                  onChange={(e) => setEditingAlert({ ...editingAlert, targetPrice: e.target.value })}
                  className={INPUT}
                  required
                />
              </label>

              <label className="block">
                <span className={LABEL}>Cabin Class</span>
                <select
                  value={editingAlert.cabinClass}
                  onChange={(e) => setEditingAlert({ ...editingAlert, cabinClass: e.target.value })}
                  className={INPUT}
                >
                  <option value="ECONOMY">Economy Class</option>
                  <option value="BUSINESS">Business Class</option>
                  <option value="FIRST">First Class</option>
                </select>
              </label>

              <label className="block">
                <span className={LABEL}>Notification Frequency</span>
                <select
                  value={editingAlert.frequency}
                  onChange={(e) => setEditingAlert({ ...editingAlert, frequency: e.target.value })}
                  className={INPUT}
                >
                  <option value="INSTANT">Instant Alert</option>
                  <option value="DAILY">Daily Digest</option>
                  <option value="WEEKLY">Weekly Summary</option>
                </select>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAlert(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold ${PRIMARY_BTN}`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION (D) ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 text-center shadow-2xl">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 className="h-6 w-6" />
            </span>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                Delete Price Alert?
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Remove price tracking for {deleteTarget.originCode} → {deleteTarget.destinationCode}.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAlert(deleteTarget)}
                className="rounded-xl bg-red-600 py-2.5 text-xs font-extrabold text-white transition hover:bg-red-700"
              >
                Delete Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
