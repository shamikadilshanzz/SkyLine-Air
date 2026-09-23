import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Plus,
  RefreshCw,
  Printer,
  Plane,
  User,
  Mail,
  Phone,
  ShieldCheck,
  DollarSign,
  Luggage,
  Utensils,
  ChevronDown,
  Copy,
  Check,
  Calendar,
  Building2,
  Sparkles,
  X,
  FileText,
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import {
  fetchReservationsApi,
  updateReservationApi,
  deleteReservationApi,
  deleteReservationByPnrApi,
  createReservationApi
} from '../../api/apiService';

/* ---------- Shared Design System Tokens ---------- */
const CARD = 'rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,30,92,0.06)]';
const NAVY = 'bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8]';
const PRIMARY_BTN =
  'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.98]';
const LABEL = 'mb-1.5 block text-xs font-bold text-slate-700';
const INPUT =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:text-slate-400';

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmed', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, dot: 'bg-emerald-500' },
  CHECKED_IN: { label: 'Checked In', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: ShieldCheck, dot: 'bg-purple-500' },
  PENDING_PAYMENT: { label: 'Pending Payment', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, dot: 'bg-amber-500' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, dot: 'bg-red-500' }
};

const CABIN_CONFIG = {
  FIRST: { label: 'First Class', badge: 'bg-amber-50 text-amber-800 border-amber-300 font-bold', color: '#f59e0b' },
  BUSINESS: { label: 'Business Class', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold', color: '#6366f1' },
  ECONOMY: { label: 'Economy Class', badge: 'bg-blue-50 text-blue-700 border-blue-200 font-medium', color: '#3b82f6' }
};

export default function ReservationManagementView({ currentRole, user }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cabinFilter, setCabinFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [copiedPnr, setCopiedPnr] = useState(null);

  // Modal States
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Counter Booking Form State
  const [newBooking, setNewBooking] = useState({
    userName: '',
    userEmail: '',
    flightNumber: 'SL-204',
    origin: 'CMB',
    destination: 'LHR',
    departureTime: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    cabinClass: 'ECONOMY',
    totalAmount: 780,
    bookingStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    paymentMethod: 'COUNTER_CASH',
    passengerTitle: 'Mr',
    passengerFirstName: '',
    passengerLastName: '',
    passengerPassport: '',
    passengerSeat: '18A',
    passengerMeal: 'Standard',
    passengerBaggageKg: 0
  });

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadReservations = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await fetchReservationsApi();
      if (Array.isArray(data)) {
        // Format & normalize backend entities
        const normalized = data.map((r) => {
          const rawCabin = r.cabinClass || (r.passengers && r.passengers[0]?.cabinClass) || 'ECONOMY';
          const passengers = Array.isArray(r.passengers) && r.passengers.length > 0
            ? r.passengers.map((p) => ({
                id: p.passengerId,
                title: p.title || 'Mr',
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                fullName: `${p.title || ''} ${p.firstName || ''} ${p.lastName || ''}`.trim() || r.userName || 'Passenger',
                passport: p.passportNumber || p.passport || 'N/A',
                seat: p.seatNumber || p.seat || '12B',
                cabinClass: (p.cabinClass || rawCabin).toUpperCase(),
                meal: p.mealPreference || 'Standard',
                baggage: p.extraBaggageKg || 0
              }))
            : [
                {
                  id: 1,
                  title: 'Mr',
                  firstName: r.userName ? r.userName.split(' ')[0] : 'Alex',
                  lastName: r.userName ? r.userName.split(' ').slice(1).join(' ') : 'Morgan',
                  fullName: r.userName || 'Alex Morgan',
                  passport: 'N9849201',
                  seat: '14A',
                  cabinClass: rawCabin.toUpperCase(),
                  meal: 'Standard',
                  baggage: 0
                }
              ];

          return {
            id: r.reservationId || r.id,
            rawId: r.reservationId || (typeof r.id === 'number' ? r.id : parseInt(String(r.id || '0').replace(/\D/g, ''), 10)),
            pnr: r.pnrCode || r.pnr || 'SK-000000',
            userId: r.userId,
            userName: r.userName || (passengers[0] ? passengers[0].fullName : 'Guest Passenger'),
            userEmail: r.userEmail || 'guest@skyline.com',
            flightId: r.flightId,
            flightNumber: r.flightNumber || 'SL-204',
            origin: r.origin || 'CMB',
            destination: r.destination || 'LHR',
            departureTime: r.departureTime || new Date().toISOString(),
            bookingDate: r.bookingDate || new Date().toISOString(),
            cabinClass: rawCabin.toUpperCase(),
            totalAmount: Number(r.totalAmount || 0),
            bookingStatus: (r.bookingStatus || r.status || 'CONFIRMED').toUpperCase(),
            paymentStatus: (r.paymentStatus || 'PAID').toUpperCase(),
            paymentMethod: r.paymentMethod || 'CREDIT_CARD',
            transactionRef: r.transactionRef || `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
            hasLayover: Boolean(r.hasLayover),
            layoverCity: r.layoverCity,
            layoverAirport: r.layoverAirport,
            layoverDurationHours: r.layoverDurationHours || 0,
            hotelBooked: Boolean(r.hotelBooked),
            hotelName: r.hotelName,
            hotelVoucherCode: r.hotelVoucherCode,
            passengers
          };
        });
        setReservations(normalized);
      }
    } catch (err) {
      console.warn('[ReservationDesk] Failed to load reservations from backend API:', err.message);
      showToast('Could not reach backend API server. Showing cached or local state.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleCopyPnr = (pnr) => {
    navigator.clipboard.writeText(pnr);
    setCopiedPnr(pnr);
    setTimeout(() => setCopiedPnr(null), 2000);
  };

  /* ---------- Filtering and Sorting Logic ---------- */
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      // Search matches
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        r.pnr.toLowerCase().includes(term) ||
        r.userName.toLowerCase().includes(term) ||
        r.userEmail.toLowerCase().includes(term) ||
        r.flightNumber.toLowerCase().includes(term) ||
        r.origin.toLowerCase().includes(term) ||
        r.destination.toLowerCase().includes(term) ||
        r.passengers.some((p) =>
          p.fullName.toLowerCase().includes(term) ||
          p.passport.toLowerCase().includes(term) ||
          p.seat.toLowerCase().includes(term)
        );

      // Status filter
      const matchStatus = statusFilter === 'ALL' || r.bookingStatus === statusFilter;

      // Cabin filter
      const matchCabin = cabinFilter === 'ALL' || r.cabinClass === cabinFilter;

      // Payment filter
      const matchPayment = paymentFilter === 'ALL' || r.paymentStatus === paymentFilter;

      return matchSearch && matchStatus && matchCabin && matchPayment;
    }).sort((a, b) => {
      if (sortBy === 'DATE_DESC') return new Date(b.bookingDate) - new Date(a.bookingDate);
      if (sortBy === 'DATE_ASC') return new Date(a.bookingDate) - new Date(b.bookingDate);
      if (sortBy === 'AMOUNT_HIGH') return b.totalAmount - a.totalAmount;
      if (sortBy === 'AMOUNT_LOW') return a.totalAmount - b.totalAmount;
      if (sortBy === 'PNR') return a.pnr.localeCompare(b.pnr);
      if (sortBy === 'FLIGHT') return a.flightNumber.localeCompare(b.flightNumber);
      return 0;
    });
  }, [reservations, searchTerm, statusFilter, cabinFilter, paymentFilter, sortBy]);

  /* ---------- Statistics Calculation ---------- */
  const stats = useMemo(() => {
    const total = reservations.length;
    const confirmed = reservations.filter((r) => r.bookingStatus === 'CONFIRMED').length;
    const checkedIn = reservations.filter((r) => r.bookingStatus === 'CHECKED_IN').length;
    const pending = reservations.filter((r) => r.bookingStatus === 'PENDING_PAYMENT').length;
    const cancelled = reservations.filter((r) => r.bookingStatus === 'CANCELLED').length;
    const revenue = reservations
      .filter((r) => r.bookingStatus !== 'CANCELLED')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    return { total, confirmed, checkedIn, pending, cancelled, revenue };
  }, [reservations]);

  /* ---------- Quick Status Update ---------- */
  const handleQuickStatusChange = async (resId, newStatus) => {
    try {
      await updateReservationApi(resId, { bookingStatus: newStatus, status: newStatus });
      setReservations((prev) =>
        prev.map((r) => (r.rawId === resId || r.id === resId ? { ...r, bookingStatus: newStatus } : r))
      );
      showToast(`Reservation status updated to ${newStatus}`);
    } catch (err) {
      showToast(`Failed to update status: ${err.message}`, 'error');
    }
  };

  /* ---------- Edit Modal Handler ---------- */
  const handleOpenEdit = (res) => {
    setSelectedReservation(res);
    setEditFormData({
      rawId: res.rawId || res.id,
      pnr: res.pnr,
      userName: res.userName,
      userEmail: res.userEmail,
      flightNumber: res.flightNumber,
      origin: res.origin,
      destination: res.destination,
      departureTime: res.departureTime,
      cabinClass: res.cabinClass,
      totalAmount: res.totalAmount,
      bookingStatus: res.bookingStatus,
      paymentStatus: res.paymentStatus,
      paymentMethod: res.paymentMethod,
      passengers: res.passengers.map((p) => ({ ...p }))
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData) return;
    setSavingEdit(true);

    try {
      const payload = {
        cabinClass: editFormData.cabinClass,
        bookingStatus: editFormData.bookingStatus,
        status: editFormData.bookingStatus,
        paymentStatus: editFormData.paymentStatus,
        paymentMethod: editFormData.paymentMethod,
        userName: editFormData.userName,
        userEmail: editFormData.userEmail,
        flightNumber: editFormData.flightNumber,
        origin: editFormData.origin,
        destination: editFormData.destination,
        departureTime: editFormData.departureTime,
        totalAmount: editFormData.totalAmount,
        passengers: editFormData.passengers.map((p) => ({
          passengerId: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          seatNumber: p.seat,
          seat: p.seat,
          passportNumber: p.passport,
          passport: p.passport,
          cabinClass: editFormData.cabinClass,
          mealPreference: p.meal,
          extraBaggageKg: Number(p.baggage || 0)
        }))
      };

      await updateReservationApi(editFormData.rawId, payload);
      setReservations((prev) =>
        prev.map((r) =>
          r.rawId === editFormData.rawId || r.id === editFormData.rawId
            ? {
                ...r,
                ...payload,
                passengers: editFormData.passengers.map((p) => ({
                  ...p,
                  fullName: `${p.title || ''} ${p.firstName} ${p.lastName}`.trim(),
                  cabinClass: editFormData.cabinClass
                }))
              }
            : r
        )
      );
      setEditModalOpen(false);
      showToast(`Reservation ${editFormData.pnr} updated successfully in SQL database!`);
    } catch (err) {
      showToast(`Error updating reservation: ${err.message}`, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  /* ---------- Delete Modal Handler ---------- */
  const handleOpenDelete = (res) => {
    setSelectedReservation(res);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReservation) return;
    setDeletingRecord(true);

    try {
      if (selectedReservation.rawId) {
        await deleteReservationApi(selectedReservation.rawId);
      } else if (selectedReservation.pnr) {
        await deleteReservationByPnrApi(selectedReservation.pnr);
      }

      setReservations((prev) =>
        prev.filter((r) => r.id !== selectedReservation.id && r.pnr !== selectedReservation.pnr)
      );
      setDeleteModalOpen(false);
      showToast(`Reservation PNR: ${selectedReservation.pnr} permanently deleted from SQL database.`, 'success');
      setSelectedReservation(null);
    } catch (err) {
      showToast(`Failed to delete reservation: ${err.message}`, 'error');
    } finally {
      setDeletingRecord(false);
    }
  };

  /* ---------- Counter Booking Creation Handler ---------- */
  const handleCreateCounterReservation = async (e) => {
    e.preventDefault();
    setSavingEdit(true);

    try {
      const generatedPnr = `SK-${Math.floor(100000 + Math.random() * 900000)}`;
      const payload = {
        pnrCode: generatedPnr,
        userId: user?.rawId || 1,
        userName: newBooking.userName || `${newBooking.passengerFirstName} ${newBooking.passengerLastName}`.trim() || 'Counter Passenger',
        userEmail: newBooking.userEmail || 'counter.desk@skyline.com',
        flightNumber: newBooking.flightNumber,
        origin: newBooking.origin,
        destination: newBooking.destination,
        departureTime: newBooking.departureTime,
        cabinClass: newBooking.cabinClass,
        totalAmount: Number(newBooking.totalAmount),
        bookingStatus: newBooking.bookingStatus,
        paymentStatus: newBooking.paymentStatus,
        paymentMethod: newBooking.paymentMethod,
        passengers: [
          {
            title: newBooking.passengerTitle,
            firstName: newBooking.passengerFirstName || 'Alex',
            lastName: newBooking.passengerLastName || 'Morgan',
            passportNumber: newBooking.passengerPassport || 'N9849201',
            seatNumber: newBooking.passengerSeat || '14A',
            cabinClass: newBooking.cabinClass,
            mealPreference: newBooking.passengerMeal || 'Standard',
            extraBaggageKg: Number(newBooking.passengerBaggageKg || 0)
          }
        ]
      };

      const created = await createReservationApi(payload);
      showToast(`Counter reservation issued successfully! PNR: ${created.pnrCode || generatedPnr}`);
      setCreateModalOpen(false);
      await loadReservations(true);
    } catch (err) {
      showToast(`Failed to issue counter reservation: ${err.message}`, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const fmtDateTime = (v) => {
    if (!v) return '-';
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-bold shadow-2xl transition-all ${
            toastMessage.type === 'error'
              ? 'border border-red-500/30 bg-red-900/90 text-red-100 backdrop-blur-md'
              : 'border border-emerald-500/30 bg-slate-900/90 text-white backdrop-blur-md'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="h-5 w-5 text-red-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Hero / Header Section */}
      <div className={`relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-8 ${NAVY} mb-8 shadow-xl shadow-blue-950/20`}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2.5">
              <span className="flex h-8 items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/15 px-3 text-xs font-bold text-sky-300 backdrop-blur-sm">
                <Ticket className="h-3.5 w-3.5" /> Ticketing Officer Operations
              </span>
              <span className="flex h-8 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 text-xs font-bold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live SQL Database Sync
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              Reservation Management Desk
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-300">
              View, issue, modify, and manage all passenger ticket reservations in real time. Manage seat assignments, cabin classes, and database cancellations.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadReservations(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Sync Database'}
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-[#0a1230] shadow-lg shadow-black/20 transition hover:bg-blue-50 active:scale-95"
            >
              <Plus className="h-4 w-4 text-blue-600" /> Issue Counter Booking
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className={`${CARD} p-4 text-left transition hover:border-slate-300`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bookings</span>
            <Ticket className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <span className="text-[11px] font-semibold text-slate-500">Active records</span>
        </div>

        <div className={`${CARD} p-4 text-left transition hover:border-slate-300`}>
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirmed</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.confirmed}</div>
          <span className="text-[11px] font-semibold text-emerald-600/80">Issued & Valid</span>
        </div>

        <div className={`${CARD} p-4 text-left transition hover:border-slate-300`}>
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Checked In</span>
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-purple-600">{stats.checkedIn}</div>
          <span className="text-[11px] font-semibold text-purple-600/80">Boarding ready</span>
        </div>

        <div className={`${CARD} p-4 text-left transition hover:border-slate-300`}>
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.pending}</div>
          <span className="text-[11px] font-semibold text-amber-600/80">Awaiting payment</span>
        </div>

        <div className={`${CARD} p-4 text-left transition hover:border-slate-300`}>
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cancelled</span>
            <XCircle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-red-600">{stats.cancelled}</div>
          <span className="text-[11px] font-semibold text-red-600/80">Voided tickets</span>
        </div>

        <div className={`${CARD} p-4 text-left transition hover:border-slate-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-blue-100`}>
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Total Revenue</span>
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-blue-700">
            ${stats.revenue.toLocaleString()}
          </div>
          <span className="text-[11px] font-semibold text-blue-600/80">Processed value</span>
        </div>
      </div>

      {/* Search, Filter & Controls Toolbar */}
      <div className={`${CARD} p-5 mb-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by PNR, Passenger Name, Flight (SL-204), Seat, Passport..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters & View Toggles */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Cabin Filter */}
            <div className="relative">
              <select
                value={cabinFilter}
                onChange={(e) => setCabinFilter(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value="ALL">All Cabins</option>
                <option value="ECONOMY">Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First Class</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              >
                <option value="DATE_DESC">Newest First</option>
                <option value="DATE_ASC">Oldest First</option>
                <option value="AMOUNT_HIGH">Amount (High to Low)</option>
                <option value="AMOUNT_LOW">Amount (Low to High)</option>
                <option value="PNR">PNR Code</option>
                <option value="FLIGHT">Flight Number</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5">
              <button
                onClick={() => setViewMode('table')}
                title="Table view"
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ListIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="Grid view"
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                  viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className={`${CARD} flex flex-col items-center justify-center p-16 text-center`}>
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800">Loading Reservations from SQL Database...</h3>
          <p className="text-xs text-slate-500 mt-1">Connecting to SkyLine Air REST API</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className={`${CARD} flex flex-col items-center justify-center p-16 text-center`}>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 mb-4">
            <Ticket className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">No Reservations Found</h3>
          <p className="mt-1.5 max-w-md text-xs text-slate-500">
            {searchTerm || statusFilter !== 'ALL' || cabinFilter !== 'ALL'
              ? 'No reservations matched your current filter criteria. Try clearing search filters.'
              : 'There are currently no passenger reservations recorded in the database.'}
          </p>
          {(searchTerm || statusFilter !== 'ALL' || cabinFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setCabinFilter('ALL');
                setPaymentFilter('ALL');
              }}
              className="mt-4 text-xs font-bold text-blue-600 hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className={`${CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">PNR & Booking</th>
                  <th className="px-4 py-4">Passenger Details</th>
                  <th className="px-4 py-4">Flight & Route</th>
                  <th className="px-4 py-4">Cabin & Seat</th>
                  <th className="px-4 py-4">Fare & Payment</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((res) => {
                  const statusConf = STATUS_CONFIG[res.bookingStatus] || STATUS_CONFIG.CONFIRMED;
                  const cabinConf = CABIN_CONFIG[res.cabinClass] || CABIN_CONFIG.ECONOMY;
                  const primaryPass = res.passengers[0] || {};

                  return (
                    <tr key={res.pnr + res.id} className="transition hover:bg-slate-50/70">
                      {/* PNR & Date */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                            {res.pnr}
                          </span>
                          <button
                            onClick={() => handleCopyPnr(res.pnr)}
                            title="Copy PNR Code"
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {copiedPnr === res.pnr ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {fmtDateTime(res.bookingDate)}
                        </div>
                      </td>

                      {/* Passenger */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{primaryPass.fullName || res.userName}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                          <span>Passport: {primaryPass.passport || 'N/A'}</span>
                          {res.passengers.length > 1 && (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                              +{res.passengers.length - 1} more
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400 truncate max-w-[160px]">{res.userEmail}</div>
                      </td>

                      {/* Flight */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Plane className="h-3.5 w-3.5 text-blue-500" />
                          <span>{res.flightNumber}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-slate-700">
                          <span>{res.origin}</span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span>{res.destination}</span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          Dep: {fmtDateTime(res.departureTime)}
                        </div>
                      </td>

                      {/* Cabin & Seat */}
                      <td className="px-4 py-4">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] ${cabinConf.badge}`}>
                          {cabinConf.label}
                        </span>
                        <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-700">
                            Seat {primaryPass.seat || 'Unassigned'}
                          </span>
                          {primaryPass.meal && (
                            <span className="text-[10px] font-medium text-slate-500" title={`Meal: ${primaryPass.meal}`}>
                              🍽️ {primaryPass.meal}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fare & Payment */}
                      <td className="px-4 py-4">
                        <div className="font-extrabold text-slate-900 text-sm">
                          ${res.totalAmount.toLocaleString()}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              res.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700'
                                : res.paymentStatus === 'PENDING'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {res.paymentStatus}
                          </span>
                          <span className="text-[10px] text-slate-400">({res.paymentMethod})</span>
                        </div>
                      </td>

                      {/* Booking Status Dropdown */}
                      <td className="px-4 py-4">
                        <div className="relative inline-block">
                          <select
                            value={res.bookingStatus}
                            onChange={(e) => handleQuickStatusChange(res.rawId, e.target.value)}
                            className={`cursor-pointer appearance-none rounded-full border py-1 pl-2.5 pr-7 text-[11px] font-bold outline-none transition focus:ring-2 focus:ring-blue-400 ${statusConf.badge}`}
                          >
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CHECKED_IN">Checked In</option>
                            <option value="PENDING_PAYMENT">Pending Payment</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
                        </div>
                        {res.hasLayover && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-indigo-600">
                            <Building2 className="h-3 w-3" />
                            <span>Layover in {res.layoverCity || res.layoverAirport}</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedReservation(res);
                              setViewModalOpen(true);
                            }}
                            title="View E-Ticket & Details"
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(res)}
                            title="Edit Reservation"
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleOpenDelete(res)}
                            title="Delete Reservation from SQL"
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
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
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReservations.map((res) => {
            const statusConf = STATUS_CONFIG[res.bookingStatus] || STATUS_CONFIG.CONFIRMED;
            const cabinConf = CABIN_CONFIG[res.cabinClass] || CABIN_CONFIG.ECONOMY;
            const primaryPass = res.passengers[0] || {};

            return (
              <div
                key={res.pnr + res.id}
                className={`${CARD} p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-0.5`}
              >
                {/* Top Row: PNR & Status */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                          {res.pnr}
                        </span>
                        <button
                          onClick={() => handleCopyPnr(res.pnr)}
                          className="text-slate-400 hover:text-slate-600"
                          title="Copy PNR"
                        >
                          {copiedPnr === res.pnr ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">{fmtDateTime(res.bookingDate)}</div>
                    </div>

                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusConf.badge}`}>
                      {statusConf.label}
                    </span>
                  </div>

                  {/* Passenger Information */}
                  <div className="rounded-2xl bg-slate-50 p-3.5 mb-3 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">{primaryPass.fullName || res.userName}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] ${cabinConf.badge}`}>
                        {cabinConf.label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>Seat: <strong className="text-slate-800">{primaryPass.seat || 'Unassigned'}</strong></span>
                      <span>Passport: <strong className="text-slate-800">{primaryPass.passport}</strong></span>
                    </div>
                  </div>

                  {/* Flight & Route */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Plane className="h-3.5 w-3.5 text-blue-500" />
                      <span>{res.flightNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>{res.origin}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span>{res.destination}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Paid:</span>
                    <span className="font-extrabold text-slate-900 text-sm">${res.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedReservation(res);
                      setViewModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5 text-blue-600" /> View E-Ticket
                  </button>

                  <button
                    onClick={() => handleOpenEdit(res)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition hover:bg-amber-100"
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleOpenDelete(res)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. VIEW / E-TICKET INSPECTION MODAL                      */}
      {/* ========================================================= */}
      {viewModalOpen && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            {/* Modal Header */}
            <div className={`p-6 text-white ${NAVY} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Ticket className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black">Electronic Flight Ticket & Receipt</h3>
                  <p className="text-xs text-blue-200">SkyLine Air Official Passenger Record</p>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Ticket Top Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Booking Reference (PNR)</span>
                  <span className="text-xl font-black font-mono text-blue-600">{selectedReservation.pnr}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_CONFIG[selectedReservation.bookingStatus]?.badge}`}>
                    {STATUS_CONFIG[selectedReservation.bookingStatus]?.label}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cabin Class</span>
                  <span className="text-sm font-bold text-slate-800">{selectedReservation.cabinClass} CLASS</span>
                </div>
              </div>

              {/* Flight Details */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Plane className="h-3.5 w-3.5 text-blue-500" /> Flight Itinerary
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Flight Number</span>
                    <span className="text-base font-black text-slate-900">{selectedReservation.flightNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Route</span>
                    <span className="text-base font-black text-slate-900">{selectedReservation.origin} ➔ {selectedReservation.destination}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Departure</span>
                    <span className="text-xs font-bold text-slate-800">{fmtDateTime(selectedReservation.departureTime)}</span>
                  </div>
                </div>
              </div>

              {/* Passenger Manifest */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-500" /> Passenger Manifest ({selectedReservation.passengers.length})
                </h4>
                <div className="space-y-2.5">
                  {selectedReservation.passengers.map((p, idx) => (
                    <div key={idx} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{p.fullName}</span>
                        <div className="text-[11px] text-slate-500">Passport: {p.passport}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-blue-100 px-2 py-1 font-bold text-blue-800 text-[11px]">
                          Seat {p.seat}
                        </span>
                        {p.meal && <span className="text-slate-600 text-[11px]">🍽️ {p.meal}</span>}
                        {p.baggage > 0 && <span className="text-slate-600 text-[11px]">🧳 +{p.baggage}kg</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-blue-500" /> Payment & Receipt
                </h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Total Fare</span>
                    <span className="text-base font-black text-slate-900">${selectedReservation.totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Payment Status</span>
                    <span className="font-bold text-emerald-600">{selectedReservation.paymentStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Method</span>
                    <span className="font-bold text-slate-800">{selectedReservation.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Transaction Ref</span>
                    <span className="font-mono text-[11px] text-slate-600 truncate block">{selectedReservation.transactionRef}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <Printer className="h-3.5 w-3.5" /> Print E-Ticket
              </button>
              <button
                onClick={() => setViewModalOpen(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. EDIT RESERVATION MODAL                                 */}
      {/* ========================================================= */}
      {editModalOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className={`p-6 text-white ${NAVY} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
                  <Edit3 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black">Edit Reservation Details</h3>
                  <p className="text-xs text-blue-200">Updating PNR: {editFormData.pnr} in SQL database</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Status & Cabin Class */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>Booking Status</label>
                  <select
                    value={editFormData.bookingStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, bookingStatus: e.target.value })}
                    className={INPUT}
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="CHECKED_IN">CHECKED_IN</option>
                    <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className={LABEL}>Cabin Class</label>
                  <select
                    value={editFormData.cabinClass}
                    onChange={(e) => setEditFormData({ ...editFormData, cabinClass: e.target.value })}
                    className={INPUT}
                  >
                    <option value="ECONOMY">Economy Class</option>
                    <option value="BUSINESS">Business Class</option>
                    <option value="FIRST">First Class</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Customer Contact Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>Contact Name</label>
                  <input
                    type="text"
                    value={editFormData.userName}
                    onChange={(e) => setEditFormData({ ...editFormData, userName: e.target.value })}
                    className={INPUT}
                    required
                  />
                </div>
                <div>
                  <label className={LABEL}>Contact Email</label>
                  <input
                    type="email"
                    value={editFormData.userEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, userEmail: e.target.value })}
                    className={INPUT}
                    required
                  />
                </div>
              </div>

              {/* Row 3: Passenger Details */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Primary Passenger Information
                </h4>
                {editFormData.passengers.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">First Name</label>
                      <input
                        type="text"
                        value={p.firstName}
                        onChange={(e) => {
                          const updated = [...editFormData.passengers];
                          updated[idx].firstName = e.target.value;
                          setEditFormData({ ...editFormData, passengers: updated });
                        }}
                        className={INPUT}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">Last Name</label>
                      <input
                        type="text"
                        value={p.lastName}
                        onChange={(e) => {
                          const updated = [...editFormData.passengers];
                          updated[idx].lastName = e.target.value;
                          setEditFormData({ ...editFormData, passengers: updated });
                        }}
                        className={INPUT}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">Seat Number</label>
                      <input
                        type="text"
                        value={p.seat}
                        onChange={(e) => {
                          const updated = [...editFormData.passengers];
                          updated[idx].seat = e.target.value;
                          setEditFormData({ ...editFormData, passengers: updated });
                        }}
                        placeholder="e.g. 14A"
                        className={INPUT}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block">Passport #</label>
                      <input
                        type="text"
                        value={p.passport}
                        onChange={(e) => {
                          const updated = [...editFormData.passengers];
                          updated[idx].passport = e.target.value;
                          setEditFormData({ ...editFormData, passengers: updated });
                        }}
                        className={INPUT}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 4: Total Price & Payment */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>Total Amount ($ USD)</label>
                  <input
                    type="number"
                    value={editFormData.totalAmount}
                    onChange={(e) => setEditFormData({ ...editFormData, totalAmount: Number(e.target.value) })}
                    className={INPUT}
                    required
                  />
                </div>
                <div>
                  <label className={LABEL}>Payment Status</label>
                  <select
                    value={editFormData.paymentStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                    className={INPUT}
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className={`rounded-xl px-5 py-2.5 text-xs font-extrabold ${PRIMARY_BTN} disabled:opacity-50`}
                >
                  {savingEdit ? 'Saving Changes...' : 'Save & Sync Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DELETE CONFIRMATION MODAL                              */}
      {/* ========================================================= */}
      {deleteModalOpen && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-150 p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">Delete Reservation?</h3>
                <p className="text-xs text-slate-500">Permanent SQL Database Deletion</p>
              </div>
            </div>

            <div className="rounded-2xl bg-red-50/70 border border-red-200/80 p-4 text-xs text-slate-700 space-y-2 mb-6">
              <p>
                Are you sure you want to permanently delete reservation for PNR{' '}
                <strong className="font-mono text-red-700 font-bold">{selectedReservation.pnr}</strong>?
              </p>
              <div className="text-[11px] text-slate-500">
                • Passenger: <strong>{selectedReservation.userName}</strong><br />
                • Flight: <strong>{selectedReservation.flightNumber} ({selectedReservation.origin} ➔ {selectedReservation.destination})</strong><br />
                • Total Fare: <strong>${selectedReservation.totalAmount}</strong>
              </div>
              <p className="text-red-700 font-semibold pt-1">
                ⚠️ This action cannot be undone and immediately removes all linked passenger seat bookings from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingRecord}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingRecord}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-red-600/30 hover:bg-red-700 active:scale-95 disabled:opacity-50"
              >
                {deletingRecord ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" /> Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CREATE COUNTER BOOKING MODAL                          */}
      {/* ========================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className={`p-6 text-white ${NAVY} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Plus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black">Issue Counter Flight Reservation</h3>
                  <p className="text-xs text-blue-200">Ticketing Counter Direct Issuance Desk</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCounterReservation} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={LABEL}>Flight Number</label>
                  <select
                    value={newBooking.flightNumber}
                    onChange={(e) => {
                      const fl = e.target.value;
                      let origin = 'CMB';
                      let destination = 'LHR';
                      if (fl === 'SL-102') { origin = 'CMB'; destination = 'SIN'; }
                      else if (fl === 'SL-308') { origin = 'CMB'; destination = 'DXB'; }
                      else if (fl === 'SL-415') { origin = 'DXB'; destination = 'JFK'; }
                      else if (fl === 'SL-520') { origin = 'CMB'; destination = 'HND'; }
                      setNewBooking({ ...newBooking, flightNumber: fl, origin, destination });
                    }}
                    className={INPUT}
                  >
                    <option value="SL-204">SL-204 (CMB ➔ LHR)</option>
                    <option value="SL-102">SL-102 (CMB ➔ SIN)</option>
                    <option value="SL-308">SL-308 (CMB ➔ DXB)</option>
                    <option value="SL-415">SL-415 (DXB ➔ JFK)</option>
                    <option value="SL-520">SL-520 (CMB ➔ HND)</option>
                  </select>
                </div>

                <div>
                  <label className={LABEL}>Cabin Class</label>
                  <select
                    value={newBooking.cabinClass}
                    onChange={(e) => {
                      const c = e.target.value;
                      const p = c === 'FIRST' ? 2400 : c === 'BUSINESS' ? 1450 : 780;
                      setNewBooking({ ...newBooking, cabinClass: c, totalAmount: p });
                    }}
                    className={INPUT}
                  >
                    <option value="ECONOMY">Economy Class</option>
                    <option value="BUSINESS">Business Class</option>
                    <option value="FIRST">First Class</option>
                  </select>
                </div>

                <div>
                  <label className={LABEL}>Total Fare ($)</label>
                  <input
                    type="number"
                    value={newBooking.totalAmount}
                    onChange={(e) => setNewBooking({ ...newBooking, totalAmount: Number(e.target.value) })}
                    className={INPUT}
                    required
                  />
                </div>
              </div>

              {/* Passenger Info */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Passenger Credentials
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">Title</label>
                    <select
                      value={newBooking.passengerTitle}
                      onChange={(e) => setNewBooking({ ...newBooking, passengerTitle: e.target.value })}
                      className={INPUT}
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">First Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Liam"
                      value={newBooking.passengerFirstName}
                      onChange={(e) => setNewBooking({ ...newBooking, passengerFirstName: e.target.value })}
                      className={INPUT}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Walker"
                      value={newBooking.passengerLastName}
                      onChange={(e) => setNewBooking({ ...newBooking, passengerLastName: e.target.value })}
                      className={INPUT}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">Seat Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 12A"
                      value={newBooking.passengerSeat}
                      onChange={(e) => setNewBooking({ ...newBooking, passengerSeat: e.target.value })}
                      className={INPUT}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">Passport Number</label>
                    <input
                      type="text"
                      placeholder="e.g. N9841029"
                      value={newBooking.passengerPassport}
                      onChange={(e) => setNewBooking({ ...newBooking, passengerPassport: e.target.value })}
                      className={INPUT}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">Meal Preference</label>
                    <select
                      value={newBooking.passengerMeal}
                      onChange={(e) => setNewBooking({ ...newBooking, passengerMeal: e.target.value })}
                      className={INPUT}
                    >
                      <option value="Standard">Standard Meal</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Halal">Halal Certified</option>
                      <option value="Kosher">Kosher</option>
                      <option value="Gluten-Free">Gluten-Free</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 mb-1 block">Payment Method</label>
                    <select
                      value={newBooking.paymentMethod}
                      onChange={(e) => setNewBooking({ ...newBooking, paymentMethod: e.target.value })}
                      className={INPUT}
                    >
                      <option value="COUNTER_CASH">Counter Cash</option>
                      <option value="CREDIT_CARD">Credit / Debit Card</option>
                      <option value="AIRLINE_VOUCHER">Airline Voucher</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>Customer Email</label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={newBooking.userEmail}
                    onChange={(e) => setNewBooking({ ...newBooking, userEmail: e.target.value })}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Payment Status</label>
                  <select
                    value={newBooking.paymentStatus}
                    onChange={(e) => setNewBooking({ ...newBooking, paymentStatus: e.target.value })}
                    className={INPUT}
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className={`rounded-xl px-5 py-2.5 text-xs font-extrabold ${PRIMARY_BTN} disabled:opacity-50`}
                >
                  {savingEdit ? 'Issuing Ticket...' : 'Issue E-Ticket & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
