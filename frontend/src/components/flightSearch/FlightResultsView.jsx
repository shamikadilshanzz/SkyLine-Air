import React, { useMemo, useState } from 'react';
import {
  Filter,
  Plane,
  ShieldCheck,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  Check,
  Pencil
} from 'lucide-react';
import { INITIAL_FLIGHTS, INITIAL_AIRPORTS } from '../../data/mockData';
import FlightDetailsModal from './FlightDetailsModal';
import FlightCardItem from './FlightCardItem';

const TRIP_LABELS = { roundtrip: 'Round trip', oneway: 'One way', multicity: 'Multi city' };

const STOP_OPTIONS = [
  { id: 'ALL', label: 'All flights' },
  { id: 'DIRECT', label: 'Non-stop only' },
  { id: 'LAYOVER', label: 'With layover' }
];

// "4h 30m" -> 270
const parseDuration = (d = '') => {
  const h = /(\d+)\s*h/.exec(d);
  const m = /(\d+)\s*m/.exec(d);
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
};

const formatDate = (value) => {
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export default function FlightResultsView({ flights = INITIAL_FLIGHTS, searchCriteria, onSelectFlight, onModifySearch }) {
  const [maxPrice, setMaxPrice] = useState(5000);
  const [stopsFilter, setStopsFilter] = useState('ALL'); // 'ALL', 'DIRECT', 'LAYOVER'
  const [sortBy, setSortBy] = useState('PRICE'); // 'PRICE', 'DURATION', 'DEPARTURE'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [selectedFlightForDetails, setSelectedFlightForDetails] = useState(null);
  const [showFilters, setShowFilters] = useState(false); // mobile only

  const getPrice = (f) => {
    if (searchCriteria?.cabinClass === 'BUSINESS') return f.priceBusiness;
    if (searchCriteria?.cabinClass === 'FIRST') return f.priceFirst;
    return f.priceEconomy;
  };

  const filteredFlights = useMemo(() => {
    const list = (flights || INITIAL_FLIGHTS).filter((flight) => {
      if (searchCriteria?.origin && flight.origin !== searchCriteria.origin) return false;
      if (searchCriteria?.destination && flight.destination !== searchCriteria.destination) return false;
      if (getPrice(flight) > maxPrice) return false;
      if (stopsFilter === 'DIRECT' && flight.stops > 0) return false;
      if (stopsFilter === 'LAYOVER' && flight.stops === 0) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'PRICE') return getPrice(a) - getPrice(b);
      if (sortBy === 'DEPARTURE') return new Date(a.departureTime) - new Date(b.departureTime);
      return parseDuration(a.duration) - parseDuration(b.duration);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flights, searchCriteria, maxPrice, stopsFilter, sortBy]);

  const activeFilterCount = (maxPrice < 5000 ? 1 : 0) + (stopsFilter !== 'ALL' ? 1 : 0);
  const resetFilters = () => {
    setMaxPrice(5000);
    setStopsFilter('ALL');
  };

  const originCode = searchCriteria?.origin || 'CMB';
  const destCode = searchCriteria?.destination || 'SIN';
  const originAirport = INITIAL_AIRPORTS.find((a) => a.code === originCode);
  const destAirport = INITIAL_AIRPORTS.find((a) => a.code === destCode);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      {/* ======================= SEARCH SUMMARY ======================= */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8] p-5 text-white shadow-2xl shadow-blue-900/20 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-cyan-100 backdrop-blur">
                {TRIP_LABELS[searchCriteria?.tripType] || 'Round trip'}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 capitalize text-cyan-100 backdrop-blur">
                {String(searchCriteria?.cabinClass || 'ECONOMY').toLowerCase()}
              </span>
            </div>

            {/* Route */}
            <div className="mt-4 flex items-center gap-3 sm:gap-5">
              <div className="min-w-0">
                <div className="text-4xl font-black tracking-tight sm:text-5xl">{originCode}</div>
                <div className="truncate text-xs text-blue-200/80">{originAirport?.city || 'Origin'}</div>
              </div>
              <div className="relative w-16 shrink-0 sm:w-28">
                <div className="border-t-2 border-dashed border-white/30" />
                <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-blue-600 shadow-lg">
                  <Plane className="h-4 w-4 rotate-45" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-4xl font-black tracking-tight sm:text-5xl">{destCode}</div>
                <div className="truncate text-xs text-blue-200/80">{destAirport?.city || 'Destination'}</div>
              </div>
            </div>

            <p className="mt-4 text-sm text-blue-100/80">
              {formatDate(searchCriteria?.departDate || '2026-09-10')}
              <span className="mx-2 text-white/30">|</span>
              {searchCriteria?.passengers || 1} {(searchCriteria?.passengers || 1) === 1 ? 'passenger' : 'passengers'}
            </p>
          </div>

          <button
            onClick={onModifySearch}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/20 active:scale-[0.98] md:w-auto"
          >
            <Pencil className="h-4 w-4" />
            Modify search
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ======================= FILTERS ======================= */}
        <aside className="lg:col-span-3">
          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm lg:hidden"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-blue-600" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">{activeFilterCount}</span>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className={`${showFilters ? 'block' : 'hidden'} mt-3 lg:sticky lg:top-24 lg:mt-0 lg:block`}>
            <div className="space-y-6 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(15,30,92,0.06)]">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Filter className="h-4 w-4" />
                  </span>
                  Filter flights
                </h3>
                <button onClick={resetFilters} className="text-xs font-semibold text-blue-600 hover:underline">
                  Reset
                </button>
              </div>

              {/* Price */}
              <div>
                <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Max ticket price</span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-600 tabular-nums">${maxPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={5000}
                  step={100}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  aria-label="Max ticket price"
                  className="h-2 w-full cursor-pointer accent-blue-600"
                />
                <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                  <span>$200</span>
                  <span>$5,000</span>
                </div>
              </div>

              {/* Stops */}
              <div>
                <div className="mb-2 text-xs font-bold text-slate-700">Stops</div>
                <div className="space-y-2" role="radiogroup" aria-label="Stops">
                  {STOP_OPTIONS.map((o) => {
                    const active = stopsFilter === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setStopsFilter(o.id)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left text-xs font-semibold transition ${active
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {o.label}
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? 'bg-blue-600 text-white' : 'border border-slate-300'
                            }`}
                        >
                          {active && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ======================= RESULTS ======================= */}
        <div className="space-y-4 lg:col-span-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">
                {filteredFlights.length} {filteredFlights.length === 1 ? 'flight' : 'flights'} available
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <ShieldCheck className="h-3.5 w-3.5" /> Live seats held temporarily
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tabular Matrix
                </button>
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <ArrowUpDown className="h-4 w-4 shrink-0 text-blue-600" />
                <span className="text-xs font-semibold text-slate-500">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="min-w-0 flex-1 cursor-pointer bg-transparent text-xs font-bold text-slate-900 outline-none"
                >
                  <option value="PRICE">Cheapest first</option>
                  <option value="DEPARTURE">Earliest departure</option>
                  <option value="DURATION">Shortest duration</option>
                </select>
              </label>
            </div>
          </div>

          {filteredFlights.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Plane className="h-7 w-7 text-slate-300 rotate-45" />
              </span>
              <h3 className="text-lg font-bold text-slate-800">No matching flights</h3>
              <p className="max-w-sm text-sm text-slate-500">
                Raise the price limit, allow layovers, or modify your search to see flights on nearby dates.
              </p>
              <button
                onClick={resetFilters}
                className="mt-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.98]"
              >
                Reset filters
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            filteredFlights.map((flight) => (
              <FlightCardItem
                key={flight.id}
                flight={flight}
                searchCriteria={searchCriteria}
                onSelectFlight={onSelectFlight}
                onOpenDetails={(f) => setSelectedFlightForDetails(f)}
              />
            ))
          ) : (
            /* ======================= TABULAR COMPARISON MATRIX ======================= */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Flight</th>
                      <th className="px-4 py-3.5">Route & Times</th>
                      <th className="px-4 py-3.5">Duration</th>
                      <th className="px-4 py-3.5">Aircraft</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Economy</th>
                      <th className="px-4 py-3.5 text-right">Business</th>
                      <th className="px-4 py-3.5 text-right">First</th>
                      <th className="px-4 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFlights.map((f) => {
                      const dep = new Date(f.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const arr = new Date(f.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isSelectedCabinEco = searchCriteria?.cabinClass === 'ECONOMY';
                      const isSelectedCabinBus = searchCriteria?.cabinClass === 'BUSINESS';
                      const isSelectedCabinFirst = searchCriteria?.cabinClass === 'FIRST';

                      return (
                        <tr key={f.id} className="transition-colors hover:bg-blue-50/40">
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Plane className="h-3.5 w-3.5 rotate-45" />
                              </span>
                              <div>
                                <span className="font-mono font-black text-blue-600">{f.flightNumber}</span>
                                <span className="block text-[10px] text-slate-400 font-medium">{f.tailNumber || '4R-SLA'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">
                              {f.origin} ({dep}) → {f.destination} ({arr})
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {f.originCity} to {f.destinationCity}
                              {f.hasLayover && (
                                <span className="ml-1 text-amber-600 font-bold">
                                  • {f.layoverCity || 'Layover'} ({f.layoverDurationHours || 0}h)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-700">
                            {f.duration}
                            <span className="block text-[10px] text-slate-400">
                              {f.stops === 0 ? 'Non-stop' : `${f.stops} Stop(s)`}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            <span className="font-semibold block truncate max-w-[120px]">{f.aircraft || f.aircraftModel || 'Boeing 787'}</span>
                            <span className="text-[10px] text-emerald-600 font-bold">
                              {f.availableSeats || 42} seats left
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ${
                                f.status === 'ON_TIME'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : f.status === 'DELAYED'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {f.status || 'ON_TIME'}
                            </span>
                          </td>
                          <td className={`px-4 py-3.5 text-right font-mono font-bold ${isSelectedCabinEco ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}>
                            ${f.priceEconomy || f.basePriceEconomy || 350}
                          </td>
                          <td className={`px-4 py-3.5 text-right font-mono font-bold ${isSelectedCabinBus ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}>
                            ${f.priceBusiness || f.basePriceBusiness || 850}
                          </td>
                          <td className={`px-4 py-3.5 text-right font-mono font-bold ${isSelectedCabinFirst ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}>
                            ${f.priceFirst || f.basePriceFirst || 1500}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedFlightForDetails(f)}
                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:border-blue-400 hover:bg-slate-50"
                              >
                                Info
                              </button>
                              <button
                                type="button"
                                onClick={() => onSelectFlight(f, searchCriteria?.cabinClass || 'ECONOMY')}
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-black text-white shadow hover:bg-blue-700 active:scale-95"
                              >
                                Select
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
          )}
        </div>
      </div>

      {/* Flight details sheet */}
      <FlightDetailsModal
        flight={selectedFlightForDetails}
        isOpen={!!selectedFlightForDetails}
        onClose={() => setSelectedFlightForDetails(null)}
      />
    </div>
  );
}