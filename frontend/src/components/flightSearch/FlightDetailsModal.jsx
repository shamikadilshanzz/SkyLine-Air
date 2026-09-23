import React, { useEffect } from 'react';
import { X, Plane, Clock, Wifi, Calendar } from 'lucide-react';
import { INITIAL_AIRPORTS } from '../../data/mockData';

// Helper to look up full airport name & city
export const getAirportInfo = (code, airportsList = INITIAL_AIRPORTS) => {
  const found = (airportsList || []).find((a) => a.code === code);
  if (found) {
    return {
      city: found.city,
      fullName: `${found.name || found.city + ' International Airport'} (${found.code})`,
      code: found.code,
      country: found.country
    };
  }
  return {
    city: code,
    fullName: `${code} International Airport (${code})`,
    code: code
  };
};

// Generate timeline segments matching exact design structure
export const buildFlightSegments = (flight, airportsList = INITIAL_AIRPORTS) => {
  if (!flight) return [];

  // If explicit segments array provided
  if (flight.segments && Array.isArray(flight.segments)) {
    return flight.segments;
  }

  const originInfo = getAirportInfo(flight.origin, airportsList);
  const destInfo = getAirportInfo(flight.destination, airportsList);
  const depDateObj = new Date(flight.departureTime || '2026-09-15T04:35:00');

  const formattedDate = depDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Special case: Colombo (CMB) to Milan (MXP) matching exact user prompt mockup
  if (
    (flight.origin === 'CMB' && flight.destination === 'MXP') ||
    (flight.destinationCity && flight.destinationCity.toLowerCase().includes('milan'))
  ) {
    return [
      {
        dateFormatted: formattedDate,
        departureTimeStr: '04:35',
        arrivalTimeStr: '06:35',
        duration: '4h 30m',
        flightNumber: 'QR659',
        aircraft: 'Boeing 787-8',
        operator: 'Qatar Airways',
        originCity: 'Colombo',
        originAirportFull: 'Bandaranaike International Colombo Airport (CMB)',
        destinationCity: 'Doha',
        destinationAirportFull: 'Hamad International Airport (DOH)',
        hasWifi: false,
        transit: {
          duration: '3h 20m',
          city: 'Doha',
          airportName: 'Hamad International Airport',
          description: 'More than just an airport. Get ready to experience the best in shopping, dining and lounges.'
        }
      },
      {
        dateFormatted: formattedDate,
        departureTimeStr: '09:55',
        arrivalTimeStr: '14:55',
        duration: '6h',
        flightNumber: 'QR131',
        aircraft: 'Airbus A350-900',
        operator: 'Qatar Airways',
        originCity: 'Doha',
        originAirportFull: 'Hamad International Airport (DOH)',
        destinationCity: 'Rome',
        destinationAirportFull: 'Rome–Fiumicino Leonardo da Vinci International Airport (FCO)',
        hasWifi: true,
        transit: {
          duration: '2h 28m',
          city: 'Rome',
          airportName: 'Rome–Fiumicino Leonardo da Vinci International Airport',
          description: 'Complimentary transit lounge access & terminal transfer available.'
        }
      },
      {
        dateFormatted: formattedDate,
        departureTimeStr: '17:23',
        arrivalTimeStr: '19:08',
        duration: '1h 45m',
        flightNumber: 'QR3185',
        aircraft: 'Airbus A320neo',
        operator: 'Qatar Airways',
        originCity: 'Rome',
        originAirportFull: 'Rome–Fiumicino Leonardo da Vinci International Airport (FCO)',
        destinationCity: 'Milan',
        destinationAirportFull: 'Milan Malpensa Airport (MXP)',
        hasWifi: false,
        transit: null
      }
    ];
  }

  // Case 2: Layover Flight (1 transit e.g. CMB to LHR via DXB)
  if (flight.hasLayover || flight.stops > 0) {
    const layoverCode = flight.layoverAirport || 'DXB';
    const layoverInfo = getAirportInfo(layoverCode, airportsList);
    const layoverHours = flight.layoverDurationHours || 8.5;

    const arr1Obj = new Date(depDateObj.getTime() + 4.5 * 3600 * 1000);
    const dep2Obj = new Date(arr1Obj.getTime() + layoverHours * 3600 * 1000);
    const arr2Obj = new Date(flight.arrivalTime || dep2Obj.getTime() + 7 * 3600 * 1000);

    return [
      {
        dateFormatted: formattedDate,
        departureTimeStr: depDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        arrivalTimeStr: arr1Obj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        duration: '4h 30m',
        flightNumber: `${flight.flightNumber || 'SL-204'}A`,
        aircraft: flight.aircraft || 'Boeing 787-9 Dreamliner',
        operator: 'SkyLine Air',
        originCity: flight.originCity || originInfo.city,
        originAirportFull: originInfo.fullName,
        destinationCity: flight.layoverCity || layoverInfo.city,
        destinationAirportFull: layoverInfo.fullName,
        hasWifi: true,
        transit: {
          duration: `${layoverHours}h 00m`,
          city: flight.layoverCity || layoverInfo.city,
          airportName: layoverInfo.fullName.split(' (')[0],
          description: layoverHours >= 8
            ? 'Eligible for Complimentary Hotel Accommodation (UC-06). Get ready to experience luxury lounges and transit suites.'
            : 'More than just an airport. Get ready to experience the best in shopping, dining and lounges.'
        }
      },
      {
        dateFormatted: dep2Obj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        departureTimeStr: dep2Obj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        arrivalTimeStr: arr2Obj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        duration: '7h 15m',
        flightNumber: `${flight.flightNumber || 'SL-204'}B`,
        aircraft: 'Airbus A350-900',
        operator: 'SkyLine Air',
        originCity: flight.layoverCity || layoverInfo.city,
        originAirportFull: layoverInfo.fullName,
        destinationCity: flight.destinationCity || destInfo.city,
        destinationAirportFull: destInfo.fullName,
        hasWifi: true,
        transit: null
      }
    ];
  }

  // Case 3: Direct Flight (0 stops)
  const arrObj = new Date(flight.arrivalTime || depDateObj.getTime() + 4 * 3600 * 1000);

  return [
    {
      dateFormatted: formattedDate,
      departureTimeStr: depDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      arrivalTimeStr: arrObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      duration: flight.duration || '4h 00m',
      flightNumber: flight.flightNumber || 'SL-101',
      aircraft: flight.aircraft || 'Boeing 787-9 Dreamliner',
      operator: 'SkyLine Air',
      originCity: flight.originCity || originInfo.city,
      originAirportFull: originInfo.fullName,
      destinationCity: flight.destinationCity || destInfo.city,
      destinationAirportFull: destInfo.fullName,
      hasWifi: true,
      transit: null
    }
  ];
};

