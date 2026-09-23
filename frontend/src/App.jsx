import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import NotificationDrawer from './components/common/NotificationDrawer';
import AuthModal from './components/common/AuthModal';

import HomePage from './components/home/HomePage';
import FlightResultsView from './components/flightSearch/FlightResultsView';
import SeatReservationView from './components/seatReservation/SeatReservationView';
import PaymentView from './components/payment/PaymentView';
import CancellationRefundView from './components/cancellationRefund/CancellationRefundView';
import ScheduleManagementView from './components/scheduleManagement/ScheduleManagementView';
import LayoverHotelView from './components/layoverHotel/LayoverHotelView';
import UserDashboard from './components/dashboard/UserDashboard';
import UserProfileView from './components/dashboard/UserProfileView';
import AdminAnalytics from './components/dashboard/AdminAnalytics';
import ReservationManagementView from './components/reservationManagement/ReservationManagementView';

import { MOCK_NOTIFICATIONS, INITIAL_FLIGHTS, INITIAL_AIRPORTS, DEFAULT_USER_PROFILE, DEMO_ACCOUNTS } from './data/mockData';

// Allowed navigation tabs per role to auto-redirect on role change
const ROLE_ALLOWED_TABS = {
  GUEST: ['search', 'results', 'seat-selection', 'payment', 'layover-hotels'],
  PASSENGER: ['search', 'results', 'seat-selection', 'meals', 'payment', 'bookings', 'profile', 'layover-hotels', 'refunds'],
  TICKETING_OFFICER: ['reservation-mgmt', 'refunds', 'schedule-mgmt', 'search', 'results', 'seat-selection', 'profile'],
  ADMIN: ['schedule-mgmt', 'analytics', 'refunds', 'search', 'results', 'profile'],
  HOTEL_MANAGER: ['layover-hotels', 'profile']
};

// Route Path Mappings for Browser URL Navigation
const ROUTE_TO_TAB = {
  '/': 'search',
  '/search': 'search',
  '/searchflight': 'results',
  '/results': 'results',
  '/select-seat': 'seat-selection',
  '/seat-selection': 'seat-selection',
  '/meals': 'meals',
  '/select-meal': 'meals',
  '/dining': 'meals',
  '/payment': 'payment',
  '/bookings': 'bookings',
  '/profile': 'profile',
  '/dashboard': 'profile',
  '/layover-hotels': 'layover-hotels',
  '/refunds': 'refunds',
  '/schedule-mgmt': 'schedule-mgmt',
  '/analytics': 'analytics',
  '/reservation-mgmt': 'reservation-mgmt',
  '/reservations': 'reservation-mgmt',
};

const TAB_TO_ROUTE = {
  'search': '/',
  'results': '/searchflight',
  'seat-selection': '/select-seat',
  'meals': '/meals',
  'payment': '/payment',
  'bookings': '/bookings',
  'profile': '/profile',
  'layover-hotels': '/layover-hotels',
  'refunds': '/refunds',
  'schedule-mgmt': '/schedule-mgmt',
  'analytics': '/analytics',
  'reservation-mgmt': '/reservation-mgmt',
};

