import React, { useEffect, useRef, useState } from 'react';
import {
  Plane,
  PlaneTakeoff,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Hotel,
  Star,
  Compass,
  Globe,
  Coffee,
  Wifi,
  Award,
  Clock,
  CheckCircle2,
  Headphones,
  Utensils,
  Briefcase,
  Copy,
  Check,
  Search,
  CalendarCheck,
  Ticket,
  Armchair,
  RotateCcw,
  Plus,
  Mail,
  Tag
} from 'lucide-react';
import FlightSearchSection from '../flightSearch/FlightSearchSection';
// Put the banner at src/assets/skyline-banner.png (adjust this path to your project)
import heroBanner from '../../assets/skyline-banner.png';

/* ---------- palette (unchanged): navy #0a1230, blue #2563eb, indigo #4f46e5, sky #38bdf8, amber accent ---------- */
const NAVY = 'bg-gradient-to-br from-[#0a1230] via-[#0f1e5c] to-[#1d4ed8]';
const GLASS = 'border border-white/10 bg-white/[0.04]';
const GLASS_HOVER = 'transition-all duration-300 hover:border-sky-400/30 hover:bg-white/[0.07]';

/* ---------- hooks ---------- */

/* Fires once when the element scrolls into view (immediately for reduced motion) */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, shown];
}

/* Wrapper that rises into place once visible. Hover effects belong on the child, not here. */
function Reveal({ delay = 0, className = '', children }) {
  const [ref, shown] = useReveal();
  return (
    <div ref={ref} className={`hp-reveal ${shown ? 'hp-shown' : ''} ${className}`} style={{ '--d': `${delay}ms` }}>
      {children}
    </div>
  );
}

/* Number that counts up when it scrolls into view */
function CountUp({ to, decimals = 0, prefix = '', suffix = '', duration = 1500 }) {
  const [ref, shown] = useReveal(0.4);
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!shown) return undefined;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setVal(to);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, to, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ---------- small shared pieces ---------- */

