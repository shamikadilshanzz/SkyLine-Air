import React, { useState, useEffect } from 'react';
import {
  Plane,
  Clock,
  ShieldCheck,
  User,
  CreditCard,
  Check,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Ticket,
  UserCheck,
  Hotel,
  Building2,
  MapPin,
  Star,
  Bed,
  CheckCircle2
} from 'lucide-react';

import MealSelectionModal from './MealSelectionModal';
import { PRESET_MEALS } from '../../data/mealData';
import { INITIAL_HOTELS } from '../../data/mockData';

const ROOM_TYPES = [
  { id: 'STANDARD', name: 'Standard Transit Room', priceAdd: 0, description: 'Comfortable king bed, ensuite bath, quiet pod & Wi-Fi' },
  { id: 'DELUXE', name: 'Deluxe Suite', priceAdd: 35, description: 'Spacious suite, panoramic airport view, lounge access & free breakfast' },
  { id: 'EXECUTIVE', name: 'Executive Club Suite', priceAdd: 70, description: 'VIP concierge, separate living area, complimentary mini-bar & spa access' },
];

const DEFAULT_AMENITIES = ['Free Shuttle 24/7', 'Buffet Breakfast', 'Rooftop Pool', 'Wi-Fi'];
const AMENITY_PILL_FALLBACK = ['Free Shuttle 24/7', 'Buffet Breakfast', 'Wi-Fi'];

