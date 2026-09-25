import React, { useMemo, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Hotel,
  Globe,
  BedDouble,
  Star,
} from 'lucide-react';
import {
  fetchHotelsApi,
  createHotelApi,
  updateHotelApi,
  deleteHotelApi,
  fetchHotelBookingsApi,
  updateHotelBookingStatusApi,
  deleteHotelBookingApi
} from '../../api/apiService';

const DEFAULT_AMENITIES = ['Free Shuttle 24/7', 'Buffet Breakfast', 'Rooftop Pool', 'Wi-Fi'];
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

const EMPTY_FORM = {
  name: '',
  city: '',
  country: '',
  airportCode: '',
  starRating: 4,
  pricePerNight: '',
  availableRooms: 30,
  distanceKm: 1,
  complimentaryThresholdHours: 8,
  shuttleService: true,
  image: '',
  amenities: '',
};

function parseAmenities(amenities) {
  if (Array.isArray(amenities)) return amenities.map((a) => String(a).trim()).filter(Boolean);
  if (typeof amenities === 'string' && amenities.trim()) {
    return amenities.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_AMENITIES;
}

export function formatHotelFromApi(h) {
  const airportCode = h.airportCode || '';
  return {
    id: h.hotelId ? `HT-${h.hotelId}` : h.id,
    rawId: h.hotelId,
    name: h.name,
    airportCode,
    city: h.city || '',
    country: h.country || (
      airportCode === 'LHR' ? 'United Kingdom' :
        airportCode === 'JFK' ? 'USA' :
          airportCode === 'DXB' ? 'UAE' :
            airportCode === 'HND' ? 'Japan' :
              airportCode === 'SIN' ? 'Singapore' :
                airportCode === 'SYD' ? 'Australia' :
                  airportCode === 'CMB' ? 'Sri Lanka' : 'International'
    ),
    starRating: h.starRating || 4,
    pricePerNight: Number(h.pricePerNight) || 0,
    complimentaryThresholdHours: h.complimentaryThresholdHours || 8,
    availableRooms: h.availableRooms ?? 0,
    distanceKm: h.distanceKm ?? 1.0,
    shuttleService: h.shuttleService ?? true,
    amenities: parseAmenities(h.amenities),
    amenitiesRaw: Array.isArray(h.amenities) ? h.amenities.join(', ') : (h.amenities || ''),
    image: h.image || DEFAULT_IMAGE,
  };
}

function hotelToForm(hotel) {
  return {
    name: hotel.name || '',
    city: hotel.city || '',
    country: hotel.country || '',
    airportCode: hotel.airportCode || '',
    starRating: hotel.starRating ?? 4,
    pricePerNight: hotel.pricePerNight ?? '',
    availableRooms: hotel.availableRooms ?? 0,
    distanceKm: hotel.distanceKm ?? 1,
    complimentaryThresholdHours: hotel.complimentaryThresholdHours ?? 8,
    shuttleService: hotel.shuttleService ?? true,
    image: hotel.image || '',
    amenities: hotel.amenitiesRaw || (Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : ''),
  };
}

function payloadFromForm(form) {
  return {
    name: form.name.trim(),
    city: form.city.trim(),
    country: form.country.trim(),
    airportCode: form.airportCode.trim().toUpperCase(),
    starRating: Number(form.starRating),
    pricePerNight: Number(form.pricePerNight),
    availableRooms: Number(form.availableRooms),
    distanceKm: Number(form.distanceKm),
    complimentaryThresholdHours: Number(form.complimentaryThresholdHours),
    shuttleService: Boolean(form.shuttleService),
    image: form.image.trim(),
    amenities: form.amenities.trim(),
  };
}

function validateHotelForm(form) {
  const errors = {};
  const name = form.name.trim();
  const city = form.city.trim();
  const country = form.country.trim();
  const airportCode = form.airportCode.trim().toUpperCase();
  const image = form.image.trim();

  if (name.length < 2) errors.name = 'Hotel name is required (at least 2 characters)';
  if (city.length < 2) errors.city = 'City is required (at least 2 characters)';
  if (country.length < 2) errors.country = 'Country is required (at least 2 characters)';
  if (!/^[A-Z]{3}$/.test(airportCode)) errors.airportCode = 'Airport code must be exactly 3 letters (e.g. DXB)';

  const stars = Number(form.starRating);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) errors.starRating = 'Star rating must be between 1 and 5';

  const price = Number(form.pricePerNight);
  if (!form.pricePerNight || Number.isNaN(price) || price <= 0) {
    errors.pricePerNight = 'Price per night must be greater than 0';
  }

  const rooms = Number(form.availableRooms);
  if (form.availableRooms === '' || Number.isNaN(rooms) || rooms < 0 || !Number.isInteger(rooms)) {
    errors.availableRooms = 'Available rooms must be a whole number of 0 or more';
  }

  const distance = Number(form.distanceKm);
  if (form.distanceKm === '' || Number.isNaN(distance) || distance < 0) {
    errors.distanceKm = 'Distance must be 0 or greater';
  }

  const hours = Number(form.complimentaryThresholdHours);
  if (!Number.isInteger(hours) || hours < 1 || hours > 24) {
    errors.complimentaryThresholdHours = 'Complimentary hours must be between 1 and 24';
  }

  if (image && !image.startsWith('http://') && !image.startsWith('https://')) {
    errors.image = 'Image URL must start with http:// or https://';
  }

  return errors;
}

