import React, { useEffect, useRef, useState } from 'react';
import {
  Plane,
  ShieldCheck,
  HeartHandshake,
  PhoneCall,
  Mail,
  MapPin,
  ArrowUp,
  ArrowRight,
  Ticket
} from 'lucide-react';

/* Reveal once when the footer scrolls into view (shows immediately for reduced motion) */
function useReveal() {
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
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, shown];
}

/* Link with a growing gradient underline. Without onClick it renders as plain text. */
function FooterLink({ onClick, children }) {
  if (!onClick) {
    return <span className="inline-block py-2 text-sm text-slate-500">{children}</span>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center py-2 text-left text-sm text-slate-400 transition-colors hover:text-white focus:outline-none focus-visible:text-white focus-visible:ring-2 focus-visible:ring-sky-400/60"
    >
      <span className="relative">
        {children}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-300 group-hover:w-full group-focus-visible:w-full" />
      </span>
    </button>
  );
}

function ColumnTitle({ children }) {
  return <h4 className="mb-2 text-sm font-extrabold text-white">{children}</h4>;
}

export default function Footer({ setActiveTab, onInfoClick }) {
  const [gridRef, shown] = useReveal();

  // Navigate, then bring the new page into view
  const go = (tab) => () => {
    if (setActiveTab) setActiveTab(tab);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const info = (key) => (onInfoClick ? () => onInfoClick(key) : undefined);
  const backToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const reveal = (i) => ({
    className: 'sl-reveal',
    style: { transitionDelay: `${i * 90}ms` }
  });

  return (
    <footer className="no-print relative mt-24 sm:mt-28">
      <style>{`
        @keyframes sl-drift { from { transform: translate3d(0,0,0) scale(1) } to { transform: translate3d(30px,-20px,0) scale(1.12) } }
        @keyframes sl-fly { from { left: -6%; } to { left: 104%; } }
        @keyframes sl-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        .sl-drift { animation: sl-drift 12s ease-in-out infinite alternate }
        .sl-drift-slow { animation: sl-drift 16s ease-in-out infinite alternate-reverse }
        .sl-fly { animation: sl-fly 16s linear infinite }
        .sl-bob { animation: sl-bob 2.4s ease-in-out infinite }
        .sl-reveal { opacity: 0; transform: translateY(18px); transition: opacity .6s ease, transform .6s cubic-bezier(.2,.8,.2,1) }
        .sl-in .sl-reveal { opacity: 1; transform: none }
        @media (prefers-reduced-motion: reduce) {
          .sl-drift, .sl-drift-slow, .sl-bob { animation: none }
          .sl-fly, .sl-svg-plane { display: none }
          .sl-reveal { opacity: 1; transform: none; transition: none }
        }
      `}</style>

      {/* ======================= Call-to-action card ======================= */}
      <div className="absolute inset-x-0 top-0 z-10 -translate-y-1/2 px-4">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shadow-2xl shadow-blue-900/30 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />

          {/* Plane flying along the arc */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
            viewBox="0 0 400 160"
            preserveAspectRatio="xMaxYMid slice"
            aria-hidden="true"
          >
            <path
              id="sl-footer-arc"
              d="M-10 150 C 100 -30, 300 -30, 410 130"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeDasharray="4 8"
            />
            <g className="sl-svg-plane">
              <path d="M8 0 L-8 -6 L-4 0 L-8 6 Z" fill="white" />
              <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
                <mpath href="#sl-footer-arc" />
              </animateMotion>
            </g>
          </svg>

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Ready for take-off?</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-blue-100/90">
                Compare live fares, pick your seat and get your e-ticket in minutes.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={go('search')}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-[#0a1230] shadow-xl shadow-black/20 transition hover:bg-blue-50 active:scale-[0.98]"
              >
                Search flights
                <ArrowRight className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={go('bookings')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold backdrop-blur transition hover:bg-white/20 active:scale-[0.98]"
              >
                <Ticket className="h-4 w-4" />
                Manage my booking
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= Main footer ======================= */}
      <div className="relative overflow-hidden bg-[#070d24] pt-44 text-slate-400 sm:pt-36">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
        <div className="sl-drift pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="sl-drift-slow pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-8">
          <div ref={gridRef} className={`grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-12 ${shown ? 'sl-in' : ''}`}>
            {/* Brand */}
            <div {...reveal(0)} className="sl-reveal col-span-2 space-y-5 md:col-span-4 lg:col-span-4">
              <button
                type="button"
                onClick={go('search')}
                className="group flex items-center gap-3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                aria-label="SkyLine Air home"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 shadow-lg shadow-blue-500/30 ring-1 ring-white/25 transition-transform duration-300 group-hover:rotate-12">
                  <Plane className="h-5 w-5 -rotate-45 text-white" />
                </span>
                <span className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tracking-tight text-white">SkyLine</span>
                  <span className="text-2xl font-light text-sky-400">Air</span>
                </span>
              </button>

              <p className="max-w-sm text-sm leading-relaxed text-slate-400">
                Flying made simple. Search live fares, choose your seat and meal, add a layover hotel, and get your
                e-ticket in minutes, with support whenever you need it.
              </p>

              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure checkout
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <HeartHandshake className="h-4 w-4 text-sky-400" /> 24/7 support
                </span>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-slate-500">We accept</div>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-300">
                  {['Visa', 'Mastercard', 'Amex', 'Apple Pay'].map((p) => (
                    <span key={p} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Book & manage */}
            <div {...reveal(1)} className="sl-reveal col-span-1 md:col-span-2 lg:col-span-2">
              <ColumnTitle>Book and manage</ColumnTitle>
              <ul className="flex flex-col">
                <li><FooterLink onClick={go('search')}>Search flights</FooterLink></li>
                <li><FooterLink onClick={go('bookings')}>My bookings</FooterLink></li>
                <li><FooterLink onClick={go('meals')}>In-flight meals</FooterLink></li>
                <li><FooterLink onClick={go('layover-hotels')}>Layover hotels</FooterLink></li>
                <li><FooterLink onClick={go('refunds')}>Cancel and refund</FooterLink></li>
              </ul>
            </div>

            {/* Passenger info */}
            <div {...reveal(2)} className="sl-reveal col-span-1 md:col-span-2 lg:col-span-3">
              <ColumnTitle>Passenger info</ColumnTitle>
              <ul className="flex flex-col">
                <li><FooterLink onClick={info('baggage')}>Baggage allowance</FooterLink></li>
                <li><FooterLink onClick={info('check-in')}>Online check-in and boarding</FooterLink></li>
                <li><FooterLink onClick={info('visa')}>Visa and travel documents</FooterLink></li>
                <li><FooterLink onClick={go('bookings')}>SkyPass miles</FooterLink></li>
                <li><FooterLink onClick={info('assistance')}>Special assistance</FooterLink></li>
              </ul>
            </div>

            {/* Contact */}
            <div {...reveal(3)} className="sl-reveal col-span-2 md:col-span-4 lg:col-span-3">
              <ColumnTitle>Contact centre</ColumnTitle>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Support online now
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-400/20">
                    <PhoneCall className="h-4 w-4" />
                  </span>
                  <span className="text-slate-300">+1 800-SKYLINE-AIR</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-400/20">
                    <Mail className="h-4 w-4" />
                  </span>
                  <a href="mailto:support@skylineair.com" className="break-all text-slate-300 transition-colors hover:text-white">
                    support@skylineair.com
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-400/20">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span className="pt-1.5 leading-snug text-slate-300">101, Galle Road, Colombo, Sri Lanka</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider with a plane crossing it */}
          <div className="relative mt-12 h-px bg-white/10" aria-hidden="true">
            <span className="sl-fly absolute -top-[9px] text-sky-400/80">
              <Plane className="h-[18px] w-[18px] rotate-45" />
            </span>
          </div>

          {/* Bottom bar */}
          <div className="mt-6 flex flex-col items-center gap-5 text-xs text-slate-500 md:flex-row md:justify-between">
            <div className="text-center md:text-left">© 2026 SkyLine Air. All rights reserved.</div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
              <FooterLink onClick={info('privacy')}>Privacy policy</FooterLink>
              <FooterLink onClick={info('terms')}>Terms of service</FooterLink>
              <FooterLink onClick={info('cookies')}>Cookie preferences</FooterLink>
            </div>

            <button
              type="button"
              onClick={backToTop}
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:border-sky-400/40 hover:bg-white/10 hover:text-white active:scale-[0.97]"
            >
              Back to top
              <ArrowUp className="sl-bob h-3.5 w-3.5 text-sky-400 transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}