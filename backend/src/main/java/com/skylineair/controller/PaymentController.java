package com.skylineair.controller;

import com.skylineair.model.Flight;
import com.skylineair.model.HotelBooking;
import com.skylineair.model.Passenger;
import com.skylineair.model.Payment;
import com.skylineair.model.Reservation;
import com.skylineair.repository.FlightRepository;
import com.skylineair.repository.HotelBookingRepository;
import com.skylineair.repository.HotelRepository;
import com.skylineair.repository.PaymentRepository;
import com.skylineair.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;
    private final FlightRepository flightRepository;
    private final HotelBookingRepository hotelBookingRepository;
    private final HotelRepository hotelRepository;
    private final com.skylineair.service.OtpService otpService;
    private final com.skylineair.service.EmailService emailService;

    public PaymentController(PaymentRepository paymentRepository,
                             ReservationRepository reservationRepository,
                             FlightRepository flightRepository,
                             HotelBookingRepository hotelBookingRepository,
                             HotelRepository hotelRepository,
                             com.skylineair.service.OtpService otpService,
                             com.skylineair.service.EmailService emailService) {
        this.paymentRepository = paymentRepository;
        this.reservationRepository = reservationRepository;
        this.flightRepository = flightRepository;
        this.hotelBookingRepository = hotelBookingRepository;
        this.hotelRepository = hotelRepository;
        this.otpService = otpService;
        this.emailService = emailService;
    }

    private Map<String, Object> mapPaymentToResponse(Payment p) {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("paymentId", p.getPaymentId());
        map.put("id", p.getPaymentId());
        map.put("reservationId", p.getReservationId());
        map.put("transactionReference", p.getTransactionReference());
        map.put("transactionRef", p.getTransactionReference());
        map.put("paymentMethod", p.getPaymentMethod());
        map.put("amount", p.getAmount());
        map.put("totalAmount", p.getAmount());
        map.put("paidAmount", p.getAmount());
        map.put("paymentStatus", p.getPaymentStatus());
        map.put("status", p.getPaymentStatus());
        map.put("paymentTimestamp", p.getPaymentTimestamp() != null ? p.getPaymentTimestamp().toString() : LocalDateTime.now().toString());
        map.put("createdAt", p.getPaymentTimestamp() != null ? p.getPaymentTimestamp().toString() : LocalDateTime.now().toString());

        if (p.getReservationId() != null) {
            reservationRepository.findById(p.getReservationId()).ifPresent(res -> {
                map.put("pnrCode", res.getPnrCode());
                map.put("pnr", res.getPnrCode());
                map.put("userId", res.getUserId());
                map.put("userName", res.getUserName());
                map.put("userEmail", res.getUserEmail());
                map.put("flightId", res.getFlightId());
                map.put("flightNumber", res.getFlightNumber());
                map.put("origin", res.getOrigin());
                map.put("destination", res.getDestination());
                map.put("departureTime", res.getDepartureTime());
                map.put("cabinClass", res.getCabinClass());
                map.put("bookingStatus", res.getBookingStatus());
                map.put("hasLayover", res.getHasLayover());
                map.put("layoverCity", res.getLayoverCity());
                map.put("layoverAirport", res.getLayoverAirport());
                map.put("layoverDurationHours", res.getLayoverDurationHours());
                map.put("hotelBooked", res.getHotelBooked());
                map.put("hotelName", res.getHotelName());
                map.put("hotelPrice", res.getHotelPrice());
                map.put("passengers", res.getPassengers());
            });
        }
        return map;
    }

    @GetMapping
    public java.util.List<Map<String, Object>> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::mapPaymentToResponse)
                .toList();
    }

    @GetMapping("/transaction/{txnRef}")
    public ResponseEntity<Map<String, Object>> getPaymentByTransactionReference(@PathVariable String txnRef) {
        return paymentRepository.findByTransactionReference(txnRef)
                .map(this::mapPaymentToResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/reservation/{resId}")
    public ResponseEntity<Map<String, Object>> getPaymentByReservationId(@PathVariable Long resId) {
        return paymentRepository.findByReservationId(resId)
                .map(this::mapPaymentToResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public java.util.List<Map<String, Object>> getPaymentsByUserId(@PathVariable Long userId) {
        java.util.List<Reservation> userRes = reservationRepository.findByUserId(userId);
        java.util.List<Long> resIds = userRes.stream().map(Reservation::getReservationId).toList();
        if (resIds.isEmpty()) return java.util.Collections.emptyList();
        return paymentRepository.findAll().stream()
                .filter(p -> p.getReservationId() != null && resIds.contains(p.getReservationId()))
                .map(this::mapPaymentToResponse)
                .toList();
    }

    @GetMapping("/email/{email}")
    public java.util.List<Map<String, Object>> getPaymentsByEmail(@PathVariable String email) {
        java.util.List<Reservation> userRes = reservationRepository.findByUserEmail(email);
        java.util.List<Long> resIds = userRes.stream().map(Reservation::getReservationId).toList();
        if (resIds.isEmpty()) return java.util.Collections.emptyList();
        return paymentRepository.findAll().stream()
                .filter(p -> p.getReservationId() != null && resIds.contains(p.getReservationId()))
                .map(this::mapPaymentToResponse)
                .toList();
    }

    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody Payment payment) {
        if (payment.getAmount() == null || payment.getPaymentMethod() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Amount and payment method are required"));
        }

        if (payment.getTransactionReference() == null || payment.getTransactionReference().isEmpty()) {
            payment.setTransactionReference("TXN-" + System.currentTimeMillis() + (10 + new Random().nextInt(90)));
        }

        payment.setPaymentStatus("SUCCESS");
        payment.setPaymentTimestamp(LocalDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);

        // Update reservation status
        if (payment.getReservationId() != null) {
            Optional<Reservation> resOpt = reservationRepository.findById(payment.getReservationId());
            if (resOpt.isPresent()) {
                Reservation res = resOpt.get();
                res.setBookingStatus("CONFIRMED");
                res.setPaymentStatus("PAID");
                res.setPaymentMethod(payment.getPaymentMethod());
                res.setTransactionRef(payment.getTransactionReference());
                reservationRepository.save(res);

                // Update available seats on flight
                if (res.getFlightId() != null) {
                    flightRepository.findById(res.getFlightId()).ifPresent(flight -> {
                        int currentSeats = flight.getAvailableSeats() != null ? flight.getAvailableSeats() : 30;
                        int passCount = (res.getPassengers() != null && !res.getPassengers().isEmpty()) ? res.getPassengers().size() : 1;
                        flight.setAvailableSeats(Math.max(0, currentSeats - passCount));
                        flightRepository.save(flight);
                    });
                }

                // Guarantee HotelBooking record persistence for hotel stay
                if (Boolean.TRUE.equals(res.getHotelBooked()) || res.getHotelId() != null || (res.getHotelName() != null && !res.getHotelName().trim().isEmpty())) {
                    try {
                        List<HotelBooking> existingHb = hotelBookingRepository.findByPnrCode(res.getPnrCode());
                        if (existingHb.isEmpty()) {
                            HotelBooking hb = new HotelBooking();
                            hb.setReservationId(res.getReservationId());
                            hb.setPnrCode(res.getPnrCode());
                            hb.setUserId(res.getUserId());
                            hb.setGuestEmail(res.getUserEmail());

                            String passName = res.getUserName();
                            if (res.getPassengers() != null && !res.getPassengers().isEmpty()) {
                                Passenger p0 = res.getPassengers().get(0);
                                if (p0.getFirstName() != null && !p0.getFirstName().trim().isEmpty()) {
                                    passName = (p0.getFirstName() + " " + (p0.getLastName() != null ? p0.getLastName() : "")).trim();
                                }
                            }
                            hb.setPassengerName(passName != null && !passName.isBlank() ? passName : "Passenger");

                            hb.setHotelId(res.getHotelId());
                            hb.setHotelName(res.getHotelName());

                            if (hb.getHotelId() == null && hb.getHotelName() != null && !hb.getHotelName().isBlank()) {
                                hotelRepository.findByNameIgnoreCase(hb.getHotelName().trim()).ifPresent(h -> hb.setHotelId(h.getHotelId()));
                            }
                            if (hb.getHotelId() == null) {
                                hotelRepository.findAll().stream().findFirst().ifPresent(h -> {
                                    hb.setHotelId(h.getHotelId());
                                    if (hb.getHotelName() == null) hb.setHotelName(h.getName());
                                });
                            }

                            hb.setRoomType(res.getHotelRoomType() != null && !res.getHotelRoomType().isBlank() ? res.getHotelRoomType() : "Deluxe Transit Suite");
                            hb.setAmount(res.getHotelPrice() != null ? res.getHotelPrice() : BigDecimal.ZERO);
                            hb.setIsComplimentary(Boolean.TRUE.equals(res.getHasLayover()) && res.getLayoverDurationHours() != null && res.getLayoverDurationHours() >= 8);

                            String vCode = res.getHotelVoucherCode();
                            if (vCode == null || vCode.isBlank()) {
                                vCode = "HTV-" + (100000 + new Random().nextInt(900000));
                                res.setHotelVoucherCode(vCode);
                                reservationRepository.save(res);
                            }
                            hb.setVoucherCode(vCode);

                            LocalDate checkIn = res.getHotelCheckInDate();
                            if (checkIn == null) {
                                checkIn = LocalDate.now();
                                if (res.getDepartureTime() != null && !res.getDepartureTime().trim().isEmpty()) {
                                    try {
                                        checkIn = LocalDate.parse(res.getDepartureTime().split("T")[0]);
                                    } catch (Exception ignored) {}
                                }
                            }

                            int nights = (res.getHotelNights() != null && res.getHotelNights() > 0) ? res.getHotelNights() : 1;
                            LocalDate checkOut = res.getHotelCheckOutDate();
                            if (checkOut == null) {
                                checkOut = checkIn.plusDays(nights);
                            }

                            hb.setNumberOfNights(nights);
                            hb.setCheckInDate(checkIn);
                            hb.setCheckOutDate(checkOut);
                            hb.setBookingStatus("CONFIRMED");
                            hb.setCreatedTimestamp(LocalDateTime.now());

                            hotelBookingRepository.save(hb);
                        } else {
                            for (HotelBooking hb : existingHb) {
                                hb.setBookingStatus("CONFIRMED");
                                if (res.getHotelNights() != null && res.getHotelNights() > 0 && (hb.getNumberOfNights() == null || hb.getNumberOfNights() == 1)) {
                                    hb.setNumberOfNights(res.getHotelNights());
                                    if (hb.getCheckInDate() != null && (hb.getCheckOutDate() == null || hb.getCheckOutDate().equals(hb.getCheckInDate().plusDays(1)))) {
                                        hb.setCheckOutDate(hb.getCheckInDate().plusDays(res.getHotelNights()));
                                    }
                                }
                                hotelBookingRepository.save(hb);
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("[PaymentController] Guarantee HotelBooking notice: " + e.getMessage());
                    }
                }
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(savedPayment);
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendPaymentOtp(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "A valid email address is required to receive OTP verification code."
            ));
        }

        String passengerName = (String) payload.get("passengerName");
        String pnr = (String) payload.get("pnr");
        Double amount = null;
        if (payload.get("amount") != null) {
            try {
                amount = Double.valueOf(payload.get("amount").toString());
            } catch (Exception ignored) {}
        }

        String otpCode = otpService.generateOtp(email);
        boolean emailSent = emailService.sendOtpEmail(email, passengerName, otpCode, amount, pnr);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", emailSent ? "Verification code sent to " + email : "OTP generated. (Delivery logged in server console)",
                "email", email,
                "emailDelivered", emailSent,
                "otpPreview", otpCode // provides helpful debug/demo preview
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyPaymentOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otpCode = payload.get("otpCode");

        if (email == null || otpCode == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email and 6-digit OTP code are required."
            ));
        }

        boolean isValid = otpService.verifyOtp(email, otpCode);
        if (isValid) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "OTP verified successfully. Payment authorized."
            ));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "Invalid or expired OTP code. Please check your email or request a new code."
            ));
        }
    }
}
