package com.skylineair.controller;

import com.skylineair.model.Hotel;
import com.skylineair.model.HotelBooking;
import com.skylineair.repository.HotelBookingRepository;
import com.skylineair.repository.HotelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hotels")
@CrossOrigin
public class HotelController {

    private final HotelRepository hotelRepository;
    private final HotelBookingRepository hotelBookingRepository;

    public HotelController(HotelRepository hotelRepository, HotelBookingRepository hotelBookingRepository) {
        this.hotelRepository = hotelRepository;
        this.hotelBookingRepository = hotelBookingRepository;
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
        if (booking.getBookingStatus() == null) {
            booking.setBookingStatus("CONFIRMED");
        }
        if (booking.getVoucherCode() == null || booking.getVoucherCode().isBlank()) {
            booking.setVoucherCode("HTV-" + (100000 + (int) (Math.random() * 900000)));
        }

        HotelBooking savedBooking = hotelBookingRepository.save(booking);

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

    @PutMapping("/bookings/{id}/status")
    public ResponseEntity<?> updateBookingStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String newStatus = request.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "status is required"));
        }
        return hotelBookingRepository.findById(id)
                .map(b -> {
                    b.setBookingStatus(newStatus.trim().toUpperCase());
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
