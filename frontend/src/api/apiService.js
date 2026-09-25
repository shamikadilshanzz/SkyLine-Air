// SkyLine Air - Central Backend API Service
// Connects React Frontend to Java Spring Boot REST API & SQL Database

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Generic Fetch Helper with clear error handling
 */
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { message: errorText };
      }
      throw new Error(errorJson.message || `Backend Error (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Backend server is offline or unreachable at http://localhost:8080. Please start the backend server using "mvn spring-boot:run".');
    }
    console.warn(`[Backend API] Request to ${url} failed: ${error.message}`);
    throw error;
  }
}

/**
 * User Normalization Helper
 */
export function normalizeUser(apiUser) {
  if (!apiUser) return null;
  return {
    id: apiUser.userId ? `USR-${apiUser.userId}` : (apiUser.id || 'USR-1'),
    rawId: apiUser.userId || apiUser.rawId,
    name: apiUser.fullName || apiUser.name || 'Alex Morgan',
    email: apiUser.email,
    phone: apiUser.phoneNumber || apiUser.phone || '+1 555-0192',
    role: apiUser.role || 'PASSENGER',
    loyaltyPoints: apiUser.loyaltyPoints ?? 1450,
    loyaltyTier: apiUser.loyaltyTier || 'Silver',
    frequentFlyerNo: apiUser.frequentFlyerNumber || apiUser.frequentFlyerNo || 'SL-8849201',
    passportNumber: apiUser.passportNumber || 'N9849201',
    passportExpiry: apiUser.passportExpiry || '2030-12-31',
    firstName: apiUser.firstName || (apiUser.fullName ? apiUser.fullName.split(' ')[0] : 'Alex'),
    lastName: apiUser.lastName || (apiUser.fullName ? apiUser.fullName.split(' ')[1] : 'Morgan'),
    title: apiUser.title || 'Mr',
    seatPreference: apiUser.seatPreference || 'Window',
    mealPreference: apiUser.mealPreference || 'Standard',
    address: apiUser.address || '',
    city: apiUser.city || '',
    country: apiUser.country || '',
  };
}

// ----------------------------------------------------
// USER & AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

export async function loginUserApi(email, password) {
  const data = await fetchApi('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return normalizeUser(data);
}

export async function registerUserApi(userData) {
  const data = await fetchApi('/users/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return normalizeUser(data);
}

export async function updateUserProfileApi(userId, userData) {
  const data = await fetchApi(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
  return normalizeUser(data);
}

// ----------------------------------------------------
// FLIGHT MANAGEMENT & SEARCH ENDPOINTS
// ----------------------------------------------------

export async function fetchFlightsApi() {
  return await fetchApi('/flights');
}

export async function searchFlightsApi(origin, destination) {
  try {
    const data = await fetchApi(`/flights/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[searchFlightsApi] Backend fetch failed or offline, using fallback:', err.message);
  }
  return null;
}

export async function createFlightApi(flightData) {
  return await fetchApi('/flights', {
    method: 'POST',
    body: JSON.stringify(flightData),
  });
}

export async function updateFlightApi(flightId, flightData) {
  return await fetchApi(`/flights/${flightId}`, {
    method: 'PUT',
    body: JSON.stringify(flightData),
  });
}

export async function deleteFlightApi(flightId) {
  const rawId = typeof flightId === 'number' ? flightId : parseInt(String(flightId).replace(/\D/g, '')) || flightId;
  return await fetchApi(`/flights/${rawId}`, {
    method: 'DELETE',
  });
}

// ----------------------------------------------------
// AIRPORTS & AIRCRAFT ENDPOINTS
// ----------------------------------------------------

export async function fetchAirportsApi() {
  return await fetchApi('/airports');
}

export async function createAirportApi(airportData) {
  return await fetchApi('/airports', {
    method: 'POST',
    body: JSON.stringify(airportData),
  });
}

