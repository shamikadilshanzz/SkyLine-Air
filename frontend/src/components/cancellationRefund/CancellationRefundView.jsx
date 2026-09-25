import React, { useState } from 'react';
import {
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Plane,
  ArrowRight,
  UserCheck,
  Check,
  Clock,
  Wallet,
  Inbox,
  ChevronDown
} from 'lucide-react';
import { INITIAL_RESERVATIONS, INITIAL_REFUNDS } from '../../data/mockData';

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

const STATUS_STYLES = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  REFUND_REQUESTED: 'bg-amber-50 text-amber-700 ring-amber-600/20'
};

function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 ring-slate-500/20';
  const label = String(status || '').replace('_', ' ').toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function Money({ value, className = '' }) {
  return (
    <span className={`tabular-nums ${className}`}>
      ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function CancellationRefundView({ currentRole, user, onOpenAuth, onNavigateToBookings }) {
  const isOfficer = currentRole === 'TICKETING_OFFICER' || currentRole === 'ADMIN';
  const [activeTab, setActiveTab] = useState(() => (isOfficer ? 'officer' : 'lookup')); // 'officer', 'tracker', 'lookup'

  // Auto-navigate to Officer Review when ticketing officer accesses the section
  React.useEffect(() => {
    if (isOfficer) {
      setActiveTab('officer');
    }
  }, [currentRole, isOfficer]);

  const [reservations, setReservations] = useState([]);
  const [searchPnr, setSearchPnr] = useState('');
  const [searchError, setSearchError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('Schedule Conflict');

  const [refundList, setRefundList] = useState([]);
  const [cancellationConfirmed, setCancellationConfirmed] = useState(false);
  const [newRefundRef, setNewRefundRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to check if refund has already been requested for a booking
  const getExistingRefund = (booking) => {
    if (!booking) return null;
    const bookingPnr = String(booking.pnrCode || booking.pnr || '').trim().toUpperCase();
    return refundList.find((rf) => String(rf.pnr || '').trim().toUpperCase() === bookingPnr);
  };

  const isRefundAlreadyRequested = (booking) => {
    if (!booking) return false;
    if (booking.status === 'CANCELLED' || booking.status === 'REFUND_REQUESTED') return true;
    return Boolean(getExistingRefund(booking));
  };

  React.useEffect(() => {
    async function loadSqlRefundData() {
      try {
        const {
          fetchReservationsApi,
          fetchUserReservationsApi,
          fetchRefundsApi,
          fetchRefundsByUserEmailApi
        } = await import('../../api/apiService');

        let formattedRes = [];
        let formattedRefunds = [];

        if (isOfficer) {
          // Officers see all reservations and refunds across the airline
          const apiRes = await fetchReservationsApi();
          if (apiRes && apiRes.length > 0) {
            formattedRes = apiRes.map((r) => ({
              pnr: r.pnrCode || r.pnr,
              userId: r.userId,
              userName: r.userName || 'Passenger',
              userEmail: r.userEmail || '',
              flightNumber: r.flightNumber || 'SL-204',
              origin: r.origin || 'CMB',
              destination: r.destination || 'LHR',
              cabinClass: r.cabinClass || 'ECONOMY',
              totalAmount: r.totalAmount || 780,
              status: r.bookingStatus || 'CONFIRMED'
            }));
          }

          const apiRefunds = await fetchRefundsApi();
          if (apiRefunds && apiRefunds.length > 0) {
            formattedRefunds = apiRefunds.map((rf) => ({
              refundId: rf.refundReference || `RF-${rf.refundId}`,
              rawId: rf.refundId,
              pnr: rf.pnr || '',
              userName: rf.userName || '',
              userEmail: rf.userEmail || '',
              flightNumber: rf.flightNumber || '',
              originalFare: rf.originalFare || 0,
              cancellationFee: rf.cancellationFee || 0,
              refundAmount: rf.refundAmount || 0,
              reason: rf.reason || 'Personal schedule change',
              status: rf.status || 'APPROVED',
              timeline: [
                { stage: 'Requested', time: 'Completed', done: true },
                { stage: 'Under Review', time: 'Completed', done: true },
                { stage: 'Approved by Airline', time: rf.status === 'APPROVED' ? 'Approved' : 'Pending', done: rf.status === 'APPROVED' },
                { stage: 'Sent to PSP Gateway', time: 'In progress', done: rf.status === 'APPROVED' },
                { stage: 'Refund Credited', time: 'Pending', done: false }
              ]
            }));
          }
        } else if (user) {
          // Regular Passenger: Load ONLY bookings and refunds that belong strictly to this user
          const rawUserId = user?.rawId || (user?.id ? parseInt(String(user.id).replace(/\D/g, ''), 10) : null);
          const apiRes = await fetchUserReservationsApi(rawUserId, user.email);

          if (apiRes && apiRes.length > 0) {
            const userOnlyRes = apiRes.filter((r) => {
              const matchesId = rawUserId && Number(r.userId) === Number(rawUserId);
              const matchesEmail =
                user?.email &&
                r.userEmail &&
                String(r.userEmail).trim().toLowerCase() === String(user.email).trim().toLowerCase();
              return matchesId || matchesEmail;
            });

            formattedRes = userOnlyRes.map((r) => ({
              pnr: r.pnrCode || r.pnr,
              userId: r.userId,
              userName: r.userName || user.name,
              userEmail: r.userEmail || user.email,
              flightNumber: r.flightNumber || 'SL-204',
              origin: r.origin || 'CMB',
              destination: r.destination || 'LHR',
              cabinClass: r.cabinClass || 'ECONOMY',
              totalAmount: r.totalAmount || 780,
              status: r.bookingStatus || 'CONFIRMED'
            }));
          }

          // Fetch only this logged-in user's refunds
          if (user.email) {
            const userRefunds = await fetchRefundsByUserEmailApi(user.email);
            if (userRefunds && userRefunds.length > 0) {
              formattedRefunds = userRefunds.map((rf) => ({
                refundId: rf.refundReference || `RF-${rf.refundId}`,
                rawId: rf.refundId,
                pnr: rf.pnr || '',
                userName: rf.userName || user.name,
                userEmail: rf.userEmail || user.email,
                flightNumber: rf.flightNumber || '',
                originalFare: rf.originalFare || 0,
                cancellationFee: rf.cancellationFee || 0,
                refundAmount: rf.refundAmount || 0,
                reason: rf.reason || 'Personal schedule change',
                status: rf.status || 'UNDER_REVIEW',
                timeline: [
                  { stage: 'Requested', time: 'Completed', done: true },
                  { stage: 'Under Review', time: 'In progress', done: true },
                  { stage: 'Approved by Airline', time: rf.status === 'APPROVED' ? 'Approved' : 'Pending', done: rf.status === 'APPROVED' },
                  { stage: 'Sent to PSP Gateway', time: rf.status === 'APPROVED' ? 'In progress' : 'Pending', done: rf.status === 'APPROVED' },
                  { stage: 'Refund Credited', time: 'Pending', done: false }
                ]
              }));
            }
          }
        }

        setReservations(formattedRes);
        setSelectedBooking(formattedRes[0] || null);
        setRefundList(formattedRefunds);
      } catch (err) {
        console.warn('[CancellationRefundView] SQL fetch notice:', err.message);
        setReservations([]);
        setSelectedBooking(null);
        setRefundList([]);
      }
    }
    loadSqlRefundData();
  }, [user, isOfficer]);

  // Cancellation Fee Logic
  const calculateRefund = (booking) => {
    if (!booking) return { original: 0, penalty: 0, netRefund: 0 };
    const original = booking.totalAmount || 780;
    const penalty = booking.cabinClass === 'BUSINESS' ? 50 : 80;
    const netRefund = Math.max(0, original - penalty);
    return { original, penalty, netRefund };
  };

  const currentRefundCalc = calculateRefund(selectedBooking);
  const refundPercent = currentRefundCalc.original
    ? Math.round((currentRefundCalc.netRefund / currentRefundCalc.original) * 100)
    : 0;

  const handleSearchPnr = (e) => {
    e.preventDefault();
    const found = reservations.find(
      (b) => b.pnr.toUpperCase() === searchPnr.trim().toUpperCase()
    );
    if (found) {
      setSelectedBooking(found);
      setSearchError('');
      setCancellationConfirmed(false);
    } else {
      setSearchError(`No active booking found for ${searchPnr || 'that PNR'}. Check the code and try again.`);
    }
  };

  const handleSelectBooking = (b) => {
    setSelectedBooking(b);
    setSearchError('');
    setCancellationConfirmed(false);
  };

  const handleConfirmCancellation = async () => {
    if (!selectedBooking || isSubmitting) return;
    if (isRefundAlreadyRequested(selectedBooking)) return;

    setIsSubmitting(true);
    const generatedRefundId = `RF-${Math.floor(10000 + Math.random() * 90000)}`;
    setNewRefundRef(generatedRefundId);

    const newRefundItem = {
      refundId: generatedRefundId,
      pnr: selectedBooking?.pnr || 'SK-784920',
      userName: selectedBooking?.userName || 'Alex Morgan',
      userEmail: selectedBooking?.userEmail || 'alex.morgan@skyline.com',
      flightNumber: selectedBooking?.flightNumber || 'SL-204',
      originalFare: currentRefundCalc.original,
      cancellationFee: currentRefundCalc.penalty,
      refundAmount: currentRefundCalc.netRefund,
      reason: cancellationReason,
      status: 'UNDER_REVIEW',
      requestedDate: new Date().toISOString(),
      timeline: [
        { stage: 'Requested', time: 'Just now', done: true },
        { stage: 'Under Review by Airline Officer', time: 'In progress', done: true },
        { stage: 'Approved by Airline', time: 'Pending', done: false },
        { stage: 'Sent to PSP Gateway', time: 'Pending', done: false },
        { stage: 'Refund Credited to Card', time: 'Pending', done: false }
      ]
    };

    try {
      const { createRefundRequestApi } = await import('../../api/apiService');
      const apiRes = await createRefundRequestApi({
        refundReference: generatedRefundId,
        pnr: selectedBooking?.pnr || 'SK-784920',
        userName: selectedBooking?.userName || 'Alex Morgan',
        userEmail: selectedBooking?.userEmail || 'alex.morgan@skyline.com',
        flightNumber: selectedBooking?.flightNumber || 'SL-204',
        originalFare: currentRefundCalc.original,
        cancellationFee: currentRefundCalc.penalty,
        refundAmount: currentRefundCalc.netRefund,
        reason: cancellationReason,
        status: 'UNDER_REVIEW'
      });
      if (apiRes && apiRes.refundId) {
        newRefundItem.rawId = apiRes.refundId;
      }
    } catch (err) {
      console.warn('Backend refund submission fallback to local state:', err.message);
    }

    // Mark reservation as CANCELLED in state
    setReservations((prev) =>
      prev.map((r) =>
        r.pnr.toUpperCase() === selectedBooking.pnr.toUpperCase()
          ? { ...r, status: 'CANCELLED' }
          : r
      )
    );
    setSelectedBooking((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));

    setRefundList([newRefundItem, ...refundList]);
    setIsSubmitting(false);
    setCancellationConfirmed(true);
  };

  const [officerSearch, setOfficerSearch] = useState('');
  const [officerStatusFilter, setOfficerStatusFilter] = useState('ALL');

  // Officer Actions
  const handleOfficerApprove = async (refundId) => {
    const item = refundList.find((r) => r.refundId === refundId);
    if (item && item.rawId) {
      try {
        const { updateRefundStatusApi } = await import('../../api/apiService');
        await updateRefundStatusApi(item.rawId, 'APPROVED');
      } catch (err) {
        console.warn('Backend refund status approval fallback:', err.message);
      }
    }

    setRefundList(
      refundList.map((r) => {
        if (r.refundId === refundId) {
          return {
            ...r,
            status: 'APPROVED',
            timeline: r.timeline.map((t, idx) => (idx <= 2 ? { ...t, done: true, time: 'Approved' } : t))
          };
        }
        return r;
      })
    );
  };

  const handleOfficerReject = async (refundId) => {
    const item = refundList.find((r) => r.refundId === refundId);
    if (item && item.rawId) {
      try {
        const { updateRefundStatusApi } = await import('../../api/apiService');
        await updateRefundStatusApi(item.rawId, 'REJECTED');
      } catch (err) {
        console.warn('Backend refund status rejection fallback:', err.message);
      }
    }

    setRefundList(
      refundList.map((r) => {
        if (r.refundId === refundId) {
          return {
            ...r,
            status: 'REJECTED',
            timeline: r.timeline.map((t, idx) => (idx <= 1 ? { ...t, done: true, time: 'Rejected' } : { ...t, done: false, time: 'Cancelled' }))
          };
        }
        return r;
      })
    );
  };

  const filteredOfficerRefunds = React.useMemo(() => {
    return refundList.filter((rf) => {
      const matchesStatus = officerStatusFilter === 'ALL' || rf.status === officerStatusFilter;
      const query = officerSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        String(rf.refundId || '').toLowerCase().includes(query) ||
        String(rf.pnr || '').toLowerCase().includes(query) ||
        String(rf.userName || '').toLowerCase().includes(query) ||
        String(rf.flightNumber || '').toLowerCase().includes(query) ||
        String(rf.reason || '').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [refundList, officerStatusFilter, officerSearch]);

  const tabs = isOfficer
    ? [
      { id: 'officer', label: 'Officer Review' },
      { id: 'tracker', label: 'Live Refund Tracker', count: refundList.length }
    ]
    : [
      { id: 'lookup', label: 'Cancel Ticket' },
      { id: 'tracker', label: 'Live Refund Tracker', count: refundList.length }
    ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <style>{`
        @keyframes sl-pop { 0% { transform: scale(.6); opacity: 0 } 60% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
        @keyframes sl-ring { 0% { transform: scale(.8); opacity: .6 } 100% { transform: scale(1.7); opacity: 0 } }
        .sl-pop { animation: sl-pop .5s cubic-bezier(.2,.8,.2,1) both }
        .sl-ring { animation: sl-ring 1.6s ease-out infinite }
        @media (prefers-reduced-motion: reduce) { .sl-pop, .sl-ring { animation: none } }
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
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              {isOfficer ? 'Authorized Officer Actions' : 'Policy compliant refunds'}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {isOfficer ? 'Officer Refund Review & Live Tracker' : 'Cancellation & Refund Portal'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
              {isOfficer
                ? 'Review passenger cancellation claims, authorize refunds, and monitor live status in real time.'
                : "Cancel a ticket, see exactly what you'll get back, and follow your refund from review to payout."}
            </p>
          </div>

          {/* Segmented tabs */}
          <div
            role="tablist"
            className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/10 p-1.5 backdrop-blur-md"
          >
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${active
                    ? 'bg-white text-blue-700 shadow-lg shadow-black/10'
                    : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${active ? 'bg-blue-100 text-blue-700' : 'bg-white/15 text-white'
                        }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guest Notice */}
      {!user && !isOfficer && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-blue-950">Signed out / Guest Mode</h4>
              <p className="text-xs text-blue-800/80">Sign in to view your bookings and track your refund claims.</p>
            </div>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              Sign In / Register
            </button>
          )}
        </div>
      )}

      {/* ============ TAB 1: PNR LOOKUP & CANCELLATION (Passenger Only) ============ */}
      {activeTab === 'lookup' && !isOfficer && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* -------- Left: find reservation -------- */}
          <div className="lg:col-span-5 rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(15,30,92,0.06)] space-y-6 self-start">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Search className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">Find your reservation</h3>
                <p className="text-xs text-slate-500">Search by PNR or pick a booking below</p>
              </div>
            </div>

            <form onSubmit={handleSearchPnr} className="space-y-2">
              <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                <input
                  type="text"
                  value={searchPnr}
                  onChange={(e) => setSearchPnr(e.target.value)}
                  placeholder="Enter PNR, e.g. SK-784920"
                  aria-label="PNR"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold uppercase tracking-wide text-slate-900 placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.97]"
                >
                  Search
                </button>
              </div>
              {searchError && (
                <p role="alert" className="flex items-start gap-1.5 px-1 text-xs font-medium text-red-600">
                  <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                  {searchError}
                </p>
              )}
            </form>

            <div>
              <p className="mb-3 text-xs font-semibold text-slate-500">Your active bookings</p>
              {reservations.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-8 text-center">
                  <Inbox className="h-6 w-6 text-slate-300" />
                  <p className="text-xs text-slate-500">No active bookings to cancel.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reservations.map((b) => {
                    const active = selectedBooking?.pnr === b.pnr;
                    const existingRefundForB = getExistingRefund(b);
                    const isAlreadyCancelled = isRefundAlreadyRequested(b);
                    const displayStatus = isAlreadyCancelled
                      ? (existingRefundForB ? existingRefundForB.status : 'CANCELLED')
                      : b.status;

                    return (
                      <button
                        key={b.pnr}
                        type="button"
                        onClick={() => handleSelectBooking(b)}
                        aria-pressed={active}
                        className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-md shadow-blue-600/10'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        {active && <span className="absolute inset-y-0 left-0 w-1 bg-blue-600" />}
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold tracking-wide ${active ? 'text-blue-900' : 'text-slate-800'}`}>
                            {b.pnr}
                          </span>
                          <StatusPill status={displayStatus} />
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{b.origin}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-semibold text-slate-700">{b.destination}</span>
                          <span className="text-slate-300">|</span>
                          <span>{b.flightNumber}</span>
                          <span className="text-slate-300">|</span>
                          <span className="truncate">{b.userName}</span>
                        </div>
                        {isAlreadyCancelled && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1 border border-amber-200/60">
                            <CheckCircle2 className="h-3 w-3 text-amber-600 shrink-0" />
                            <span>Refund Requested {existingRefundForB?.refundId ? `(${existingRefundForB.refundId})` : ''}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* -------- Right: boarding-pass style breakdown -------- */}
          <div className="lg:col-span-7">
            {!selectedBooking ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-slate-300 bg-white/60 p-10 text-center">
                <Plane className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Select a booking to see your refund</p>
                <p className="max-w-xs text-xs text-slate-500">
                  Pick a reservation on the left and we'll calculate the cancellation fee and net refund.
                </p>
              </div>
            ) : !cancellationConfirmed ? (
              (() => {
                const existingRefundForSelected = getExistingRefund(selectedBooking);
                const isAlreadyRequested = isRefundAlreadyRequested(selectedBooking);
                const displayStatus = isAlreadyRequested
                  ? (existingRefundForSelected ? existingRefundForSelected.status : 'CANCELLED')
                  : selectedBooking.status;

                return (
                  <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,30,92,0.08)]">
                    {/* ---- Ticket top: route ---- */}
                    <div className="relative bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1e40af] p-6 md:p-8 text-white">
                      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
                      <div className="relative flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-blue-200/80">Selected reservation</p>
                          <h3 className="mt-0.5 text-lg font-extrabold tracking-wide">
                            PNR {selectedBooking.pnr}
                          </h3>
                        </div>
                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold capitalize backdrop-blur">
                          {String(selectedBooking.cabinClass).toLowerCase()} class
                        </span>
                      </div>

                      <div className="relative mt-8 flex items-center gap-4">
                        <div>
                          <div className="text-4xl md:text-5xl font-black tracking-tight">{selectedBooking.origin}</div>
                          <div className="text-xs text-blue-200/70">Departure</div>
                        </div>
                        <div className="relative flex-1">
                          <div className="border-t-2 border-dashed border-white/30" />
                          <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-blue-600 shadow-lg">
                            <Plane className="h-4 w-4 rotate-45" />
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl md:text-5xl font-black tracking-tight">{selectedBooking.destination}</div>
                          <div className="text-xs text-blue-200/70">Arrival</div>
                        </div>
                      </div>

                      <div className="relative mt-6 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-blue-200/70">Passenger</div>
                          <div className="font-bold truncate">{selectedBooking.userName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-blue-200/70">Flight</div>
                          <div className="font-bold">{selectedBooking.flightNumber}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-blue-200/70">Status</div>
                          <div className="font-bold capitalize">{String(displayStatus).toLowerCase()}</div>
                        </div>
                      </div>
                    </div>

                    {/* ---- Perforation ---- */}
                    <div className="relative h-0">
                      <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-slate-200/80 bg-slate-50" />
                      <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-slate-200/80 bg-slate-50" />
                      <div className="mx-6 border-t-2 border-dashed border-slate-200" />
                    </div>

                    {/* ---- Ticket bottom: breakdown + action ---- */}
                    <div className="space-y-6 p-6 md:p-8">
                      {/* Alert banner if already requested */}
                      {isAlreadyRequested ? (
                        <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-sm">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                          </span>
                          <div className="text-xs space-y-1">
                            <div className="font-bold text-amber-900 flex items-center gap-2">
                              <span>Refund Request Already Submitted</span>
                              {existingRefundForSelected?.refundId && (
                                <span className="rounded bg-amber-200/80 px-2 py-0.5 font-mono text-[10px] font-extrabold text-amber-950">
                                  {existingRefundForSelected.refundId}
                                </span>
                              )}
                            </div>
                            <p className="leading-relaxed text-amber-800">
                              A cancellation and refund request for PNR <strong>{selectedBooking.pnr}</strong> has already been submitted and is currently in status <strong>{existingRefundForSelected?.status || 'UNDER_REVIEW'}</strong>. Duplicate cancellation or refund submissions for this ticket are disabled.
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Policy */
                        <div className="flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                          </span>
                          <div className="text-xs">
                            <div className="font-bold text-amber-900">Airline cancellation policy</div>
                            <p className="mt-0.5 leading-relaxed text-amber-800/90">
                              Cancellations made 24+ hours before departure incur a flat administrative fee. The
                              remaining balance is refunded to your original payment method.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Money */}
                      <div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              {isAlreadyRequested ? 'Refund in Progress' : "You'll get back"}
                            </p>
                            <div className="mt-1 text-4xl md:text-5xl font-black tracking-tight text-emerald-600">
                              <Money value={currentRefundCalc.netRefund} />
                              <span className="ml-2 text-sm font-bold text-slate-400">USD</span>
                            </div>
                          </div>
                          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            {refundPercent}% refunded
                          </div>
                        </div>

                        {/* proportion bar */}
                        <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${refundPercent}%` }}
                          />
                          <div className="h-full flex-1 bg-red-300/70" />
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <dt className="text-xs text-slate-500">Original ticket price</dt>
                            <dd className="mt-1 text-lg font-extrabold text-slate-900">
                              <Money value={currentRefundCalc.original} />
                            </dd>
                          </div>
                          <div className="rounded-2xl bg-red-50/70 p-4">
                            <dt className="text-xs text-red-600/80">Cancellation fee</dt>
                            <dd className="mt-1 text-lg font-extrabold text-red-600">
                              -<Money value={currentRefundCalc.penalty} />
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Reason */}
                      <div>
                        <label htmlFor="cancel-reason" className="mb-1.5 block text-xs font-bold text-slate-700">
                          Reason for cancellation
                        </label>
                        <div className="relative">
                          <select
                            id="cancel-reason"
                            disabled={isAlreadyRequested || isSubmitting}
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className={`w-full appearance-none rounded-2xl border border-slate-200 px-4 py-3.5 pr-10 text-sm font-semibold outline-none transition ${
                              isAlreadyRequested
                                ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10'
                            }`}
                          >
                            <option value="Schedule Conflict">Personal schedule change</option>
                            <option value="Flight Rescheduled">Flight delay / reschedule</option>
                            <option value="Medical Emergency">Medical reason</option>
                            <option value="Duplicate Booking">Duplicate booking made</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>

                      {/* Action Button: Disabled once refund request is sent */}
                      <button
                        type="button"
                        disabled={isAlreadyRequested || isSubmitting}
                        onClick={handleConfirmCancellation}
                        className={`group flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-extrabold transition ${
                          isAlreadyRequested
                            ? 'cursor-not-allowed bg-slate-200 text-slate-500 border border-slate-300 shadow-none pointer-events-none'
                            : isSubmitting
                              ? 'cursor-wait bg-slate-400 text-white shadow-none'
                              : 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-red-700 hover:shadow-red-600/40 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500/30 cursor-pointer'
                        }`}
                      >
                        {isAlreadyRequested ? (
                          <>
                            <Check className="h-4 w-4 text-slate-500" />
                            <span>Refund Request Already Sent ({existingRefundForSelected?.refundId || 'Under Review'})</span>
                          </>
                        ) : isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            <span>Submitting Refund Request...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
                            <span>Cancel ticket and request <Money value={currentRefundCalc.netRefund} /></span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* ---------- CONFIRMED STATE ---------- */
              <div className="flex flex-col items-center rounded-[1.75rem] border border-slate-200/80 bg-white px-8 py-14 text-center shadow-[0_8px_30px_rgb(15,30,92,0.08)]">
                <div className="relative">
                  <span className="sl-ring absolute inset-0 rounded-full bg-emerald-400/40" />
                  <div className="sl-pop relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-500/30">
                    <CheckCircle2 className="h-11 w-11" />
                  </div>
                </div>
                <h3 className="mt-6 text-2xl font-extrabold text-slate-900">Cancellation request submitted</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  Ticket <span className="font-bold text-slate-900">{selectedBooking?.pnr}</span> is now with an
                  airline officer for review. Your refund reference is{' '}
                  <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-bold text-blue-600">{newRefundRef}</span>.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('tracker')}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30 transition hover:from-blue-500 hover:to-blue-700 active:scale-[0.98]"
                  >
                    Track refund status
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCancellationConfirmed(false)}
                    className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Back to bookings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ TAB 2: LIVE REFUND TRACKER ============ */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Live refund tracker</h3>
              <p className="text-sm text-slate-500">Status updates straight from the payment gateway.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 ring-1 ring-inset ring-blue-600/20">
              {refundList.length} active {refundList.length === 1 ? 'refund' : 'refunds'}
            </span>
          </div>

          {refundList.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-[1.75rem] border border-dashed border-slate-300 bg-white/60 py-16 text-center">
              <Wallet className="h-7 w-7 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No refunds yet</p>
              <p className="text-xs text-slate-500">Cancel a ticket and its refund will show up here.</p>
            </div>
          )}

          {refundList.map((rf) => {
            const total = rf.timeline.length;
            const doneCount = rf.timeline.filter((s) => s.done).length;
            const progress = Math.max(0, doneCount - 1) / Math.max(1, total - 1);
            const currentIdx = rf.timeline.findIndex((s) => !s.done);

            return (
              <div
                key={rf.refundId}
                className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,30,92,0.06)]"
              >
                {/* header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/25">
                      <Wallet className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-xs text-slate-500">Refund reference</div>
                      <div className="text-lg font-extrabold tracking-wide text-slate-900">{rf.refundId}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Passenger</div>
                    <div className="text-sm font-bold text-slate-900">
                      {rf.userName} <span className="font-medium text-slate-400">({rf.pnr})</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Status</div>
                    <StatusPill status={rf.status} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Refund amount</div>
                    <div className="text-2xl font-black text-emerald-600">
                      <Money value={rf.refundAmount} />
                    </div>
                  </div>
                </div>

                {/* stepper */}
                <div className="p-6 md:p-8">
                  <div className="relative">
                    {/* base line */}
                    <div className="absolute left-[10%] right-[10%] top-[18px] h-1 rounded-full bg-slate-200" />
                    {/* progress line */}
                    <div
                      className="absolute left-[10%] top-[18px] h-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                      style={{ width: `${progress * 80}%` }}
                    />

                    <div className="relative grid grid-cols-5 gap-2">
                      {rf.timeline.map((step, idx) => {
                        const isCurrent = idx === currentIdx;
                        return (
                          <div key={idx} className="flex flex-col items-center text-center">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-xs font-bold ring-1 transition ${step.done
                                ? 'bg-emerald-500 text-white ring-emerald-500 shadow-lg shadow-emerald-500/30'
                                : isCurrent
                                  ? 'bg-white text-blue-600 ring-blue-500'
                                  : 'bg-slate-100 text-slate-400 ring-slate-200'
                                }`}
                            >
                              {step.done ? (
                                <Check className="h-4 w-4" strokeWidth={3} />
                              ) : isCurrent ? (
                                <Clock className="h-4 w-4" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <div
                              className={`mt-3 text-xs font-bold leading-tight ${step.done || isCurrent ? 'text-slate-900' : 'text-slate-400'
                                }`}
                            >
                              {step.stage}
                            </div>
                            <div
                              className={`mt-1 text-[11px] ${step.done ? 'text-emerald-600 font-semibold' : isCurrent ? 'text-blue-600 font-semibold' : 'text-slate-400'
                                }`}
                            >
                              {step.time}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============ TAB 3: TICKETING OFFICER PORTAL ============ */}
      {activeTab === 'officer' && (
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,30,92,0.06)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <UserCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Ticketing Officer Refund Matrix</h3>
                <p className="text-xs text-slate-500">Review, approve, or reject passenger refund claims (Officer Portal)</p>
              </div>
            </div>

            {/* Officer Search Bar */}
            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                placeholder="Search PNR, Refund ID, Name..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/70 px-6 py-3 text-xs font-bold">
            {['ALL', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((st) => {
              const active = officerStatusFilter === st;
              const count = st === 'ALL'
                ? refundList.length
                : refundList.filter(r => r.status === st).length;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOfficerStatusFilter(st)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{st.replace('_', ' ')}</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500">
                  <th className="px-6 py-3">Refund ID</th>
                  <th className="px-4 py-3">PNR</th>
                  <th className="px-4 py-3">Passenger</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Original Fare</th>
                  <th className="px-4 py-3">Penalty</th>
                  <th className="px-4 py-3">Refund Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOfficerRefunds.map((rf) => (
                  <tr key={rf.refundId} className="transition hover:bg-blue-50/40">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">{rf.refundId}</td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-900">{rf.pnr}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{rf.userName}</td>
                    <td className="px-4 py-4 text-slate-500">{rf.reason}</td>
                    <td className="px-4 py-4 text-slate-600"><Money value={rf.originalFare} /></td>
                    <td className="px-4 py-4 text-red-600 font-semibold">-<Money value={rf.cancellationFee} /></td>
                    <td className="px-4 py-4 font-extrabold text-emerald-600">
                      <Money value={rf.refundAmount} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill status={rf.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {rf.status !== 'APPROVED' && rf.status !== 'REJECTED' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOfficerReject(rf.refundId)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700 transition hover:bg-red-100"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleOfficerApprove(rf.refundId)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                          <Check className="h-3.5 w-3.5" /> {rf.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredOfficerRefunds.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-14 text-center text-sm text-slate-500">
                      No refund claims match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}