function fieldClass(hasError) {
  return `w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none text-slate-900 ${hasError ? 'border-red-400 ring-2 ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20'
    }`;
}

export default function HotelManagerPortal({ hotels = [], onHotelsUpdated, onBookingsUpdated }) {
  const [activeSubTab, setActiveSubTab] = useState('hotels'); // 'hotels' | 'bookings'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Bookings Desk State
  const [bookings, setBookings] = useState([]);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');

  const showNotification = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4500);
  };

  const loadHotelsFromBackend = async () => {
    setLoading(true);
    try {
      const data = await fetchHotelsApi();
      if (Array.isArray(data)) {
        const formatted = data.map(formatHotelFromApi);
        onHotelsUpdated && onHotelsUpdated(formatted);
        showNotification('success', `Synced ${formatted.length} hotels from the database.`);
      }
    } catch (err) {
      showNotification('error', err.message || 'Could not sync hotels from the database.');
    } finally {
      setLoading(false);
    }
  };

  const loadBookingsFromBackend = async () => {
    setLoading(true);
    try {
      const data = await fetchHotelBookingsApi();
      if (Array.isArray(data)) {
        setBookings(data);
        showNotification('success', `Loaded ${data.length} guest hotel bookings.`);
      }
    } catch (err) {
      showNotification('error', err.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadBookingsFromBackend();
  }, []);

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await updateHotelBookingStatusApi(bookingId, status);
      setBookings((prev) =>
        prev.map((b) =>
          (b.hotelBookingId === bookingId || b.id === bookingId)
            ? { ...b, bookingStatus: status }
            : b
        )
      );
      showNotification('success', `Booking #${bookingId} status updated to ${status}.`);
      onBookingsUpdated && onBookingsUpdated();
    } catch (err) {
      showNotification('error', err.message || 'Could not update status.');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm(`Delete booking record #${bookingId}?`)) return;
    try {
      await deleteHotelBookingApi(bookingId);
      setBookings((prev) => prev.filter((b) => b.hotelBookingId !== bookingId && b.id !== bookingId));
      showNotification('success', `Booking #${bookingId} deleted.`);
      onBookingsUpdated && onBookingsUpdated();
    } catch (err) {
      showNotification('error', err.message || 'Could not delete booking.');
    }
  };

  const filteredHotels = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return hotels;
    return hotels.filter((h) =>
      [h.name, h.city, h.country, h.airportCode].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [hotels, searchTerm]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = bookingStatusFilter === 'ALL' || b.bookingStatus === bookingStatusFilter;
      const q = bookingSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(b.voucherCode || '').toLowerCase().includes(q) ||
        String(b.pnrCode || '').toLowerCase().includes(q) ||
        String(b.passengerName || '').toLowerCase().includes(q) ||
        String(b.guestEmail || '').toLowerCase().includes(q) ||
        String(b.hotelName || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, bookingSearch, bookingStatusFilter]);

  const totalRooms = hotels.reduce((sum, h) => sum + (Number(h.availableRooms) || 0), 0);
  const countryCount = new Set(hotels.map((h) => h.country).filter(Boolean)).size;

  const openAddModal = () => {
    setEditingHotel(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (hotel) => {
    setEditingHotel(hotel);
    setForm(hotelToForm(hotel));
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHotel(null);
    setErrors({});
    setForm(EMPTY_FORM);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateHotelForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      showNotification('error', Object.values(nextErrors)[0]);
      return;
    }

    const payload = payloadFromForm(form);
    setSaving(true);
    try {
      if (editingHotel?.rawId) {
        await updateHotelApi(editingHotel.rawId, payload);
        showNotification('success', `${payload.name} was updated in the database.`);
      } else {
        await createHotelApi(payload);
        showNotification('success', `${payload.name} was saved to the database.`);
      }
      const data = await fetchHotelsApi();
      if (Array.isArray(data)) {
        onHotelsUpdated && onHotelsUpdated(data.map(formatHotelFromApi));
      }
      closeModal();
    } catch (err) {
      showNotification('error', err.message || 'Could not save hotel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hotel) => {
    if (!hotel.rawId) {
      showNotification('error', 'This hotel has no database id and cannot be deleted.');
      return;
    }
    const confirmed = window.confirm(`Remove "${hotel.name}" from partner inventory? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteHotelApi(hotel.rawId);
      const remaining = hotels.filter((h) => h.rawId !== hotel.rawId);
      onHotelsUpdated && onHotelsUpdated(remaining);
      showNotification('success', `${hotel.name} was removed from the database.`);
    } catch (err) {
      showNotification('error', err.message || 'Cannot delete: hotel has existing bookings.');
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= Sub-navigation Tabs ================= */}
      <div className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 text-xs font-bold sm:inline-grid sm:w-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('hotels')}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all ${
            activeSubTab === 'hotels'
              ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Hotel className="h-4 w-4" />
          <span>Partner Hotel Inventory ({hotels.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bookings')}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all ${
            activeSubTab === 'bookings'
              ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BedDouble className="h-4 w-4" />
          <span>Guest Bookings & Check-In ({bookings.length})</span>
        </button>
      </div>

      <div className="hero-gradient text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
            <span>Hotel Manager Portal</span>
            <span>•</span>
            <span>SQL Database Synchronized</span>
          </div>
          <h3 className="text-2xl font-extrabold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-200" />
            {activeSubTab === 'hotels' ? 'Partner Hotel Inventory' : 'Guest Transit Bookings Desk'}
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {activeSubTab === 'hotels'
              ? 'Add, update, or remove layover partner hotels. Changes are saved to the SQL database and appear on passenger booking views.'
              : 'Manage passenger transit hotel reservations, verify voucher codes, and process hotel check-in/checkout.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={activeSubTab === 'hotels' ? loadHotelsFromBackend : loadBookingsFromBackend}
            disabled={loading}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl flex items-center gap-2 border border-white/20 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync DB
          </button>
          {activeSubTab === 'hotels' && (
            <button
              type="button"
              onClick={openAddModal}
              className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Hotel
            </button>
          )}
        </div>
      </div>

      {feedbackMsg.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md ${feedbackMsg.type === 'error'
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'error'
              ? <AlertTriangle className="w-4 h-4" />
              : <CheckCircle2 className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMsg({ type: '', text: '' })} className="p-1 rounded hover:bg-black/5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= VIEW 1: HOTELS INVENTORY ================= */}
      {activeSubTab === 'hotels' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Hotel className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Partner Hotels</span>
                <div className="text-xl font-extrabold text-slate-900">{hotels.length} Registered</div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Countries Covered</span>
                <div className="text-xl font-extrabold text-slate-900">{countryCount} Countries</div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <BedDouble className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Available Rooms</span>
                <div className="text-xl font-extrabold text-slate-900">{totalRooms} Rooms</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, city, country, or airport code..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <span className="text-xs text-slate-500 font-semibold">Showing {filteredHotels.length} hotels</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Hotel</th>
                    <th className="p-3.5">Airport</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Stars</th>
                    <th className="p-3.5">Nightly Rate</th>
                    <th className="p-3.5">Rooms</th>
                    <th className="p-3.5">Shuttle</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHotels.length > 0 ? (
                    filteredHotels.map((h) => (
                      <tr key={h.id || h.rawId} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-900">{h.name}</td>
                        <td className="p-3.5 font-mono font-extrabold text-blue-700">
                          <span className="bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">{h.airportCode}</span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-semibold">{h.city}, {h.country}</td>
                        <td className="p-3.5 font-bold text-amber-600">
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400" /> {h.starRating}
                          </span>
                        </td>
                        <td className="p-3.5 font-extrabold text-blue-600">${h.pricePerNight}</td>
                        <td className="p-3.5 font-bold text-slate-900">{h.availableRooms}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${h.shuttleService ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {h.shuttleService ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditModal(h)}
                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-[11px] font-bold border border-sky-200"
                          >
                            <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(h)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-bold border border-red-200"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 text-xs font-semibold">
                        {searchTerm ? `No hotels found matching "${searchTerm}".` : 'No partner hotels yet. Click Add Hotel to create one.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================= VIEW 2: GUEST BOOKINGS DESK ================= */}
      {activeSubTab === 'bookings' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search Voucher Code, PNR, Guest Name, Email..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              {['ALL', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'].map((st) => {
                const active = bookingStatusFilter === st;
                const count = st === 'ALL'
                  ? bookings.length
                  : bookings.filter(b => b.bookingStatus === st).length;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setBookingStatusFilter(st)}
                    className={`rounded-lg px-2.5 py-1.5 transition-all ${
                      active
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{st.replace('_', ' ')}</span>
                    <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Voucher Code</th>
                  <th className="p-3.5">PNR</th>
                  <th className="p-3.5">Passenger</th>
                  <th className="p-3.5">Hotel / Room</th>
                  <th className="p-3.5">Type & Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => (
                    <tr key={b.hotelBookingId || b.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-black text-blue-600">{b.voucherCode}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">{b.pnrCode || '-'}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{b.passengerName || 'Guest'}</div>
                        <div className="text-[11px] text-slate-500">{b.guestEmail}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{b.hotelName}</div>
                        <div className="text-[11px] text-slate-500">{b.roomType}</div>
                      </td>
                      <td className="p-3.5">
                        {b.isComplimentary ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                            Free Layover
                          </span>
                        ) : (
                          <span className="font-extrabold text-slate-900">${b.amount || 0}</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          b.bookingStatus === 'CHECKED_IN'
                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                            : b.bookingStatus === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                            : b.bookingStatus === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                            : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {b.bookingStatus || 'CONFIRMED'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {b.bookingStatus !== 'CHECKED_IN' && b.bookingStatus !== 'COMPLETED' && b.bookingStatus !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b.hotelBookingId || b.id, 'CHECKED_IN')}
                            className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700"
                          >
                            Check-In
                          </button>
                        )}
                        {b.bookingStatus === 'CHECKED_IN' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b.hotelBookingId || b.id, 'COMPLETED')}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700"
                          >
                            Check-Out
                          </button>
                        )}
                        {b.bookingStatus !== 'CANCELLED' && b.bookingStatus !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(b.hotelBookingId || b.id, 'CANCELLED')}
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(b.hotelBookingId || b.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                          title="Delete record"
                        >
                          <Trash2 className="h-3.5 w-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs font-semibold">
                      {bookingSearch ? `No hotel bookings found matching "${bookingSearch}".` : 'No guest hotel bookings recorded yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                {editingHotel ? <Edit3 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                {editingHotel ? `Update ${editingHotel.name}` : 'Add Partner Hotel'}
              </h3>
              <button type="button" onClick={closeModal} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hotel Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. SkyHaven Airport Resort"
                  className={fieldClass(errors.name)}
                />
                {errors.name && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Dubai"
                    className={fieldClass(errors.city)}
                  />
                  {errors.city && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Country *</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="UAE"
                    className={fieldClass(errors.country)}
                  />
                  {errors.country && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.country}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Airport Code *</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={form.airportCode}
                    onChange={(e) => handleChange('airportCode', e.target.value.toUpperCase())}
                    placeholder="DXB"
                    className={`${fieldClass(errors.airportCode)} font-mono uppercase`}
                  />
                  {errors.airportCode && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.airportCode}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Star Rating (1–5) *</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.starRating}
                    onChange={(e) => handleChange('starRating', e.target.value)}
                    className={fieldClass(errors.starRating)}
                  />
                  {errors.starRating && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.starRating}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price / Night (USD) *</label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={form.pricePerNight}
                    onChange={(e) => handleChange('pricePerNight', e.target.value)}
                    placeholder="120"
                    className={fieldClass(errors.pricePerNight)}
                  />
                  {errors.pricePerNight && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.pricePerNight}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Available Rooms *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.availableRooms}
                    onChange={(e) => handleChange('availableRooms', e.target.value)}
                    className={fieldClass(errors.availableRooms)}
                  />
                  {errors.availableRooms && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.availableRooms}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Distance (km) *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={form.distanceKm}
                    onChange={(e) => handleChange('distanceKm', e.target.value)}
                    className={fieldClass(errors.distanceKm)}
                  />
                  {errors.distanceKm && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.distanceKm}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Complimentary Hours (1–24)</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={form.complimentaryThresholdHours}
                    onChange={(e) => handleChange('complimentaryThresholdHours', e.target.value)}
                    className={fieldClass(errors.complimentaryThresholdHours)}
                  />
                  {errors.complimentaryThresholdHours && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.complimentaryThresholdHours}</p>
                  )}
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.shuttleService}
                      onChange={(e) => handleChange('shuttleService', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    Airport shuttle available
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image URL (optional)</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => handleChange('image', e.target.value)}
                  placeholder="https://..."
                  className={fieldClass(errors.image)}
                />
                {errors.image && <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.image}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={form.amenities}
                  onChange={(e) => handleChange('amenities', e.target.value)}
                  placeholder="Free Shuttle, Breakfast, Wi-Fi"
                  className={fieldClass(false)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingHotel ? 'Update & Save Changes' : 'Save Hotel to SQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
