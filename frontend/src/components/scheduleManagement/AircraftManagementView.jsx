import React, { useState, useEffect, useRef } from 'react';
import {
  Plane,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  ShieldCheck,
  Armchair,
  Sparkles,
  Layers,
  Check,
  ChevronDown,
  Pin,
  Lock,
  Unlock,
  Hash
} from 'lucide-react';
import { INITIAL_AIRCRAFT } from '../../data/mockData';
import {
  fetchAircraftApi,
  createAircraftApi,
  updateAircraftApi,
  deleteAircraftApi
} from '../../api/apiService';

/* ---------- shared style tokens (same as the other pages) ---------- */
const CARD = 'rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,30,92,0.06)]';
const NAVY = 'bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8]';
const PRIMARY_BTN =
  'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.98]';
const LABEL = 'mb-1.5 block text-xs font-bold text-slate-700';
const INPUT =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:py-2.5 sm:text-sm';

const AIRCRAFT_PRESETS = [
  { model: 'Boeing 787-9 Dreamliner', economySeats: 210, businessSeats: 32, firstClassSeats: 8 },
  { model: 'Airbus A350-900', economySeats: 240, businessSeats: 36, firstClassSeats: 12 },
  { model: 'Boeing 777-300ER', economySeats: 260, businessSeats: 42, firstClassSeats: 14 },
  { model: 'Airbus A320neo', economySeats: 160, businessSeats: 16, firstClassSeats: 0 },
  { model: 'Boeing 737 MAX 9', economySeats: 172, businessSeats: 16, firstClassSeats: 0 },
  { model: 'Airbus A330-900neo', economySeats: 235, businessSeats: 28, firstClassSeats: 0 },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active / Flight Ready', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'MAINTENANCE', label: 'Under Maintenance', tone: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { value: 'STANDBY', label: 'Reserve / Standby', tone: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  { value: 'RETIRED', label: 'Retired Fleet', tone: 'bg-slate-100 text-slate-600 border-slate-300', dot: 'bg-slate-400' },
];

/**
 * Intelligent generator that computes the next unique aircraft tail number (e.g., 4R-SLA -> 4R-SLB -> ... -> 4R-SLE)
 */
export const generateNextTailNumber = (existingList = []) => {
  const existingTails = new Set(
    existingList.map((a) => (a.tailNumber || '').trim().toUpperCase())
  );

  // 1. Try 4R-SL[A-Z] sequence
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < alphabet.length; i++) {
    const candidate = `4R-SL${alphabet[i]}`;
    if (!existingTails.has(candidate)) {
      return candidate;
    }
  }

  // 2. Try 4R-SM[A-Z] sequence
  for (let i = 0; i < alphabet.length; i++) {
    const candidate = `4R-SM${alphabet[i]}`;
    if (!existingTails.has(candidate)) {
      return candidate;
    }
  }

  // 3. Fallback to numbered suffix (4R-SL01, 4R-SL02...)
  for (let i = 1; i <= 999; i++) {
    const candidate = `4R-SL${String(i).padStart(2, '0')}`;
    if (!existingTails.has(candidate)) {
      return candidate;
    }
  }

  return `4R-SL${Date.now().toString().slice(-4)}`;
};

