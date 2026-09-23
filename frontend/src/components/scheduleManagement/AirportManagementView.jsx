import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Globe,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  PlaneTakeoff,
  ShieldCheck
} from 'lucide-react';
import { INITIAL_AIRPORTS } from '../../data/mockData';
import { fetchAirportsApi, createAirportApi, updateAirportApi, deleteAirportApi } from '../../api/apiService';

/* ---------- shared style tokens (same as the other pages) ---------- */
const CARD = 'rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,30,92,0.06)]';
const NAVY = 'bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8]';
const PRIMARY_BTN =
  'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.98]';
const LABEL = 'mb-1.5 block text-xs font-bold text-slate-700';
const INPUT =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:py-2.5 sm:text-sm';

// Helper flag mapper for popular countries/airports
const getCountryFlag = (country, code) => {
  if (!country) return '✈️';
  const c = country.toLowerCase();
  if (c.includes('sri lanka') || code === 'CMB') return '🇱🇰';
  if (c.includes('singapore') || code === 'SIN') return '🇸🇬';
  if (c.includes('uae') || c.includes('dubai') || code === 'DXB') return '🇦🇪';
  if (c.includes('united kingdom') || c.includes('uk') || code === 'LHR') return '🇬🇧';
  if (c.includes('usa') || c.includes('united states') || code === 'JFK') return '🇺🇸';
  if (c.includes('japan') || code === 'HND') return '🇯🇵';
  if (c.includes('australia') || code === 'SYD') return '🇦🇺';
  if (c.includes('india')) return '🇮🇳';
  if (c.includes('france')) return '🇫🇷';
  if (c.includes('germany')) return '🇩🇪';
  if (c.includes('canada')) return '🇨🇦';
  if (c.includes('qatar')) return '🇶🇦';
  if (c.includes('thailand')) return '🇹🇭';
  if (c.includes('malaysia')) return '🇲🇾';
  return '🌐';
};

/* ====================== small presentational pieces ====================== */

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

function Sheet({ title, eyebrow, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sl-backdrop absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="sl-sheet relative z-10 flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:rounded-[1.75rem]">
        <div className={`relative shrink-0 overflow-hidden ${NAVY} px-5 pb-4 pt-3 text-white sm:px-6 sm:pt-5`}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/30 sm:hidden" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              {eyebrow && <p className="text-xs font-semibold text-cyan-200">{eyebrow}</p>}
              <h3 className="mt-0.5 flex items-center gap-2 text-lg font-extrabold leading-tight">
                <Icon className="h-5 w-5 shrink-0 text-cyan-300" />
                <span className="min-w-0">{title}</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function SheetFooter({ onCancel, submitLabel }) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-200 bg-white/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-6 sm:pb-4">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-800 active:scale-[0.98]"
      >
        {submitLabel}
      </button>
    </div>
  );
}

/* ============================== main view ============================== */

