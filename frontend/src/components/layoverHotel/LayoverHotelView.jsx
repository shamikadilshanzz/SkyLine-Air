import React, { useState } from 'react';
import {
  Hotel,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  Sparkles,
  ChevronRight,
  Ticket,
  X,
  User,
  Bed
} from 'lucide-react';
import { INITIAL_HOTELS } from '../../data/mockData';
import HotelManagerPortal, { formatHotelFromApi } from './HotelManagerPortal';
import HotelVoucherCard from './HotelVoucherCard';
import { isOwnHotelBooking } from '../../api/apiService';

const ROOM_TYPES = ['Standard Transit Room', 'Deluxe Suite', 'Executive Club Suite'];

/* ---------- shared style tokens (same as the other pages) ---------- */
const CARD = 'rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,30,92,0.06)]';
const NAVY = 'bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8]';
const PRIMARY_BTN =
  'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.98]';

function formatHotelBooking(b, fallbackName = '') {
  return {
    id: b.hotelBookingId || b.id || `HTV-${Date.now()}`,
    hotelId: b.hotelId ?? null,
    userId: b.userId ?? null,
    guestEmail: b.guestEmail || b.userEmail || '',
    voucherCode: b.voucherCode || `HTV-${b.hotelBookingId || Math.floor(100000 + Math.random() * 900000)}`,
    hotelName: b.hotelName || 'Partner Airport Hotel',
    airportCode: b.airportCode || '',
    city: b.city || '',
    pnr: b.pnrCode || b.pnr || 'IND-STAY',
    passengerName: b.passengerName || fallbackName,
    roomType: b.roomType || 'Deluxe Transit Suite',
    isComplimentary: b.isComplimentary,
    amount: b.amount,
    nights: b.nights || 1,
    bookingStatus: b.bookingStatus || 'CONFIRMED',
    independent: !b.reservationId && String(b.pnrCode || b.pnr || '').startsWith('IND')
  };
}

