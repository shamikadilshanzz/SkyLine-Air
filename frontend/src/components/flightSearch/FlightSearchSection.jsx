import React, { useState, useEffect } from 'react';
import {
  Plane,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Sparkles,
  ArrowRightLeft,
  ArrowRight,
  Search,
  TrendingDown,
  Zap,
  Hotel,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { INITIAL_AIRPORTS } from '../../data/mockData';

/* ------------------------------------------------------------------ */
/*  Hero background photos. Swap these for your own images any time.   */
/*  kb = [x, y] drift used by the slow "Ken Burns" zoom on each photo. */
/* ------------------------------------------------------------------ */
const HERO_SLIDES = [
  {
    key: 'SIN',
    city: 'Singapore',
    code: 'SIN',
    from: 350,
    src: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1920&q=75',
    kb: ['-2.5%', '-1.5%']
  },
  {
    key: 'DXB',
    city: 'Dubai',
    code: 'DXB',
    from: 480,
    src: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=75',
    kb: ['2.5%', '-1%']
  },
  {
    key: 'LHR',
    city: 'London',
    code: 'LHR',
    from: 780,
    src: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&q=75',
    kb: ['-2%', '2%']
  },
  {
    key: 'HND',
    city: 'Tokyo',
    code: 'HND',
    from: 610,
    src: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1920&q=75',
    kb: ['2%', '1.5%']
  }
];

const SLIDE_MS = 6500;

/* A labelled field box: label sits inside the box so it works on any width */
function Field({ label, icon: Icon, chevron = false, children }) {
  return (
    <label className="relative block min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 pb-2.5 pt-2 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
      <span className="block text-xs font-semibold text-slate-500">{label}</span>
      <span className="mt-0.5 flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-blue-600" />
        {children}
        {chevron && <ChevronDown className="pointer-events-none h-4 w-4 shrink-0 text-slate-400" />}
      </span>
    </label>
  );
}

const fieldInput =
  'min-w-0 flex-1 appearance-none truncate bg-transparent text-base font-bold text-slate-900 outline-none sm:text-sm';

export default function FlightSearchSection({ onExecuteSearch }) {
  const [tripType, setTripType] = useState('roundtrip'); // 'oneway', 'roundtrip', 'multicity'
  const [origin, setOrigin] = useState('CMB');
  const [destination, setDestination] = useState('SIN');
  const [departDate, setDepartDate] = useState('2026-09-10');
  const [returnDate, setReturnDate] = useState('2026-09-17');
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState('ECONOMY');
  const [validationError, setValidationError] = useState('');

  // Hero slideshow state. `prev` keeps the outgoing photo animating while it fades out.
  const [slide, setSlide] = useState({ active: 0, prev: null });
  const [failed, setFailed] = useState({});
  const slides = HERO_SLIDES.filter((s) => !failed[s.key]);
  const activeIdx = slides.length ? slide.active % slides.length : 0;
  const current = slides[activeIdx];

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || slides.length < 2) return undefined;
    const id = setInterval(() => {
      setSlide((s) => ({ active: (s.active + 1) % slides.length, prev: s.active % slides.length }));
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  const goToSlide = (i) => setSlide((s) => (i === activeIdx ? s : { active: i, prev: activeIdx }));

  const pickSlideRoute = () => {
    if (current && INITIAL_AIRPORTS.some((a) => a.code === current.code)) {
      setDestination(current.code);
      setValidationError('');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!origin || !destination) {
      setValidationError('Please select both origin and destination airports.');
      return;
    }
    if (origin === destination) {
      setValidationError('Destination airport cannot be the same as origin airport.');
      return;
    }
    if (!departDate) {
      setValidationError('Please choose a departure date.');
      return;
    }
    if (tripType === 'roundtrip' && returnDate && new Date(returnDate) < new Date(departDate)) {
      setValidationError('Return date must be after departure date.');
      return;
    }

    onExecuteSearch({ tripType, origin, destination, departDate, returnDate, passengers, cabinClass });
  };

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const tripTypes = [
    { id: 'roundtrip', label: 'Round trip' },
    { id: 'oneway', label: 'One way' },
    { id: 'multicity', label: 'Multi city' }
  ];

  return (
    <div className="relative">
      <style>{`
        @keyframes slh-kenburns {
          from { transform: scale(1.06) translate3d(0, 0, 0); }
          to   { transform: scale(1.2) translate3d(var(--kb-x, 0), var(--kb-y, 0), 0); }
        }
        @keyframes slh-cloud {
          from { transform: translate3d(-45vw, 0, 0); }
          to   { transform: translate3d(125vw, 0, 0); }
        }
        @keyframes slh-rise {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes slh-caption {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes slh-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes slh-glow {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to   { transform: translate3d(28px, -18px, 0) scale(1.12); }
        }
        .slh-kb { animation: slh-kenburns ${SLIDE_MS + 2500}ms ease-out forwards; will-change: transform; }
        .slh-cloud { animation: slh-cloud linear infinite; }
        .slh-rise { animation: slh-rise .8s cubic-bezier(.2,.8,.2,1) both; }
        .slh-caption { animation: slh-caption .5s ease both; }
        .slh-progress { transform-origin: left; animation: slh-progress ${SLIDE_MS}ms linear forwards; }
        .slh-glow { animation: slh-glow 12s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) {
          .slh-kb, .slh-cloud, .slh-rise, .slh-caption, .slh-progress, .slh-glow { animation: none; }
          .slh-svg-plane, .slh-cloud { display: none; }
        }
      `}</style>

      {/* ============================ HERO ============================ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8] px-4 pb-36 pt-10 text-white sm:px-6 sm:pb-40 sm:pt-14">
        {/* 1. Photo slideshow (crossfade + slow zoom). The gradient above is the fallback. */}
        <div className="absolute inset-0" aria-hidden="true">
          {slides.map((s, i) => {
            const isActive = i === activeIdx;
            const isPrev = i === slide.prev && !isActive;
            return (
              <img
                key={s.key}
                src={s.src}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                onError={() => setFailed((f) => ({ ...f, [s.key]: true }))}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ease-in-out ${
                  isActive || isPrev ? 'slh-kb' : ''
                } ${isActive ? 'opacity-100' : 'opacity-0'}`}
                style={{ '--kb-x': s.kb[0], '--kb-y': s.kb[1] }}
              />
            );
          })}
        </div>

        {/* 2. Navy tint keeps the theme and guarantees the text is readable */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1230]/90 via-[#0f1e5c]/70 to-[#1d4ed8]/55" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a1230]/70 to-transparent" aria-hidden="true" />

        {/* 3. Glows */}
        <div className="slh-glow pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="slh-glow pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" style={{ animationDirection: 'alternate-reverse' }} />

        {/* 4. Drifting clouds */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="slh-cloud absolute left-0 top-[16%] h-24 w-[28rem] rounded-full bg-white/[0.12] blur-2xl" style={{ animationDuration: '48s' }} />
          <div className="slh-cloud absolute left-0 top-[50%] h-16 w-80 rounded-full bg-white/[0.10] blur-2xl" style={{ animationDuration: '66s', animationDelay: '-24s' }} />
          <div className="slh-cloud absolute left-0 top-[30%] h-20 w-64 rounded-full bg-white/[0.08] blur-2xl" style={{ animationDuration: '84s', animationDelay: '-50s' }} />
        </div>

        {/* 5. Flight-path arc with a plane travelling along it */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
          viewBox="0 0 800 300"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <path
            id="slh-arc"
            d="M-20 260 C 220 20, 560 20, 820 220"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeDasharray="4 8"
            opacity="0.5"
          />
          <g className="slh-svg-plane">
            <path d="M12 0 L-10 -8 L-5 0 L-10 8 Z" fill="white" />
            <animateMotion dur="11s" repeatCount="indefinite" rotate="auto">
              <mpath href="#slh-arc" />
            </animateMotion>
          </g>
        </svg>

        {/* 6. Copy */}
        <div className="relative mx-auto max-w-6xl space-y-4 text-center drop-shadow-[0_2px_20px_rgba(7,13,36,0.45)]">
          <div className="slh-rise inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-100 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Fly smarter with SkyLine Air AI search
          </div>

          <h1 className="slh-rise mx-auto max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl" style={{ animationDelay: '120ms' }}>
            Save time and money on every trip
          </h1>
          <p className="slh-rise mx-auto max-w-xl text-sm leading-relaxed text-blue-50/90 sm:text-base" style={{ animationDelay: '240ms' }}>
            Real-time fares and seat availability, layover hotel packages, and instant e-tickets, all in one search.
          </p>
        </div>

        {/* 7. Slide caption + progress dots (sits just above the overlapping search card) */}
        {current && (
          <div className="absolute inset-x-0 bottom-[5.75rem] px-4 sm:bottom-28">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
              <button
                key={current.key}
                type="button"
                onClick={pickSlideRoute}
                title={`Set destination to ${current.city}`}
                className="slh-caption group flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pl-3 pr-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-300" />
                <span className="truncate">
                  {current.city} ({current.code}) <span className="text-blue-100/80">from ${current.from}</span>
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-white group-hover:text-blue-700">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>

              {slides.length > 1 && (
                <div className="flex items-center gap-2" role="tablist" aria-label="Featured destination photos">
                  {slides.map((s, i) => {
                    const active = i === activeIdx;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-label={`Show ${s.city}`}
                        onClick={() => goToSlide(i)}
                        className={`relative h-2 overflow-hidden rounded-full bg-white/30 transition-all duration-300 ${
                          active ? 'w-9' : 'w-2 hover:bg-white/60'
                        }`}
                      >
                        {active && <span key={`${s.key}-${slide.active}`} className="slh-progress absolute inset-0 rounded-full bg-white" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================= SEARCH CARD ======================= */}
      <div className="relative z-20 mx-auto -mt-20 max-w-6xl px-4 sm:-mt-24">
        <div className="slh-rise rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_20px_60px_rgb(15,30,92,0.15)] sm:p-6 md:p-8" style={{ animationDelay: '320ms' }}>
          {/* Trip type + passengers + cabin */}
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1 text-xs font-bold sm:inline-grid sm:grid-cols-3">
              {tripTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tripType === t.id}
                  onClick={() => setTripType(t.id)}
                  className={`rounded-xl px-3 py-2.5 transition-all sm:px-5 ${tripType === t.id
                      ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Users className="h-4 w-4 shrink-0 text-blue-600" />
                <select
                  aria-label="Passengers"
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="min-w-0 flex-1 cursor-pointer bg-transparent text-base font-bold text-slate-900 outline-none sm:text-sm"
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Passengers</option>
                  <option value={4}>4 Passengers</option>
                </select>
              </div>

              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Plane className="h-4 w-4 shrink-0 text-blue-600" />
                <select
                  aria-label="Cabin class"
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="min-w-0 flex-1 cursor-pointer bg-transparent text-base font-bold text-slate-900 outline-none sm:text-sm"
                >
                  <option value="ECONOMY">Economy</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Validation */}
          {validationError && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="mt-px h-4 w-4 shrink-0 text-red-600" />
              <span className="font-semibold">{validationError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-stretch">
            {/* From / To with swap */}
            <div className="relative grid gap-3 md:grid-cols-2 xl:flex-[2]">
              <Field label="From" icon={MapPin} chevron>
                <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={fieldInput}>
                  {INITIAL_AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.city} ({a.code}) - {a.country}
                    </option>
                  ))}
                </select>
              </Field>

              <button
                type="button"
                onClick={swapLocations}
                title="Swap origin and destination"
                aria-label="Swap origin and destination"
                className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-90 md:right-auto md:left-1/2 md:-translate-x-1/2"
              >
                <ArrowRightLeft className="h-4 w-4 rotate-90 md:rotate-0" />
              </button>

              <Field label="To" icon={MapPin} chevron>
                <select value={destination} onChange={(e) => setDestination(e.target.value)} className={fieldInput}>
                  {INITIAL_AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.city} ({a.code}) - {a.country}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Dates */}
            <div className={`grid gap-3 xl:flex-[1.2] ${tripType === 'roundtrip' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <Field label="Depart" icon={CalendarIcon}>
                <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} className={fieldInput} />
              </Field>
              {tripType === 'roundtrip' && (
                <Field label="Return" icon={CalendarIcon}>
                  <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={fieldInput} />
                </Field>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 text-sm font-extrabold text-white shadow-xl shadow-blue-600/30 transition hover:from-blue-700 hover:to-indigo-800 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 xl:h-auto xl:min-w-[180px]"
            >
              <Search className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              Search flights
            </button>
          </form>
        </div>

        {/* Reassurance chips */}
        <div className="mt-5 flex flex-wrap justify-center gap-2 pb-2 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-emerald-600" /> Live fares
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
            <Hotel className="h-3.5 w-3.5 text-blue-600" /> Free hotel on long layovers
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" /> Instant e-ticket
          </span>
        </div>
      </div>
    </div>
  );
}