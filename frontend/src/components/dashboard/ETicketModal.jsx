import React, { useState, useEffect } from 'react';
import {
  Plane,
  Ticket,
  Printer,
  X,
  Check,
  Copy,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  Hotel,
  CheckCircle2,
  ShieldCheck,
  User,
  Utensils,
  Sparkles,
  Luggage,
  ArrowRight
} from 'lucide-react';

const AIRPORT_INFO = {
  CMB: { city: 'Colombo', country: 'Sri Lanka', name: 'Bandaranaike Intl Airport', flag: '🇱🇰' },
  LHR: { city: 'London', country: 'United Kingdom', name: 'Heathrow Airport', flag: '🇬🇧' },
  SIN: { city: 'Singapore', country: 'Singapore', name: 'Changi Airport', flag: '🇸🇬' },
  DXB: { city: 'Dubai', country: 'UAE', name: 'Dubai Intl Airport', flag: '🇦🇪' },
  JFK: { city: 'New York', country: 'USA', name: 'John F. Kennedy Intl', flag: '🇺🇸' },
  HND: { city: 'Tokyo', country: 'Japan', name: 'Haneda Airport', flag: '🇯🇵' },
  SYD: { city: 'Sydney', country: 'Australia', name: 'Kingsford Smith Airport', flag: '🇦🇺' },
  CDG: { city: 'Paris', country: 'France', name: 'Charles de Gaulle Airport', flag: '🇫🇷' },
  DOH: { city: 'Doha', country: 'Qatar', name: 'Hamad Intl Airport', flag: '🇶🇦' }
};

function formatFlightDate(dateString) {
  if (!dateString) return 'Thursday, 10 Sep 2026';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

function formatFlightTime(dateString) {
  if (!dateString) return '10:15 AM';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      if (typeof dateString === 'string' && dateString.includes('T')) return dateString.split('T')[1].slice(0, 5);
      return dateString;
    }
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '10:15 AM';
  }
}

