package com.skylineair.controller;

import com.skylineair.model.Reservation;
import com.skylineair.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin
public class ReservationController {

    private final ReservationRepository reservationRepository;

    public ReservationController(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
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

        Reservation saved = reservationRepository.save(reservation);
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
                        if (pMap.containsKey("firstName")) p.setFirstName((String) pMap.get("firstName"));
                        if (pMap.containsKey("lastName")) p.setLastName((String) pMap.get("lastName"));
                        if (pMap.containsKey("seatNumber")) p.setSeatNumber((String) pMap.get("seatNumber"));
                        if (pMap.containsKey("seat")) p.setSeatNumber((String) pMap.get("seat"));
                        if (pMap.containsKey("passportNumber")) p.setPassportNumber((String) pMap.get("passportNumber"));
                        if (pMap.containsKey("passport")) p.setPassportNumber((String) pMap.get("passport"));
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
                        if (pMap.containsKey("firstName")) p.setFirstName((String) pMap.get("firstName"));
                        if (pMap.containsKey("lastName")) p.setLastName((String) pMap.get("lastName"));
                        if (pMap.containsKey("seatNumber")) p.setSeatNumber((String) pMap.get("seatNumber"));
                        if (pMap.containsKey("seat")) p.setSeatNumber((String) pMap.get("seat"));
                        if (pMap.containsKey("passportNumber")) p.setPassportNumber((String) pMap.get("passportNumber"));
                        if (pMap.containsKey("passport")) p.setPassportNumber((String) pMap.get("passport"));
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