function SectionTitle({ title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="hp-display max-w-2xl text-3xl font-extrabold leading-[1.05] text-slate-900 sm:text-4xl lg:text-[2.6rem]">
          {title}
        </h2>
        {subtitle && <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/* Hairline divider; optionally a plane crosses it */
function Divider({ plane = false }) {
  return (
    <div className="relative h-px bg-white/10" aria-hidden="true">
      {plane && (
        <span className="hp-fly absolute -top-[9px] text-sky-400/80">
          <Plane className="h-[18px] w-[18px] rotate-45" />
        </span>
      )}
    </div>
  );
}

/* Decorative barcode with a scanner light sweeping across it */
const BARS = [2, 1, 3, 1, 2, 1, 1, 4, 1, 2, 3, 1, 1, 2, 4, 1, 3, 1, 2, 1, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1];
function Barcode() {
  return (
    <div className="relative h-10 overflow-hidden rounded-md" aria-hidden="true">
      <div className="flex h-full items-stretch gap-[2px]">
        {BARS.map((w, i) => (
          <span key={i} className="bg-slate-800" style={{ width: `${w * 1.5}px` }} />
        ))}
      </div>
      <span className="hp-scan absolute top-0 h-full w-10 bg-gradient-to-r from-transparent via-sky-300/80 to-transparent" />
    </div>
  );
}

/* Accordion */
function Faq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`hp-faq-${i}`}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="group flex w-full items-center justify-between gap-4 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <span className="hp-display text-base font-bold text-slate-900 transition-colors group-hover:text-blue-700 sm:text-lg">
                {it.q}
              </span>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${isOpen ? 'rotate-45 border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-500 group-hover:border-blue-300'}`}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>
            <div
              id={`hp-faq-${i}`}
              role="region"
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-5 pr-12 text-sm leading-relaxed text-slate-500">{it.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Booking flow: a route line fills as a plane flies along it and each step lights up in turn */
function BookingJourney({ steps }) {
  const [ref, shown] = useReveal(0.25);
  return (
    <div ref={ref} className={shown ? 'hp-shown' : ''}>
      {/* Desktop: horizontal route */}
      <div className="relative hidden lg:block">
        <div className="absolute left-[12.5%] right-[12.5%] top-7 border-t border-dashed border-slate-300" />
        <div className="absolute left-[12.5%] right-[12.5%] top-[27px] h-0.5">
          <div className="hp-fill-x relative h-full bg-gradient-to-r from-blue-500 to-sky-400">
            <span className="hp-fill-plane absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-blue-600">
              <Plane className="h-5 w-5 rotate-45" />
            </span>
          </div>
        </div>
        <ol className="relative grid grid-cols-4 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="text-center">
                <span
                  className="hp-node relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-400"
                  style={{ '--i': i }}
                >
                  <Icon className="h-6 w-6" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <h3 className="hp-display mt-5 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mx-auto mt-1.5 max-w-[15rem] text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile / tablet: vertical route */}
      <ol className="lg:hidden">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const last = i === steps.length - 1;
          return (
            <li key={s.title} className={`relative flex gap-4 ${last ? '' : 'pb-8'}`}>
              {!last && (
                <span
                  className="hp-seg absolute -bottom-0 left-6 top-12 w-0.5 origin-top bg-gradient-to-b from-blue-500 to-sky-400"
                  style={{ '--i': i }}
                />
              )}
              <span
                className="hp-node relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-400"
                style={{ '--i': i }}
              >
                <Icon className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <div className="pt-1">
                <h3 className="hp-display text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* Feature shortcuts shown over the banner (desktop hotspots) and as tiles (mobile).
   `hot` is the position of the icon+label baked into the banner, in % of the image. */
const HERO_FEATURES = [
  { key: 'search', label: 'Search flights', hint: 'Go to search', icon: Search, hot: { left: 3.1, top: 68.6, width: 5.4, height: 16.7 } },
  { key: 'destinations', label: 'Book easily', hint: 'Pick a destination', icon: CalendarCheck, hot: { left: 12.1, top: 68.6, width: 5.7, height: 16.7 } },
  { key: 'services', label: 'Travel safely', hint: 'See our services', icon: ShieldCheck, hot: { left: 21.3, top: 68.6, width: 5.2, height: 16.7 } },
  { key: 'promos', label: 'Explore the world', hint: 'View offers', icon: PlaneTakeoff, hot: { left: 30.1, top: 68.6, width: 6.4, height: 16.7 } }
];

/* Route drawn on the banner (in the image's own 1944x809 coordinates) */
const HERO_ROUTE = 'M108 292 C 200 270 320 225 420 210 C 520 196 620 225 668 300 C 690 332 720 380 752 414';

/* ---------- Hero banner ---------- */

function HeroBanner({ onPick, onSearch, onBookings }) {
  const layerRef = useRef(null);

  // Gentle depth on desktop: the banner leans away from the cursor
  const handleMove = (e) => {
    if (e.pointerType !== 'mouse' || !layerRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    layerRef.current.style.setProperty('--px', (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
    layerRef.current.style.setProperty('--py', (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
  };
  const handleLeave = () => {
    if (!layerRef.current) return;
    layerRef.current.style.setProperty('--px', '0');
    layerRef.current.style.setProperty('--py', '0');
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      {/* ---------- Desktop: the full banner, with live route + clickable feature icons ---------- */}
      <section aria-label="SkyLine Air" className="hidden lg:block">
        <h2 className="sr-only">SkyLine Air: good flights, better journeys</h2>
        <div
          className="relative overflow-hidden rounded-[1.75rem] bg-[#070d24] shadow-2xl shadow-blue-900/25 ring-1 ring-slate-900/5"
          style={{ aspectRatio: '1944 / 809' }}
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
        >
          <div ref={layerRef} className="hp-parallax absolute inset-0">
            <div className="hp-wipe absolute inset-0">
              <img
                src={heroBanner}
                alt="A SkyLine Air jet climbing through the clouds with a boarding pass, and a route map from the west to Asia-Pacific"
                decoding="async"
                draggable={false}
                className="hp-zoom h-full w-full select-none object-cover"
              />
            </div>

            <span className="hp-drift pointer-events-none absolute right-[6%] top-[50%] h-24 w-64 rounded-full bg-white/20 blur-3xl" />
            <span className="hp-drift-slow pointer-events-none absolute left-[48%] top-[70%] h-20 w-56 rounded-full bg-white/20 blur-3xl" />

            <svg
              className="hp-svg-anim pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1944 809"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <filter id="hp-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d={HERO_ROUTE} pathLength="100" fill="none" stroke="#7dd3fc" strokeWidth="5" strokeLinecap="round" strokeDasharray="7 93" filter="url(#hp-glow)" className="hp-comet" />
              <path d={HERO_ROUTE} pathLength="100" fill="none" stroke="#bae6fd" strokeWidth="4" strokeLinecap="round" strokeDasharray="5 95" filter="url(#hp-glow)" className="hp-comet hp-comet-b" />
              <ellipse cx="108" cy="297" rx="8" ry="3" fill="none" stroke="#7dd3fc" strokeWidth="2">
                <animate attributeName="rx" values="8;46" dur="2.8s" repeatCount="indefinite" />
                <animate attributeName="ry" values="3;18" dur="2.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur="2.8s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="668" cy="362" rx="8" ry="3" fill="none" stroke="#7dd3fc" strokeWidth="2">
                <animate attributeName="rx" values="8;46" dur="2.8s" begin="1.4s" repeatCount="indefinite" />
                <animate attributeName="ry" values="3;18" dur="2.8s" begin="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur="2.8s" begin="1.4s" repeatCount="indefinite" />
              </ellipse>
            </svg>

            {HERO_FEATURES.map((f, i) => (
              <button
                key={f.key}
                type="button"
                onClick={() => onPick(f.key)}
                aria-label={`${f.label}: ${f.hint}`}
                className="group absolute rounded-2xl outline-none transition duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:ring-1 hover:ring-sky-300/40 focus-visible:ring-2 focus-visible:ring-sky-300"
                style={{ left: `${f.hot.left}%`, top: `${f.hot.top}%`, width: `${f.hot.width}%`, height: `${f.hot.height}%`, '--hd': `${1.7 + i * 0.3}s` }}
              >
                <span className="hp-hot pointer-events-none absolute inset-0 rounded-2xl" />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-900 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  {f.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Mobile / tablet: cropped photo + live text + tappable tiles ---------- */}
      <section aria-label="SkyLine Air" className="lg:hidden">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-[#070d24] shadow-2xl shadow-blue-900/25 ring-1 ring-slate-900/5">
          <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[2/1]">
            <div className="hp-wipe absolute inset-0">
              <img
                src={heroBanner}
                alt="A SkyLine Air jet climbing through the clouds beside a boarding pass"
                decoding="async"
                draggable={false}
                className="hp-zoom h-full w-full select-none object-cover object-[82%_center]"
              />
            </div>
            <span className="hp-drift pointer-events-none absolute -right-6 top-1/3 h-20 w-48 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070d24] via-[#070d24]/25 to-transparent" />
          </div>

          <div className="relative -mt-12 px-4 pb-5 sm:-mt-16 sm:px-6 sm:pb-6">
            <div className="hp-drift pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-blue-600/25 blur-3xl" />
            <div className="hp-drift-slow pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-indigo-500/25 blur-3xl" />

            <div className="relative">
              <h2 className="hp-rise hp-display text-3xl font-extrabold leading-[1.05] text-white sm:text-4xl" style={{ '--d': '700ms' }}>
                Good flights,
                <br />
                <span className="font-medium text-sky-400">better journeys.</span>
              </h2>
              <p className="hp-rise mt-3 max-w-md text-sm leading-relaxed text-slate-300" style={{ '--d': '820ms' }}>
                Search live fares, choose your seat and meal, and get your e-ticket in minutes.
              </p>

              <div className="hp-rise mt-5 flex flex-col gap-3 sm:flex-row" style={{ '--d': '940ms' }}>
                <button
                  type="button"
                  onClick={onSearch}
                  className="group flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-[#0a1230] shadow-xl shadow-black/20 transition hover:bg-blue-50 active:scale-[0.98]"
                >
                  Search flights
                  <ArrowRight className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={onBookings}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 active:scale-[0.98]"
                >
                  <Ticket className="h-4 w-4" />
                  Manage my booking
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {HERO_FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => onPick(f.key)}
                      className={`hp-rise flex items-center gap-2.5 rounded-2xl px-3 py-3 text-left text-[13px] font-bold text-slate-200 hover:bg-white/10 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 ${GLASS} ${GLASS_HOVER}`}
                      style={{ '--d': `${1060 + i * 90}ms` }}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-sky-400 ring-1 ring-inset ring-blue-400/20">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="leading-tight">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <Divider plane />
        </div>
      </section>
    </div>
  );
}

/* ====================================================================== */

export default function HomePage({ onExecuteSearch, onNavigateToTab }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredCode, setHoveredCode] = useState(null);
  const [selectedCabin, setSelectedCabin] = useState('business');
  const [copiedCode, setCopiedCode] = useState('');

  const searchRef = useRef(null);
  const destRef = useRef(null);
  const servicesRef = useRef(null);
  const promoRef = useRef(null);
  const scrollTargets = { search: searchRef, destinations: destRef, services: servicesRef, promos: promoRef };
  const scrollToKey = (key) => {
    const el = scrollTargets[key] && scrollTargets[key].current;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const quickActions = [
    { label: 'My bookings', sub: 'View or change a trip', icon: Ticket, tab: 'bookings' },
    { label: 'Choose seats', sub: 'Live seat map', icon: Armchair, tab: 'seat-selection' },
    { label: 'In-flight meals', sub: 'Pre-order your meal', icon: Utensils, tab: 'meals' },
    { label: 'Layover hotels', sub: 'Free stays on long transits', icon: Hotel, tab: 'layover-hotels' },
    { label: 'Cancel and refund', sub: 'Automatic refunds', icon: RotateCcw, tab: 'refunds' }
  ];

  const categories = [
    { id: 'all', label: 'All routes' },
    { id: 'asia', label: 'Asia & Pacific' },
    { id: 'europe', label: 'Europe & Middle East' },
    { id: 'americas', label: 'Americas' },
    { id: 'beach', label: 'Beach getaways' },
  ];

  const popularDestinations = [
    {
      city: 'Singapore',
      code: 'SIN',
      country: 'Singapore',
      price: 350,
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
      badge: 'Popular Non-Stop',
      layover: false,
      duration: '4h 15m',
      category: 'asia',
      rating: '4.9',
      reviews: '1,240'
    },
    {
      city: 'London',
      code: 'LHR',
      country: 'United Kingdom',
      price: 780,
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
      badge: 'Hotel Layover Included',
      layover: true,
      duration: '12h 40m',
      category: 'europe',
      rating: '4.8',
      reviews: '2,150'
    },
    {
      city: 'Dubai',
      code: 'DXB',
      country: 'UAE',
      price: 480,
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
      badge: 'Best Value Fare',
      layover: false,
      duration: '5h 30m',
      category: 'europe',
      rating: '4.9',
      reviews: '3,100'
    },
    {
      city: 'Tokyo',
      code: 'HND',
      country: 'Japan',
      price: 610,
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
      badge: 'Trending Spot',
      layover: false,
      duration: '8h 20m',
      category: 'asia',
      rating: '5.0',
      reviews: '1,890'
    },
    {
      city: 'New York',
      code: 'JFK',
      country: 'USA',
      price: 920,
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
      badge: 'Long Haul Comfort',
      layover: true,
      duration: '16h 10m',
      category: 'americas',
      rating: '4.8',
      reviews: '1,420'
    },
    {
      city: 'Sydney',
      code: 'SYD',
      country: 'Australia',
      price: 850,
      image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
      badge: 'Scenic Route',
      layover: true,
      duration: '10h 45m',
      category: 'asia',
      rating: '4.9',
      reviews: '980'
    },
  ];

  const filteredDestinations = activeCategory === 'all'
    ? popularDestinations
    : popularDestinations.filter(d => d.category === activeCategory);

  const preview = filteredDestinations.find((d) => d.code === hoveredCode) || filteredDestinations[0];

  const journeySteps = [
    { title: 'Search your route', desc: 'Enter cities and dates, then compare live fares across the day.', icon: Search },
    { title: 'Choose your fare', desc: 'Pick Economy, Business or First and see exactly what is included.', icon: Tag },
    { title: 'Add seat, meal and hotel', desc: 'Reserve your seat, pre-order a meal, and add a layover hotel.', icon: Armchair },
    { title: 'Get your e-ticket', desc: 'Pay securely and receive your e-ticket in minutes.', icon: Ticket }
  ];

  const cabinOrder = ['economy', 'business', 'first'];
  const cabinClasses = {
    first: {
      label: 'First',
      name: 'First Class Suites',
      tagline: 'The Pinnacle of Private Aviation',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
      perks: [
        'Private sliding door suite with 180° lie-flat bed',
        'Multi-course gourmet dining & fine vintage selection',
        'Dedicated VIP chauffeur & Private Airport Lounge',
        'Bvlgari amenity kit & luxury pajamas'
      ],
      amenities: [
        { icon: Utensils, text: 'Fine Dining' },
        { icon: Wifi, text: 'High-Speed Wi-Fi' },
        { icon: Coffee, text: 'Champagne Bar' },
        { icon: Briefcase, text: 'VIP Lounge' }
      ]
    },
    business: {
      label: 'Business',
      name: 'Business Class Prestige',
      tagline: 'Unmatched Comfort for Modern Travelers',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      perks: [
        'Direct aisle access with fully flat bed seat',
        'Chef-crafted international meals & barista coffee',
        'Noise-canceling Sennheiser headphones',
        'Priority luggage handling & fast-track security'
      ],
      amenities: [
        { icon: Utensils, text: 'Chef Menu' },
        { icon: Wifi, text: 'Complimentary Wi-Fi' },
        { icon: Headphones, text: 'Noise Canceling' },
        { icon: Star, text: 'Priority Boarding' }
      ]
    },
    economy: {
      label: 'Economy',
      name: 'Economy Class Comfort',
      tagline: 'Exceptional Value Without Compromise',
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80',
      perks: [
        'Ergonomic seats with adjustable leather headrests',
        '13.3-inch 4K HD touchscreen entertainment system',
        'Complimentary hot meals & beverage selection',
        'In-seat USB-C power sockets & Wi-Fi connectivity'
      ],
      amenities: [
        { icon: Utensils, text: 'Hot Meals' },
        { icon: Wifi, text: 'Wi-Fi Available' },
        { icon: Headphones, text: '1,000+ Movies' },
        { icon: CheckCircle2, text: 'Ergonomic Seats' }
      ]
    }
  };

  const airlineServices = [
    {
      id: 1,
      title: 'Free Layover Hotels',
      desc: 'Qualifying transit stays over 8 hours receive a 4-star hotel stay with breakfast and shuttle vouchers.',
      badge: 'Complimentary Voucher',
      icon: Hotel,
      color: 'from-blue-600 to-indigo-600',
      actionText: 'Explore Layover Stays',
      tabTarget: 'layover-hotels'
    },
    {
      id: 2,
      title: 'Interactive Seat & Meal Selection',
      desc: 'Pick your preferred seat with 3D seat mapping and pre-order gourmet or dietary meals before flying.',
      badge: 'Live Seat Map',
      icon: Compass,
      color: 'from-sky-500 to-blue-600',
      actionText: 'Reserve Seats',
      tabTarget: 'seat-selection'
    },
    {
      id: 3,
      title: 'SkyPass Rewards & Miles',
      desc: 'Earn points on every flight and redeem instantly for zero-cost ticket upgrades and fare discounts.',
      badge: 'Instant Redemption',
      icon: Award,
      color: 'from-amber-500 to-orange-600',
      actionText: 'View Dashboard',
      tabTarget: 'bookings'
    },
    {
      id: 4,
      title: 'Flexible Cancellation & Refund',
      desc: 'Transparent cancellation policies with 100% automated refund processing directly to your account.',
      badge: '24h Guarantee',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-600',
      actionText: 'Manage Refunds',
      tabTarget: 'refunds'
    }
  ];

  const promotionalOffers = [
    {
      code: 'SKYFLY2026',
      title: 'East Asia Early Bird Special',
      discount: 'Save up to 25%',
      desc: 'Book non-stop flights to Tokyo or Singapore 30 days in advance.',
      validity: 'Valid till Sep 30',
      destCode: 'HND'
    },
    {
      code: 'VIPUPGRADE',
      title: 'Europe Business Upgrade Bonus',
      discount: '5,000 Bonus Miles',
      desc: 'Earn double SkyPass miles when booking Business Class to London or Paris.',
      validity: 'Limited Time Offer',
      destCode: 'LHR'
    }
  ];

  const stats = [
    { icon: Globe, count: { to: 150, suffix: '+' }, label: 'Global destinations' },
    { icon: Clock, count: { to: 99.4, decimals: 1, suffix: '%' }, label: 'On-time performance' },
    { icon: Star, value: '5-Star', label: 'Aviation rating' },
    { icon: Hotel, value: 'Free hotel', label: 'For transit layovers' }
  ];

  const faqs = [
    { q: 'How do I find and book a flight?', a: 'Enter your route and dates in the search box, compare the fares, choose a cabin, then add your seat and meal. Pay securely and your e-ticket arrives in minutes.' },
    { q: 'Can I choose my seat and meal?', a: 'Yes. After you pick a fare you can choose a seat on the live seat map and pre-order a meal. You can also do both later from My bookings.' },
    { q: 'When do I get a free layover hotel?', a: 'Transit stays of more than 8 hours qualify for a 4-star hotel stay with breakfast and shuttle vouchers. Routes that include one are marked on the fare board.' },
    { q: 'How do cancellations and refunds work?', a: 'Cancel from My bookings and your refund is processed automatically back to your account. Refund rules are shown before you confirm.' },
    { q: 'How do I earn and use SkyPass miles?', a: 'You earn miles on every flight. Redeem them from your SkyPass dashboard for ticket upgrades and fare discounts.' }
  ];

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      /* clipboard can be blocked; still show feedback */
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 1800);
  };

  const cabin = cabinClasses[selectedCabin];
  const cabinIdx = cabinOrder.indexOf(selectedCabin);
  const [hotel, seats, miles, refund] = airlineServices;
  const seatTaken = [1, 4, 6, 11, 14, 19, 22];

  const renderActionLink = (service, tone = 'text-blue-700') => (
    <button
      onClick={() => onNavigateToTab(service.tabTarget)}
      className={`group/link -my-1 flex items-center gap-1.5 py-1 text-sm font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${tone}`}
    >
      <span className="relative">
        {service.actionText}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-current transition-all duration-300 group-hover/link:w-full" />
      </span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
    </button>
  );

  return (
    <div className="hp-root space-y-16 bg-white pb-16 sm:space-y-24 sm:pb-24" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');`}</style>
      <style>{`
        .hp-root, .hp-root *, .hp-display { font-family: 'Poppins', sans-serif; }
        .hp-display { font-family: 'Poppins', sans-serif; letter-spacing: -0.01em; }

        @keyframes sl-swap { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        .sl-swap { animation: sl-swap .35s cubic-bezier(.2,.8,.2,1) both }

        @keyframes hp-rise { from { opacity: 0; transform: translate3d(0,22px,0) } to { opacity: 1; transform: none } }
        @keyframes hp-wipe { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
        @keyframes hp-zoom { from { transform: scale(1.12) } to { transform: scale(1) } }
        @keyframes hp-drift { from { transform: translate3d(0,0,0) scale(1) } to { transform: translate3d(30px,-20px,0) scale(1.12) } }
        @keyframes hp-fly { from { left: -6% } to { left: 104% } }
        @keyframes hp-comet { from { stroke-dashoffset: 7 } to { stroke-dashoffset: -93 } }
        @keyframes hp-attn {
          0%   { background: rgba(125,211,252,0);   box-shadow: 0 0 0 0 rgba(125,211,252,0) }
          30%  { background: rgba(125,211,252,.20); box-shadow: 0 0 0 0 rgba(125,211,252,.45) }
          100% { background: rgba(125,211,252,0);   box-shadow: 0 0 0 20px rgba(125,211,252,0) }
        }
        @keyframes hp-fill-x { from { width: 0 } to { width: 100% } }
        @keyframes hp-fplane { 0% { opacity: 1 } 92% { opacity: 1 } 100% { opacity: 0 } }
        @keyframes hp-node {
          from { background: #fff; color: #94a3b8; border-color: #e2e8f0; box-shadow: 0 0 0 0 rgba(37,99,235,0); transform: scale(1) }
          60%  { transform: scale(1.16) }
          to   { background: #2563eb; color: #fff; border-color: #2563eb; box-shadow: 0 12px 28px -8px rgba(37,99,235,.55); transform: scale(1) }
        }
        @keyframes hp-seg { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        @keyframes hp-scan { from { left: -20% } to { left: 100% } }
        @keyframes hp-seat { 0%,100% { box-shadow: 0 0 0 0 rgba(37,99,235,.5) } 50% { box-shadow: 0 0 0 6px rgba(37,99,235,0) } }

        .hp-reveal { opacity: 0 }
        .hp-reveal.hp-shown { opacity: 1; animation: hp-rise .7s cubic-bezier(.2,.8,.2,1) backwards; animation-delay: var(--d, 0ms) }
        .hp-rise { animation: hp-rise .75s cubic-bezier(.2,.8,.2,1) both; animation-delay: var(--d, 0ms) }
        .hp-wipe { animation: hp-wipe 1.5s cubic-bezier(.65,0,.25,1) both }
        .hp-zoom { animation: hp-zoom 2.2s cubic-bezier(.2,.8,.2,1) both }
        .hp-drift { animation: hp-drift 12s ease-in-out infinite alternate }
        .hp-drift-slow { animation: hp-drift 16s ease-in-out infinite alternate-reverse }
        .hp-fly { animation: hp-fly 16s linear infinite }
        .hp-comet { stroke-dashoffset: 7; animation: hp-comet 5.5s linear 1.5s infinite }
        .hp-comet-b { animation-delay: 4.25s }
        .hp-hot { animation: hp-attn 1.5s ease-out both; animation-delay: var(--hd, 1.7s) }
        .hp-parallax { transform: translate3d(calc(var(--px, 0) * -7px), calc(var(--py, 0) * -5px), 0) scale(1.035); transition: transform .35s ease-out }
        .hp-scan { animation: hp-scan 2.6s ease-in-out infinite }
        .hp-seat { animation: hp-seat 1.8s ease-out infinite }

        .hp-fill-x { width: 0 }
        .hp-fill-plane { opacity: 0 }
        .hp-seg { transform: scaleY(0) }
        .hp-shown .hp-fill-x { animation: hp-fill-x 2.85s linear .2s both }
        .hp-shown .hp-fill-plane { animation: hp-fplane 2.85s linear .2s both }
        .hp-shown .hp-node { animation: hp-node .6s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i) * .95s + .2s) }
        .hp-shown .hp-seg { animation: hp-seg .7s ease-out both; animation-delay: calc(var(--i) * .95s + .45s) }

        @media (prefers-reduced-motion: reduce) {
          .sl-swap, .hp-rise, .hp-wipe, .hp-zoom, .hp-drift, .hp-drift-slow, .hp-comet, .hp-hot, .hp-seat { animation: none }
          .hp-reveal { opacity: 1 }
          .hp-reveal.hp-shown { animation: none }
          .hp-parallax { transform: none; transition: none }
          .hp-fly, .hp-svg-anim, .hp-scan, .hp-fill-plane { display: none }
          .hp-fill-x { width: 100% }
          .hp-seg { transform: none }
          .hp-node { background: #2563eb; color: #fff; border-color: #2563eb }
          .hp-shown .hp-node, .hp-shown .hp-seg, .hp-shown .hp-fill-x { animation: none }
        }
      `}</style>

      {/* ============ 1. Hero banner ============ */}


      {/* ============ 2. Search + quick actions ============ */}
      <div className="space-y-8 sm:space-y-10">
        <div ref={searchRef} className="scroll-mt-24">
          <FlightSearchSection onExecuteSearch={onExecuteSearch} />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0">
            {quickActions.map((a, i) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.tab}
                  type="button"
                  onClick={() => onNavigateToTab(a.tab)}
                  className="hp-rise group flex min-w-[220px] shrink-0 snap-start items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 lg:min-w-0"
                  style={{ '--d': `${i * 70}ms` }}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-slate-900">{a.label}</span>
                    <span className="block truncate text-xs text-slate-500">{a.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============ 3. Fare board (destinations) ============ */}
      <div ref={destRef} className="mx-auto w-full max-w-6xl scroll-mt-24 px-4">
        <Reveal>
          <SectionTitle
            title="Where to next? Fares from Colombo"
            subtitle="Live starting fares, flight times and layover hotel packages. Hover a route to preview it, or book straight away."
          >
            <div
              role="tablist"
              aria-label="Destination categories"
              className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:max-w-sm md:flex-wrap md:justify-end md:overflow-visible md:px-0 md:pb-0"
            >
              {categories.map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => { setActiveCategory(cat.id); setHoveredCode(null); }}
                    className={`shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${active
                      ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                      }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </SectionTitle>
        </Reveal>

        {filteredDestinations.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
              <Plane className="h-7 w-7 rotate-45 text-slate-300" />
            </span>
            <h3 className="hp-display text-lg font-bold text-slate-800">No routes in this category yet</h3>
            <p className="max-w-sm text-sm text-slate-500">We're adding new destinations all the time. Browse every route we fly in the meantime.</p>
            <button
              onClick={() => setActiveCategory('all')}
              className="mt-1 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/25 transition active:scale-[0.98]"
            >
              Show all routes
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-12 lg:gap-10">
            {/* Route rows */}
            <div className="border-t border-slate-200 lg:col-span-7">
              {filteredDestinations.map((dest, i) => {
                const active = preview && preview.code === dest.code;
                return (
                  <Reveal key={dest.code} delay={(i % 6) * 60}>
                    <div
                      onMouseEnter={() => setHoveredCode(dest.code)}
                      onFocus={() => setHoveredCode(dest.code)}
                      className={`group relative flex items-center gap-3 border-b border-slate-200 px-3 py-3.5 transition-colors sm:gap-4 sm:px-5 sm:py-4 ${active ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}
                    >
                      <span className={`absolute bottom-3 left-0 top-3 w-1 origin-top rounded-full bg-gradient-to-b from-blue-500 to-indigo-600 transition-transform duration-300 ${active ? 'scale-y-100' : 'scale-y-0'}`} />

                      <img
                        src={dest.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-14 w-14 shrink-0 rounded-2xl object-cover sm:h-16 sm:w-16 lg:hidden"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold tabular-nums text-slate-400">
                          CMB
                          <Plane className="h-3 w-3 rotate-45 text-blue-500" />
                          <span className="text-blue-600">{dest.code}</span>
                        </div>
                        <h3 className="hp-display truncate text-lg font-extrabold text-slate-900 sm:text-xl">{dest.city}</h3>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {dest.duration}</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {dest.rating}</span>
                          {dest.layover && (
                            <span className="flex items-center gap-1 font-semibold text-indigo-600"><Hotel className="h-3 w-3" /> Layover hotel</span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-[11px] font-semibold text-slate-400">From</div>
                        <div className="hp-display text-xl font-extrabold tabular-nums text-slate-900 sm:text-2xl">${dest.price}</div>
                      </div>

                      <button
                        onClick={() => onExecuteSearch({ origin: 'CMB', destination: dest.code, tripType: 'oneway' })}
                        aria-label={`Book flight to ${dest.city}`}
                        className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-3.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-800 active:scale-[0.96] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 sm:px-4"
                      >
                        <span className="hidden sm:inline">Book</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* Live preview (desktop) */}
            {preview && (
              <div className="hidden lg:col-span-5 lg:block">
                <div className="sticky top-24">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#0a1230] shadow-2xl shadow-blue-900/25">
                    {popularDestinations.map((d) => (
                      <img
                        key={d.code}
                        src={d.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${d.code === preview.code ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}
                      />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a1230] via-[#0a1230]/30 to-transparent" />

                    <div className="absolute inset-x-5 top-5 flex items-start justify-between gap-3">
                      <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        {preview.badge}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {preview.rating}
                        <span className="font-medium text-white/70">({preview.reviews})</span>
                      </span>
                    </div>

                    <div key={preview.code} className="sl-swap absolute inset-x-5 bottom-5 text-white">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-sky-300">
                        <MapPin className="h-3.5 w-3.5" /> {preview.country} ({preview.code})
                      </div>
                      <h3 className="hp-display mt-1 text-4xl font-extrabold leading-none">{preview.city}</h3>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
                          <div className="text-[11px] text-slate-300">Flight time</div>
                          <div className="mt-0.5 text-sm font-bold">{preview.duration}</div>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
                          <div className="text-[11px] text-slate-300">Starting fare</div>
                          <div className="mt-0.5 text-sm font-bold tabular-nums">${preview.price} USD</div>
                        </div>
                      </div>
                      <button
                        onClick={() => onExecuteSearch({ origin: 'CMB', destination: preview.code, tripType: 'oneway' })}
                        className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-[#0a1230] shadow-xl shadow-black/20 transition hover:bg-blue-50 active:scale-[0.98]"
                      >
                        Book flight to {preview.city}
                        <ArrowRight className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============ 4. Booking journey ============ */}
      <div className="mx-auto w-full max-w-6xl px-4">
        <Reveal>
          <SectionTitle
            title="From search to e-ticket in four steps"
            subtitle="Everything happens in one place, so you never lose your progress between steps."
          />
        </Reveal>
        <div className="mt-10 sm:mt-14">
          <BookingJourney steps={journeySteps} />
        </div>
      </div>

      {/* ============ 5. Numbers ============ */}
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-y-10 border-y border-slate-200 py-10 lg:grid-cols-4 lg:divide-x lg:divide-slate-200">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.label} delay={i * 90}>
                <div className="px-2 text-center lg:px-6 lg:text-left">
                  <Icon className="mx-auto h-5 w-5 text-blue-600 lg:mx-0" />
                  <div className="hp-display mt-3 text-3xl font-extrabold text-[#0a1230] sm:text-5xl">
                    {s.count ? <CountUp {...s.count} /> : s.value}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{s.label}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* ============ 6. Cabin boarding pass ============ */}
      <div className="mx-auto w-full max-w-6xl px-4">
        <Reveal>
          <SectionTitle
            title="Pick the cabin, see your boarding pass"
            subtitle="World-class inflight service for every traveler, from private suites to ergonomic comfort."
          >
            <div role="tablist" aria-label="Cabin class" className="relative grid w-full grid-cols-3 rounded-full bg-slate-100 p-1 text-xs font-bold md:w-80">
              <span
                aria-hidden="true"
                className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-gradient-to-b from-blue-500 to-blue-600 shadow-md shadow-blue-600/25 transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${cabinIdx * 100}%)` }}
              />
              {cabinOrder.map((id) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={selectedCabin === id}
                  onClick={() => setSelectedCabin(id)}
                  className={`relative z-10 rounded-full px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${selectedCabin === id ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {cabinClasses[id].label}
                </button>
              ))}
            </div>
          </SectionTitle>
        </Reveal>

        {cabin && (
          <Reveal delay={80} className="mt-8 sm:mt-10">
            <div
              key={selectedCabin}
              className="sl-swap relative flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,30,92,0.10)] lg:flex-row"
            >
              {/* Main pass */}
              <div className="flex-1 p-5 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 shadow-lg shadow-blue-500/30">
                    <Plane className="h-5 w-5 -rotate-45 text-white" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">{cabin.tagline}</div>
                    <h3 className="hp-display text-2xl font-extrabold text-slate-900 sm:text-3xl">{cabin.name}</h3>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {cabin.perks.map((perk, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm font-medium leading-relaxed text-slate-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-dashed border-slate-300 pt-5 sm:grid-cols-4">
                  {cabin.amenities.map((item, idx) => {
                    const IconC = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <IconC className="h-4 w-4 shrink-0 text-blue-600" />
                        <span className="truncate">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tear-off stub */}
              <div className="relative flex flex-col gap-4 border-t border-dashed border-slate-300 bg-slate-50/70 p-5 sm:p-6 lg:w-[36%] lg:border-l lg:border-t-0">
                <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-slate-200 bg-white" />
                <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-slate-200 bg-white lg:-bottom-3 lg:-left-3 lg:right-auto lg:top-auto" />

                <div className="relative h-44 min-h-0 flex-1 overflow-hidden rounded-2xl shadow-md lg:h-auto lg:min-h-[12rem]">
                  <img src={cabin.image} alt={cabin.name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1230]/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                    SkyLine flagship fleet
                  </span>
                </div>
                <Barcode />
                <button
                  onClick={() => onNavigateToTab('seat-selection')}
                  className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-800 active:scale-[0.98]"
                >
                  View seat maps
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </Reveal>
        )}
      </div>

      {/* ============ 7. Trip toolkit (bento) ============ */}
      <div ref={servicesRef} className="mx-auto w-full max-w-6xl scroll-mt-24 px-4">
        <Reveal>
          <SectionTitle
            title="Everything for your trip, one booking away"
            subtitle="Add hotels, seats, miles and flexible changes without leaving your reservation."
          />
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {/* Layover hotel: large */}
          <Reveal className="sm:col-span-2 lg:row-span-2">
            <div className={`group relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden rounded-[1.75rem] ${NAVY} p-6 text-white shadow-2xl shadow-blue-900/20 sm:p-8`}>
              <div className="hp-drift pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl" />
              <div className="hp-drift-slow pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />
              <Hotel className="pointer-events-none absolute -bottom-6 -right-6 h-56 w-56 text-white/[0.06] transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-105" />
              <div className="relative">
                <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-sky-200 backdrop-blur">
                  {hotel.badge}
                </span>
                <h3 className="hp-display mt-4 max-w-sm text-3xl font-extrabold leading-tight sm:text-4xl">{hotel.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-blue-100/80">{hotel.desc}</p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                  {['8h+ transit', '4-star stay', 'Breakfast', 'Shuttle'].map((c) => (
                    <span key={c} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">{c}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onNavigateToTab(hotel.tabTarget)}
                className="group/btn relative mt-8 flex w-fit items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-[#0a1230] shadow-xl shadow-black/20 transition hover:bg-blue-50 active:scale-[0.98]"
              >
                {hotel.actionText}
                <ArrowRight className="h-4 w-4 text-blue-600 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          </Reveal>

          {/* Seats: wide, with a mini seat map */}
          <Reveal delay={90} className="sm:col-span-2">
            <div className="group flex h-full flex-col justify-between gap-5 overflow-hidden rounded-[1.75rem] border border-sky-100 bg-sky-50/70 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(37,99,235,0.14)] sm:flex-row sm:items-center">
              <div className="sm:max-w-xs">
                <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${seats.color} text-white shadow-lg`}>
                  <seats.icon className="h-6 w-6" />
                </span>
                <span className="inline-block rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">{seats.badge}</span>
                <h3 className="hp-display mb-2 mt-3 text-xl font-bold leading-snug text-slate-900">{seats.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-600">{seats.desc}</p>
                {renderActionLink(seats)}
              </div>
              <div className="hidden shrink-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100 sm:block" aria-hidden="true">
                <div className="grid grid-cols-6 gap-1.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-5 w-5 rounded-md ${i === 9 ? 'hp-seat bg-blue-600' : seatTaken.includes(i) ? 'bg-slate-300/80' : 'bg-sky-200/80'}`}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> Yours
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Taken
                </div>
              </div>
            </div>
          </Reveal>

          {/* Miles */}
          <Reveal delay={180}>
            <div className="group flex h-full flex-col justify-between rounded-[1.75rem] border border-amber-100 bg-amber-50/70 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(245,158,11,0.16)]">
              <div>
                <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${miles.color} text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}>
                  <miles.icon className="h-6 w-6" />
                </span>
                <span className="inline-block rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">{miles.badge}</span>
                <h3 className="hp-display mb-2 mt-3 text-xl font-bold leading-snug text-slate-900">{miles.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{miles.desc}</p>
              </div>
              <div className="mt-5">{renderActionLink(miles, 'text-amber-700')}</div>
            </div>
          </Reveal>

          {/* Refund */}
          <Reveal delay={270}>
            <div className="group flex h-full flex-col justify-between rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(16,185,129,0.16)]">
              <div>
                <span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${refund.color} text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}>
                  <refund.icon className="h-6 w-6" />
                </span>
                <span className="inline-block rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">{refund.badge}</span>
                <h3 className="hp-display mb-2 mt-3 text-xl font-bold leading-snug text-slate-900">{refund.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{refund.desc}</p>
              </div>
              <div className="mt-5">{renderActionLink(refund, 'text-emerald-700')}</div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ============ 8. Offers (coupon tickets) ============ */}
      <div ref={promoRef} className="mx-auto w-full max-w-6xl scroll-mt-24 px-4">
        <Reveal>
          <SectionTitle
            title="Fare offers you can use today"
            subtitle="Copy a code, then apply it when you book. Complimentary transit accommodation and free seat selection on top routes."
          />
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 lg:grid-cols-2">
          {promotionalOffers.map((offer, i) => {
            const copied = copiedCode === offer.code;
            return (
              <Reveal key={offer.code} delay={i * 120} className="h-full">
                <div className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] ${NAVY} text-white shadow-2xl shadow-blue-900/20 sm:flex-row`}>
                  <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 160" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
                    <path id={`hp-arc-${i}`} d="M-10 150 C 100 -30, 300 -30, 410 130" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 8" />
                    <g className="hp-svg-anim">
                      <path d="M8 0 L-8 -6 L-4 0 L-8 6 Z" fill="white" />
                      <animateMotion dur={`${8 + i * 2}s`} repeatCount="indefinite" rotate="auto">
                        <mpath href={`#hp-arc-${i}`} />
                      </animateMotion>
                    </g>
                  </svg>

                  <div className="relative flex-1 p-6 sm:p-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
                      <Tag className="h-3.5 w-3.5" />
                      {offer.validity}
                    </div>
                    <div className="hp-display mt-4 text-3xl font-extrabold text-amber-300 sm:text-4xl">{offer.discount}</div>
                    <h3 className="mt-2 text-base font-bold leading-snug">{offer.title}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-blue-100/80">{offer.desc}</p>
                  </div>

                  <div className="relative flex flex-col justify-center gap-3 border-t border-dashed border-white/30 p-6 sm:w-56 sm:border-l sm:border-t-0 sm:p-8">
                    <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-white" />
                    <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-white sm:-bottom-3 sm:-left-3 sm:right-auto sm:top-auto" />
                    <button
                      onClick={() => copyCode(offer.code)}
                      aria-label={`Copy code ${offer.code}`}
                      className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-[#070d24]/60 px-3 py-2.5 text-xs font-bold text-sky-300 transition hover:bg-[#070d24]/80 active:scale-[0.97]"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : offer.code}
                    </button>
                    <button
                      onClick={() => onExecuteSearch({ origin: 'CMB', destination: offer.destCode, tripType: i === 0 ? 'roundtrip' : 'oneway' })}
                      className="group flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300 active:scale-[0.97]"
                    >
                      Book now
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* ============ 9. FAQ ============ */}
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <h2 className="hp-display text-3xl font-extrabold leading-[1.05] text-slate-900 sm:text-4xl">Questions before you fly?</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
                Quick answers about booking, seats, refunds and miles. Still stuck? Our team is online around the clock.
              </p>
              <a
                href="mailto:support@skylineair.com"
                className="group mt-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm transition hover:border-blue-300 hover:text-blue-700 hover:shadow-lg hover:shadow-blue-900/10"
              >
                <Mail className="h-4 w-4 text-blue-600" />
                Email support
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-8">
            <Faq items={faqs} />
          </Reveal>
        </div>
      </div>
    </div>
  );
}