import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  Plane,
  Search,
  Ticket,
  Hotel,
  Calendar,
  RefreshCw,
  BarChart3,
  Bell,
  User,
  ShieldCheck,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  LogOut,
  Utensils,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  user,
  onLogout,
  setShowAuthModal,
  unreadNotifications,
  setShowNotifications
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });

  const userMenuRef = useRef(null);
  const navRef = useRef(null);
  const btnRefs = useRef({});

  const effectiveRole = user ? (user.role || currentRole) : 'GUEST';

  const roles = [
    { id: 'PASSENGER', label: 'Passenger', icon: User, desc: 'Search & Book flights' },
    { id: 'TICKETING_OFFICER', label: 'Ticketing Officer', icon: Ticket, desc: 'Counter bookings & refund overrides' },
    { id: 'ADMIN', label: 'Airline Admin', icon: ShieldCheck, desc: 'Manage schedules & fleet' },
    { id: 'HOTEL_MANAGER', label: 'Hotel Manager', icon: Hotel, desc: 'Manage layover hotel rooms' },
  ];

  const navItems = [
    { id: 'search', label: 'Search & Book', icon: Search, roles: ['GUEST', 'PASSENGER', 'TICKETING_OFFICER', 'ADMIN'] },
    { id: 'reservation-mgmt', label: 'Manage Reservations', icon: Ticket, roles: ['TICKETING_OFFICER', /*'ADMIN'*/] },
    { id: 'meals', label: 'In-Flight Meals', icon: Utensils, badge: 'New', roles: ['PASSENGER'] },
    { id: 'bookings', label: 'My Bookings', icon: Ticket, roles: ['PASSENGER'] },
    /*{ id: 'profile', label: 'My Profile', icon: User, roles: ['PASSENGER', 'TICKETING_OFFICER', 'ADMIN', 'HOTEL_MANAGER'] },*/
    { id: 'layover-hotels', label: 'Layover Hotels', icon: Hotel, roles: ['GUEST', 'PASSENGER', 'HOTEL_MANAGER'] },
    { id: 'refunds', label: 'Refund Tracker', icon: RefreshCw, roles: ['PASSENGER', 'TICKETING_OFFICER'/*, 'ADMIN'*/] },
    { id: 'schedule-mgmt', label: 'Flight Schedules', icon: Calendar, roles: [/*'TICKETING_OFFICER',*/ 'ADMIN'] },
    { id: 'analytics', label: 'Admin Reports', icon: BarChart3, roles: ['ADMIN'] },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(effectiveRole));
  const roleInfo = roles.find((r) => r.id === effectiveRole);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-amber-500/15 text-amber-300 border-amber-400/30';
      case 'TICKETING_OFFICER': return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
      case 'HOTEL_MANAGER': return 'bg-purple-500/15 text-purple-300 border-purple-400/30';
      default: return 'bg-blue-500/15 text-blue-300 border-blue-400/30';
    }
  };

  const isTabActive = (itemId) => {
    if (itemId === 'search') return activeTab === 'search' || activeTab === 'results' || activeTab === 'seat-selection' || activeTab === 'payment';
    if (itemId === 'profile') return activeTab === 'profile' || activeTab === 'dashboard';
    return activeTab === itemId;
  };

  const activeItemId = visibleItems.find((i) => isTabActive(i.id))?.id || null;

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  };

  /* ---------- sliding indicator: measure the active button ---------- */
  const measure = () => {
    const el = activeItemId ? btnRefs.current[activeItemId] : null;
    if (!el || !navRef.current || el.offsetWidth === 0) {
      setIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth, visible: true });
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItemId, effectiveRole]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !navRef.current) return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(navRef.current);
    Object.values(btnRefs.current).forEach((b) => b && ro.observe(b));
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItemId, effectiveRole]);

  /* ---------- page + keyboard behaviour ---------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => e.matches && setIsMobileMenuOpen(false);
    mq.addEventListener('change', onChange);
    return () => {
      document.body.style.overflow = previous;
      mq.removeEventListener('change', onChange);
    };
  }, [isMobileMenuOpen]);

  const initial = (user?.name || 'A').charAt(0).toUpperCase();
  const bellCount = unreadNotifications > 9 ? '9+' : unreadNotifications;

  return (
    <>
      <style>{`
        @keyframes sl-rise { from { opacity: 0; transform: translateY(16px) scale(.98) } to { opacity: 1; transform: none } }
        @keyframes sl-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sl-pop-in { from { opacity: 0; transform: translateY(-6px) scale(.97) } to { opacity: 1; transform: none } }
        .sl-rise { animation: sl-rise .45s cubic-bezier(.2,.8,.2,1) both }
        .sl-fade-in { animation: sl-fade-in .25s ease both }
        .sl-pop-in { animation: sl-pop-in .16s ease-out both; transform-origin: top right }
        @media (prefers-reduced-motion: reduce) { .sl-rise, .sl-fade-in, .sl-pop-in { animation: none } }
      `}</style>

      {/* Sticky transparent rail; only the capsule itself catches clicks */}
      <header className="pointer-events-none sticky top-0 z-40 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
        <div
          className={`pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[1.75rem] border border-white/10 bg-[#0a1230]/85 pl-3 pr-2.5 text-white backdrop-blur-xl transition-all duration-300 sm:pl-4 lg:rounded-full ${scrolled
            ? 'py-1.5 shadow-[0_18px_50px_rgba(10,18,48,0.45)]'
            : 'py-2 shadow-[0_10px_35px_rgba(10,18,48,0.30)]'
            }`}
        >
          {/* ---------------- Brand ---------------- */}
          <button
            type="button"
            onClick={() => handleNavClick('search')}
            aria-label="SkyLine Air home"
            className="group flex shrink-0 items-center gap-2.5 rounded-full py-0.5 pr-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 shadow-lg shadow-blue-500/30 ring-1 ring-white/25 transition-transform duration-300 group-hover:rotate-12">
              <Plane className="h-[18px] w-[18px] -rotate-45 text-white" />
            </span>
            <span className="leading-none">
              <span className="flex items-baseline gap-1">
                <span className="text-lg font-black tracking-tight">SkyLine</span>
                <span className="text-lg font-light text-sky-400">Air</span>
              </span>
              <span className="mt-0.5 hidden text-[10px] font-semibold text-slate-400 sm:block">Premium Aviation</span>
            </span>
          </button>

          {/* ---------------- Desktop nav with sliding indicator ---------------- */}
          <nav
            ref={navRef}
            aria-label="Main"
            className="relative hidden items-center gap-0.5 rounded-full bg-white/5 p-1.5 ring-1 ring-inset ring-white/10 lg:flex"
          >
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 top-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/40 ring-1 ring-white/25 transition-[left,width,opacity] duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
              style={{ left: indicator.left, width: indicator.width, opacity: indicator.visible ? 1 : 0 }}
            />
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeItemId;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    btnRefs.current[item.id] = el;
                  }}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={`relative z-10 flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 xl:px-4 ${active ? 'text-white' : 'text-slate-300 hover:text-white'
                    }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${item.id === 'meals' && !active ? 'text-amber-300' : ''}`} />
                  {/* lg: only the active tab shows its label; xl: every tab does */}
                  <span className={active ? 'inline' : 'hidden xl:inline'}>{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-amber-400 px-1.5 py-px text-[9px] font-black text-slate-950">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ---------------- Actions ---------------- */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setShowNotifications(true)}
              aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#0a1230] bg-red-500 px-1 text-[10px] font-black text-white">
                  {bellCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                  className="flex h-10 items-center gap-2 rounded-full bg-white/10 pl-1 pr-2.5 ring-1 ring-inset ring-white/15 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:pr-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black shadow">
                    {initial}
                  </span>
                  <span className="hidden text-xs font-bold sm:inline">{user.name?.split(' ')[0]}</span>
                  <ChevronDown className={`hidden h-3.5 w-3.5 text-slate-300 transition-transform sm:block ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div
                    role="menu"
                    className="sl-pop-in absolute right-0 top-full z-50 mt-3 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-white/10 bg-[#0b1433] p-2 text-xs shadow-2xl shadow-black/40"
                  >
                    <div className="rounded-2xl bg-gradient-to-br from-blue-600/25 to-indigo-600/10 p-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black">
                          {initial}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">{user.name}</div>
                          <div className="truncate text-[11px] text-slate-400">{user.email}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getRoleBadgeColor(effectiveRole)}`}>
                          {roleInfo?.label}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                          <Sparkles className="h-3 w-3" /> {user.loyaltyPoints || 1450} pts
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      <button
                        role="menuitem"
                        onClick={() => handleNavClick('profile')}
                        className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left font-bold text-slate-200 transition hover:bg-white/10"
                      >
                        <User className="h-4 w-4 text-blue-400" /> My Profile
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout && onLogout();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left font-bold text-red-400 transition hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex h-10 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-extrabold text-[#0a1230] shadow-lg shadow-black/20 transition hover:bg-blue-50 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:px-4"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/25 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- Mobile: full-screen tile menu ---------------- */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="sl-fade-in fixed inset-0 z-50 flex flex-col overflow-y-auto bg-gradient-to-br from-[#070d24] via-[#0f1e5c] to-[#1d4ed8] text-white lg:hidden"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />

          <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
            {/* top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 ring-1 ring-white/25">
                  <Plane className="h-[18px] w-[18px] -rotate-45" />
                </span>
                <span className="flex items-baseline gap-1">
                  <span className="text-lg font-black">SkyLine</span>
                  <span className="text-lg font-light text-sky-300">Air</span>
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-inset ring-white/20 transition active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* account */}
            <div className="sl-rise mt-6" style={{ animationDelay: '40ms' }}>
              {user ? (
                <div className="flex items-center gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-inset ring-white/15 backdrop-blur">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-lg font-black">
                    {initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{user.name}</div>
                    <div className="truncate text-xs text-blue-100/70">{user.email}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeColor(effectiveRole)}`}>
                        {roleInfo?.label}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        <Sparkles className="h-3 w-3" /> {user.loyaltyPoints || 1450} pts
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowAuthModal(true);
                  }}
                  className="flex w-full items-center justify-between rounded-3xl bg-white p-4 text-left text-[#0a1230] shadow-xl shadow-black/20"
                >
                  <span>
                    <span className="block text-sm font-extrabold">Sign in to SkyLine Air</span>
                    <span className="block text-xs text-slate-500">Manage bookings, meals and refunds</span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-blue-600" />
                </button>
              )}
            </div>

            {/* tiles */}
            <nav aria-label="Mobile" className="mt-5 grid grid-cols-2 gap-3">
              {visibleItems.map((item, idx) => {
                const Icon = item.icon;
                const active = item.id === activeItemId;
                const spanFull = idx === visibleItems.length - 1 && visibleItems.length % 2 === 1;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    aria-current={active ? 'page' : undefined}
                    style={{ animationDelay: `${90 + idx * 45}ms` }}
                    className={`sl-rise relative flex min-h-[112px] flex-col justify-between rounded-3xl p-4 text-left transition active:scale-[0.97] ${spanFull ? 'col-span-2' : ''
                      } ${active
                        ? 'bg-white text-[#0a1230] shadow-xl shadow-black/25'
                        : 'bg-white/10 text-white ring-1 ring-inset ring-white/15 backdrop-blur'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-white/10'
                          }`}
                      >
                        <Icon className={`h-5 w-5 ${item.id === 'meals' && !active ? 'text-amber-300' : ''}`} />
                      </span>
                      {item.badge && (
                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="mt-4 text-sm font-extrabold leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {user && (
              <div className="sl-rise mt-auto grid grid-cols-2 gap-3 pt-6" style={{ animationDelay: `${120 + visibleItems.length * 45}ms` }}>
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 text-sm font-bold ring-1 ring-inset ring-white/20 transition active:scale-[0.97]"
                >
                  <User className="h-4 w-4 text-sky-300" /> Profile
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout && onLogout();
                  }}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-red-500/15 text-sm font-bold text-red-200 ring-1 ring-inset ring-red-400/30 transition active:scale-[0.97]"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}