import React, { useState, useEffect, useRef } from 'react';
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
    ChevronRight,
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
    const userMenuRef = useRef(null);

    const effectiveRole = user ? (user.role || currentRole) : 'GUEST';

    const roles = [
        { id: 'PASSENGER', label: 'Passenger', icon: User, desc: 'Search & Book flights' },
        { id: 'TICKETING_OFFICER', label: 'Ticketing Officer', icon: Ticket, desc: 'Counter bookings & refund overrides' },
        { id: 'ADMIN', label: 'Airline Admin', icon: ShieldCheck, desc: 'Manage schedules & fleet' },
        { id: 'HOTEL_MANAGER', label: 'Hotel Manager', icon: Hotel, desc: 'Manage layover hotel rooms' },
    ];

    const navItems = [
        { id: 'search', label: 'Search & Book', icon: Search, roles: ['GUEST', 'PASSENGER', 'TICKETING_OFFICER', 'ADMIN'] },
        { id: 'meals', label: 'In-Flight Meals', icon: Utensils, badge: 'New', roles: ['PASSENGER'] },
        { id: 'bookings', label: 'My Bookings', icon: Ticket, roles: ['PASSENGER'] },
        /*{ id: 'profile', label: 'My Profile', icon: User, roles: ['PASSENGER', 'TICKETING_OFFICER', 'ADMIN', 'HOTEL_MANAGER'] },*/
        { id: 'layover-hotels', label: 'Layover Hotels', icon: Hotel, roles: ['GUEST', 'PASSENGER', 'HOTEL_MANAGER'] },
        { id: 'refunds', label: 'Refund Tracker', icon: RefreshCw, roles: ['PASSENGER', 'TICKETING_OFFICER', 'ADMIN'] },
        { id: 'schedule-mgmt', label: 'Flight Schedules', icon: Calendar, roles: ['TICKETING_OFFICER', 'ADMIN'] },
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

    const handleNavClick = (tabId) => {
        setActiveTab(tabId);
        setIsMobileMenuOpen(false);
        setShowUserMenu(false);
    };

    /* Stronger background once the page scrolls */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* Close user menu on outside click / Escape; close mobile menu on Escape */
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

    /* Lock page scroll while the mobile drawer is open; close it when the screen gets wide */
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
        @keyframes sl-drop { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: none } }
        @keyframes sl-pop-in { from { opacity: 0; transform: translateY(-4px) scale(.97) } to { opacity: 1; transform: none } }
        .sl-drop { animation: sl-drop .22s cubic-bezier(.2,.8,.2,1) both }
        .sl-pop-in { animation: sl-pop-in .16s ease-out both; transform-origin: top right }
        @media (prefers-reduced-motion: reduce) { .sl-drop, .sl-pop-in { animation: none } }
      `}</style>

            <header
                className={`sticky top-0 z-40 pt-[env(safe-area-inset-top)] text-white transition-all duration-300 ${scrolled || isMobileMenuOpen
                    ? 'bg-[#070d24]/90 shadow-[0_10px_40px_rgba(2,6,23,0.45)] backdrop-blur-xl'
                    : 'bg-[#070d24]/70 backdrop-blur-lg'
                    }`}
            >
                {/* glowing hairline */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:py-3">
                    {/* ---------------- Brand ---------------- */}
                    <button
                        type="button"
                        onClick={() => handleNavClick('search')}
                        className="group flex shrink-0 items-center gap-3 rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        aria-label="SkyLine Air home"
                    >
                        <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 shadow-lg shadow-blue-500/30 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                            <Plane className="h-5 w-5 -rotate-45 text-white" />
                        </span>
                        <span className="leading-none">
                            <span className="flex items-center gap-1">
                                <span className="text-xl font-black tracking-tight text-white">SkyLine</span>
                                <span className="text-xl font-light text-sky-400">Air</span>
                            </span>
                            <span className="mt-1 hidden text-[10px] font-semibold tracking-wide text-slate-400 sm:block">
                                Premium Aviation
                            </span>
                        </span>
                    </button>

                    {/* ---------------- Desktop nav ---------------- */}
                    <nav
                        aria-label="Main"
                        className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-inner backdrop-blur-md lg:flex"
                    >
                        {visibleItems.map((item) => {
                            const Icon = item.icon;
                            const active = isTabActive(item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id)}
                                    title={item.label}
                                    aria-current={active ? 'page' : undefined}
                                    className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 xl:px-3.5 ${active
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Icon className={`h-4 w-4 shrink-0 ${item.id === 'meals' && !active ? 'text-amber-300' : ''}`} />
                                    {/* lg: label only on the active item; xl: all labels */}
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
                        {/* Notifications */}
                        <button
                            onClick={() => setShowNotifications(true)}
                            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
                        >
                            <Bell className="h-[18px] w-[18px]" />
                            {unreadNotifications > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#070d24] bg-red-500 px-1 text-[10px] font-black text-white">
                                    {bellCount}
                                </span>
                            )}
                        </button>

                        {/* Auth */}
                        {user ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    aria-haspopup="menu"
                                    aria-expanded={showUserMenu}
                                    className="flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 pl-1.5 pr-2.5 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:pr-3"
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white shadow">
                                        {initial}
                                    </span>
                                    <span className="hidden text-xs font-bold text-white sm:inline">{user.name?.split(' ')[0]}</span>
                                    <ChevronDown className={`h-3.5 w-3.5 text-slate-300 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showUserMenu && (
                                    <div
                                        role="menu"
                                        className="sl-pop-in absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1433] p-1.5 text-xs shadow-2xl shadow-black/40"
                                    >
                                        <div className="rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 p-3">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white">
                                                    {initial}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-bold text-white">{user.name}</div>
                                                    <div className="truncate text-[11px] text-slate-400">{user.email}</div>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
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
                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-bold text-slate-200 transition hover:bg-white/10"
                                            >
                                                <User className="h-4 w-4 text-blue-400" /> My Profile
                                            </button>
                                            <button
                                                role="menuitem"
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    onLogout && onLogout();
                                                }}
                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-bold text-red-400 transition hover:bg-red-500/10"
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
                                className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20 transition hover:from-blue-500 hover:to-indigo-500 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                            >
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline">Sign In</span>
                            </button>
                        )}

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                            aria-expanded={isMobileMenuOpen}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden"
                        >
                            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* ---------------- Mobile drawer ---------------- */}
                {isMobileMenuOpen && (
                    <div className="sl-drop absolute inset-x-0 top-full max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-b border-white/10 bg-[#070d24]/[0.98] shadow-2xl shadow-black/50 lg:hidden">
                        <div className="mx-auto max-w-7xl space-y-4 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                            {/* Account card */}
                            {user ? (
                                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-indigo-600/10 p-3.5">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-black shadow-lg shadow-blue-600/30">
                                        {initial}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-bold">{user.name}</div>
                                        <div className="truncate text-xs text-slate-400">{user.email}</div>
                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeColor(effectiveRole)}`}>
                                                {roleInfo?.label}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
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
                                    className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-left shadow-lg shadow-blue-600/30 ring-1 ring-white/20"
                                >
                                    <span>
                                        <span className="block text-sm font-extrabold">Sign in to SkyLine Air</span>
                                        <span className="block text-xs text-blue-100/80">Manage bookings, meals and refunds</span>
                                    </span>
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            )}

                            {/* Nav list */}
                            <nav aria-label="Mobile" className="space-y-1.5">
                                {visibleItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isTabActive(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleNavClick(item.id)}
                                            aria-current={active ? 'page' : undefined}
                                            className={`flex min-h-[54px] w-full items-center gap-3 rounded-2xl px-3.5 text-left text-sm font-bold transition-all active:scale-[0.99] ${active
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-white/20'
                                                : 'border border-white/5 bg-white/5 text-slate-200 hover:bg-white/10'
                                                }`}
                                        >
                                            <span
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-white/20' : 'bg-white/10'
                                                    }`}
                                            >
                                                <Icon className={`h-[18px] w-[18px] ${item.id === 'meals' && !active ? 'text-amber-300' : ''}`} />
                                            </span>
                                            <span className="flex-1 truncate">{item.label}</span>
                                            {item.badge && (
                                                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">
                                                    {item.badge}
                                                </span>
                                            )}
                                            <ChevronRight className={`h-4 w-4 shrink-0 ${active ? 'text-white/80' : 'text-slate-500'}`} />
                                        </button>
                                    );
                                })}
                            </nav>

                            {user && (
                                <div className="flex gap-2 border-t border-white/10 pt-4">
                                    <button
                                        onClick={() => handleNavClick('profile')}
                                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                                    >
                                        <User className="h-4 w-4 text-blue-400" /> Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            onLogout && onLogout();
                                        }}
                                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                                    >
                                        <LogOut className="h-4 w-4" /> Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Dim the page behind the drawer; tap to close. Rendered outside the header so
          `fixed` isn't trapped by the header's backdrop-filter. */}
            {isMobileMenuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    tabIndex={-1}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 z-30 cursor-default bg-slate-950/60 lg:hidden"
                />
            )}
        </>
    );
}