export default function ETicketModal({ booking, onClose, onNavigateToHotels }) {
  const [copied, setCopied] = useState(false);

  // Lock scroll while modal is open & listen for Escape key
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!booking) return null;

  const pnr = booking.pnrCode || booking.pnr || 'SK-784920';
  const flightNumber = booking.flightNumber || booking.flight?.flightNumber || 'SL-204';
  const origin = (booking.origin || booking.flight?.origin || 'CMB').toUpperCase();
  const destination = (booking.destination || booking.flight?.destination || 'LHR').toUpperCase();
  const originInfo = AIRPORT_INFO[origin] || { city: booking.originCity || origin, country: 'International', flag: '✈️' };
  const destInfo = AIRPORT_INFO[destination] || { city: booking.destinationCity || destination, country: 'International', flag: '✈️' };
  const cabinClass = (
    booking.cabinClass ||
    booking.flight?.cabinClass ||
    booking.selectedClass ||
    booking.flight?.selectedClass ||
    (booking.passengers && booking.passengers[0]?.cabinClass) ||
    'ECONOMY'
  ).toUpperCase();
  const aircraft = booking.aircraft || booking.flight?.aircraft || booking.flight?.aircraftModel || 'Boeing 787-9 Dreamliner';
  const departureDate = formatFlightDate(booking.departureTime || booking.flight?.departureTime);
  const departureTime = formatFlightTime(booking.departureTime || booking.flight?.departureTime);
  const totalPaid = booking.totalAmount || booking.totalPaid || 780;
  const status = booking.bookingStatus || booking.status || 'CONFIRMED';
  const hasLayover = Boolean(booking.hasLayover || booking.flight?.hasLayover);
  const layoverCity = booking.layoverCity || booking.flight?.layoverCity || 'Dubai';
  const layoverAirport = booking.layoverAirport || booking.flight?.layoverAirport || 'DXB';
  const layoverHours = booking.layoverDurationHours || booking.flight?.layoverDurationHours || 8.5;

  const passengers = booking.passengers && booking.passengers.length > 0
    ? booking.passengers
    : booking.passenger
      ? [booking.passenger]
      : [{
          firstName: booking.userName?.split(' ')[0] || 'Alex',
          lastName: booking.userName?.split(' ')[1] || 'Morgan',
          title: 'Mr',
          seat: booking.seat || '14A',
          meal: 'Standard Gourmet',
          passport: 'N9849201'
        }];

  const hotel = booking.selectedHotel || (booking.hotelBooked ? {
    name: booking.hotelName || 'Transit Grand Luxury Hotel',
    voucherCode: booking.hotelVoucherCode || `HTV-${pnr.replace(/\D/g, '') || '884920'}`,
    roomType: booking.roomType || 'Deluxe Transit Suite',
    numberOfNights: booking.hotelNights || 1,
    city: layoverCity || destInfo.city
  } : null);

  const handleCopyPnr = () => {
    navigator.clipboard?.writeText(pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Official Electronic Flight Ticket"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Modal Container */}
      <div className="relative z-10 w-full max-w-4xl my-6 rounded-[2rem] bg-white shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[92vh]">

        {/* Modal Top Floating Bar (No-Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <Ticket className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">Official Electronic Boarding Pass</h3>
              <p className="text-[11px] text-slate-500">Booking Reference: <span className="font-mono font-bold text-blue-600">{pnr}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95"
            >
              <Printer className="h-3.5 w-3.5 text-blue-600" />
              <span>Print E-Ticket</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close E-Ticket"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable E-Ticket Body */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 printable-eticket">

          {/* Confirmed Banner with PNR */}
          <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 sm:p-5 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold">Booking & Electronic Ticket Confirmed</h4>
                <p className="text-xs text-emerald-100">
                  Status: <span className="font-bold text-white uppercase">{status}</span> • All flight sectors & seats allocated.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPnr}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur border border-white/20 transition hover:bg-white/25 active:scale-95"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'PNR Copied' : 'Copy PNR'}</span>
              </button>

              {hasLayover && onNavigateToHotels && (
                <button
                  type="button"
                  onClick={() => {
                    onClose && onClose();
                    onNavigateToHotels();
                  }}
                  className="flex cursor-pointer items-center gap-1 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-950 shadow transition hover:bg-amber-300 active:scale-95"
                >
                  <Hotel className="h-3.5 w-3.5" />
                  <span>Transit Hotel</span>
                </button>
              )}
            </div>
          </div>

          {/* Electronic Boarding Pass Card */}
          <div className="rounded-[1.75rem] border border-slate-200 overflow-hidden bg-white shadow-xl">

            {/* Header: SkyLine Brand & PNR Barcode info */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8] p-6 text-white">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 shadow-lg ring-1 ring-white/25">
                    <Plane className="h-6 w-6 -rotate-45 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-300">SkyLine Air Official Flight Ticket</span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">SkyLine Air</h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">Booking Reference</span>
                  <div className="font-mono text-xl sm:text-2xl font-black tracking-wider text-amber-300">
                    {pnr}
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Route & Timing Ribbon */}
            <div className="bg-slate-50/90 border-b border-slate-200 p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Origin */}
                <div className="text-center md:text-left space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Departure</span>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">{origin}</span>
                    <span className="text-2xl">{originInfo.flag}</span>
                  </div>
                  <div className="font-extrabold text-sm text-slate-800">{originInfo.city}</div>
                  <div className="text-xs text-slate-500">{originInfo.name}</div>
                  <div className="text-xs font-bold text-blue-600 flex items-center justify-center md:justify-start gap-1 pt-1">
                    <Clock className="h-3.5 w-3.5" /> {departureTime}
                  </div>
                </div>

                {/* Vector Flight Graphic */}
                <div className="flex flex-col items-center justify-center space-y-2 px-2">
                  <div className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                    <span>{flightNumber}</span>
                    <span>{hasLayover ? `${layoverHours}h Layover` : 'Non-Stop'}</span>
                  </div>

                  <div className="relative w-full flex items-center justify-center">
                    <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 rounded-full" />
                    <div className="absolute w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-blue-600">
                      <Plane className="h-4 w-4 rotate-90" />
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <span className="text-xs font-semibold text-slate-600">{departureDate}</span>
                    {hasLayover && (
                      <span className="block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                        Transit: {layoverCity} ({layoverAirport})
                      </span>
                    )}
                  </div>
                </div>

                {/* Destination */}
                <div className="text-center md:text-right space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Arrival</span>
                  <div className="flex items-center justify-center md:justify-end gap-2">
                    <span className="text-2xl">{destInfo.flag}</span>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">{destination}</span>
                  </div>
                  <div className="font-extrabold text-sm text-slate-800">{destInfo.city}</div>
                  <div className="text-xs text-slate-500">{destInfo.name}</div>
                  <div className="text-xs font-bold text-emerald-600 pt-1">
                    ✓ Scheduled Arrival
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Technical Details Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white border-b border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Flight Number</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">{flightNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Aircraft Model</span>
                <span className="font-extrabold text-slate-900">{aircraft}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cabin Class</span>
                <span className={`font-extrabold ${cabinClass === 'BUSINESS' ? 'text-indigo-600 font-black' : cabinClass === 'FIRST' ? 'text-amber-600 font-black' : 'text-blue-600'}`}>
                  {cabinClass} CLASS
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fare Paid</span>
                <span className="font-extrabold text-emerald-600">${totalPaid}.00 USD (Paid)</span>
              </div>
            </div>

            {/* Passengers & Seat Allocation Cards */}
            <div className="p-6 md:p-8 space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Passenger & Seat Allocations ({passengers.length} {passengers.length === 1 ? 'Passenger' : 'Passengers'})
              </span>

              <div className="space-y-3">
                {passengers.map((p, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 items-center"
                  >
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Passenger {idx + 1}</span>
                      <div className="font-extrabold text-sm text-slate-900">
                        {p.title || 'Mr'} {p.firstName} {p.lastName}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">Passport: {p.passport || 'N9849201'}</span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Allocated Seat</span>
                      <span className="inline-block px-3 py-1 bg-blue-600 text-white font-mono font-black text-sm rounded-lg shadow-sm">
                        {p.seat || booking.seat || '14A'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        <span className={`font-bold uppercase ${cabinClass === 'BUSINESS' ? 'text-indigo-600' : cabinClass === 'FIRST' ? 'text-amber-600' : 'text-slate-700'}`}>{cabinClass} CLASS</span> • Zone {idx + 1} • Gate B14
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">In-Flight Meal</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Utensils className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{p.meal || 'Standard Gourmet'}</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold">Included</span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Baggage Allowance</span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                        <Luggage className="h-3.5 w-3.5 text-slate-500" />
                        <span>{cabinClass === 'FIRST' ? '50kg' : cabinClass === 'BUSINESS' ? '40kg' : '25kg'} Check-in + 7kg Cabin</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transit Hotel Accommodation Voucher (if applicable) */}
              {hotel && (
                <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border border-indigo-500/30 shadow-md space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/40 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold">
                        <Hotel className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
                          Official Airline Partner Hotel Voucher
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-white">
                          {hotel.name}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Hotel Voucher Code</span>
                      <span className="font-mono text-base font-black text-amber-300 tracking-wider">
                        {hotel.voucherCode}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Hotel Destination</span>
                      <span className="font-extrabold text-white text-sm">{hotel.city || 'Transit City'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Room Category</span>
                      <span className="font-extrabold text-indigo-300 text-sm">{hotel.roomType || 'Deluxe Transit Suite'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Duration</span>
                      <span className="font-extrabold text-white text-sm">{hotel.numberOfNights || 1} Night(s)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Check-In Status</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/10 rounded-xl text-xs text-indigo-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Free 24/7 Airport Shuttle Included:</strong> Follow airport signage to Hotel Shuttle Zone. Present this voucher at check-in desk.
                    </span>
                  </div>
                </div>
              )}

              {/* Barcode & Security Scan Section */}
              <div className="pt-6 border-t border-dashed border-slate-300 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Security Checkpoint Scan String</span>
                  <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 font-mono text-xs tracking-widest text-slate-700">
                    *M1{passengers[0]?.lastName?.toUpperCase() || 'MORGAN'}/{passengers[0]?.firstName?.toUpperCase() || 'ALEX'} E{pnr} {origin}{destination}SL {flightNumber.replace(/\D/g, '')} 253Y{passengers[0]?.seat || '14A'}0001*
                  </div>
                  <p className="text-[10px] text-slate-400">Please arrive at the boarding gate at least 45 minutes prior to departure.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center justify-center rounded-2xl bg-slate-900 p-2.5 text-white shadow-md">
                    <QrCode className="h-16 w-16" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar (No-Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            SkyLine Air E-Ticket Verification • IATA Certified Electronic Ticket
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-700 active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
