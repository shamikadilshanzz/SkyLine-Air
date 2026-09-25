import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Plane,
  Clock,
  Edit3,
  Trash2,
  AlertTriangle,
  Search,
  Image as ImageIcon,
  X,
  Building2,
  DollarSign,
  ShieldCheck,
  MapPin,
  Hotel,
  RefreshCw,
  ChevronDown,
  ArrowRight,
  LayoutGrid,
  List as ListIcon,
  Users,
  Gauge,
  Armchair,
  Sparkles
} from 'lucide-react';
import { INITIAL_FLIGHTS, INITIAL_AIRPORTS, INITIAL_AIRCRAFT, PLANE_PHOTO_PRESETS } from '../../data/mockData';
import AirportManagementView from './AirportManagementView';
import AircraftManagementView from './AircraftManagementView';
import { fetchAircraftApi } from '../../api/apiService';

/* ---------- shared style tokens (same as the other pages) ---------- */
const CARD = 'rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,30,92,0.06)]';
const NAVY = 'bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8]';
const PRIMARY_BTN =
  'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.98]';
const LABEL = 'mb-1.5 block text-xs font-bold text-slate-700';
const INPUT =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:text-slate-400 sm:py-2.5 sm:text-sm';

const STATUS_OPTIONS = [
  { value: 'ON_TIME', label: 'On time' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'BOARDING', label: 'Boarding' },
  { value: 'DEPARTED', label: 'Departed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const statusStyle = (status) => {
  switch (status) {
    case 'ON_TIME': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'DELAYED': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'BOARDING': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'DEPARTED': return 'bg-sky-50 text-sky-700 border-sky-200';
    default: return 'bg-red-50 text-red-700 border-red-200';
  }
};

/* Solid dot + label used on the photo banner, where the soft badge tints would wash out */
const statusDotStyle = (status) => {
  switch (status) {
    case 'ON_TIME': return 'bg-emerald-400';
    case 'DELAYED': return 'bg-amber-400';
    case 'BOARDING': return 'bg-purple-400';
    case 'DEPARTED': return 'bg-sky-400';
    default: return 'bg-red-400';
  }
};

const fmtDateTime = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return d.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
};