export async function updateAirportApi(code, airportData) {
  return await fetchApi(`/airports/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: JSON.stringify(airportData),
  });
}

export async function deleteAirportApi(code) {
  return await fetchApi(`/airports/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });
}

export async function fetchAircraftApi() {
  return await fetchApi('/aircraft');
}

export async function createAircraftApi(aircraftData) {
  return await fetchApi('/aircraft', {
    method: 'POST',
    body: JSON.stringify(aircraftData),
  });
}

export async function updateAircraftApi(id, aircraftData) {
  return await fetchApi(`/aircraft/${id}`, {
    method: 'PUT',
    body: JSON.stringify(aircraftData),
  });
}

export async function deleteAircraftApi(id) {
  return await fetchApi(`/aircraft/${id}`, {
    method: 'DELETE',
  });
}

// ----------------------------------------------------
// PRICE ALERTS & SAVED SEARCHES (SEARCH FLIGHT CRUD)
// ----------------------------------------------------

export async function fetchPriceAlertsApi(emailOrUserId) {
  if (typeof emailOrUserId === 'number') {
    return await fetchApi(`/price-alerts/user/${emailOrUserId}`);
  }
  if (typeof emailOrUserId === 'string' && emailOrUserId.includes('@')) {
    return await fetchApi(`/price-alerts/email/${encodeURIComponent(emailOrUserId)}`);
  }
  return await fetchApi('/price-alerts');
}

export async function createPriceAlertApi(alertData) {
  return await fetchApi('/price-alerts', {
    method: 'POST',
    body: JSON.stringify(alertData),
  });
}

