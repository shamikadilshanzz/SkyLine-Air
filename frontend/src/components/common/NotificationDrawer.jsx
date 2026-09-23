import React, { useEffect, useState } from 'react';
import { X, Bell, MessageSquare, Mail, CheckCheck, Clock } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose, notifications = [], markAllAsRead }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'

  // Lock page scroll and close on Escape while the drawer is open
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visible = filter === 'UNREAD' ? notifications.filter((n) => !n.read) : notifications;

  const tabs = [
    { id: 'ALL', label: 'All', count: notifications.length },
    { id: 'UNREAD', label: 'Unread', count: unreadCount }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
    >
      <style>{`
        @keyframes sln-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sln-up { from { transform: translateY(100%) } to { transform: none } }
        @keyframes sln-left { from { transform: translateX(110%) } to { transform: none } }
        @keyframes sln-rise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        @keyframes sln-sheen { from { transform: translateX(-120%) } to { transform: translateX(220%) } }
        .sln-backdrop { animation: sln-fade .25s ease both }
        .sln-panel { animation: sln-up .34s cubic-bezier(.2,.8,.2,1) both }
        .sln-item { animation: sln-rise .4s cubic-bezier(.2,.8,.2,1) both }
        .sln-sheen { animation: sln-sheen 1.4s .25s ease-out both }
        @media (min-width: 640px) { .sln-panel { animation-name: sln-left } }
        @media (prefers-reduced-motion: reduce) { .sln-backdrop, .sln-panel, .sln-item, .sln-sheen { animation: none } .sln-sheen { display: none } }
      `}</style>

      {/* Backdrop: light dim + soft blur so the page stays visible through the glass */}
      <div className="sln-backdrop absolute inset-0 bg-slate-900/20 backdrop-blur-[6px]" onClick={onClose} />

      {/* Liquid-glass panel: bottom sheet on phones, floating side drawer from sm up */}
      <div
        className="sln-panel relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[2rem] border border-white/70 bg-white/90 text-slate-900 shadow-[0_24px_70px_rgba(15,30,92,0.28),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.4)] supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150 sm:h-full sm:max-h-none sm:max-w-md sm:rounded-[2rem]"
      >
        {/* Glass depth: soft colour blobs behind the content + a diagonal sheen */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/40 blur-3xl" />
          <div className="absolute -left-20 top-1/2 h-64 w-64 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-indigo-300/30 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/5 to-white/30" />
          <div className="sln-sheen absolute inset-y-0 left-0 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>

        {/* Header */}
        <div className="relative shrink-0 px-5 pb-4 pt-3 sm:pt-5">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-400/40 sm:hidden" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-blue-600 shadow-[0_4px_14px_rgba(37,99,235,0.18),inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-white/80">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-black text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-extrabold leading-tight text-slate-900">System alerts and dispatch logs</h3>
                <p className="mt-0.5 text-xs text-slate-500">Simulated automated email and SMS notifications</p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/60 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 transition hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="relative flex shrink-0 items-center justify-between gap-3 border-y border-white/60 bg-white/25 px-5 py-3">
          <div
            role="tablist"
            aria-label="Notification filter"
            className="inline-flex gap-1 rounded-full bg-white/50 p-1 text-xs font-bold shadow-[inset_0_1px_2px_rgba(15,30,92,0.06)] ring-1 ring-white/70"
          >
            {tabs.map((t) => {
              const active = filter === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(t.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 transition-all ${
                    active
                      ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${active ? 'bg-white/25' : 'bg-slate-900/[0.07] text-slate-600'}`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-blue-600 transition hover:bg-white/70 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden min-[380px]:inline">Mark all as read</span>
            <span className="min-[380px]:hidden">Read all</span>
          </button>
        </div>

        {/* List */}
        <div className="relative flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/60 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-white/80">
                <Bell className="h-8 w-8" />
              </span>
              <h4 className="text-base font-extrabold text-slate-900">
                {notifications.length === 0 ? 'No alerts yet' : "You're all caught up"}
              </h4>
              <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                {notifications.length === 0
                  ? 'Booking confirmations, delays and refund updates will appear here.'
                  : 'There are no unread notifications right now.'}
              </p>
              {notifications.length > 0 && filter === 'UNREAD' && (
                <button
                  onClick={() => setFilter('ALL')}
                  className="mt-1 rounded-full bg-white/70 px-4 py-2.5 text-xs font-bold text-blue-700 ring-1 ring-white/80 transition hover:bg-white"
                >
                  Show all notifications
                </button>
              )}
            </div>
          ) : (
            visible.map((n, i) => (
              <div
                key={n.id}
                className={`sln-item relative overflow-hidden rounded-2xl border p-4 transition-all ${
                  n.read
                    ? 'border-white/70 bg-white/45 shadow-[0_2px_12px_rgba(15,30,92,0.05),inset_0_1px_0_rgba(255,255,255,0.8)]'
                    : 'border-blue-300/50 bg-gradient-to-br from-blue-100/70 via-white/60 to-white/50 shadow-[0_6px_22px_rgba(37,99,235,0.14),inset_0_1px_0_rgba(255,255,255,0.95)]'
                }`}
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
              >
                {!n.read && <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-400 to-blue-600" />}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    {n.type === 'SMS' ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-500/25">
                        <MessageSquare className="h-3 w-3" /> SMS alert
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-bold text-sky-700 ring-1 ring-inset ring-sky-500/25">
                        <Mail className="h-3 w-3" /> Email dispatch
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="h-3 w-3" /> {n.timestamp}
                    </span>
                  </div>

                  {!n.read && (
                    <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0" aria-label="Unread">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60 motion-reduce:animate-none" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
                    </span>
                  )}
                </div>

                <h4 className={`mt-2.5 text-sm font-bold leading-snug ${n.read ? 'text-slate-800' : 'text-blue-900'}`}>{n.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{n.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="relative flex shrink-0 items-center justify-center gap-2 border-t border-white/60 bg-white/30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-center text-xs text-slate-500">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Connected to central SMS and SMTP dispatcher (FR10)
        </div>
      </div>
    </div>
  );
}