const fmtTime = (v) => {
  if (!v) return '--:--';
  const d = new Date(v);
  if (isNaN(d)) return '--:--';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const fmtDay = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const getAircraftTotalSeats = (aircraft) => {
  if (!aircraft) return 60;
  const eco = Number(aircraft.economySeats) || 0;
  const bus = Number(aircraft.businessSeats) || 0;
  const first = Number(aircraft.firstClassSeats ?? aircraft.firstSeats) || 0;
  const total = eco + bus + first;
  return total > 0 ? total : 60;
};

/**
 * Automatically calculate duration string (e.g. '4h 30m') from departure and arrival times.
 * Handles datetime-local format as well as time-only inputs.
 */
export const calculateFlightDuration = (departureStr, arrivalStr) => {
  if (!departureStr || !arrivalStr) return '';
  let dep = new Date(departureStr);
  let arr = new Date(arrivalStr);

  if (isNaN(dep.getTime()) && typeof departureStr === 'string' && departureStr.includes(':')) {
    dep = new Date(`1970-01-01T${departureStr.trim().padStart(5, '0')}:00`);
  }
  if (isNaN(arr.getTime()) && typeof arrivalStr === 'string' && arrivalStr.includes(':')) {
    arr = new Date(`1970-01-01T${arrivalStr.trim().padStart(5, '0')}:00`);
  }

  if (isNaN(dep.getTime()) || isNaN(arr.getTime())) return '';

  const diffMs = arr.getTime() - dep.getTime();
  if (diffMs <= 0) return '';

  const totalMinutes = Math.round(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

/* ====================== small presentational pieces ====================== */

function StatusSelect({ value, onChange, solid = false }) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={onChange}
        aria-label="Flight status"
        className={`cursor-pointer appearance-none rounded-full border py-1.5 pl-3 pr-7 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-400 ${solid
            ? 'border-white/25 bg-white/15 text-white backdrop-blur-md [&>option]:text-slate-900'
            : statusStyle(value)
          }`}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60 ${solid ? 'text-white' : ''}`} />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

function FormSection({ icon: Icon, title, aside, children }) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </h4>
        {aside && (
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
            {aside}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

const CABINS = [
  { key: 'priceEconomy', label: 'Economy class', dot: 'bg-blue-600', on: 'bg-blue-600', border: 'border-blue-200', focus: 'focus:border-blue-600', def: 450, ph: 'e.g. 450' },
  { key: 'priceBusiness', label: 'Business class', dot: 'bg-indigo-600', on: 'bg-indigo-600', border: 'border-indigo-200', focus: 'focus:border-indigo-600', def: 1250, ph: 'Set 0 to disable' },
  { key: 'priceFirst', label: 'First class', dot: 'bg-amber-500', on: 'bg-amber-500', border: 'border-amber-200', focus: 'focus:border-amber-600', def: 2500, ph: 'Set 0 to disable' }
];

function CabinPricingFields({ data, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {CABINS.map((c) => {
        const enabled = Number(data[c.key]) > 0;
        return (
          <div
            key={c.key}
            className={`rounded-2xl border p-3.5 transition-all ${enabled ? `bg-white ${c.border} shadow-sm` : 'border-slate-200 bg-slate-100 opacity-70'
              }`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                {c.label}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`${c.label} available`}
                onClick={() => onChange({ [c.key]: enabled ? 0 : c.def })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? c.on : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Base price ($)</span>
              <input
                type="number"
                inputMode="numeric"
                value={data[c.key] || ''}
                onChange={(e) => onChange({ [c.key]: Number(e.target.value) })}
                disabled={!enabled}
                placeholder={c.ph}
                className={`${INPUT} ${c.focus}`}
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}

function Sheet({ title, eyebrow, icon: Icon, onClose, maxWidth = 'max-w-3xl', children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sl-backdrop absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`sl-sheet relative z-10 flex max-h-[94dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:rounded-[1.75rem]`}>
        <div className={`relative shrink-0 overflow-hidden ${NAVY} px-5 pb-4 pt-3 text-white sm:px-6 sm:pt-5`}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/30 sm:hidden" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              {eyebrow && <p className="text-xs font-semibold text-cyan-200">{eyebrow}</p>}
              <h3 className="mt-0.5 flex items-center gap-2 text-lg font-extrabold leading-tight sm:text-xl">
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

/* A small seat-load bar: how full the flight is, colour-coded */
function SeatLoad({ available, total }) {
  const t = Number(total) || 0;
  const a = Number(available) || 0;
  const filled = t > 0 ? Math.min(100, Math.max(0, Math.round(((t - a) / t) * 100))) : 0;
  const tone = filled >= 85 ? 'bg-red-500' : filled >= 60 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone} transition-all duration-500`} style={{ width: `${filled}%` }} />
      </div>
    </div>
  );
}

/* ============================== main view ============================== */

export default function ScheduleManagementView({ flights: propsFlights, onScheduleUpdated, airports: propsAirports, onAirportsUpdated }) {
  const [flights, setFlights] = useState(propsFlights || INITIAL_FLIGHTS);
  const [airports, setAirports] = useState(propsAirports || INITIAL_AIRPORTS);
  const [aircraftList, setAircraftList] = useState(INITIAL_AIRCRAFT);
  const [adminSubTab, setAdminSubTab] = useState('flights'); // 'flights' | 'aircraft' | 'airports'
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [conflictWarning, setConflictWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const conflictRef = useRef(null);

  // Load aircraft list from backend SQL DB
  const refreshAircraftFromSql = async () => {
    try {
      const data = await fetchAircraftApi();
      if (Array.isArray(data) && data.length > 0) {
        setAircraftList(data.map((a, idx) => ({
          id: a.aircraftId || a.id || idx + 1,
          aircraftId: a.aircraftId || a.id || idx + 1,
          model: a.model,
          tailNumber: a.tailNumber,
          economySeats: Number(a.economySeats) || 0,
          businessSeats: Number(a.businessSeats) || 0,
          firstClassSeats: Number(a.firstClassSeats ?? a.firstSeats) || 0,
          firstSeats: Number(a.firstClassSeats ?? a.firstSeats) || 0,
          status: a.status || 'ACTIVE'
        })));
      }
    } catch (err) {
      console.warn('[ScheduleManagementView] Aircraft fetch notice:', err.message);
    }
  };

  // Fetch all flights from backend SQL DB on mount
  const refreshFlightsFromSql = async () => {
    try {
      setLoading(true);
      const { fetchFlightsApi } = await import('../../api/apiService');
      const apiFlights = await fetchFlightsApi();
      if (apiFlights && Array.isArray(apiFlights) && apiFlights.length > 0) {
        const formatted = apiFlights.map(f => ({
          id: f.flightId ? `FL-${f.flightId}` : (f.id || `FL-${Date.now()}`),
          rawId: f.flightId,
          flightNumber: f.flightNumber || 'SL-000',
          origin: f.originCode || f.origin || 'CMB',
          destination: f.destinationCode || f.destination || 'SIN',
          originCity: f.originCity || f.origin || 'Colombo',
          destinationCity: f.destinationCity || f.destination || 'Singapore',
          departureTime: f.departureTime ? String(f.departureTime).slice(0, 16) : '2026-09-15T12:00',
          arrivalTime: f.arrivalTime ? String(f.arrivalTime).slice(0, 16) : '2026-09-15T18:00',
          duration: f.duration || '5h 30m',
          stops: f.stops ?? 0,
          aircraft: f.aircraftModel || f.aircraft || 'Boeing 787-9 Dreamliner',
          aircraftId: f.aircraftId || 1,
          tailNumber: f.tailNumber || '4R-SLA',
          priceEconomy: f.basePriceEconomy ?? f.priceEconomy ?? 450,
          priceBusiness: f.basePriceBusiness ?? f.priceBusiness ?? 1200,
          priceFirst: f.basePriceFirst ?? f.priceFirst ?? 2300,
          totalSeats: f.totalSeats ?? 60,
          availableSeats: f.availableSeats ?? 42,
          status: f.status || 'ON_TIME',
          hasLayover: f.hasLayover ?? (f.stops > 0),
          layoverAirport: f.layoverAirport || '',
          layoverCity: f.layoverCity || '',
          layoverDurationHours: f.layoverDurationHours ?? 0.0,
          image: f.image || PLANE_PHOTO_PRESETS[0].url
        }));
        setFlights(formatted);
        if (onScheduleUpdated) onScheduleUpdated(formatted);
      }
    } catch (err) {
      console.warn('[ScheduleManagementView] SQL fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFlightsFromSql();
    refreshAircraftFromSql();
  }, []);

  useEffect(() => {
    if (propsAirports) {
      setAirports(propsAirports);
    }
  }, [propsAirports]);

  // Sheets: lock page scroll and let Escape close the top-most one
  useEffect(() => {
    if (!(showAddModal || editingFlight || deleteTarget)) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (deleteTarget) setDeleteTarget(null);
      else if (editingFlight) setEditingFlight(null);
      else setShowAddModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [showAddModal, editingFlight, deleteTarget]);

  // Bring the conflict warning into view (the submit button sits far below it)
  useEffect(() => {
    if (conflictWarning && conflictRef.current) {
      conflictRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [conflictWarning]);

  const handleAirportsUpdate = (updatedAirports) => {
    setAirports(updatedAirports);
    onAirportsUpdated && onAirportsUpdated(updatedAirports);
  };

  // Form State for Adding New Flight (All 24 Database Attributes)
  const defaultAircraft = aircraftList[0] || INITIAL_AIRCRAFT[0];
  const initialSeats = getAircraftTotalSeats(defaultAircraft);

  const defaultNewFlightState = {
    flightNumber: 'SL-602',
    origin: 'CMB',
    originCity: 'Colombo',
    destination: 'JFK',
    destinationCity: 'New York',
    departureTime: '2026-09-15T12:00',
    arrivalTime: '2026-09-15T22:30',
    duration: '10h 30m',
    aircraftId: defaultAircraft?.aircraftId || defaultAircraft?.id || 1,
    aircraft: defaultAircraft?.model || 'Boeing 787-9 Dreamliner',
    tailNumber: defaultAircraft?.tailNumber || '4R-SLA',
    priceEconomy: 850,
    priceBusiness: 1950,
    priceFirst: 3600,
    totalSeats: initialSeats,
    availableSeats: initialSeats,
    status: 'ON_TIME',
    stops: 1,
    hasLayover: true,
    layoverAirport: 'DXB',
    layoverCity: 'Dubai',
    layoverDurationHours: 8.0,
    image: PLANE_PHOTO_PRESETS[0].url
  };

  const [newFlight, setNewFlight] = useState(defaultNewFlightState);
  
  // Auto-calculates flight duration whenever departureTime or arrivalTime is modified
  const patchNew = (patch) => setNewFlight((prev) => {
    const next = { ...prev, ...patch };
    if ('departureTime' in patch || 'arrivalTime' in patch) {
      const autoDur = calculateFlightDuration(next.departureTime, next.arrivalTime);
      if (autoDur) {
        next.duration = autoDur;
      }
    }
    return next;
  });

  // Auto-calculates flight duration whenever departureTime or arrivalTime is modified in edit modal
  const patchEdit = (patch) => setEditingFlight((prev) => {
    if (!prev) return prev;
    const next = { ...prev, ...patch };
    if ('departureTime' in patch || 'arrivalTime' in patch) {
      const autoDur = calculateFlightDuration(next.departureTime, next.arrivalTime);
      if (autoDur) {
        next.duration = autoDur;
      }
    }
    return next;
  });

  // Handler for selecting aircraft in Add Flight form: automatically populates model, tailNumber, and totalSeats from DB
  const handleSelectAircraftForNewFlight = (tailNumberOrModel) => {
    const found =
      aircraftList.find((a) => a.tailNumber === tailNumberOrModel) ||
      aircraftList.find((a) => a.model === tailNumberOrModel);
    if (found) {
      const seats = getAircraftTotalSeats(found);
      patchNew({
        tailNumber: found.tailNumber,
        aircraft: found.model,
        aircraftId: found.aircraftId || found.id || 1,
        totalSeats: seats,
        availableSeats: seats
      });
    }
  };

  // Handler for opening Add Flight modal with refreshed aircraft defaults
  const handleOpenAddFlightModal = () => {
    const ac = aircraftList[0] || INITIAL_AIRCRAFT[0];
    const seats = getAircraftTotalSeats(ac);
    const dep = '2026-09-15T12:00';
    const arr = '2026-09-15T22:30';
    setNewFlight({
      flightNumber: `SL-${Math.floor(600 + Math.random() * 300)}`,
      origin: airports[0]?.code || 'CMB',
      originCity: airports[0]?.city || 'Colombo',
      destination: airports[1]?.code || 'JFK',
      destinationCity: airports[1]?.city || 'New York',
      departureTime: dep,
      arrivalTime: arr,
      duration: calculateFlightDuration(dep, arr) || '10h 30m',
      aircraftId: ac?.aircraftId || ac?.id || 1,
      aircraft: ac?.model || 'Boeing 787-9 Dreamliner',
      tailNumber: ac?.tailNumber || '4R-SLA',
      priceEconomy: 850,
      priceBusiness: 1950,
      priceFirst: 3600,
      totalSeats: seats,
      availableSeats: seats,
      status: 'ON_TIME',
      stops: 1,
      hasLayover: true,
      layoverAirport: 'DXB',
      layoverCity: 'Dubai',
      layoverDurationHours: 8.0,
      image: PLANE_PHOTO_PRESETS[0].url
    });
    setConflictWarning('');
    setShowAddModal(true);
  };

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [layoverFilter, setLayoverFilter] = useState('ALL');
  const [sortField, setSortField] = useState('flightNumber');
  const [sortAsc, setSortAsc] = useState(true);

  // Submit Handler for Creating a New Flight in SQL DB
  const handleAddFlightSubmit = async (e) => {
    e.preventDefault();
    setConflictWarning('');

    // Strict Validations
    if (newFlight.origin === newFlight.destination) {
      setConflictWarning('Origin and Destination airports cannot be the same.');
      return;
    }

    if (new Date(newFlight.arrivalTime) <= new Date(newFlight.departureTime)) {
      setConflictWarning('Arrival time must be strictly after Departure time.');
      return;
    }

    if (Number(newFlight.totalSeats) < 6) {
      setConflictWarning('Total aircraft seats must be at least 6.');
      return;
    }

    if (Number(newFlight.availableSeats) > Number(newFlight.totalSeats)) {
      setConflictWarning('Available seats cannot exceed total aircraft seats.');
      return;
    }

    if (
      Number(newFlight.priceEconomy) <= 0 &&
      Number(newFlight.priceBusiness) <= 0 &&
      Number(newFlight.priceFirst) <= 0
    ) {
      setConflictWarning('At least one cabin class must have a valid positive fare.');
      return;
    }

    // Aircraft Conflict Check
    const existingAircraftAssignment = flights.find(
      (f) => f.tailNumber === newFlight.tailNumber && f.status !== 'CANCELLED'
    );

    if (existingAircraftAssignment) {
      setConflictWarning(
        `Aircraft conflict detected. Tail number ${newFlight.tailNumber} (${newFlight.aircraft}) is already assigned to flight ${existingAircraftAssignment.flightNumber} (${existingAircraftAssignment.origin} → ${existingAircraftAssignment.destination}).`
      );
      return;
    }

    const origAirport = airports.find(a => a.code === newFlight.origin);
    const destAirport = airports.find(a => a.code === newFlight.destination);
    const layoverAirportObj = airports.find(a => a.code === newFlight.layoverAirport);

    const calculatedDuration = calculateFlightDuration(newFlight.departureTime, newFlight.arrivalTime);

    const payload = {
      flightNumber: newFlight.flightNumber.toUpperCase(),
      originCode: newFlight.origin,
      destinationCode: newFlight.destination,
      originCity: origAirport?.city || newFlight.originCity || newFlight.origin,
      destinationCity: destAirport?.city || newFlight.destinationCity || newFlight.destination,
      departureTime: newFlight.departureTime.includes('T') ? newFlight.departureTime : `${newFlight.departureTime}T12:00:00`,
      arrivalTime: newFlight.arrivalTime.includes('T') ? newFlight.arrivalTime : `${newFlight.arrivalTime}T18:00:00`,
      duration: newFlight.duration || calculatedDuration || '6h 00m',
      stops: Number(newFlight.stops) || 0,
      hasLayover: Boolean(newFlight.hasLayover || newFlight.stops > 0),
      layoverAirport: newFlight.layoverAirport || '',
      layoverCity: layoverAirportObj?.city || newFlight.layoverCity || '',
      layoverDurationHours: Number(newFlight.layoverDurationHours) || 0.0,
      aircraftId: Number(newFlight.aircraftId) || 1,
      aircraftModel: newFlight.aircraft,
      tailNumber: newFlight.tailNumber,
      basePriceEconomy: Number(newFlight.priceEconomy) || 350,
      basePriceBusiness: Number(newFlight.priceBusiness) || 850,
      basePriceFirst: Number(newFlight.priceFirst) || 1500,
      totalSeats: Number(newFlight.totalSeats) || 60,
      availableSeats: Number(newFlight.availableSeats) || 45,
      status: newFlight.status || 'ON_TIME',
      image: newFlight.image || PLANE_PHOTO_PRESETS[0].url
    };

    try {
      const { createFlightApi } = await import('../../api/apiService');
      await createFlightApi(payload);
    } catch (err) {
      console.warn("Backend flight save fallback notice:", err.message);
    }

    await refreshFlightsFromSql();
    setShowAddModal(false);
    setNewFlight(defaultNewFlightState);
  };

  // Submit Handler for Updating an Existing Flight in SQL DB
  const handleEditFlightSubmit = async (e) => {
    e.preventDefault();
    if (!editingFlight) return;
    setConflictWarning('');

    if (new Date(editingFlight.arrivalTime) <= new Date(editingFlight.departureTime)) {
      alert('Arrival time must be strictly after Departure time.');
      return;
    }

    if (Number(editingFlight.availableSeats) > Number(editingFlight.totalSeats)) {
      alert('Available seats cannot exceed total aircraft seats.');
      return;
    }

    const calculatedDuration = calculateFlightDuration(editingFlight.departureTime, editingFlight.arrivalTime);

    const payload = {
      flightNumber: editingFlight.flightNumber,
      originCode: editingFlight.origin,
      destinationCode: editingFlight.destination,
      originCity: editingFlight.originCity,
      destinationCity: editingFlight.destinationCity,
      departureTime: editingFlight.departureTime,
      arrivalTime: editingFlight.arrivalTime,
      duration: editingFlight.duration || calculatedDuration || '6h 00m',
      stops: Number(editingFlight.stops) || 0,
      hasLayover: Boolean(editingFlight.hasLayover || editingFlight.stops > 0),
      layoverAirport: editingFlight.layoverAirport || '',
      layoverCity: editingFlight.layoverCity || '',
      layoverDurationHours: Number(editingFlight.layoverDurationHours) || 0.0,
      aircraftId: Number(editingFlight.aircraftId) || 1,
      aircraftModel: editingFlight.aircraft,
      tailNumber: editingFlight.tailNumber,
      basePriceEconomy: Number(editingFlight.priceEconomy),
      basePriceBusiness: Number(editingFlight.priceBusiness),
      basePriceFirst: Number(editingFlight.priceFirst),
      totalSeats: Number(editingFlight.totalSeats),
      availableSeats: Number(editingFlight.availableSeats),
      status: editingFlight.status,
      image: editingFlight.image
    };

    if (editingFlight.rawId) {
      try {
        const { updateFlightApi } = await import('../../api/apiService');
        await updateFlightApi(editingFlight.rawId, payload);
      } catch (err) {
        console.warn("Backend flight update notice:", err.message);
      }
    }

    await refreshFlightsFromSql();
    setEditingFlight(null);
  };

  // Handler for Deleting a Flight from SQL DB (confirmation is now an in-app dialog)
  const handleDeleteFlight = async (flightId) => {
    const flightToDelete = flights.find(f => f.id === flightId);
    const rawId = flightToDelete?.rawId || (typeof flightId === 'number' ? flightId : parseInt(String(flightId).replace(/\D/g, '')));

    if (rawId) {
      try {
        const { deleteFlightApi } = await import('../../api/apiService');
        await deleteFlightApi(rawId);
      } catch (err) {
        console.warn("Backend flight delete notice:", err.message);
      }
    }

    await refreshFlightsFromSql();
  };

  // Handler for Quick Status Badge Update in SQL DB
  const handleUpdateStatus = async (flightId, newStatus) => {
    const target = flights.find(f => f.id === flightId);
    if (target && target.rawId) {
      try {
        const { updateFlightApi } = await import('../../api/apiService');
        await updateFlightApi(target.rawId, { status: newStatus });
      } catch (err) {
        console.warn("Backend status update notice:", err.message);
      }
    }
    setFlights(prev => prev.map(f => f.id === flightId ? { ...f, status: newStatus } : f));
  };

  const filteredFlights = React.useMemo(() => {
    let result = flights.filter(f => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (f.flightNumber || '').toLowerCase().includes(q) ||
        (f.origin || '').toLowerCase().includes(q) ||
        (f.destination || '').toLowerCase().includes(q) ||
        (f.originCity || '').toLowerCase().includes(q) ||
        (f.destinationCity || '').toLowerCase().includes(q) ||
        (f.aircraft || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
      const matchesLayover =
        layoverFilter === 'ALL' ||
        (layoverFilter === 'DIRECT' && !f.hasLayover && f.stops === 0) ||
        (layoverFilter === 'LAYOVER' && (f.hasLayover || f.stops > 0));

      return matchesSearch && matchesStatus && matchesLayover;
    });

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [flights, searchTerm, statusFilter, layoverFilter, sortField, sortAsc]);

  const onTimeCount = flights.filter(f => f.status === 'ON_TIME').length;

  const stopsLabel = (f) => (f.stops === 0 ? 'Direct' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap');`}</style>
      <style>{`
        .sv-display { font-family: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.01em }

        @keyframes sl-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sl-up { from { transform: translateY(100%) } to { transform: none } }
        @keyframes sl-zoom { from { opacity: 0; transform: scale(.96) translateY(8px) } to { opacity: 1; transform: none } }
        @keyframes sl-rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
        @keyframes sl-drift { from { transform: translate3d(0,0,0) scale(1) } to { transform: translate3d(24px,-16px,0) scale(1.1) } }
        .sl-backdrop { animation: sl-fade .25s ease both }
        .sl-sheet { animation: sl-up .32s cubic-bezier(.2,.8,.2,1) both }
        .sl-card-in { animation: sl-rise .5s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--sd, 0ms) }
        .sl-drift { animation: sl-drift 13s ease-in-out infinite alternate }
        .sl-drift-slow { animation: sl-drift 17s ease-in-out infinite alternate-reverse }
        @media (min-width: 640px) { .sl-sheet { animation-name: sl-zoom; animation-duration: .25s } }
        @media (prefers-reduced-motion: reduce) { .sl-backdrop, .sl-sheet, .sl-card-in, .sl-drift, .sl-drift-slow { animation: none } }
      `}</style>

      {/* ================= Sub-navigation ================= */}
      <div role="tablist" className="grid w-full grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1 text-xs font-bold sm:inline-grid sm:w-auto">
        <button
          role="tab"
          aria-selected={adminSubTab === 'flights'}
          onClick={() => setAdminSubTab('flights')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 transition-all sm:px-5 ${adminSubTab === 'flights'
              ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <Plane className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <span className="hidden sm:inline">Flight schedules</span>
            <span className="sm:hidden">Flights</span> ({flights.length})
          </span>
        </button>

        <button
          role="tab"
          aria-selected={adminSubTab === 'aircraft'}
          onClick={() => setAdminSubTab('aircraft')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 transition-all sm:px-5 ${adminSubTab === 'aircraft'
              ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <Gauge className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <span className="hidden sm:inline">Aircraft fleet</span>
            <span className="sm:hidden">Fleet</span> ({aircraftList.length})
          </span>
        </button>

        <button
          role="tab"
          aria-selected={adminSubTab === 'airports'}
          onClick={() => setAdminSubTab('airports')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 transition-all sm:px-5 ${adminSubTab === 'airports'
              ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <span className="hidden sm:inline">Airport hubs</span>
            <span className="sm:hidden">Airports</span> ({airports.length})
          </span>
        </button>
      </div>

      {adminSubTab === 'airports' ? (
        <AirportManagementView airports={airports} onAirportsUpdated={handleAirportsUpdate} />
      ) : adminSubTab === 'aircraft' ? (
        <AircraftManagementView
          aircraft={aircraftList}
          onAircraftUpdated={(updatedList) => setAircraftList(updatedList)}
        />
      ) : (
        <>
          {/* ================= Hero ================= */}
          <div className={`relative overflow-hidden rounded-[2rem] ${NAVY} p-5 text-white shadow-2xl shadow-blue-900/20 sm:p-8 md:p-10`}>
            <div className="sl-drift pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="sl-drift-slow pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
              viewBox="0 0 800 260"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M-20 230 C 220 20, 520 20, 820 200" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 8" />
            </svg>

            <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Live SQL database flight control
                </div>
                <h2 className="sv-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">Flight schedule and fleet control</h2>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
                  Add, update, or cancel flight schedules stored in the SQL database. Changes show up in passenger searches right away.
                </p>
              </div>

              <button
                onClick={handleOpenAddFlightModal}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-extrabold text-[#0a1230] shadow-xl shadow-black/20 transition hover:bg-blue-50 active:scale-[0.98] md:w-auto"
              >
                <Plus className="h-4 w-4 text-blue-600" />
                Add new flight route
              </button>
            </div>
          </div>

          {/* ================= Search & stats ================= */}
          <div className={`${CARD} flex flex-col gap-3 p-4`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  aria-label="Search flights"
                  placeholder="Search flight number, origin, destination, city or aircraft..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-700 ring-1 ring-inset ring-blue-200">
                  Total: {flights.length}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  Active: {onTimeCount}
                </span>
                <button
                  onClick={refreshFlightsFromSql}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>

                {/* View Mode Toggle (Table / Grid) */}
                <div className="relative ml-1 flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0.5 left-0.5 w-8 rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out"
                    style={{ transform: viewMode === 'cards' ? 'translateX(2rem)' : 'translateX(0)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    title="Table List View"
                    aria-label="Table List View"
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      viewMode === 'table' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    title="Grid Cards View"
                    aria-label="Grid Cards View"
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      viewMode === 'cards' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
              <div className="-mx-1 flex flex-wrap items-center gap-1.5 px-1">
                <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Status:</span>
                {['ALL', 'ON_TIME', 'DELAYED', 'BOARDING', 'DEPARTED', 'CANCELLED'].map((st) => {
                  const active = statusFilter === st;
                  const count = st === 'ALL' ? flights.length : flights.filter(f => f.status === st).length;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all ${
                        active
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{st.replace('_', ' ')}</span>
                      <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Route:</span>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'DIRECT', label: 'Direct only' },
                  { id: 'LAYOVER', label: 'Layovers' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLayoverFilter(item.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      layoverFilter === item.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ================= Empty state ================= */}
          {filteredFlights.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Plane className="h-7 w-7 rotate-45 text-slate-300" />
              </span>
              <h3 className="text-lg font-bold text-slate-800">
                {searchTerm || statusFilter !== 'ALL' || layoverFilter !== 'ALL' ? 'No flights match your filters' : 'No flights scheduled yet'}
              </h3>
              <p className="max-w-sm text-sm text-slate-500">
                {searchTerm || statusFilter !== 'ALL' || layoverFilter !== 'ALL' ? 'Try adjusting your search keywords, status filter, or route filter.' : 'Add your first route to start selling seats.'}
              </p>
              {searchTerm || statusFilter !== 'ALL' || layoverFilter !== 'ALL' ? (
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setLayoverFilter('ALL'); }}
                  className={`mt-1 rounded-xl px-5 py-2.5 text-sm font-bold ${PRIMARY_BTN}`}
                >
                  Reset all filters
                </button>
              ) : (
                <button onClick={handleOpenAddFlightModal} className={`mt-1 rounded-xl px-5 py-2.5 text-sm font-bold ${PRIMARY_BTN}`}>
                  Add new flight route
                </button>
              )}
            </div>
          )}

          {/* ================= 1. Table List View ================= */}
          {filteredFlights.length > 0 && viewMode === 'table' && (
            <div className={`${CARD} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      <th
                        className="cursor-pointer select-none px-5 py-4 transition hover:text-blue-600"
                        onClick={() => {
                          if (sortField === 'flightNumber') setSortAsc(!sortAsc);
                          else { setSortField('flightNumber'); setSortAsc(true); }
                        }}
                      >
                        Flight / plane {sortField === 'flightNumber' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th className="px-4 py-4">Route</th>
                      <th
                        className="cursor-pointer select-none px-4 py-4 transition hover:text-blue-600"
                        onClick={() => {
                          if (sortField === 'departureTime') setSortAsc(!sortAsc);
                          else { setSortField('departureTime'); setSortAsc(true); }
                        }}
                      >
                        Schedule {sortField === 'departureTime' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th className="px-4 py-4">Aircraft / tail</th>
                      <th
                        className="cursor-pointer select-none px-4 py-4 transition hover:text-blue-600"
                        onClick={() => {
                          if (sortField === 'availableSeats') setSortAsc(!sortAsc);
                          else { setSortField('availableSeats'); setSortAsc(false); }
                        }}
                      >
                        Seats {sortField === 'availableSeats' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th
                        className="cursor-pointer select-none px-4 py-4 transition hover:text-blue-600"
                        onClick={() => {
                          if (sortField === 'priceEconomy') setSortAsc(!sortAsc);
                          else { setSortField('priceEconomy'); setSortAsc(true); }
                        }}
                      >
                        Fares (E / B / F) {sortField === 'priceEconomy' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredFlights.map((flight) => (
                      <tr key={flight.id} className="group transition-colors hover:bg-blue-50/40">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={flight.image || PLANE_PHOTO_PRESETS[0].url}
                              alt={flight.flightNumber}
                              loading="lazy"
                              className="h-10 w-12 shrink-0 rounded-xl border border-slate-200 object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
                            />
                            <div>
                              <span className="block text-sm font-black text-blue-700">{flight.flightNumber}</span>
                              <span className="text-[11px] font-medium text-slate-400">{flight.duration} | {stopsLabel(flight)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                            {flight.origin}
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                            {flight.destination}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500">{flight.originCity} to {flight.destinationCity}</div>
                          {flight.hasLayover && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                              <Hotel className="h-3 w-3" /> {flight.layoverCity} ({flight.layoverDurationHours}h)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-[11px] text-slate-600">
                          <div><span className="text-slate-400">Dep </span><span className="font-semibold">{fmtDateTime(flight.departureTime)}</span></div>
                          <div className="mt-0.5"><span className="text-slate-400">Arr </span><span className="font-semibold">{fmtDateTime(flight.arrivalTime)}</span></div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900">{flight.aircraft}</div>
                          <span className="mt-0.5 inline-block rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                            {flight.tailNumber}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-bold tabular-nums text-slate-900">{flight.availableSeats} / {flight.totalSeats}</div>
                          <div className="mt-1.5 w-20"><SeatLoad available={flight.availableSeats} total={flight.totalSeats} /></div>
                        </td>

                        <td className="px-4 py-4 font-bold tabular-nums">
                          <div className="text-blue-700">${flight.priceEconomy} <span className="text-[11px] font-normal text-slate-400">Eco</span></div>
                          <div className="text-[11px] text-indigo-700">${flight.priceBusiness} <span className="font-normal text-slate-400">Biz</span></div>
                          <div className="text-[11px] text-amber-700">${flight.priceFirst} <span className="font-normal text-slate-400">First</span></div>
                        </td>

                        <td className="px-4 py-4">
                          <StatusSelect value={flight.status} onChange={(e) => handleUpdateStatus(flight.id, e.target.value)} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => setEditingFlight({ ...flight })}
                              className="rounded-xl p-2.5 text-blue-600 transition-colors hover:bg-blue-50"
                              title="Edit flight"
                              aria-label={`Edit flight ${flight.flightNumber}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: flight.id, flightNumber: flight.flightNumber })}
                              className="rounded-xl p-2.5 text-red-600 transition-colors hover:bg-red-50"
                              title="Delete flight"
                              aria-label={`Delete flight ${flight.flightNumber}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 2. Grid Cards View ================= */}
          {filteredFlights.length > 0 && viewMode === 'cards' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredFlights.map((flight, idx) => (
                <div
                  key={flight.id}
                  style={{ '--sd': `${(idx % 9) * 55}ms` }}
                  className={`sl-card-in group flex flex-col overflow-hidden ${CARD} transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgb(15,30,92,0.14)]`}
                >
                  {/* Photo banner, same visual language as the passenger-facing destination cards */}
                  <div className="relative h-40 shrink-0 overflow-hidden bg-slate-900">
                    <img
                      src={flight.image || PLANE_PHOTO_PRESETS[0].url}
                      alt={flight.aircraft}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070d24]/90 via-[#070d24]/10 to-transparent" />

                    <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                      <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        {flight.flightNumber}
                      </span>
                      <StatusSelect value={flight.status} onChange={(e) => handleUpdateStatus(flight.id, e.target.value)} solid />
                    </div>

                    <div className="absolute inset-x-3 bottom-3 text-white">
                      <div className="flex items-center gap-2 text-xl font-black tracking-tight">
                        {flight.origin}
                        <ArrowRight className="h-4 w-4 text-sky-300" />
                        {flight.destination}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-medium text-slate-200">
                        {flight.originCity} to {flight.destinationCity}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    {/* Duration / stops / layover */}
                    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" /> {flight.duration}</span>
                      <span className="flex items-center gap-1"><Gauge className="h-3 w-3 text-blue-500" /> {stopsLabel(flight)}</span>
                      {flight.hasLayover && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
                          <Hotel className="h-3 w-3" /> {flight.layoverCity} ({flight.layoverDurationHours}h)
                        </span>
                      )}
                    </div>

                    {/* Schedule timestamps */}
                    <div className="mb-3 grid grid-cols-2 gap-2.5 text-xs">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Departs</span>
                        <span className="mt-0.5 block font-bold text-slate-800">{fmtTime(flight.departureTime)}</span>
                        <span className="text-[10px] text-slate-400">{fmtDay(flight.departureTime)}</span>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Arrives</span>
                        <span className="mt-0.5 block font-bold text-slate-800">{fmtTime(flight.arrivalTime)}</span>
                        <span className="text-[10px] text-slate-400">{fmtDay(flight.arrivalTime)}</span>
                      </div>
                    </div>

                    {/* Aircraft + seat load */}
                    <div className="mb-3.5 flex items-center justify-between gap-3 border-y border-slate-100 py-2.5 text-xs">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-800">{flight.aircraft}</div>
                        <span className="font-mono text-[11px] text-slate-400">{flight.tailNumber}</span>
                      </div>
                      <div className="w-24 shrink-0 text-right">
                        <div className="flex items-center justify-end gap-1 font-bold tabular-nums text-slate-900">
                          <Users className="h-3 w-3 text-slate-400" /> {flight.availableSeats}/{flight.totalSeats}
                        </div>
                        <div className="mt-1"><SeatLoad available={flight.availableSeats} total={flight.totalSeats} /></div>
                      </div>
                    </div>

                    {/* Pricing tiers */}
                    <div className="mt-auto grid grid-cols-3 gap-2 text-center text-xs font-bold tabular-nums">
                      <div className="rounded-xl border border-blue-100 bg-blue-50/80 py-2 text-blue-700">
                        ${flight.priceEconomy}
                        <span className="block text-[10px] font-medium text-blue-500">Economy</span>
                      </div>
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 py-2 text-indigo-700">
                        ${flight.priceBusiness}
                        <span className="block text-[10px] font-medium text-indigo-500">Business</span>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 py-2 text-amber-700">
                        ${flight.priceFirst}
                        <span className="block text-[10px] font-medium text-amber-600">First</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3.5">
                      <button
                        onClick={() => setEditingFlight({ ...flight })}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-[0.98]"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: flight.id, flightNumber: flight.flightNumber })}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= Add flight ================= */}
      {showAddModal && (
        <Sheet
          eyebrow= "scheduler"
          title="Add and schedule a new flight route"
          icon={Plus}
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={handleAddFlightSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              {conflictWarning && (
                <div ref={conflictRef} role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold leading-relaxed text-red-900">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <p>{conflictWarning}</p>
                </div>
              )}

              <FormSection icon={Plane} title="1. Flight and fleet details" aside="Selecting an aircraft auto-calculates total seat capacity">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Flight number *">
                    <input type="text" value={newFlight.flightNumber} onChange={(e) => patchNew({ flightNumber: e.target.value })} className={INPUT} placeholder="e.g. SL-602" required />
                  </Field>
                  <Field label="Aircraft model *">
                    <select
                      value={newFlight.tailNumber}
                      onChange={(e) => handleSelectAircraftForNewFlight(e.target.value)}
                      className={INPUT}
                      required
                    >
                      {aircraftList.map((a) => (
                        <option key={a.tailNumber || a.aircraftId || a.id} value={a.tailNumber}>
                          {a.model} ({getAircraftTotalSeats(a)} seats)
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Aircraft tail number *">
                    <select
                      value={newFlight.tailNumber}
                      onChange={(e) => handleSelectAircraftForNewFlight(e.target.value)}
                      className={INPUT}
                      required
                    >
                      {aircraftList.map((a) => (
                        <option key={a.tailNumber || a.aircraftId || a.id} value={a.tailNumber}>
                          {a.tailNumber} - {a.model}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={MapPin} title="2. Route and cities">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Origin airport and city *">
                    <select
                      value={newFlight.origin}
                      onChange={(e) => {
                        const found = airports.find(a => a.code === e.target.value);
                        patchNew({ origin: e.target.value, originCity: found?.city || e.target.value });
                      }}
                      className={INPUT}
                    >
                      {airports.map(a => (
                        <option key={a.code} value={a.code}>{a.city} ({a.code}) - {a.country}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Destination airport and city *">
                    <select
                      value={newFlight.destination}
                      onChange={(e) => {
                        const found = airports.find(a => a.code === e.target.value);
                        patchNew({ destination: e.target.value, destinationCity: found?.city || e.target.value });
                      }}
                      className={INPUT}
                    >
                      {airports.map(a => (
                        <option key={a.code} value={a.code}>{a.city} ({a.code}) - {a.country}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={Clock} title="3. Schedule timings and duration">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Departure time *">
                    <input
                      type="datetime-local"
                      value={newFlight.departureTime}
                      onChange={(e) => patchNew({ departureTime: e.target.value })}
                      className={INPUT}
                      required
                    />
                  </Field>
                  <Field label="Arrival time *">
                    <input
                      type="datetime-local"
                      value={newFlight.arrivalTime}
                      onChange={(e) => patchNew({ arrivalTime: e.target.value })}
                      className={INPUT}
                      required
                    />
                  </Field>
                  <Field label="Flight duration">
                    <div className="relative">
                      <input
                        type="text"
                        value={newFlight.duration}
                        onChange={(e) => patchNew({ duration: e.target.value })}
                        placeholder="e.g. 4h 30m"
                        className={`${INPUT} pr-14`}
                      />
                      {newFlight.duration && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200/60 shadow-xs">
                          Auto
                        </span>
                      )}
                    </div>
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={DollarSign} title="4. Seats and cabin class fares" aside={`Auto-synced: ${newFlight.totalSeats} seats from DB`}>
                <div className="mb-2 flex items-center justify-between rounded-xl bg-blue-50/80 px-3.5 py-2 text-xs font-bold text-blue-900 border border-blue-200/80">
                  <span className="flex items-center gap-1.5">
                    <Armchair className="h-4 w-4 text-blue-600" />
                    Database Aircraft Seat Count: {newFlight.aircraft} ({newFlight.tailNumber})
                  </span>
                  <span className="rounded-md bg-blue-600 text-white px-2 py-0.5 text-[11px] font-extrabold shadow-sm">
                    {newFlight.totalSeats} Total Seats
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 border-b border-slate-200/70 pb-3 sm:grid-cols-2">
                  <Field label="Total aircraft seats *">
                    <input type="number" inputMode="numeric" value={newFlight.totalSeats} onChange={(e) => patchNew({ totalSeats: Number(e.target.value) })} className={INPUT} min={6} required />
                  </Field>
                  <Field label="Available seats remaining *">
                    <input type="number" inputMode="numeric" value={newFlight.availableSeats} onChange={(e) => patchNew({ availableSeats: Number(e.target.value) })} className={INPUT} min={0} required />
                  </Field>
                </div>
                <CabinPricingFields data={newFlight} onChange={patchNew} />
              </FormSection>

              <FormSection icon={Hotel} title="5. Stops, layover perks and status">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Flight status">
                    <select value={newFlight.status} onChange={(e) => patchNew({ status: e.target.value })} className={INPUT}>
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Stops count">
                    <select
                      value={newFlight.stops}
                      onChange={(e) => {
                        const count = Number(e.target.value);
                        patchNew({ stops: count, hasLayover: count > 0 });
                      }}
                      className={INPUT}
                    >
                      <option value={0}>0 (non-stop)</option>
                      <option value={1}>1 stop (layover)</option>
                      <option value={2}>2+ stops</option>
                    </select>
                  </Field>
                  <Field label="Layover airport">
                    <input type="text" value={newFlight.layoverAirport} onChange={(e) => patchNew({ layoverAirport: e.target.value.toUpperCase() })} placeholder="e.g. DXB" className={`${INPUT} uppercase`} />
                  </Field>
                  <Field label="Layover duration (hours)">
                    <input type="number" inputMode="decimal" step="0.5" value={newFlight.layoverDurationHours} onChange={(e) => patchNew({ layoverDurationHours: Number(e.target.value) })} placeholder="e.g. 8.5" className={INPUT} />
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={ImageIcon} title="6. Plane photo">
                <div className="flex items-center gap-3">
                  {newFlight.image ? (
                    <img src={newFlight.image} alt="Preview" className="h-12 w-16 shrink-0 rounded-xl border border-slate-300 object-cover shadow-sm" />
                  ) : (
                    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-[11px] font-bold text-slate-500">No photo</div>
                  )}
                  <input
                    type="text"
                    value={newFlight.image}
                    onChange={(e) => patchNew({ image: e.target.value })}
                    placeholder="Enter plane image URL"
                    aria-label="Plane image URL"
                    className={`${INPUT} min-w-0 flex-1`}
                  />
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-400">Or pick a preset</span>
                  <div className="flex flex-wrap gap-2">
                    {PLANE_PHOTO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => patchNew({ image: preset.url })}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all ${newFlight.image === preset.url
                            ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </FormSection>
            </div>

            <SheetFooter onCancel={() => setShowAddModal(false)} submitLabel="Save and publish" />
          </form>
        </Sheet>
      )}

      {/* ================= Edit flight ================= */}
      {editingFlight && (
        <Sheet
          eyebrow={`${editingFlight.origin} to ${editingFlight.destination}`}
          title={`Update flight ${editingFlight.flightNumber}`}
          icon={Edit3}
          onClose={() => setEditingFlight(null)}
        >
          <form onSubmit={handleEditFlightSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              <FormSection icon={Plane} title="Flight identifier and status" aside="Changing aircraft auto-syncs seat capacity">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Flight number">
                    <input type="text" value={editingFlight.flightNumber} onChange={(e) => patchEdit({ flightNumber: e.target.value })} className={INPUT} required />
                  </Field>
                  <Field label="Flight status">
                    <select value={editingFlight.status} onChange={(e) => patchEdit({ status: e.target.value })} className={INPUT}>
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Aircraft (Fleet model & tail number)">
                    <select
                      value={editingFlight.tailNumber || editingFlight.aircraft}
                      onChange={(e) => {
                        const found =
                          aircraftList.find((a) => a.tailNumber === e.target.value) ||
                          aircraftList.find((a) => a.model === e.target.value);
                        if (found) {
                          const seats = getAircraftTotalSeats(found);
                          patchEdit({
                            aircraft: found.model,
                            tailNumber: found.tailNumber,
                            aircraftId: found.aircraftId || found.id || 1,
                            totalSeats: seats,
                            availableSeats: Math.min(editingFlight.availableSeats || seats, seats)
                          });
                        }
                      }}
                      className={INPUT}
                    >
                      {aircraftList.map((a) => (
                        <option key={a.tailNumber || a.aircraftId || a.id} value={a.tailNumber}>
                          {a.model} ({a.tailNumber}) - {getAircraftTotalSeats(a)} seats
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={Clock} title="Timings and duration">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Departure time">
                    <input
                      type="datetime-local"
                      value={editingFlight.departureTime}
                      onChange={(e) => patchEdit({ departureTime: e.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Arrival time">
                    <input
                      type="datetime-local"
                      value={editingFlight.arrivalTime}
                      onChange={(e) => patchEdit({ arrivalTime: e.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Duration">
                    <div className="relative">
                      <input
                        type="text"
                        value={editingFlight.duration}
                        onChange={(e) => patchEdit({ duration: e.target.value })}
                        placeholder="e.g. 4h 30m"
                        className={`${INPUT} pr-14`}
                      />
                      {editingFlight.duration && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-200/60 shadow-xs">
                          Auto
                        </span>
                      )}
                    </div>
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={DollarSign} title="Seats and cabin class pricing" aside={`Auto-synced: ${editingFlight.totalSeats} seats from DB`}>
                <div className="mb-2 flex items-center justify-between rounded-xl bg-blue-50/80 px-3.5 py-2 text-xs font-bold text-blue-900 border border-blue-200/80">
                  <span className="flex items-center gap-1.5">
                    <Armchair className="h-4 w-4 text-blue-600" />
                    Fleet Model Capacity: {editingFlight.aircraft} ({editingFlight.tailNumber || 'N/A'})
                  </span>
                  <span className="rounded-md bg-blue-600 text-white px-2 py-0.5 text-[11px] font-extrabold shadow-sm">
                    {editingFlight.totalSeats} Total Seats
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 border-b border-slate-200/70 pb-3 sm:grid-cols-2">
                  <Field label="Total aircraft seats">
                    <input type="number" inputMode="numeric" value={editingFlight.totalSeats} onChange={(e) => patchEdit({ totalSeats: Number(e.target.value) })} className={INPUT} />
                  </Field>
                  <Field label="Available seats remaining">
                    <input type="number" inputMode="numeric" value={editingFlight.availableSeats} onChange={(e) => patchEdit({ availableSeats: Number(e.target.value) })} className={INPUT} />
                  </Field>
                </div>
                <CabinPricingFields data={editingFlight} onChange={patchEdit} />
              </FormSection>
            </div>

            <SheetFooter onCancel={() => setEditingFlight(null)} submitLabel="Update flight" />
          </form>
        </Sheet>
      )}

      {/* ================= Delete confirmation ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="alertdialog" aria-modal="true" aria-label="Confirm delete">
          <div className="sl-backdrop absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="sl-sheet relative z-10 w-full max-w-md space-y-5 rounded-t-[1.75rem] bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center shadow-2xl sm:rounded-[1.75rem]">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 className="h-7 w-7" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Delete flight {deleteTarget.flightNumber}?</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                This removes the flight from the SQL database. This action cannot be undone.
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
                  await handleDeleteFlight(target.id);
                }}
                className="rounded-xl bg-gradient-to-b from-red-500 to-red-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-red-600/30 transition hover:from-red-500 hover:to-red-700 active:scale-[0.98]"
              >
                Delete flight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}