export default function FlightDetailsModal({ flight, isOpen, onClose, airports = INITIAL_AIRPORTS }) {
  // Lock page scroll and close on Escape while the sheet is open
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !flight) return null;

  const originInfo = getAirportInfo(flight.origin, airports);
  const destInfo = getAirportInfo(flight.destination, airports);
  const originCity = flight.originCity || originInfo.city;
  const destinationCity = flight.destinationCity || destInfo.city;

  const segments = buildFlightSegments(flight, airports);
  const stopCount = Math.max(0, segments.length - 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Flight details"
    >
      <style>{`
        @keyframes sl-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sl-up { from { transform: translateY(100%) } to { transform: none } }
        @keyframes sl-left { from { transform: translateX(100%) } to { transform: none } }
        .sl-backdrop { animation: sl-fade .25s ease both }
        .sl-sheet { animation: sl-up .32s cubic-bezier(.2,.8,.2,1) both }
        @media (min-width: 640px) { .sl-sheet { animation-name: sl-left } }
        @media (prefers-reduced-motion: reduce) { .sl-backdrop, .sl-sheet { animation: none } }
      `}</style>

      {/* Backdrop */}
      <div className="sl-backdrop absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet (mobile) / drawer (sm+) */}
      <div className="sl-sheet relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:h-full sm:max-h-none sm:max-w-lg sm:rounded-none sm:rounded-l-[1.75rem]">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8] px-5 pb-5 pt-3 text-white sm:px-6 sm:pt-5">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          {/* drag handle (mobile visual cue) */}
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/30 sm:hidden" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-200/80">Flight details</p>
              <h2 className="mt-0.5 truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                {originCity} to {destinationCity}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-cyan-100">
                  {stopCount === 0 ? 'Direct' : `${stopCount} ${stopCount === 1 ? 'stop' : 'stops'}`}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-cyan-100">
                  {flight.origin} to {flight.destination}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close flight details"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          {segments.map((seg, idx) => (
            <div key={idx} className="space-y-4">
              {/* Date */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                {seg.dateFormatted}
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-[48px_24px_1fr] items-stretch gap-3 sm:grid-cols-[56px_28px_1fr]">
                {/* Times */}
                <div className="flex flex-col justify-between py-0.5">
                  <div className="text-base font-extrabold text-slate-900 tabular-nums">{seg.departureTimeStr}</div>
                  <div className="my-6 text-[11px] font-semibold text-slate-400">{seg.duration}</div>
                  <div className="text-base font-extrabold text-slate-900 tabular-nums">{seg.arrivalTimeStr}</div>
                </div>

                {/* Nodes + line */}
                <div className="relative flex flex-col items-center justify-between py-1.5">
                  <div className="z-10 h-3.5 w-3.5 shrink-0 rounded-full border-[3px] border-blue-600 bg-white" />
                  <div className="relative my-1 w-0.5 flex-1 rounded-full bg-gradient-to-b from-blue-600 to-blue-300">
                    <span className="absolute left-1/2 top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md ring-4 ring-white">
                      <Plane className="h-3.5 w-3.5 rotate-[135deg]" />
                    </span>
                  </div>
                  <div className="z-10 h-3.5 w-3.5 shrink-0 rounded-full border-[3px] border-blue-600 bg-blue-600" />
                </div>

                {/* Details */}
                <div className="flex min-w-0 flex-col justify-between gap-4">
                  <div>
                    <div className="text-base font-bold leading-snug text-slate-900">{seg.originCity}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{seg.originAirportFull}</div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-slate-800">
                      <span>{seg.flightNumber}</span>
                      <span className="text-slate-300">|</span>
                      <span className="font-semibold">{seg.aircraft}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Operated by {seg.operator || 'Qatar Airways'}</div>
                    {seg.hasWifi && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        <Wifi className="h-3 w-3" /> Starlink Wi-Fi
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-base font-bold leading-snug text-slate-900">{seg.destinationCity}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{seg.destinationAirportFull}</div>
                  </div>
                </div>
              </div>

              {/* Transit */}
              {seg.transit && (
                <div className="my-5 flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-amber-800">
                      {seg.transit.duration} transit in {seg.transit.city}
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-slate-900">{seg.transit.airportName}</div>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800/90">{seg.transit.description}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}