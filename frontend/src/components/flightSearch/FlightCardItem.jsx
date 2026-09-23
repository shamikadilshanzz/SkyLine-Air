import React, { useState } from 'react';
import { Plane, Hotel, Wifi, Check, ChevronDown } from 'lucide-react';

const fmtTime = (value) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

// Calendar-day difference between departure and arrival (for the "+1" marker)
const dayDiff = (dep, arr) => {
  const a = new Date(dep);
  const b = new Date(arr);
  if (isNaN(a) || isNaN(b)) return 0;
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((db - da) / 86400000);
};

const POSITIVE_VALUES = ['No fees', 'Unlimited', 'Any time'];

export default function FlightCardItem({ flight, searchCriteria, onSelectFlight, onOpenDetails }) {
  // Check available cabin classes
  const hasEconomy = flight.priceEconomy != null && flight.priceEconomy > 0;
  const hasBusiness = flight.priceBusiness != null && flight.priceBusiness > 0;
  const hasFirst = flight.priceFirst != null && flight.priceFirst > 0;

  // Determine initial selected class
  const getInitialClass = () => {
    if (searchCriteria?.cabinClass === 'BUSINESS' && hasBusiness) return 'BUSINESS';
    if (searchCriteria?.cabinClass === 'FIRST' && hasFirst) return 'FIRST';
    if (hasEconomy) return 'ECONOMY';
    if (hasBusiness) return 'BUSINESS';
    if (hasFirst) return 'FIRST';
    return 'ECONOMY';
  };

  const [selectedClass, setSelectedClass] = useState(getInitialClass);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle clicking on a cabin class card
  const handleClassClick = (cls) => {
    if (selectedClass === cls) {
      setIsExpanded(!isExpanded);
    } else {
      setSelectedClass(cls);
      setIsExpanded(true);
    }
  };

  const passengerCount = searchCriteria?.passengers || 1;

  const getBasePrice = (cls) => {
    if (cls === 'BUSINESS') return flight.priceBusiness;
    if (cls === 'FIRST') return flight.priceFirst;
    return flight.priceEconomy || 350;
  };

  const unitPrice = getBasePrice(selectedClass);
  const currentPrice = unitPrice * passengerCount;
  const classLabel = selectedClass === 'BUSINESS' ? 'Business' : selectedClass === 'FIRST' ? 'First' : 'Economy';

  // Generate 3 dynamic fare tiers
  const fareTiers = [
    {
      id: 'classic',
      name: `${classLabel} Classic`,
      seatsLeft: `${flight.availableSeats || 3} seats left`,
      unitPrice: unitPrice,
      price: currentPrice,
      avios: Math.round(currentPrice * 3.5),
      standardSeat: 'For a fee',
      preferredSeat: 'For a fee',
      baggage: selectedClass === 'BUSINESS' ? '40kg' : selectedClass === 'FIRST' ? '50kg' : '25kg',
      changes: 'For a fee',
      cancellation: 'For a fee',
      carryOn: '1 piece, 7kg',
      upgrade: 'Available',
      isRecommended: false
    },
    {
      id: 'convenience',
      name: `${classLabel} Convenience`,
      seatsLeft: `${flight.availableSeats || 3} seats left`,
      unitPrice: Math.round(unitPrice * 1.38),
      price: Math.round(unitPrice * 1.38 * passengerCount),
      avios: Math.round(currentPrice * 5.2),
      standardSeat: 'No fees',
      preferredSeat: 'For a fee',
      baggage: selectedClass === 'BUSINESS' ? '45kg' : selectedClass === 'FIRST' ? '55kg' : '30kg',
      changes: '1 change',
      cancellation: 'For a fee',
      carryOn: '1 piece, 7kg',
      upgrade: 'Available',
      isRecommended: false
    },
    {
      id: 'comfort',
      name: `${classLabel} Comfort`,
      seatsLeft: `${flight.availableSeats || 3} seats left`,
      unitPrice: Math.round(unitPrice * 2.12),
      price: Math.round(unitPrice * 2.12 * passengerCount),
      avios: Math.round(currentPrice * 7.0),
      standardSeat: 'No fees',
      preferredSeat: 'No fees',
      baggage: selectedClass === 'BUSINESS' ? '50kg' : selectedClass === 'FIRST' ? '60kg' : '35kg',
      changes: 'Unlimited',
      cancellation: 'Any time',
      carryOn: '1 piece, 7kg',
      upgrade: 'Available',
      isRecommended: true
    }
  ];

  const cabins = [
    { id: 'ECONOMY', label: 'Economy', price: flight.priceEconomy, has: hasEconomy },
    { id: 'BUSINESS', label: 'Business', price: flight.priceBusiness, has: hasBusiness },
    { id: 'FIRST', label: 'First', price: flight.priceFirst, has: hasFirst }
  ].filter((c) => c.has);

  const arrivalOffset = dayDiff(flight.departureTime, flight.arrivalTime);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(15,30,92,0.06)] transition-shadow duration-300 hover:shadow-[0_12px_40px_rgb(15,30,92,0.12)]">
      {/* Layover perk banner */}
      {flight.hasLayover && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-white sm:px-6">
          <Hotel className="h-4 w-4 shrink-0" />
          <span className="truncate text-xs font-semibold">
            Complimentary hotel in {flight.layoverCity} ({flight.layoverDurationHours}h layover)
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
          {/* ---------- Left: timeline ---------- */}
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                SkyLine Suite
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                <Wifi className="h-3 w-3" /> Starlink Wi-Fi
              </span>
              {flight.hasLayover && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                  {flight.stops} stop via {flight.layoverAirport}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              {/* Departure */}
              <div className="shrink-0">
                <div className="text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-3xl">
                  {fmtTime(flight.departureTime)}
                </div>
                <div className="mt-0.5 text-xs font-bold text-slate-500">{flight.origin}</div>
              </div>

              {/* Flight path */}
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <div className="relative flex w-full items-center">
                  <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />
                  <span className="absolute left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow ring-1 ring-blue-100">
                    <Plane className="h-3.5 w-3.5 rotate-45 text-blue-600" />
                  </span>
                </div>
                <div className="mt-2 whitespace-nowrap text-center text-[11px] font-medium text-slate-500">
                  {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                  <span className="mx-1 text-slate-300">|</span>
                  {flight.duration}
                </div>
              </div>

              {/* Arrival */}
              <div className="shrink-0 text-right">
                <div className="flex items-baseline justify-end gap-1 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-3xl">
                  {fmtTime(flight.arrivalTime)}
                  {arrivalOffset > 0 && <span className="text-xs font-bold text-blue-600">+{arrivalOffset}</span>}
                </div>
                <div className="mt-0.5 text-xs font-bold text-slate-500">{flight.destination}</div>
              </div>
            </div>

            <button
              onClick={() => onOpenDetails(flight)}
              className="text-xs font-semibold text-blue-600 underline underline-offset-4 transition-colors hover:text-blue-800"
            >
              Flight details
            </button>
          </div>

          {/* ---------- Right: cabin classes ---------- */}
          <div className="lg:shrink-0">
            <div
              className="grid gap-2 lg:flex lg:gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.max(cabins.length, 1)}, minmax(0, 1fr))` }}
            >
              {cabins.map((c) => {
                const active = selectedClass === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleClassClick(c.id)}
                    aria-pressed={active}
                    aria-expanded={active && isExpanded}
                    className={`relative min-w-0 rounded-2xl border-2 p-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 sm:p-3.5 lg:w-[140px] ${active
                        ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-white shadow-md shadow-blue-600/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span className="truncate">{c.label}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${active ? 'text-blue-600' : 'text-slate-300'
                          } ${active && isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                    <div className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums sm:text-xl">
                      ${(c.price * passengerCount).toLocaleString()}
                    </div>
                    {passengerCount > 1 && (
                      <div className="text-[10px] font-medium text-slate-400">${c.price.toLocaleString()}/person</div>
                    )}
                  </button>
                );
              })}
            </div>
            {!isExpanded && <p className="mt-2 text-center text-[11px] text-slate-400 lg:text-left">Tap a cabin to compare fares</p>}
          </div>
        </div>
      </div>

      {/* ---------- Fare comparison ---------- */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white">
          <div className="p-4 sm:p-5 lg:p-6">
            {/* Mobile: swipeable cards. Desktop: 3-column grid */}
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 pt-4 sm:-mx-5 sm:px-5 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0">
              {fareTiers.map((tier) => {
                const rows = [
                  ['Standard seat', tier.standardSeat],
                  ['Preferred seat', tier.preferredSeat],
                  ['Checked baggage', tier.baggage],
                  ['Changes', tier.changes],
                  ['Cancellation', tier.cancellation],
                  ['Carry-on', tier.carryOn],
                  ['Upgrade', tier.upgrade]
                ];

                return (
                  <div
                    key={tier.id}
                    className={`relative flex w-[82%] shrink-0 snap-center flex-col rounded-2xl border bg-white p-4 transition-all sm:w-[55%] sm:p-5 lg:w-auto ${tier.isRecommended
                        ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                        : 'border-slate-200 shadow-sm'
                      }`}
                  >
                    {tier.isRecommended && (
                      <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white shadow-sm">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        Recommended
                      </div>
                    )}

                    {/* Header */}
                    <div className="border-b border-slate-100 pb-4 text-center">
                      <h4 className="text-sm font-bold text-slate-900">{tier.name}</h4>
                      <div className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                        {tier.seatsLeft}
                      </div>
                      <div className="mt-2 text-3xl font-black text-slate-900 tabular-nums">${tier.price.toLocaleString()}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {passengerCount} {passengerCount === 1 ? 'passenger' : 'passengers'} (${tier.unitPrice.toLocaleString()}/person)
                      </div>
                      <div className="mt-1.5 text-[11px] font-semibold text-emerald-600">
                        Earn {tier.avios.toLocaleString()} Avios
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex-1 space-y-2.5 py-4 text-xs">
                      {rows.map(([label, value]) => {
                        const positive = POSITIVE_VALUES.some((p) => value.includes(p));
                        return (
                          <div key={label} className="flex items-center justify-between gap-3">
                            <span className="text-slate-400">{label}</span>
                            <span
                              className={`inline-flex items-center gap-1 text-right font-semibold ${positive ? 'text-emerald-600' : label === 'Upgrade' ? 'text-blue-600' : 'text-slate-700'
                                }`}
                            >
                              {positive && <Check className="h-3 w-3" strokeWidth={3} />}
                              {value}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() =>
                        onSelectFlight({
                          ...flight,
                          selectedClass,
                          cabinClass: selectedClass,
                          fareTier: tier.name,
                          price: tier.price,
                          unitPrice: tier.unitPrice,
                          passengers: passengerCount
                        })
                      }
                      className={`w-full rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98] ${tier.isRecommended
                          ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/30 hover:from-blue-500 hover:to-blue-700'
                          : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                        }`}
                    >
                      Select fare
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-1 text-center text-[11px] text-slate-400 lg:hidden">Swipe to compare fares</p>
          </div>
        </div>
      )}
    </div>
  );
}