const getStatusBadge = (status) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return { label: 'Active', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    case 'MAINTENANCE':
      return { label: 'Maintenance', tone: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
    case 'STANDBY':
      return { label: 'Standby', tone: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' };
    case 'RETIRED':
      return { label: 'Retired', tone: 'bg-slate-100 text-slate-600 border-slate-300', dot: 'bg-slate-400' };
    default:
      return { label: status || 'Active', tone: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
  }
};

/* ====================== small presentational pieces ====================== */

function Field({ label, hint, children }) {
  return (
    <label className="block min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className={LABEL}>{label}</span>
        {hint && <span className="text-[11px] font-medium text-slate-400">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function Sheet({ title, eyebrow, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sl-backdrop absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="sl-sheet relative z-10 flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:rounded-[1.75rem]">
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

export default function AircraftManagementView({ aircraft: propsAircraft, onAircraftUpdated }) {
  const [aircraftList, setAircraftList] = useState(propsAircraft || INITIAL_AIRCRAFT);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });
  const toastTimer = useRef(null);

  // Add Form State with database attributes
  const [newAircraft, setNewAircraft] = useState({
    model: '',
    tailNumber: '',
    economySeats: 150,
    businessSeats: 30,
    firstClassSeats: 12,
    status: 'ACTIVE'
  });

  // Sync with backend on load
  const loadAircraftFromBackend = async () => {
    setLoading(true);
    try {
      const data = await fetchAircraftApi();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((a, idx) => ({
          id: a.aircraftId || a.id || idx + 1,
          aircraftId: a.aircraftId || a.id || idx + 1,
          model: a.model,
          tailNumber: a.tailNumber,
          economySeats: Number(a.economySeats) || 0,
          businessSeats: Number(a.businessSeats) || 0,
          firstClassSeats: Number(a.firstClassSeats ?? a.firstSeats) || 0,
          firstSeats: Number(a.firstClassSeats ?? a.firstSeats) || 0,
          status: a.status || 'ACTIVE'
        }));
        setAircraftList(formatted);
        onAircraftUpdated && onAircraftUpdated(formatted);
      }
    } catch (err) {
      console.warn('Backend aircraft sync notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAircraftFromBackend();
    return () => clearTimeout(toastTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sheets: lock page scroll and let Escape close the top-most one
  useEffect(() => {
    if (!(showAddModal || editingAircraft || deleteTarget)) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (deleteTarget) setDeleteTarget(null);
      else if (editingAircraft) setEditingAircraft(null);
      else setShowAddModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [showAddModal, editingAircraft, deleteTarget]);

  const showNotification = (type, text) => {
    setFeedbackMsg({ type, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4500);
  };

  // Open Add modal with pinned auto-generated tail number
  const handleOpenAddModal = () => {
    const autoTail = generateNextTailNumber(aircraftList);
    setNewAircraft({
      model: '',
      tailNumber: autoTail,
      economySeats: 150,
      businessSeats: 30,
      firstClassSeats: 12,
      status: 'ACTIVE'
    });
    setShowAddModal(true);
  };

  // Regenerate tail number inside the modal
  const handleRegenerateTail = () => {
    const freshTail = generateNextTailNumber(aircraftList);
    setNewAircraft((prev) => ({ ...prev, tailNumber: freshTail }));
    showNotification('success', `Assigned new tail number: ${freshTail}`);
  };

  const applyPreset = (preset) => {
    setNewAircraft((prev) => ({
      ...prev,
      model: preset.model,
      economySeats: preset.economySeats,
      businessSeats: preset.businessSeats,
      firstClassSeats: preset.firstClassSeats
    }));
  };

  // Submit Handler for Adding New Aircraft
  const handleAddAircraftSubmit = async (e) => {
    e.preventDefault();
    const tailClean = newAircraft.tailNumber.trim().toUpperCase();
    const modelClean = newAircraft.model.trim();

    if (!modelClean) {
      showNotification('error', 'Aircraft model name is required.');
      return;
    }

    if (!tailClean) {
      showNotification('error', 'Aircraft tail number is required (e.g. 4R-SLA).');
      return;
    }

    // Check duplicate tail number
    if (aircraftList.some((a) => a.tailNumber.toUpperCase() === tailClean)) {
      showNotification('error', `Aircraft with tail number "${tailClean}" already exists.`);
      return;
    }

    const payload = {
      model: modelClean,
      tailNumber: tailClean,
      economySeats: Number(newAircraft.economySeats) || 0,
      businessSeats: Number(newAircraft.businessSeats) || 0,
      firstClassSeats: Number(newAircraft.firstClassSeats) || 0,
      status: newAircraft.status || 'ACTIVE'
    };

    let createdId = Date.now();
    try {
      const res = await createAircraftApi(payload);
      if (res && (res.aircraftId || res.id)) {
        createdId = res.aircraftId || res.id;
      }
      showNotification('success', `Aircraft ${tailClean} (${modelClean}) added to the SQL database!`);
    } catch (err) {
      console.warn('Saved to local state due to backend offline/notice:', err.message);
      showNotification('success', `Aircraft ${tailClean} added to fleet list.`);
    }

    const newItem = {
      id: createdId,
      aircraftId: createdId,
      ...payload,
      firstSeats: payload.firstClassSeats
    };

    const updatedList = [newItem, ...aircraftList];
    setAircraftList(updatedList);
    onAircraftUpdated && onAircraftUpdated(updatedList);
    setShowAddModal(false);
  };

  // Submit Handler for Updating Existing Aircraft
  const handleEditAircraftSubmit = async (e) => {
    e.preventDefault();
    if (!editingAircraft) return;

    const id = editingAircraft.aircraftId || editingAircraft.id;
    const tailClean = editingAircraft.tailNumber.trim().toUpperCase();
    const modelClean = editingAircraft.model.trim();

    const payload = {
      model: modelClean,
      tailNumber: tailClean,
      economySeats: Number(editingAircraft.economySeats) || 0,
      businessSeats: Number(editingAircraft.businessSeats) || 0,
      firstClassSeats: Number(editingAircraft.firstClassSeats ?? editingAircraft.firstSeats) || 0,
      status: editingAircraft.status || 'ACTIVE'
    };

    try {
      await updateAircraftApi(id, payload);
      showNotification('success', `Aircraft ${tailClean} updated in the SQL database.`);
    } catch (err) {
      console.warn('Backend update notice:', err.message);
      showNotification('success', `Aircraft ${tailClean} updated.`);
    }

    const updatedList = aircraftList.map((a) => {
      if ((a.aircraftId || a.id) === id) {
        return {
          ...a,
          ...payload,
          firstSeats: payload.firstClassSeats
        };
      }
      return a;
    });

    setAircraftList(updatedList);
    onAircraftUpdated && onAircraftUpdated(updatedList);
    setEditingAircraft(null);
  };

  // Delete Handler for Aircraft
  const handleDeleteAircraft = async (aircraft) => {
    const id = aircraft.aircraftId || aircraft.id;
    try {
      await deleteAircraftApi(id);
      showNotification('success', `Aircraft ${aircraft.tailNumber} deleted from SQL database.`);
    } catch (err) {
      console.warn('Backend delete notice:', err.message);
      showNotification('success', `Aircraft ${aircraft.tailNumber} removed.`);
    }

    const updatedList = aircraftList.filter((a) => (a.aircraftId || a.id) !== id);
    setAircraftList(updatedList);
    onAircraftUpdated && onAircraftUpdated(updatedList);
  };

  const filteredAircraft = aircraftList.filter((a) => {
    const matchesSearch =
      a.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tailNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.status?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status?.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate fleet stats
  const totalSeatsInFleet = aircraftList.reduce(
    (sum, a) => sum + (Number(a.economySeats) || 0) + (Number(a.businessSeats) || 0) + (Number(a.firstClassSeats ?? a.firstSeats) || 0),
    0
  );
  const activeCount = aircraftList.filter((a) => a.status === 'ACTIVE').length;

  const stats = [
    {
      icon: Plane,
      tone: 'bg-blue-50 text-blue-600',
      label: 'Fleet size',
      value: `${aircraftList.length} aircraft`,
      valueTone: 'text-slate-900'
    },
    {
      icon: Armchair,
      tone: 'bg-indigo-50 text-indigo-600',
      label: 'Total seat capacity',
      value: `${totalSeatsInFleet.toLocaleString()} seats`,
      valueTone: 'text-slate-900'
    },
    {
      icon: ShieldCheck,
      tone: 'bg-emerald-50 text-emerald-600',
      label: 'Fleet operational status',
      value: `${activeCount} / ${aircraftList.length} active`,
      valueTone: 'text-emerald-600'
    }
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
              Airline fleet registry | SQL database synchronized
            </div>
            <h2 className="flex items-start gap-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl md:text-4xl">
              <Plane className="mt-1 hidden h-7 w-7 shrink-0 text-cyan-300 sm:block" />
              Aircraft fleet & cabin management
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
              Register airframes, customize cabin seat configurations (Economy, Business, First Class), and track operational status in real time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <button
              onClick={loadAircraftFromBackend}
              disabled={loading}
              title="Refresh from database"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm font-bold backdrop-blur transition hover:bg-white/20 active:scale-[0.98] disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync DB
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-extrabold text-[#0a1230] shadow-xl shadow-black/20 transition hover:bg-blue-50 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 text-blue-600" />
              Add aircraft
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

      {/* ======================= Aircraft list ======================= */}
      <div className={`${CARD} space-y-4 p-4 sm:p-6`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                aria-label="Search aircraft"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search model, tail number (e.g. 4R-SLA) or status..."
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

            <div className="relative inline-block w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-9 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white sm:py-3.5"
              >
                <option value="ALL">All Statuses ({aircraftList.length})</option>
                <option value="ACTIVE">Active Ready</option>
                <option value="MAINTENANCE">In Maintenance</option>
                <option value="STANDBY">Standby Reserve</option>
                <option value="RETIRED">Retired</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredAircraft.length} of {aircraftList.length} aircraft
          </span>
        </div>

        {filteredAircraft.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 ring-1 ring-slate-200">
              <Plane className="h-7 w-7" />
            </span>
            <h3 className="text-base font-bold text-slate-800">
              {searchTerm || statusFilter !== 'ALL' ? 'No aircraft match your filter criteria' : 'No aircraft registered yet'}
            </h3>
            <p className="max-w-sm text-sm text-slate-500">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try resetting the search keywords or status filter.'
                : 'Add your first aircraft to the database to configure routes and seat allocations.'}
            </p>
            {searchTerm || statusFilter !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold ${PRIMARY_BTN}`}
              >
                Reset filters
              </button>
            ) : (
              <button onClick={handleOpenAddModal} className={`rounded-xl px-5 py-2.5 text-sm font-bold ${PRIMARY_BTN}`}>
                Add aircraft
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table: tablets and up */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Tail number</th>
                      <th className="px-4 py-3.5">Aircraft model</th>
                      <th className="px-4 py-3.5">Cabin configuration</th>
                      <th className="px-4 py-3.5">Total capacity</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAircraft.map((a) => {
                      const eco = Number(a.economySeats) || 0;
                      const bus = Number(a.businessSeats) || 0;
                      const first = Number(a.firstClassSeats ?? a.firstSeats) || 0;
                      const total = eco + bus + first;
                      const status = getStatusBadge(a.status);

                      return (
                        <tr key={a.tailNumber || a.aircraftId || a.id} className="transition-colors hover:bg-blue-50/40">
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-sm font-extrabold tracking-wider text-blue-700">
                              <Plane className="h-3.5 w-3.5" />
                              {a.tailNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="text-sm font-bold text-slate-900">{a.model}</div>
                            <div className="text-[11px] text-slate-400">ID #{a.aircraftId || a.id || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                                Eco: {eco}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                                Biz: {bus}
                              </span>
                              {first > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                                  1st: {first}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <Armchair className="h-4 w-4 text-slate-400" />
                              <span className="text-sm font-extrabold text-slate-900">{total} seats</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${status.tone}`}>
                              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => setEditingAircraft(a)}
                                title="Edit aircraft details"
                                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-[0.97]"
                              >
                                <Edit3 className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => setDeleteTarget(a)}
                                title="Delete aircraft"
                                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 active:scale-[0.97]"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards: phones and tablets */}
            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {filteredAircraft.map((a) => {
                const eco = Number(a.economySeats) || 0;
                const bus = Number(a.businessSeats) || 0;
                const first = Number(a.firstClassSeats ?? a.firstSeats) || 0;
                const total = eco + bus + first;
                const status = getStatusBadge(a.status);

                return (
                  <div key={a.tailNumber || a.aircraftId || a.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-base font-black tracking-wide text-blue-700">
                        <Plane className="h-4 w-4" />
                        {a.tailNumber}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${status.tone}`}>
                        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>

                    <div>
                      <div className="text-base font-extrabold text-slate-900">{a.model}</div>
                      <div className="text-xs text-slate-400">Database Record ID: #{a.aircraftId || a.id || 'N/A'}</div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">Total Seating Capacity</span>
                        <span className="font-extrabold text-blue-700">{total} seats</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                        <div className="rounded-lg bg-blue-100/70 p-1.5 font-bold text-blue-800">
                          <span className="block text-[10px] text-blue-600 font-semibold">Economy</span>
                          {eco}
                        </div>
                        <div className="rounded-lg bg-indigo-100/70 p-1.5 font-bold text-indigo-800">
                          <span className="block text-[10px] text-indigo-600 font-semibold">Business</span>
                          {bus}
                        </div>
                        <div className="rounded-lg bg-amber-100/70 p-1.5 font-bold text-amber-800">
                          <span className="block text-[10px] text-amber-600 font-semibold">First</span>
                          {first}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => setEditingAircraft(a)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-[0.98]"
                      >
                        <Edit3 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ======================= Add Aircraft Modal ======================= */}
      {showAddModal && (
        <Sheet
          eyebrow="Fleet expansion"
          title="Register new aircraft"
          icon={Plus}
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={handleAddAircraftSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              
              {/* Pinned Auto-Generated Tail Number Section */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-sky-50/80 p-4 shadow-sm">
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-400/10 blur-xl" />
                
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-900">
                    <Pin className="h-3.5 w-3.5 text-blue-600 fill-blue-600" />
                    Pinned Aircraft Tail Number (Auto-Generated)
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                    <Sparkles className="h-3 w-3 text-blue-600" />
                    Auto-Assigned
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Plane className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
                    <input
                      type="text"
                      value={newAircraft.tailNumber}
                      onChange={(e) => setNewAircraft({ ...newAircraft, tailNumber: e.target.value.toUpperCase() })}
                      placeholder="e.g. 4R-SLA"
                      className="w-full rounded-xl border-2 border-blue-400/50 bg-white py-3 pl-10 pr-3.5 text-base font-black tracking-widest text-blue-950 uppercase outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 sm:text-sm"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerateTail}
                    title="Generate next sequential tail number"
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-300 bg-white px-3.5 py-3 text-xs font-extrabold text-blue-700 shadow-sm transition hover:bg-blue-50 hover:border-blue-400 active:scale-[0.98]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Regenerate</span>
                  </button>
                </div>

                <p className="mt-2 text-[11px] font-medium leading-tight text-slate-500">
                  ✨ Unique registration identifier pinned according to the airline's sequential fleet protocol.
                </p>
              </div>

              {/* Quick presets */}
              <div>
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Quick airframe templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {AIRCRAFT_PRESETS.map((p) => (
                    <button
                      key={p.model}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {p.model.split(' ')[0]} {p.model.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Aircraft model *" hint="e.g. Boeing 787-9 Dreamliner">
                <input
                  type="text"
                  value={newAircraft.model}
                  onChange={(e) => setNewAircraft({ ...newAircraft, model: e.target.value })}
                  placeholder="e.g. Boeing 787-9 Dreamliner"
                  className={INPUT}
                  required
                />
              </Field>

              {/* Cabin seat distribution */}
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                    <Armchair className="h-4 w-4 text-blue-600" />
                    Cabin Seating Capacity Configuration
                  </span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-extrabold text-blue-800">
                    Total: {(Number(newAircraft.economySeats) || 0) + (Number(newAircraft.businessSeats) || 0) + (Number(newAircraft.firstClassSeats) || 0)} seats
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Economy seats *">
                    <input
                      type="number"
                      min={0}
                      value={newAircraft.economySeats}
                      onChange={(e) => setNewAircraft({ ...newAircraft, economySeats: Math.max(0, parseInt(e.target.value) || 0) })}
                      className={`${INPUT} border-blue-200 focus:border-blue-500`}
                      required
                    />
                  </Field>

                  <Field label="Business seats *">
                    <input
                      type="number"
                      min={0}
                      value={newAircraft.businessSeats}
                      onChange={(e) => setNewAircraft({ ...newAircraft, businessSeats: Math.max(0, parseInt(e.target.value) || 0) })}
                      className={`${INPUT} border-indigo-200 focus:border-indigo-500`}
                      required
                    />
                  </Field>

                  <Field label="First class seats *">
                    <input
                      type="number"
                      min={0}
                      value={newAircraft.firstClassSeats}
                      onChange={(e) => setNewAircraft({ ...newAircraft, firstClassSeats: Math.max(0, parseInt(e.target.value) || 0) })}
                      className={`${INPUT} border-amber-200 focus:border-amber-500`}
                      required
                    />
                  </Field>
                </div>
              </div>

              <Field label="Operational status">
                <select
                  value={newAircraft.status}
                  onChange={(e) => setNewAircraft({ ...newAircraft, status: e.target.value })}
                  className={INPUT}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <SheetFooter onCancel={() => setShowAddModal(false)} submitLabel="Save aircraft to fleet" />
          </form>
        </Sheet>
      )}

      {/* ======================= Edit Aircraft Modal ======================= */}
      {editingAircraft && (
        <Sheet
          eyebrow={`Tail Number: ${editingAircraft.tailNumber}`}
          title={`Update ${editingAircraft.model}`}
          icon={Edit3}
          onClose={() => setEditingAircraft(null)}
        >
          <form onSubmit={handleEditAircraftSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                <Field label="Tail number *">
                  <input
                    type="text"
                    value={editingAircraft.tailNumber}
                    onChange={(e) => setEditingAircraft({ ...editingAircraft, tailNumber: e.target.value.toUpperCase() })}
                    className={`${INPUT} uppercase font-extrabold tracking-wider`}
                    required
                  />
                </Field>

                <Field label="Aircraft model *">
                  <input
                    type="text"
                    value={editingAircraft.model}
                    onChange={(e) => setEditingAircraft({ ...editingAircraft, model: e.target.value })}
                    className={INPUT}
                    required
                  />
                </Field>
              </div>

              {/* Cabin seat distribution */}
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                    <Armchair className="h-4 w-4 text-blue-600" />
                    Cabin Seating Capacity
                  </span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-extrabold text-blue-800">
                    Total: {(Number(editingAircraft.economySeats) || 0) +
                      (Number(editingAircraft.businessSeats) || 0) +
                      (Number(editingAircraft.firstClassSeats ?? editingAircraft.firstSeats) || 0)}{' '}
                    seats
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Economy seats *">
                    <input
                      type="number"
                      min={0}
                      value={editingAircraft.economySeats}
                      onChange={(e) => setEditingAircraft({ ...editingAircraft, economySeats: Math.max(0, parseInt(e.target.value) || 0) })}
                      className={INPUT}
                      required
                    />
                  </Field>

                  <Field label="Business seats *">
                    <input
                      type="number"
                      min={0}
                      value={editingAircraft.businessSeats}
                      onChange={(e) => setEditingAircraft({ ...editingAircraft, businessSeats: Math.max(0, parseInt(e.target.value) || 0) })}
                      className={INPUT}
                      required
                    />
                  </Field>

                  <Field label="First class seats *">
                    <input
                      type="number"
                      min={0}
                      value={editingAircraft.firstClassSeats ?? editingAircraft.firstSeats ?? 0}
                      onChange={(e) =>
                        setEditingAircraft({
                          ...editingAircraft,
                          firstClassSeats: Math.max(0, parseInt(e.target.value) || 0),
                          firstSeats: Math.max(0, parseInt(e.target.value) || 0)
                        })
                      }
                      className={INPUT}
                      required
                    />
                  </Field>
                </div>
              </div>

              <Field label="Operational status">
                <select
                  value={editingAircraft.status || 'ACTIVE'}
                  onChange={(e) => setEditingAircraft({ ...editingAircraft, status: e.target.value })}
                  className={INPUT}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <SheetFooter onCancel={() => setEditingAircraft(null)} submitLabel="Save changes" />
          </form>
        </Sheet>
      )}

      {/* ======================= Delete confirmation ======================= */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirm delete"
        >
          <div className="sl-backdrop absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="sl-sheet relative z-10 w-full max-w-md space-y-5 rounded-t-[1.75rem] bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center shadow-2xl sm:rounded-[1.75rem]">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 className="h-7 w-7" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Delete aircraft {deleteTarget.tailNumber}?</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                {deleteTarget.model} ({deleteTarget.tailNumber}) will be removed from the fleet and SQL database.
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
                  await handleDeleteAircraft(target);
                }}
                className="rounded-xl bg-gradient-to-b from-red-500 to-red-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-red-600/30 transition hover:from-red-500 hover:to-red-700 active:scale-[0.98]"
              >
                Delete aircraft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