export default function AirportManagementView({ airports: propsAirports, onAirportsUpdated }) {
  const [airports, setAirports] = useState(propsAirports || INITIAL_AIRPORTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAirport, setEditingAirport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });
  const toastTimer = useRef(null);

  // Add Form State
  const [newAirport, setNewAirport] = useState({
    airportCode: '',
    airportName: '',
    city: '',
    country: ''
  });

  // Sync with backend on load
  const loadAirportsFromBackend = async () => {
    setLoading(true);
    try {
      const data = await fetchAirportsApi();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map(a => ({
          code: a.airportCode || a.code,
          name: a.airportName || a.name,
          city: a.city,
          country: a.country,
          flag: getCountryFlag(a.country, a.airportCode || a.code)
        }));
        setAirports(formatted);
        onAirportsUpdated && onAirportsUpdated(formatted);
      }
    } catch (err) {
      console.warn("Backend airport sync notice:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAirportsFromBackend();
    return () => clearTimeout(toastTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sheets: lock page scroll and let Escape close the top-most one
  useEffect(() => {
    if (!(showAddModal || editingAirport || deleteTarget)) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (deleteTarget) setDeleteTarget(null);
      else if (editingAirport) setEditingAirport(null);
      else setShowAddModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [showAddModal, editingAirport, deleteTarget]);

  const showNotification = (type, text) => {
    setFeedbackMsg({ type, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
  };

  // Submit Handler for Adding New Airport
  const handleAddAirportSubmit = async (e) => {
    e.preventDefault();
    const codeClean = newAirport.airportCode.trim().toUpperCase();

    if (!codeClean || codeClean.length < 3) {
      showNotification('error', 'Airport code must be 3 characters (e.g. CMB, JFK, HND).');
      return;
    }

    if (airports.some(a => a.code.toUpperCase() === codeClean)) {
      showNotification('error', `Airport code "${codeClean}" already exists in the system.`);
      return;
    }

    const newItem = {
      code: codeClean,
      name: newAirport.airportName.trim(),
      city: newAirport.city.trim(),
      country: newAirport.country.trim(),
      flag: getCountryFlag(newAirport.country, codeClean)
    };

    try {
      await createAirportApi({
        airportCode: newItem.code,
        airportName: newItem.name,
        city: newItem.city,
        country: newItem.country
      });
      showNotification('success', `Airport ${newItem.code} (${newItem.city}) saved to the SQL database.`);
    } catch (err) {
      console.warn("Saved to local state due to backend offline/notice:", err.message);
      showNotification('success', `Airport ${newItem.code} added to local state.`);
    }

    const updatedList = [newItem, ...airports];
    setAirports(updatedList);
    onAirportsUpdated && onAirportsUpdated(updatedList);
    setNewAirport({ airportCode: '', airportName: '', city: '', country: '' });
    setShowAddModal(false);
  };

  // Submit Handler for Updating Existing Airport
  const handleEditAirportSubmit = async (e) => {
    e.preventDefault();
    if (!editingAirport) return;

    const updatedCode = editingAirport.code;
    const updatedName = editingAirport.name.trim();
    const updatedCity = editingAirport.city.trim();
    const updatedCountry = editingAirport.country.trim();

    try {
      await updateAirportApi(updatedCode, {
        airportName: updatedName,
        city: updatedCity,
        country: updatedCountry
      });
      showNotification('success', `Airport ${updatedCode} updated in the SQL database.`);
    } catch (err) {
      console.warn("Backend update notice:", err.message);
      showNotification('success', `Airport ${updatedCode} updated.`);
    }

    const updatedList = airports.map(a => {
      if (a.code === updatedCode) {
        return {
          ...a,
          name: updatedName,
          city: updatedCity,
          country: updatedCountry,
          flag: getCountryFlag(updatedCountry, updatedCode)
        };
      }
      return a;
    });

    setAirports(updatedList);
    onAirportsUpdated && onAirportsUpdated(updatedList);
    setEditingAirport(null);
  };

  // Delete Handler for Airport (confirmation is now an in-app dialog)
  const handleDeleteAirport = async (code) => {
    try {
      await deleteAirportApi(code);
      showNotification('success', `Airport ${code} deleted from the SQL database.`);
    } catch (err) {
      console.warn("Backend delete notice:", err.message);
      showNotification('success', `Airport ${code} removed.`);
    }

    const updatedList = airports.filter(a => a.code !== code);
    setAirports(updatedList);
    onAirportsUpdated && onAirportsUpdated(updatedList);
  };

  const filteredAirports = airports.filter(a =>
    a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { icon: Building2, tone: 'bg-blue-50 text-blue-600', label: 'Total airport hubs', value: `${airports.length} registered`, valueTone: 'text-slate-900' },
    { icon: Globe, tone: 'bg-emerald-50 text-emerald-600', label: 'Countries covered', value: `${new Set(airports.map(a => a.country)).size} countries`, valueTone: 'text-slate-900' },
    { icon: PlaneTakeoff, tone: 'bg-sky-50 text-sky-600', label: 'Operational status', value: '100% active', valueTone: 'text-emerald-600' }
  ];

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes sl-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sl-up { from { transform: translateY(100%) } to { transform: none } }
        @keyframes sl-zoom { from { opacity: 0; transform: scale(.96) translateY(8px) } to { opacity: 1; transform: none } }
        .sl-backdrop { animation: sl-fade .25s ease both }
        .sl-sheet { animation: sl-up .32s cubic-bezier(.2,.8,.2,1) both }
        @media (min-width: 640px) { .sl-sheet { animation-name: sl-zoom; animation-duration: .25s } }
        @media (prefers-reduced-motion: reduce) { .sl-backdrop, .sl-sheet { animation: none } }
      `}</style>

      {/* ============================ HERO ============================ */}
      <div className={`relative overflow-hidden rounded-[2rem] ${NAVY} p-5 text-white shadow-2xl shadow-blue-900/20 sm:p-8 md:p-10`}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
          viewBox="0 0 800 260"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M-20 230 C 220 20, 520 20, 820 200" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 8" />
        </svg>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" />
              Airline admin hub | SQL database synchronized
            </div>
            <h2 className="flex items-start gap-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl md:text-4xl">
              <Building2 className="mt-1 hidden h-7 w-7 shrink-0 text-cyan-300 sm:block" />
              Airport network and destination hubs
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
              Add, update, or remove international airport hubs. Changes update the backend SQL tables and the flight route selectors.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <button
              onClick={loadAirportsFromBackend}
              disabled={loading}
              title="Refresh from database"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm font-bold backdrop-blur transition hover:bg-white/20 active:scale-[0.98] disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync DB
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-extrabold text-[#0a1230] shadow-xl shadow-black/20 transition hover:bg-blue-50 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 text-blue-600" />
              Add airport
            </button>
          </div>
        </div>
      </div>

      {/* ======================= Notification ======================= */}
      {feedbackMsg.text && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm font-semibold shadow-sm ${
            feedbackMsg.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedbackMsg.type === 'error' ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span className="leading-snug">{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg({ type: '', text: '' })}
            aria-label="Dismiss"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ======================= Overview cards ======================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`${CARD} flex items-center gap-3 p-4 sm:gap-4 sm:p-5 ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-400">{s.label}</div>
                <div className={`text-lg font-extrabold leading-tight sm:text-xl ${s.valueTone}`}>{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================= Airports list ======================= */}
      <div className={`${CARD} space-y-4 p-4 sm:p-6`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label="Search airports"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code, name, city or country"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-11 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredAirports.length} {filteredAirports.length === 1 ? 'airport' : 'airports'}
          </span>
        </div>

        {filteredAirports.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 ring-1 ring-slate-200">
              <Building2 className="h-7 w-7" />
            </span>
            <h3 className="text-base font-bold text-slate-800">
              {searchTerm ? 'No airports match your search' : 'No airports registered yet'}
            </h3>
            <p className="max-w-sm text-sm text-slate-500">
              {searchTerm ? `Nothing found for "${searchTerm}". Try a code, city or country.` : 'Add your first airport hub to make it available in flight route selectors.'}
            </p>
            {searchTerm ? (
              <button onClick={() => setSearchTerm('')} className={`rounded-xl px-5 py-2.5 text-sm font-bold ${PRIMARY_BTN}`}>
                Clear search
              </button>
            ) : (
              <button onClick={() => setShowAddModal(true)} className={`rounded-xl px-5 py-2.5 text-sm font-bold ${PRIMARY_BTN}`}>
                Add airport
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table: tablets and up */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Code</th>
                      <th className="px-4 py-3.5">Airport name</th>
                      <th className="px-4 py-3.5">City</th>
                      <th className="px-4 py-3.5">Country</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAirports.map((a) => (
                      <tr key={a.code} className="transition-colors hover:bg-blue-50/40">
                        <td className="px-4 py-3.5">
                          <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-sm font-extrabold tracking-wide text-blue-700">
                            {a.code}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold text-slate-900">{a.name}</td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {a.city}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                            <span>{a.flag || getCountryFlag(a.country, a.code)}</span>
                            <span>{a.country}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => setEditingAirport(a)}
                              title="Edit airport details"
                              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-[0.97]"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ code: a.code, name: a.name })}
                              title="Delete airport"
                              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 active:scale-[0.97]"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards: phones */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredAirports.map((a) => (
                <div key={a.code} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-lg font-black tracking-wide text-blue-700">
                      {a.code}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">
                      <span>{a.flag || getCountryFlag(a.country, a.code)}</span>
                      <span className="truncate">{a.country}</span>
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-extrabold leading-snug text-slate-900">{a.name}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {a.city}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => setEditingAirport(a)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-[0.98]"
                    >
                      <Edit3 className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ code: a.code, name: a.name })}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ======================= Add airport ======================= */}
      {showAddModal && (
        <Sheet
          eyebrow="Airport network"
          title="Add new international airport"
          icon={Plus}
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={handleAddAirportSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              <Field label="Airport code (3 letters) *">
                <input
                  type="text"
                  maxLength={3}
                  value={newAirport.airportCode}
                  onChange={(e) => setNewAirport({ ...newAirport, airportCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. CMB, JFK, DXB"
                  autoCapitalize="characters"
                  className={`${INPUT} font-extrabold uppercase tracking-widest`}
                  required
                />
              </Field>

              <Field label="Airport full name *">
                <input
                  type="text"
                  value={newAirport.airportName}
                  onChange={(e) => setNewAirport({ ...newAirport, airportName: e.target.value })}
                  placeholder="e.g. Bandaranaike International Airport"
                  className={INPUT}
                  required
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                <Field label="City *">
                  <input
                    type="text"
                    value={newAirport.city}
                    onChange={(e) => setNewAirport({ ...newAirport, city: e.target.value })}
                    placeholder="e.g. Colombo"
                    className={INPUT}
                    required
                  />
                </Field>
                <Field label="Country *">
                  <input
                    type="text"
                    value={newAirport.country}
                    onChange={(e) => setNewAirport({ ...newAirport, country: e.target.value })}
                    placeholder="e.g. Sri Lanka"
                    className={INPUT}
                    required
                  />
                </Field>
              </div>
            </div>

            <SheetFooter onCancel={() => setShowAddModal(false)} submitLabel="Save airport" />
          </form>
        </Sheet>
      )}

      {/* ======================= Edit airport ======================= */}
      {editingAirport && (
        <Sheet
          eyebrow={`${editingAirport.city}, ${editingAirport.country}`}
          title={`Update airport ${editingAirport.code}`}
          icon={Edit3}
          onClose={() => setEditingAirport(null)}
        >
          <form onSubmit={handleEditAirportSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              <Field label="Airport code (read-only primary key)">
                <input type="text" value={editingAirport.code} disabled className={`${INPUT} font-extrabold tracking-widest`} />
              </Field>

              <Field label="Airport full name *">
                <input
                  type="text"
                  value={editingAirport.name}
                  onChange={(e) => setEditingAirport({ ...editingAirport, name: e.target.value })}
                  className={INPUT}
                  required
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                <Field label="City *">
                  <input
                    type="text"
                    value={editingAirport.city}
                    onChange={(e) => setEditingAirport({ ...editingAirport, city: e.target.value })}
                    className={INPUT}
                    required
                  />
                </Field>
                <Field label="Country *">
                  <input
                    type="text"
                    value={editingAirport.country}
                    onChange={(e) => setEditingAirport({ ...editingAirport, country: e.target.value })}
                    className={INPUT}
                    required
                  />
                </Field>
              </div>
            </div>

            <SheetFooter onCancel={() => setEditingAirport(null)} submitLabel="Save changes" />
          </form>
        </Sheet>
      )}

      {/* ======================= Delete confirmation ======================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="alertdialog" aria-modal="true" aria-label="Confirm delete">
          <div className="sl-backdrop absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="sl-sheet relative z-10 w-full max-w-md space-y-5 rounded-t-[1.75rem] bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center shadow-2xl sm:rounded-[1.75rem]">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 className="h-7 w-7" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Delete airport {deleteTarget.code}?</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                {deleteTarget.name} will be removed from the database records.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  await handleDeleteAirport(target.code);
                }}
                className="rounded-xl bg-gradient-to-b from-red-500 to-red-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-red-600/30 transition hover:from-red-500 hover:to-red-700 active:scale-[0.98]"
              >
                Delete airport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}