export async function updatePriceAlertApi(id, alertData) {
  return await fetchApi(`/price-alerts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(alertData),
  });
}

export async function deletePriceAlertApi(id) {
  return await fetchApi(`/price-alerts/${id}`, {
    method: 'DELETE',
  });
}

// ----------------------------------------------------
// RESERVATIONS & PASSENGER ENDPOINTS
// ----------------------------------------------------

export async function createReservationApi(reservationData) {
  return await fetchApi('/reservations', {
    method: 'POST',
    body: JSON.stringify(reservationData),
  });
}

export async function fetchReservationsApi() {
  return await fetchApi('/reservations');
}

export async function fetchUserReservationsApi(userId, email) {
  const rawUserId = typeof userId === 'number' ? userId : parseInt(String(userId || '').replace(/\D/g, ''), 10);
  if (rawUserId && !isNaN(rawUserId)) {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    return await fetchApi(`/reservations/user/${rawUserId}${query}`);
  }
  if (email) {
    return await fetchApi(`/reservations/email/${encodeURIComponent(email)}`);
  }
  return [];
}

export async function updateReservationApi(reservationId, data) {
  const rawId = typeof reservationId === 'number' ? reservationId : parseInt(String(reservationId).replace(/\D/g, ''), 10);
  return await fetchApi(`/reservations/${rawId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateReservationByPnrApi(pnr, data) {
  return await fetchApi(`/reservations/pnr/${encodeURIComponent(pnr)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateReservationStatusApi(reservationId, status) {
  const rawId = typeof reservationId === 'number' ? reservationId : parseInt(String(reservationId).replace(/\D/g, ''), 10);
  return await fetchApi(`/reservations/${rawId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// ----------------------------------------------------
// PAYMENT ENDPOINTS
// ----------------------------------------------------

export async function processPaymentApi(paymentData) {
  return await fetchApi('/payments/process', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
}

export async function sendPaymentOtpApi({ email, passengerName, amount, pnr }) {
  return await fetchApi('/payments/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email, passengerName, amount, pnr }),
  });
}

export async function verifyPaymentOtpApi({ email, otpCode }) {
  return await fetchApi('/payments/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otpCode }),
  });
}


// ----------------------------------------------------
// REFUNDS & CANCELLATIONS ENDPOINTS
// ----------------------------------------------------

export async function fetchRefundsApi() {
  return await fetchApi('/refunds');
}

export async function fetchRefundsByUserEmailApi(email) {
  if (!email) return [];
  return await fetchApi(`/refunds/user/${encodeURIComponent(email)}`);
}


export async function createRefundRequestApi(refundData) {
  return await fetchApi('/refunds', {
    method: 'POST',
    body: JSON.stringify(refundData),
  });
}

export async function updateRefundStatusApi(refundId, status) {
  return await fetchApi(`/refunds/${refundId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// ----------------------------------------------------
// SAVED PAYMENT CARD ENDPOINTS
// ----------------------------------------------------

export async function fetchUserCardsApi(userId) {
  try {
    const rawId = typeof userId === 'number' ? userId : parseInt(String(userId).replace(/\D/g, ''));
    if (!rawId) return [];
    const cards = await fetchApi(`/cards/user/${rawId}`);
    if (!Array.isArray(cards)) return [];
    return cards.map(c => ({
      id: c.cardId ? `card-${c.cardId}` : c.id,
      rawId: c.cardId,
      cardType: c.cardType,
      cardHolder: c.cardHolder,
      last4: c.last4,
      expiry: c.expiry,
      cvv: c.cvv,
      isDefault: c.isDefault || false
    }));
  } catch (err) {
    console.warn('[fetchUserCardsApi] Notice:', err.message);
    return [];
  }
}

export async function saveUserCardApi(cardData) {
  const rawUserId = typeof cardData.userId === 'number' ? cardData.userId : parseInt(String(cardData.userId || '').replace(/\D/g, ''));
  if (!rawUserId) {
    throw new Error('Valid User ID is required to save a card');
  }
  const res = await fetchApi('/cards', {
    method: 'POST',
    body: JSON.stringify({
      userId: rawUserId,
      cardType: cardData.cardType || 'Visa',
      cardHolder: cardData.cardHolder || 'Card Holder',
      last4: cardData.last4 || '0000',
      expiry: cardData.expiry || '12/28',
      cvv: cardData.cvv || '',
      isDefault: cardData.isDefault || false
    })
  });
  return {
    id: res.cardId ? `card-${res.cardId}` : `card-${Date.now()}`,
    rawId: res.cardId,
    cardType: res.cardType,
    cardHolder: res.cardHolder,
    last4: res.last4,
    expiry: res.expiry,
    cvv: res.cvv,
    isDefault: res.isDefault
  };
}

export async function deleteUserCardApi(cardId) {
  const rawId = typeof cardId === 'number' ? cardId : parseInt(String(cardId).replace(/\D/g, ''));
  if (rawId) {
    return await fetchApi(`/cards/${rawId}`, { method: 'DELETE' });
  }
}

export async function setDefaultCardApi(cardId, userId) {
  const rawCardId = typeof cardId === 'number' ? cardId : parseInt(String(cardId).replace(/\D/g, ''));
  const rawUserId = typeof userId === 'number' ? userId : parseInt(String(userId || '1').replace(/\D/g, '')) || 1;
  if (rawCardId) {
    return await fetchApi(`/cards/${rawCardId}/default`, {
      method: 'PUT',
      body: JSON.stringify({ userId: rawUserId })
    });
  }
}

// ----------------------------------------------------
// HOTEL & LAYOVER ENDPOINTS
// ----------------------------------------------------

export async function fetchHotelsApi() {
  return await fetchApi('/hotels');
}

export async function createHotelApi(hotelData) {
  return await fetchApi('/hotels', {
    method: 'POST',
    body: JSON.stringify(hotelData),
  });
}

export async function updateHotelApi(hotelId, hotelData) {
  const rawId = typeof hotelId === 'number' ? hotelId : parseInt(String(hotelId).replace(/\D/g, ''), 10);
  return await fetchApi(`/hotels/${rawId}`, {
    method: 'PUT',
    body: JSON.stringify(hotelData),
  });
}

export async function deleteHotelApi(hotelId) {
  const rawId = typeof hotelId === 'number' ? hotelId : parseInt(String(hotelId).replace(/\D/g, ''), 10);
  return await fetchApi(`/hotels/${rawId}`, {
    method: 'DELETE',
  });
}

export async function fetchHotelsByCountryApi(country) {
  try {
    return await fetchApi(`/hotels/country/${encodeURIComponent(country)}`);
  } catch (err) {
    console.warn('[fetchHotelsByCountryApi] Notice:', err.message);
    return [];
  }
}

export async function fetchHotelsByAirportApi(code) {
  try {
    return await fetchApi(`/hotels/airport/${encodeURIComponent(code)}`);
  } catch (err) {
    console.warn('[fetchHotelsByAirportApi] Notice:', err.message);
    return [];
  }
}

export async function bookHotelApi(bookingData) {
  return await fetchApi('/hotels/book', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
}

export async function fetchHotelBookingsApi() {
  try {
    return await fetchApi('/hotels/bookings');
  } catch (err) {
    console.warn('[fetchHotelBookingsApi] Notice:', err.message);
    return [];
  }
}

export async function fetchHotelBookingsByPnrApi(pnr) {
  try {
    return await fetchApi(`/hotels/bookings/pnr/${encodeURIComponent(pnr)}`);
  } catch (err) {
    console.warn('[fetchHotelBookingsByPnrApi] Notice:', err.message);
    return [];
  }
}

export async function fetchHotelBookingsByUserApi(userId) {
  try {
    return await fetchApi(`/hotels/bookings/user/${userId}`);
  } catch (err) {
    console.warn('[fetchHotelBookingsByUserApi] Notice:', err.message);
    return [];
  }
}

export async function updateHotelBookingStatusApi(bookingId, status) {
  const rawId = typeof bookingId === 'number' ? bookingId : parseInt(String(bookingId).replace(/\D/g, ''), 10);
  return await fetchApi(`/hotels/bookings/${rawId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

export async function deleteHotelBookingApi(bookingId) {
  const rawId = typeof bookingId === 'number' ? bookingId : parseInt(String(bookingId).replace(/\D/g, ''), 10);
  return await fetchApi(`/hotels/bookings/${rawId}`, {
    method: 'DELETE'
  });
}

export function isOwnHotelBooking(booking, user) {
  if (!booking || !user) return false;
  const uid = user.rawId != null ? Number(user.rawId) : NaN;
  if (booking.userId != null && Number.isFinite(uid)) {
    return Number(booking.userId) === uid;
  }
  if (booking.userId != null) return false;

  const bookingEmail = String(booking.guestEmail || booking.userEmail || '').trim().toLowerCase();
  const userEmail = String(user.email || '').trim().toLowerCase();
  if (bookingEmail) {
    return Boolean(userEmail && bookingEmail === userEmail);
  }

  const bookingName = String(booking.passengerName || booking.userName || '').trim().toLowerCase();
  const userName = String(user.name || '').trim().toLowerCase();
  return Boolean(bookingName && userName && bookingName === userName);
}

// ----------------------------------------------------
// DELETE ENDPOINTS FOR SQL DATABASE SYNCHRONIZATION
// ----------------------------------------------------

export async function deleteReservationByPnrApi(pnr) {
  if (pnr) {
    return await fetchApi(`/reservations/pnr/${pnr}`, { method: 'DELETE' });
  }
}

export async function deleteReservationApi(id) {
  const rawId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''));
  if (rawId) {
    return await fetchApi(`/reservations/${rawId}`, { method: 'DELETE' });
  }
}

export async function clearAllReservationsApi() {
  return await fetchApi('/reservations', { method: 'DELETE' });
}

export async function deleteRefundApi(refundId) {
  const rawId = typeof refundId === 'number' ? refundId : parseInt(String(refundId).replace(/\D/g, ''));
  if (rawId) {
    return await fetchApi(`/refunds/${rawId}`, { method: 'DELETE' });
  }
}
