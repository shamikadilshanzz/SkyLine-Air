import React, { useState } from 'react';
import {
  Plane,
  Clock,
  MapPin,
  Calendar,
  User,
  Ticket,
  Copy,
  Check,
  Printer,
  ChevronRight,
  ShieldCheck,
  Hotel,
  Sparkles,
  Utensils,
  Briefcase
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
      if (dateString.includes('T')) return dateString.split('T')[1].slice(0, 5);
      return dateString;
    }
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '10:15 AM';
  }
}

export default function FlightBookingCard({ booking, onSelectBooking, onNavigateToHotels }) {
  const [copied, setCopied] = useState(false);

  const pnr = booking.pnrCode || booking.pnr || 'SK-784920';
  const flightNumber = booking.flightNumber || 'SL-204';
  const origin = (booking.origin || 'CMB').toUpperCase();
  const destination = (booking.destination || 'LHR').toUpperCase();
  const cabinClass = (
    booking.cabinClass ||
    booking.flight?.cabinClass ||
    booking.selectedClass ||
    booking.flight?.selectedClass ||
    (booking.passengers && booking.passengers[0]?.cabinClass) ||
    'ECONOMY'
  ).toUpperCase();
  const status = booking.bookingStatus || booking.status || 'CONFIRMED';
  const totalAmount = booking.totalAmount || 780;
  const departureDate = formatFlightDate(booking.departureTime);
  const departureTime = formatFlightTime(booking.departureTime);
  const hasLayover = Boolean(booking.hasLayover);
  const layoverCity = booking.layoverCity || 'Dubai';
  const layoverAirport = booking.layoverAirport || 'DXB';
  const layoverHours = booking.layoverDurationHours || 8.5;

  const originInfo = AIRPORT_INFO[origin] || { city: origin, country: 'International', flag: '✈️' };
  const destInfo = AIRPORT_INFO[destination] || { city: destination, country: 'International', flag: '✈️' };

  const passengers = booking.passengers && booking.passengers.length > 0
    ? booking.passengers
    : [{ firstName: 'Alex', lastName: 'Morgan', title: 'Mr', seat: '14A', meal: 'Standard' }];

  const handleCopyPnr = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = (e) => {
    e.stopPropagation();
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group">

      {/* Flight Card Header Ribbon */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-blue-500/30">
            <Plane className="w-4 h-4 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white tracking-wider font-mono">{flightNumber}</span>
              <span className="text-slate-400">•</span>
              <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
                cabinClass === 'BUSINESS'
                  ? 'bg-blue-500/30 text-sky-200 border border-sky-400/40'
                  : cabinClass === 'FIRST'
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                    : 'bg-white/10 text-sky-300'
              }`}>
                {cabinClass} CLASS
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3 h-3 text-sky-400" />
              <span>{departureDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 ${status === 'CONFIRMED'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
            <span className={`w-2 h-2 rounded-full ${status === 'CONFIRMED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            {status}
          </span>

          <button
            type="button"
            onClick={handlePrint}
            title="Print or Save PDF"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1 px-2.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Main Boarding Pass Body: Dual-Column Ticket Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 relative">

        {/* LEFT COLUMN: Itinerary & Travel Parameters (8 cols) */}
        <div className="lg:col-span-8 p-6 md:p-8 space-y-6">

          {/* Flight Route Timeline Card */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Origin Airport */}
            <div className="text-center md:text-left space-y-1">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Departure</span>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-2xl md:text-3xl font-black text-slate-900 font-mono tracking-tight">{origin}</span>
                <span className="text-xl">{originInfo.flag}</span>
              </div>
              <div className="font-extrabold text-xs text-slate-800">{originInfo.city}</div>
              <div className="text-[11px] text-blue-600 font-bold flex items-center gap-1 justify-center md:justify-start">
                <Clock className="w-3 h-3" /> {departureTime}
              </div>
            </div>

            {/* Flight Flight Vector Graphic & Layover Badge */}
            <div className="flex-1 w-full max-w-xs flex flex-col items-center justify-center space-y-2 px-2">
              <div className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                <span>{hasLayover ? `${layoverHours}h Layover` : 'Non-Stop'}</span>
                <span>SkyLine Jet</span>
              </div>

              {/* Flight Track Line */}
              <div className="relative w-full flex items-center justify-center">
                <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 rounded-full"></div>
                <div className="absolute w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-blue-600">
                  <Plane className="w-4 h-4 transform rotate-90" />
                </div>
              </div>

              {hasLayover ? (
                <div className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold flex items-center gap-1">
                  <span>Transit: {layoverCity} ({layoverAirport})</span>
                </div>
              ) : (
                <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold">
                  Direct Flight
                </div>
              )}
            </div>

            {/* Destination Airport */}
            <div className="text-center md:text-right space-y-1">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Arrival</span>
              <div className="flex items-center gap-2 justify-center md:justify-end">
                <span className="text-xl">{destInfo.flag}</span>
                <span className="text-2xl md:text-3xl font-black text-slate-900 font-mono tracking-tight">{destination}</span>
              </div>
              <div className="font-extrabold text-xs text-slate-800">{destInfo.city}</div>
              <div className="text-[11px] text-slate-500 font-bold">Estimated On-Time</div>
            </div>
          </div>

          {/* Passenger, Seat, and Amenity Badges */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Passenger & Seat Allocations
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {passengers.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-xs">
                      {p.firstName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">
                        {p.title || 'Mr'} {p.firstName} {p.lastName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                          cabinClass === 'BUSINESS'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : cabinClass === 'FIRST'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-200 text-slate-700'
                        }`}>
                          {cabinClass}
                        </span>
                        <span>•</span>
                        <span>{p.meal || 'Standard Gourmet'}</span>
                        <span>•</span>
                        <span>Baggage: {cabinClass === 'FIRST' ? '50kg' : cabinClass === 'BUSINESS' ? '40kg' : '25kg'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Seat</span>
                    <span className="inline-block px-2.5 py-1 bg-blue-600 text-white font-mono font-black text-xs rounded-lg shadow-sm">
                      {p.seat || '14A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transit Layover Hotel Notice & Fast Booking Link */}
          {hasLayover && layoverHours >= 6 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Hotel className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Eligible for Transit Hotel Accommodation ({layoverCity} • {layoverAirport})</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Your {layoverHours}h layover qualifies for airline transit lodging service.
                  </p>
                </div>
              </div>

              {onNavigateToHotels && (
                <button
                  type="button"
                  onClick={onNavigateToHotels}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>View Transit Hotels</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Boarding Pass Tear-Off Stub (4 cols) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-slate-50 to-slate-100 p-6 md:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-dashed border-slate-300 relative">

          {/* Semicircle Cutouts for ticket perforation */}
          <div className="hidden lg:block absolute -top-3 -left-3 w-6 h-6 rounded-full bg-slate-50 border border-slate-200"></div>
          <div className="hidden lg:block absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-slate-50 border border-slate-200"></div>

          <div className="space-y-4">

            {/* Boarding Stub Header */}
            <div className="text-center pb-2 border-b border-slate-200">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
                Electronic Boarding Pass
              </span>
              <div className="font-extrabold text-xs text-slate-800">SkyLine Air Flight Voucher</div>
            </div>

            {/* PNR Code with 1-Click Copy */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Booking Reference (PNR)
              </span>
              <div className="font-mono font-black text-xl text-blue-600 tracking-wider">
                {pnr}
              </div>
              <button
                type="button"
                onClick={handleCopyPnr}
                className={`w-full mt-2 py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${copied
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                  }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>PNR Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy PNR Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Price & Payment Summary */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Fare Paid</span>
                <span className="font-black text-slate-900 text-sm">${totalAmount}.00</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
                <span>Method</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Paid & Confirmed
                </span>
              </div>
            </div>

            {/* Simulated Barcode Graphic */}
            <div className="text-center pt-1 space-y-1">
              <div className="h-10 w-full flex items-center justify-center gap-[2.5px] px-2 opacity-80">
                {[3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 1, 4, 1, 3, 2, 1, 3, 1, 4, 2, 1, 2, 3, 1].map((w, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 h-full rounded-sm"
                    style={{ width: `${w * 1.5}px` }}
                  ></div>
                ))}
              </div>
              <div className="font-mono text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                {pnr}-{flightNumber}-{origin}{destination}
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <button
              type="button"
              onClick={() => onSelectBooking && onSelectBooking(booking)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>View Full E-Ticket</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