export default function LayoverHotelView({ currentRole, user, onOpenAuth }) {
  const [activeTab, setActiveTab] = useState('hotels');
  const [hotels, setHotels] = useState(INITIAL_HOTELS);
  const [reservations, setReservations] = useState([]);
  const [selectedPnr, setSelectedPnr] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('Deluxe Suite');
  const [hotelNights, setHotelNights] = useState(1);
  const [hotelBooked, setHotelBooked] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('ALL');
  const [bookingHotel, setBookingHotel] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [isSavingBooking, setIsSavingBooking] = useState(false);

  React.useEffect(() => {
    async function loadSqlHotelsAndReservations() {
      try {
        const {
          fetchHotelsApi,
          fetchUserReservationsApi,
          fetchHotelBookingsApi,
          fetchHotelBookingsByUserApi
        } = await import('../../api/apiService');

        const apiHotels = await fetchHotelsApi();
        if (apiHotels && apiHotels.length > 0) {
          const formattedHotels = apiHotels.map(formatHotelFromApi);
          setHotels(formattedHotels);
        }

        const rawUserId = user?.rawId || (user?.id ? parseInt(String(user.id).replace(/\D/g, ''), 10) : null);
        let ownReservations = [];
        if (rawUserId) {
          const apiRes = await fetchUserReservationsApi(rawUserId);
          if (apiRes && apiRes.length > 0) {
            ownReservations = apiRes.map(r => ({
              pnr: r.pnrCode || r.pnr,
              userName: r.userName || user?.name,
              userEmail: r.userEmail || user?.email,
              userId: r.userId || rawUserId,
              flightNumber: r.flightNumber || 'SL-204',
              origin: r.origin || 'CMB',
              destination: r.destination || 'LHR',
              hasLayover: r.hasLayover || false,
              layoverCity: r.layoverCity || '',
              layoverAirport: r.layoverAirport || '',
              layoverDurationHours: r.layoverDurationHours || 0
            }));
            setReservations(ownReservations);
            if (ownReservations[0]) setSelectedPnr(ownReservations[0].pnr);
          } else {
            setReservations([]);
            setSelectedPnr('');
          }
        } else {
          setReservations([]);
          setSelectedPnr('');
        }

        let apiBookings = [];
        if (rawUserId) {
          apiBookings = await fetchHotelBookingsByUserApi(rawUserId);
        }
        if (!apiBookings || apiBookings.length === 0) {
          const allBookings = await fetchHotelBookingsApi();
          apiBookings = (allBookings || []).filter((b) => isOwnHotelBooking(b, user));
        } else {
          apiBookings = apiBookings.filter((b) => isOwnHotelBooking(b, user));
        }

        if (user && apiBookings.length > 0) {
          const formattedBookings = apiBookings.map((b) => formatHotelBooking(b, user.name));
          setUserBookings(formattedBookings);
          setHotelBooked(true);
        } else {
          setUserBookings([]);
          setHotelBooked(false);
        }
      } catch (err) {
        console.warn('[LayoverHotelView] SQL fetch notice:', err.message);
      }
    }
    loadSqlHotelsAndReservations();
  }, [user]);

  // Booking sheet: lock page scroll and close on Escape
  React.useEffect(() => {
    if (!bookingHotel) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setBookingHotel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [bookingHotel]);

  const currentReservation = reservations.find(r => r.pnr === selectedPnr) || reservations[0] || null;
  const hasLayover = Boolean(currentReservation?.hasLayover && currentReservation?.layoverAirport);
  const isEligible = hasLayover && Number(currentReservation.layoverDurationHours || 0) >= 6;
  const isComplimentary = hasLayover && Number(currentReservation.layoverDurationHours || 0) >= 8;

  const openHotelBooking = (hotel) => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setBookingError('');
    setBookingHotel(hotel);
  };

  const hotelStayPricing = (hotel) => {
    if (!hotel) return { complimentary: false, discounted: false, amount: 0 };
    const isMatchingAirport = Boolean(
      hasLayover &&
      currentReservation?.layoverAirport &&
      hotel.airportCode?.toUpperCase() === currentReservation.layoverAirport?.toUpperCase()
    );
    const threshold = Number(hotel.complimentaryThresholdHours) || 8;
    const complimentary = isMatchingAirport && Number(currentReservation?.layoverDurationHours || 0) >= threshold;
    const discounted = isMatchingAirport && !complimentary && Number(currentReservation?.layoverDurationHours || 0) >= 6;
    const nightly = Number(hotel.pricePerNight || 120);
    return {
      complimentary,
      discounted,
      nightly,
      amount: complimentary ? 0 : nightly * hotelNights
    };
  };

  const handleConfirmPartnerBooking = async () => {
    const hotel = bookingHotel;
    if (!hotel || !user) return;
    setIsSavingBooking(true);
    setBookingError('');

    const pricing = hotelStayPricing(hotel);
    const voucher = `HTV-${Math.floor(100000 + Math.random() * 900000)}`;
    const independentPnr = `IND-${Math.floor(100000 + Math.random() * 900000)}`.slice(0, 10);
    const linkedPnr = currentReservation?.pnr || independentPnr;
    const passengerName = user.name;

    const newBookingObj = {
      id: Date.now(),
      userId: user.rawId || null,
      guestEmail: user.email || '',
      voucherCode: voucher,
      hotelName: hotel.name,
      airportCode: hotel.airportCode,
      city: hotel.city,
      pnr: linkedPnr,
      passengerName,
      roomType: selectedRoomType,
      isComplimentary: pricing.complimentary,
      amount: pricing.amount,
      nights: hotelNights,
      bookingStatus: 'CONFIRMED',
      independent: !currentReservation
    };

    try {
      const { bookHotelApi } = await import('../../api/apiService');
      const saved = await bookHotelApi({
        hotelId: hotel.rawId || (hotel.id ? parseInt(String(hotel.id).replace(/\D/g, ''), 10) : 1) || 1,
        hotelName: hotel.name,
        userId: user.rawId || null,
        guestEmail: user.email || null,
        voucherCode: voucher,
        pnrCode: linkedPnr,
        passengerName,
        roomType: selectedRoomType,
        isComplimentary: pricing.complimentary,
        amount: pricing.amount,
        bookingStatus: 'CONFIRMED'
      });
      if (saved?.voucherCode) newBookingObj.voucherCode = saved.voucherCode;
      if (saved?.hotelBookingId) newBookingObj.id = saved.hotelBookingId;
    } catch (err) {
      console.warn('Backend hotel booking notice:', err.message);
      setBookingError(err.message || 'Could not save booking. Voucher is stored on this device for your account.');
    }

    setUserBookings(prev => [newBookingObj, ...prev.filter((b) => isOwnHotelBooking({ ...b, userId: b.userId, guestEmail: b.guestEmail, passengerName: b.passengerName }, user))]);
    setHotelBooked(true);
    setBookingHotel(null);
    setActiveTab('voucher');
    setIsSavingBooking(false);
  };

  const bookingPricing = hotelStayPricing(bookingHotel);

  /* ---------------------- derived UI state ---------------------- */

  const tabs = [
    { id: 'hotels', label: 'Partner Hotels' },
    ...((hotelBooked || userBookings.length > 0)
      ? [{ id: 'voucher', label: 'My Vouchers', count: userBookings.length || 1 }]
      : []),
    ...((currentRole === 'HOTEL_MANAGER' || currentRole === 'ADMIN')
      ? [{ id: 'manager', label: 'Hotel Manager' }]
      : [])
  ];

  // One place that decides how the qualification banner looks
  let status;
  if (!user) {
    status = {
      box: 'border-slate-200 bg-slate-50',
      icon: 'bg-slate-200 text-slate-600',
      pill: 'bg-slate-600',
      pillLabel: 'Sign in to book',
      title: 'Sign in required to issue a personal hotel voucher',
      body: 'Pick a partner hotel such as Transit Grand Luxury Hotel, sign in, and confirm. The voucher is stored only under your profile.'
    };
  } else if (!hasLayover) {
    status = {
      box: 'border-indigo-200 bg-indigo-50/70',
      icon: 'bg-indigo-100 text-indigo-600',
      pill: 'bg-indigo-600',
      pillLabel: 'Independent stay',
      title: 'Independent partner stay, not tied to flight checkout',
      body: 'Tap any partner hotel to book a room. Complimentary transit stays apply only when you have a qualifying layover ticket on this account.'
    };
  } else if (isComplimentary) {
    status = {
      box: 'border-emerald-200 bg-emerald-50/70',
      icon: 'bg-emerald-100 text-emerald-600',
      pill: 'bg-emerald-600',
      pillLabel: '100% free stay',
      title: `Layover duration: ${currentReservation.layoverDurationHours || 8.5} hours in ${currentReservation.layoverCity || 'Dubai'} (${currentReservation.layoverAirport || 'DXB'})`,
      body: `You qualify for a 100% complimentary hotel stay at ${currentReservation.layoverAirport} (layovers of 8 hours or more). Hotels at ${currentReservation.layoverAirport} are $0 for this flight.`
    };
  } else if (isEligible) {
    status = {
      box: 'border-blue-200 bg-blue-50/70',
      icon: 'bg-blue-100 text-blue-600',
      pill: 'bg-blue-600',
      pillLabel: 'Eligible transit rate',
      title: `Layover duration: ${currentReservation.layoverDurationHours || 8.5} hours in ${currentReservation.layoverCity || 'Dubai'} (${currentReservation.layoverAirport || 'DXB'})`,
      body: `You qualify for the discounted airline transit rate at ${currentReservation.layoverAirport} (layovers of 6 hours or more).`
    };
  } else {
    status = {
      box: 'border-amber-200 bg-amber-50/70',
      icon: 'bg-amber-100 text-amber-600',
      pill: 'bg-amber-600',
      pillLabel: 'Standard rates',
      title: `Layover duration: ${currentReservation.layoverDurationHours || 8.5} hours in ${currentReservation.layoverCity || 'Dubai'} (${currentReservation.layoverAirport || 'DXB'})`,
      body: 'Your layover is under 6 hours, so standard partner hotel rates apply.'
    };
  }

  const filteredHotels = hotels.filter(hotel => {
    if (selectedCountryFilter === 'ALL') return true;
    if (selectedCountryFilter.startsWith('AIRPORT_')) {
      const targetCode = selectedCountryFilter.replace('AIRPORT_', '').toUpperCase();
      return hotel.airportCode?.toUpperCase() === targetCode;
    }
    return hotel.country?.toLowerCase() === selectedCountryFilter.toLowerCase();
  });

  const chipBase = 'shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold transition-all';

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">

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
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur">
              <Hotel className="h-3.5 w-3.5" />
              Partner hotel network
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">Transit layover lodging</h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
              Book any partner hotel on its own, no flight checkout required. Long-haul layover guests still qualify for
              complimentary rooms at matching airports, and vouchers stay in your passenger account only.
            </p>
          </div>

          <div
            role="tablist"
            className="-mx-1 flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/10 p-1.5 backdrop-blur-md"
          >
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${active
                      ? 'bg-white text-blue-700 shadow-lg shadow-black/10'
                      : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${active ? 'bg-amber-400 text-slate-950' : 'bg-amber-400 text-slate-950'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================ Layover qualification checker ================ */}
      <div className={`${CARD} space-y-5 p-4 sm:p-6`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold leading-tight text-slate-900">Layover qualification checker</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {currentReservation
                  ? `PNR ${currentReservation.pnr} | Flight ${currentReservation.flightNumber}${hasLayover ? ` (${currentReservation.origin} → ${currentReservation.layoverAirport} → ${currentReservation.destination})` : ` (${currentReservation.origin} → ${currentReservation.destination} direct)`}`
                  : user
                    ? 'No flight ticket on this account. Partner hotels can still be booked independently at standard rates.'
                    : 'Sign in to book a partner hotel and keep the voucher in your passenger section.'}
              </p>
            </div>
          </div>

          {reservations.length > 0 && (
            <label className="flex flex-col gap-1.5 md:min-w-[280px]">
              <span className="text-xs font-bold text-slate-600">Your flights</span>
              <select
                value={selectedPnr}
                onChange={(e) => setSelectedPnr(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
              >
                {reservations.map(r => (
                  <option key={r.pnr} value={r.pnr}>
                    {r.pnr} ({r.origin} → {r.destination}) {r.hasLayover ? `[${r.layoverAirport} layover]` : '[Direct]'}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${status.box}`}>
          <div className="flex min-w-0 items-start gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${status.icon}`}>
              <CheckCircle2 className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 space-y-1">
              <div className="text-sm font-extrabold leading-snug text-slate-900">{status.title}</div>
              <p className="text-xs leading-relaxed text-slate-600">{status.body}</p>
            </div>
          </div>
          <span className={`shrink-0 self-start whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white ${status.pill}`}>
            {status.pillLabel}
          </span>
        </div>
      </div>

      {/* ============================ HOTELS ============================ */}
      {activeTab === 'hotels' && (
        <div className="space-y-6">
          {/* Filter chips: scroll sideways on phones */}
          <div className="-mx-4 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {hasLayover && (
              <button
                type="button"
                onClick={() => setSelectedCountryFilter(`AIRPORT_${currentReservation.layoverAirport}`)}
                className={`${chipBase} ${selectedCountryFilter === `AIRPORT_${currentReservation.layoverAirport}`
                    ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
              >
                My layover ({currentReservation.layoverAirport}, {currentReservation.layoverCity})
              </button>
            )}

            {['ALL', 'UAE', 'Singapore', 'United Kingdom', 'USA', 'Japan', 'Sri Lanka', 'Australia'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCountryFilter(c)}
                className={`${chipBase} ${selectedCountryFilter === c
                    ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50'
                  }`}
              >
                {c === 'ALL' ? 'All countries' : c}
              </button>
            ))}
          </div>

          {filteredHotels.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Hotel className="h-7 w-7 text-slate-300" />
              </span>
              <h3 className="text-lg font-bold text-slate-800">No partner hotels here yet</h3>
              <p className="max-w-sm text-sm text-slate-500">Try another country, or browse the full partner network.</p>
              <button
                type="button"
                onClick={() => setSelectedCountryFilter('ALL')}
                className={`mt-1 rounded-xl px-5 py-2.5 text-sm font-bold ${PRIMARY_BTN}`}
              >
                Show all hotels
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {filteredHotels.map((hotel) => {
                const pricing = hotelStayPricing(hotel);
                const isHotelComplimentary = pricing.complimentary;
                const isDiscounted = pricing.discounted;

                return (
                  <div
                    key={hotel.id || hotel.rawId}
                    role="button"
                    tabIndex={0}
                    onClick={() => openHotelBooking(hotel)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openHotelBooking(hotel);
                      }
                    }}
                    className={`group flex cursor-pointer flex-col justify-between overflow-hidden rounded-[1.75rem] border bg-white text-left shadow-[0_8px_30px_rgb(15,30,92,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgb(15,30,92,0.16)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 ${isHotelComplimentary ? 'border-emerald-300 ring-2 ring-emerald-400/20' : 'border-slate-200/80 hover:border-indigo-300'
                      }`}
                  >
                    <div>
                      <div className="relative h-44 overflow-hidden bg-slate-900 sm:h-48">
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1230]/80 via-transparent to-[#0a1230]/10" />

                        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                          {isHotelComplimentary ? (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Free layover hotel
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {hotel.starRating} star
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                          <MapPin className="h-3 w-3 text-sky-300" /> {hotel.distanceKm} km from {hotel.airportCode} terminal
                        </div>
                      </div>

                      <div className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-extrabold leading-snug text-slate-900">{hotel.name}</h3>
                          <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                            {hotel.airportCode}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(hotel.amenities) ? hotel.amenities : []).map((a, idx) => (
                            <span key={idx} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {a}
                            </span>
                          ))}
                        </div>

                        <div className="text-xs text-slate-500">
                          {hotel.shuttleService ? 'Free 24/7 airport shuttle | Breakfast included' : 'Breakfast included | Express terminal access'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                      <div className="min-w-0">
                        {isHotelComplimentary ? (
                          <div>
                            <div className="text-xs text-slate-400">
                              Regular <span className="font-bold line-through">${hotel.pricePerNight}</span>
                            </div>
                            <div className="flex flex-wrap items-baseline gap-1.5">
                              <span className="text-2xl font-black text-emerald-600">$0</span>
                              <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                Free stay
                              </span>
                            </div>
                          </div>
                        ) : isDiscounted ? (
                          <div>
                            <span className="block text-xs font-semibold text-blue-600">Transit rate</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black tabular-nums text-blue-600">${hotel.pricePerNight}</span>
                              <span className="text-xs font-semibold text-slate-500">/ night</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="block text-xs font-semibold text-slate-400">Nightly rate</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black tabular-nums text-slate-900">${hotel.pricePerNight}</span>
                              <span className="text-xs font-semibold text-slate-500">/ night</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openHotelBooking(hotel);
                        }}
                        className={`flex shrink-0 items-center gap-1 rounded-2xl px-4 py-3 text-xs font-extrabold text-white shadow-lg transition active:scale-[0.97] ${isHotelComplimentary
                            ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-emerald-600/25 hover:from-emerald-500 hover:to-emerald-700'
                            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-800'
                          }`}
                      >
                        {isHotelComplimentary ? 'Claim free stay' : 'Book hotel'}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================ VOUCHERS ============================ */}
      {activeTab === 'voucher' && (
        <div className="space-y-6">
          <div className={`${CARD} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6`}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Ticket className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs font-semibold text-blue-600">Verified transit passes</div>
                <h3 className="text-lg font-black leading-tight text-slate-900 sm:text-xl">My hotel accommodation vouchers</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  Show your digital voucher QR code or reference code at the hotel front desk.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-2 text-xs font-extrabold text-blue-800 ring-1 ring-inset ring-blue-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                {user ? `${userBookings.length} active ${userBookings.length === 1 ? 'pass' : 'passes'}` : 'Guest mode'}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('hotels')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
              >
                <Hotel className="h-3.5 w-3.5" />
                Browse hotels
              </button>
            </div>
          </div>

          {!user && (
            <div className={`${CARD} mx-auto max-w-lg space-y-4 p-8 text-center sm:p-10`}>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                <Ticket className="h-8 w-8" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">Sign in to access your vouchers</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-slate-500">
                  Hotel vouchers are linked securely to your passenger profile. Sign in to view and download your active passes.
                </p>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className={`rounded-xl px-6 py-3 text-sm font-extrabold shadow-lg ${PRIMARY_BTN}`}
                >
                  Sign in to SkyLine Air
                </button>
              )}
            </div>
          )}

          {user && userBookings.length === 0 && (
            <div className="mx-auto max-w-md space-y-4 rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-white/70 p-10 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 text-slate-400">
                <Hotel className="h-8 w-8" />
              </span>
              <div>
                <h4 className="text-base font-black text-slate-900">No hotel vouchers yet</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  You haven't reserved a partner hotel room yet. Explore our airport transit hotels and claim your stay.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('hotels')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-extrabold ${PRIMARY_BTN}`}
              >
                Browse partner hotels
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {user && userBookings.length > 0 && (
            <div className="space-y-6">
              {userBookings.map((bk, idx) => {
                const matchedHotel = hotels.find(h =>
                  (h.rawId && bk.hotelId && Number(h.rawId) === Number(bk.hotelId)) ||
                  (h.name && bk.hotelName && h.name.toLowerCase() === bk.hotelName.toLowerCase()) ||
                  (h.airportCode && bk.airportCode && h.airportCode.toUpperCase() === bk.airportCode.toUpperCase())
                );
                return (
                  <HotelVoucherCard
                    key={bk.id || idx}
                    booking={bk}
                    hotel={matchedHotel}
                    onNavigateToHotels={() => setActiveTab('hotels')}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'manager' && (
        <HotelManagerPortal
          hotels={hotels}
          onHotelsUpdated={(updated) => {
            setHotels(updated);
          }}
        />
      )}

      {/* ====================== Booking sheet / dialog ====================== */}
      {bookingHotel && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Book ${bookingHotel.name}`}
        >
          <style>{`
            @keyframes sl-fade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes sl-up { from { transform: translateY(100%) } to { transform: none } }
            @keyframes sl-zoom { from { opacity: 0; transform: scale(.96) translateY(8px) } to { opacity: 1; transform: none } }
            .sl-backdrop { animation: sl-fade .25s ease both }
            .sl-sheet { animation: sl-up .32s cubic-bezier(.2,.8,.2,1) both }
            @media (min-width: 640px) { .sl-sheet { animation-name: sl-zoom; animation-duration: .25s } }
            @media (prefers-reduced-motion: reduce) { .sl-backdrop, .sl-sheet { animation: none } }
          `}</style>

          <div className="sl-backdrop absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setBookingHotel(null)} />

          <div className="sl-sheet relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:rounded-[1.75rem]">
            <div className="relative h-36 shrink-0 bg-slate-900 sm:h-40">
              <img src={bookingHotel.image} alt={bookingHotel.name} className="h-full w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1230]/80 via-[#0a1230]/10 to-transparent" />
              <div className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/40 sm:hidden" />
              <button
                type="button"
                onClick={() => setBookingHotel(null)}
                aria-label="Close"
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute inset-x-5 bottom-3 text-white">
                <div className="text-xs font-semibold text-cyan-200">Independent partner booking</div>
                <h3 className="text-xl font-extrabold leading-tight">{bookingHotel.name}</h3>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {bookingHotel.city} | {bookingHotel.airportCode} | {bookingHotel.starRating} star
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                    <User className="h-3 w-3" /> Guest
                  </span>
                  <div className="mt-1 text-sm font-extrabold text-slate-900">{user?.name}</div>
                  <div className="truncate text-xs text-slate-500">{user?.email}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <label htmlFor="room-type" className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                    <Bed className="h-3 w-3" /> Room
                  </label>
                  <select
                    id="room-type"
                    value={selectedRoomType}
                    onChange={(e) => setSelectedRoomType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-base font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                  >
                    {ROOM_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="mb-2 text-xs font-bold text-slate-600">Nights</div>
                  <div className="inline-flex gap-1 rounded-2xl bg-slate-100 p-1">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setHotelNights(n)}
                        aria-pressed={hotelNights === n}
                        className={`h-10 w-12 rounded-xl text-sm font-bold transition-all ${hotelNights === n
                            ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25'
                            : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-400">Total</div>
                  <div className={`text-3xl font-black tabular-nums ${bookingPricing.complimentary ? 'text-emerald-600' : 'text-indigo-700'}`}>
                    {bookingPricing.complimentary ? '$0' : `$${bookingPricing.amount}`}
                  </div>
                </div>
              </div>

              {bookingError && (
                <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  {bookingError}
                </p>
              )}

              <button
                type="button"
                disabled={isSavingBooking}
                onClick={handleConfirmPartnerBooking}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-4 text-sm font-extrabold text-white shadow-xl shadow-blue-600/30 transition hover:from-blue-700 hover:to-indigo-800 active:scale-[0.99] disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {isSavingBooking ? 'Issuing voucher…' : 'Confirm stay and issue voucher'}
              </button>
              <p className="text-center text-[11px] leading-relaxed text-slate-400">
                This booking is independent of flight checkout. The voucher is saved only to {user?.name}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}