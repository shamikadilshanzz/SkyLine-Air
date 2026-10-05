import React, { useEffect } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  FileText,
  CreditCard,
  ShieldCheck,
  Plane,
  Download,
  Copy,
  Check,
  Calendar,
  Clock,
  Building2,
  Mail,
  User,
  Sparkles
} from 'lucide-react';

export default function PaymentReceiptModal({ payment, reservation, onClose }) {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!payment && !reservation) return null;

  const data = reservation || {};
  const pnr = data.pnrCode || data.pnr || 'SK-784920';
  const txnRef = payment?.transactionReference || payment?.transactionRef || data.transactionRef || 'TXN-9938102938';
  const paymentMethod = payment?.paymentMethod || data.paymentMethod || 'Credit / Debit Card (Visa)';
  const amount = Number(payment?.amount || data.totalAmount || data.paidAmount || 780);
  const paymentDate = payment?.paymentTimestamp
    ? new Date(payment.paymentTimestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const passengerName = data.userName || (data.passengers && data.passengers[0] ? `${data.passengers[0].firstName} ${data.passengers[0].lastName}` : data.passenger ? `${data.passenger.firstName} ${data.passenger.lastName}` : 'Valued Passenger');
  const passengerEmail = data.userEmail || (data.passengers && data.passengers[0]?.email) || 'passenger@skylineair.com';
  const flightNumber = data.flightNumber || data.flight?.flightNumber || 'SL-204';
  const origin = data.origin || data.flight?.origin || 'CMB';
  const destination = data.destination || data.flight?.destination || 'LHR';
  const cabinClass = (data.cabinClass || data.flight?.cabinClass || 'ECONOMY').toUpperCase();
  const passengerCount = (data.passengers && data.passengers.length) || data.passengerCount || 1;

  const unitPrice = data.unitPrice || data.flight?.unitPrice || 350;
  const baseFare = data.baseFlightPrice || (unitPrice * passengerCount);
  const taxes = 45 * passengerCount;
  const fuel = 25 * passengerCount;
  const baggageFee = data.extraBaggageFee || 0;
  const mealFee = data.mealFee || 0;
  const isComplimentaryHotel = Boolean(
    data.isComplimentaryHotel ||
    data.selectedHotel?.isComplimentary ||
    ((data.hasLayover || data.flight?.hasLayover) && Number(data.layoverDurationHours || data.flight?.layoverDurationHours || 0) >= 8)
  );
  const hotelFee = isComplimentaryHotel ? 0 : (data.hotelPrice || (data.selectedHotel ? (data.selectedHotel.totalPrice || 120) : 0));

  const handleCopyTxn = () => {
    navigator.clipboard?.writeText(txnRef);
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
      aria-label="Official Airline Payment Receipt & Tax Invoice"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-3xl my-6 rounded-[2rem] bg-white shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[92vh]">
        
        {/* Top Floating Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">Official Payment Receipt & Tax Invoice</h3>
              <p className="text-[11px] text-slate-500">Transaction Reference: <span className="font-mono font-bold text-blue-600">{txnRef}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95"
            >
              <Printer className="h-3.5 w-3.5 text-blue-600" />
              <span>Print Invoice</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Receipt"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 printable-eticket">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-lg">
                <Plane className="h-6 w-6 -rotate-45" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">SkyLine Air International Aviation</span>
                <h2 className="text-2xl font-black text-slate-900">Official Payment Tax Invoice</h2>
                <span className="text-[11px] text-slate-500">VAT/Tax ID: SL-AV-2026-98421 • IATA Code: SLA-674</span>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>PAID & SETTLED</span>
              </div>
              <div className="text-xs text-slate-500">Issued: {paymentDate}</div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Transaction Reference</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-bold text-slate-900 text-xs truncate">{txnRef}</span>
                <button
                  onClick={handleCopyTxn}
                  title="Copy Transaction Ref"
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Booking Reference (PNR)</span>
              <span className="font-mono font-black text-blue-600 text-sm mt-0.5 block">{pnr}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Method</span>
              <span className="font-bold text-slate-800 text-xs mt-0.5 block flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{paymentMethod}</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Billed Customer</span>
              <span className="font-extrabold text-slate-900 text-xs mt-0.5 block truncate">{passengerName}</span>
              <span className="text-[10px] text-slate-500 truncate block">{passengerEmail}</span>
            </div>
          </div>

          {/* Flight Summary */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                <Plane className="w-4 h-4 -rotate-45" />
              </div>
              <div>
                <span className="font-extrabold text-blue-950 block text-sm">
                  Flight {flightNumber}: {origin} → {destination}
                </span>
                <span className="text-slate-600 text-[11px]">
                  {cabinClass} Class • {passengerCount} {passengerCount === 1 ? 'Passenger' : 'Passengers'} • Seat {data.seat || (data.passengers && data.passengers[0]?.seatNumber) || '14A'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">Gateway Auth Status</span>
              <span className="font-extrabold text-emerald-700 flex items-center gap-1 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 3D-Secure 2.0 Authenticated
              </span>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Itemized Fare Breakdown</h4>
            
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">Base Airfare ({cabinClass} Class)</span>
                      <span className="text-[10px] text-slate-500">Route {origin} to {destination} ({flightNumber})</span>
                    </td>
                    <td className="p-3 text-center font-semibold">{passengerCount}</td>
                    <td className="p-3 text-right font-mono">${unitPrice}.00</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${baseFare}.00</td>
                  </tr>

                  <tr>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">Government Aviation Taxes & Airport Facility Fees</span>
                      <span className="text-[10px] text-slate-500">International Security & Departure Levies</span>
                    </td>
                    <td className="p-3 text-center font-semibold">{passengerCount}</td>
                    <td className="p-3 text-right font-mono">$45.00</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${taxes}.00</td>
                  </tr>

                  <tr>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">Airline Fuel & Emission Surcharge</span>
                      <span className="text-[10px] text-slate-500">Standard carrier jet fuel levy</span>
                    </td>
                    <td className="p-3 text-center font-semibold">{passengerCount}</td>
                    <td className="p-3 text-right font-mono">$25.00</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${fuel}.00</td>
                  </tr>

                  {mealFee > 0 && (
                    <tr>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">In-Flight Gourmet Chef Dining Selection</span>
                        <span className="text-[10px] text-slate-500">Custom tailored inflight cuisine</span>
                      </td>
                      <td className="p-3 text-center font-semibold">{passengerCount}</td>
                      <td className="p-3 text-right font-mono">${mealFee / passengerCount}.00</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">+${mealFee}.00</td>
                    </tr>
                  )}

                  {baggageFee > 0 && (
                    <tr>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">Extra Baggage Allowance</span>
                        <span className="text-[10px] text-slate-500">Additional checked baggage tier</span>
                      </td>
                      <td className="p-3 text-center font-semibold">1</td>
                      <td className="p-3 text-right font-mono">${baggageFee}.00</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">+${baggageFee}.00</td>
                    </tr>
                  )}

                  {(hotelFee > 0 || isComplimentaryHotel || data.hotelBooked || data.selectedHotel) && (
                    <tr>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          Partner Transit Hotel Accommodation
                          {isComplimentaryHotel && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
                              100% COMPLIMENTARY
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500">{data.selectedHotel?.name || data.hotelName || 'Airport Transit Hotel'}</span>
                      </td>
                      <td className="p-3 text-center font-semibold">1</td>
                      <td className="p-3 text-right font-mono">{isComplimentaryHotel ? '$0.00' : `$${hotelFee}.00`}</td>
                      <td className={`p-3 text-right font-mono font-bold ${isComplimentaryHotel ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isComplimentaryHotel ? 'FREE ($0.00)' : `+$${hotelFee}.00`}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-extrabold text-sm">
                    <td colSpan={3} className="p-3.5 text-right uppercase tracking-wider text-xs text-slate-300">
                      Total Paid (USD Incl. Taxes)
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-xl text-emerald-400">
                      ${amount.toLocaleString()}.00
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Legal / Compliance Footer */}
          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
            <p>
              This electronic document serves as an official proof of payment and tax invoice issued by SkyLine Air. 
              All tickets are subject to airline conditions of carriage and applicable international aviation conventions.
            </p>
            <p className="font-mono text-slate-400">
              Electronic Signature ID: SHA256-DIGITAL-STAMP-{txnRef.replace(/\D/g, '') || '9928192'} • Generated at {paymentDate}
            </p>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official Encrypted Payment Receipt</span>
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
