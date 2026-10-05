package com.skylineair.controller;

import com.skylineair.model.Hotel;
import com.skylineair.model.HotelBooking;
import com.skylineair.repository.HotelBookingRepository;
import com.skylineair.repository.HotelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.skylineair.model.Reservation;
import com.skylineair.patterns.hotel.HotelPackageFactory;
import com.skylineair.patterns.hotel.HotelStayPackage;
import com.skylineair.repository.ReservationRepository;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/hotels")
@CrossOrigin
public class HotelController {

    private final HotelRepository hotelRepository;
    private final HotelBookingRepository hotelBookingRepository;
    private final ReservationRepository reservationRepository;

    public HotelController(HotelRepository hotelRepository,
                           HotelBookingRepository hotelBookingRepository,
                           ReservationRepository reservationRepository) {
        this.hotelRepository = hotelRepository;
        this.hotelBookingRepository = hotelBookingRepository;
        this.reservationRepository = reservationRepository;
    }

    @GetMapping
    public List<Hotel> getAllHotels() {
        return hotelRepository.findAll();
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<?> getHotelById(@PathVariable Long id) {
        return hotelRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/airport/{code}")
    public List<Hotel> getHotelsByAirport(@PathVariable String code) {
        return hotelRepository.findByAirportCodeIgnoreCase(code);
    }

    @GetMapping("/country/{country}")
    public List<Hotel> getHotelsByCountry(@PathVariable String country) {
        return hotelRepository.findByCountryIgnoreCase(country);
    }

    @GetMapping("/city/{city}")
    public List<Hotel> getHotelsByCity(@PathVariable String city) {
        return hotelRepository.findByCityIgnoreCase(city);
    }

    @PostMapping
    public ResponseEntity<?> createHotel(@RequestBody Hotel hotel) {
        String error = validateHotel(hotel, true);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("message", error));
        }

        String trimmedName = hotel.getName().trim();
        if (hotelRepository.existsByNameIgnoreCase(trimmedName)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "A hotel with the name '" + trimmedName + "' already exists in the database. Please use a unique hotel name."));
        }

        applyDefaults(hotel);
        Hotel saved = hotelRepository.save(hotel);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHotel(@PathVariable Long id, @RequestBody Hotel updated) {
        String error = validateHotel(updated, false);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("message", error));
        }

        if (updated.getName() != null) {
            String trimmedName = updated.getName().trim();
            if (hotelRepository.existsByNameIgnoreCaseAndHotelIdNot(trimmedName, id)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Another hotel with the name '" + trimmedName + "' already exists in the database. Please use a unique hotel name."));
            }
        }

        return hotelRepository.findById(id)
                .map(existing -> {
                    if (updated.getName() != null) existing.setName(updated.getName().trim());
                    if (updated.getCity() != null) existing.setCity(updated.getCity().trim());
                    if (updated.getCountry() != null) existing.setCountry(updated.getCountry().trim());
                    if (updated.getAirportCode() != null) {
                        existing.setAirportCode(updated.getAirportCode().trim().toUpperCase());
                    }
                    if (updated.getStarRating() != null) existing.setStarRating(updated.getStarRating());
                    if (updated.getPricePerNight() != null) existing.setPricePerNight(updated.getPricePerNight());
                    if (updated.getComplimentaryThresholdHours() != null) {
                        existing.setComplimentaryThresholdHours(updated.getComplimentaryThresholdHours());
                    }
                    if (updated.getAvailableRooms() != null) existing.setAvailableRooms(updated.getAvailableRooms());
                    if (updated.getDistanceKm() != null) existing.setDistanceKm(updated.getDistanceKm());
                    if (updated.getShuttleService() != null) existing.setShuttleService(updated.getShuttleService());
                    if (updated.getImage() != null) existing.setImage(updated.getImage().trim());
                    if (updated.getAmenities() != null) existing.setAmenities(updated.getAmenities().trim());
                    return ResponseEntity.ok(hotelRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHotel(@PathVariable Long id) {
        if (!hotelRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        if (hotelBookingRepository.existsByHotelId(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Cannot delete: hotel has existing bookings."));
        }
        hotelRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Hotel deleted successfully", "id", id));
    }

    @GetMapping("/bookings")
    public List<HotelBooking> getAllBookings() {
        return hotelBookingRepository.findAll();
    }

    @GetMapping("/bookings/pnr/{pnrCode}")
    public List<HotelBooking> getBookingsByPnr(@PathVariable String pnrCode) {
        return hotelBookingRepository.findByPnrCode(pnrCode);
    }

    @GetMapping("/bookings/user/{userId}")
    public List<HotelBooking> getBookingsByUser(@PathVariable Long userId) {
        return hotelBookingRepository.findByUserId(userId);
    }

    @PostMapping("/book")
    public ResponseEntity<?> bookHotel(@RequestBody HotelBooking booking) {
        booking.setCreatedTimestamp(LocalDateTime.now());
        if (booking.getBookingStatus() == null || booking.getBookingStatus().isBlank()) {
            booking.setBookingStatus("CONFIRMED");
        }
        if (booking.getVoucherCode() == null || booking.getVoucherCode().isBlank()) {
            booking.setVoucherCode("HTV-" + (100000 + (int) (Math.random() * 900000)));
        }
        if (booking.getCheckInDate() == null) {
            booking.setCheckInDate(LocalDate.now());
        }
        int nights = (booking.getNumberOfNights() != null && booking.getNumberOfNights() > 0) ? booking.getNumberOfNights() : 1;
        if (booking.getCheckOutDate() == null) {
            booking.setCheckOutDate(booking.getCheckInDate().plusDays(nights));
        } else {
            long diff = java.time.temporal.ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate());
            if (diff > 0) {
                nights = (int) diff;
                booking.setNumberOfNights(nights);
            }
        }
        booking.setNumberOfNights(nights);

        // Resolve hotel details
        Hotel targetHotel = null;
        if (booking.getHotelId() == null && booking.getHotelName() != null && !booking.getHotelName().isBlank()) {
            Optional<Hotel> opt = hotelRepository.findByNameIgnoreCase(booking.getHotelName().trim());
            if (opt.isPresent()) {
                targetHotel = opt.get();
                booking.setHotelId(targetHotel.getHotelId());
            }
        } else if (booking.getHotelId() != null) {
            targetHotel = hotelRepository.findById(booking.getHotelId()).orElse(null);
        }
        if (booking.getHotelId() == null) {
            targetHotel = hotelRepository.findAll().stream().findFirst().orElse(null);
            if (targetHotel != null) {
                booking.setHotelId(targetHotel.getHotelId());
                if (booking.getHotelName() == null) booking.setHotelName(targetHotel.getName());
            }
        }

        // Validate Layover duration rule: if Layover >= 8 hours, 100% complimentary stay ($0.00)
        Optional<Reservation> linkedReservationOpt = Optional.empty();
        if (booking.getReservationId() != null) {
            linkedReservationOpt = reservationRepository.findById(booking.getReservationId());
        }
        if (linkedReservationOpt.isEmpty() && booking.getPnrCode() != null && !booking.getPnrCode().isBlank()) {
            linkedReservationOpt = reservationRepository.findByPnrCode(booking.getPnrCode().trim());
        }

        boolean isComplimentary = Boolean.TRUE.equals(booking.getIsComplimentary());
        if (linkedReservationOpt.isPresent()) {
            Reservation res = linkedReservationOpt.get();
            double layoverHours = res.getLayoverDurationHours() != null ? res.getLayoverDurationHours() : 0.0;
            int threshold = (targetHotel != null && targetHotel.getComplimentaryThresholdHours() != null)
                    ? targetHotel.getComplimentaryThresholdHours()
                    : 8;

            if (Boolean.TRUE.equals(res.getHasLayover()) && layoverHours >= threshold) {
                isComplimentary = true;
            }
        }

        if (isComplimentary) {
            booking.setIsComplimentary(true);
            booking.setAmount(BigDecimal.ZERO);
            HotelStayPackage stayPackage = HotelPackageFactory.createPackage(true, 8.0, targetHotel);
            if (booking.getVoucherCode() == null || booking.getVoucherCode().isBlank() || booking.getVoucherCode().startsWith("HTV-1") || booking.getVoucherCode().startsWith("HTV-9")) {
                booking.setVoucherCode(stayPackage.generateVoucherReference(booking.getPnrCode()));
            }
        }

        // If booking already exists for this PNR, update it
        if (booking.getPnrCode() != null && !booking.getPnrCode().isBlank()) {
            List<HotelBooking> existing = hotelBookingRepository.findByPnrCode(booking.getPnrCode());
            if (!existing.isEmpty()) {
                HotelBooking b = existing.get(0);
                if (booking.getHotelId() != null) b.setHotelId(booking.getHotelId());
                if (booking.getHotelName() != null) b.setHotelName(booking.getHotelName());
                if (booking.getUserId() != null) b.setUserId(booking.getUserId());
                if (booking.getGuestEmail() != null) b.setGuestEmail(booking.getGuestEmail());
                if (booking.getPassengerName() != null) b.setPassengerName(booking.getPassengerName());
                if (booking.getRoomType() != null) b.setRoomType(booking.getRoomType());
                b.setAmount(isComplimentary ? BigDecimal.ZERO : booking.getAmount());
                if (booking.getNumberOfNights() != null) b.setNumberOfNights(booking.getNumberOfNights());
                if (booking.getCheckInDate() != null) b.setCheckInDate(booking.getCheckInDate());
                if (booking.getCheckOutDate() != null) b.setCheckOutDate(booking.getCheckOutDate());
                b.setIsComplimentary(isComplimentary);
                if (booking.getVoucherCode() != null) b.setVoucherCode(booking.getVoucherCode());
                b.setBookingStatus(booking.getBookingStatus() != null ? booking.getBookingStatus() : "CONFIRMED");
                HotelBooking updated = hotelBookingRepository.save(b);

                // Keep linked reservation synchronized
                linkedReservationOpt.ifPresent(res -> {
                    res.setHotelBooked(true);
                    res.setHotelId(updated.getHotelId());
                    res.setHotelName(updated.getHotelName());
                    res.setHotelPrice(updated.getAmount());
                    res.setHotelVoucherCode(updated.getVoucherCode());
                    reservationRepository.save(res);
                });

                return ResponseEntity.ok(updated);
            }
        }

        HotelBooking savedBooking = hotelBookingRepository.save(booking);

        // Keep linked reservation synchronized
        linkedReservationOpt.ifPresent(res -> {
            res.setHotelBooked(true);
            res.setHotelId(savedBooking.getHotelId());
            res.setHotelName(savedBooking.getHotelName());
            res.setHotelPrice(savedBooking.getAmount());
            res.setHotelVoucherCode(savedBooking.getVoucherCode());
            reservationRepository.save(res);
        });

        if (booking.getHotelId() != null) {
            hotelRepository.findById(booking.getHotelId()).ifPresent(hotel -> {
                if (hotel.getAvailableRooms() != null && hotel.getAvailableRooms() > 0) {
                    hotel.setAvailableRooms(hotel.getAvailableRooms() - 1);
                    hotelRepository.save(hotel);
                }
            });
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(savedBooking);
    }

    @PutMapping("/bookings/{id}")
    public ResponseEntity<?> updateBooking(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return hotelBookingRepository.findById(id)
                .map(b -> {
                    if (request.containsKey("bookingStatus") && request.get("bookingStatus") != null) {
                        b.setBookingStatus(request.get("bookingStatus").toString().trim().toUpperCase());
                    }
                    if (request.containsKey("roomType") && request.get("roomType") != null) {
                        b.setRoomType(request.get("roomType").toString().trim());
                    }
                    if (request.containsKey("passengerName") && request.get("passengerName") != null) {
                        b.setPassengerName(request.get("passengerName").toString().trim());
                    }
                    if (request.containsKey("guestEmail") && request.get("guestEmail") != null) {
                        b.setGuestEmail(request.get("guestEmail").toString().trim());
                    }
                    if (request.containsKey("amount") && request.get("amount") != null) {
                        try {
                            b.setAmount(new BigDecimal(request.get("amount").toString()));
                        } catch (Exception ignored) {}
                    }
                    if (request.containsKey("checkInDate") && request.get("checkInDate") != null) {
                        try {
                            b.setCheckInDate(LocalDate.parse(request.get("checkInDate").toString().trim()));
                        } catch (Exception ignored) {}
                    }
                    if (request.containsKey("checkOutDate") && request.get("checkOutDate") != null) {
                        try {
                            b.setCheckOutDate(LocalDate.parse(request.get("checkOutDate").toString().trim()));
                        } catch (Exception ignored) {}
                    }

                    // Auto-sync dates based on lifecycle state if still null
                    if ("CHECKED_IN".equalsIgnoreCase(b.getBookingStatus()) && b.getCheckInDate() == null) {
                        b.setCheckInDate(LocalDate.now());
                    } else if (("COMPLETED".equalsIgnoreCase(b.getBookingStatus()) || "CHECKED_OUT".equalsIgnoreCase(b.getBookingStatus())) && b.getCheckOutDate() == null) {
                        if (b.getCheckInDate() == null) {
                            b.setCheckInDate(LocalDate.now().minusDays(1));
                        }
                        b.setCheckOutDate(LocalDate.now());
                    }

                    return ResponseEntity.ok(hotelBookingRepository.save(b));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/bookings/{id}/status")
    public ResponseEntity<?> updateBookingStatus(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        String newStatus = request.get("status") != null
                ? request.get("status").toString()
                : (request.get("bookingStatus") != null ? request.get("bookingStatus").toString() : null);
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "status is required"));
        }
        return hotelBookingRepository.findById(id)
                .map(b -> {
                    String cleanStatus = newStatus.trim().toUpperCase();
                    b.setBookingStatus(cleanStatus);

                    if ("CHECKED_IN".equalsIgnoreCase(cleanStatus)) {
                        if (b.getCheckInDate() == null) {
                            b.setCheckInDate(LocalDate.now());
                        }
                    } else if ("COMPLETED".equalsIgnoreCase(cleanStatus) || "CHECKED_OUT".equalsIgnoreCase(cleanStatus)) {
                        if (b.getCheckInDate() == null) {
                            b.setCheckInDate(LocalDate.now().minusDays(1));
                        }
                        if (b.getCheckOutDate() == null) {
                            b.setCheckOutDate(LocalDate.now());
                        }
                    }

                    if (request.get("checkInDate") != null) {
                        try {
                            b.setCheckInDate(LocalDate.parse(request.get("checkInDate").toString().trim()));
                        } catch (Exception ignored) {}
                    }
                    if (request.get("checkOutDate") != null) {
                        try {
                            b.setCheckOutDate(LocalDate.parse(request.get("checkOutDate").toString().trim()));
                        } catch (Exception ignored) {}
                    }

                    return ResponseEntity.ok(hotelBookingRepository.save(b));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long id) {
        if (!hotelBookingRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        hotelBookingRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Hotel booking deleted successfully", "id", id));
    }

    private void applyDefaults(Hotel hotel) {
        hotel.setName(hotel.getName().trim());
        hotel.setCity(hotel.getCity().trim());
        hotel.setCountry(hotel.getCountry().trim());
        hotel.setAirportCode(hotel.getAirportCode().trim().toUpperCase());
        if (hotel.getStarRating() == null) hotel.setStarRating(4);
        if (hotel.getComplimentaryThresholdHours() == null) hotel.setComplimentaryThresholdHours(8);
        if (hotel.getAvailableRooms() == null) hotel.setAvailableRooms(0);
        if (hotel.getDistanceKm() == null) hotel.setDistanceKm(1.0);
        if (hotel.getShuttleService() == null) hotel.setShuttleService(true);
        if (hotel.getImage() != null) hotel.setImage(hotel.getImage().trim());
        if (hotel.getAmenities() != null) hotel.setAmenities(hotel.getAmenities().trim());
    }

    private String validateHotel(Hotel hotel, boolean creating) {
        if (hotel == null) {
            return "Hotel details are required";
        }

        String name = hotel.getName();
        if (creating || name != null) {
            if (isBlank(name) || name.trim().length() < 2) {
                return "Hotel name is required (at least 2 characters)";
            }
        }

        String city = hotel.getCity();
        if (creating || city != null) {
            if (isBlank(city) || city.trim().length() < 2) {
                return "City is required (at least 2 characters)";
            }
        }

        String country = hotel.getCountry();
        if (creating || country != null) {
            if (isBlank(country) || country.trim().length() < 2) {
                return "Country is required (at least 2 characters)";
            }
        }

        String airportCode = hotel.getAirportCode();
        if (creating || airportCode != null) {
            if (isBlank(airportCode) || !airportCode.trim().toUpperCase().matches("^[A-Z]{3}$")) {
                return "Airport code must be exactly 3 letters (e.g. DXB, CMB)";
            }
        }

        if (hotel.getStarRating() != null && (hotel.getStarRating() < 1 || hotel.getStarRating() > 5)) {
            return "Star rating must be between 1 and 5";
        }

        if (creating && hotel.getPricePerNight() == null) {
            return "Price per night is required and must be greater than 0";
        }
        if (hotel.getPricePerNight() != null && hotel.getPricePerNight().compareTo(BigDecimal.ZERO) <= 0) {
            return "Price per night must be greater than 0";
        }

        if (hotel.getAvailableRooms() != null && hotel.getAvailableRooms() < 0) {
            return "Available rooms cannot be negative";
        }

        if (hotel.getDistanceKm() != null && hotel.getDistanceKm() < 0) {
            return "Distance must be 0 or greater";
        }

        if (hotel.getComplimentaryThresholdHours() != null) {
            int hours = hotel.getComplimentaryThresholdHours();
            if (hours < 1 || hours > 24) {
                return "Complimentary threshold hours must be between 1 and 24";
            }
        }

        if (hotel.getImage() != null && !hotel.getImage().isBlank()) {
            String image = hotel.getImage().trim();
            if (!image.startsWith("http://") && !image.startsWith("https://")) {
                return "Image URL must start with http:// or https://";
            }
        }

        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