export default function App() {
  // Sync initial activeTab state from current window.location.pathname
  const getTabFromPath = () => {
    const path = window.location.pathname.toLowerCase();
    return ROUTE_TO_TAB[path] || 'search';
  };

  const [activeTab, setActiveTabState] = React.useState(getTabFromPath);

  const setActiveTab = (tab, pushHistory = true) => {
    setActiveTabState(tab);
    if (pushHistory) {
      const targetRoute = TAB_TO_ROUTE[tab] || '/';
      if (window.location.pathname !== targetRoute) {
        window.history.pushState({ tab }, '', targetRoute);
      }
    }
  };

  // Synchronize browser back/forward buttons
  React.useEffect(() => {
    const handlePopState = () => {
      const currentTab = getTabFromPath();
      setActiveTabState(currentTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [currentRole, setCurrentRole] = React.useState('PASSENGER'); // 'PASSENGER', 'TICKETING_OFFICER', 'ADMIN', 'HOTEL_MANAGER'

  // User Authentication State
  const [user, setUser] = React.useState(null);
  const [backendStatus, setBackendStatus] = React.useState({ connected: true, message: '' });

  // Role Handler & Tab Auto-Redirect
  const handleSetRole = (role) => {
    setCurrentRole(role);
    if (role === 'ADMIN') {
      setActiveTab('schedule-mgmt');
      return;
    }
    if (role === 'TICKETING_OFFICER') {
      setActiveTab('reservation-mgmt');
      return;
    }
    if (role === 'HOTEL_MANAGER') {
      setActiveTab('layover-hotels');
      return;
    }
    const allowed = ROLE_ALLOWED_TABS[role] || ROLE_ALLOWED_TABS.PASSENGER;
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    const role = loggedInUser.role || 'PASSENGER';
    setCurrentRole(role);
    if (role === 'ADMIN') {
      setActiveTab('schedule-mgmt');
      return;
    }
    if (role === 'TICKETING_OFFICER') {
      setActiveTab('reservation-mgmt');
      return;
    }
    if (role === 'HOTEL_MANAGER') {
      setActiveTab('layover-hotels');
      return;
    }
    const allowed = ROLE_ALLOWED_TABS[role] || ROLE_ALLOWED_TABS.PASSENGER;
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentRole('GUEST');
    setActiveTab('search');
  };

  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState(MOCK_NOTIFICATIONS);

  // Shared Flights & Airports State for System CRUD
  const [flights, setFlights] = React.useState(INITIAL_FLIGHTS);
  const [airports, setAirports] = React.useState(INITIAL_AIRPORTS);
  const [searchCriteria, setSearchCriteria] = React.useState(null);
  const [selectedFlight, setSelectedFlight] = React.useState(INITIAL_FLIGHTS[1]); // Default SL-204
  const [reservationData, setReservationData] = React.useState(null);

  // Sync Flights & Airports with Backend REST API & Check Backend Status
  React.useEffect(() => {
    async function loadBackendData() {
      try {
        const { fetchFlightsApi, fetchAirportsApi } = await import('./api/apiService');
        const [apiFlights, apiAirports] = await Promise.all([
          fetchFlightsApi().catch(() => null),
          fetchAirportsApi().catch(() => null)
        ]);

        if (apiAirports && apiAirports.length > 0) {
          const formattedAirports = apiAirports.map(a => ({
            code: a.airportCode || a.code,
            name: a.airportName || a.name,
            city: a.city,
            country: a.country
          }));
          setAirports(formattedAirports);
        }

        if (apiFlights && apiFlights.length > 0) {
          const formatted = apiFlights.map(f => ({
            id: f.flightId ? `FL-${f.flightId}` : f.id,
            rawId: f.flightId,
            flightNumber: f.flightNumber,
            origin: f.originCode || f.origin,
            destination: f.destinationCode || f.destination,
            originCity: f.originCity || f.origin,
            destinationCity: f.destinationCity || f.destination,
            departureTime: f.departureTime,
            arrivalTime: f.arrivalTime,
            duration: f.duration || '4h 00m',
            stops: f.stops || 0,
            aircraft: f.aircraftModel || f.aircraft || 'Boeing 787-9 Dreamliner',
            tailNumber: f.tailNumber || '4R-SLA',
            priceEconomy: f.basePriceEconomy || f.priceEconomy || 350,
            priceBusiness: f.basePriceBusiness || f.priceBusiness || 850,
            priceFirst: f.basePriceFirst || f.priceFirst || 1500,
            totalSeats: f.totalSeats || 60,
            availableSeats: f.availableSeats || 42,
            status: f.status || 'ON_TIME',
            hasLayover: f.hasLayover || false,
            layoverDurationHours: f.layoverDurationHours || 0,
            layoverAirport: f.layoverAirport,
            layoverCity: f.layoverCity,
            image: f.image || 'https://cdn.phototourl.com/free/2026-08-30-e4fac5db-76e3-445a-b51c-5af0d4fe8c97.png'
          }));
          setFlights(formatted);
          if (formatted[0]) setSelectedFlight(formatted[0]);
        }
        setBackendStatus({ connected: true, message: '' });
      } catch (err) {
        setBackendStatus({
          connected: false,
          message: err.message || 'Backend API offline at http://localhost:8080'
        });
      }
    }
    loadBackendData();
  }, []);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Workflow Triggers
  const handleExecuteSearch = async (criteria) => {
    setSearchCriteria(criteria);
    setActiveTab('results');

    if (backendStatus.connected && criteria?.origin && criteria?.destination) {
      try {
        const { searchFlightsApi } = await import('./api/apiService');
        const apiResults = await searchFlightsApi(criteria.origin, criteria.destination);
        if (Array.isArray(apiResults)) {
          const formatted = apiResults.map(f => ({
            id: f.flightId ? `FL-${f.flightId}` : f.id,
            rawId: f.flightId,
            flightNumber: f.flightNumber,
            origin: f.originCode || f.origin,
            destination: f.destinationCode || f.destination,
            originCity: f.originCity || f.origin,
            destinationCity: f.destinationCity || f.destination,
            departureTime: f.departureTime,
            arrivalTime: f.arrivalTime,
            duration: f.duration || '4h 00m',
            stops: f.stops || 0,
            aircraft: f.aircraftModel || f.aircraft || 'Boeing 787-9 Dreamliner',
            tailNumber: f.tailNumber || '4R-SLA',
            priceEconomy: f.basePriceEconomy || f.priceEconomy || 350,
            priceBusiness: f.basePriceBusiness || f.priceBusiness || 850,
            priceFirst: f.basePriceFirst || f.priceFirst || 1500,
            totalSeats: f.totalSeats || 60,
            availableSeats: f.availableSeats || 42,
            status: f.status || 'ON_TIME',
            hasLayover: f.hasLayover || false,
            layoverDurationHours: f.layoverDurationHours || 0,
            layoverAirport: f.layoverAirport,
            layoverCity: f.layoverCity,
            image: f.image || 'https://cdn.phototourl.com/free/2026-08-30-e4fac5db-76e3-445a-b51c-5af0d4fe8c97.png'
          }));
          setFlights(formatted);
          if (formatted[0]) setSelectedFlight(formatted[0]);
        }
      } catch (err) {
        console.warn('[handleExecuteSearch] Backend API fetch notice:', err.message);
      }
    }
  };

  const handleSelectFlight = (flight) => {
    const cabin = (flight.cabinClass || flight.selectedClass || 'ECONOMY').toUpperCase();
    setSelectedFlight({
      ...flight,
      cabinClass: cabin,
      selectedClass: cabin
    });
    setActiveTab('seat-selection');
  };

  const handleConfirmReservation = (resData) => {
    const cabin = (resData.cabinClass || resData.flight?.cabinClass || resData.selectedClass || resData.flight?.selectedClass || 'ECONOMY').toUpperCase();
    setReservationData({
      ...resData,
      cabinClass: cabin,
      selectedClass: cabin,
      flight: {
        ...(resData.flight || {}),
        cabinClass: cabin,
        selectedClass: cabin
      }
    });
    setActiveTab('payment');
  };

  const handlePaymentSuccess = (confirmedData) => {
    const cabin = (confirmedData.cabinClass || confirmedData.flight?.cabinClass || confirmedData.selectedClass || 'ECONOMY').toUpperCase();
    setReservationData({
      ...confirmedData,
      cabinClass: cabin,
      selectedClass: cabin,
      flight: {
        ...(confirmedData.flight || {}),
        cabinClass: cabin,
        selectedClass: cabin
      }
    });
    // Add automated SMS dispatch alert
    const newNotif = {
      id: Date.now(),
      type: 'SMS',
      title: 'Booking & E-Ticket Confirmed!',
      text: `Your ${cabin} flight ${confirmedData.flight?.flightNumber || 'SL-204'} is confirmed. PNR: ${confirmedData.pnr}. Seat: ${confirmedData.seat}.`,
      timestamp: 'Just now',
      read: false
    };
    setNotifications([newNotif, ...notifications]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={handleSetRole}
        user={user}
        onLogout={handleLogout}
        setShowAuthModal={setShowAuthModal}
        unreadNotifications={unreadNotifications}
        setShowNotifications={setShowNotifications}
      />

      {/* Standalone / Backend Status Bar */}
      {!backendStatus.connected && (
        <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs font-semibold text-center flex flex-wrap items-center justify-center gap-2 shadow-sm border-b border-slate-800">
          <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold">
            ⚡ Standalone Offline Engine
          </span>
          <span>SkyLine Air integrated search active — Full offline flight search, seat allocation & e-ticket booking functional. (Run <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">mvn spring-boot:run</code> in backend for live SQL sync).</span>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'search' && (
          <HomePage
            onExecuteSearch={handleExecuteSearch}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'results' && (
          <FlightResultsView
            flights={flights}
            searchCriteria={searchCriteria}
            onSelectFlight={handleSelectFlight}
            onModifySearch={() => setActiveTab('search')}
          />
        )}

        {(activeTab === 'seat-selection' || activeTab === 'meals') && (
          <SeatReservationView
            selectedFlight={selectedFlight}
            currentRole={currentRole}
            airports={airports}
            onConfirmReservation={handleConfirmReservation}
            onBackToResults={() => setActiveTab('results')}
            initialOpenMealModal={activeTab === 'meals'}
            onCloseMealModal={() => {
              if (activeTab === 'meals') {
                setActiveTab('search');
              }
            }}
          />
        )}

        {activeTab === 'payment' && (
          <PaymentView
            reservationData={reservationData}
            user={user}
            onUpdateUser={(updatedUser) => setUser(updatedUser)}
            onPaymentSuccess={handlePaymentSuccess}
            onNavigateToHotels={() => setActiveTab('layover-hotels')}
          />
        )}

        {activeTab === 'bookings' && (
          <UserDashboard
            user={user}
            onSelectBooking={(booking) => {
              setReservationData(booking);
            }}
            onNavigateToProfile={() => setActiveTab('profile')}
            onNavigateToHotels={() => setActiveTab('layover-hotels')}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {(activeTab === 'profile' || activeTab === 'dashboard') && (
          <UserProfileView
            user={user}
            onUpdateUser={(updatedUser) => setUser(updatedUser)}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {activeTab === 'layover-hotels' && (
          <LayoverHotelView
            currentRole={currentRole}
            user={user}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {activeTab === 'refunds' && (
          <CancellationRefundView currentRole={currentRole} />
        )}

        {activeTab === 'reservation-mgmt' && (
          <ReservationManagementView currentRole={currentRole} user={user} />
        )}

        {activeTab === 'schedule-mgmt' && (
          <ScheduleManagementView
            flights={flights}
            onScheduleUpdated={(updatedList) => setFlights(updatedList)}
            airports={airports}
            onAirportsUpdated={(updatedAirports) => setAirports(updatedAirports)}
          />
        )}

        {activeTab === 'analytics' && (
          <AdminAnalytics />
        )}
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        markAllAsRead={markAllNotificationsAsRead}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

