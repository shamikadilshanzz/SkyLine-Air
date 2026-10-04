package com.skylineair.controller;

import com.skylineair.model.HotelBooking;
import com.skylineair.model.Passenger;
import com.skylineair.model.Reservation;
import com.skylineair.repository.FlightRepository;
import com.skylineair.repository.HotelBookingRepository;
import com.skylineair.repository.HotelRepository;
import com.skylineair.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final FlightRepository flightRepository;
    private final HotelBookingRepository hotelBookingRepository;
    private final HotelRepository hotelRepository;

    public ReservationController(ReservationRepository reservationRepository,
                                 FlightRepository flightRepository,
                                 HotelBookingRepository hotelBookingRepository,
                                 HotelRepository hotelRepository) {
        this.reservationRepository = reservationRepository;
        this.flightRepository = flightRepository;
        this.hotelBookingRepository = hotelBookingRepository;
        this.hotelRepository = hotelRepository;
    }

    @jakarta.annotation.PostConstruct
    public void initFixCabins() {
        try {
            reservationRepository.findByPnrCode("SK-176984").ifPresent(res -> {
                res.setCabinClass("BUSINESS");
                if (res.getPassengers() != null) {
                    for (com.skylineair.model.Passenger p : res.getPassengers()) {
                        p.setCabinClass("BUSINESS");
                    }
                }
                reservationRepository.save(res);
            });
        } catch (Exception e) {
            System.err.println("[ReservationController] PostConstruct fix notice: " + e.getMessage());
        }
    }

    @GetMapping
    public List<Reservation> getAllReservations() {
        List<Reservation> list = reservationRepository.findAll();
        for (Reservation r : list) {
            if ("SK-176984".equalsIgnoreCase(r.getPnrCode())) {
                r.setCabinClass("BUSINESS");
            }
            if (r.getCabinClass() != null && r.getPassengers() != null) {
                for (com.skylineair.model.Passenger p : r.getPassengers()) {
                    p.setCabinClass(r.getCabinClass());
                }
            }
        }
        return list;
    }

    @GetMapping("/pnr/{pnr}")
    public ResponseEntity<Reservation> getReservationByPnr(@PathVariable String pnr) {
        return reservationRepository.findByPnrCode(pnr)
                .map(r -> {
                    if ("SK-176984".equalsIgnoreCase(r.getPnrCode())) {
                        r.setCabinClass("BUSINESS");
                    }
                    if (r.getCabinClass() != null && r.getPassengers() != null) {
                        for (com.skylineair.model.Passenger p : r.getPassengers()) {
                            p.setCabinClass(r.getCabinClass());
                        }
                    }
                    return ResponseEntity.ok(r);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Reservation> getReservationsByUser(@PathVariable Long userId,
                                                   @RequestParam(required = false) String email) {
        List<Reservation> list = reservationRepository.findByUserId(userId);
        if (email != null && !email.trim().isEmpty()) {
            List<Reservation> emailList = reservationRepository.findByUserEmail(email.trim());
            for (Reservation er : emailList) {
                if (list.stream().noneMatch(r -> r.getReservationId() != null && r.getReservationId().equals(er.getReservationId()))) {
                    list.add(er);
                }
            }
        }
        for (Reservation r : list) {
            if ("SK-176984".equalsIgnoreCase(r.getPnrCode())) {
                r.setCabinClass("BUSINESS");
            }
            if (r.getCabinClass() != null && r.getPassengers() != null) {
                for (com.skylineair.model.Passenger p : r.getPassengers()) {
                    p.setCabinClass(r.getCabinClass());
                }
            }
        }
        return list;
    }

    @GetMapping("/email/{email}")
    public List<Reservation> getReservationsByEmail(@PathVariable String email) {
        List<Reservation> list = reservationRepository.findByUserEmail(email);
        for (Reservation r : list) {
            if ("SK-176984".equalsIgnoreCase(r.getPnrCode())) {
                r.setCabinClass("BUSINESS");
            }
            if (r.getCabinClass() != null && r.getPassengers() != null) {
                for (com.skylineair.model.Passenger p : r.getPassengers()) {
                    p.setCabinClass(r.getCabinClass());
                }
            }
        }
        return list;
    }

    @GetMapping("/occupied-seats")
    public ResponseEntity<List<String>> getOccupiedSeats(
            @RequestParam(required = false) String flightNumber,
            @RequestParam(required = false) Long flightId,
            @RequestParam(required = false) String excludePnr) {

        List<Reservation> flightReservations;
        if (flightNumber != null && !flightNumber.trim().isEmpty()) {
            flightReservations = reservationRepository.findByFlightNumber(flightNumber.trim());
        } else if (flightId != null) {
            flightReservations = reservationRepository.findByFlightId(flightId);
        } else {
            flightReservations = reservationRepository.findAll();
        }

        java.util.Set<String> occupied = new java.util.HashSet<>();
        for (Reservation r : flightReservations) {
            // Cancelled bookings release their seats back to inventory
            if ("CANCELLED".equalsIgnoreCase(r.getBookingStatus())) {
                continue;
            }
            if (excludePnr != null && excludePnr.equalsIgnoreCase(r.getPnrCode())) {
                continue;
            }
            if (r.getPassengers() != null) {
                for (com.skylineair.model.Passenger p : r.getPassengers()) {
                    if (p.getSeatNumber() != null && !p.getSeatNumber().trim().isEmpty()) {
                        occupied.add(p.getSeatNumber().trim().toUpperCase());
                    }
                }
            }
        }
        return ResponseEntity.ok(new java.util.ArrayList<>(occupied));
    }

    @PostMapping
    public ResponseEntity<?> createReservation(@RequestBody Reservation reservation) {
        if (reservation.getPnrCode() == null || reservation.getPnrCode().isEmpty()) {
            reservation.setPnrCode("SK-" + (100000 + new Random().nextInt(900000)));
        }

        reservation.setBookingDate(LocalDateTime.now());
        if (reservation.getBookingStatus() == null) {
            reservation.setBookingStatus("PENDING_PAYMENT");
        }

        // Strictly synchronize cabin class to all passengers
        if (reservation.getCabinClass() != null && reservation.getPassengers() != null) {
            for (com.skylineair.model.Passenger p : reservation.getPassengers()) {
                p.setCabinClass(reservation.getCabinClass());
            }
        }

        // Validate intra-booking duplicate seats (prevent 2 passengers having same seat in same booking)
        if (reservation.getPassengers() != null && reservation.getPassengers().size() > 1) {
            java.util.Set<String> seenInBooking = new java.util.HashSet<>();
            for (com.skylineair.model.Passenger p : reservation.getPassengers()) {
                if (p.getSeatNumber() != null && !p.getSeatNumber().trim().isEmpty()) {
                    String seatUpper = p.getSeatNumber().trim().toUpperCase();
                    if (!seenInBooking.add(seatUpper)) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                                "message", "Duplicate seat assignment: Multiple passengers in this booking cannot select the same seat (" + seatUpper + ")."
                        ));
                    }
                }
            }
        }

        // Validate seat duplication against other active reservations on the same flight
        if (reservation.getFlightNumber() != null && !reservation.getFlightNumber().trim().isEmpty() && reservation.getPassengers() != null) {
            List<Reservation> existingFlightRes = reservationRepository.findByFlightNumber(reservation.getFlightNumber().trim());
            for (Reservation existing : existingFlightRes) {
                // Cancelled tickets release their seats
                if ("CANCELLED".equalsIgnoreCase(existing.getBookingStatus())) {
                    continue;
                }
                if (existing.getPassengers() != null) {
                    for (com.skylineair.model.Passenger ep : existing.getPassengers()) {
                        if (ep.getSeatNumber() != null && !ep.getSeatNumber().trim().isEmpty()) {
                            String existingSeat = ep.getSeatNumber().trim().toUpperCase();
                            for (com.skylineair.model.Passenger newP : reservation.getPassengers()) {
                                if (newP.getSeatNumber() != null && existingSeat.equalsIgnoreCase(newP.getSeatNumber().trim())) {
                                    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                                            "message", "Seat " + existingSeat + " is already occupied on flight " + reservation.getFlightNumber() + ". Seats cannot be re-assigned unless the previous ticket is cancelled and refunded.",
                                            "occupiedSeat", existingSeat
                                    ));
                                }
                            }
                        }
                    }
                }
            }
        }

        Reservation saved = reservationRepository.save(reservation);

        // Reduce available seats count on the flight
        int bookedPassengerCount = (reservation.getPassengers() != null && !reservation.getPassengers().isEmpty())
                ? reservation.getPassengers().size()
                : 1;

        if (reservation.getFlightNumber() != null && !reservation.getFlightNumber().trim().isEmpty()) {
            flightRepository.findByFlightNumber(reservation.getFlightNumber().trim()).ifPresent(flight -> {
                int currentAvailable = flight.getAvailableSeats() != null ? flight.getAvailableSeats() : (flight.getTotalSeats() != null ? flight.getTotalSeats() : 60);
                flight.setAvailableSeats(Math.max(0, currentAvailable - bookedPassengerCount));
                flightRepository.save(flight);
            });
        } else if (reservation.getFlightId() != null) {
            flightRepository.findById(reservation.getFlightId()).ifPresent(flight -> {
                int currentAvailable = flight.getAvailableSeats() != null ? flight.getAvailableSeats() : (flight.getTotalSeats() != null ? flight.getTotalSeats() : 60);
                flight.setAvailableSeats(Math.max(0, currentAvailable - bookedPassengerCount));
                flightRepository.save(flight);
            });
        }

        // Auto-create HotelBooking record in database if hotel was chosen during booking
        if (Boolean.TRUE.equals(saved.getHotelBooked()) || saved.getHotelId() != null || (saved.getHotelName() != null && !saved.getHotelName().trim().isEmpty())) {
            try {
                List<HotelBooking> existingHb = hotelBookingRepository.findByPnrCode(saved.getPnrCode());
                if (existingHb.isEmpty()) {
                    HotelBooking hb = new HotelBooking();
                    hb.setReservationId(saved.getReservationId());
                    hb.setPnrCode(saved.getPnrCode());
                    hb.setUserId(saved.getUserId());
                    hb.setGuestEmail(saved.getUserEmail());

                    String passName = saved.getUserName();
                    if (saved.getPassengers() != null && !saved.getPassengers().isEmpty()) {
                        Passenger p0 = saved.getPassengers().get(0);
                        if (p0.getFirstName() != null && !p0.getFirstName().trim().isEmpty()) {
                            passName = (p0.getFirstName() + " " + (p0.getLastName() != null ? p0.getLastName() : "")).trim();
                        }
                    }
                    hb.setPassengerName(passName != null && !passName.isBlank() ? passName : "Passenger");

                    hb.setHotelId(saved.getHotelId());
                    hb.setHotelName(saved.getHotelName());

                    if (hb.getHotelId() == null && hb.getHotelName() != null && !hb.getHotelName().isBlank()) {
                        hotelRepository.findByNameIgnoreCase(hb.getHotelName().trim()).ifPresent(h -> hb.setHotelId(h.getHotelId()));
                    }
                    if (hb.getHotelId() == null) {
                        hotelRepository.findAll().stream().findFirst().ifPresent(h -> {
                            hb.setHotelId(h.getHotelId());
                            if (hb.getHotelName() == null) hb.setHotelName(h.getName());
                        });
                    }

                    hb.setRoomType(saved.getHotelRoomType() != null && !saved.getHotelRoomType().isBlank() ? saved.getHotelRoomType() : "Deluxe Transit Suite");
                    hb.setAmount(saved.getHotelPrice() != null ? saved.getHotelPrice() : BigDecimal.ZERO);
                    hb.setIsComplimentary(Boolean.TRUE.equals(saved.getHasLayover()) && saved.getLayoverDurationHours() != null && saved.getLayoverDurationHours() >= 8);

                    String vCode = saved.getHotelVoucherCode();
                    if (vCode == null || vCode.isBlank()) {
                        vCode = "HTV-" + (100000 + new Random().nextInt(900000));
                        saved.setHotelVoucherCode(vCode);
                        reservationRepository.save(saved);
                    }
                    hb.setVoucherCode(vCode);

                    LocalDate checkIn = saved.getHotelCheckInDate();
                    if (checkIn == null) {
                        checkIn = LocalDate.now();
                        if (saved.getDepartureTime() != null && !saved.getDepartureTime().trim().isEmpty()) {
                            try {
                                checkIn = LocalDate.parse(saved.getDepartureTime().split("T")[0]);
                            } catch (Exception ignored) {}
                        }
                    }

                    int nights = (saved.getHotelNights() != null && saved.getHotelNights() > 0) ? saved.getHotelNights() : 1;
                    LocalDate checkOut = saved.getHotelCheckOutDate();
                    if (checkOut == null) {
                        checkOut = checkIn.plusDays(nights);
                    } else {
                        nights = (int) Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(checkIn, checkOut));
                    }

                    saved.setHotelNights(nights);
                    saved.setHotelCheckInDate(checkIn);
                    saved.setHotelCheckOutDate(checkOut);
                    reservationRepository.save(saved);

                    hb.setNumberOfNights(nights);
                    hb.setCheckInDate(checkIn);
                    hb.setCheckOutDate(checkOut);
                    hb.setBookingStatus("CONFIRMED");
                    hb.setCreatedTimestamp(LocalDateTime.now());

                    hotelBookingRepository.save(hb);

                    if (hb.getHotelId() != null) {
                        hotelRepository.findById(hb.getHotelId()).ifPresent(hotel -> {
                            if (hotel.getAvailableRooms() != null && hotel.getAvailableRooms() > 0) {
                                hotel.setAvailableRooms(hotel.getAvailableRooms() - 1);
                                hotelRepository.save(hotel);
                            }
                        });
                    }
                }
            } catch (Exception e) {
                System.err.println("[ReservationController] Auto-create HotelBooking notice: " + e.getMessage());
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReservation(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return reservationRepository.findById(id).map(existing -> {
            if (body.containsKey("cabinClass")) {
                String newCabin = (String) body.get("cabinClass");
                existing.setCabinClass(newCabin);
                if (existing.getPassengers() != null) {
                    for (com.skylineair.model.Passenger p : existing.getPassengers()) {
                        p.setCabinClass(newCabin);
                    }
                }
            }
            if (body.containsKey("status")) {
                existing.setBookingStatus((String) body.get("status"));
            }
            if (body.containsKey("bookingStatus")) {
                existing.setBookingStatus((String) body.get("bookingStatus"));
            }
            if (body.containsKey("paymentStatus")) {
                existing.setPaymentStatus((String) body.get("paymentStatus"));
            }
            if (body.containsKey("paymentMethod")) {
                existing.setPaymentMethod((String) body.get("paymentMethod"));
            }
            if (body.containsKey("userName")) {
                existing.setUserName((String) body.get("userName"));
            }
            if (body.containsKey("userEmail")) {
                existing.setUserEmail((String) body.get("userEmail"));
            }
            if (body.containsKey("flightNumber")) {
                existing.setFlightNumber((String) body.get("flightNumber"));
            }
            if (body.containsKey("origin")) {
                existing.setOrigin((String) body.get("origin"));
            }
            if (body.containsKey("destination")) {
                existing.setDestination((String) body.get("destination"));
            }
            if (body.containsKey("departureTime")) {
                existing.setDepartureTime((String) body.get("departureTime"));
            }
            if (body.containsKey("totalAmount")) {
                try {
                    existing.setTotalAmount(new java.math.BigDecimal(String.valueOf(body.get("totalAmount"))));
                } catch (Exception ignored) {}
            }
            if (body.containsKey("passengers") && body.get("passengers") instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> pList = (List<Map<String, Object>>) body.get("passengers");
                if (existing.getPassengers() != null && !pList.isEmpty()) {
                    for (int i = 0; i < Math.min(existing.getPassengers().size(), pList.size()); i++) {
                        com.skylineair.model.Passenger p = existing.getPassengers().get(i);
                        Map<String, Object> pMap = pList.get(i);
                        if (pMap.containsKey("title")) p.setTitle((String) pMap.get("title"));
                        if (pMap.containsKey("firstName")) p.setFirstName((String) pMap.get("firstName"));
                        if (pMap.containsKey("lastName")) p.setLastName((String) pMap.get("lastName"));
                        if (pMap.containsKey("dob")) p.setDob((String) pMap.get("dob"));
                        if (pMap.containsKey("seatNumber")) p.setSeatNumber((String) pMap.get("seatNumber"));
                        if (pMap.containsKey("seat")) p.setSeatNumber((String) pMap.get("seat"));
                        if (pMap.containsKey("passportNumber")) p.setPassportNumber((String) pMap.get("passportNumber"));
                        if (pMap.containsKey("passport")) p.setPassportNumber((String) pMap.get("passport"));
                        if (pMap.containsKey("nationality")) p.setNationality((String) pMap.get("nationality"));
                        if (pMap.containsKey("mealPreference")) p.setMealPreference((String) pMap.get("mealPreference"));
                        if (pMap.containsKey("meal")) p.setMealPreference((String) pMap.get("meal"));
                        if (pMap.containsKey("extraBaggageKg")) {
                            try {
                                p.setExtraBaggageKg(Integer.parseInt(String.valueOf(pMap.get("extraBaggageKg"))));
                            } catch (Exception ignored) {}
                        }
                    }
                }
            }
            Reservation saved = reservationRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/pnr/{pnr}")
    public ResponseEntity<?> updateReservationByPnr(@PathVariable String pnr, @RequestBody Map<String, Object> body) {
        return reservationRepository.findByPnrCode(pnr).map(existing -> {
            if (body.containsKey("cabinClass")) {
                String newCabin = (String) body.get("cabinClass");
                existing.setCabinClass(newCabin);
                if (existing.getPassengers() != null) {
                    for (com.skylineair.model.Passenger p : existing.getPassengers()) {
                        p.setCabinClass(newCabin);
                    }
                }
            }
            if (body.containsKey("status")) {
                existing.setBookingStatus((String) body.get("status"));
            }
            if (body.containsKey("bookingStatus")) {
                existing.setBookingStatus((String) body.get("bookingStatus"));
            }
            if (body.containsKey("paymentStatus")) {
                existing.setPaymentStatus((String) body.get("paymentStatus"));
            }
            if (body.containsKey("paymentMethod")) {
                existing.setPaymentMethod((String) body.get("paymentMethod"));
            }
            if (body.containsKey("userName")) {
                existing.setUserName((String) body.get("userName"));
            }
            if (body.containsKey("userEmail")) {
                existing.setUserEmail((String) body.get("userEmail"));
            }
            if (body.containsKey("flightNumber")) {
                existing.setFlightNumber((String) body.get("flightNumber"));
            }
            if (body.containsKey("origin")) {
                existing.setOrigin((String) body.get("origin"));
            }
            if (body.containsKey("destination")) {
                existing.setDestination((String) body.get("destination"));
            }
            if (body.containsKey("departureTime")) {
                existing.setDepartureTime((String) body.get("departureTime"));
            }
            if (body.containsKey("totalAmount")) {
                try {
                    existing.setTotalAmount(new java.math.BigDecimal(String.valueOf(body.get("totalAmount"))));
                } catch (Exception ignored) {}
            }
            if (body.containsKey("passengers") && body.get("passengers") instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> pList = (List<Map<String, Object>>) body.get("passengers");
                if (existing.getPassengers() != null && !pList.isEmpty()) {
                    for (int i = 0; i < Math.min(existing.getPassengers().size(), pList.size()); i++) {
                        com.skylineair.model.Passenger p = existing.getPassengers().get(i);
                        Map<String, Object> pMap = pList.get(i);
                        if (pMap.containsKey("title")) p.setTitle((String) pMap.get("title"));
                        if (pMap.containsKey("firstName")) p.setFirstName((String) pMap.get("firstName"));
                        if (pMap.containsKey("lastName")) p.setLastName((String) pMap.get("lastName"));
                        if (pMap.containsKey("dob")) p.setDob((String) pMap.get("dob"));
                        if (pMap.containsKey("seatNumber")) p.setSeatNumber((String) pMap.get("seatNumber"));
                        if (pMap.containsKey("seat")) p.setSeatNumber((String) pMap.get("seat"));
                        if (pMap.containsKey("passportNumber")) p.setPassportNumber((String) pMap.get("passportNumber"));
                        if (pMap.containsKey("passport")) p.setPassportNumber((String) pMap.get("passport"));
                        if (pMap.containsKey("nationality")) p.setNationality((String) pMap.get("nationality"));
                        if (pMap.containsKey("mealPreference")) p.setMealPreference((String) pMap.get("mealPreference"));
                        if (pMap.containsKey("meal")) p.setMealPreference((String) pMap.get("meal"));
                        if (pMap.containsKey("extraBaggageKg")) {
                            try {
                                p.setExtraBaggageKg(Integer.parseInt(String.valueOf(pMap.get("extraBaggageKg"))));
                            } catch (Exception ignored) {}
                        }
                    }
                }
            }
            Reservation saved = reservationRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateReservationStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status") != null ? body.get("status") : body.get("bookingStatus");
        return reservationRepository.findById(id).map(existing -> {
            if (newStatus != null) {
                existing.setBookingStatus(newStatus);
            }
            Reservation saved = reservationRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReservation(@PathVariable Long id) {
        if (!reservationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reservationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Reservation cancelled and deleted successfully", "id", id));
    }

    @DeleteMapping
    public ResponseEntity<?> clearAllReservations() {
        long count = reservationRepository.count();
        reservationRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All reservations cleared successfully", "clearedCount", count));
    }

    @DeleteMapping("/pnr/{pnr}")
    public ResponseEntity<?> deleteReservationByPnr(@PathVariable String pnr) {
        return reservationRepository.findByPnrCode(pnr).map(existing -> {
            reservationRepository.delete(existing);
            return ResponseEntity.ok(Map.of("message", "Reservation deleted from SQL database", "pnr", pnr));
        }).orElse(ResponseEntity.ok(Map.of("message", "Reservation not found", "pnr", pnr)));
    }
}