function parseAmenities(amenities) {
  if (Array.isArray(amenities)) return amenities.map((a) => String(a).trim()).filter(Boolean);
  if (typeof amenities === 'string' && amenities.trim()) {
    return amenities.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_AMENITIES;
}

export default function SeatReservationView({
  selectedFlight,
  currentRole,
  user,
  airports = [],
  onConfirmReservation,
  onBackToResults,
  initialOpenMealModal = false,
  onCloseMealModal
}) {
  const passengerCount = selectedFlight?.passengers || 1;
  const unitPrice = selectedFlight?.unitPrice || selectedFlight?.priceEconomy || 350;
  const baseFlightPrice = selectedFlight?.price || (unitPrice * passengerCount);
  const flightCabinClass = (selectedFlight?.cabinClass || selectedFlight?.selectedClass || 'ECONOMY').toUpperCase();
  const flightNum = selectedFlight?.flightNumber || selectedFlight?.flightNum || '';

  const getDefaultSeatsForCabin = (cabin) => {
    if (cabin === 'FIRST') {
      return ['1A', '1B', '1C', '1D', '1E', '1F'];
    }
    if (cabin === 'BUSINESS') {
      return ['2A', '2B', '2C', '2D', '3A', '3B'];
    }
    return ['4A', '4B', '4C', '4D', '4E', '4F', '5A', '5B', '5C', '5D', '5E', '5F'];
  };

  const [holdSeconds, setHoldSeconds] = useState(600); // 10 minute hold countdown
  const [officerMode, setOfficerMode] = useState(currentRole === 'TICKETING_OFFICER');

  // Meal Selection Modal State
  const [isMealModalOpen, setIsMealModalOpen] = useState(initialOpenMealModal);

  useEffect(() => {
    setIsMealModalOpen(initialOpenMealModal);
  }, [initialOpenMealModal]);

  // Active Passenger Tab Index State
  const [activePassengerIdx, setActivePassengerIdx] = useState(0);

  // Synchronous initial occupied seats from localStorage cache
  const [occupiedSeats, setOccupiedSeats] = useState(() => {
    if (!flightNum) return [];
    try {
      const cached = JSON.parse(localStorage.getItem(`skyline_occupied_${flightNum}`) || '[]');
      return Array.isArray(cached) ? cached.map(s => String(s).trim().toUpperCase()) : [];
    } catch (e) {
      return [];
    }
  });

  const [occupiedModalSeat, setOccupiedModalSeat] = useState(null);

  const getFreeSeatForCabin = (cabin, occupiedList = [], excludeSeats = []) => {
    const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
    let minRow = 4, maxRow = 15;
    if (cabin === 'FIRST') { minRow = 1; maxRow = 1; }
    else if (cabin === 'BUSINESS') { minRow = 2; maxRow = 3; }
    
    for (let r = minRow; r <= maxRow; r++) {
      for (let c of cols) {
        const candidate = `${r}${c}`;
        if (!occupiedList.includes(candidate) && !excludeSeats.includes(candidate)) {
          return candidate;
        }
      }
    }
    return '';
  };

  // Multi-Passenger Detail Form State
  const [passengersList, setPassengersList] = useState(() => {
    let initialOccupied = [];
    if (flightNum) {
      try {
        const cached = JSON.parse(localStorage.getItem(`skyline_occupied_${flightNum}`) || '[]');
        if (Array.isArray(cached)) initialOccupied = cached.map(s => String(s).trim().toUpperCase());
      } catch (e) {}
    }
    const defaultNames = [
      {
        title: user?.title || 'Mr',
        firstName: user?.firstName || (user?.name ? user.name.split(' ')[0] : 'Alex'),
        lastName: user?.lastName || (user?.name ? user.name.split(' ').slice(1).join(' ') : 'Morgan'),
        passport: user?.passportNumber || 'N9849201',
        nationality: user?.nationality || user?.country || 'USA',
        dob: user?.dob || '1992-05-14'
      },
      { title: 'Ms', firstName: 'Sarah', lastName: 'Morgan', passport: 'N7739102', nationality: user?.nationality || user?.country || 'USA', dob: '1994-08-20' },
      { title: 'Mr', firstName: 'James', lastName: 'Morgan', passport: 'N5529103', nationality: user?.nationality || user?.country || 'USA', dob: '1990-11-15' },
      { title: 'Mrs', firstName: 'Emma', lastName: 'Morgan', passport: 'N4419104', nationality: user?.nationality || user?.country || 'USA', dob: '1993-02-28' },
    ];
    const assignedSeats = [];
    return Array.from({ length: passengerCount }, (_, i) => {
      const def = defaultNames[i % defaultNames.length];
      let seat = getFreeSeatForCabin(flightCabinClass, initialOccupied, assignedSeats);
      if (seat) assignedSeats.push(seat);
      return {
        id: i + 1,
        title: def.title,
        firstName: def.firstName,
        lastName: def.lastName,
        dob: def.dob,
        passport: def.passport,
        gender: 'Male',
        nationality: def.nationality || 'USA',
        seat: seat || '',
        cabinClass: flightCabinClass,
        meal: PRESET_MEALS[0].name,
        mealDetails: PRESET_MEALS[0],
        extraBaggageKg: 0,
      };
    });
  });

  // Sync passengers' cabinClass and free seats if selectedFlight cabin changes
  useEffect(() => {
    setPassengersList(prev => {
      const assigned = [];
      return prev.map((p) => {
        const seatRow = parseInt(p.seat ? p.seat.replace(/\D/g, '') : '0', 10);
        let needsReset = false;
        if (flightCabinClass === 'FIRST' && seatRow !== 1) needsReset = true;
        if (flightCabinClass === 'BUSINESS' && (seatRow < 2 || seatRow > 3)) needsReset = true;
        if (flightCabinClass === 'ECONOMY' && (seatRow <= 3 && seatRow > 0)) needsReset = true;
        if (occupiedSeats.includes(p.seat)) needsReset = true;

        let finalSeat = p.seat;
        if (needsReset || !finalSeat) {
          finalSeat = getFreeSeatForCabin(flightCabinClass, occupiedSeats, assigned);
        }
        if (finalSeat) assigned.push(finalSeat);

        return {
          ...p,
          cabinClass: flightCabinClass,
          seat: finalSeat
        };
      });
    });
  }, [flightCabinClass]);

  const activePassenger = passengersList[activePassengerIdx] || passengersList[0];

  const updateActivePassenger = (updatedFields) => {
    setPassengersList(prev => prev.map((p, idx) => idx === activePassengerIdx ? { ...p, ...updatedFields } : p));
  };

  // Fetch live occupied seats for this flight from database & local storage caches
  useEffect(() => {
    let isMounted = true;
    async function loadOccupiedSeats() {
      const flightRawId = selectedFlight?.rawId || selectedFlight?.flightId || (selectedFlight?.id && !String(selectedFlight.id).startsWith('FL-') ? selectedFlight.id : null);
      
      const foundOccupied = new Set();
      let apiSuccess = false;

      // 1. Try dedicated live occupied-seats endpoint
      try {
        const { fetchOccupiedSeatsApi } = await import('../../api/apiService');
        const apiData = await fetchOccupiedSeatsApi(flightNum, flightRawId);
        if (Array.isArray(apiData)) {
          apiData.forEach(s => s && foundOccupied.add(String(s).trim().toUpperCase()));
          apiSuccess = true;
        }
      } catch (err) {
        console.warn('[SeatReservationView] Direct occupied seats API notice:', err.message);
      }

      // 2. Also fetch all active reservations to guarantee synchronization
      try {
        const { fetchReservationsApi } = await import('../../api/apiService');
        const allRes = await fetchReservationsApi();
        if (Array.isArray(allRes)) {
          allRes.forEach(r => {
            const isMatch = (flightNum && r.flightNumber && r.flightNumber.toUpperCase() === flightNum.toUpperCase()) ||
                            (flightRawId && r.flightId === flightRawId);
            const statusUpper = String(r.bookingStatus || '').toUpperCase();
            const isCancelled = statusUpper === 'CANCELLED' || statusUpper === 'REFUNDED' || statusUpper === 'REFUND_APPROVED' || statusUpper === 'CANCELLED_AND_REFUNDED' || statusUpper === 'CANCEL';
            if (isMatch && !isCancelled) {
              if (r.passengers && Array.isArray(r.passengers)) {
                r.passengers.forEach(p => {
                  if (p.seatNumber) foundOccupied.add(String(p.seatNumber).trim().toUpperCase());
                  if (p.seat) foundOccupied.add(String(p.seat).trim().toUpperCase());
                });
              }
            }
          });
          apiSuccess = true;
        }
      } catch (err) {
        console.warn('[SeatReservationView] Reservations fallback notice:', err.message);
      }

      // 3. Fallback ONLY if backend API is completely unreachable
      if (!apiSuccess && flightNum) {
        try {
          const cached = JSON.parse(localStorage.getItem(`skyline_occupied_${flightNum}`) || '[]');
          if (Array.isArray(cached)) {
            cached.forEach(s => s && foundOccupied.add(String(s).trim().toUpperCase()));
          }
        } catch (e) {}
      }

      if (isMounted) {
        const list = Array.from(foundOccupied);
        setOccupiedSeats(list);

        // Synchronize local storage cache to match authoritative backend state
        if (flightNum) {
          try {
            localStorage.setItem(`skyline_occupied_${flightNum}`, JSON.stringify(list));
          } catch (e) {}
        }

        // Automatically ensure no passenger default starts on an occupied seat
        setPassengersList(prev => {
          const assigned = [];
          return prev.map(p => {
            let s = p.seat ? String(p.seat).trim().toUpperCase() : '';
            if (!s || list.includes(s) || assigned.includes(s)) {
              s = getFreeSeatForCabin(flightCabinClass, list, assigned);
            }
            if (s) assigned.push(s);
            return { ...p, seat: s };
          });
        });
      }
    }

    loadOccupiedSeats();

    // Listen for custom realtime seat update events
    const handleSeatUpdateEvent = () => {
      loadOccupiedSeats();
    };
    window.addEventListener('skyline_seats_updated', handleSeatUpdateEvent);
    window.addEventListener('storage', handleSeatUpdateEvent);

    return () => {
      isMounted = false;
      window.removeEventListener('skyline_seats_updated', handleSeatUpdateEvent);
      window.removeEventListener('storage', handleSeatUpdateEvent);
    };
  }, [flightNum, selectedFlight?.id, flightCabinClass]);

  // Strictly enforce seat limit: 1 seat per passenger & validate cabin rows & occupied status
  const handleSelectSeat = (seatId) => {
    const cleanSeat = String(seatId).trim().toUpperCase();
    if (occupiedSeats.includes(cleanSeat)) {
      setOccupiedModalSeat(cleanSeat);
      setFormError(`⚠️ Seat ${cleanSeat} is ALREADY OCCUPIED on flight ${flightNum || ''} by another passenger! Seats cannot be selected or duplicated unless the previous booking is cancelled and refunded.`);
      setPassengersList(prev => prev.map(p => p.seat === cleanSeat ? { ...p, seat: '' } : p));
      return;
    }

    const seatRow = parseInt(cleanSeat.replace(/\D/g, ''), 10);
    if (flightCabinClass === 'FIRST' && seatRow !== 1) {
      setFormError('Your flight reservation is FIRST CLASS. Please select seats in Row 1 (First Class Cabin).');
      return;
    }
    if (flightCabinClass === 'BUSINESS' && (seatRow < 2 || seatRow > 3)) {
      setFormError('Your flight reservation is BUSINESS CLASS. Please select seats in Rows 2 or 3 (Business Class Cabin).');
      return;
    }
    if (flightCabinClass === 'ECONOMY' && seatRow <= 3) {
      setFormError('Rows 1-3 are reserved for First & Business Class ticket holders. Please select seats in Economy Class (Rows 4+).');
      return;
    }
    setFormError('');

    setPassengersList(prev => {
      return prev.map((p, idx) => {
        if (idx === activePassengerIdx) {
          return { ...p, seat: p.seat === cleanSeat ? '' : cleanSeat };
        } else if (p.seat === cleanSeat) {
          // If another passenger held this seat, clear it so no duplicate seats exist
          return { ...p, seat: '' };
        }
        return p;
      });
    });
  };

  const [formError, setFormError] = useState('');

  // Ticking hold timer
  useEffect(() => {
    const timer = setInterval(() => {
      setHoldSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Dynamic Seat Grid Calculations based on flight capacity configured by Flight Manager
  const flightCapacity = selectedFlight?.totalSeats || selectedFlight?.availableSeats || 48;
  const seatsPerRow = 6;
  const totalRowsCount = Math.max(1, Math.ceil(flightCapacity / seatsPerRow));
  const rows = Array.from({ length: totalRowsCount }, (_, i) => i + 1);

  // Destination & Layover Location Mapping
  const destinationAirport = airports?.find(a => a.code === selectedFlight?.destination);
  const destinationCountry = destinationAirport?.country || (
    selectedFlight?.destination === 'LHR' ? 'United Kingdom' :
      selectedFlight?.destination === 'JFK' ? 'USA' :
        selectedFlight?.destination === 'DXB' ? 'UAE' :
          selectedFlight?.destination === 'HND' ? 'Japan' :
            selectedFlight?.destination === 'SIN' ? 'Singapore' :
              selectedFlight?.destination === 'SYD' ? 'Australia' :
                selectedFlight?.destination === 'CMB' ? 'Sri Lanka' : 'Destination Country'
  );
  const destinationCity = selectedFlight?.destinationCity || destinationAirport?.city || selectedFlight?.destination || 'Destination';

  const layoverAirport = airports?.find(a => a.code === selectedFlight?.layoverAirport);
  const layoverCountry = layoverAirport?.country || (
    selectedFlight?.layoverAirport === 'DXB' ? 'UAE' :
      selectedFlight?.layoverAirport === 'SIN' ? 'Singapore' :
        selectedFlight?.layoverAirport === 'HND' ? 'Japan' : ''
  );
  const layoverCity = selectedFlight?.layoverCity || layoverAirport?.city || selectedFlight?.layoverAirport;

  // Detect long flight (duration >= 6 hours or has layover)
  const durationMatch = (selectedFlight?.duration || '').match(/(\d+)h/);
  const durationHours = durationMatch ? parseInt(durationMatch[1], 10) : 0;
  const isLongFlight = durationHours >= 6 || selectedFlight?.hasLayover;

  // Hotel Accommodation State
  const [hotelsList, setHotelsList] = useState(INITIAL_HOTELS);
  const [selectedLocationTab, setSelectedLocationTab] = useState(selectedFlight?.hasLayover && durationHours >= 8 ? 'LAYOVER' : 'DESTINATION');
  const [selectedHotel, setSelectedHotel] = useState(null); // null means "No Hotel Needed (Skip)"
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('DELUXE');
  const [hotelNights, setHotelNights] = useState(1);

  useEffect(() => {
    async function loadHotels() {
      try {
        const { fetchHotelsApi } = await import('../../api/apiService');
        const apiHotels = await fetchHotelsApi();
        if (apiHotels && apiHotels.length > 0) {
          const formatted = apiHotels.map(h => ({
            id: h.hotelId ? `HT-${h.hotelId}` : h.id,
            rawId: h.hotelId,
            name: h.name,
            airportCode: h.airportCode,
            city: h.city,
            country: h.country || (
              h.airportCode === 'LHR' ? 'United Kingdom' :
                h.airportCode === 'JFK' ? 'USA' :
                  h.airportCode === 'DXB' ? 'UAE' :
                    h.airportCode === 'HND' ? 'Japan' :
                      h.airportCode === 'SIN' ? 'Singapore' :
                        h.airportCode === 'SYD' ? 'Australia' :
                          h.airportCode === 'CMB' ? 'Sri Lanka' : ''
            ),
            starRating: h.starRating || 5,
            pricePerNight: Number(h.pricePerNight) || 120,
            availableRooms: h.availableRooms || 25,
            distanceKm: h.distanceKm || 1.0,
            shuttleService: h.shuttleService ?? true,
            amenities: parseAmenities(h.amenities),
            image: h.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
          }));
          setHotelsList(formatted);
        }
      } catch (err) {
        console.warn('[SeatReservationView] Hotel load notice:', err.message);
      }
    }
    loadHotels();
  }, []);

  const selectedRoomTypeObj = ROOM_TYPES.find(r => r.id === selectedRoomTypeId) || ROOM_TYPES[1];

  const flightHasLayover = Boolean(selectedFlight?.hasLayover);
  const layoverHours = Number(selectedFlight?.layoverDurationHours || 0);
  const hotelThreshold = Number(selectedHotel?.complimentaryThresholdHours) || 8;
  const isHotelComplimentary = flightHasLayover && layoverHours >= hotelThreshold;
  const isHotelDiscounted = flightHasLayover && !isHotelComplimentary && layoverHours >= 6;

  const baseUnitPrice = selectedHotel ? (Number(selectedHotel.pricePerNight) + selectedRoomTypeObj.priceAdd) : 0;
  const hotelUnitPrice = isHotelComplimentary ? 0 : (isHotelDiscounted ? Math.round(baseUnitPrice * 0.8) : baseUnitPrice);
  const totalHotelFee = selectedHotel ? (isHotelComplimentary ? 0 : hotelUnitPrice * hotelNights) : 0;
  const totalBaggageFee = passengersList.reduce((acc, p) => acc + (p.extraBaggageKg * 10), 0);
  const totalMealFee = passengersList.reduce((acc, p) => acc + (p.mealDetails?.price || 0), 0);
  const grandTotal = baseFlightPrice + totalBaggageFee + totalMealFee + totalHotelFee;

  const activeCountry = selectedLocationTab === 'LAYOVER' ? layoverCountry : destinationCountry;
  const activeCity = selectedLocationTab === 'LAYOVER' ? layoverCity : destinationCity;
  const activeAirport = selectedLocationTab === 'LAYOVER' ? selectedFlight?.layoverAirport : selectedFlight?.destination;

  const relevantHotels = hotelsList.filter(h => {
    if (activeCountry && h.country && h.country.toLowerCase() === activeCountry.toLowerCase()) return true;
    if (activeAirport && h.airportCode && h.airportCode.toUpperCase() === activeAirport.toUpperCase()) return true;
    if (activeCity && h.city && h.city.toLowerCase() === activeCity.toLowerCase()) return true;
    return false;
  });

  const displayHotels = relevantHotels.length > 0 ? relevantHotels : hotelsList;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Validation check across all passengers
    const assignedSeats = new Set();
    const nameRegex = /^[a-zA-Z\s'-]{2,}$/;
    const passportRegex = /^[a-zA-Z0-9]{6,15}$/;

    for (let i = 0; i < passengersList.length; i++) {
      const p = passengersList[i];
      if (!p.firstName || !p.lastName || !p.passport) {
        setFormError(`Please fill in First Name, Last Name, and Passport for Passenger ${i + 1}.`);
        return;
      }
      if (!nameRegex.test(p.firstName.trim()) || !nameRegex.test(p.lastName.trim())) {
        setFormError(`Passenger ${i + 1}: Name must contain at least 2 valid alphabet characters.`);
        return;
      }
      if (!passportRegex.test(p.passport.trim())) {
        setFormError(`Passenger ${i + 1}: Passport must be 6 to 15 alphanumeric characters.`);
        return;
      }
      if (!p.seat) {
        setFormError(`Please assign a seat for Passenger ${i + 1} (${p.firstName}).`);
        return;
      }
      if (assignedSeats.has(p.seat)) {
        setFormError(`Seat ${p.seat} is assigned to multiple passengers in this booking. Each passenger must have a unique seat.`);
        return;
      }
      if (occupiedSeats.includes(p.seat)) {
        setOccupiedModalSeat(p.seat);
        setFormError(`⚠️ Seat ${p.seat} is currently OCCUPIED on flight ${flightNum || ''}. Seats cannot be duplicated unless the previous ticket is cancelled and refunded.`);
        return;
      }
      assignedSeats.add(p.seat);
    }

    // Generate PNR
    const generatedPNR = `SK-${Math.floor(100000 + Math.random() * 900000)}`;

    const reservationData = {
      pnr: generatedPNR,
      flight: {
        ...selectedFlight,
        cabinClass: flightCabinClass,
        selectedClass: flightCabinClass
      },
      cabinClass: flightCabinClass,
      selectedClass: flightCabinClass,
      seat: passengersList.map(p => p.seat).join(', '),
      passengers: passengersList.map(p => ({ ...p, cabinClass: flightCabinClass })),
      passenger: { ...passengersList[0], cabinClass: flightCabinClass },
      passengerCount: passengerCount,
      officerAssisted: officerMode,
      bookingDate: new Date().toISOString(),
      status: 'PENDING_PAYMENT',
      unitPrice: unitPrice,
      baseFlightPrice: baseFlightPrice,
      extraBaggageFee: totalBaggageFee,
      mealFee: totalMealFee,
      hotelBooked: !!selectedHotel,
      hotelPrice: isHotelComplimentary ? 0 : totalHotelFee,
      isComplimentaryHotel: isHotelComplimentary,
      hotelVoucherCode: selectedHotel ? (isHotelComplimentary ? `COMP-HTL-${Math.floor(1000 + Math.random() * 9000)}` : `HTV-${Math.floor(100000 + Math.random() * 900000)}`) : null,
      selectedHotel: selectedHotel ? {
        id: selectedHotel.id,
        rawId: selectedHotel.rawId,
        name: selectedHotel.name,
        city: selectedHotel.city,
        country: selectedHotel.country,
        airportCode: selectedHotel.airportCode,
        roomType: selectedRoomTypeObj.name,
        roomTypeId: selectedRoomTypeId,
        pricePerNight: isHotelComplimentary ? 0 : hotelUnitPrice,
        numberOfNights: hotelNights,
        totalPrice: isHotelComplimentary ? 0 : totalHotelFee,
        isComplimentary: isHotelComplimentary,
        image: selectedHotel.image,
        starRating: selectedHotel.starRating,
        voucherCode: isHotelComplimentary ? `COMP-HTL-${Math.floor(1000 + Math.random() * 9000)}` : `HTV-${Math.floor(100000 + Math.random() * 900000)}`
      } : null,
      totalAmount: grandTotal
    };

    onConfirmReservation(reservationData);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <style>{`
        @keyframes sl-pop { 0% { transform: scale(.6); opacity: 0 } 60% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
        .sl-pop { animation: sl-pop .5s cubic-bezier(.2,.8,.2,1) both }
        @media (prefers-reduced-motion: reduce) { .sl-pop { animation: none } }
      `}</style>

      {/* ============================ HERO ============================ */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8] p-6 md:p-10 text-white shadow-2xl shadow-blue-900/20">
        {/* soft glows */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
        {/* faint flight-path arc */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
          viewBox="0 0 800 260"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M-20 230 C 220 20, 520 20, 820 200" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 8" />
        </svg>

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                {selectedFlight?.flightNumber || 'SL-204'}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-blue-100/90 backdrop-blur">
                {passengerCount} {passengerCount === 1 ? 'Passenger' : 'Passengers'}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
                flightCabinClass === 'BUSINESS'
                  ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                  : flightCabinClass === 'FIRST'
                    ? 'bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-white/20 text-white'
              }`}>
                {flightCabinClass} Class
              </span>
              {selectedFlight?.fareTier && (
                <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">
                  {selectedFlight.fareTier} (${baseFlightPrice.toLocaleString()} total)
                </span>
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {selectedFlight?.originCity || 'Colombo'} ({selectedFlight?.origin}) to {selectedFlight?.destinationCity || 'Singapore'} ({selectedFlight?.destination})
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
              Aircraft: {selectedFlight?.aircraft || 'Boeing 787-9 Dreamliner'} · Capacity: {flightCapacity} seats · Airfare: ${unitPrice} × {passengerCount} = ${baseFlightPrice.toLocaleString()}
            </p>
          </div>

          {/* Temporary Seat Hold Countdown */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <Clock className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-100/70">Temporary seat hold</div>
              <div className="text-xl font-mono font-extrabold text-amber-300">
                {formatTimer(holdSeconds)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticketing Officer Assistance Banner */}
      <div className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50 p-5 shadow-[0_8px_30px_rgb(15,30,92,0.06)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-emerald-900">Ticketing officer assistance mode</h4>
            <p className="text-[11px] text-emerald-700">
              Officers can amend passenger info or book reservations on customer's behalf.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={officerMode}
            onChange={(e) => setOfficerMode(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 rounded"
          />
          <span className="text-xs font-extrabold text-emerald-900">Officer mode active</span>
        </label>
      </div>

      {/* Main Reservation Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Interactive Seat Map Visualizer */}
        <div className="lg:col-span-6 space-y-6 self-start rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(15,30,92,0.06)]">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Plane className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h3 className="text-base font-extrabold leading-tight text-slate-900">
                Select flight seats ({passengerCount} required)
              </h3>
              <p className="text-xs text-slate-500">Currently assigning seat for <span className="font-bold text-blue-600">Passenger {activePassengerIdx + 1} ({activePassenger?.firstName || 'Passenger'})</span></p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block">Assigned seats</span>
              <span className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-black text-blue-600">
                {passengersList.map(p => p.seat || '?').join(', ')}
              </span>
            </div>
          </div>

          {/* Seat Map Error / Occupied Alert Banner */}
          {formError && (
            <div className="flex items-center gap-2.5 rounded-2xl border-2 border-red-300 bg-red-50 p-3.5 text-xs font-bold text-red-700 shadow-sm animate-pulse">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <div className="flex-1 leading-snug">{formError}</div>
            </div>
          )}

          {/* Seat Status Legend */}
          <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center text-xs font-semibold">
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-white border border-slate-300"></div>
              <span className="text-[11px]">Available</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-blue-600 text-white shadow-sm"></div>
              <span className="text-[11px]">Selected</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-red-500 text-white flex items-center justify-center text-[9px] font-bold">✕</div>
              <span className="text-[11px] text-red-600 font-bold">Occupied</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-slate-200 opacity-60"></div>
              <span className="text-[11px] text-slate-500">Other Cabin</span>
            </div>
          </div>

          {/* Interactive Seat Map Grid */}
          <div className="max-h-[500px] space-y-3 overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-slate-100/70 p-6">
            {/* Cockpit Indicator */}
            <div className="w-full bg-slate-300/60 py-2 rounded-t-full text-center text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">
              ✈️ Aircraft Nose & Cockpit ({selectedFlight?.aircraft || 'Boeing 787'})
            </div>

            {rows.map((r) => {
              const isWrongCabin = (flightCabinClass === 'FIRST' && r !== 1) ||
                (flightCabinClass === 'BUSINESS' && (r < 2 || r > 3)) ||
                (flightCabinClass === 'ECONOMY' && r <= 3);

              return (
                <div key={r} className="space-y-1">
                  {r === 1 && totalRowsCount >= 4 && (
                    <div className={`text-[10px] font-bold uppercase tracking-wider text-center py-1 rounded border ${
                      flightCabinClass === 'FIRST'
                        ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-300/40'
                        : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                    }`}>
                      ★ First Class Cabin {flightCabinClass === 'FIRST' ? '• (Your Selected Cabin)' : ''}
                    </div>
                  )}
                  {r === 2 && totalRowsCount >= 6 && (
                    <div className={`text-[10px] font-bold uppercase tracking-wider text-center py-1 rounded border ${
                      flightCabinClass === 'BUSINESS'
                        ? 'bg-blue-100 text-blue-900 border-blue-300 ring-2 ring-blue-300/40'
                        : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                    }`}>
                      ◆ Business Class Cabin {flightCabinClass === 'BUSINESS' ? '• (Your Selected Cabin)' : ''}
                    </div>
                  )}
                  {r === 4 && (
                    <div className={`text-[10px] font-bold uppercase tracking-wider text-center py-1 rounded border ${
                      flightCabinClass === 'ECONOMY'
                        ? 'bg-sky-100 text-sky-900 border-sky-300 ring-2 ring-sky-300/40'
                        : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                    }`}>
                      Economy Class Cabin {flightCabinClass === 'ECONOMY' ? '• (Your Selected Cabin)' : ''}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2">
                    <span className="w-6 text-[11px] font-bold text-slate-400 text-right">{r}</span>

                    {/* Left Seats (A, B, C) */}
                    <div className="flex gap-1.5">
                      {['A', 'B', 'C'].map((col, colIdx) => {
                        const seatNum = (r - 1) * 6 + colIdx + 1;
                        if (seatNum > flightCapacity) return <div key={col} className="w-9 h-9"></div>;
                        const seatId = `${r}${col}`;
                        const isOccupied = occupiedSeats.includes(seatId);
                        const isSelectedByAny = passengersList.some(p => p.seat === seatId);
                        const isCurrentPassengerSeat = activePassenger?.seat === seatId;

                        return (
                          <button
                            key={seatId}
                            type="button"
                            onClick={() => handleSelectSeat(seatId)}
                            title={isOccupied ? `Seat ${seatId} is ALREADY OCCUPIED (Click to see alert)` : isWrongCabin ? `Seat ${seatId} is outside your ${flightCabinClass} Class cabin` : `Select Seat ${seatId}`}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                              isOccupied
                                ? '!bg-red-500 !text-white !border-2 !border-red-700 shadow-md font-black cursor-pointer hover:!bg-red-600 hover:scale-105 ring-2 ring-red-300'
                                : isCurrentPassengerSeat
                                  ? 'bg-blue-600 text-white shadow-lg scale-105 border-2 border-blue-400 ring-2 ring-blue-300'
                                  : isSelectedByAny
                                    ? 'bg-indigo-500 text-white shadow'
                                    : isWrongCabin
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-40 hover:opacity-75'
                                      : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            {isOccupied ? '✕' : seatId}
                          </button>
                        );
                      })}
                    </div>

                    {/* Aisle */}
                    <div className="w-6 text-center text-[10px] font-mono text-slate-400">aisle</div>

                    {/* Right Seats (D, E, F) */}
                    <div className="flex gap-1.5">
                      {['D', 'E', 'F'].map((col, colIdx) => {
                        const seatNum = (r - 1) * 6 + 3 + colIdx + 1;
                        if (seatNum > flightCapacity) return <div key={col} className="w-9 h-9"></div>;
                        const seatId = `${r}${col}`;
                        const isOccupied = occupiedSeats.includes(seatId);
                        const isSelectedByAny = passengersList.some(p => p.seat === seatId);
                        const isCurrentPassengerSeat = activePassenger?.seat === seatId;

                        return (
                          <button
                            key={seatId}
                            type="button"
                            onClick={() => handleSelectSeat(seatId)}
                            title={isOccupied ? `Seat ${seatId} is ALREADY OCCUPIED (Click to see alert)` : isWrongCabin ? `Seat ${seatId} is outside your ${flightCabinClass} Class cabin` : `Select Seat ${seatId}`}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                              isOccupied
                                ? '!bg-red-500 !text-white !border-2 !border-red-700 shadow-md font-black cursor-pointer hover:!bg-red-600 hover:scale-105 ring-2 ring-red-300'
                                : isCurrentPassengerSeat
                                  ? 'bg-blue-600 text-white shadow-lg scale-105 border-2 border-blue-400 ring-2 ring-blue-300'
                                  : isSelectedByAny
                                    ? 'bg-indigo-500 text-white shadow'
                                    : isWrongCabin
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-40 hover:opacity-75'
                                      : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            {isOccupied ? '✕' : seatId}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Passenger Information Form */}
        <div className="lg:col-span-6 space-y-6 rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(15,30,92,0.06)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <User className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold leading-tight text-slate-900">Passenger information entry form</h3>
              <p className="text-xs text-slate-500">Provide official passport & contact details for all {passengerCount} passengers</p>
            </div>
          </div>

          {/* Passenger Tabs if multiple passengers */}
          {passengerCount > 1 && (
            <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
              {passengersList.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePassengerIdx(idx)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${activePassengerIdx === idx
                    ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <span>Passenger {idx + 1}: {p.firstName || `Person ${idx + 1}`}</span>
                  {p.seat && <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">Seat {p.seat}</span>}
                </button>
              ))}
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200/80 bg-red-50 p-3 text-xs font-semibold text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">

            {/* Title & Names */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                <select
                  value={activePassenger.title}
                  onChange={(e) => updateActivePassenger({ title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="Mr">Mr.</option>
                  <option value="Ms">Ms.</option>
                  <option value="Mrs">Mrs.</option>
                  <option value="Dr">Dr.</option>
                </select>
              </div>

              <div className="col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={activePassenger.firstName}
                  onChange={(e) => updateActivePassenger({ firstName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="e.g. Alex"
                />
              </div>

              <div className="col-span-5">
                <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={activePassenger.lastName}
                  onChange={(e) => updateActivePassenger({ lastName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="e.g. Morgan"
                />
              </div>
            </div>

            {/* DOB, Passport & Nationality */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={activePassenger.dob}
                  onChange={(e) => updateActivePassenger({ dob: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Passport / National ID *</label>
                <input
                  type="text"
                  value={activePassenger.passport}
                  onChange={(e) => updateActivePassenger({ passport: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="e.g. N9849201"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nationality *</label>
                <input
                  type="text"
                  value={activePassenger.nationality || ''}
                  onChange={(e) => updateActivePassenger({ nationality: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="e.g. Sri Lanka"
                />
              </div>
            </div>

            {/* In-Flight Meal Choice Feature Section */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  In-Flight Dining & Meal Selection ({activePassenger.firstName})
                </label>
                <span className="text-[10px] text-blue-600 font-extrabold bg-blue-50 px-2 py-0.5 rounded-full">
                  Photos & Custom Meal Builder
                </span>
              </div>

              {/* Selected Meal Summary Card / Trigger */}
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-all hover:border-blue-300">
                <div className="flex items-center gap-3 overflow-hidden">
                  {activePassenger.mealDetails?.image ? (
                    <img
                      src={activePassenger.mealDetails.image}
                      alt={activePassenger.mealDetails.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center text-xl shrink-0 shadow-sm">
                      🍱
                    </div>
                  )}

                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {activePassenger.mealDetails?.category || 'In-Flight Meal'}
                      </span>
                      {activePassenger.mealDetails?.price > 0 ? (
                        <span className="text-[9px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          +${activePassenger.mealDetails.price}.00
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          Included (Free)
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-black text-slate-900 truncate mt-0.5">
                      {activePassenger.mealDetails?.name || activePassenger.meal}
                    </h4>

                    <p className="text-[10px] text-slate-500 truncate">
                      {activePassenger.mealDetails?.type === 'CUSTOM'
                        ? `${activePassenger.mealDetails.customDetails?.protein} • ${activePassenger.mealDetails.customDetails?.side}`
                        : activePassenger.mealDetails?.calories || 'Complimentary Gourmet Selection'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMealModalOpen(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-md shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-blue-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Choose Meal</span>
                </button>
              </div>
            </div>

            {/* Extra Baggage Choice */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Extra Check-in Baggage ({activePassenger.firstName})</label>
              <select
                value={activePassenger.extraBaggageKg}
                onChange={(e) => updateActivePassenger({ extraBaggageKg: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              >
                <option value={0}>Included 23kg (Free)</option>
                <option value={5}>+5kg Extra (+$50)</option>
                <option value={10}>+10kg Extra (+$100)</option>
                <option value={20}>+20kg Heavy (+$180)</option>
              </select>
            </div>

            {/* Optional Long Flight Hotel Accommodation Section */}
            <div className="space-y-4 rounded-[1.75rem] border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/40 p-5 shadow-[0_8px_30px_rgb(15,30,92,0.06)] transition-all">

              {/* Hotel Section Header with Long Flight Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Hotel className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-slate-900 tracking-tight">
                        Hotel Accommodation in {activeCountry}
                      </h4>
                      {/* {flightHasLayover && layoverHours >= 8 ? ( */}
                        {/* <span className="text-[10px] bg-emerald-500 text-white font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-300" /> 100% Complimentary Transit Stay (Layover {layoverHours}h ≥ 8h)
                        </span>} */}
                      {isLongFlight ? (
                        <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Long-Haul Flight ({selectedFlight?.duration || '6h+'})
                        </span>
                      ) : (
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                          Optional Stay
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {flightHasLayover && layoverHours >= 8
                        ? `Qualifies for 100% FREE complimentary hotel accommodation under airline transit policy.`
                        : `Select an optional hotel for your stay in ${activeCountry}. (Optional — not required to complete booking)`}
                    </p>
                  </div>
                </div>

                {selectedHotel && (
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1 border ${
                    isHotelComplimentary
                      ? 'text-emerald-700 bg-emerald-100 border-emerald-300'
                      : 'text-indigo-700 bg-indigo-100 border-indigo-300'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isHotelComplimentary ? '100% Free Complimentary Hotel ($0.00)' : `+$${totalHotelFee} Added to Ticket`}
                  </span>
                )}
              </div>

              {/* Destination vs Layover location tabs if layover exists */}
              {selectedFlight?.hasLayover && (
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedLocationTab('DESTINATION')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${selectedLocationTab === 'DESTINATION'
                        ? 'bg-white text-indigo-700 shadow-sm font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Destination: {destinationCity} ({destinationCountry})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLocationTab('LAYOVER')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${selectedLocationTab === 'LAYOVER'
                        ? 'bg-white text-indigo-700 shadow-sm font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Layover: {layoverCity} ({selectedFlight?.layoverAirport})
                  </button>
                </div>
              )}

              {/* Skip vs Add Hotel Selection Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedHotel(null)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${selectedHotel === null
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedHotel === null ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                      }`}>
                      {selectedHotel === null && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">No Hotel Needed</div>
                      <div className="text-[10px] text-slate-500">Skip accommodation (Free)</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">+$0</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!selectedHotel) {
                      const firstHotel = displayHotels[0] || hotelsList[0];
                      setSelectedHotel(firstHotel);
                    }
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${selectedHotel !== null
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedHotel !== null ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                      }`}>
                      {selectedHotel !== null && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        {flightHasLayover && layoverHours >= 8 ? 'Claim Free Hotel Stay' : 'Add Hotel Stay'}
                      </div>
                      <div className="text-[10px] text-indigo-600 font-bold">
                        {displayHotels.length} Hotels in {activeCountry}
                        {flightHasLayover && layoverHours >= 8 && ' (100% Free)'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold ${flightHasLayover && layoverHours >= 8 ? 'text-emerald-600 font-black' : 'text-indigo-600'}`}>
                    {flightHasLayover && layoverHours >= 8 ? 'FREE ($0.00)' : `From $${displayHotels[0]?.pricePerNight || 120}`}
                  </span>
                </button>
              </div>

              {/* If Hotel Stay is Chosen, render Hotel Cards and Room Type Selector */}
              {selectedHotel !== null && (
                <div className="space-y-3 pt-1">

                  {/* Hotel Cards Carousel / Grid */}
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {displayHotels.map((hotel) => {
                      const isSelected = selectedHotel?.id === hotel.id;
                      return (
                        <div
                          key={hotel.id}
                          onClick={() => setSelectedHotel(hotel)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row gap-3.5 ${isSelected
                              ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/30 shadow-md'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                            }`}
                        >
                          <img
                            src={hotel.image}
                            alt={hotel.name}
                            className="w-full sm:w-28 h-24 sm:h-24 rounded-xl object-cover shrink-0"
                          />

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-900 truncate">{hotel.name}</span>
                                  <div className="flex text-amber-400 text-[10px]">
                                    {'★'.repeat(hotel.starRating || 5)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {hotel.city}, {hotel.country}
                                  </span>
                                  <span>•</span>
                                  <span>{hotel.distanceKm} km from {hotel.airportCode}</span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                {flightHasLayover && layoverHours >= (Number(hotel.complimentaryThresholdHours) || 8) ? (
                                  <>
                                    <span className="text-[10px] line-through text-slate-400 font-mono block">${hotel.pricePerNight}</span>
                                    <span className="text-sm font-black text-emerald-600 font-mono block">FREE</span>
                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded block">100% Compl.</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-sm font-black text-indigo-700 font-mono block">
                                      ${hotel.pricePerNight}
                                    </span>
                                    <span className="text-[9px] text-slate-400 block">per night</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Amenity Pills */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {(Array.isArray(hotel.amenities) ? hotel.amenities : AMENITY_PILL_FALLBACK).slice(0, 3).map((amenity, aIdx) => (
                                <span key={aIdx} className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                  {amenity}
                                </span>
                              ))}
                            </div>

                            {/* Select / Selected Button */}
                            <div className="pt-2 flex justify-between items-center">
                              {isSelected ? (
                                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Selected Hotel
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-indigo-600 hover:underline">
                                  Click to Select
                                </span>
                              )}

                              {isSelected && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHotel(null);
                                  }}
                                  className="text-[10px] text-rose-600 font-bold hover:underline"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Room Type and Nights Config for Selected Hotel */}
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                      <span className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-indigo-600" />
                        Room Suite Configuration ({selectedHotel.name})
                      </span>
                      <span className="text-indigo-600 font-mono font-black">${hotelUnitPrice}/night</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {ROOM_TYPES.map((rt) => (
                        <div
                          key={rt.id}
                          onClick={() => setSelectedRoomTypeId(rt.id)}
                          className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${selectedRoomTypeId === rt.id
                              ? 'border-indigo-600 bg-white font-black text-indigo-900 shadow-xs'
                              : 'border-indigo-200 bg-white/60 text-slate-700 hover:bg-white'
                            }`}
                        >
                          <div className="flex justify-between items-center text-[11px]">
                            <span>{rt.name}</span>
                            <span className="text-indigo-600 font-bold">{rt.priceAdd > 0 ? `+$${rt.priceAdd}` : 'Base'}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 font-normal mt-0.5 line-clamp-1">{rt.description}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-indigo-200/60">
                      <label className="font-bold text-slate-700">Duration of Hotel Stay:</label>
                      <select
                        value={hotelNights}
                        onChange={(e) => setHotelNights(Number(e.target.value))}
                        className="bg-white border border-indigo-200 rounded-lg px-3 py-1 font-bold text-xs text-indigo-900 outline-none"
                      >
                        <option value={1}>1 Night (${hotelUnitPrice})</option>
                        <option value={2}>2 Nights (${hotelUnitPrice * 2})</option>
                        <option value={3}>3 Nights (${hotelUnitPrice * 3})</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price Summary Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Base Airfare ({passengerCount} {passengerCount === 1 ? 'Passenger' : 'Passengers'} x ${unitPrice}):</span>
                <span className="font-bold text-slate-900">${baseFlightPrice.toLocaleString()}</span>
              </div>
              {totalBaggageFee > 0 && (
                <div className="flex items-center justify-between text-xs text-blue-600 font-medium">
                  <span>Total Baggage Addons:</span>
                  <span className="font-bold">+${totalBaggageFee}</span>
                </div>
              )}
              {totalMealFee > 0 && (
                <div className="flex items-center justify-between text-xs text-amber-700 font-medium">
                  <span>Total Dining Addons:</span>
                  <span className="font-bold">+${totalMealFee}</span>
                </div>
              )}
              {selectedHotel && (
                <div className={`flex items-center justify-between text-xs font-semibold px-2.5 py-1.5 rounded-xl border ${
                  isHotelComplimentary
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-indigo-700 bg-indigo-50/70 border-indigo-100'
                }`}>
                  <span className="truncate pr-2">
                    🏨 Transit Hotel ({selectedHotel.name} • {selectedRoomTypeObj.name} • {hotelNights} {hotelNights === 1 ? 'night' : 'nights'}):
                  </span>
                  <span className="font-black shrink-0">
                    {isHotelComplimentary ? 'FREE ($0.00)' : `+$${totalHotelFee}.00`}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Reservation Total</span>
                  <div className="text-xl font-extrabold text-slate-900">
                    ${grandTotal.toLocaleString()}
                  </div>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-700 px-2.5 py-1 rounded-full font-bold">
                  Status: Pending Payment
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onBackToResults}
                className="rounded-2xl border border-slate-200 px-6 py-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Back to results
              </button>

              <button
                type="submit"
                className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-blue-700 hover:shadow-blue-600/40 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
              >
                <span>Confirm & proceed to payment (${grandTotal.toLocaleString()})</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Interactive Photo & Custom Meal Modal */}
      <MealSelectionModal
        isOpen={isMealModalOpen}
        onClose={() => {
          setIsMealModalOpen(false);
          if (initialOpenMealModal && onCloseMealModal) {
            onCloseMealModal();
          }
        }}
        selectedMeal={activePassenger.mealDetails}
        onSelectMeal={(selectedMealObj) => {
          updateActivePassenger({
            meal: selectedMealObj.name,
            mealDetails: selectedMealObj
          });
          if (initialOpenMealModal && onCloseMealModal) {
            onCloseMealModal();
          }
        }}
      />

      {/* Occupied Seat Alert Popup Modal */}
      {occupiedModalSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-red-200 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 border border-red-200 shadow-inner">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Seat {occupiedModalSeat} Is Already Occupied!</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Seat <strong>{occupiedModalSeat}</strong> on flight <strong>{selectedFlight?.flightNumber || 'this flight'}</strong> has already been reserved and confirmed by another passenger.
              </p>
              <div className="mt-3 text-xs text-red-700 font-bold bg-red-50 p-3 rounded-2xl border border-red-200 flex items-center gap-2 text-left">
                <span className="text-base">🔒</span>
                <span>Seats cannot be duplicated or re-assigned unless the previous booking is cancelled and refunded.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOccupiedModalSeat(null)}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-black text-white transition hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
            >
              Choose Another Free Seat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}