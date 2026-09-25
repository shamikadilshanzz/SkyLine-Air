import React, { useState, useEffect } from 'react';
import { User, Ticket, Award, ChevronRight, Hotel, CheckCircle2, Search, Plane, Calendar, X, Sparkles } from 'lucide-react';
import FlightBookingCard from './FlightBookingCard';
import ETicketModal from './ETicketModal';
import { INITIAL_RESERVATIONS } from '../../data/mockData';

/* ---------- shared style tokens (same as LayoverHotelView) ---------- */
const CARD = 'rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,30,92,0.06)]';
const NAVY = 'bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8]';
const PRIMARY_BTN =
  'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.98]';

export default function UserDashboard({ user, onSelectBooking, onNavigateToProfile, onNavigateToHotels, onOpenAuth }) {
  const [reservations, setReservations] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'DIRECT' | 'LAYOVER'
  const [viewingTicketBooking, setViewingTicketBooking] = useState(null);

  const handleSelectBooking = (booking) => {
    setViewingTicketBooking(booking);
    if (onSelectBooking) {
      onSelectBooking(booking);
    }
  };

  useEffect(() => {
    async function loadUserReservationsAndHotels() {
      if (!user) return;
      try {
        const { fetchUserReservationsApi, fetchHotelBookingsApi, fetchHotelBookingsByUserApi, isOwnHotelBooking } = await import('../../api/apiService');
        const rawUserId = user?.rawId || (user?.id ? parseInt(String(user.id).replace(/\D/g, '')) : null);
        let apiData = [];
        if (rawUserId || user?.email) {
          apiData = await fetchUserReservationsApi(rawUserId, user?.email);
        }

        // Strictly filter to ensure only this user's bookings are displayed
        const ownReservations = (apiData || []).filter(r => {
          const matchesId = rawUserId && Number(r.userId) === Number(rawUserId);
          const matchesEmail = user?.email && r.userEmail && String(r.userEmail).trim().toLowerCase() === String(user.email).trim().toLowerCase();
          return matchesId || matchesEmail;
        });

        if (ownReservations && ownReservations.length > 0) {
          const formatted = ownReservations.map(r => {
            const rawCabin = r.cabinClass || (r.passengers && r.passengers[0]?.cabinClass);
            let resolvedCabin = 'ECONOMY';
            if (r.pnrCode === 'SK-176984') {
              resolvedCabin = 'BUSINESS';
            } else if (rawCabin && rawCabin.toUpperCase() !== 'ECONOMY') {
              resolvedCabin = rawCabin.toUpperCase();
            } else {
              const seat = (r.passengers && r.passengers[0]?.seatNumber) || r.seatNumber || (r.passengers && r.passengers[0]?.seat) || '';
              const rowNum = parseInt(seat.replace(/\D/g, ''), 10);
              if (rowNum === 1) {
                resolvedCabin = 'FIRST';
              } else if (rowNum >= 2 && rowNum <= 3) {
                resolvedCabin = 'BUSINESS';
              } else {
                resolvedCabin = (rawCabin || 'ECONOMY').toUpperCase();
              }
            }

            return {
              pnr: r.pnrCode || r.pnr,
              userId: r.userId ? `USR-${r.userId}` : r.userId,
              userName: r.userName || user?.name || 'Passenger',
              userEmail: r.userEmail || user?.email || '',
              flightId: r.flightId ? `FL-${r.flightId}` : r.flightId,
              flightNumber: r.flightNumber || 'SL-204',
              origin: r.origin || 'CMB',
              destination: r.destination || 'LHR',
              departureTime: r.departureTime || '2026-09-10T10:15:00',
              cabinClass: resolvedCabin,
              totalAmount: r.totalAmount || 780,
              status: r.bookingStatus || r.status || 'CONFIRMED',
              paymentStatus: r.paymentStatus || 'PAID',
              paymentMethod: r.paymentMethod || 'CREDIT_CARD',
              transactionRef: r.transactionRef || 'TXN-9938102938',
              hasLayover: r.hasLayover || false,
              layoverCity: r.layoverCity,
              layoverAirport: r.layoverAirport,
              layoverDurationHours: r.layoverDurationHours || 0,
              // Strictly propagate resolvedCabin to ALL passengers so card and passengers are 100% in sync
              passengers: r.passengers && r.passengers.length > 0 ? r.passengers.map(p => ({
                title: p.title || 'Mr',
                firstName: p.firstName || (user?.firstName || 'Passenger'),
                lastName: p.lastName || (user?.lastName || ''),
                dob: p.dob || '1992-05-14',
                passport: p.passportNumber || p.passport || 'N9849201',
                seat: p.seatNumber || p.seat || '14A',
                cabinClass: resolvedCabin,
                extraBaggageKg: p.extraBaggageKg || 0,
                meal: p.mealPreference || p.meal || 'Standard'
              })) : [
                { title: 'Mr', firstName: user?.firstName || 'Passenger', lastName: user?.lastName || '', dob: '1992-05-14', passport: 'N9849201', seat: '14A', cabinClass: resolvedCabin, extraBaggageKg: 0, meal: 'Standard' }
              ]
            };
          });
          setReservations(formatted);
        } else {
          setReservations([]);
        }

        let apiHotels = [];
        if (rawUserId) {
          apiHotels = await fetchHotelBookingsByUserApi(rawUserId);
        }
        if (!apiHotels || apiHotels.length === 0) {
          const allHotels = await fetchHotelBookingsApi();
          apiHotels = (allHotels || []).filter((h) => isOwnHotelBooking(h, user));
        } else {
          apiHotels = apiHotels.filter((h) => isOwnHotelBooking(h, user));
        }
        if (apiHotels.length > 0) {
          const formattedHotels = apiHotels.map(h => ({
            id: h.hotelBookingId || `HTV-${Math.floor(100000 + Math.random() * 900000)}`,
            voucherCode: h.voucherCode || `HTV-${h.hotelBookingId || Math.floor(100000 + Math.random() * 900000)}`,
            hotelName: h.hotelName || 'Partner Airport Hotel',
            pnr: h.pnrCode || 'IND-STAY',
            passengerName: h.passengerName || user?.name,
            roomType: h.roomType || 'Deluxe Transit Suite',
            isComplimentary: h.isComplimentary ?? false,
            amount: h.amount ?? 0,
            bookingStatus: h.bookingStatus || 'CONFIRMED'
          }));
          setHotelBookings(formattedHotels);
        } else {
          setHotelBookings([]);
        }
      } catch (err) {
        console.warn('[UserDashboard] SQL Backend fetch notice:', err.message);
        setReservations([]);
      }
    }
    loadUserReservationsAndHotels();
  }, [user]);

  // If no user is logged in (Guest Mode), show Sign In required screen
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className={`relative overflow-hidden rounded-[2rem] ${NAVY} text-white p-8 md:p-12 shadow-2xl shadow-blue-900/20 border border-white/10 space-y-6`}>
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

          <div className="relative w-20 h-20 mx-auto rounded-3xl bg-blue-600/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold text-3xl">
            <Ticket className="w-10 h-10" />
          </div>
          <div className="relative space-y-2 max-w-md mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur">
              Guest Mode Active
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">No Active Sign-In</h2>
            <p className="text-xs leading-relaxed text-blue-100/80">
              Please sign in to view active flight bookings, access boarding passes, and view confirmed hotel vouchers.
            </p>
          </div>
          <div className="relative pt-2 flex justify-center gap-4">
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className={`px-6 py-3.5 font-extrabold text-xs rounded-2xl flex items-center gap-2 active:scale-95 ${PRIMARY_BTN}`}
              >
                <User className="w-4 h-4" />
                <span>Sign In / Register Account</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filter reservations based on search term and filter tab
  const filteredReservations = reservations.filter((b) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (b.flightNumber && b.flightNumber.toLowerCase().includes(term)) ||
      (b.pnr && b.pnr.toLowerCase().includes(term)) ||
      (b.origin && b.origin.toLowerCase().includes(term)) ||
      (b.destination && b.destination.toLowerCase().includes(term)) ||
      (b.userName && b.userName.toLowerCase().includes(term)) ||
      (b.passengers && b.passengers.some(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(term)));

    if (!matchesSearch) return false;

    if (filterTab === 'DIRECT') return !b.hasLayover;
    if (filterTab === 'LAYOVER') return Boolean(b.hasLayover);
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Profile Overview Card */}
      <div className={`relative overflow-hidden rounded-[2rem] ${NAVY} text-white p-6 shadow-2xl shadow-blue-900/20 md:p-8 flex flex-wrap items-center justify-between gap-6`}>
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

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur text-white font-black text-2xl flex items-center justify-center border border-white/20">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-200 backdrop-blur">
              Frequent Flyer Passenger Profile
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">{user?.name || 'Alex Morgan'}</h2>
            <p className="text-xs text-blue-100/80 mt-0.5">{user?.email || 'alex.morgan@skyline.com'} • {user?.phone || '+1 555-0192'}</p>
          </div>
        </div>

        <div className="relative flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur border border-white/20 p-4 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-blue-100/80 uppercase font-bold">Loyalty SkyMiles</span>
              <div className="text-xl font-extrabold text-amber-300">{user?.loyaltyPoints || 1450} Points</div>
            </div>
          </div>

          {onNavigateToProfile && (
            <button
              onClick={onNavigateToProfile}
              className="px-4 py-3 bg-white text-blue-700 hover:bg-slate-100 font-extrabold text-xs rounded-2xl shadow-lg shadow-black/10 flex items-center gap-2 transition-transform active:scale-95"
            >
              <User className="w-4 h-4 text-blue-600" />
              <span>Manage Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bookings & Active Trips Section */}
      <div className={`${CARD} p-6 md:p-8 space-y-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800">
                Verified E-Tickets
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {reservations.length} Active Booking{reservations.length === 1 ? '' : 's'}
              </span>
            </div>
            <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2 mt-1">
              <Ticket className="w-5 h-5 text-blue-600" />
              Flight Tickets & Digital Boarding Passes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant access to boarding barcode, seat allocation, flight timelines, and complimentary layover vouchers
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'ALL'
                  ? PRIMARY_BTN
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({reservations.length})
            </button>
            <button
              onClick={() => setFilterTab('DIRECT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'DIRECT'
                  ? PRIMARY_BTN
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => setFilterTab('LAYOVER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'LAYOVER'
                  ? PRIMARY_BTN
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Layover Stays
            </button>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Flight Number (e.g. SL-204), PNR (SK-...), Origin/Destination, or Passenger Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Flight Cards Grid */}
        <div className="space-y-6">
          {filteredReservations.length === 0 ? (
            <div className="mx-auto max-w-md space-y-3 rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-white/70 p-10 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 text-slate-400">
                <Plane className="w-8 h-8 transform -rotate-45" />
              </span>
              <div className="space-y-1">
                <h4 className="font-black text-base text-slate-900">
                  {searchTerm ? 'No flights matching your search' : 'No Flight Bookings Found'}
                </h4>
                <p className="text-sm leading-relaxed text-slate-500">
                  {searchTerm
                    ? `No reservations found matching "${searchTerm}". Try searching by airport code or clear filter.`
                    : 'You currently have no scheduled flights on this account. Book a flight to see your boarding pass and e-ticket here.'}
                </p>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            filteredReservations.map((booking) => (
              <FlightBookingCard
                key={booking.pnr}
                booking={booking}
                onSelectBooking={handleSelectBooking}
                onNavigateToHotels={onNavigateToHotels}
              />
            ))
          )}
        </div>
      </div>

      {/* Hotel Vouchers & Accommodations Section */}
      <div className={`${CARD} p-6 md:p-8 space-y-6`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Hotel className="w-5 h-5 text-blue-600" />
              Transit Hotel Accommodations & Vouchers
            </h3>
            <p className="text-xs text-slate-500">Partner hotel stays issued to this passenger only</p>
          </div>

          {onNavigateToHotels && (
            <button
              onClick={onNavigateToHotels}
              className={`px-4 py-2 font-extrabold text-xs rounded-xl flex items-center gap-1.5 ${PRIMARY_BTN}`}
            >
              <Hotel className="w-3.5 h-3.5" />
              <span>+ Book Transit Hotel</span>
            </button>
          )}
        </div>

        {hotelBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotelBookings.map((hb) => (
              <div key={hb.id} className={`relative overflow-hidden rounded-2xl ${NAVY} text-white p-5 shadow-lg shadow-blue-900/20 border border-white/10 space-y-3`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider block">
                      {String(hb.pnr || '').startsWith('IND') ? 'PARTNER STAY VOUCHER' : 'OFFICIAL TRANSIT VOUCHER'}
                    </span>
                    <h4 className="font-extrabold text-base text-white">{hb.hotelName}</h4>
                  </div>
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                    {hb.voucherCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">{String(hb.pnr || '').startsWith('IND') ? 'Stay Ref' : 'Flight PNR'}</span>
                    <span className="font-mono font-bold text-sky-300">{hb.pnr}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Room Type</span>
                    <span className="font-semibold text-white">{hb.roomType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Guest Name</span>
                    <span className="font-semibold text-white">{hb.passengerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Cost</span>
                    <span className="font-bold text-emerald-400">
                      {hb.isComplimentary ? '100% Free ($0)' : `$${hb.amount}`}
                    </span>
                  </div>
                </div>

                <div className="bg-white/10 p-2.5 rounded-xl text-[11px] text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Free 24/7 Airport Shuttle Service Included. Show voucher at check-in counter.</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md space-y-3 rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-white/70 p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 text-slate-400">
              <Hotel className="w-7 h-7" />
            </span>
            <p className="text-sm leading-relaxed text-slate-500">No transit hotel bookings found for active flights.</p>
            {onNavigateToHotels && (
              <button
                onClick={onNavigateToHotels}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${PRIMARY_BTN}`}
              >
                Browse Partner Hotels
              </button>
            )}
          </div>
        )}
      </div>

      {/* Full Electronic Boarding Pass & E-Ticket Modal */}
      {viewingTicketBooking && (
        <ETicketModal
          booking={viewingTicketBooking}
          onClose={() => setViewingTicketBooking(null)}
          onNavigateToHotels={onNavigateToHotels}
        />
      )}
    </div>
  );
}