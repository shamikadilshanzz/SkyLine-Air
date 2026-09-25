import React, { useState } from 'react';
import {
  Hotel,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  Sparkles,
  Ticket,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  Plane,
  Car,
  Bed,
  User,
  Key,
  AlertCircle,
  Coffee,
  Wifi,
  PhoneCall,
  CheckCircle,
  XCircle,
  CalendarCheck,
  Luggage,
  Sparkle
} from 'lucide-react';

export default function HotelVoucherCard({ booking, hotel, onNavigateToHotels }) {
  const [copied, setCopied] = useState(false);

  const voucherCode = booking.voucherCode || `HTV-${booking.id || '948201'}`;
  const rawStatus = (booking.bookingStatus || 'CONFIRMED').toUpperCase();
  const isComplimentary = Boolean(booking.isComplimentary);
  const hotelName = booking.hotelName || hotel?.name || 'SkyLine Partner Airport Hotel';
  const airportCode = booking.airportCode || hotel?.airportCode || 'DXB';
  const city = booking.city || hotel?.city || 'Transit Hub';
  const roomType = booking.roomType || 'Deluxe Transit Suite';
  const guestName = booking.passengerName || 'Passenger';
  const pnr = booking.pnr || 'SK-784920';
  const starRating = hotel?.starRating || 5;
  const distanceKm = hotel?.distanceKm ?? 1.2;
  const hotelImage = hotel?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
  const amount = isComplimentary ? 0 : (booking.amount ?? hotel?.pricePerNight ?? 120);
  const isIndependent = Boolean(booking.independent || String(pnr).startsWith('IND'));

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  // Dynamic Status Configuration
  const getStatusConfig = () => {
    switch (rawStatus) {
      case 'CHECKED_IN':
        return {
          stepIndex: 3,
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
          dotColor: 'bg-cyan-400',
          badgeText: 'CHECKED IN • ROOM ACTIVE',
          accentBorder: 'border-blue-500/30',
          bannerBg: 'bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-slate-900',
          bannerBorder: 'border-blue-500/40',
          icon: Key,
          iconColor: 'text-cyan-400',
          headline: 'Guest Checked In — Room & Key Active',
          description: `You are officially checked into ${hotelName}. Your digital keycard is active at reception. Enjoy your layover stay and all complimentary amenities.`,
          qrStatus: 'Keycard Active & Verified',
          qrStatusBadge: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'COMPLETED':
        return {
          stepIndex: 4,
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
          dotColor: 'bg-purple-400',
          badgeText: 'STAY COMPLETED • CHECKED OUT',
          accentBorder: 'border-purple-500/30',
          bannerBg: 'bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950',
          bannerBorder: 'border-purple-500/40',
          icon: CheckCircle2,
          iconColor: 'text-purple-400',
          headline: 'Transit Stay Successfully Completed',
          description: `Your check-out from ${hotelName} has been recorded. We hope you had a restful stay! Have a smooth onward flight with SkyLine Air.`,
          qrStatus: 'Stay Completed & Archived',
          qrStatusBadge: 'bg-slate-100 text-slate-700 border-slate-200'
        };
      case 'CANCELLED':
        return {
          stepIndex: 0,
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
          dotColor: 'bg-rose-400',
          badgeText: 'RESERVATION CANCELLED',
          accentBorder: 'border-rose-500/30',
          bannerBg: 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950',
          bannerBorder: 'border-rose-500/40',
          icon: XCircle,
          iconColor: 'text-rose-400',
          headline: 'Hotel Reservation Cancelled',
          description: `This booking has been cancelled. If you require transit accommodation, you can browse partner hotels to reserve a new room.`,
          qrStatus: 'Pass Inactive / Cancelled',
          qrStatusBadge: 'bg-rose-50 text-rose-700 border-rose-200'
        };
      case 'CONFIRMED':
      default:
        return {
          stepIndex: 1,
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotColor: 'bg-emerald-400',
          badgeText: 'CONFIRMED • READY FOR ARRIVAL',
          accentBorder: 'border-emerald-500/30',
          bannerBg: 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-blue-950',
          bannerBorder: 'border-emerald-500/40',
          icon: Sparkles,
          iconColor: 'text-emerald-400',
          headline: 'Reservation Confirmed in Hotel Network',
          description: `Your room is reserved and guaranteed. Follow airport terminal signs to Gate 4 for the free express shuttle. Present this voucher or QR code at reception to check in.`,
          qrStatus: 'Ready for Front Desk Scan',
          qrStatusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const journeySteps = [
    { id: 1, label: 'Booked & Confirmed', desc: 'Database Verified', icon: CalendarCheck },
    { id: 2, label: 'Airport Shuttle', desc: 'Gate 4 Transfer', icon: Car },
    { id: 3, label: 'Hotel Check-In', desc: 'Keycard Issued', icon: Key },
    { id: 4, label: 'Stay Completed', desc: 'Checked Out', icon: CheckCircle }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      
      {/* Top Header Strip */}
      <div className="bg-gradient-to-r from-slate-950 via-[#0a1538] to-[#0d2260] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shadow-inner">
            <Hotel className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-sky-300">
              <span>SkyLine Air Partner Network</span>
              <span>•</span>
              <span>{isIndependent ? 'Direct Partner Stay Pass' : 'Transit Layover Pass'}</span>
            </div>
            <div className="text-sm font-extrabold text-white">Official Electronic Lodging Pass & Voucher</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border tracking-wide shadow-sm ${statusConfig.badgeBg}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dotColor} ${rawStatus === 'CONFIRMED' || rawStatus === 'CHECKED_IN' ? 'animate-pulse' : ''}`}></span>
            {statusConfig.badgeText}
          </span>
          <button
            type="button"
            onClick={handlePrint}
            title="Print or Save PDF Voucher"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 px-3 border border-white/15"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Pass</span>
          </button>
        </div>
      </div>

      {/* Live Passenger Stay Journey Stepper */}
      {rawStatus !== 'CANCELLED' && (
        <div className="bg-slate-900/95 text-white px-6 py-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Live Layover Journey Status
            </span>
            <span className="text-xs font-extrabold text-cyan-300">
              Step {statusConfig.stepIndex} of 4
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {journeySteps.map((st) => {
              const isPassed = statusConfig.stepIndex > st.id;
              const isCurrent = statusConfig.stepIndex === st.id;
              const StepIcon = st.icon;

              return (
                <div
                  key={st.id}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all border ${
                    isCurrent
                      ? 'bg-blue-600/30 border-blue-400 text-white shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/50'
                      : isPassed
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      isCurrent
                        ? 'bg-blue-500 text-white shadow-md'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPassed ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold truncate leading-tight">
                      {st.label}
                    </div>
                    <div className={`text-[10px] truncate ${isCurrent ? 'text-cyan-300 font-semibold' : 'text-slate-400'}`}>
                      {isCurrent ? 'Active Now' : st.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real-time Status Alert Banner */}
      <div className={`p-4 sm:p-5 border-b text-white flex items-start gap-3.5 shadow-sm ${statusConfig.bannerBg} ${statusConfig.bannerBorder}`}>
        <div className={`w-9 h-9 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 ${statusConfig.iconColor}`}>
          <StatusIcon className="w-5 h-5" />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="text-sm font-extrabold flex items-center gap-2">
            <span>{statusConfig.headline}</span>
            {rawStatus === 'CHECKED_IN' && (
              <span className="bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 text-[10px] px-2 py-0.5 rounded-md uppercase font-black">
                Live on Desk
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            {statusConfig.description}
          </p>
        </div>
      </div>

      {/* Main Ticket Layout: Dual-Column Pass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 relative">
        
        {/* LEFT / MAIN PASS (Cols 1-8) */}
        <div className="lg:col-span-8 p-6 md:p-8 space-y-6">
          
          {/* Hotel Hero Showcase */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 h-48 shadow-inner group">
            <img
              src={hotelImage}
              alt={hotelName}
              className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            
            {/* Badges on Hero */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
              <span className="bg-slate-950/80 backdrop-blur-md text-amber-400 text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1 border border-white/10 shadow-md">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {starRating} Star Partner
              </span>
              <span className="bg-blue-600/90 backdrop-blur-md text-white text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider shadow-md">
                {airportCode} Terminal
              </span>
            </div>

            <div className="absolute top-3.5 right-3.5">
              {isComplimentary ? (
                <span className="bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> 100% Complimentary
                </span>
              ) : (
                <span className="bg-blue-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg">
                  Transit Rate: ${amount}
                </span>
              )}
            </div>

            {/* Bottom Title on Image */}
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl md:text-2xl font-black text-white leading-tight drop-shadow-md">
                {hotelName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 font-semibold drop-shadow">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{city} ({airportCode}) • {distanceKm} km from Airport Terminal</span>
              </div>
            </div>
          </div>

          {/* Passenger & Booking Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Guest */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" /> Guest Name
              </span>
              <div className="font-extrabold text-slate-900 text-sm truncate">{guestName}</div>
              <div className="text-[10px] text-slate-500 font-semibold">Verified Passenger</div>
            </div>

            {/* Reference */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center gap-1">
                <Plane className="w-3.5 h-3.5 text-blue-600" /> {isIndependent ? 'Stay Ref' : 'Flight PNR'}
              </span>
              <div className="font-mono font-black text-blue-600 text-sm tracking-wide">{pnr}</div>
              <div className="text-[10px] text-slate-500 font-semibold">{isIndependent ? 'Direct Stay' : 'Linked Layover'}</div>
            </div>

            {/* Room */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-blue-600" /> Room Type
              </span>
              <div className="font-extrabold text-slate-900 text-sm truncate">{roomType}</div>
              <div className="text-[10px] text-slate-500 font-semibold">1 King / 2 Twin Bed</div>
            </div>

            {/* Rate & Payment */}
            <div className={`p-4 rounded-2xl border space-y-1 ${
              isComplimentary ? 'bg-emerald-50/70 border-emerald-200' : 'bg-blue-50/70 border-blue-200'
            }`}>
              <span className="text-[10px] uppercase font-extrabold text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Rate Status
              </span>
              <div className={`font-black text-sm ${isComplimentary ? 'text-emerald-700' : 'text-blue-700'}`}>
                {isComplimentary ? '$0.00 (Free)' : `$${amount}.00`}
              </div>
              <div className="text-[10px] font-bold text-slate-500">
                {isComplimentary ? 'Airline Covered' : 'Transit Rate Paid'}
              </div>
            </div>
          </div>

          {/* Hotel Amenities & Included Perks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700">
              <Car className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Free 24/7 Shuttle</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700">
              <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Buffet Breakfast</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700">
              <Wifi className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>High-Speed Wi-Fi</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700">
              <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>24/7 Concierge</span>
            </div>
          </div>

          {/* Transfer & Reception Protocol */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-indigo-950 text-xs">
                <Car className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Terminal Transfer & Reception Check-In Guidance</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                Gate 4 Bay
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              At <strong>{airportCode} Airport</strong>, head towards the baggage exit hall to <strong>Gate 4 / Courtesy Shuttle Bay</strong>. The <strong>{hotelName}</strong> luxury coach leaves every 15 minutes. Present your digital voucher code <strong>{voucherCode}</strong> or display the QR code below at reception for rapid keycard issuance.
            </p>
          </div>
        </div>

        {/* RIGHT / TEAR-OFF STUB (Cols 9-12) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 p-6 md:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-dashed border-slate-300 relative">
          
          {/* Perforation Cutouts */}
          <div className="hidden lg:block absolute -top-3 -left-3 w-6 h-6 rounded-full bg-slate-50 border border-slate-200"></div>
          <div className="hidden lg:block absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-slate-50 border border-slate-200"></div>
          
          <div className="space-y-4">
            
            {/* Stub Header */}
            <div className="text-center pb-2 border-b border-slate-200">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
                Lodging Claim Stub
              </span>
              <div className="font-extrabold text-xs text-slate-800">SkyLine Air VIP Transit Pass</div>
            </div>

            {/* QR Code Scanner */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-2.5 group">
              <div className="relative w-32 h-32 p-2 bg-slate-900 rounded-2xl flex items-center justify-center shadow-inner">
                {/* Simulated QR Code SVG */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                  {/* Outer corner boxes */}
                  <rect x="5" y="5" width="28" height="28" fill="white" rx="4" />
                  <rect x="9" y="9" width="20" height="20" fill="#0f172a" rx="2" />
                  <rect x="13" y="13" width="12" height="12" fill="white" rx="1" />

                  <rect x="67" y="5" width="28" height="28" fill="white" rx="4" />
                  <rect x="71" y="9" width="20" height="20" fill="#0f172a" rx="2" />
                  <rect x="75" y="13" width="12" height="12" fill="white" rx="1" />

                  <rect x="5" y="67" width="28" height="28" fill="white" rx="4" />
                  <rect x="9" y="71" width="20" height="20" fill="#0f172a" rx="2" />
                  <rect x="13" y="75" width="12" height="12" fill="white" rx="1" />

                  {/* QR Pattern Bits */}
                  <rect x="38" y="8" width="6" height="6" fill="white" />
                  <rect x="48" y="14" width="6" height="6" fill="white" />
                  <rect x="58" y="8" width="6" height="6" fill="white" />
                  <rect x="38" y="24" width="6" height="6" fill="white" />
                  <rect x="52" y="24" width="6" height="6" fill="white" />

                  <rect x="10" y="42" width="6" height="6" fill="white" />
                  <rect x="22" y="48" width="6" height="6" fill="white" />
                  <rect x="38" y="42" width="6" height="6" fill="white" />
                  <rect x="48" y="48" width="6" height="6" fill="white" />
                  <rect x="58" y="42" width="6" height="6" fill="white" />
                  <rect x="72" y="48" width="6" height="6" fill="white" />
                  <rect x="84" y="42" width="6" height="6" fill="white" />

                  <rect x="38" y="62" width="6" height="6" fill="white" />
                  <rect x="48" y="72" width="6" height="6" fill="white" />
                  <rect x="58" y="62" width="6" height="6" fill="white" />
                  <rect x="38" y="82" width="6" height="6" fill="white" />
                  <rect x="52" y="82" width="6" height="6" fill="white" />
                  <rect x="72" y="70" width="6" height="6" fill="white" />
                  <rect x="84" y="80" width="6" height="6" fill="white" />
                </svg>

                {/* Center Badge */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shadow-lg border border-white/40 ${
                    rawStatus === 'CHECKED_IN' ? 'bg-cyan-600' : 'bg-blue-600'
                  }`}>
                    {rawStatus === 'CHECKED_IN' ? (
                      <Key className="w-4 h-4 text-white" />
                    ) : (
                      <Plane className="w-4 h-4 transform -rotate-45" />
                    )}
                  </div>
                </div>
              </div>

              <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusConfig.qrStatusBadge}`}>
                {statusConfig.qrStatus}
              </div>
            </div>

            {/* Voucher Code Box with 1-Click Copy */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Official Voucher Code
              </span>
              <div className="font-mono font-black text-xl text-slate-900 tracking-wider">
                {voucherCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`w-full mt-2 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 active:scale-[0.98]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Voucher Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Barcode Graphic */}
            <div className="text-center pt-1 space-y-1">
              <div className="h-9 w-full flex items-center justify-center gap-[2.5px] px-2 opacity-80">
                {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 1, 4, 1, 3, 2, 1, 3, 1, 4, 2, 1, 2].map((w, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 h-full rounded-sm"
                    style={{ width: `${w * 1.6}px` }}
                  ></div>
                ))}
              </div>
              <div className="font-mono text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                {voucherCode}-SKL-{airportCode}
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block">
              Issued by SkyLine Air Transit Lodging Services
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
