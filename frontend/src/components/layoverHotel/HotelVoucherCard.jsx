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
  Download,
  Share2,
  Calendar
} from 'lucide-react';

export default function HotelVoucherCard({ booking, hotel, onNavigateToHotels }) {
  const [copied, setCopied] = useState(false);

  const voucherCode = booking.voucherCode || `HTV-${booking.id || '948201'}`;
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      
      {/* Top Header Strip */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center">
            <Hotel className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-sky-300">
              <span>SkyLine Air Partner Network</span>
              <span>•</span>
              <span>{isIndependent ? 'Partner Stay Pass' : 'Transit Layover Pass'}</span>
            </div>
            <div className="text-xs font-bold text-slate-300">Official Electronic Lodging Voucher</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            CONFIRMED & ACTIVE
          </span>
          <button
            type="button"
            onClick={handlePrint}
            title="Print or Save PDF"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1 px-2.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Main Ticket Layout: Dual-Column Boarding Pass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 relative">
        
        {/* LEFT / MAIN PASS (Cols 1-8) */}
        <div className="lg:col-span-8 p-6 md:p-8 space-y-6">
          
          {/* Hotel Hero Showcase */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 h-44 shadow-inner">
            <img
              src={hotelImage}
              alt={hotelName}
              className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            
            {/* Badges on Hero */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="bg-slate-950/80 backdrop-blur-md text-amber-400 text-xs font-extrabold px-2.5 py-1 rounded-xl flex items-center gap-1 border border-white/10">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {starRating} Star Partner
              </span>
              <span className="bg-blue-600/90 backdrop-blur-md text-white text-xs font-black px-2.5 py-1 rounded-xl uppercase tracking-wider">
                {airportCode} Terminal
              </span>
            </div>

            <div className="absolute top-3 right-3">
              {isComplimentary ? (
                <span className="bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 100% Free Stay
                </span>
              ) : (
                <span className="bg-blue-500 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                  Transit Rate: ${amount}
                </span>
              )}
            </div>

            {/* Bottom Title on Image */}
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl md:text-2xl font-black text-white leading-tight drop-shadow-md">
                {hotelName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 font-medium drop-shadow">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{city} ({airportCode}) • {distanceKm} km from Airport Terminal</span>
              </div>
            </div>
          </div>

          {/* Passenger & Booking Details Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Guest */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-blue-600" /> Guest Name
              </span>
              <div className="font-extrabold text-slate-900 text-sm truncate">{guestName}</div>
              <div className="text-[10px] text-slate-500 font-medium">Verified Passenger</div>
            </div>

            {/* Reference */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Plane className="w-3 h-3 text-blue-600" /> {isIndependent ? 'Stay Ref' : 'Flight PNR'}
              </span>
              <div className="font-mono font-black text-blue-600 text-sm tracking-wide">{pnr}</div>
              <div className="text-[10px] text-slate-500 font-medium">{isIndependent ? 'Direct Booking' : 'Linked Layover'}</div>
            </div>

            {/* Room */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Bed className="w-3 h-3 text-blue-600" /> Room Type
              </span>
              <div className="font-extrabold text-slate-900 text-sm truncate">{roomType}</div>
              <div className="text-[10px] text-slate-500 font-medium">1 King / 2 Twin Bed</div>
            </div>

            {/* Rate & Payment */}
            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              isComplimentary ? 'bg-emerald-50/70 border-emerald-200' : 'bg-blue-50/70 border-blue-200'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Rate Status
              </span>
              <div className={`font-black text-sm ${isComplimentary ? 'text-emerald-700' : 'text-blue-700'}`}>
                {isComplimentary ? '$0.00 (Free)' : `$${amount}.00`}
              </div>
              <div className="text-[10px] font-bold text-slate-500">
                {isComplimentary ? 'Airline Covered' : 'Transit Rate Paid'}
              </div>
            </div>
          </div>

          {/* Transfer & Reception Guidance Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-blue-50/60 border border-indigo-100 text-xs text-indigo-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-900 text-xs">
              <Car className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Complimentary Terminal Shuttle & Check-In Protocol</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Upon landing at <strong>{airportCode}</strong>, follow baggage claim exit signs to <strong>Gate 4 / Courtesy Shuttle Bay</strong>. The <strong>{hotelName}</strong> 24/7 express shuttle departs every 15 minutes. Present digital voucher <strong>{voucherCode}</strong> or the barcode at reception for instant keycard issuance.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free Breakfast Included
              </span>
              <span className="flex items-center gap-1 text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md">
                <Clock className="w-3 h-3 text-blue-600" /> 24/7 Reception Desk
              </span>
              <span className="flex items-center gap-1 text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-md">
                <Car className="w-3 h-3 text-indigo-600" /> Free 24/7 Terminal Shuttle
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT / TEAR-OFF STUB (Cols 9-12) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-slate-50 to-slate-100 p-6 md:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-dashed border-slate-300 relative">
          
          {/* Semicircle Cutouts for realistic ticket perforation effect */}
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

            {/* QR Code Scanner Simulation */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-2 group">
              <div className="relative w-28 h-28 p-1.5 bg-slate-900 rounded-xl flex items-center justify-center shadow-inner">
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
                  <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-lg border border-white/40">
                    <Plane className="w-4 h-4 transform -rotate-45" />
                  </div>
                </div>
              </div>

              <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-500">
                Scan for Express Check-in
              </span>
            </div>

            {/* Voucher Code Box with 1-Click Copy */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Official Voucher Code
              </span>
              <div className="font-mono font-black text-lg text-slate-900 tracking-wider">
                {voucherCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`w-full mt-2 py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Voucher Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Barcode Graphic */}
            <div className="text-center pt-1 space-y-1">
              <div className="h-10 w-full flex items-center justify-center gap-[2.5px] px-2 opacity-80">
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
            <span className="text-[10px] text-slate-400 font-medium block">
              Issued by SkyLine Air Transit Services
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
